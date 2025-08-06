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

import React, { useEffect, useState } from "react";
import {
  DialogContainer,
  Dialog,
  Heading,
  Divider,
  Content,
  Grid,
  Well,
  View,
  Button,
  ButtonGroup,
} from "@adobe/react-spectrum";

import SyntaxHighlighter from "react-syntax-highlighter";
import { atomOneLight } from "react-syntax-highlighter/dist/esm/styles/hljs";

import Close from "@spectrum-icons/workflow/Close";

/**
 * The dialog that shows the result of an action invocation.
 * @param {InvokeResultDialogProps} props - The props for the dialog.
 */
export function InvokeResultDialog({
  open,
  onDismiss,
  result,
  title,
  dataKey,
}) {
  /** @type {UseStateHook<Record<string, any>>} */
  const [data, setData] = useState({});

  /** @type {UseStateHook<Record<string, any>>} */
  const [meta, setMeta] = useState({});

  useEffect(() => {
    if (result) {
      const { meta, ...data } = result.data;
      setData(data[dataKey]);
      setMeta(meta);
    }
  }, [result]);

  return (
    <DialogContainer type="fullscreen" onDismiss={onDismiss}>
      {open && (
        <Dialog>
          <Heading>{title}</Heading>
          <Divider />
          <Content>
            <Grid columns={["1fr", "1fr"]} gap="size-200" rows="auto">
              <Well UNSAFE_style={{ paddingBlock: 0 }}>
                <View height="100%">
                  <SyntaxHighlighter
                    language="bash"
                    style={atomOneLight}
                    wrapLines
                    wrapLongLines
                    customStyle={{
                      background: "none",
                    }}
                  >
                    {meta.curlRequest ?? "CURL Request Not Found"}
                  </SyntaxHighlighter>
                </View>
              </Well>
              <Well UNSAFE_style={{ paddingBlock: 0 }}>
                <View height="100%">
                  <SyntaxHighlighter
                    language="json"
                    style={atomOneLight}
                    wrapLines
                    wrapLongLines
                    customStyle={{
                      background: "none",
                    }}
                  >
                    {JSON.stringify(data, null, 2)}
                  </SyntaxHighlighter>
                </View>
              </Well>
            </Grid>
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
