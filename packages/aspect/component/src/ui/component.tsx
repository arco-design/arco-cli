// eslint-disable-next-line import/no-extraneous-dependencies
import React, { useMemo, ReactNode, useEffect } from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import { RouteProps } from 'react-router-dom';
import { SlotRegistry } from '@arco-cli/stone';
import { flatten } from 'lodash';
import { SlotRouter } from '@arco-cli/react-router/dist/ui';

import { ComponentProvider } from './componentContext';
import { ComponentModel } from './componentModel';
import { useComponentQuery } from './hooks/useComponentQuery';
import { useIdFromLocation } from './hooks/useIdFromLocation';

import style from './component.module.scss';

export type ComponentPageElement = {
  type: 'before' | 'after';
  content: ReactNode;
};

export type ComponentPageSlot = SlotRegistry<ComponentPageElement[]>;

export type ComponentProps = {
  host: string;
  path?: string;
  componentId: string;
  routes: RouteProps[];
  containerSlot?: ComponentPageSlot;
  onComponentChange?: (activeComponent?: ComponentModel) => void;
};

export function Component({
  host,
  path,
  containerSlot,
  routes,
  componentId,
  onComponentChange,
}: ComponentProps) {
  const idFromLocation = useIdFromLocation();
  const resolvedComponentIdStr = path || idFromLocation;
  const { component, error } = useComponentQuery(host, componentId || idFromLocation);

  useEffect(() => onComponentChange?.(component), [component]);
  // cleanup when unmounting component
  useEffect(() => () => onComponentChange?.(undefined), []);

  const pageItems = useMemo(() => flatten(containerSlot?.values()), [containerSlot]);
  const before = useMemo(
    () => pageItems.filter((x) => x.type === 'before').map((x) => x.content),
    [pageItems]
  );
  const after = useMemo(
    () => pageItems.filter((x) => x.type === 'after').map((x) => x.content),
    [pageItems]
  );

  if (error) {
    return error.renderError();
  }

  if (!component) {
    return null;
  }

  return (
    <ComponentProvider component={component}>
      {before}
      <div className={style.container}>
        {routes ? <SlotRouter parentPath={`${resolvedComponentIdStr}/*`} routes={routes} /> : null}
      </div>
      {after}
    </ComponentProvider>
  );
}
