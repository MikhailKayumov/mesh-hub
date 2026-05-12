import { fakerRU as faker } from '@faker-js/faker';
import { INestApplication, Logger } from '@nestjs/common';
import { DataSource, Like } from 'typeorm';
import { Model3dEntity } from '@/database/entities/models-3d/model-3d.entity';
import { SceneConfig } from '@/database/entities/scenes/scene-config.type';
import { SceneLightEntity, LightType } from '@/database/entities/scenes/scene-light.entity';
import { SceneObjectEntity } from '@/database/entities/scenes/scene-object.entity';
import { SceneEntity } from '@/database/entities/scenes/scene.entity';
import { UserEntity } from '@/database/entities/user/user.entity';
import { ConfigService } from '@/modules/config/config.service';
import { UserRepository } from '@/modules/user/repositories/user.repository';

const logger = new Logger('DatabaseSeedingScenes');

const MAIN_USER_EMAIL = 'mkaumov056@gmail.com';

const DEFAULT_SCENE_CONFIG: SceneConfig = {
  backgroundColor: '#1a1a2e',
  ambientLightIntensity: 0.5,
  cameraBookmarks: [],
};

async function createScene(userId: string, name: string, dataSource: DataSource): Promise<SceneEntity> {
  const scene = new SceneEntity();
  scene.name = name;
  scene.userId = userId;
  scene.config = DEFAULT_SCENE_CONFIG;
  scene.visibility = 'private';
  return dataSource.manager.save(SceneEntity, scene);
}

async function addObjectsToScene(sceneId: string, models: Model3dEntity[], dataSource: DataSource): Promise<void> {
  const objects = models.map((model, index) => {
    const obj = new SceneObjectEntity();
    obj.sceneId = sceneId;
    obj.modelId = model.id;
    obj.posX = faker.number.float({ min: -2, max: 2, fractionDigits: 2 });
    obj.posY = 0;
    obj.posZ = faker.number.float({ min: -2, max: 2, fractionDigits: 2 });
    obj.rotX = 0;
    obj.rotY = faker.number.float({ min: 0, max: Math.PI * 2, fractionDigits: 3 });
    obj.rotZ = 0;
    obj.scaleX = 1;
    obj.scaleY = 1;
    obj.scaleZ = 1;
    obj.order = index;
    return obj;
  });
  await dataSource.manager.save(SceneObjectEntity, objects);
}

async function addDirectionalLight(sceneId: string, dataSource: DataSource): Promise<void> {
  const light = new SceneLightEntity();
  light.sceneId = sceneId;
  light.type = LightType.Directional;
  light.posX = 5;
  light.posY = 10;
  light.posZ = 5;
  light.color = '#ffffff';
  light.intensity = 1;
  light.castShadow = true;
  await dataSource.manager.save(SceneLightEntity, light);
}

async function getExistingSceneNames(userId: string, dataSource: DataSource): Promise<Set<string>> {
  const existing = await dataSource.manager.find(SceneEntity, {
    where: { userId },
    select: ['name'],
  });
  return new Set(existing.map((s) => s.name));
}

async function seedScenesForUser(
  user: UserEntity,
  userModels: Model3dEntity[],
  sceneDefs: Array<{ name: string; modelCount: number | null }>,
  dataSource: DataSource,
): Promise<void> {
  const existingNames = await getExistingSceneNames(user.id, dataSource);

  for (const def of sceneDefs) {
    if (existingNames.has(def.name)) {
      logger.log(`Scene "${def.name}" already exists for ${user.email} — skipping`);
      continue;
    }

    const scene = await createScene(user.id, def.name, dataSource);

    if (def.modelCount !== null && userModels.length > 0) {
      const count = Math.min(def.modelCount, userModels.length);
      const selected = faker.helpers.arrayElements(userModels, count);
      await addObjectsToScene(scene.id, selected, dataSource);
      await addDirectionalLight(scene.id, dataSource);
    }

    logger.log(`Created scene "${def.name}" for ${user.email}`);
  }
}

export default async function seedScenes(
  app: INestApplication,
  seededModels: Map<string, Model3dEntity[]>,
): Promise<void> {
  logger.log('Seed scenes');

  const dataSource = app.get(DataSource);
  const userRepository = app.get(UserRepository);
  const config = app.get(ConfigService);

  if (!config.isDevelopment) {
    logger.log('Skipping scene seeding — not in development mode');
    return;
  }

  // --- Main user: 5 scenes ---
  const mainUser = await userRepository.findOne({ where: { email: MAIN_USER_EMAIL } });
  if (!mainUser) {
    logger.warn(`Main user ${MAIN_USER_EMAIL} not found — skipping scenes`);
  } else {
    const mainModels = seededModels.get(mainUser.id) ?? [];

    // If main user already had models (idempotent re-run), fetch from DB
    const allMainModels =
      mainModels.length > 0
        ? mainModels
        : await dataSource.manager.find(Model3dEntity, {
            where: { user: { id: mainUser.id } },
          });

    const mainSceneDefs = [
      { name: 'Пустая сцена', modelCount: null },
      { name: 'Сцена с 4 моделями', modelCount: 4 },
      { name: 'Тестовая сцена 1', modelCount: faker.number.int({ min: 1, max: 2 }) },
      { name: 'Тестовая сцена 2', modelCount: faker.number.int({ min: 1, max: 2 }) },
      { name: 'Тестовая сцена 3', modelCount: faker.number.int({ min: 1, max: 2 }) },
    ];

    await seedScenesForUser(mainUser, allMainModels, mainSceneDefs, dataSource);
  }

  // --- Test users ---
  const testUsers = await userRepository.find({
    where: { email: Like('%@example.dev') },
    order: { createdAt: 'ASC' },
  });

  const count = testUsers.length;

  // count = 1 → user[0] empty (no scenes)
  // count = 2 → user[0] empty, user[1] gets 1 scene
  // count > 2 → user[0] empty, user[1] gets 1 scene
  if (count < 2) {
    logger.log('Less than 2 test users — skipping test user scenes');
    return;
  }

  const testUserWithData = testUsers[1];
  const testModels = seededModels.get(testUserWithData.id) ?? [];

  const allTestModels =
    testModels.length > 0
      ? testModels
      : await dataSource.manager.find(Model3dEntity, {
          where: { user: { id: testUserWithData.id } },
        });

  await seedScenesForUser(
    testUserWithData,
    allTestModels,
    [{ name: 'Моя сцена', modelCount: allTestModels.length > 0 ? allTestModels.length : null }],
    dataSource,
  );
}
