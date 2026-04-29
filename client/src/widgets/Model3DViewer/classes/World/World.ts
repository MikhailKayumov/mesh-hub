import {
  AmbientLight,
  AxesHelper,
  Box3,
  Box3Helper,
  Color,
  DirectionalLight,
  Fog,
  FogExp2,
  GridHelper,
  type Light,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  type MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  PointLight,
  Scene,
  ShadowMaterial,
  SphereGeometry,
  SpotLight,
  TextureLoader,
  Vector3,
} from 'three';
import type { MaterialOverrideResponseDto, SceneLightResponseDto } from '@/app/api/dto.ts';
import { Destroyer } from '../Destroyer';
import { buildAmbientLight, buildDirectionalLight } from '../Lights';
import {
  type FogConfig,
  type WorldEventListener,
  type WorldObject3D,
  type WorldObjects3D,
  type WorldSpawnOptions,
} from '../types';
import { isLight, isObject3D } from '../utils';
import { DEFAULT_LAYER, type WorldEvent, WorldEventNames } from './constants.ts';
import { WorldHelpers } from './WorldHelpers.ts';

// setting up axis
Object3D.DEFAULT_UP = new Vector3(0, 1, 0);

export class World extends EventTarget {
  public readonly scene: Scene;
  public readonly models: Object3D[] = [];
  public readonly lights: Light[] = [];
  public readonly helpers: WorldHelpers = new WorldHelpers(); //
  private markers: Map<string, Mesh> = new Map();

  public constructor(scene?: Scene) {
    super();

    this.scene = scene ?? new Scene();
  }

  public add(object: Object3D, layer = DEFAULT_LAYER): void {
    object.traverse((o) => {
      o.layers.set(layer);
    });
    this.scene.add(object);
  }

  public async spawn(object: WorldObject3D | WorldObjects3D, options?: WorldSpawnOptions): Promise<void> {
    if (!object) return;

    if (Array.isArray(object)) {
      await Promise.all(object.map((o) => this.spawn(o, options)));

      const event = new CustomEvent<Scene>(WorldEventNames.WorldSceneChange, { detail: this.scene });
      !options?.silent && this.dispatchEvent(event);

      return;
    }

    if (!isObject3D(object)) {
      object.then((o) => this.spawn(o, options));
      return;
    }

    if (isLight(object)) this.lights.push(object);

    this.add(object, options?.layer);

    const event = new CustomEvent<Scene>(WorldEventNames.WorldSceneChange, { detail: this.scene });
    !options?.silent && this.dispatchEvent(event);
  }

  // events
  public on(name: WorldEvent, listener: WorldEventListener): () => void {
    this.addEventListener(name, listener as EventListenerOrEventListenerObject);

    return () => {
      this.removeEventListener(name, listener as EventListenerOrEventListenerObject);
    };
  }

  public off(name: WorldEvent, listener: WorldEventListener): void {
    this.removeEventListener(name, listener as EventListenerOrEventListenerObject);
  }

  // helpers
  public spawnAxisHelper(size = 1): Promise<void> {
    if (this.helpers.axis) {
      Destroyer.destroyObject(this.helpers.axis);
      this.scene.remove(this.helpers.axis);
    }

    this.helpers.axis = new AxesHelper(size);
    this.helpers.axis.name = 'Axes helper';
    return this.spawn(this.helpers.axis, { layer: 10 });
  }

  public spawnGridHelper(size = 30, division = 30, color1 = '#dee2e6', color2 = '#e9ecef', layer = 10): Promise<void> {
    if (this.helpers.grid) {
      Destroyer.destroyObject(this.helpers.grid);
      this.scene.remove(this.helpers.grid);
    }

    this.helpers.grid = new GridHelper(size, division, color1, color2);
    this.helpers.grid.name = 'Grid helper';
    return this.spawn(this.helpers.grid, { layer });
  }

  public spawnSceneBoundingBoxHelper(bb: Box3, color = '#dee2e6', layer = 11) {
    if (this.helpers.sceneBoundingBox) {
      Destroyer.destroyObject(this.helpers.sceneBoundingBox);
      this.scene.remove(this.helpers.sceneBoundingBox);
    }

    this.helpers.sceneBoundingBox = new Box3Helper(bb, color);
    this.helpers.sceneBoundingBox.layers.set(layer);
    this.helpers.sceneBoundingBox.name = 'Scene bounding box';

    return this.spawn(this.helpers.sceneBoundingBox, { layer });
  }

  public spawnGroundHelper(
    w = 10,
    h = 10,
    layer = 9,
    options = {
      segments: { w: 1, h: 1 },
      color: new Color(0),
    },
  ): Promise<void> {
    if (this.helpers.ground) {
      Destroyer.destroyObject(this.helpers.ground);
      this.scene.remove(this.helpers.ground);
    }

    const geometry = new PlaneGeometry(w, h, options.segments.w ?? 1, options.segments.h ?? 1);
    const material = new ShadowMaterial({ color: options.color, opacity: 0.1 });

    this.helpers.ground = new Mesh(geometry, material);
    this.helpers.ground.name = 'Ground';
    this.helpers.ground.receiveShadow = true;
    this.helpers.ground.rotateX(MathUtils.degToRad(-90));

    return this.spawn(this.helpers.ground, { layer });
  }

  // helpers end

  public async prepare(sceneBB?: Box3) {
    const min = sceneBB?.min ?? new Vector3(-1, -1, -1);
    const max = sceneBB?.max ?? new Vector3(1, 1, 1);
    const length = max.manhattanDistanceTo(min);

    const center = new Vector3();
    sceneBB?.getCenter(center);

    const [dl1, dlh1] = buildDirectionalLight({
      color: 'rgb(152,214,255)',
      at: new Vector3(min.x - 0.3 * min.x, center.y - 0.7 * center.y, min.z * 13),
      to: new Vector3(0, center.y, 0),
      intensity: 2.4,
      name: 'Directional light 1',
    });

    const [dl2, dlh2] = buildDirectionalLight({
      color: 'rgb(255,236,204)',
      at: new Vector3(Math.min(min.x - 0.3 * min.x, -3), max.y + 0.46 * max.y, Math.min(Math.max(max.z * 2, 3), 5)),
      intensity: 28,
      name: 'Directional light 2',
      shadow: {
        size: 1024,
        bias: -0.0005,
        near: 0.1,
        far: Math.max(length * 2, 100),
        top: length / 2,
        bottom: -length / 2,
        right: length / 2,
        left: -length / 2,
      },
    });

    const [dl3, dlh3] = buildDirectionalLight({
      color: 'rgb(255, 204, 51)',
      at: new Vector3(min.x + 0.1 * min.x, center.y - 3.5 * center.y, center.z),
      intensity: 1.6,
      name: 'Directional light 3',
    });

    const al = buildAmbientLight({ intensity: 0.2 });
    al.name = 'Ambient light';

    await Promise.all([
      this.spawn(
        [
          al, //
          dl1,
          dl2,
          dl3,
        ],
        { layer: 1 },
      ), //
      this.spawn([dlh1, dlh2, dlh3], { layer: 13 }),
    ]);
  }

  public destroy(): void {
    this.scene.traverse(Destroyer.destroyObject);
    this.scene.clear();
    this.scene.environment?.dispose();
    this.scene.overrideMaterial?.dispose();
  }

  // markers
  public spawnMarker(id: string, pos: Vector3): void {
    this.removeMarker(id);
    const geo = new SphereGeometry(0.02, 8, 8);
    const mat = new MeshBasicMaterial({ color: 0xffaa00 });
    const mesh = new Mesh(geo, mat);
    mesh.position.copy(pos);
    mesh.userData.markerId = id;
    this.scene.add(mesh);
    this.markers.set(id, mesh);
  }

  public removeMarker(id: string): void {
    const mesh = this.markers.get(id);
    if (!mesh) return;
    this.scene.remove(mesh);
    mesh.geometry.dispose();
    (mesh.material as MeshBasicMaterial).dispose();
    this.markers.delete(id);
  }

  public clearMarkers(): void {
    for (const id of [...this.markers.keys()]) {
      this.removeMarker(id);
    }
  }

  public highlightMarker(id: string | null): void {
    this.markers.forEach((mesh, markerId) => {
      (mesh.material as MeshBasicMaterial).color.set(markerId === id ? 0xff5500 : 0xffaa00);
    });
  }

  // scene management
  public clearScene(): void {
    const toRemove: Object3D[] = [];
    this.scene.traverse((obj) => {
      if (obj.userData.isSceneObject || obj.userData.isLight || obj.userData.isHighlight) {
        toRemove.push(obj);
      }
    });
    for (const obj of toRemove) {
      Destroyer.destroyObject(obj);
      this.scene.remove(obj);
    }
    // clear tracked lights array
    this.lights.length = 0;
  }

  public setAmbientLight(intensity: number): void {
    this.scene.traverse((obj) => {
      if (obj instanceof AmbientLight) {
        obj.intensity = intensity;
      }
    });
  }

  public addLight(dto: SceneLightResponseDto): Light {
    let light: Light;
    if (dto.type === 'directional') {
      light = new DirectionalLight(dto.color, dto.intensity);
    } else if (dto.type === 'spot') {
      light = new SpotLight(dto.color, dto.intensity);
    } else {
      light = new PointLight(dto.color, dto.intensity);
    }
    light.position.set(dto.posX, dto.posY, dto.posZ);
    light.castShadow = dto.castShadow;
    light.userData.isLight = true;
    light.userData.lightId = dto.id;
    this.scene.add(light);
    this.lights.push(light);
    return light;
  }

  public async loadHdri(url: string): Promise<void> {
    const { RGBELoader } = await import('three/examples/jsm/loaders/RGBELoader.js');
    const { EquirectangularReflectionMapping } = await import('three');
    const loader = new RGBELoader();
    const texture = await loader.loadAsync(url);
    texture.mapping = EquirectangularReflectionMapping;
    this.scene.environment = texture;
    this.scene.background = texture;
  }

  public setBackgroundColor(hex: string): void {
    this.scene.background = new Color(hex);
  }

  public setFog(config: FogConfig): void {
    if (!config.enabled) {
      this.scene.fog = null;
      return;
    }
    if (config.type === 'exp2') {
      this.scene.fog = new FogExp2(config.color, config.density ?? 0.01);
    } else {
      this.scene.fog = new Fog(config.color, config.near ?? 10, config.far ?? 100);
    }
  }

  public syncLights(lights: SceneLightResponseDto[]): void {
    // remove Three.js lights that are no longer in the DTO list
    const incomingIds = new Set(lights.map((l) => l.id));
    const toRemove: Light[] = [];
    this.scene.traverse((obj) => {
      if (obj.userData.isLight && obj.userData.lightId && !incomingIds.has(obj.userData.lightId as string)) {
        toRemove.push(obj as Light);
      }
    });
    for (const light of toRemove) {
      this.scene.remove(light);
      const idx = this.lights.indexOf(light);
      if (idx !== -1) this.lights.splice(idx, 1);
    }

    // add or update
    for (const dto of lights) {
      let existing: Light | undefined;
      this.scene.traverse((obj) => {
        if (obj.userData.isLight && obj.userData.lightId === dto.id) {
          existing = obj as Light;
        }
      });

      if (existing) {
        existing.color.set(dto.color);
        existing.intensity = dto.intensity;
        existing.position.set(dto.posX, dto.posY, dto.posZ);
        existing.castShadow = dto.castShadow;
      } else {
        this.addLight(dto);
      }
    }
  }

  public highlightObject(object: Object3D): void {
    const box = new Box3Helper(new Box3().setFromObject(object), 0xff9900);
    box.userData.isHighlight = true;
    this.scene.add(box);
  }

  public clearHighlight(): void {
    const toRemove: Object3D[] = [];
    this.scene.traverse((obj) => {
      if (obj.userData.isHighlight) toRemove.push(obj);
    });
    for (const obj of toRemove) {
      if (obj instanceof Box3Helper) {
        obj.geometry.dispose();
        (obj.material as MeshBasicMaterial).dispose();
      }
      this.scene.remove(obj);
    }
  }

  public applyMaterialOverrides(overrides: MaterialOverrideResponseDto[]): void {
    const loader = new TextureLoader();
    this.scene.traverse((obj) => {
      if (!(obj instanceof Mesh)) return;
      const override = overrides.find((o) => o.meshName === obj.name);
      if (!override) return;

      // Preserve the GLTF-supplied material on first apply, dispose previous clones thereafter
      const originalKey = '__originalMaterial';
      if (!obj.userData[originalKey]) {
        obj.userData[originalKey] = obj.material;
      } else {
        const prev = obj.material as MeshStandardMaterial;
        prev.map?.dispose();
        prev.normalMap?.dispose();
        prev.roughnessMap?.dispose();
        prev.metalnessMap?.dispose();
        prev.emissiveMap?.dispose();
        prev.aoMap?.dispose();
        prev.dispose();
      }

      const mat = (obj.userData[originalKey] as MeshStandardMaterial).clone() as MeshStandardMaterial;
      obj.material = mat;

      if (override.colorHex) mat.color.set(override.colorHex);
      if (override.metalness !== undefined && override.metalness !== null) mat.metalness = override.metalness;
      if (override.roughness !== undefined && override.roughness !== null) mat.roughness = override.roughness;
      if (override.emissiveHex) mat.emissive.set(override.emissiveHex);
      if (override.emissiveIntensity !== undefined && override.emissiveIntensity !== null)
        mat.emissiveIntensity = override.emissiveIntensity;
      if (override.opacity !== undefined && override.opacity !== null) {
        mat.opacity = override.opacity;
        mat.transparent = override.opacity < 1;
      }
      mat.wireframe = override.wireframe;

      if (override.textureMapUrl)
        mat.map = loader.load(override.textureMapUrl, () => {
          mat.needsUpdate = true;
        });
      if (override.normalMapUrl)
        mat.normalMap = loader.load(override.normalMapUrl, () => {
          mat.needsUpdate = true;
        });
      if (override.roughnessMapUrl)
        mat.roughnessMap = loader.load(override.roughnessMapUrl, () => {
          mat.needsUpdate = true;
        });
      if (override.metalnessMapUrl)
        mat.metalnessMap = loader.load(override.metalnessMapUrl, () => {
          mat.needsUpdate = true;
        });
      if (override.emissiveMapUrl)
        mat.emissiveMap = loader.load(override.emissiveMapUrl, () => {
          mat.needsUpdate = true;
        });
      // aoMap needs a uv2 attribute on the geometry — backfill from uv if missing
      if (override.aoMapUrl) {
        if (!obj.geometry.attributes.uv2 && obj.geometry.attributes.uv) {
          obj.geometry.setAttribute('uv2', obj.geometry.attributes.uv);
        }
        if (obj.geometry.attributes.uv2) {
          mat.aoMap = loader.load(override.aoMapUrl, () => {
            mat.needsUpdate = true;
          });
        } else {
          console.warn(`aoMap skipped for mesh "${obj.name}": no UV channel`);
        }
      }

      mat.needsUpdate = true;
    });
  }
}
