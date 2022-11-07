import gql from 'graphql-tag';
import { Workspace } from './workspace';

export default function (workspace: Workspace) {
  return {
    typeDefs: gql`
      type Workspace {
        name: String
        path: String
        components: [Component]
        getComponent(id: String!): Component
      }

      type Query {
        workspace: Workspace
      }
    `,
    resolvers: {
      Workspace: {
        path: (ws) => ws.path,
        name: (ws) => ws.name,
        components: async (ws: Workspace) => {
          return ws.list();
        },
        getComponent: async (ws: Workspace, { id }: { id: string }) => {
          try {
            const component = await ws.get(id);
            return component;
          } catch (error: any) {
            return null;
          }
        },
      },
      Query: {
        workspace: () => workspace,
      },
    },
  };
}
