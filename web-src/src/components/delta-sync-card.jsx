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

import React from 'react';
import { View, Heading, Flex, Text, Divider, Button } from '@adobe/react-spectrum';
import Sync from '@spectrum-icons/workflow/Sync';
import DataUpload from '@spectrum-icons/workflow/DataUpload';
import { StatusBadge } from './status-badge';
import { useWebAction } from '../hooks/use-web-action';

const EXTERNAL_EVENT_TYPE = 'sfcc.delta.sync';
const INTERNAL_ACTION_NAME = 'spa/ingestion';

const buildEventPayload = () => ({
  json: {
    data: {
      event: EXTERNAL_EVENT_TYPE,
      value: {
        data: {},
      },
    },
  },
});

export function DeltaSyncCard({ lastSync }) {
  const { status, lastRun, invokeAction } = useWebAction(INTERNAL_ACTION_NAME);

  const handleSync = () => {
    invokeAction(buildEventPayload());
  };

  return (
    <View paddingX="size-250" paddingBottom="size-250" borderRadius="medium" borderWidth="thin" borderColor="gray-300">
      <Heading level={3}>
        <Flex alignItems="center" gap="size-100">
          <DataUpload size="S" />
          <Text>Delta Sync</Text>
        </Flex>
      </Heading>
      <Text>
        Synchronize product, price book, and price changes (delta sync) from a given Salesforce Commerce Cloud site to
        your Adobe Commerce Optimizer instance.
      </Text>
      <Divider size="M" marginTop="size-100" marginBottom="size-150" />
      <View paddingX="size-100" paddingTop="size-100">
        <Flex width="100%" justifyContent="space-between" alignItems="center">
          <StatusBadge status={status} lastRun={lastRun} lastSync={lastSync} />
          <Button variant="accent" isDisabled={status === 'running'} onPress={handleSync}>
            <Sync size="S" />
            <Text>Sync Changes</Text>
          </Button>
        </Flex>
      </View>
    </View>
  );
}
