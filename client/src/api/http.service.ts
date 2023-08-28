import { NextResponse } from 'next/server';
import {
  HttpServiceConfig,
  CancelToken,
  FullRequestParams,
  RequestParams,
  QueryParamsType,
  ResponseFormat,
  HttpResponse,
} from '~/api/types';
import { isNil, isObject } from '~/utils/type-guards';

export enum ContentType {
  Json = 'application/json',
  FormData = 'multipart/form-data',
  UrlEncoded = 'application/x-www-form-urlencoded',
  Text = 'text/plain',
}

export class HttpService {
  public readonly baseUrl: string = 'http://localhost:8080';
  public readonly baseUrlPrefix: string = 'api';

  private abortControllers = new Map<CancelToken, AbortController>();
  private baseParams: RequestParams = {
    credentials: 'same-origin',
    headers: {},
    redirect: 'follow',
    referrerPolicy: 'no-referrer',
  };
  private contentFormatters: Record<ContentType, (input: any) => any> = {
    [ContentType.Json]: (input: any) => {
      return input !== null && (typeof input === 'object' || typeof input === 'string') ? JSON.stringify(input) : input;
    },
    [ContentType.Text]: (input: any) => (input !== null && typeof input !== 'string' ? JSON.stringify(input) : input),
    [ContentType.FormData]: (input: any) => {
      return Object.keys(input || {}).reduce((formData, key) => {
        const property = input[key];
        formData.append(
          key,
          property instanceof Blob ? property : isObject(property) ? JSON.stringify(property) : `${property}`,
        );
        return formData;
      }, new FormData());
    },
    [ContentType.UrlEncoded]: (input: any) => this.toQueryString(input),
  };

  public constructor(config: HttpServiceConfig = {}) {
    Object.assign(this, config);
  }

  public request = async <ResponseType = any>({
    body,
    path,
    type = ContentType.Json,
    query,
    format,
    baseUrl,
    cancelToken,
    ...params
  }: FullRequestParams): Promise<HttpResponse<ResponseType>> => {
    const formatter = this.contentFormatters[type];

    const requestParams = this.mergeRequestParams(params);
    const queryString = query && this.toQueryString(query);
    const responseFormat: ResponseFormat = format ?? requestParams.format ?? 'json';

    return fetch(this.createEndpoint(baseUrl, path, queryString), {
      ...requestParams,
      credentials: 'include',
      headers: {
        ...(requestParams.headers || {}),
        ...(type !== ContentType.FormData ? { 'Content-Type': type } : {}),
      },
      signal: (cancelToken ? this.createAbortSignal(cancelToken) : requestParams.signal) ?? null,
      body: isNil(body) ? null : formatter(body),
    }).then(async response => {
      const data: ResponseType = await response[responseFormat]().catch(e => e);

      if (cancelToken) {
        this.abortControllers.delete(cancelToken);
      }
      if (!response.ok) {
        throw data;
      }

      return {
        data,
        response: response as NextResponse<ResponseType>,
      };
    });
  };

  protected createEndpoint(baseUrl = this.baseUrl, path: string, query?: string): string {
    const paths = [baseUrl, this.baseUrlPrefix, path].reduce((acc, url) => {
      return `${acc ? `${acc}/` : ''}${url.replace(/(^\/)|(\/$)/gm, '')}`;
    }, '');

    return `${paths}${query ? `?${query}` : ''}`;
  }

  /**
   * Request params
   */

  protected mergeRequestParams(...params: RequestParams[]): RequestParams {
    return params.reduce<RequestParams>((acc, param) => {
      return Object.assign(acc, param);
    }, this.baseParams);
  }

  /**
   * Query params
   */

  protected encodeQueryParam(key: string, value: any) {
    const encodedKey = encodeURIComponent(key);
    return `${encodedKey}=${encodeURIComponent(typeof value === 'number' ? value : `${value}`)}`;
  }

  protected addQueryParam(query: QueryParamsType, key: string) {
    return this.encodeQueryParam(key, query[key]);
  }

  protected addArrayQueryParam(query: QueryParamsType, key: string) {
    const value = query[key];
    return value.map((v: any) => this.encodeQueryParam(key, v)).join('&');
  }

  protected addQueryParams(rawQuery?: QueryParamsType): string {
    const queryString = this.toQueryString(rawQuery);
    return queryString ? `?${queryString}` : '';
  }

  protected toQueryString(rawQuery?: QueryParamsType): string {
    const query = rawQuery || {};
    const keys = Object.keys(query).filter(key => 'undefined' !== typeof query[key]);
    return keys
      .map(key => (Array.isArray(query[key]) ? this.addArrayQueryParam(query, key) : this.addQueryParam(query, key)))
      .join('&');
  }

  /**
   * Abort signal
   */

  public abortRequest(cancelToken: CancelToken): void {
    const abortController = this.abortControllers.get(cancelToken);

    if (abortController) {
      !abortController.signal.aborted && abortController.abort();
      this.abortControllers.delete(cancelToken);
    }
  }

  protected createAbortSignal(cancelToken: CancelToken): AbortSignal | undefined {
    let abortController = this.abortControllers.get(cancelToken);
    if (abortController) {
      return abortController.signal;
    }

    abortController = new AbortController();
    this.abortControllers.set(cancelToken, abortController);
    return abortController.signal;
  }
}
