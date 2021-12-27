import { ExternalSourceInfo } from '@arco-design/arco-material-preview-utils';

export { Configuration as WebpackConfig } from 'webpack';

export interface MainConfig {
  /**
   * Build config for site
   * @zh 站点构建配置
   */
  build: {
    /**
     * Rules to match the path of document and demos
     * @zh 配置文档和 Demo 的路径
     */
    globs: {
      /**
       * Glob pattern of pure document
       * @zh 纯文档的 Glob 匹配符
       */
      doc: string;
      /**
       * Glob patterns of component
       * @zh 组件相关的 Glob 匹配规则
       */
      component: {
        /**
         * Glob pattern to math the path of component
         * @zh 组件目录的 Glob 匹配符
         * @e.g ../components/*
         */
        base: string;
        /**
         * Glob pattern of component demos
         * @zh 组件 Demo 的 Glob 匹配符
         * @e.g demo/index.js
         */
        demo: string;
        /**
         * Glob pattern of component document
         * @zh 组件文档的 Glob 匹配符
         * @e.g README.md
         */
        doc?: string;
        /**
         * Path of component style
         * @zh 组件样式路径
         * @e.g style/index.less
         */
        style?: string;
      };
      /**
       * Hooks to execute when demos are rendered
       * @zh Demo 渲染时执行的钩子函数
       */
      hook?: {
        /**
         * Callback function executed before all demos are rendered
         * @zh 在所有 Demo 渲染之前执行的回调函数
         */
        beforeAll?: string;
        /**
         * Callback function executed before each demo is rendered
         * @zh 在每个 Demo 渲染之前执行的回调函数
         */
        beforeEach?: string;
      };
    };
    /**
     * Whether to import material style file
     * @zh 是否将组件的样式一同打包
     */
    withMaterialStyle?: boolean;
    /**
     * Options for development mode
     * @zh 站点 Dev 模式时的配置
     */
    devOptions?: {
      /**
       * Whether to auto import Arco library style
       * @zh 是否自动注入 Arco 组件库的样式
       * @default true
       */
      withArcoStyle?: boolean;
    };
  };
  /**
   * Runtime config for site
   * @zh 站点运行时配置
   */
  site: {
    /**
     * Languages allowed to switch
     * @zh 可切换的语言类型
     * @e.g ['zh-CN', 'en-US']
     */
    languages: string[];
    /**
     * Lark group id for on call
     * @zh 飞书 onCall 群的 ID
     */
    larkGroupID: string;
    /**
     * Whether switching themes is allowed
     * @zh 是否允许切换主题
     */
    allowThemeToggle: boolean;
    /**
     * Config of material demos
     * @zh 页面 Demo 的配置
     */
    demo?: {
      /**
       * Whether demos are editable
       * @zh Demo 是否允许编辑调试
       */
      editable?: boolean;
      /**
       * Default external info of code editor
       * @zh Demo 编辑器默认的 External 资源配置
       */
      defaultExternalList?: ExternalSourceInfo[];
    };
  };
}
