import React, { useRef, useState } from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import { Route, RouteProps } from 'react-router-dom';
import {
  BackTop,
  Navbar,
  SideBar,
  WorkspaceContextProvider,
  WorkspaceOverview,
} from '@arco-cli/ui-foundation-react';

import { SlotRouter } from '@aspect/react-router/uiRuntime';
import { getIdFromLocation } from '@aspect/component/uiRuntime/utils/getIdFromLocation';

import { useWorkspace } from './hooks/useWorkspace';

import styles from './style/workspace.module.scss';

interface WorkspaceProps {
  routes: RouteProps[];
}

const OVERVIEW_SCROLL_CONTAINER_ID = 'a-overview-scroll-container';

export function Workspace({ routes }: WorkspaceProps) {
  const refOverviewContainer = useRef<HTMLDivElement>(null);
  const [componentId, setComponentId] = useState(getIdFromLocation());
  const { workspace } = useWorkspace();

  if (!workspace) {
    return <div className={styles.emptyContainer} />;
  }

  return (
    <WorkspaceContextProvider
      name={workspace.name}
      components={workspace.components}
      overviewScrollContainerID={OVERVIEW_SCROLL_CONTAINER_ID}
    >
      <div className={styles.workspaceWrapper}>
        <Navbar title={workspace.name} />
        <main className={styles.main}>
          <SideBar
            componentMenuProps={{
              componentId,
              onComponentChange: (componentId) => setComponentId(componentId),
            }}
          />
          <div
            ref={refOverviewContainer}
            id={OVERVIEW_SCROLL_CONTAINER_ID}
            className={styles.overview}
          >
            <SlotRouter key={componentId} routes={routes}>
              <Route index element={<WorkspaceOverview />} />
            </SlotRouter>
            <BackTop target={() => refOverviewContainer.current} />
          </div>
        </main>
      </div>
    </WorkspaceContextProvider>
  );
}
