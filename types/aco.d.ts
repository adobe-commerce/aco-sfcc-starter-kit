declare interface AcoClientOptions {
  clientId: string;
  clientSecret: string;
  tenantId: string;
  /** @type {import('@adobe-commerce/aco-ts-sdk').Region} */
  region: Region;
  /** @type {import('@adobe-commerce/aco-ts-sdk').Environment} */
  environment: Environment;
}
