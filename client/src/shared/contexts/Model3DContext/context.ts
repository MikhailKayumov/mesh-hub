import { createContext } from 'react';
import type { Model3DResponseDto } from '@/app/api/dto.ts';

export const Model3DContext = createContext<Model3DResponseDto | null>(null);
