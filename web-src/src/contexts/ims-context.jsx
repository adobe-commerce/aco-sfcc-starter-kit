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

import React, { createContext, useContext } from 'react';

/** @type {React.Context<ImsData | null>} */
const ImsContext = createContext(null);

/**
 * Provider component for IMS context.
 *
 * @param {Object} props
 * @param {ImsData} props.ims - The IMS data
 * @param {React.ReactNode} props.children - Child components
 * @returns {React.ReactElement}
 */
export function ImsProvider({ ims, children }) {
  return <ImsContext.Provider value={ims}>{children}</ImsContext.Provider>;
}

/**
 * Hook to access IMS data from context.
 *
 * @returns {ImsData} The IMS data
 * @throws {Error} If used outside of ImsProvider
 */
export function useIms() {
  const ims = useContext(ImsContext);

  if (ims === null) {
    throw new Error('useIms must be used within an ImsProvider');
  }

  return ims;
}
