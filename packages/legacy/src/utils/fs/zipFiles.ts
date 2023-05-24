import fs from 'fs-extra';
import archiver from 'archiver';

export function zipFiles(options: {
  sourceDir?: string;
  sourceGlob?: string;
  targetPath: string;
}): Promise<{ size: number; path: string }> {
  return new Promise((resolve, reject) => {
    const { sourceDir, sourceGlob, targetPath } = options;
    const output = fs.createWriteStream(targetPath);
    const archive = archiver('zip', {
      zlib: { level: 9 },
    });

    output.on('close', () => {
      const size = archive.pointer();
      resolve({
        size,
        path: targetPath,
      });
    });

    archive.on('error', (error) => reject(error));
    archive.pipe(output);

    if (sourceDir) {
      if (fs.existsSync(sourceDir)) {
        archive.directory(sourceDir, false);
      } else {
        reject(new Error(`source directory ${sourceDir} does not exist`));
      }
    }

    sourceGlob && archive.glob(sourceGlob);
    archive.finalize();
  });
}
