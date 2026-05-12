import { statSync, readdirSync } from 'node:fs';
import { copyFile, mkdir } from 'node:fs/promises';
import { basename, extname, resolve } from 'node:path';
import { fakerRU as faker } from '@faker-js/faker';
import { INestApplication, Logger } from '@nestjs/common';
import { Like, DataSource } from 'typeorm';
import { ModelVisibility } from '@/constants';
import { Model3dFileEntity } from '@/database/entities/models-3d/model-3d-file.entity';
import { Model3dEntity } from '@/database/entities/models-3d/model-3d.entity';
import { ModelVersionEntity } from '@/database/entities/models-3d/model-version.entity';
import { CategoryEntity } from '@/database/entities/resources/category.entity';
import { UserEntity } from '@/database/entities/user/user.entity';
import { ConfigService } from '@/modules/config/config.service';
import { CategoryRepository } from '@/modules/resources/repositories/category.repository';
import { UserRepository } from '@/modules/user/repositories/user.repository';

const logger = new Logger('DatabaseSeedingModels3D');

const MAIN_USER_EMAIL = 'mkaumov056@gmail.com';
const TEST_MODELS_DIR = resolve(process.cwd(), '..', 'test-models');

async function createModelRecord(
  user: UserEntity,
  glbFileName: string,
  allCategories: CategoryEntity[],
  dataSource: DataSource,
  modelsBaseDir: string,
): Promise<Model3dEntity> {
  const srcPath = resolve(TEST_MODELS_DIR, glbFileName);
  const fileSize = statSync(srcPath).size;
  const modelName = basename(glbFileName, extname(glbFileName));

  const fileEntity = new Model3dFileEntity();
  fileEntity.name = glbFileName;
  fileEntity.size = fileSize;
  fileEntity.extension = '.glb';
  fileEntity.originalFormat = 'glb';

  const savedFile = await dataSource.manager.save(Model3dFileEntity, fileEntity);

  const modelEntity = new Model3dEntity();
  modelEntity.name = modelName;
  modelEntity.user = user;
  modelEntity.file = savedFile;
  modelEntity.visibility = ModelVisibility.Public;
  modelEntity.categories = faker.helpers.arrayElements(allCategories, { min: 1, max: 3 });

  const savedModel = await dataSource.manager.save(Model3dEntity, modelEntity);

  const versionEntity = new ModelVersionEntity();
  versionEntity.versionNumber = 1;
  versionEntity.fileName = glbFileName;
  versionEntity.fileSize = fileSize;
  versionEntity.mimeType = 'model/gltf-binary';
  versionEntity.isActive = true;
  versionEntity.modelId = savedModel.id;
  versionEntity.uploaderId = user.id;

  const savedVersion = await dataSource.manager.save(ModelVersionEntity, versionEntity);

  savedModel.currentVersionId = savedVersion.id;
  await dataSource.manager.save(Model3dEntity, savedModel);

  const destDir = resolve(modelsBaseDir, savedModel.id);
  await mkdir(destDir, { recursive: true });
  await copyFile(srcPath, resolve(destDir, glbFileName));

  logger.log(`Created model "${modelName}" for user ${user.email}`);
  return savedModel;
}

export default async function seedModels3D(app: INestApplication): Promise<Map<string, Model3dEntity[]>> {
  logger.log('Seed 3D models');

  const dataSource = app.get(DataSource);
  const userRepository = app.get(UserRepository);
  const categoryRepository = app.get(CategoryRepository);
  const config = app.get(ConfigService);

  const modelsMap = new Map<string, Model3dEntity[]>();

  if (!config.isDevelopment) {
    logger.log('Skipping 3D model seeding — not in development mode');
    return modelsMap;
  }

  const allCategories = await categoryRepository.find();
  if (!allCategories.length) {
    logger.warn('No categories found — run seedResources first');
    return modelsMap;
  }

  const modelsBaseDir = config.fsConfig.folders.models;

  const glbFiles = readdirSync(TEST_MODELS_DIR).filter((f) => extname(f).toLowerCase() === '.glb');
  if (!glbFiles.length) {
    logger.warn(`No .glb files found in ${TEST_MODELS_DIR}`);
    return modelsMap;
  }

  // --- Main user ---
  const mainUser = await userRepository.findOne({ where: { email: MAIN_USER_EMAIL } });
  if (!mainUser) {
    logger.warn(`Main user ${MAIN_USER_EMAIL} not found — skipping`);
  } else {
    const existingNames = new Set(
      (await dataSource.manager.find(Model3dEntity, { where: { user: { id: mainUser.id } }, select: ['name'] })).map(
        (m) => m.name,
      ),
    );

    const createdModels: Model3dEntity[] = [];
    for (const glbFile of glbFiles) {
      const name = basename(glbFile, extname(glbFile));
      if (existingNames.has(name)) {
        logger.log(`Model "${name}" already exists for ${mainUser.email} — skipping`);
        continue;
      }
      const model = await createModelRecord(mainUser, glbFile, allCategories, dataSource, modelsBaseDir);
      createdModels.push(model);
    }
    modelsMap.set(mainUser.id, createdModels);
  }

  // --- Test users ---
  const testUsers = await userRepository.find({
    where: { email: Like('%@example.dev') },
    order: { createdAt: 'ASC' },
  });

  const count = testUsers.length;

  if (count === 0) {
    logger.log('No test users found — skipping test user models');
    return modelsMap;
  }

  // Determine which test users get models:
  // count = 1 → only user[0] exists → empty (no models)
  // count = 2 → user[0] empty, user[1] gets 1-3 models
  // count > 2 → user[0] empty, user[1] gets 1-3 models (same as count=2 for first two)
  const usersWithModels: UserEntity[] = count === 1 ? [] : [testUsers[1]];

  for (const testUser of usersWithModels) {
    const existingNames = new Set(
      (await dataSource.manager.find(Model3dEntity, { where: { user: { id: testUser.id } }, select: ['name'] })).map(
        (m) => m.name,
      ),
    );

    const selected = faker.helpers.arrayElements(glbFiles, { min: 1, max: 3 });
    const createdModels: Model3dEntity[] = [];

    for (const glbFile of selected) {
      const name = basename(glbFile, extname(glbFile));
      if (existingNames.has(name)) {
        logger.log(`Model "${name}" already exists for ${testUser.email} — skipping`);
        continue;
      }
      const model = await createModelRecord(testUser, glbFile, allCategories, dataSource, modelsBaseDir);
      createdModels.push(model);
    }
    modelsMap.set(testUser.id, createdModels);
  }

  logger.log(`Seeded models for ${modelsMap.size} user(s)`);
  return modelsMap;
}
