import { GeneratorContext, TemplateFunction } from '../../types';

const templateFn: TemplateFunction = function ({
  packageName = '',
  version = '0.1.0',
  description = '',
}: GeneratorContext) {
  const packageJson = {
    name: packageName,
    version,
    description,
    main: './lib/index.js',
    module: './es/index.js',
    types: './es/index.d.ts',
    scripts: {
      clean: 'rm -rf es lib artifacts',
    },
    peerDependencies: {
      react: '>=16',
      'react-dom': '^16.0.1',
    },
    dependencies: {},
    sideEffects: ['{es,lib,src}/**/style/*', '*.less'],
    files: ['es', 'lib'],
    license: 'MIT',
  };

  return {
    filename: 'package.json',
    contents: JSON.stringify(packageJson, null, 2),
  };
};

export default templateFn;
