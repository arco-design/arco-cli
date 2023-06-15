/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const path = require('path');

module.exports = function (componentInfo) {
  const { path: pathComponentEntry, modules } = componentInfo || {};

  let pathLibraryEntry = path.resolve(pathComponentEntry, '../index.ts');
  if (!fs.existsSync(pathLibraryEntry)) {
    pathLibraryEntry = path.resolve(pathLibraryEntry, '../index.tsx');
  }

  if (fs.existsSync(pathLibraryEntry) && fs.existsSync(pathComponentEntry)) {
    const libraryEntryContent = fs.readFileSync(pathLibraryEntry).toString();
    const exportExpressions = modules
      .map(
        ({ name, type }) =>
          `export${type ? ' type' : ''} { ${name} } from '${path
            .relative(path.dirname(pathLibraryEntry), pathComponentEntry)
            .replace(/^[^.]/, (match) => `./${match}`)}';`
      )
      .join('\n');

    if (libraryEntryContent.indexOf(exportExpressions) === -1) {
      fs.writeFileSync(pathLibraryEntry, `${libraryEntryContent}\n${exportExpressions}\n`);
    }
  }
};
