import { TemplateFunction } from '../../types';

const templateFn: TemplateFunction = function () {
  const config = {
    compilerOptions: {
      allowSyntheticDefaultImports: true,
      downlevelIteration: true,
      esModuleInterop: true,
      experimentalDecorators: true,
      jsx: 'react',
      lib: ['es5', 'dom'],
      moduleResolution: 'node',
      noUnusedLocals: true,
      noUnusedParameters: true,
      skipLibCheck: true,
      target: 'es2015',
      types: ['node', 'jest', '@testing-library/jest-dom'],
    },
    include: ['src/**/*.{ts,tsx}'],
    exclude: ['node_modules'],
  };
  return {
    filename: 'tsconfig.json',
    contents: JSON.stringify(config, null, 2),
  };
};

export default templateFn;
