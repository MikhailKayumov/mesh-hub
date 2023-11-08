import {
  AmbientLight,
  AxesHelper,
  GridHelper,
  MathUtils,
  Object3D,
  Scene,
  SpotLight,
  SpotLightHelper,
  Vector3,
} from 'three';
import { PromiseWorldObject3D, WorldLights, WorldObject3D, WorldSpotLight } from './types/world';

export class World extends Scene {
  public readonly lights: WorldLights = {
    ambient: null,
    spot: [],
  };

  public async spawn(object: WorldObject3D[] | WorldObject3D) {
    if (Array.isArray(object)) {
      object.forEach(this.spawn, this);
    } else {
      if (object instanceof Object3D) {
        this.add(object);
      } else {
        await this.spawnAsync(object);
      }
    }
  }

  public async spawnAsync(object: PromiseWorldObject3D[] | PromiseWorldObject3D) {
    if (Array.isArray(object)) {
      await Promise.all(object).then((objects) => {
        objects.forEach((o) => this.spawn(o));
      });
    } else {
      object.then((o) => this.spawn(o));
    }
  }

  public async spawnAmbientLight(intensity = 0.2) {
    if (this.lights.ambient) {
      console.log("change ambient light's intensity");
      this.lights.ambient.intensity = intensity;
      return;
    }

    this.lights.ambient = new AmbientLight(0xffffff, intensity);

    return this.spawn(this.lights.ambient);
  }

  public async spawnSpotLight(
    power = 18.75,
    distance = 100,
    penumbra = 0,
    angel = 45,
    at: Vector3 = new Vector3(0, 0, 50),
    to: Vector3 = new Vector3(0, 0, 0),
    helper = false,
  ) {
    const spotLight = new SpotLight(0xffffff);

    spotLight.power = power * 60; // 	Fluorescent / LED (watts), 1 watt === 60 lumens
    spotLight.distance = distance;
    spotLight.penumbra = penumbra;
    spotLight.angle = MathUtils.degToRad(angel);
    spotLight.position.set(at.x, at.y, at.z);
    spotLight.target.position.set(to.x, to.y, to.z);

    spotLight.castShadow = true;
    spotLight.shadow.mapSize.width = 2048;
    spotLight.shadow.mapSize.height = 2048;

    const worldLight: WorldSpotLight = {
      light: spotLight,
      helper: helper ? new SpotLightHelper(spotLight) : undefined,
    };
    this.lights.spot.push(worldLight);

    await this.spawn(worldLight.light);
    if (worldLight.helper) {
      await this.spawn(worldLight.helper);
    }

    return worldLight;
  }

  public addAxisHelper(size = 1): this {
    const axisHelper = new AxesHelper(size);

    this.add(axisHelper);

    return this;
  }

  public addGridHelper(): this {
    const size = 50;
    const division = 50;

    const color1 = '#6e6e6e';
    const color2 = '#565656';

    const gridHelper = new GridHelper(size, division, color1, color2);
    gridHelper.rotateX(Math.PI / 2);

    this.add(gridHelper);

    return this;
  }
}
