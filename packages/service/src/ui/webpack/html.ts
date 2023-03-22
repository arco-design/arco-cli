/** fallback html template for the main UI, in case ssr is not active */
export function html(title: string, withDevTools?: boolean) {
  return () => `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="shortcut icon" type="image/x-icon" href="//unpkg.byted-static.com/byted/arco-config/1.0.12/assets/arco_material.ico">
      <title>${title}</title>
      <script>
      ${
        withDevTools
          ? ''
          : 'try { window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = window.parent.__REACT_DEVTOOLS_GLOBAL_HOOK__; } catch {}'
      }
      </script>
    </head>
    <body>
      <div id="root"></div>
    </body>
  </html>  
  `;
}
