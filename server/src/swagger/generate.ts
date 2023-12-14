import AppBootstrap from 'src/app.bootstrap';
import { ConfigService } from '@/modules/common/config/config.service';
import { SwaggerService } from './swagger.service';

(async () => {
  const app = await AppBootstrap.initApp();
  await new SwaggerService(app, app.get(ConfigService)).createDocument(true);
  process.exit();
})();
