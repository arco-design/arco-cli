import { ComponentModel } from '../componentModel';
import { ComponentError } from '../componentError';
import { useComponentQuery } from './useComponentQuery';

export type Component = {
  component?: ComponentModel;
  error?: ComponentError;
  loading?: boolean;
};

export type UseComponentOptions = {
  skip?: boolean;
};

export function useComponent(host: string, id?: string, options?: UseComponentOptions): Component {
  const { skip } = options || {};
  return useComponentQuery(id || '', host, skip || !id);
}
