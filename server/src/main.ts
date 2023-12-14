require('module-alias/register');
import AppBootstrap from './app.bootstrap';

AppBootstrap.runApp().catch((error) => {
  console.error(error);
  process.exit(1);
});
