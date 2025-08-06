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

import React, { useState, useEffect } from 'react';
import { View, Heading, Flex, Text, Divider, Button } from '@adobe/react-spectrum';
import Sync from '@spectrum-icons/workflow/Sync';
import DataUpload from '@spectrum-icons/workflow/DataUpload';
import ViewDetail from '@spectrum-icons/workflow/ViewDetail';
import { StatusBadge } from './status-badge';
import { MetadataViewDialog } from './metadata-view-dialog';
import { useWebAction } from '../hooks/use-web-action';

const EXTERNAL_EVENT_TYPE = 'sfcc.metadata.sync';
const INTERNAL_ACTION_NAME = 'spa/ingestion';
const LIST_ACTION_NAME = 'spa/list-metadata';

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

export function SyncPredefinedMetadataCard({ lastSync }) {
  const [open, setOpen] = useState(false);
  const { status, lastRun, invokeAction } = useWebAction(INTERNAL_ACTION_NAME);
  const {
    response: listResponse,
    status: listStatus,
    result: listResult,
    invokeAction: invokeListAction,
  } = useWebAction(LIST_ACTION_NAME);

  useEffect(() => {
    if (listResponse?.ok) {
      setOpen(true);
    }
  }, [listResponse]);

  const handleSync = () => {
    invokeAction(buildEventPayload());
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
              <Text>Metadata Sync</Text>
            </Flex>
          </Heading>
          <Text>
            Synchronize predefined product metadata to your ACO instance for the following locales:{' '}
            {process.env.SFCC_LOCALES_TO_SYNC}.
          </Text>
          <View paddingY="size-200">
            <Flex justifyContent="center">
              <Button
                onPress={() =>
                  invokeListAction({
                    json: {
                      data: {},
                    },
                  })
                }
                variant="secondary"
                isDisabled={listStatus === 'running'}
              >
                <ViewDetail size="S" />
                <Text>View Predefined Metadata</Text>
              </Button>
            </Flex>
          </View>
          <Text marginTop="size-100">
            You may update the predefined metadata by editing the <code>data/metadata.js</code> file in your Starter
            Kit.
          </Text>
        </Flex>

        <Divider size="M" marginY="size-250" />
        <View paddingX="size-100">
          <Flex gap="size-100" justifyContent="space-between" alignItems="center">
            <StatusBadge status={status} lastRun={lastRun} lastSync={lastSync} />
            <Button onPress={handleSync} variant="accent" isDisabled={status === 'running'}>
              <Sync size="S" />
              <Text>Sync Metadata</Text>
            </Button>
          </Flex>
        </View>
      </Flex>
      <MetadataViewDialog open={open} onDismiss={() => setOpen(false)} result={listResult} />
    </View>
  );
}
