
module.exports = {
  "arco.aspect/workspace": {
    "components": {
      "extends": {
        "rootDir": "packages/library/components",
        "author": "zuozhiheng",
        "group": 0,
        "entries": {
          "base": ".",
          "main": "./index.ts",
          "style": "./style/index.less",
          "jsdoc": "./interface.ts",
          "preview": "./__docs__/index.mdx"
        }
      },
      "members": [
        {
          "name": "StandaloneButton",
          "labels": ["a", "b"],
          "rootDir": "packages/button/src"
        },
        {
          "name": "LibraryButton",
          "entries": {
            "base": "./Button"
          }
        },
        {
          "name": "LibraryTag",
          "labels": ["e", "f"],
          "entries": {
            "base": "./Tag"
          }
        }
      ]
    }
  }
}
