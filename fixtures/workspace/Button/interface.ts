import { ReactNode } from 'react';

/**
 * @title Button
 */
export interface ButtonProps {
  /**
   * @zh 按钮尺寸
   * @en Size of Button
   * @version 2.0.0
   * @defaultValue 'small'
   */
  size?: 'large' | 'small' | 'mini';
  /**
   * @zh 按钮装填
   * @en Status of Button
   */
  status?: 'success' | 'warning' | 'danger';
  /**
   * @zh 按钮内容
   * @en Content of Button
   */
  content?: ReactNode;
}
