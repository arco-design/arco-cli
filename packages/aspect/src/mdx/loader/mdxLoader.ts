import { compile, MDXCompilerOptions } from './mdxCompiler';

export type MDXLoaderOptions = {
  preProcessFile?: (file: { content: string; path: string }) => string;
} & Partial<MDXCompilerOptions>;

/**
 * arco mdx webpack loader.
 * this loader allows compilation of Arco flavoured MDX in webpack.
 */
export async function mdxLoader(content: string) {
  const callback = this.async();
  const filePath = this.resourcePath;
  const { preProcessFile, ...compileOptions }: MDXLoaderOptions = {
    ...this.getOptions(),
  };

  if (typeof preProcessFile === 'function') {
    content = preProcessFile({ content, path: filePath }) ?? content;
  }

  try {
    const output = await compile(content, { ...compileOptions, filePath });
    return callback(null, output.contents);
  } catch (err: any) {
    return callback(err, null);
  }
}
