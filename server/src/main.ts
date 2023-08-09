require('module-alias/register');
import { Logger } from '@nestjs/common';
import AppBootstrap from './app.bootstrap';

(async function () {
  const logger = new Logger('Main');

  try {
    logger.log('Main bootstrapping start');

    await AppBootstrap.runApp();

    logger.log('Main bootstrapping end');
  } catch (error) {
    logger.error('Main bootstrapping error');
    logger.error(error);

    process.exit(1);
  }
})();
