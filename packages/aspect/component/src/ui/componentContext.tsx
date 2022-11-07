// eslint-disable-next-line import/no-extraneous-dependencies
import React, { createContext, PropsWithChildren } from 'react';
import { ComponentModel } from './componentModel';

export const ComponentContext: React.Context<ComponentModel> = createContext<ComponentModel>(
  ComponentModel.empty()
);

export function ComponentProvider({
  component,
  children,
}: PropsWithChildren<{ component: ComponentModel }>) {
  return <ComponentContext.Provider value={component}>{children}</ComponentContext.Provider>;
}
