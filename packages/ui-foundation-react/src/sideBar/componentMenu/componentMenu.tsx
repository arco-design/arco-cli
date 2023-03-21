// eslint-disable-next-line import/no-extraneous-dependencies
import React, { ReactNode, useContext, useMemo } from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import { Link } from 'react-router-dom';
import { Menu } from '@arco-design/web-react';
import { IconApps, IconCode, IconFolder } from '@arco-design/web-react/icon';
import { ComponentModel } from '@arco-cli/aspect/dist/component/uiRuntime';

import { WorkspaceContext } from '../../workspaceContext';
import styles from './componentMenu.module.scss';

export interface ComponentMenuProps {
  componentId?: string;
  onComponentChange?: (componentId: string) => void;
}

const MENU_ITEM_OVERVIEW = '__overview';

export function ComponentMenu({ componentId, onComponentChange }: ComponentMenuProps) {
  const { components } = useContext(WorkspaceContext);

  const routeInfo = useMemo(() => {
    const results: Array<{
      key: string;
      title: ReactNode;
      children?: Array<{ key: string; title: ReactNode }>;
    }> = [];

    const groupByPackage: Array<{ package: string; components: ComponentModel[] }> = [];
    for (const component of components.sort((comA, comB) => (comA.id > comB.id ? 1 : -1))) {
      let group = groupByPackage.find((node) => node.package === component.packageName);
      if (!group) {
        group = {
          package: component.packageName,
          components: [],
        };
        groupByPackage.push(group);
      }
      group.components.push(component);
    }

    for (const { package: packageName, components } of groupByPackage) {
      const getMenuItemProps = (component: ComponentModel) => {
        const { id, name } = component;
        return {
          key: id,
          title: (
            <Link to={`/${id}`}>
              <IconCode />
              {name}
            </Link>
          ),
        };
      };

      if (components.length > 1) {
        results.push({
          key: packageName,
          title: (
            <>
              <IconFolder />
              {packageName}
            </>
          ),
          children: components.map(getMenuItemProps),
        });
      } else if (components.length) {
        results.push(getMenuItemProps(components[0]));
      }
    }

    return results;
  }, []);

  return (
    <Menu
      className={styles.componentMenu}
      autoOpen
      mode="vertical"
      selectedKeys={[componentId]}
      onClickMenuItem={onComponentChange}
    >
      <Menu.Item key={MENU_ITEM_OVERVIEW}>
        <Link className={styles.menuItemLink} to="/">
          <IconApps />
          Overview
        </Link>
      </Menu.Item>

      {routeInfo.map(({ key, title, children }) => {
        return children?.length ? (
          <Menu.SubMenu key={key} title={title}>
            {children.map(({ key, title }) => (
              <Menu.Item key={key}>{title}</Menu.Item>
            ))}
          </Menu.SubMenu>
        ) : (
          <Menu.Item key={key}>{title}</Menu.Item>
        );
      })}
    </Menu>
  );
}
