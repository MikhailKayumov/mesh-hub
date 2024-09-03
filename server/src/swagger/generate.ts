import AppBootstrap from 'src/app.bootstrap';
import { ConfigService } from '@/modules/common/config/config.service';
import { SwaggerService } from './swagger.service';

(async () => {
  const bootstrap = new AppBootstrap();
  const app = await bootstrap.init();
  await new SwaggerService(app, app.get(ConfigService)).createDocument();
  process.exit();
})();
