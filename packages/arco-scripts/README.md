# Arco Scripts

[中文版本](https://github.com/arco-design/arco-cli/blob/main/packages/arco-scripts/README.zh-CN.md)

`arco-scripts` is a toolkit for the [Arco Material Project](https://arco.design/material/) that encapsulates functionality for building, testing, automating documentation, and more.

## Install

```bash
npm install arco-scripts -D
````

## Custom config

`arco-scripts` organizes the default configuration internally, but allows users to extend it through configuration files. The configuration file is located in the `.config` directory of the project root directory and has the following structure:

````text
.config
├── babel.config.js (configure Babel)
├── docgen.config.js (configure automatic document generation)
├── jest.config.js (configured unit tests)
├── style.config.js (configuration style, static resource construction)
└── webpack.config.js (configuration project UMD product build)
````

Almost all configuration files follow the form:

````js
/**
 * @param config Default config in arco-scripts
 */
module.exports = (config) => {
  // You can directly modify the config object
  config.xxx = true;
  config.plugins.push('xxx');
  
  // or return a new object as the configuration to use
  return {
    xxx: true,
    plugins: ['xxx'],
  };
};
````

Since unit tests are divided into client tests and node tests, the configuration form of `.config/jest.config.js` is slightly different:

````javascript
// .config/jest.config.js

module.exports = {
  client: (config) => {
    // Return a new config or modify default config directly
  },
  node: (config) => {
    // Return a new config or modify default config directly
  },
};
````

For the default values and parameter descriptions of each configuration, please refer to: https://github.com/arco-design/arco-cli/tree/main/packages/arco-scripts/src/config.

## Build

`arco-scripts` divides the construction of JS files and style files (such as less) into two parts, and observing the directory structure of the product will help us understand the whole process of construction. The build products include three module types: ESModule, CommonJS, and UMD, which correspond to files in the `/es`, `/lib`, and `/dist` directories respectively.

* ESModule (CommonJS and ESModule product directory structure is the same, no additional description)

````text
es/Button
├── index.js (compiled product conforming to ESModule specification)
├── index.d.ts (TS type file)
└── style
    ├── css.js (used for on-demand loading of styles, the file content is similar: import './index.css')
    ├── index.js (for style on-demand loading, the file content is similar: import './index.less')
    ├── index.css (the style product of the current component)
    └── index.less (original style file, .less or .sass)
````

* UMD

````text
dist
├── index.min.js (compiled product conforming to UMD specification)
└── css
    ├── index.css (aggregates the style products of all components)
    └── index.less (original style file that aggregates all components, .less or .sass)
````

### JS build

#### ESM/CJS

ESM/CJS artifacts are compiled with [tsc](https://www.typescriptlang.org/docs/handbook/compiler-options.html) by default, which means that only `.ts(x)` and `.js( x)` file type. If you need to do more compilation with [Babel](https://babeljs.io/), you can tell `arco-scripts` to compile with Babel via the Node Env parameter.

```bash
BUILD_ENV_TS_COMPILER=babel arco-scripts build:component
````

**By default, due to the use of `tsc` for source code compilation, only the configuration in `tsconfig.json` takes effect, and the build process cannot be changed by modifying the Babel configuration. Babel configuration can only be extended via the `.config/babel.config.js` file after you have set up to build with Babel.**

#### UMD

UMD artifacts are built with Webpack, but only include JS artifacts (styles and static resource files are handled by Gulp). You can extend your Webpack configuration via the `.config/webpack.config.js` file.

### style build

`arco-scripts` style builds and static resources are streamed with gulp, extending the default configuration by extending `.config/style.config.js`. E.g:

* Use [sass](https://sass-lang.com/)

````javascript
// .config/style.config.js

const sass = require('gulp-sass')(require('sass'));

module.exports = (config) => {
  config.css.entry = ['src/**/index.sass'];
  config.css.watch.push('src/**/*.sass');
  config.css.compiler = sass;
  config.css.compilerOptions = { /** Sass compiler options */ };
};
````

* use hook


````javascript
// .config/style.config.js

const cssnano = require('cssnano');
const postcss = require('gulp-postcss');
const through = require('through2');

module.exports = (config) => {
  const postcssPlugins = [
    autoprefixer({browsers: ['last 1 version']}),
    cssnano()
  ];
  config.hook.beforeCompile = () => through.obj((file, _, cb) => {
    file.contents = Buffer.from(/** Modify file contents before compile */)
    cb(null, file);
  });
  // Pass in postcss params by `bind()`
  config.hook.afterCompile = postcss.bind(null, postcssPlugins, { /** Postcss options */ });
};
````

## Automatic document generation

The material documentation consists of two areas: component props parameters and sample code. With `arco-scripts`, a complete material documentation can be generated automatically. First, the `/src` directory structure of the material is as follows:

````
src
  ├── TEMPLATE.md
  ├── demo
  │ └── basic.jsx
  ├── index.tsx
  └── style
````

You need to pay attention to `TEMPLATE.md` and `demo`. In projects using TypeScript, `arco-scripts` can quickly generate component interface documentation by extracting comment content. `TEMPLATE.md` Template generated for documentation. Its contents are as follows:

````markdown
---
file: index
---

# TooltipButton

## Properties/Props

%%Props%%

##Demos

%%Demos%%
````

Where `%%Props%%` will be filled in the `Props` parameter of the component after the `docgen` command, and `%%Demos%%` will be filled with the demo code in `/src/demo`. The final generated document is as follows:

````markdown
# TooltipButton

## Properties/Props

### `<TooltipButton>`

| parameter name | description | type | default value |
| ------ | :------------: | :---------: | -----: |
| title | button hint | `ReactNode` | `-` |

##Demos

~~~jsx
import React from 'react';
import TooltipButton from '@arco-design/rc-xxx';

/**
 * Basic usage
 */
export default () => {
  return <TooltipButton title="tooltip title">Demo Basic</TooltipButton>;
};
~~~
````

The `docgen` command generates documentation by parsing the comments in the TypeScript interface, so you need to write comments for the interface in the form of [TSDoc](https://tsdoc.org/).

Since **1.23.0** arco-scripts provides two optional low-level tools ([ts-document](https://www.npmjs.com/package/ts-document), [react-docgen] -typescript](https://www.npmjs.com/package/react-docgen-typescript)) is used for TS parsing. These two tools correspond to two different annotation writing methods. You can specify tools by modifying `.config/docgen.config.js` in the project root directory:

````javascript
// .config/docgen.config.js
module.exports = (config) => {
  // ...
  // ['react-docgen-typescript'] is default
  config.tsParseTool = ['ts-document']
}
````

We **recommended** to use `ts-document`, which is an Arco self-developed tool with better syntax compatibility and dual language support. As you read this document, all newly created material items already use `ts-document` for API parameter extraction by default.

### Using ts-document

Write comments in the following way, all interface or type declarations with `@title` will be extracted. Property annotations have the following tags available:

- Chinese description of the `@zh` attribute
- English description of the `@en` attribute (optional)
- the default value of the `@defaultValue` attribute (optional)
- `@version` The version from which the property was added (optional)

When `@zh` or `@en` is missing, the content in `/** Some comment */` will be extracted as the attribute description.

``` typescript
/**
 * @title Button (required, only interfaces or types described by `title` will be collected)
 */
interfaceButtonProps {
  /**
   * @zh button size (Chinese description of attribute)
   * @en Size of Button (optional, the English description of the property)
   * @version 1.2.0 (optional, in which version the new properties are supported)
   * @defaultValue 'default' (optional, the default value of the property)
   */
  size?: 'mini' | 'small' | 'default' | 'large';

  /**
   * @zh button state
   * @en Status of Button
   */
  status?: 'danger' | 'error' | 'success';
}
````

To generate bilingual documentation, configure `docgen.config.js` as follows:

````javascript
// .config/docgen.config.js
module.exports = (config) => {
  config.tsParseTool = ['ts-document'];
  config.languages = ['zh-CN', 'en-US'];

  // Need to prepare two files TEMPLATE.zh-CN.md and TEMPLATE.en-US.md respectively
  config.template = 'TEMPLATE.[language].md';
  // You can also share the same template file in both Chinese and English (default value)
  // config.template = 'TEMPLATE.md';

  // Will output README.zh-CN.md and README.en-US.md two files
  config.outputFileName = 'README.[language].md';

}
````

### Using react-docgen-typescript

When writing comments in the following way, you need to pay attention to the following aspects:

- Comments must be written in the form of TSDoc (single-line comments in the form // cannot be extracted)
- Components that need to be extracted documents must be additionally exported in the form of `export const Component = (props: ComponentProps) => {}`, otherwise they will not be recognized by the tool;
- Default values must be written in the form `Component.defaultProps = {}` to be picked up by tools.
- If you encounter other problems, please refer to the [react-docgen-typescript](https://github.com/styleguidist/react-docgen-typescript/) repository.

```typescript
interface ButtonProps {
  /**
   * button size
   */
  size?: 'mini' | 'small' | 'default' | 'large';
  /**
   * button state
   */
  status?: 'danger' | 'error' | 'success';
}

// Button needs to be declared as const and exported, otherwise the tool may not recognize it
export const Button = (props: ButtonProps) => {
  // ...
};

// Only default values declared with defaultProps can be picked up by the tool
Button.defaultProps = {
  size: 'default',
};

export default Button;
````

## Unit test

The test function encapsulated by `arco-scripts` is completely inherited from [Jest](https://jestjs.io/), and the default configuration can be extended by modifying `.config/jest.config.js`. At the same time, both `arco-scripts test:client` and `arco-scripts test:node` commands can pass [Jest CLI parameters](https://jestjs.io/docs/cli#--bail) in full.

```bash
# Pass Jest CLI parameters
arco-scripts test:clent --watch
````
