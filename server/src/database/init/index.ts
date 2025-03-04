require('module-alias/register');
import { Logger } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { Client } from 'pg';
import { Databases, DatabaseSchemas } from '../constants';

dotenv.config();

const DROP_SCHEMAS = process.env['DROP_SCHEMAS'] === 'true';

const logger = new Logger('DatabaseInitialization');

const createClient = (database = 'postgres') => {
  return new Client({
    host: process.env['POSTGRES_HOST'],
    port: Number(process.env['POSTGRES_PORT']),
    user: process.env['POSTGRES_USER'],
    password: process.env['POSTGRES_PASSWORD'],
    database,
  });
};

export const initSchemas = async (database: string): Promise<void> => {
  const client = createClient(database);

  try {
    await client.connect();

    for (const schema of Object.values(DatabaseSchemas)) {
      try {
        logger.log(`Initializing schema "${schema}"`);

        if (DROP_SCHEMAS) {
          logger.log(`Drop old schema "${schema}" if exists ...`);
          await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
          logger.log(`Schema "${schema}" successfully dropped`);
        }

        logger.log(`Create schema if not exists "${schema}"`);
        await client.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
        logger.log(`Schema "${schema}" was successfully created`);
      } catch (e) {
        logger.log(`Error on create schema "${schema}": ${e?.message ? ` (${e.message})` : ''}`, e.stack);
      }
    }
  } catch (e) {
    logger.log(`Error on init schemes for "${database}": ${e?.message ? ` (${e.message})` : ''}`, e.stack);
  } finally {
    client?.end();
  }
};

export const initDatabases = async () => {
  const client = createClient();

  try {
    await client.connect();

    for await (const database of Databases) {
      try {
        const oid = await client.query(`SELECT oid FROM pg_database WHERE datname = '${database}'`);
        if (!oid.rowCount) {
          logger.log(`Creating database "${database}"`);
          await client.query(`CREATE DATABASE "${database}"`);
        } else {
          logger.log(`Database "${database}" already exists`);
        }

        await initSchemas(database);
      } catch (e) {
        logger.error(`Error on create database "${database}": ${e?.message ? ` (${e.message})` : ''}`, e.stack);
      }
    }
  } catch (e) {
    logger.error(`Error on create databases: ${e?.message ? ` (${e.message})` : ''}`, e.stack);
  } finally {
    await client?.end();
  }
};

(async () => {
  try {
    await initDatabases();
    process.exit(0);
  } catch (e) {
    logger.error(`Error on init databases${e?.message ? ` (${e.message})` : ''}`, e.stack);
    process.exit(1);
  }
})();
