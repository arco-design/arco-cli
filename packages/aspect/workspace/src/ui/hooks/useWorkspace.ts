import { gql } from '@apollo/client';
import { useDataQuery } from '@arco-cli/ui-foundation-react/dist/hooks/useDataQuery';
import { useMemo } from 'react';
import { WorkspaceModel } from '../workspaceModel';

const wcComponentFields = gql`
  fragment wcComponentFields on Component {
    id
    name
    packageName
    version
  }
`;

const WORKSPACE = gql`
  query workspace {
    workspace {
      name
      path
      components {
        ...wcComponentFields
      }
    }
  }
  ${wcComponentFields}
`;

export function useWorkspace() {
  const { data } = useDataQuery(WORKSPACE);

  const workspace = useMemo(() => {
    return data?.workspace ? WorkspaceModel.from(data.workspace) : null;
  }, [data?.workspace]);

  return {
    workspace,
  };
}
