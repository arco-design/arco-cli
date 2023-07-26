import path, { sep as pathSep } from 'path';
import { parse, assign, stringify } from 'comment-json';
import { readFileSync, writeFileSync } from 'fs-extra';
import { WORKSPACE_JSONC } from './constant';

export function loadConfig(root = process.cwd()) {
  const configPath = path.resolve(root, WORKSPACE_JSONC);
  try {
    return parse(readFileSync(configPath, 'utf8'));
  } catch (err) {
    throw new Error(`Failed to read workspace config.\n${err}`);
  }
}

export function writeConfig(configExtend: Record<string, any>, root = process.cwd()) {
  const configPath = path.resolve(root, WORKSPACE_JSONC);
  const prevConfig = loadConfig();
  const nextConfig = assign(prevConfig, configExtend);
  writeFileSync(configPath, stringify(nextConfig, null, 2));
}

export function isParentDir(parent: string, child: string) {
  parent = parent.replace(/^\/$/, '');
  child = child.replace(/^\/$/, '');
  return parent && child && parent !== child && child.startsWith(parent);
}

export function buildPropagationPaths(absPath: string, endPath?: string): string[] {
  endPath = endPath?.replace(/\/$/, '') || '';

  const paths: string[] = [];
  const pathParts = absPath.split(pathSep);

  pathParts.forEach((_, index) => {
    const part = pathParts.slice(0, index + 1).join('/');
    if (!part || isParentDir(part, endPath)) return;
    paths.push(part);
  });

  return paths.reverse();
}
