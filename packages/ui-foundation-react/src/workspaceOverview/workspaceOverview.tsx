// eslint-disable-next-line import/no-extraneous-dependencies
import React, { useContext } from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import { Link } from 'react-router-dom';
import cs from 'classnames';
import { Avatar, Empty, Tag, Typography } from '@arco-design/web-react';
import { IconTag } from '@arco-design/web-react/icon';
import { WorkspaceContext } from '../workspaceContext';

import styles from './workspaceOverview.module.scss';

const AVAILABLE_AVATAR_COLORS = ['#FF7D00', '#FADC19', '#9FDB1D', '#14C9C9', '#165DFF', '#722ED1'];

export function WorkspaceOverview() {
  const { components } = useContext(WorkspaceContext);
  const isEmpty = !components?.length;

  return (
    <div className={cs(styles.workspaceOverview, { [styles.empty]: isEmpty })}>
      {isEmpty ? (
        <Empty className={styles.emptyPlaceholder} description="No components found" />
      ) : (
        components.map(({ id, name, packageName, version, author, description, labels }) => {
          const avatarText = author || 'Unknown';
          return (
            <Link key={id} className={styles.componentCard} to={`/${id}`}>
              <Avatar
                className={styles.avatar}
                style={{
                  background:
                    AVAILABLE_AVATAR_COLORS[
                      Math.floor(avatarText.length % AVAILABLE_AVATAR_COLORS.length)
                    ],
                }}
              >
                {avatarText}
              </Avatar>
              <div title={name} className={styles.title}>
                <span className={styles.titleText}>{name}</span>
                <Tag size="small">v{version}</Tag>
              </div>
              <div className={styles.packageName}>{packageName}</div>
              <Typography.Paragraph className={styles.description} ellipsis={{ rows: 3 }}>
                {description}
              </Typography.Paragraph>
              <div className={styles.labels}>
                <IconTag />
                {labels.join(' / ')}
              </div>
            </Link>
          );
        })
      )}
    </div>
  );
}
