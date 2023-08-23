import React, { PropsWithChildren } from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import { Routes, Route, RouteProps } from 'react-router-dom';

export type SlotRouterProps = PropsWithChildren<{
  routes?: RouteProps[];
  rootRoutes?: RouteProps[];
  parentPath?: string;
}>;

function toKey(route: RouteProps) {
  if (route.path) return route.path;
  if (route.index) return '/';
  return '.';
}

export function SlotRouter({
  routes: routesFromProps,
  rootRoutes,
  children,
  parentPath,
}: SlotRouterProps) {
  const routes = routesFromProps || [];
  const withRoot = routes.concat(rootRoutes || []);
  const jsxRoutes = withRoot.map((route) => <Route key={toKey(route)} {...route} />);

  if (parentPath) {
    return (
      <Routes>
        <Route path={parentPath}>
          {jsxRoutes}
          {children}
        </Route>
      </Routes>
    );
  }

  return (
    <Routes>
      {jsxRoutes}
      {children}
    </Routes>
  );
}
