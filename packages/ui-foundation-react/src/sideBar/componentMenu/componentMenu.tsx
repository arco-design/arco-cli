// eslint-disable-next-line import/no-extraneous-dependencies
import React, { ReactNode, useContext, useMemo, useState } from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import { Link } from 'react-router-dom';
import cs from 'classnames';
import { Divider, Input, Tree } from '@arco-design/web-react';
import { IconApps, IconSearch } from '@arco-design/web-react/icon';
import { ComponentModel } from '@arco-cli/aspect/dist/component/uiRuntime';
import { WorkspaceContext } from '../../workspaceContext';

import IconFolder from '../assets/folder.svg';
import IconFolderOpen from '../assets/folder-open.svg';
import IconFile from '../assets/file.svg';

import styles from './componentMenu.module.scss';

export interface ComponentMenuProps {
  componentId?: string;
  onComponentChange?: (componentId: string) => void;
}

export function ComponentMenu({ componentId, onComponentChange }: ComponentMenuProps) {
  const { components } = useContext(WorkspaceContext);

  const [filterText, setFilterText] = useState('');

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
          title: name,
        };
      };
      const filterRule = ({ key, title }: { key: string; title: string }) => {
        const _searchText = filterText.toLowerCase();
        return filterText
          ? key.toLowerCase().indexOf(_searchText) > -1 ||
              title.toLowerCase().indexOf(_searchText) > -1
          : true;
      };

      if (components.length > 1) {
        const children = components.map(getMenuItemProps).filter(filterRule);
        children.length &&
          results.push({
            key: packageName,
            title: packageName,
            children,
          });
      } else if (components.length) {
        const routeInfo = getMenuItemProps(components[0]);
        const filterResult = filterRule(routeInfo);
        filterResult && results.push(routeInfo);
      }
    }

    return results;
  }, [filterText]);

  return (
    <div className={styles.componentMenu}>
      <Link className={cs(styles.overview, { [styles.active]: !componentId })} to="/">
        <IconApps />
        Overview
      </Link>

      <Input
        className={styles.filter}
        allowClear
        prefix={<IconSearch />}
        value={filterText}
        onChange={setFilterText}
        placeholder="Filter components"
      />

      <Divider className={styles.divider} />

      <div className={styles.treeWrapper}>
        <Tree
          autoExpandParent
          blockNode
          actionOnClick={['select', 'expand']}
          treeData={routeInfo}
          selectedKeys={[componentId]}
          renderTitle={(node) => {
            const key = node.dataRef.key;
            const isFolder = Array.isArray(node.dataRef.children);
            const eleText = (
              <span title={`${node.title}`} className={styles.treeNodeText}>
                {node.title}
              </span>
            );
            return isFolder ? (
              <div className={styles.treeNode}>
                {node.expanded ? <IconFolderOpen /> : <IconFolder />}
                {eleText}
              </div>
            ) : (
              <Link
                className={styles.treeNode}
                to={`/${key}`}
                onClick={() => onComponentChange(key)}
              >
                <IconFile />
                {eleText}
              </Link>
            );
          }}
        />
      </div>
    </div>
  );
}
