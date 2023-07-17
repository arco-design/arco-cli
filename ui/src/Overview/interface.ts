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
   * @zh Iframe onLoad 事件触发回调
   * @en Callback for iframe loaded
   */
  onIframeLoad?: (event) => void;
  /**
   * @en Pass by SpinProps
   */
  spinProps?: Partial<SpinProps>;
}

/**
 * @title OverviewHandle
 */
export type OverviewHandle = {
  appendExtraStyle: (href: string) => void;
};
