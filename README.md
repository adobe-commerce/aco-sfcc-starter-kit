# ACO SFCC Starter Kit

**Important:** This starter kit requires the installation of a custom SFCC Cartridge:
[int_adobe_commerce_optimizer](https://github.com/adobe-commerce/aco-sfcc-cartridges).

![Starter Kit Flow Diagram](./docs/images/diagram.png)

## App Builder

The ACO SFCC Starter Kit runs on top of [App Builder](https://developer.adobe.com/app-builder/docs/intro_and_overview/).

Also see
[App Builder Architecture](https://developer.adobe.com/app-builder/docs/guides/app_builder_guides/architecture_overview/architecture-overview).

### Getting Started with App Builder

See
[App Builder Getting Started](https://developer.adobe.com/app-builder/docs/get_started/app_builder_get_started/app-builder-intro)
documentation.

## Actions

The ACO SFCC Starter Kit App Builder application provides a series of
[Runtime Actions](https://developer.adobe.com/app-builder/docs/guides/runtime_guides/creating-actions).

Action are defined in the [app.config.yaml](./app.config.yaml) file.

### Asynchronous Actions

Asynchronous actions run in a non-blocking context in the Adobe App Builder Runtime. They have a max timeout of 3 hours.

#### Full Site Sync

This action performs a full synchronization of all products, price books, and prices for the configured SFCC Site ID and
locales.

Location: `actions/full`

Entities Syncronized:

- Metadata
- Products
- Price Books
- Prices

#### Delta Site Sync

This action retrieves recent changes that have been made in SFCC since the last full or delta sync action and
synchonizes them with ACO.

By default, this action is scheduled to run every hour via the
[App Builder Cron](https://developer.adobe.com/app-builder/docs/resources/cron-jobs/lesson2) action configuration.

Location: `actions/delta`

Entities Syncronized:

- Products
- Price Books
- Prices

#### Price Book Sync

This action retrieves all price books in SFCC and syncronized them with ACO.

Location: `actions/price-book`

Entities Syncronized:

- Price Books

#### Metadata Sync

This action reads all metadata defined in the [data/metadata.js](./data/metadata.js) file and synchonized them with ACO
for each locale configured in the `SFCC_LOCALES_TO_SYNC` environment variable.

Location: `actions/metadata`

#### Specific Products Sync

This action retrieves product data for the provided SKUs (SFCC product IDs) from SFCC and synchronizes them with ACO.

Location: `actions/product`

### Synchronous Actions AKA "Web Actions"

Synchronous actions run in a blocking context in the Adobe App Builder Runtime. They have a max timeout of 60 seconds
and are executed from the provided UI.

#### Ingestion Webhook

This action invokes an asynchronous action (like Full Sync) so that it can run in the background instead of the
synchronous web context.

Location: `actions/spa/ingestions`

#### Last Sync Timestamps

This action retrieves the timestamps or all of the last executed sync actions and serves the purpose of providing the
context of when the sync actions were last executed successfully. These values are pulled from AIO state.

Location: `actions/spa/last-sync-timestamps`

#### List Metadata

This action retrieves the metadata that will be syncronized during the Metadata Sync action. To customized the metadata
the starter kit syncronizes with ACO, edit the [data/metadata.js](./data/metadata.js) file.

Location: `actions/spa/list-metadata`

#### Validate Storefront Product Details

This action retrieves syncronized product details from the ACO Storefront API. This can be executed for a given SKU,
price book, and locale from the provided UI in order to validate syncronized data. This validation performs the same
storefront query that would be executed on a PDP page.

Location: `actions/spa/storefront`

#### SFCC Connectivity Check

This action performs a simple authenticated API call to one of the custom SCAPI endpoints. This validation ensures the
sync actions can communicate with SFCC.

Location: `actions/spa/connectivity/salesforce`

#### ACO Connectivity Check

This action performs a call to one of the ACO ingestion endpoints using the
[ACO TS SDK](https://github.com/adobe-commerce/aco-ts-sdk). This validation ensures the sync actions can communicate
with ACO using the SDK.

Location: `actions/spa/connectivity/aco`

## Logging

See the following App Builder documentation for more info:

- [Logging and Monitoring](https://developer.adobe.com/app-builder/docs/guides/runtime_guides/logging-monitoring)
- [Logging and Troubleshooting](https://developer.adobe.com/commerce/extensibility/app-development/best-practices/logging-troubleshooting)

### Tail All Action Logs

```sh
aio rt logs --tail
```

### List Activation Logs

List all runtime actions that have been activated.

```sh
aio rt activation list
```

### View Activation Log by ID

View the logs for a specific `activation_id`.

```sh
aio rt logs ${activation_id}
```

## Working With App State

See
[App Builder App State Docs](https://developer.adobe.com/app-builder/docs/guides/app_builder_guides/application-state).

### State Keys

In order to improve the behavior of the ACO SFCC Starter Kit sync actions, the following state keys are used:

- `lastSyncTimestamp`
- `lastFullSyncRun`
- `lastDeltaSyncRun`
- `lastPriceBookSyncRun`
- `lastMetadataSyncRun`
- `lastSpecificProductsSyncRun`
- `fullSyncInProgress`
- `deltaSyncInProgress`

#### Last Sync Timestamp

The `lastSyncTimestamp` key tracks the last time a full sync or delta sync operation retrieved data from SFCC and is
used as the starting point from which to retrieve SFCC data in future delta sync operations.

- Key: `lastSyncTimestamp`
- Example Value: `2025-07-24T00:13:45.341Z`
- Type: ISO 8601 String

#### Last Full Sync Run

The `lastFullSyncRun` key tracks the last time a full sync was successfully finished.

- Key: `lastFullSyncRun`
- Example Value: `2025-07-24T00:13:45.341Z`
- Type: ISO 8601 String

#### Last Delta Sync Run

The `lastDeltaSyncRun` key tracks the last time a delta sync was successfully finished.

- Key: `lastDeltaSyncRun`
- Example Value: `2025-07-24T00:13:45.341Z`
- Type: ISO 8601 String

#### Last Price Book Sync Run

The `lastPriceBookSyncRun` key tracks the last time a price book sync was successfully finished.

- Key: `lastPriceBookSyncRun`
- Example Value: `2025-07-24T00:13:45.341Z`
- Type: ISO 8601 String

#### Last Metadata Sync Run

The `lastMetadataSyncRun` key tracks the last time a metadata sync was successfully finished.

- Key: `lastMetadataSyncRun`
- Example Value: `2025-07-24T00:13:45.341Z`
- Type: ISO 8601 String

#### Last Specific Product Sync Run

The `lastSpecificProductsSyncRun` key tracks the last time a specific product sync was successfully finished.

- Key: `lastSpecificProductsSyncRun`
- Example Value: `2025-07-24T00:13:45.341Z`
- Type: ISO 8601 String

#### Full Sync In Progress

The `fullSyncInProgress` key indicates if an existing full sync action is already in progress. If this value is `true`
and another full sync or a delta sync operation if requested, it will be skipped.

- Key: `fullSyncInProgress`
- Example Value: `true`
- Type: Boolean

#### Delta Sync In Progress

The `deltaSyncInProgress` key indicates if an existing delta sync action is already in progress. If this value is `true`
and another delta sync or a full sync operation if requested, it will be skipped.

- Key: `deltaSyncInProgress`
- Example Value: `false`
- Type: Boolean

### Get State by Key

```sh
aio app state get lastSyncTimestamp
```

### Delete State by Key

```sh
aio app state delete lastSyncTimestamp
```

## Local Dev

See [App Builder Development](https://developer.adobe.com/app-builder/docs/guides/app_builder_guides/development).

- `aio app dev` to start your local Dev server
- App will run on `localhost:9080` by default

By default the UI will be served locally but actions will be deployed and served from Adobe I/O Runtime.

## Test & Coverage

- Run `aio app test` to run unit tests for ui and actions
- Run `aio app test --e2e` to run e2e tests

## Deployment

See
[App Builder Deployment Overview](https://developer.adobe.com/app-builder/docs/guides/app_builder_guides/deployment/deployment).

- `aio app deploy` to build and deploy all actions on Runtime and static files to CDN
- `aio app undeploy` to undeploy the app

### Event Registration

Run the following command to register your events with your Adobe Dev Console Project:

```sh
npm run onboard
```

## Configuration

See
[App Builder Configuration Files](https://developer.adobe.com/app-builder/docs/guides/app_builder_guides/configuration/configuration).

### `.env`

You can generate this file using the command `aio app use`.

```bash
# This file must **not** be committed to source control

## please provide your Adobe I/O Runtime credentials
# AIO_RUNTIME_AUTH=
# AIO_RUNTIME_NAMESPACE=
```

### `app.config.yaml`

- Main configuration file that defines an application's implementation.
- More information on this file, application configuration, and extension configuration can be found
  [here](https://developer.adobe.com/app-builder/docs/guides/appbuilder-configuration/#appconfigyaml)

#### Action Dependencies

- You have two options to resolve your actions' dependencies:

  1. **Packaged action file**: Add your action's dependencies to the root `package.json` and install them using
     `npm install`. Then set the `function` field in `app.config.yaml` to point to the **entry file** of your action
     folder. We will use `webpack` to package your code and dependencies into a single minified js file. The action will
     then be deployed as a single file. Use this method if you want to reduce the size of your actions.

  2. **Zipped action folder**: In the folder containing the action code add a `package.json` with the action's
     dependencies. Then set the `function` field in `app.config.yaml` to point to the **folder** of that action. We will
     install the required dependencies within that directory and zip the folder before deploying it as a zipped action.
     Use this method if you want to keep your action's dependencies separated.

## Debugging in VS Code

While running your local server (`aio app dev`), both UI and actions can be debugged, to do so open the vscode debugger
and select the debugging configuration called `WebAndActions`. Alternatively, there are also debug configs for only UI
and each separate action.

## Typescript support for UI

To use typescript use `.tsx` extension for react components and add a `tsconfig.json` and make sure you have the below
config added:

```
 {
  "compilerOptions": {
      "jsx": "react"
    }
  }
```
