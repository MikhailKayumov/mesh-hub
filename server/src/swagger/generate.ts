import AppBootstrap from 'src/app.bootstrap';
import { ConfigService } from '@/modules/common/config/config.service';
import { SwaggerService } from './swagger.service';

(async () => {
  const bootstrap = await new AppBootstrap().init();
  const app = bootstrap.app;
  await new SwaggerService(app, app.get(ConfigService)).createDocument();
  process.exit(0);
})();
