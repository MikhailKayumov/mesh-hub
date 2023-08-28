import { NextResponse } from 'next/server';
import { ContentType } from '~/api/http.service';

export type QueryParamsType = Record<string | number, any>;

export type ResponseFormat = keyof Omit<Body, 'body' | 'bodyUsed'>;

export type CancelToken = Symbol | string | number;

export interface FullRequestParams extends Omit<RequestInit, 'body'> {
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseFormat;
  /** request body */
  body?: unknown;
  /** base url */
  baseUrl?: string;
  /** request cancellation token */
  cancelToken?: CancelToken;
}

export type RequestParams = Omit<FullRequestParams, 'body' | 'method' | 'query' | 'path'>;

export interface HttpResponse<D extends unknown> {
  data: D;
  response: NextResponse;
}

export interface HttpException {
  message: string;
  error: string;
  statusCode: number;
  meta?: Record<string | number, any>;
}

export interface HttpServiceConfig {
  baseUrl?: string;
  baseParams?: Omit<RequestParams, 'baseUrl' | 'cancelToken' | 'signal'>;
}
