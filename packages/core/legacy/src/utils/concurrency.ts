const CONCURRENT_IO_LIMIT = 100;
const CONCURRENT_COMPONENTS_LIMIT = 50;
const CONCURRENT_FETCH_LIMIT = 15;

/**
 * limit number of files to read/write/delete/symlink at the same time
 */
export function concurrentIOLimit(): number {
  return CONCURRENT_IO_LIMIT;
}

/**
 * limit number of components to load at the same time
 */
export function concurrentComponentsLimit(): number {
  return CONCURRENT_COMPONENTS_LIMIT;
}

/**
 * limit number of scopes to fetch from at the same time
 */
export function concurrentFetchLimit(): number {
  return CONCURRENT_FETCH_LIMIT;
}
