// eslint-disable-next-line import/no-extraneous-dependencies
import React, { ReactNode, useContext, useMemo } from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import { Link } from 'react-router-dom';
import { Menu } from '@arco-design/web-react';
import { IconApps, IconCode, IconFolder } from '@arco-design/web-react/icon';
import { WorkspaceContext } from '../../workspaceContext';

import styles from './componentMenu.module.scss';

export interface ComponentMenuProps {
  onComponentChange?: (componentId: string) => void;
}

const MENU_ITEM_OVERVIEW = '__overview';

export function ComponentMenu({ onComponentChange }: ComponentMenuProps) {
  const { components } = useContext(WorkspaceContext);

  const routeInfo = useMemo(() => {
    const results: Array<{
      key: string;
      title: ReactNode;
      children: Array<{ key: string; title: ReactNode }>;
    }> = [];

    for (const { id, name, packageName } of components) {
      let group = results.find((node) => node.key === packageName);

      if (!group) {
        group = {
          key: packageName,
          title: (
            <>
              <IconFolder />
              {packageName}
            </>
          ),
          children: [],
        };
        results.push(group);
      }

      group.children.push({
        key: id,
        title: (
          <Link to={`/${id}`}>
            <IconCode />
            {name}
          </Link>
        ),
      });
    }

    return results;
  }, []);

  return (
    <Menu
      className={styles.componentMenu}
      autoOpen
      mode="vertical"
      onClickMenuItem={onComponentChange}
    >
      <Menu.Item key={MENU_ITEM_OVERVIEW}>
        <Link className={styles.menuItemLink} to="/">
          <IconApps />
          Overview
        </Link>
      </Menu.Item>

      {routeInfo.map(({ key, title, children }) => (
        <Menu.SubMenu key={key} title={title}>
          {children.map(({ key, title }) => (
            <Menu.Item key={key}>{title}</Menu.Item>
          ))}
        </Menu.SubMenu>
      ))}
    </Menu>
  );
}
