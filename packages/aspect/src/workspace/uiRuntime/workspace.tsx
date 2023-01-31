// eslint-disable-next-line import/no-extraneous-dependencies
import React, { useState } from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import { Route, RouteProps } from 'react-router-dom';
import {
  Navbar,
  SideBar,
  WorkspaceContextProvider,
  WorkspaceOverview,
} from '@arco-cli/ui-foundation-react';

import { SlotRouter } from '@aspect/react-router/uiRuntime';

import { useWorkspace } from './hooks/useWorkspace';

import styles from './style/workspace.module.scss';

interface WorkspaceProps {
  routes: RouteProps[];
}

export function Workspace({ routes }: WorkspaceProps) {
  const [componentId, setComponentId] = useState(null);
  const { workspace } = useWorkspace();

  if (!workspace) {
    return <div className={styles.emptyContainer} />;
  }

  return (
    <WorkspaceContextProvider name={workspace.name} components={workspace.components}>
      <div className={styles.workspaceWrapper}>
        <Navbar title={workspace.name} />
        <main className={styles.main}>
          <SideBar
            componentMenuProps={{ onComponentChange: (componentId) => setComponentId(componentId) }}
          />
          <div className={styles.overview}>
            <SlotRouter key={componentId} routes={routes}>
              <Route index element={<WorkspaceOverview />} />
            </SlotRouter>
          </div>
        </main>
      </div>
    </WorkspaceContextProvider>
  );
}
