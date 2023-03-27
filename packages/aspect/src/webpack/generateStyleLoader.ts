export type GenerateStyleLoadersOptions = {
  /** the loader injecting the css to the html. style-loader / mini-css-extract-plugin */
  injectingLoader: any;
  cssLoaderPath: string;
  cssLoaderOpts: any;
  preProcessLoaderPath?: string;
  preProcessLoaderOpts?: any;
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
  ];

  if (options.preProcessLoaderPath) {
    loaders.push({
      loader: options.preProcessLoaderPath,
      options: options.preProcessLoaderOpts,
    });
  }

  return loaders;
}
