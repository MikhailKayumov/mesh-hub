import { createContext } from 'react';
import { Model3DResponseDto } from '@/api/dto.ts';

export const Model3DContext = createContext<Model3DResponseDto | null>(null);
