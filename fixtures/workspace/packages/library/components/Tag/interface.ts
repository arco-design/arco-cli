import { ReactNode } from 'react';

/**
 * @title Tag
 */
export interface TagProps {
  /**
   * @zh 按钮尺寸
   * @en Size of Tag
   * @version 2.0.0
   * @defaultValue 'small'
   */
  size?: 'large' | 'small' | 'mini';
  /**
   * @zh 按钮装填
   * @en Status of Tag
   */
  status?: 'success' | 'warning' | 'danger';
  /**
   * @zh 按钮内容
   * @en Content of Tag
   */
  content?: ReactNode;
}
