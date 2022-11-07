import { Stone } from './stone';

/**
 * type definition for the extension provider function.
 */
export type ProviderFn = (deps: any, config: any, slots: any, stone: Stone) => any | Promise<any>;
