import { type ComboboxItem } from '@mantine/core';
import {
  ACESFilmicToneMapping,
  AgXToneMapping,
  BasicShadowMap,
  CineonToneMapping,
  type ColorSpace,
  CustomToneMapping,
  LinearSRGBColorSpace,
  LinearToneMapping,
  NoToneMapping,
  PCFShadowMap,
  PCFSoftShadowMap,
  ReinhardToneMapping,
  type ShadowMapType,
  SRGBColorSpace,
  type ToneMapping,
  VSMShadowMap,
} from 'three';
import { type RendererSettings } from '@/widgets/Model3DViewer/classes/types';
import { type RendererTabFormValues } from './model.ts';

export const toneMappingOptions: ComboboxItem[] = [
  { value: NoToneMapping.toString(), label: 'NoToneMapping' },
  { value: LinearToneMapping.toString(), label: 'LinearToneMapping' },
  { value: ReinhardToneMapping.toString(), label: 'ReinhardToneMapping' },
  { value: CineonToneMapping.toString(), label: 'CineonToneMapping' },
  { value: ACESFilmicToneMapping.toString(), label: 'ACESFilmicToneMapping' },
  { value: AgXToneMapping.toString(), label: 'AgXToneMapping' },
  { value: CustomToneMapping.toString(), label: 'CustomToneMapping' },
];

export const shadowMapTypeOptions: ComboboxItem[] = [
  { value: '', label: 'NoShadowMap' },
  { value: BasicShadowMap.toString(), label: 'BasicShadowMap' },
  { value: PCFShadowMap.toString(), label: 'PCFShadowMap ' },
  { value: PCFSoftShadowMap.toString(), label: 'PCFSoftShadowMap' },
  { value: VSMShadowMap.toString(), label: 'VSMShadowMap' },
];

export const colorSpaceOptions: ComboboxItem[] = [
  { value: SRGBColorSpace, label: 'SRGBColorSpace ' },
  { value: LinearSRGBColorSpace, label: 'LinearSRGBColorSpace' },
];

export const transformToForm = (settings: RendererSettings): RendererTabFormValues => {
  return {
    outputColorSpace: settings.outputColorSpace ?? '',
    toneMapping: settings.toneMapping?.toString(),
    shadowMapType: settings.shadowMapType?.toString() ?? '',
    toneMappingExposure: settings.toneMappingExposure,
    clearAlpha: settings.clearAlpha ?? 0,
    clearColor: settings.clearColor ?? '#000000',
  };
};

export const transformFromForm = (values: RendererTabFormValues): RendererSettings => {
  return {
    outputColorSpace: values.outputColorSpace as ColorSpace,
    toneMapping: values.toneMapping ? (+values.toneMapping as ToneMapping) : undefined,
    shadowMapType: values.shadowMapType ? (+values.shadowMapType as ShadowMapType) : undefined,
    toneMappingExposure: values.toneMappingExposure,
    clearAlpha: values.clearAlpha ?? 0,
    clearColor: values.clearColor ?? '#000000',
  };
};
