import { BaseQueryFn, createApi, FetchArgs, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { SerializedError } from '@reduxjs/toolkit';
import { FetchBaseQueryError } from '@reduxjs/toolkit/dist/query/react';
import Config from '../services/config';
import ApiTags from './tags';
import { isFetchQueryError, processFetchQueryError } from './utils';
import { HttpException } from './dto';

export type FetchQueryError = SerializedError | FetchBaseQueryError | HttpException;

const baseQuery = fetchBaseQuery({
  baseUrl: Config.baseUrl,
  credentials: 'include',
  timeout: 30000,
});

const query: BaseQueryFn<string | FetchArgs, unknown, FetchQueryError> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

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
