// eslint-disable-next-line import/no-extraneous-dependencies
import { useLocation } from 'react-router-dom';

/**
 * hook for using a query string.
 */
export function useQuery() {
  const { search } = useLocation() || { search: '/' };
  return new URLSearchParams(search);
}
