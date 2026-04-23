import { PlanType } from '@/database/entities/organizations/organization.entity';

export const SCENE_LIMITS: Record<PlanType, { maxObjects: number; maxLights: number; hdriEnabled: boolean }> = {
  [PlanType.Starter]: { maxObjects: 3, maxLights: 2, hdriEnabled: false },
  [PlanType.Growth]: { maxObjects: 15, maxLights: 10, hdriEnabled: true },
  [PlanType.Enterprise]: { maxObjects: Infinity, maxLights: Infinity, hdriEnabled: true },
};
