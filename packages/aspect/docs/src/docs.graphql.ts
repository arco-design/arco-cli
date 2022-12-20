import gql from 'graphql-tag';

export default function () {
  return {
    typeDefs: gql`
      extend type Component {
        description: String
        labels: [String]
      }
    `,
    resolvers: {
      Component: {
        description: () => {
          return 'TODO component description';
        },

        labels: () => {
          return ['TODO label', 'TODO label 2'];
        },
      },
    },
  };
}
