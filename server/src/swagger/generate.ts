import { ConfigService } from '@/modules/config/config.service';
import AppBootstrap from 'src/app.bootstrap';
import { SwaggerService } from './swagger.service';

async function run() {
  const bootstrap = await new AppBootstrap().init();
  const app = bootstrap.app;
  await new SwaggerService(app, app.get(ConfigService)).createDocument();
}

run()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
