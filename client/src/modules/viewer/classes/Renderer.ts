import { PCFSoftShadowMap, WebGLRenderer, WebGLRendererParameters } from 'three/src/Three';

export class Renderer {
  private renderer: WebGLRenderer;

  public constructor(parameters: WebGLRendererParameters = { antialias: true }) {
    this.renderer = new WebGLRenderer(parameters);
    this.renderer.useLegacyLights = false;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFSoftShadowMap;
  }

  public getCanvas(): HTMLCanvasElement {
    return this.renderer.domElement;
  }

  public destroy() {
    this.renderer.dispose();
  }
}
