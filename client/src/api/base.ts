import { BaseQueryFn, createApi, FetchArgs, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { SerializedError } from '@reduxjs/toolkit';
import { FetchBaseQueryError } from '@reduxjs/toolkit/dist/query/react';
import ApiTags from './tags';
import { isFetchQueryError, processFetchQueryError } from './utils';
import { HttpException } from './dto';

export type FetchQueryError = SerializedError | FetchBaseQueryError | HttpException;

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_APP_API_URL ?? '/',
  credentials: 'include',
  timeout: 30000,
  // paramsSerializer: (params) => {
  //   return queryString.stringify(params, {
  //     arrayFormat: 'none',
  //   });
  // },
  // prepareHeaders: (headers, api) => {
  //   const token = (api.getState() as StorageState)?.auth.token;
  //
  //   if (token) {
  //     headers.set('Authorization', `Bearer ${token.accessToken}`);
  //   }
  //   return headers;
  // },
});

const query: BaseQueryFn<string | FetchArgs, unknown, FetchQueryError> = async (args, api, extraOptions) => {
  const result = await baseQuery(args, api, extraOptions);

  if (isFetchQueryError(result.error)) {
    result.error = processFetchQueryError(result.error);
  }

  return result;
};

const Api = createApi({
  reducerPath: '@mesh_hub/api',
  baseQuery: query,
  endpoints: () => ({}),
  tagTypes: [ApiTags.Reset, ApiTags.CurrentUser],
});

export default Api;
