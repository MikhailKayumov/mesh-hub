import { INestApplication } from '@nestjs/common';

export type SeedModule = {
  name: string;
  seeds: Array<(app: INestApplication) => void | Promise<void>>;
  dev?: Array<(app: INestApplication) => void | Promise<void>>;
};
