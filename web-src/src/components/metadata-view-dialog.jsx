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
import {
  DialogContainer,
  Dialog,
  Heading,
  Divider,
  Content,
  Well,
  View,
  Button,
  ButtonGroup,
  Text,
} from '@adobe/react-spectrum';

import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomOneLight } from 'react-syntax-highlighter/dist/esm/styles/hljs';

import Close from '@spectrum-icons/workflow/Close';

/**
 * The dialog that shows the all metadata that will be synchronized to ACO.
 *
 * @param {Object} props - The props for the dialog.
 * @param {boolean} props.open - Whether the dialog is open.
 * @param {() => void} props.onDismiss - Function to call when dismissing the dialog.
 * @param {Object} props.result - The result from the metadata action.
 */
export function MetadataViewDialog({ open, onDismiss, result }) {
  const metadata = result?.data?.metadata || [];

  return (
    <DialogContainer type="fullscreen" onDismiss={onDismiss}>
      {open && (
        <Dialog>
          <Heading>Predefined Metadata</Heading>
          <Divider />
          <Content>
            <View>
              <Text marginBottom="size-200">
                The following {metadata.length} product metadata definitions will be synchronized to your ACO instance
                for the following locales: {process.env.SFCC_LOCALES_TO_SYNC}.
              </Text>
              <Well UNSAFE_style={{ paddingBlock: 0 }}>
                <View height="100%">
                  <SyntaxHighlighter
                    language="json"
                    style={atomOneLight}
                    wrapLines
                    wrapLongLines
                    customStyle={{
                      background: 'none',
                    }}
                  >
                    {JSON.stringify(metadata, null, 2)}
                  </SyntaxHighlighter>
                </View>
              </Well>
            </View>
          </Content>
          <ButtonGroup>
            <Button aria-label="Close" variant="secondary" onPress={onDismiss}>
              <Close size="S" />
            </Button>
          </ButtonGroup>
        </Dialog>
      )}
    </DialogContainer>
  );
}
