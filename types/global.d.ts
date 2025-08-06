/** The inputs passed to the the Env. */
declare interface EnvInputs {
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';

  ACO_TENANT_ID: string;
  ACO_REGION: string;
  ACO_ENVIRONMENT_TYPE: string;
  ACO_STOREFRONT_URL: string;

  SFCC_API_BASE_URL: string;
  SFCC_REALM_ID: string;
  SFCC_INSTANCE_ID: string;
  SFCC_ORGANIZATION_ID: string;
  SFCC_SITE_ID: string;
  SFCC_LOCALES_TO_SYNC: string;

  SFCC_AUTH_URL: string;
  SFCC_CLIENT_ID: string;
  SFCC_CLIENT_SECRET: string;
  SFCC_SITE_URL: string;
  SFCC_ADMIN_SITE_URL: string;

  TELEMETRY_ENABLE: 'true' | 'false';
  NGROK_URL: string;
}

/** The environment parameters present in the Adobe IO runners. */
declare interface AdobeIOEnv {
  API_HOST: string;
  API_AUTH: string;
}

/** All the known params received in the Env. */
declare type GlobalEnv = EnvInputs &
  AdobeIOEnv & {
    [key: string]: unknown;
  };

/** Defines a handler that makes a request somewhere using the Ky library. */
declare type KyHttpHandler<TResponse = unknown> = (
  url: string,
  options?: import('ky').Options,
) => Promise<import('ky').KyResponse<TResponse>>;

/** Defines the shape of a successful HTTP call. */
declare interface SuccessfulHttpCallResponse<TData> {
  success: true;
  data: TData;
}

/** Defines the shape of a failed HTTP call. */
declare interface FailedHttpCallResponse<TData> {
  success: false;
  statusCode: number;

  data?: TData;
  error: Error;
}

/** Defines the shape of an HTTP call response. */
declare type HttpCallResponse<TData> = SuccessfulHttpCallResponse<TData> | FailedHttpCallResponse<TData>;

/** Defines the shape of a GraphQL query. */
declare type GraphqlQuery<
  TData = any,
  TVariables = import('@urql/core').AnyVariables,
> = import('@urql/core').TypedDocumentNode<TData, TVariables>;

/** Defines the shape of a GraphQL client query result. */
declare type GraphqlResult<TData = any> = import('@urql/core').OperationResult<
  TData,
  void | { [prop: string]: any } | undefined
>;

/** Defines the most generic function type. */
declare type AnyFunction = (...args: any[]) => any;

/**
 * Defines a function that can be used to wrap any function.
 *
 * @template {AnyFunction} TFunc
 * @param {TFunc} func - The function to wrap.
 * @returns {(...args: Parameters<TFunc>) => ReturnType<TFunc>} The wrapped function.
 */
declare type AnyFunctionWrapper<T extends AnyFunction> = (
  ...args: Parameters<T>
) => ReturnType<T> | Promise<Awaited<ReturnType<T>>>;

/** Defines the shape of a main runtime action function. */
declare type MainFunction<T extends GlobalEnv> = (params: T) => Promise<any>;

/** Defines the shape of a main runtime action function wrapper. */
declare type MainFunctionWrapper<T extends MainFunction> = (params: T) => Promise<Awaited<ReturnType<T>>>;
