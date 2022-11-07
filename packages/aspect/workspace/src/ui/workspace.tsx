// eslint-disable-next-line import/no-extraneous-dependencies
import React from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import { Route, RouteProps } from 'react-router-dom';
import { Navbar } from '@arco-cli/ui-foundation-react/dist/navbar';
import { SlotRouter } from '@arco-cli/react-router/dist/ui';

import { useWorkspace } from './hooks/useWorkspace';

import style from './style/workspace.module.scss';

interface WorkspaceProps {
  routes: RouteProps[];
}

export function Workspace({ routes }: WorkspaceProps) {
  const { workspace } = useWorkspace();

  if (!workspace) {
    return <div className={style.emptyContainer} />;
  }

  return (
    <div className={style.workspaceWrapper}>
      <Navbar title={workspace.name} />
      <main className={style.main}>
        <div className={style.sidebar}>Sider</div>
        <div className={style.overview}>
          <SlotRouter routes={routes}>
            <Route index element={<h1>Workspace Overview</h1>} />
          </SlotRouter>
        </div>
      </main>
    </div>
  );
}
