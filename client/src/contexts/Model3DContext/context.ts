import { createContext } from 'react';
import { Model3DResponseDto } from '@/api/dto.ts';

const Model3DContext = createContext<Model3DResponseDto | null>(null);

export default Model3DContext;
