// eslint-disable-next-line import/no-extraneous-dependencies
import React, { ReactNode } from 'react';
import { Spin } from '@arco-design/web-react';
import { LoaderContext, useLoaderApi } from '../globalLoader';

import '../style/global.scss';
import styles from './index.module.scss';

export function ClientContext({ children }: { children: ReactNode }) {
  const [loaderApi, isLoading] = useLoaderApi();

  return (
    <React.StrictMode>
      <LoaderContext.Provider value={loaderApi}>
        <Spin loading={isLoading} className={styles.loader}>
          {children}
        </Spin>
      </LoaderContext.Provider>
    </React.StrictMode>
  );
}
