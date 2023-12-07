import { SerializedError } from '@reduxjs/toolkit';
import { FetchBaseQueryError } from '@reduxjs/toolkit/dist/query/react';
import { BaseQueryFn, createApi, FetchArgs, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { userActions } from '@/store/user/reducer.ts';
import { HttpException } from './dto';
import ApiTags from './tags';
import { isFetchQueryError, isUnauthorizedHttpException, processFetchQueryError } from './utils';

export type FetchQueryError = SerializedError | FetchBaseQueryError | HttpException;

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_APP_API_URL ?? '/',
  credentials: 'include',
  timeout: 30000,
});

const query: BaseQueryFn<string | FetchArgs, unknown, FetchQueryError> = async (args, api, extraOptions) => {
  const result = await baseQuery(args, api, extraOptions);

  if (isFetchQueryError(result.error)) {
    result.error = processFetchQueryError(result.error);

    if (isUnauthorizedHttpException(result.error)) {
      api.dispatch(userActions.setSession(null));
      result.error = undefined;
    }
  }

  return result;
};

const Api = createApi({
  reducerPath: '@mesh_hub/api',
  baseQuery: query,
  endpoints: () => ({}),
  tagTypes: [ApiTags.Reset, ApiTags.CurrentUser, ApiTags.CGSoft],
});

export default Api;
