import { ColorRepresentation, LightShadow, OrthographicCamera, Vector3 } from 'three';

export interface BuildBaseLightOptions {
  color?: ColorRepresentation;
  intensity?: number;
  at?: Vector3;
  to?: Vector3;
  widthHelper?: boolean;
  shadow?: Partial<Pick<OrthographicCamera, 'top' | 'bottom' | 'left' | 'right' | 'near' | 'far'>> &
    Partial<Pick<LightShadow, 'bias' | 'blurSamples'>> &
    (
      | {
          w: number;
          h: number;
          size?: never;
        }
      | {
          size: number;
          w?: never;
          h?: never;
        }
    );
}

export interface BuildDirectionLightOptions extends BuildBaseLightOptions {}

export interface BuildSpotLightOptions extends BuildBaseLightOptions {
  power?: number;
  distance?: number;
  penumbra?: number;
  angel?: number;
}

export interface BuildAmbientLightOptions {
  color?: ColorRepresentation;
  intensity?: number;
}
