import { compile } from './mdxCompiler';

/**
 * arco mdx webpack loader.
 * this loader allows compilation of Arco flavoured MDX in webpack.
 */
export async function mdxLoader(content: string) {
  const callback = this.async();
  const options = { ...this.getOptions(), filepath: this.resourcePath };

  try {
    const output = await compile(content, options);
    return callback(null, output.contents);
  } catch (err: any) {
    return callback(err, null);
  }
}
