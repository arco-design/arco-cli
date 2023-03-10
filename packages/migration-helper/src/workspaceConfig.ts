import path from 'path';
import { parse, assign, stringify } from 'comment-json';
import { readFileSync, writeFileSync } from 'fs-extra';
import { WORKSPACE } from './env';

const WORKSPACE_CONFIG_PATH = path.resolve(WORKSPACE, 'arco.workspace.jsonc');

export function loadConfig() {
  try {
    return parse(readFileSync(WORKSPACE_CONFIG_PATH, 'utf8'));
  } catch (err) {
    throw new Error(`Failed to read workspace config.\n${err}`);
  }
}

export function writeConfig(configExtend: Record<string, any>) {
  const prevConfig = loadConfig();
  const nextConfig = assign(prevConfig, configExtend);
  writeFileSync(WORKSPACE_CONFIG_PATH, stringify(nextConfig, null, 2));
}
