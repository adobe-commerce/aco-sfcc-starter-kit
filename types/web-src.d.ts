/** The type of the endpoints that can be checked for connectivity. */
declare type ConnectivityEndpoint = 'salesforce' | 'aco';

/** Defines the result of an invoke action. */
declare type InvokeResult =
  | {
      success: true;
      message: string | null;
      data: Record<string, any>;
    }
  | {
      success: false;
      error: string | null;
      data: Record<string, any>;
    };

/** The type of the hook to invoke a web action. */
declare type UseWebActionHook = (
  name,
  params?: import('ky').Options,
) => {
  response: import('ky').KyResponse<InvokeResult> | null;
  status: string;
  lastRun: string;
  result: InvokeResult | null;
  invokeAction: (params?: import('ky').Options) => Promise<void>;
};

/** Type for the useState React hook. */
declare type UseStateHook<T> = ReturnType<typeof import('react').useState<T>>;

/** The type of the props for the ConnectivityCard component. */
declare type ConnectivityCardProps = {
  title: string;
  description: string;
  links: { href: string; text: string }[];
  endpoint: ConnectivityEndpoint;
};

/** The type of the props for the InvokeResultDialog component. */
declare type InvokeResultDialogProps = {
  open: boolean;
  onDismiss: () => void;
  result: InvokeResult | null;
  title: string;
  dataKey: string;
};

/**
 * The types for the runtime object seem to be incomplete. This is a workaround to define the actual interface provided
 * by the runtime object.
 */
declare type ExcRuntime = import('@adobe/exc-app').Runtime & Record<string, any>;

declare type LastSyncTimestamps = {
  lastFullSyncRun: string;
  lastDeltaSyncRun: string;
  lastPriceBookSyncRun: string;
  lastMetadataSyncRun: string;
  lastSpecificProductsSyncRun: string;
};

declare type ImsData = {
  profile: Object;
  org: string;
  token: string;
};
