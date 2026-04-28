import type { DisplayConfigResponseDto } from '@/app/api/dto.ts';

export type DisplayPreset = Omit<
  Partial<DisplayConfigResponseDto>,
  'id' | 'modelId' | 'lights' | 'environmentHdriPath'
> & { label: string; description: string };

export const DISPLAY_PRESETS: DisplayPreset[] = [
  {
    label: 'Studio',
    description: 'Neutral grey background with balanced lighting for detail review',
    backgroundColor: '#404040',
    ambientIntensity: 0.6,
    fogEnabled: false,
    fogType: 'linear',
    fogColor: '#404040',
    fogNear: 50,
    fogFar: 200,
    rendererConfig: {
      toneMapping: 4, // ReinhardToneMapping
      toneMappingExposure: 1.2,
    },
    postProcess: null,
  },
  {
    label: 'Outdoor',
    description: 'Bright background with atmospheric fog for exterior presentation',
    backgroundColor: '#a8c8e8',
    ambientIntensity: 0.8,
    fogEnabled: true,
    fogType: 'linear',
    fogColor: '#c8dff0',
    fogNear: 80,
    fogFar: 400,
    rendererConfig: {
      toneMapping: 4,
      toneMappingExposure: 1.0,
    },
    postProcess: null,
  },
  {
    label: 'Dark',
    description: 'Deep black environment for dramatic product shots',
    backgroundColor: '#0a0a0a',
    ambientIntensity: 0.2,
    fogEnabled: false,
    fogType: 'linear',
    fogColor: '#111111',
    fogNear: 20,
    fogFar: 100,
    rendererConfig: {
      toneMapping: 4,
      toneMappingExposure: 1.5,
    },
    postProcess: {
      vignette: { enabled: true, offset: 0.6, darkness: 1.8 },
    },
  },
  {
    label: 'Cinematic',
    description: 'Film-look with bloom, vignette, and warm tone mapping',
    backgroundColor: '#1a1410',
    ambientIntensity: 0.3,
    fogEnabled: true,
    fogType: 'exp2',
    fogColor: '#2a2018',
    fogNear: 30,
    fogFar: 150,
    rendererConfig: {
      toneMapping: 3, // CineonToneMapping
      toneMappingExposure: 1.8,
    },
    postProcess: {
      bloom: { enabled: true, strength: 0.4, radius: 0.5, threshold: 0.8 },
      vignette: { enabled: true, offset: 0.5, darkness: 1.6 },
    },
  },
  {
    label: 'Minimal',
    description: 'Clean white backdrop with soft ambient for documentation',
    backgroundColor: '#f5f5f5',
    ambientIntensity: 1.0,
    fogEnabled: false,
    fogType: 'linear',
    fogColor: '#ffffff',
    fogNear: 100,
    fogFar: 500,
    rendererConfig: {
      toneMapping: 1, // LinearToneMapping
      toneMappingExposure: 1.0,
    },
    postProcess: null,
  },
  {
    label: 'Product',
    description: 'High-contrast environment with slight bloom for e-commerce use',
    backgroundColor: '#1c1c1c',
    ambientIntensity: 0.5,
    fogEnabled: false,
    fogType: 'linear',
    fogColor: '#1c1c1c',
    fogNear: 50,
    fogFar: 200,
    rendererConfig: {
      toneMapping: 4,
      toneMappingExposure: 1.3,
    },
    postProcess: {
      bloom: { enabled: true, strength: 0.2, radius: 0.3, threshold: 0.9 },
    },
  },
];
