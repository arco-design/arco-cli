import gql from 'graphql-tag';
import type { Component } from './component';
import { ComponentMain } from './component.main.runtime';
import { ComponentFactory } from './componentFactory';

export default function (componentExtension: ComponentMain) {
  return {
    typeDefs: gql`
      type Component {
        # id of the component.
        id: String!

        # display name of the component
        name: String!

        # labels of the component
        labels: [String]!

        # package name of the component
        packageName: String!

        # version of the component
        version: String!

        # author of the component
        author: String!

        # additional styles of the component
        extraStyles: [ComponentExtraStyles]!
      }

      type ComponentExtraStyles {
        title: String
        href: String
      }

      type ComponentHost {
        id: String!
        name: String!

        # load a component.
        get(id: String!): Component

        # list components
        list(offset: Int, limit: Int): [Component]!
      }

      type Query {
        getHost(id: String): ComponentHost
      }
    `,
    resolvers: {
      Component: {
        id: (component: Component) => component.id,
        name: (component: Component) => component.name,
        labels: (component: Component) => component.labels,
        version: (component: Component) => component.version,
        packageName: (component: Component) => component.packageName,
        author: (component: Component) => component.author,
      },
      ComponentHost: {
        id: async (host: ComponentFactory) => {
          return host.name;
        },
        name: async (host: ComponentFactory) => {
          return host.name;
        },
        list: async (host: ComponentFactory) => {
          return host.list();
        },
        get: async (host: ComponentFactory, { id }: { id: string }) => {
          try {
            const component = await host.get(id);
            return component;
          } catch (error: any) {
            return null;
          }
        },
      },
      Query: {
        getHost: () => {
          return componentExtension.getHost();
        },
      },
    },
  };
}
