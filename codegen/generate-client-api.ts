import * as path from 'path';
import { generateApi } from 'swagger-typescript-api';

generateApi({
  name: 'api.ts',
  // output: path.resolve(process.cwd(), './client/src/api'),
  output: path.resolve(process.cwd(), './test'),
  input: path.resolve(process.cwd(), '../server/swagger.openapi3.json'),
  templates: path.resolve(process.cwd(), './templates'),
  // cleanOutput: true,
  modular: true,
  httpClientType: 'fetch',
  extractingOptions: {
    requestBodySuffix: ["Payload", "Body", "Input"],
    requestParamsSuffix: ["Params"],
    responseBodySuffix: ["Data", "Result", "Output"],
    responseErrorSuffix: ["Error", "Fail", "Fails", "ErrorData", "HttpError", "BadResponse"],
  },
}).catch(err => {
  console.error(err);
});
