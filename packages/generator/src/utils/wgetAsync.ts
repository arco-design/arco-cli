import wget from 'wget-improved';

/**
 * Use wget to download files
 */
export async function wgetAsync(
  src: string,
  output: string,
  options?: Record<string, any>
): Promise<string> {
  return new Promise((resolve, reject) => {
    const download = wget.download(src, output, options);
    download.on('error', function (err) {
      reject(err);
    });
    download.on('end', function (output) {
      resolve(output);
    });
  });
}
