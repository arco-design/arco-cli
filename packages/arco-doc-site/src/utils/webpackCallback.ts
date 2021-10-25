import { print } from '@arco-design/arco-dev-utils';

export default function webpackCallback(err, stats) {
  if (err) {
    console.error(err.stack || err);
    return;
  }

  print(
    stats.toString({
      assets: true,
      colors: true,
      warnings: true,
      errors: true,
      errorDetails: true,
      entrypoints: true,
      version: true,
      hash: false,
      timings: true,
      chunks: false,
      chunkModules: false,
      children: false,
    })
  );
}
