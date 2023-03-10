
module.exports = {
  "arco.aspect/workspace": {
    "components": [
      {
        "name": "StandaloneButton",
        "labels": ["a", "b", "c"],
        "author": "zuozhiheng",
        "group": 0,
        "rootDir": "packages/button/src"
      },
      {
        "name": "LibraryButton",
        "labels": ["a", "b", "c"],
        "author": "zuozhiheng",
        "group": 0,
        "rootDir": "packages/library/components",
        "entries": {
          "base": "./Button"
        }
      },
      {
        "name": "LibraryTag",
        "labels": ["a", "b", "c"],
        "author": "zuozhiheng",
        "group": 0,
        "rootDir": "packages/library/components",
        "entries": {
          "base": "./Tag"
        }
      }
    ],
    "defaultComponentEntries": {
      "base": ".",
      "main": "./index.ts",
      "style": "./style/index.less",
      "jsdoc": "./interface.ts",
      "preview": "./__docs__/index.mdx"
    }
  },
  "arco.service/syncer": {
    "defaultMaterialMeta": {
      "group": 1
    }
  }
}
