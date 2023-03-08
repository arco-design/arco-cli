type PreProcessOptions = {
  resolveUrlLoaderPath: string | { path: string; options: Record<string, any> };
  preProcessorPath: string | { path: string; options: Record<string, any> };
};

export type GenerateStyleLoadersOptions = {
  /** the loader injecting the css to the html. style-loader / mini-css-extract-plugin */
  injectingLoader: any;
  cssLoaderPath: string;
  cssLoaderOpts: any;
  postCssLoaderPath: string;
  postCssConfig?: any;
  shouldUseSourceMap?: boolean;
  preProcessOptions?: PreProcessOptions;
};

export function generateStyleLoaders(options: GenerateStyleLoadersOptions) {
  const loaders = [
    {
      loader: options.injectingLoader,
    },
    {
      loader: options.cssLoaderPath,
      options: options.cssLoaderOpts,
    },
    {
      // Options for PostCSS as we reference these options twice
      // Adds vendor prefixing based on your specified browser support in
      // package.json
      loader: options.postCssLoaderPath,
      options: {
        // We don't use the config file way to make it easier to mutate it by other envs
        postcssOptions: options.postCssConfig,
        sourceMap: options.shouldUseSourceMap,
      },
    },
  ].filter(Boolean);

  if (options.preProcessOptions) {
    const { resolveUrlLoaderPath, preProcessorPath } = options.preProcessOptions;
    loaders.push(
      {
        loader:
          typeof resolveUrlLoaderPath === 'object'
            ? resolveUrlLoaderPath.path
            : resolveUrlLoaderPath,
        options: {
          sourceMap: options.shouldUseSourceMap,
          ...(typeof resolveUrlLoaderPath === 'object' ? resolveUrlLoaderPath.options : undefined),
        },
      },
      {
        loader: typeof preProcessorPath === 'object' ? preProcessorPath.path : preProcessorPath,
        options: {
          // resolve-url-loader will report an error if pre-processor doesn't enable sourcemap
          sourceMap: true,
          ...(typeof preProcessorPath === 'object' ? preProcessorPath.options : undefined),
        },
      }
    );
  }

  return loaders;
}
