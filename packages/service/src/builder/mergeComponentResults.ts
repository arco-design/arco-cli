import { merge } from 'lodash';
import type { ComponentResult } from './types';

type ComponentIndex = {
  [id: string]: ComponentResult;
};

/**
 * merge ComponentResult arrays.
 */
export function mergeComponentResults(resultMatrix: ComponentResult[][]) {
  if (!resultMatrix.length) return [];

  const index: ComponentIndex = {};

  resultMatrix.forEach((results) => {
    results.forEach((result) => {
      const id = result.component.id;
      const existing = index[id] || { warnings: [], errors: [], metadata: {} };

      index[id] = {
        component: result.component,
        warnings: existing.warnings.concat(result.warnings || []),
        errors: existing.errors.concat(result.errors || []),
        metadata: merge(existing.metadata, result.metadata || {}),
      };
    });
  });

  return Object.values(index);
}
