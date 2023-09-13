import { CSSProperties, MutableRefObject } from 'react';
import { SpinProps } from '@arco-design/web-react';

/**
 * @title Overview
 */
export interface OverviewProps {
  style?: CSSProperties;
  className?: string | string[];
  /**
   * @zh Iframe 页面地址
   * @en Iframe src
   */
  src: string;
  /**
   * @zh 需要向 Iframe 额外注入的内容
   * @en Extra style append to iframe
   */
  extraStyle?: string;
  /**
   * @zh 是否为 Arco 暗色模式
   * @en Whether is Arco dark mode
   */
  darkMode?: boolean;
  /**
   * @zh Iframe 引用
   * @zh Reference of iframe element
   */
  iframe?: MutableRefObject<HTMLIFrameElement>;
  /**
   * @zh 包裹 iframe 进行滚动的容器
   * @en Scroll container of iframe
   */
  scrollContainer?: string | Window | HTMLElement;
  /**
   * @zh 滚动容器的偏移量
   * @en Offset of scroll container
   */
  scrollContainerOffset?: number;
  /**
   * @zh 物料预览加载超时时间
   * @en Timeout for loading preview
   * @default 15000
   */
  timeout?: number;
  /**
   * @zh Spin 组件属性
   * @en Pass by SpinProps
   */
  spinProps?: Partial<SpinProps>;
  /**
   * @zh 预览加载超时回调
   * @en Callback for preview loaded timeout
   */
  onTimeout?: () => void;
  /**
   * @zh Iframe onLoad 事件触发回调
   * @en Callback for iframe loaded
   */
  onIframeLoad?: (event) => void;
  /**
   * @zh Iframe onError 事件回调
   * @en Callback for iframe onError
   */
  onIframeError?: (event) => void;
}

/**
 * @title OverviewHandle
 */
export type OverviewHandle = {
  appendExtraStyle: (href: string) => void;
};
