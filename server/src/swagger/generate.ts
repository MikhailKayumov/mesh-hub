import { ConfigService } from '@config/config.service';
import AppBootstrap from 'src/app.bootstrap';
import { SwaggerService } from './swagger.service';

(async () => {
  const app = await AppBootstrap.initApp();
  await new SwaggerService(app, app.get(ConfigService)).createDocument(true);
  process.exit();
})();
