import { ReactNode } from 'react';

/**
 * @title Tag
 */
export interface TagProps {
  /**
   * @zh 标签尺寸
   * @en Size of Tag
   * @version 2.0.0
   * @defaultValue 'small'
   */
  size?: 'large' | 'small' | 'mini';
  /**
   * @zh 标签状态
   * @en Status of Tag
   */
  status?: 'success' | 'warning' | 'danger';
  /**
   * @zh 标签内容
   * @en Content of Tag
   */
  content?: ReactNode;
}
