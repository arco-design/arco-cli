# Arco Scripts

`arco-scripts` 是一个用于 [Arco 物料项目](https://arco.design/material/) 的工具包，它封装了构建、测试、文档自动化生成等功能。

## 安装

```bash
npm install arco-scripts -D
```

## 配置文件

`arco-scripts` 内部整理了默认的配置，但允许用户通过配置文件进行拓展。配置文件位于项目根目录的 `.config` 目录，结构如下：

```text
.config
├── babel.config.js（配置 Babel）
├── docgen.config.js（配置文档自动化生成）
├── jest.config.js（配置单元测试）
├── style.config.js（配置样式、静态资源构建）
└── webpack.config.js（配置项目 UMD 产物构建）
```

几乎所有的配置文件都遵循了以下形式：

```js
/**
 * @param config Default config in arco-scripts
 */
module.exports = (config) => {
  // 可以直接修改 config 对象
  config.xxx = true;
  config.plugins.push('xxx');
  
  // 或者返回一个新的对象作为需要使用的配置
  return {
    xxx: true,
    plugins: ['xxx'],
  };
};
```

由于单元测试分为 client 测试和 node 测试两种，`.config/jest.config.js` 的配置形式略有不同：

```javascript
// .config/jest.config.js

module.exports = {
  client: (config) => {
    // Return a new config or modify default config directly
  },
  node: (config) => {
    // Return a new config or modify default config directly
  },
};
```

关于各项配置的默认值以及参数说明，可直接参考：https://github.com/arco-design/arco-cli/tree/main/packages/arco-scripts/src/config。

## 构建

`arco-scripts` 将 JS 文件和样式文件（如 less）的构建分为了两部分，观察产物的目录结构将有助于我们理解构建的全过程。构建产物包括 ESModule、CommonJS 和 UMD 三种模块类型，分别对应 `/es`、`/lib`、`/dist` 目录下的文件。

* ESModule 产物（CommonJS 与 ESModule 产物目录结构相同，不作额外说明）

```text
es/Button
├── index.js（合乎 ESModule 规范的编译产物）
├── index.d.ts（TS 类型文件）
└── style
    ├── css.js（用于样式按需加载，文件内容类似：import './index.css'）
    ├── index.js（用于样式按需加载，文件内容类似：import './index.less'）
    ├── index.css（当前组件的样式产物）
    └── index.less（原始样式文件，.less 或者 .sass）
```

* UMD 产物

```text
dist
├── index.min.js（合乎 UMD 规范的编译产物）
└── css
    ├── index.css（聚合了所有组件的样式产物）
    └── index.less（聚合了所有组件的原始样式文件，.less 或者 .sass）
```

### JS 构建

#### ESM/CJS

ESM/CJS 产物默认使用 [tsc](https://www.typescriptlang.org/docs/handbook/compiler-options.html) 进行编译，这意味只能处理 `.ts(x)` 和 `.js(x)` 文件类型。如果你需要使用 [Babel](https://babeljs.io/) 执行更多编译操作，可以通过 Node Env 参数告诉 `arco-scripts` 使用 Babel 进行编译。

```bash
BUILD_ENV_TS_COMPILER=babel arco-scripts build:component
```

**默认情况下，由于使用 `tsc` 进行源码编译，仅 `tsconfig.json` 中的配置生效，无法通过修改 Babel 配置来更改构建流程。在设置使用 Babel 构建后，才可通过 `.config/babel.config.js` 文件扩展 Babel 配置。** 

#### UMD

UMD 产物通过 Webpack 进行构建，但仅仅包括 JS 产物（样式和静态资源文件由 Gulp 处理）。你可以通过 `.config/webpack.config.js` 文件来扩展 Webpack 配置。

### 样式构建

`arco-scripts` 样式构建以及静态资源采用了 gulp 流式处理的方式，通过扩展 `.config/style.config.js` 扩展默认配置。例如：

* 使用 [sass](https://sass-lang.com/)

```javascript
// .config/style.config.js

const sass = require('gulp-sass')(require('sass'));

module.exports = (config) => {
  config.css.entry = ['src/**/index.sass'];
  config.css.watch.push('src/**/*.sass');
  config.css.compiler = sass;
  config.css.compilerOptions = { /** Sass compiler options */ };
};
```

* 使用钩子


```javascript
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
```

## 文档自动化生成

物料文档包含了两个方面：组件 Props 参数和示例代码。通过 `arco-scripts`，一个完善的物料文档可以被自动生成。首先，物料的 `/src` 目录结构如下：

```
src
  ├── TEMPLATE.md
  ├── demo
  │   └── basic.jsx
  ├── index.tsx
  └── style
```

你需要关注的有 `TEMPLATE.md` 和 `demo`，在使用 TypeScript 的项目中，`arco-scripts` 可以通过提取注释内容来快速生成组件接口文档。`TEMPLATE.md` 为文档生成的模板。其内容如下：

```markdown
---
file: index
---

# TooltipButton

## 属性/Props

%%Props%%

## Demos

%%Demos%%
```

其中 `%%Props%%` 会在 `docgen` 命令之后组件的 `Props` 参数填充，`%%Demos%%` 会被 `/src/demo` 中的 Demo 代码填充。最终生成的文档如下：

```markdown
# TooltipButton

## 属性/Props

### `<TooltipButton>`

| 参数名 |    描述    |    类型     | 默认值 |
| ------ | :--------: | :---------: | -----: |
| title  | 按钮的提示 | `ReactNode` |    `-` |

## Demos

~~~jsx
import React from 'react';
import TooltipButton from '@arco-design/rc-xxx';

/**
 * 基本用法
 */
export default () => {
  return <TooltipButton title="tooltip title">Demo Basic</TooltipButton>;
};
~~~
```

`docgen` 命令通过解析 TypeScript interface 中的注释来生成文档，所以需要以 [TSDoc](https://tsdoc.org/) 的形式为 interface 书写注释。

arco-scripts 从 **1.23.0** 开始，提供了两种可选的底层工具（[ts-document](https://www.npmjs.com/package/ts-document), [react-docgen-typescript](https://www.npmjs.com/package/react-docgen-typescript)）用于 TS 解析，这两种工具对应了两种不同的注释写法。你可以通过修改项目根目录的 `.config/docgen.config.js` 来指定工具：

```javascript
// .config/docgen.config.js
module.exports = (config) => {
  // ...
  // ['react-docgen-typescript'] 为默认值
  config.tsParseTool = ['ts-document']
}
```

我们**推荐**使用 `ts-document`，其为 Arco 自研工具，具有更好的语法兼容性和双语言支持。在你阅读此文档时，所有新创建的物料项目已经默认使用 `ts-document` 进行 API 参数提取。

### 使用 ts-document

用以下方式书写注释，所有带有 `@title` 的 interface 或者 type 声明都会被提取。属性注释有以下可用的 tag：

- `@zh` 属性的中文描述
- `@en` 属性的英文描述 （可选）
- `@defaultValue` 属性的默认值 （可选）
- `@version` 该属性是从哪个版本新增的 （可选）

当 `@zh` 或者 `@en` 缺失时，`/** Some comment */` 中的内容会被提取作为属性的描述。

``` typescript
/**
 * @title Button (必填，带有 `title` 描述的接口或者类型才会被收集)
 */
interface ButtonProps {
  /**
   * @zh 按钮尺寸 (属性的中文描述)
   * @en Size of Button (可选，属性的英文描述)
   * @version 1.2.0 (可选，新增的属性在哪个版本开始支持)
   * @defaultValue 'default' (可选，属性的默认值)
   */
  size?: 'mini' | 'small' | 'default' | 'large';

  /**
   * @zh 按钮状态
   * @en Status of Button
   */
  status?: 'danger' | 'error' | 'success';
}
```

如要生成双语言的文档，可对 `docgen.config.js` 进行如下配置：

```javascript
// .config/docgen.config.js
module.exports = (config) => {
  config.tsParseTool = ['ts-document'];
  config.languages = ['zh-CN', 'en-US'];

  // 需分别准备 TEMPLATE.zh-CN.md 和 TEMPLATE.en-US.md 两份文件
  config.template = 'TEMPLATE.[language].md';
  // 也可中英文共用同一份模板文件（默认值）
  // config.template = 'TEMPLATE.md';

  // 将输出 README.zh-CN.md 和 README.en-US.md 两份文件
  config.outputFileName = 'README.[language].md';

}
```

### 使用 react-docgen-typescript

使用如下方式书写注释，需要注意以下方面：

- 必须以 TSDoc 的形式书写注释（// 形式的单行注释无法被提取）
- 需要被提取文档的组件必须以 `export const Component = (props: ComponentProps) => {}` 的形式额外导出，否则不能被工具识别；
- 默认值必须以 `Component.defaultProps = {}` 的形式书写，才能被工具提取。
- 如遇到其他问题，可参考 [react-docgen-typescript](https://github.com/styleguidist/react-docgen-typescript/) 仓库。

```typescript
interface ButtonProps {
  /**
   * 按钮尺寸
   */
  size?: 'mini' | 'small' | 'default' | 'large';
  /**
   * 按钮状态
   */
  status?: 'danger' | 'error' | 'success';
}

// 需要将 Button 以 const 声明，并且 export，否则工具可能识别不到
export const Button = (props: ButtonProps) => {
  // ...
};

// 只有用 defaultProps 声明的默认值才能被工具提取
Button.defaultProps = {
  size: 'default',
};

export default Button;
```

## 单元测试

`arco-scripts` 所封装的测试功能完整继承自 [Jest](https://jestjs.io/), 可以通过修改 `.config/jest.config.js` 扩展默认配置。同时 `arco-scripts test:client` 和 `arco-scripts test:node` 命令都可完整传递 [Jest CLI 参数](https://jestjs.io/docs/cli#--bail) 。

```bash
# 传递 Jest CLI 参数
arco-scripts test:clent --watch
```
