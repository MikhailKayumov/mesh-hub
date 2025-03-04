import { INestApplication, Logger } from '@nestjs/common';
import { CategoryRepository } from '@/modules/resources/repositories/category.repository';

const logger = new Logger('DatabaseSeedingCategories');
const categories = [
  'Животные',
  'Архитектура',
  'Искусство',
  'Транспорт',
  'Персонажи',
  'Существа',
  'Культура и история',
  'Электроника',
  'Мода и стиль',
  'Еда и напитки',
  'Мебель',
  'Музыка',
  'Природа',
  'Политика',
  'Люди',
  'Места',
  'Наука и техника',
  'Спорт',
  'Оружие',
  'Военная техника',
];

export default async function seedCategories(app: INestApplication) {
  logger.log('Seed CG soft');

  const cgSoftRepository = app.get(CategoryRepository);

  for (const category of categories) {
    try {
      logger.log(`Create category soft "${category}"`);
      await cgSoftRepository.createCategory(category);
      logger.log(`Category "${category}" successfully created`);
    } catch {
      logger.log(`Category "${category}" already exists`);
    }
  }
}
