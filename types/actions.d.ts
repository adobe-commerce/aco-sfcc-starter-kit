namespace ProductActions {
  /** The specific environment parameters received by the `product/external/upsert` action. */
  declare interface UpsertEnv extends GlobalEnv {
    data: {
      skus: string[];
    };
  }

  /** The specific environment parameters received by the `product/external/consumer` action. */
  declare type ConsumerEnv = GlobalEnv & {
    type: 'sfcc.product.sync';
    data: {
      skus: string[];
    };
  };
}

namespace MetadataActions {
  /** The specific environment parameters received by the `metadata/external/sync` action. */
  declare interface SyncEnv extends GlobalEnv {
    data: {};
  }

  /** The specific environment parameters received by the `metadata/external/consumer` action. */
  declare type ConsumerEnv = GlobalEnv & {
    type: 'sfcc.metadata.sync';
    data: {};
  };
}

namespace PriceBookActions {
  /** The specific environment parameters received by the `price-book/external/sync` action. */
  declare interface SyncEnv extends GlobalEnv {
    data: {};
  }

  /** The specific environment parameters received by the `price-book/external/consumer` action. */
  declare type ConsumerEnv = GlobalEnv & {
    type: 'sfcc.price-book.sync';
    data: {};
  };
}

namespace FullSyncActions {
  /** The specific environment parameters received by the `full-sync/external/sync` action. */
  declare interface SyncEnv extends GlobalEnv {
    data: {};
  }

  /** The specific environment parameters received by the `full-sync/external/consumer` action. */
  declare type ConsumerEnv = GlobalEnv & {
    type: 'sfcc.full.sync';
    data: {};
  };
}

namespace DeltaSyncActions {
  /** The specific environment parameters received by the `delta-sync/external/sync` action. */
  declare interface SyncEnv extends GlobalEnv {
    data: {};
  }

  /** The specific environment parameters received by the `delta-sync/external/consumer` action. */
  declare type ConsumerEnv = GlobalEnv & {
    type: 'sfcc.delta.sync';
    data: {};
  };
}

namespace SpaStorefrontActions {
  /** The specific environment parameters received by the `spa/storefront/pdp` action. */
  declare interface PdpEnv extends GlobalEnv {
    data: {
      sku: string;
      pricebookId: string;
      locale: string;
    };
  }

  /** The specific environment parameters received by the `spa/storefront/plp` action. */
  declare interface PlpEnv extends GlobalEnv {
    data: {
      category: string;
      pricebookId: string;
      locale: string;
    };
  }
}

/** The specific environment parameters received by the ingestion-webhook-like actions. */
declare interface IngestionWebhookEnv<ExpectedEvents extends string = string> extends GlobalEnv {
  OAUTH_ORG_ID: string;
  OAUTH_CLIENT_ID: string;
  OAUTH_CLIENT_SECRET: string;
  OAUTH_TECHNICAL_ACCOUNT_ID: string;
  OAUTH_TECHNICAL_ACCOUNT_EMAIL: string;
  IO_MANAGEMENT_BASE_URL: string;
  IO_CONSUMER_ID: string;
  IO_PROJECT_ID: string;
  IO_WORKSPACE_ID: string;
  AIO_RUNTIME_NAMESPACE: string;

  data: {
    uid: string;
    event: ExpectedEvents;
    value: any;
  };
}

/** The response of a successful action. */
declare interface SuccessActionResponse {
  statusCode: 200;
  body: {
    success: true;
    message: string;
    data?: any;
  };
}

/** The response of a failed action. */
declare interface FailureActionResponse {
  statusCode: number;
  body: {
    success: false;
    error: string;
  };
}

/** Defines the shape of a successful result in a step of an action. */
declare interface SuccessfulActionStepResult<T> {
  success: true;
  data: T;
}

/** Defines the shape of a failed result in a step of an action. */
declare interface FailedActionStepResult {
  success: false;
  statusCode: number;
  error: string;
}

/** Defines the shape of a result in a step of an action. */
declare type ActionStepResult<T> = SuccessfulActionStepResult<T> | FailedActionStepResult;

/** The response of an action. */
declare type ActionResponse = SuccessActionResponse | FailureActionResponse;
