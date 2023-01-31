// eslint-disable-next-line import/no-extraneous-dependencies
import React, { PropsWithChildren } from 'react';
import { ApolloProvider, ApolloClient, InMemoryCache } from '@apollo/client';

export function GraphqlProvider({ children }: PropsWithChildren<any>) {
  const client = new ApolloClient({
    uri: '/graphql',
    cache: new InMemoryCache(),
  });

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
