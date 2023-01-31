import readDirIgnoreDsStore from './readDirIgnoreDsStore';

export default async function isDirEmpty(dirPath: string): Promise<boolean> {
  const files = await readDirIgnoreDsStore(dirPath);
  return !files.length;
}
