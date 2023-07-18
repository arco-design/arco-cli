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
   * @zh Spin 组件属性
   * @en Pass by SpinProps
   */
  spinProps?: Partial<SpinProps>;
  /**
   * @zh Iframe onLoad 事件触发回调
   * @en Callback for iframe loaded
   */
  onIframeLoad?: (event) => void;
}

/**
 * @title OverviewHandle
 */
export type OverviewHandle = {
  appendExtraStyle: (href: string) => void;
};
