import { ComboboxItem } from '@mantine/core';
import {
  ACESFilmicToneMapping,
  AgXToneMapping,
  BasicShadowMap,
  CineonToneMapping,
  ColorSpace,
  CustomToneMapping,
  DisplayP3ColorSpace,
  LinearDisplayP3ColorSpace,
  LinearSRGBColorSpace,
  LinearToneMapping,
  NoToneMapping,
  PCFShadowMap,
  PCFSoftShadowMap,
  ReinhardToneMapping,
  ShadowMapType,
  SRGBColorSpace,
  ToneMapping,
  VSMShadowMap,
} from 'three';
import { RendererSettings } from '@/widgets/Model3DViewer/classes/types';
import { RendererTabFormValues } from './model.ts';

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
  { value: DisplayP3ColorSpace, label: 'DisplayP3ColorSpace' },
  { value: LinearDisplayP3ColorSpace, label: 'LinearDisplayP3ColorSpace' },
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
