import { INestApplication } from '@nestjs/common';
import { SeedModule } from '../type';
import seedModels3D from './seedModels3D';
import seedScenes from './seedScenes';

async function seedContent(app: INestApplication) {
  const seededModels = await seedModels3D(app);
  await seedScenes(app, seededModels);
}

const ContentSeedModule: SeedModule = {
  name: 'Content seeds',
  seeds: [seedContent],
  dev: [],
};

export default ContentSeedModule;
