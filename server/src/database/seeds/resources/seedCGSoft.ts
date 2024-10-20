import { INestApplication, Logger } from '@nestjs/common';
import { CgSoftRepository } from '@/modules/resources/repositories/cg-soft.repository';

const logger = new Logger('DatabaseSeedingCGSoft');
const cgSoftware = [
  '3D-Coat',
  '3ds Max',
  'ArchiCAD',
  'AutoCAD',
  'Blender',
  'Cinema 4D',
  'form•Z',
  'GIMP',
  'Houdini',
  'Illustrator',
  'Inventor',
  'IronCAD',
  'Lightwave 3D',
  'MagicalVoxel',
  'Maya',
  'Modo',
  'Mudbox',
  'Photoshop',
  'Qubicle',
  'Revit',
  'Rhino',
  'Sculpt+',
  'Sculptris',
  'SketchUp',
  'Softimage',
  'SolidWorks',
  'Strata',
  'Substance',
  'Unity',
  'Unreal Engine',
  'Vray',
  'ZBrush',
];

export default async function seedCGSoft(app: INestApplication) {
  logger.log('Seed CG soft');

  const cgSoftRepository = app.get(CgSoftRepository);

  for (const soft of cgSoftware) {
    try {
      logger.log(`Create CG soft "${soft}"`);
      await cgSoftRepository.createCGSoft(soft);
      logger.log(`CG soft "${soft}" successfully created`);
    } catch {
      logger.log(`CG soft "${soft}" already exists`);
    }
  }
}
