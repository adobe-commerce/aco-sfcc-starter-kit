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
import { View, Heading, Flex, Text, TextField, Divider, Button, ProgressCircle, Badge } from '@adobe/react-spectrum';

import { useWebAction } from '../hooks/use-web-action';
import { InvokeResultDialog } from './invoke-result-dialog';

import AlertCircle from '@spectrum-icons/workflow/AlertCircle';
import CheckmarkCircle from '@spectrum-icons/workflow/CheckmarkCircle';
import ViewList from '@spectrum-icons/workflow/ViewList';

/** The card to call the search retrieval runtime action. */
export function SearchApiCard() {
  const [searchTerm, setSearchTerm] = useState('Batteries');
  const [pricebookId, setPricebookId] = useState('west_coast_inc');
  const { status, lastRun, result, response, invokeAction } = useWebAction('spa/storefront-search', {
    json: {
      data: {
        searchTerm,
        pricebookId,
      },
    },
  });

  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (response?.ok) {
      setOpen(true);
    }
  }, [response]);
  return (
    <View paddingX="size-250" paddingBottom="size-250" borderRadius="medium" borderWidth="thin" borderColor="gray-300">
      <Heading level={3}>
        <Flex alignItems="center" gap="size-100">
          <ViewList size="S" />
          <Text>Validate Product Search</Text>
        </Flex>
      </Heading>
      <Text>
        Input the search term you want to retrieve the products for. You must also specify the ID of a price book in
        order to correctly retrieve the prices.
      </Text>

      <View paddingY="size-200">
        <Flex direction="column" width="100%" gap="size-200" alignItems="center">
          <TextField
            width="100%"
            label="Search Term"
            value={searchTerm}
            onChange={value => {
              setSearchTerm(`${value}`);
            }}
          />

          <TextField
            width="100%"
            label="Pricebook ID"
            value={pricebookId}
            onChange={value => {
              setPricebookId(`${value}`);
            }}
          />
        </Flex>
      </View>

      <Divider size="M" marginY="size-250" />

      <View paddingX="size-100">
        <Flex gap="size-100" justifyContent="space-between" alignItems="center">
          {status === 'running' ? (
            <Flex gap="size-100" alignItems="center">
              <ProgressCircle size="S" aria-label="Running..." isIndeterminate />
              <Text>Running...</Text>
            </Flex>
          ) : lastRun !== 'never' ? (
            response?.ok ? (
              <Badge variant="positive">
                <CheckmarkCircle size="S" />
                <Text>Success: {lastRun}</Text>
              </Badge>
            ) : (
              <Badge variant="negative">
                <AlertCircle size="S" />
                <Text>Failed: {lastRun}</Text>
              </Badge>
            )
          ) : (
            <Badge variant="neutral">
              <Text>Not Run</Text>
            </Badge>
          )}
          <>
            <Button
              onPress={() => invokeAction()}
              variant="accent"
              isDisabled={!searchTerm || !pricebookId || status === 'running'}
            >
              <Text>Get Data</Text>
            </Button>
            <InvokeResultDialog
              open={open}
              onDismiss={() => setOpen(false)}
              result={result}
              title={`Search results for: ${searchTerm}`}
              dataKey="products"
            />
          </>
        </Flex>
      </View>
    </View>
  );
}
