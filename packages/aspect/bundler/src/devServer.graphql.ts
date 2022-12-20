import gql from 'graphql-tag';
import { Component } from '@arco-cli/component';

import { BundlerMain } from './bundler.main.runtime';

export default function (bundler: BundlerMain) {
  return {
    typeDefs: gql`
      extend type Component {
        server: ComponentServer
      }

      type ComponentServer {
        env: String
        url: String
      }
    `,
    resolvers: {
      Component: {
        server: (component: Component) => {
          const componentServer = bundler.getComponentServer(component);
          return componentServer
            ? {
                env: componentServer.context.envRuntime.id,
                url: componentServer.url,
              }
            : {};
        },
      },
    },
  };
}
