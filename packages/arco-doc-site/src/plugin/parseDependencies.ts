/**
 * Parse file dependencies
 */
export default function parseDependencies(statsModules: Array<{ [key: string]: any }>) {
  const result: {
    entry: string[];
    modules: { [key: string]: string[] };
  } = {
    entry: [],
    modules: {},
  };

  const dealUri = (uri) => {
    if (uri && !/^\(webpack\)|^external/.test(uri)) {
      // Ignore whitespace and !./
      uri = uri
        .split(' ')
        .pop()
        .replace(/.*!.\/(.*)/, (_, $1) => $1);

      const match = uri.match(/(.*)\?[^\?]*$/);
      return match ? match[1] : uri;
    }

    return null;
  };

  const dealItem = (item) => {
    const itemName = dealUri(item.name);
    const issuerName = dealUri(item.issuerName);

    if (
      !itemName ||
      (itemName.indexOf('node_modules') > -1 &&
        (!issuerName || issuerName.indexOf('node_modules') > -1))
    ) {
      return;
    }

    const moduleName = item.name;
    result.modules[moduleName] = result.modules[moduleName] || [];

    // Ignore some specific fields
    if (!/babel|\-loader|regenerator-runtime|core-js/.test(moduleName)) {
      item.reasons.forEach((i) => {
        i.moduleName = dealUri(i.moduleName);

        // Ignore entry files
        if (i.type === 'single entry') {
          result.entry.push(moduleName);
          result.entry = [...new Set(result.entry)];
          return false;
        }

        // Ignore packages imported by CJS, node_modules and itself
        if (
          !i.moduleName ||
          i.type === 'cjs require' ||
          i.moduleName === moduleName ||
          i.moduleName.indexOf('node_modules') > -1
        ) {
          return false;
        }

        result.modules[i.moduleName] = result.modules[i.moduleName] || [];
        if (result.modules[i.moduleName].indexOf(moduleName) === -1) {
          result.modules[i.moduleName].push(moduleName);
        }
      });
    }
  };

  const dealModules = (modules) => {
    modules.forEach((item) => (item.modules ? dealModules(item.modules) : dealItem(item)));
  };

  dealModules(statsModules);

  return result;
}
