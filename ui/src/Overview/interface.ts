import { CSSProperties } from 'react';

/**
 * @title Overview
 */
export interface OverviewProps {
  style?: CSSProperties;
  className?: string | string[];
  /**
   * @zh 组件尺寸
   * @en Component Size
   * @defaultValue default
   * @version 1.1.0
   */
  size?: 'small' | 'default' | 'large';
}
