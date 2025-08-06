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
import { Provider, View, darkTheme, lightTheme } from '@adobe/react-spectrum';
import { ErrorBoundary } from 'react-error-boundary';
import { Route, HashRouter as Router, Routes } from 'react-router-dom';
import { Home } from './pages/home';
import { ImsProvider } from './contexts/ims-context';

function App({ ims, theme }) {
  const initialTheme = theme === 'dark' ? darkTheme : lightTheme;
  const [selectedColorScheme, setSelectedColorScheme] = useState(theme);
  const [selectedTheme, setSelectedTheme] = useState(initialTheme);

  useEffect(() => {
    setSelectedColorScheme(theme);
    setSelectedTheme(theme === 'dark' ? darkTheme : lightTheme);
  }, [theme]);

  const routes = [
    {
      path: '/',
      pageComponent: <Home />,
    },
  ];

  return (
    <ImsProvider ims={ims}>
      <ErrorBoundary FallbackComponent={fallbackComponent}>
        <Provider minHeight="100vh" theme={selectedTheme} colorScheme={selectedColorScheme}>
          <View elementType="main" minHeight="calc(100vh - 48px)" paddingY="size-300" paddingX="size-500">
            <Router>
              <Routes>
                {routes.map(route => (
                  <Route key={route.path} path={route.path} element={route.pageComponent} />
                ))}
              </Routes>
            </Router>
          </View>
        </Provider>
      </ErrorBoundary>
    </ImsProvider>
  );
}

/**
 * The fallback component for the ErrorBoundary.
 *
 * @param {import('react-error-boundary').FallbackProps} props
 */
function fallbackComponent({ error }) {
  return (
    <>
      <h1 style={{ textAlign: 'center', marginTop: '20px' }}>Something went wrong :(</h1>
      <pre>{error.message}</pre>
    </>
  );
}

export default App;
