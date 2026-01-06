import type { SerializedError } from '@reduxjs/toolkit';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { type BaseQueryFn, createApi, type FetchArgs, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { Mutex } from 'async-mutex';
import { ApiUrls } from '@/app/api/urls.ts';
import { userActions } from '@/entities/user/store';
import type { HttpException } from './dto.ts';
import { ApiTags } from './tags.ts';
import { isFetchError, isFetchQueryError, isUnauthorizedHttpException, processFetchQueryError } from './utils.ts';

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

    if (isUnauthorizedHttpException(result.error) || isFetchError(result.error)) {
      if (apiMutex.isLocked()) {
        await apiMutex.waitForUnlock();
        result = await baseQuery(args, api, extraOptions);
      } else {
        const release = await apiMutex.acquire();

        try {
          const refreshResult = await baseQuery({ url: ApiUrls.Refresh, method: 'POST' }, api, extraOptions);
          if (refreshResult.data) {
            api.dispatch(userActions.setSession((refreshResult.data as any).id));
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

export const Api = createApi({
  reducerPath: '@mesh_hub/api',
  baseQuery: query,
  endpoints: () => ({}),
  tagTypes: Object.values(ApiTags),
});
