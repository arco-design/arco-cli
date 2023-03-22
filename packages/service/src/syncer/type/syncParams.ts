export type SyncParams = {
  name: string;
  title: string;
  description?: string;
  category?: string[];
  repository?: string;
  uiResource?: string;
  group: number;
  author: string;
  package: {
    name: string;
    version: string;
    peerDependencies: string[];
  };
  outline?: Array<{ depth: number; text: string }>;
  _generation: 2;
};
