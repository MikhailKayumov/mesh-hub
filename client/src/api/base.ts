import { SerializedError } from '@reduxjs/toolkit';
import { FetchBaseQueryError } from '@reduxjs/toolkit/dist/query/react';
import { BaseQueryFn, createApi, FetchArgs, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { Mutex } from 'async-mutex';
import ApiUrls from '@/api/urls.ts';
import { userActions } from '@/store/user/reducer.ts';
import { HttpException } from './dto';
import ApiTags from './tags';
import { isFetchQueryError, isUnauthorizedHttpException, processFetchQueryError } from './utils';

export type FetchQueryError = SerializedError | FetchBaseQueryError | HttpException;

const apiMutex = new Mutex();

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_APP_API_URL ?? '/',
  credentials: 'include',
  timeout: 30000,
});

const query: BaseQueryFn<string | FetchArgs, unknown, FetchQueryError> = async (args, api, extraOptions) => {
  await apiMutex.waitForUnlock();

  let result = await baseQuery(args, api, extraOptions);

  if (isFetchQueryError(result.error)) {
    result.error = processFetchQueryError(result.error);

    if (isUnauthorizedHttpException(result.error)) {
      if (apiMutex.isLocked()) {
        await apiMutex.waitForUnlock();
        result = await baseQuery(args, api, extraOptions);
      } else {
        const release = await apiMutex.acquire();

        try {
          const refreshResult = await baseQuery({ url: ApiUrls.Refresh, method: 'POST' }, api, extraOptions);
          if (refreshResult.data) {
            api.dispatch(userActions.setSession(refreshResult.data as any));
            result = await baseQuery(args, api, extraOptions);
          } else {
            api.dispatch(userActions.setSession(null));
          }
        } catch (e) {
          console.error(e);
        } finally {
          release();
        }
      }
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
