import * as path from 'path';
import {generateApi} from 'swagger-typescript-api';

generateApi({
  output: path.resolve(process.cwd(), '../client/src/api'),
  input: path.resolve(process.cwd(), '../server/swagger.openapi3.json'),
  templates: path.resolve(process.cwd(), './templates'),
  modular: true,
  patch: true,
  httpClientType: 'fetch'
}).catch(err => {
  console.error(err);
});
