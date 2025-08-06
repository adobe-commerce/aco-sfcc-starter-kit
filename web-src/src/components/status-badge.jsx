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
import { Flex, ProgressCircle, Text, Badge } from '@adobe/react-spectrum';
import CheckmarkCircle from '@spectrum-icons/workflow/CheckmarkCircle';
import AlertCircle from '@spectrum-icons/workflow/AlertCircle';

export function StatusBadge({ status, lastRun, lastSync }) {
  const formatLastRun = isoString => {
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  return (
    <Flex gap="size-100" alignItems="center">
      {lastSync && status === 'idle' && (
        <Badge variant="neutral">
          <Text>Last Sync: {formatLastRun(lastSync)}</Text>
        </Badge>
      )}
      {!lastSync && status === 'idle' && (
        <Badge variant="neutral">
          <Text>Not Run</Text>
        </Badge>
      )}
      {status === 'running' && (
        <>
          <ProgressCircle size="S" aria-label="Requesting..." isIndeterminate />
          <Text marginStart="size-100">Requesting...</Text>
        </>
      )}
      {status === 'error' && (
        <Badge variant="negative">
          <AlertCircle size="S" />
          <Text>Sync Request Failed</Text>
        </Badge>
      )}
      {status === 'success' && (
        <Badge variant="positive">
          <CheckmarkCircle size="S" />
          <Text>Sync Requested: {lastRun}</Text>
        </Badge>
      )}
    </Flex>
  );
}
