// eslint-disable-next-line import/no-extraneous-dependencies
import { useMemo, useRef } from 'react';
import gql from 'graphql-tag';
import { useDataQuery } from '@arco-cli/ui-foundation-react/dist/hooks/useDataQuery';

import { ComponentModel } from '../componentModel';
import { ComponentError } from '../componentError';

const componentOverviewFields = gql`
  fragment componentOverviewFields on Component {
    id
    name
    description
    labels
    outline {
      depth
      text
    }
    server {
      env
      url
    }
  }
`;

const componentFields = gql`
  fragment componentFields on Component {
    id
    packageName
    ...componentOverviewFields
  }
  ${componentOverviewFields}
`;

const GET_COMPONENT = gql`
  query Component($id: String!, $extensionId: String!) {
    getHost(id: $extensionId) {
      # used for GQL caching
      id
      get(id: $id) {
        ...componentFields
      }
    }
  }
  ${componentFields}
`;

/**
 * provides data to component ui page, making sure both variables and return value are safely typed and memoized
 */
export function useComponentQuery(componentId: string, host: string, skip?: boolean) {
  const refId = useRef(componentId);
  refId.current = componentId;

  const { data, error, loading } = useDataQuery(GET_COMPONENT, {
    variables: { id: componentId, extensionId: host },
    skip,
  });
  const rawComponent = data?.getHost?.get;

  return useMemo(() => {
    return {
      component: rawComponent ? ComponentModel.from({ ...rawComponent, host }) : undefined,
      error: error
        ? new ComponentError(500, error.message)
        : !rawComponent && !loading
        ? new ComponentError(404)
        : undefined,
      loading,
    };
  }, [rawComponent, host, error]);
}
