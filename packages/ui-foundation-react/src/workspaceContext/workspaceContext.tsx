// eslint-disable-next-line import/no-extraneous-dependencies
import React, { createContext, ReactNode, useEffect, useMemo, useState } from 'react';
import { Spin } from '@arco-design/web-react';
import { ComponentModel } from '@arco-cli/aspect/dist/component/uiRuntime';
import { LoaderContext, useLoaderApi } from '../globalLoader';
import { LOCAL_STORAGE_KEY_WORKSPACE_DARK_MODE } from '../constants';

import '../style/global.scss';
import styles from './workspaceContext.module.scss';

type WorkspaceContextType = {
  name: string;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  components: ComponentModel[];
  overviewScrollContainerID: string;
};

export const WorkspaceContext = createContext<WorkspaceContextType>({
  name: '',
  darkMode: false,
  setDarkMode: () => {},
  components: [],
  overviewScrollContainerID: '',
});

export function WorkspaceContextProvider(
  props: {
    children: ReactNode;
  } & Pick<WorkspaceContextType, 'name' | 'components' | 'overviewScrollContainerID'>
) {
  const { name, children, overviewScrollContainerID } = props;
  const [loaderApi, isLoading] = useLoaderApi();
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return +localStorage.getItem(LOCAL_STORAGE_KEY_WORKSPACE_DARK_MODE) > 0;
  });

  const workspaceContextValue = useMemo<WorkspaceContextType>(() => {
    return {
      name,
      darkMode,
      setDarkMode: (dark) => {
        setDarkMode(dark);
        localStorage.setItem(LOCAL_STORAGE_KEY_WORKSPACE_DARK_MODE, dark ? '1' : '0');
      },
      overviewScrollContainerID,
      components: props.components,
    };
  }, [name, darkMode, setDarkMode, overviewScrollContainerID, JSON.stringify(props.components)]);

  useEffect(() => {
    darkMode
      ? document.body.setAttribute('arco-theme', 'dark')
      : document.body.removeAttribute('arco-theme');
  }, [darkMode]);

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
