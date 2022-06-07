import { ExternalSourceInfo } from '@arco-materials/material-preview-utils';
import { ModuleInfo as _ModuleInfo, ModuleInfoOfEntry as _ModuleInfoOfEntry } from './plugin';

export { Configuration as WebpackConfig } from 'webpack';

export type GlobConfigForBuild = {
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
  };
};

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
    globs: GlobConfigForBuild | GlobConfigForBuild[] | Record<string, GlobConfigForBuild>;
    /**
     * Whether to import material style file
     * @zh 是否将组件的样式一同打包
     */
    withMaterialStyle?: boolean;
    /**
     * File path of custom site module
     * @zh 自定义站点模块的文件路径
     */
    customModulePath?: string;
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
    larkGroupID?: string;
    /**
     * Icon package name of Arco Icon Box
     * @zh 关联使用的 Arco 图标平台图标库
     */
    arcoIconBox?: string;
    /**
     * Theme package name of Arco Design Lab
     * @zh 关联使用的 Arco 主题商店主题包名
     */
    arcoDesignLabTheme?: string;
    /**
     * Whether switching dark mode is allowed
     * @zh 是否允许切换亮色/暗色主题
     */
    allowThemeToggle?: boolean;
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
       * Default layout of demo/code zone
       * @zh 默认的预览/代码区域布局
       */
      defaultLayout?: 'horizontal' | 'vertical';
      /**
       * Size of demo viewport (pixel/ratio)
       * @zh 预览区域的默认尺寸（像素/比例）
       * @e.g '200px' | 0.3
       */
      defaultViewportSize?: string | number;
      /**
       * Default external info of code editor
       * @zh Demo 编辑器默认的 External 资源配置
       */
      defaultExternalList?: ExternalSourceInfo[];
    };
    /**
     * Config menu items
     * @zh 配置菜单栏
     */
    menu?: {
      /**
       * The maximum allowed sub-menu level, the excess levels will be displayed in groups
       * @zh 允许的最大菜单层级，超出的层级将以分组的形式展示
       * @default 1
       */
      maxSubMenuLevel?: number;
      /**
       * Sort rule of menu items. The higher the menu item, the higher the priority
       * @zh 菜单排序规则，越靠前的菜单项优先级越高
       * @e.g { guide: ['document2', 'document1'] }
       */
      sortRule?: Record<string, String[]>;
    };
  };
  /**
   * Group info to get remote settings
   * @zh 提供团队信息以获取远程团队设置
   */
  group?: {
    /**
     * Group ID
     * @zh 团队 ID
     */
    id: number;
    /**
     * Whether is private version
     * @zh 是否是内部版本
     */
    private?: boolean;
  };
}

/**
 * Info of help documents
 */
export type DocumentInfo = {
  name: string;
  path: string;
  moduleName?: string;
  children?: DocumentInfo[];
};

/**
 * Info of component/document modules
 */
export type ModuleInfo = _ModuleInfo;

/**
 * Info of entry file
 */
export type ModuleInfoOfEntry = _ModuleInfoOfEntry;

/**
 * Type of arcoSite module
 */
export type ArcoSiteSimple = Record<string, any> & {
  /**
   * Config of team site
   */
  arcoSiteConfig: MainConfig['site'];
  /**
   * Info of components and documents
   */
  arcoSiteModuleInfo: ModuleInfo[];
  /**
   * Info of help document
   */
  arcoSiteDocumentInfo?: DocumentInfo[];
};

/**
 * Type of arcoSite module
 */
export type ArcoSite = Record<string, any> & {
  /**
   * Config of team site
   */
  arcoSiteConfig: MainConfig['site'];
  /**
   * Info of components and documents
   */
  arcoSiteModuleInfo: ModuleInfoOfEntry[];
  /**
   * Info of help document
   */
  arcoSiteDocumentInfo?: Record<string, DocumentInfo[]>;
  /**
   * Custom site module
   */
  arcoSiteCustomModule?: Record<string, any>;
  /**
   * Group info
   */
  arcoSiteGroupInfo?: MainConfig['group'];
  /**
   * Package version of arco-material-doc-site
   */
  arcoSiteToolVersion: string;
};
