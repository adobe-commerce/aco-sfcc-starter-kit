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

import React, { useState } from 'react';
import { View, Heading, Flex, Text, Divider, Button, TextArea } from '@adobe/react-spectrum';
import Sync from '@spectrum-icons/workflow/Sync';
import DataUpload from '@spectrum-icons/workflow/DataUpload';
import { StatusBadge } from './status-badge';
import { useWebAction } from '../hooks/use-web-action';

const EXTERNAL_EVENT_TYPE = 'sfcc.product.sync';
const INTERNAL_ACTION_NAME = 'spa/ingestion';

const buildEventPayload = skus => ({
  json: {
    data: {
      event: EXTERNAL_EVENT_TYPE,
      value: {
        data: {
          skus: skus.split(',').map(sku => sku.trim()),
        },
      },
    },
  },
});

export function SyncSpecificProductsCard({ lastSync }) {
  const [skus, setSkus] = useState('aur-flu-bat-mid-2013,aur-flu-bat-mid-2015');
  const { status, lastRun, invokeAction } = useWebAction(INTERNAL_ACTION_NAME);

  const handleSync = () => {
    invokeAction(buildEventPayload(skus));
  };

  return (
    <View
      paddingX="size-250"
      paddingBottom="size-250"
      borderRadius="medium"
      borderWidth="thin"
      borderColor="gray-300"
      height="100%"
    >
      <Flex direction="column" height="100%">
        <Flex direction="column" flex="1">
          <Heading level={3}>
            <Flex alignItems="center" gap="size-100">
              <DataUpload size="S" />
              <Text>Specific Products Sync</Text>
            </Flex>
          </Heading>
          <Text>
            Synchronize the given SKUs from SFCC to your ACO instance. Product details and prices will be synchronized.
          </Text>

          <View paddingY="size-200">
            <TextArea width="100%" label="SKUs (comma separated list up to 25)" value={skus} onChange={setSkus} />
          </View>
        </Flex>

        <Divider size="M" marginY="size-250" />

        <View paddingX="size-100">
          <Flex gap="size-100" justifyContent="space-between" alignItems="center">
            <StatusBadge status={status} lastRun={lastRun} lastSync={lastSync} />
            <Button onPress={handleSync} variant="accent" isDisabled={!skus || status === 'running'}>
              <Sync size="S" />
              <Text>Sync Products</Text>
            </Button>
          </Flex>
        </View>
      </Flex>
    </View>
  );
}
