// eslint-disable-next-line import/no-extraneous-dependencies
import React, { createContext, ReactNode, useMemo } from 'react';
import { Spin } from '@arco-design/web-react';
import { ComponentModel } from '@arco-cli/aspect/dist/component/uiRuntime';
import { LoaderContext, useLoaderApi } from '../globalLoader';

import '../style/global.scss';
import styles from './workspaceContext.module.scss';

type WorkspaceContextType = {
  name: string;
  components: ComponentModel[];
  overviewScrollContainerID: string;
};

export const WorkspaceContext = createContext<WorkspaceContextType>({
  name: '',
  components: [],
  overviewScrollContainerID: '',
});

export function WorkspaceContextProvider(
  props: {
    children: ReactNode;
  } & WorkspaceContextType
) {
  const { name, children, overviewScrollContainerID } = props;
  const [loaderApi, isLoading] = useLoaderApi();

  const workspaceContextValue = useMemo(() => {
    return { name, overviewScrollContainerID, components: props.components };
  }, [name, overviewScrollContainerID, JSON.stringify(props.components)]);

  return (
    <WorkspaceContext.Provider value={workspaceContextValue}>
      <LoaderContext.Provider value={loaderApi}>
        <Spin loading={isLoading} className={styles.loader}>
          {children}
        </Spin>
      </LoaderContext.Provider>
    </WorkspaceContext.Provider>
  );
}
