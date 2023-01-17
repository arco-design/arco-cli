// eslint-disable-next-line import/no-extraneous-dependencies
import React, { createContext, ReactNode, useMemo } from 'react';
import { Spin } from '@arco-design/web-react';
import { ComponentModel } from '@arco-cli/component/dist/ui';
import { LoaderContext, useLoaderApi } from '../globalLoader';

import '../style/global.scss';
import styles from './workspaceContext.module.scss';

type WorkspaceContextType = {
  name: string;
  components: ComponentModel[];
};

export const WorkspaceContext = createContext<WorkspaceContextType>({
  name: '',
  components: [],
});

export function WorkspaceContextProvider(
  props: {
    children: ReactNode;
  } & WorkspaceContextType
) {
  const { name, children } = props;
  const [loaderApi, isLoading] = useLoaderApi();

  const workspaceContextValue = useMemo(() => {
    return { name, components: props.components };
  }, [name, JSON.stringify(props.components)]);

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
