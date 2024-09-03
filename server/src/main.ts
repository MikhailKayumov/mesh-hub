import { SwaggerService } from '@/swagger/swagger.service';

require('module-alias/register');
import AppBootstrap from './app.bootstrap';
import { ConfigService } from '@/modules/common/config/config.service';

(async () => {
  try {
    const bootstrap = new AppBootstrap();
    await bootstrap.init();
    await bootstrap.run();
  } catch (error) {}

  process.exit();
})();

const bootstrap = new AppBootstrap();

bootstrap
  .init()
  .then((app) => app.runApp())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
