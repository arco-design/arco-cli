import gql from 'graphql-tag';
import { Component } from './component';

export default function () {
  return {
    typeDefs: gql`
      type Component {
        # id of the component.
        id: String!

        # display name of the component
        name: String!

        # package name of the component
        packageName: String!

        # version of the component
        version: String!
      }
    `,
    resolvers: {
      Component: {
        id: (component: Component) => component.id,
        name: (component: Component) => component.name,
        version: (component: Component) => component.version,
        packageName: (component: Component) => component.packageName,
      },
    },
  };
}
