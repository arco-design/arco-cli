const ARCO_DESIGN_PACKAGE = '@arco-design/web-react';
const ARCO_DESIGN_DIST = 'arco';
const ARCO_DESIGN_ICON_DIST = 'arcoicon';

export default function (context, request, callback) {
  // Compatible with webpack 5, its parameter is ({ context, request }, callback)
  if (typeof request === 'function' && context.request) {
    callback = request;
    request = context.request;
  }

  const getExternal = (packageName, dist, iconDist) => {
    if (request === packageName) {
      return {
        root: dist,
        commonjs: request,
        commonjs2: request,
      };
    }

    if (request === `${packageName}/icon`) {
      return {
        root: iconDist,
        commonjs: request,
        commonjs2: request,
      };
    }
  };

  const external = getExternal(ARCO_DESIGN_PACKAGE, ARCO_DESIGN_DIST, ARCO_DESIGN_ICON_DIST);

  if (external) {
    return callback(null, external);
  }

  callback();
}
