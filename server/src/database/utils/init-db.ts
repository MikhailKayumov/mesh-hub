require('module-alias/register');
import { Logger } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { Client } from 'pg';
import { databases, schemas } from './constants';

dotenv.config();

const logger = new Logger('Init Database');

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

    for (const schema of schemas) {
      try {
        logger.debug(`Initializing schema ${schema}`);
        logger.debug('Drop old schema if exists ...');
        await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
        logger.debug('Dropped!');

        logger.debug(`Create schema ${schema} ...`);
        await client.query(`CREATE SCHEMA "${schema}"`);
        logger.debug(`Schema ${schema} successfully created`);
      } catch (e) {
        logger.error(`Error on create schema ${schema}${e?.message ? ` (${e.message})` : ''}`, e.stack);
      }
    }
  } catch (e) {
    logger.error(`Error on init schemes for ${database}${e?.message ? ` (${e.message})` : ''}`, e.stack);
  } finally {
    client?.end();
  }
};

export const initDatabases = async () => {
  const client = createClient();

  try {
    await client.connect();

    for await (const database of databases) {
      try {
        const oid = await client.query(`SELECT oid FROM pg_database WHERE datname = '${database}'`);
        if (!oid.rowCount) {
          logger.log(`Creating database ${database}`);
          await client.query(`CREATE DATABASE "${database}"`);
        } else {
          logger.log(`Database ${database} already exists`);
        }

        await initSchemas(database);
      } catch (e) {
        logger.error(`Error on create database ${database}${e?.message ? ` (${e.message})` : ''}`, e.stack);
      }
    }
  } catch (e) {
    logger.error(`Error on create databases${e?.message ? ` (${e.message})` : ''}`, e.stack);
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
