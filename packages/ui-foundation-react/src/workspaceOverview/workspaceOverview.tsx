// eslint-disable-next-line import/no-extraneous-dependencies
import React, { useContext } from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import { Link } from 'react-router-dom';
import { IconApps } from '@arco-design/web-react/icon';
import { WorkspaceContext } from '../workspaceContext';

import styles from './workspaceOverview.module.scss';

export function WorkspaceOverview() {
  const { name, components } = useContext(WorkspaceContext);
  return (
    <div className={styles.workspaceOverview}>
      <div className={styles.workspaceTitle}>
        <IconApps />
        {name}
      </div>

      <div className={styles.gallery}>
        {components.map(({ id, name, packageName }) => {
          return (
            <Link key={id} className={styles.componentCard} to={`/${id}`}>
              <span title={name} className={styles.title}>
                {name}
              </span>
              <span className={styles.packageName}>{packageName}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
