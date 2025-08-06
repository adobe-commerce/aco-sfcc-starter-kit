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

import React, { useEffect } from 'react';
import { View, Grid, Heading, Flex, Text, Button, ProgressCircle, Divider, Link, Badge } from '@adobe/react-spectrum';

import GlobeGrid from '@spectrum-icons/workflow/GlobeGrid';
import CheckmarkCircle from '@spectrum-icons/workflow/CheckmarkCircle';
import AlertCircle from '@spectrum-icons/workflow/AlertCircle';
import Refresh from '@spectrum-icons/workflow/Refresh';

import { useWebAction } from '../hooks/use-web-action';

/**
 * A component to display the connectivity status of an endpoint.
 *
 * @param {ConnectivityCardProps} props The props for the component.
 * @returns {React.ReactNode} The component.
 */
export const ConnectivityCard = ({ title, description, links, endpoint }) => {
  const actionName = `spa/${endpoint}-connectivity`;
  const { status, response, lastRun, invokeAction } = useWebAction(actionName);

  useEffect(() => {
    invokeAction();
  }, [endpoint]);

  return (
    <View paddingX="size-250" paddingBottom="size-250" borderRadius="medium" borderWidth="thin" borderColor="gray-300">
      <Grid columns={['1fr', 'auto']} rows="auto" alignItems="center" justifyContent="space-between">
        <Heading level={3}>
          <Flex alignItems="center" gap="size-100">
            <GlobeGrid size="S" />
            <Text>{title}</Text>
          </Flex>
        </Heading>
        <Flex gap="size-100">
          {links.map((link, index) => (
            <React.Fragment key={link.text}>
              <Link href={link.href} target="_blank">
                <Text>{link.text}</Text>
              </Link>
              {index < links.length - 1 && <Divider size="M" orientation="vertical" />}
            </React.Fragment>
          ))}
        </Flex>
      </Grid>

      <View width="100%">
        <Text>{description}</Text>
        <Divider marginTop="single-line-height" size="M" marginBottom="size-150" />

        <View paddingX="size-100" paddingTop="size-100">
          <Flex width="100%" justifyContent="space-between" alignItems="center">
            <Flex gap="size-100" alignItems="center">
              {status === 'running' ? (
                <>
                  <ProgressCircle size="S" aria-label="Checking..." isIndeterminate />
                  <Text>Checking...</Text>
                </>
              ) : response?.ok ? (
                <Badge variant="positive">
                  <CheckmarkCircle size="S" />
                  <Text>Reachable: {lastRun}</Text>
                </Badge>
              ) : (
                <Badge variant="negative">
                  <AlertCircle size="S" />
                  <Text>Unreachable: {lastRun}</Text>
                </Badge>
              )}
            </Flex>
            <Button onPress={() => invokeAction()} variant="primary" isDisabled={status === 'running'}>
              <Refresh />
              <Text>Check</Text>
            </Button>
          </Flex>
        </View>
      </View>
    </View>
  );
};
