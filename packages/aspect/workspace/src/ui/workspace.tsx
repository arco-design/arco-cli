// eslint-disable-next-line import/no-extraneous-dependencies
import React from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import { Route, RouteProps } from 'react-router-dom';
import { Navbar } from '@arco-cli/ui-foundation-react/dist/navbar';
import { SlotRouter } from '@arco-cli/react-router/dist/ui';

import { useWorkspace } from './hooks/useWorkspace';

import styles from './style/workspace.module.scss';

interface WorkspaceProps {
  routes: RouteProps[];
}

export function Workspace({ routes }: WorkspaceProps) {
  const { workspace } = useWorkspace();

  if (!workspace) {
    return <div className={styles.emptyContainer} />;
  }

  return (
    <div className={styles.workspaceWrapper}>
      <Navbar title={workspace.name} />
      <main className={styles.main}>
        <div className={styles.sidebar}>
          <ul>
            {workspace.components.map((component) => {
              return <li key={component.id}>{component.name}</li>;
            })}
          </ul>
        </div>
        <div className={styles.overview}>
          <SlotRouter routes={routes}>
            <Route index element={<h1>Workspace Overview</h1>} />
          </SlotRouter>
        </div>
      </main>
    </div>
  );
}
