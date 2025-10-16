/*
  Copyright 2025 Adobe. All rights reserved.
  This file is licensed to you under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License. You may obtain a copy
  of the License at http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software distributed under
  the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
  OF ANY KIND, either express or implied. See the License for the specific language
  governing permissions and limitations under the License.
*/

import React, { useEffect, useState } from 'react';
import { Flex, Grid, Heading, View, Text, Divider } from '@adobe/react-spectrum';
import Actions from '@spectrum-icons/workflow/Actions';
import Code from '@spectrum-icons/workflow/Code';
import Monitoring from '@spectrum-icons/workflow/Monitoring';
import { FullSyncCard } from '../components/full-sync-card';
import { ConnectivityCard } from '../components/connectivity-card';
import { PdpApiCard } from '../components/pdp-api-card';
import { SyncPredefinedMetadataCard } from '../components/sync-predefined-metadata-card';
import { SyncSpecificProductsCard } from '../components/sync-specific-products-card';
import { SyncPriceBooksCard } from '../components/sync-price-books-card';
import { SyncCategoriesCard } from '../components/sync-categories-card';
import { SiteContextCard } from '../components/site-context';
import { DeltaSyncCard } from '../components/delta-sync-card';
import { useWebAction } from '../hooks/use-web-action';

const LAST_SYNC_ACTION_NAME = 'spa/last-sync-timestamps';

export function Home() {
  const { response, result, invokeAction } = useWebAction(LAST_SYNC_ACTION_NAME);
  /** @type {LastSyncTimestamps | Object} */
  const [lastSyncTimestamps, setLastSyncTimestamps] = useState({});

  useEffect(() => {
    invokeAction();
  }, []);

  useEffect(() => {
    if (response?.ok && result?.data) {
      setLastSyncTimestamps(result.data.lastSyncTimestamps);
    }
  }, [response, result]);

  return (
    <View height="100%" marginTop="-30px">
      <Heading level={1} marginBottom="size-100">
        ACO Sync Panel
      </Heading>
      <Text>Synchronize your catalog from Salesforce Commerce Cloud to Adobe Commerce Optimizer.</Text>
      <SiteContextCard />

      <Divider size="M" marginY="size-300" />

      <Grid columns={{ base: ['1fr'], M: ['3fr', '1fr'] }} rows="auto" columnGap="size-300" marginTop="-20px">
        <View borderRadius="medium">
          <View>
            <Heading level={2}>
              <Flex alignItems="center" gap="size-100">
                <Actions size="M" />
                <Text>Sync Actions</Text>
              </Flex>
            </Heading>
            <Grid columns={{ base: ['1fr'], M: ['1fr', '1fr'] }} rows="auto" gap="size-200">
              <FullSyncCard lastSync={lastSyncTimestamps.lastFullSyncRun} />
              <DeltaSyncCard lastSync={lastSyncTimestamps.lastDeltaSyncRun} />
              <SyncPredefinedMetadataCard lastSync={lastSyncTimestamps.lastMetadataSyncRun} />
              <SyncPriceBooksCard lastSync={lastSyncTimestamps.lastPriceBookSyncRun} />
              <SyncCategoriesCard lastSync={lastSyncTimestamps.lastCategorySyncRun} />
              <SyncSpecificProductsCard lastSync={lastSyncTimestamps.lastSpecificProductsSyncRun} />
            </Grid>
          </View>

          <View marginY="size-300">
            <Heading level={2}>
              <Flex alignItems="center" gap="size-100">
                <Monitoring size="M" />
                <Text>System Status</Text>
              </Flex>
            </Heading>
            <Grid columns={{ base: ['1fr'], M: ['1fr', '1fr'] }} rows="auto" gap="size-200">
              <ConnectivityCard
                title="SFCC Connectivity"
                endpoint="salesforce"
                description="Check the connectivity to your SFCC instance."
                links={[
                  {
                    href: `${process.env.SFCC_SITE_URL}`,
                    text: 'Site',
                  },
                  {
                    href: `${process.env.SFCC_ADMIN_SITE_URL}`,
                    text: 'Admin',
                  },
                ]}
              />
              <ConnectivityCard
                title="ACO Connectivity"
                endpoint="aco"
                description="Check the connectivity to your ACO instance."
                links={[
                  {
                    href: `${process.env.ACO_STOREFRONT_URL}`,
                    text: 'Storefront',
                  },
                  {
                    href: `https://experience.adobe.com/#/in:${process.env.ACO_TENANT_ID}/commerce-optimizer-studio/data-sync`,
                    text: 'Admin',
                  },
                ]}
              />
            </Grid>
          </View>
        </View>

        <View borderRadius="medium">
          <Heading level={2}>
            <Flex alignItems="center" gap="size-100">
              <Code size="M" />
              <Text>Storefront API Validation</Text>
            </Flex>
          </Heading>
          <Flex direction="column" height="calc(100% - 64px)" gap="size-200">
            <PdpApiCard />
          </Flex>
        </View>
      </Grid>
    </View>
  );
}
