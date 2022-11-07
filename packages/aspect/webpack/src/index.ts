import { WebpackAspect } from './webpack.aspect';

export default WebpackAspect;
export { WebpackAspect };
export { WebpackDevServer } from './webpack.devServer';
export type { WebpackConfigWithDevServer } from './webpack.devServer';
export type {
  WebpackMain,
  WebpackConfigTransformer,
  WebpackConfigTransformContext,
  GlobalWebpackConfigTransformContext,
} from './webpack.main.runtime';
export { generateStyleLoaders, GenerateStyleLoadersOptions } from './generateStyleLoader';
export * from './events';
