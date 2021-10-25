import path from 'path';
import glob from 'glob';
import fs from 'fs-extra';

/**
 * Get real file path of the referenced JS module
 * @param requirePath Original require path
 * @param requireFrom Which directory to resolve from
 */
export default function getRealRequirePath(requirePath: string, requireFrom = process.cwd()) {
  const validTails = [
    '.js',
    '.ts',
    '.jsx',
    '.tsx',
    '/index.js',
    '/index.ts',
    '/index.jsx',
    '/index.tsx',
  ];

  try {
    if (!fs.lstatSync(requireFrom).isDirectory()) {
      requireFrom = path.dirname(requireFrom);
    }
  } catch (e) {}

  return glob.sync(
    path.resolve(
      requireFrom,
      requirePath.match(/.[jt]sx?$/) ? requirePath : `${requirePath}{${validTails.join(',')}}`
    )
  );
}
