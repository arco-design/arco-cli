// StoneConfig should not be exported to root index.js
// because it can ONLY run in node envs, will cause error in browser
export { StoneConfig, ConfigOptions } from './stoneConfig';
