import { UnknownAction, isRejectedWithValue, Middleware } from '@reduxjs/toolkit';
import { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { isNumber } from '@/utils/type-guards.ts';
import { HttpException, ValidationHttpException } from './dto';

export const isFetchQueryError = (error: unknown): error is FetchBaseQueryError => {
  return typeof error === 'object' && error != null && 'status' in error;
};

export const isHttpException = (error: unknown): error is HttpException => {
  return isFetchQueryError(error) && isNumber(error.status);
};

export const isFetchError = (error: unknown): error is FetchBaseQueryError => {
  return isFetchQueryError(error) && error.status === 'FETCH_ERROR';
};

export const isUnauthorizedHttpException = (error: unknown): error is HttpException => {
  return isHttpException(error) && error.status === 401;
};

export const isValidationException = <Property extends string | number | symbol = string>(
  error: unknown,
): error is ValidationHttpException<Property> => {
  return isHttpException(error) && error.type === 'ValidationError';
};

export const processFetchQueryError = (error: FetchBaseQueryError): FetchBaseQueryError | HttpException => {
  if (!isHttpException(error)) {
    return error;
  }

  return {
    status: error.data.status ?? error.status,
    type: error.data.type,
    message: error.data.message,
    error: error.data.error,
    data: error.data.data,
  };
};

export const rtkErrorLogger: Middleware = () => (next) => (action) => {
  if (isRejectedWithValue(action)) {
    console.error(
      '[RTK Query Error] ',
      JSON.stringify(
        {
          endpointName: (action?.meta?.arg as any)?.endpointName ?? '',
          url: (action?.meta as any)?.baseQueryMeta?.request?.url ?? '',
          payload: action?.payload,
        },
        null,
        2,
      ),
    );
  }

  return next(action as UnknownAction);
};
