import {
  useQuery,
  OperationVariables,
  QueryResult,
  QueryHookOptions,
  DocumentNode,
} from '@apollo/client';
import { Message } from '@arco-design/web-react';
import { useLoader } from '../globalLoader';

export type DataQueryResult<TData = any, TVariables = OperationVariables> = QueryResult<
  TData,
  TVariables
>;

export function useDataQuery<TData = any, TVariables = OperationVariables>(
  query: DocumentNode,
  options?: QueryHookOptions<TData, TVariables>
): QueryResult<TData, TVariables> {
  const res = useQuery(query, options);
  const { loading, error } = res;

  useLoader(loading);

  if (error) {
    Message.error(error.toString());
  }

  return res;
}
