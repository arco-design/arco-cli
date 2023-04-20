module.exports = () => {

  /**
   * @type {import('../../packages/arco/src/types').ArcoEnvConfig}
   */
  const config = {
    'arco.aspect/workspace': {
      components: {
        extends: {
          rootDir: 'packages/library/components',
          author: 'zuozhiheng',
          repository: 'https://my.repository.com',
          uiResource: 'https://example.figma.com',
          labels: ['ui'],
          group: 0,
          entries: {
            base: '.',
            main: './index.ts',
            style: './style/index.less',
            jsdoc: ['./interface.ts', './index.ts'],
            preview: './__docs__/index.mdx',
            extraDocs: [
              {
                title: 'Changelog',
                entry: './__docs__/changelog.md',
              },
            ],
          },
        },
        members: [
          {
            name: 'StandaloneButton',
            rootDir: 'packages/button/src',
          },
          {
            name: 'LibraryButton',
            entries: {
              base: './Button',
            },
          },
          {
            name: 'LibraryTag',
            entries: {
              base: './Tag',
            },
          },
        ],
      },
    },
  };
  return config;
};