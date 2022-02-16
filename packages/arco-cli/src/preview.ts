import path from 'path';
import open from 'open';
import fs from 'fs-extra';
import { print, fileServer, getGlobalInfo } from 'arco-cli-dev-utils';

export default function preview({ port = 9003, path: previewPath = '', teamSite = false }) {
  const hostArco = getGlobalInfo().host.arco;
  const query = `localPreviewUrl=http://localhost:${port}${previewPath}`;
  const openBrowser = (url) => {
    open(url);
    console.log(`Visit ${url}`);
  };

  if (teamSite) {
    fileServer(port);
    openBrowser(`${hostArco}/material/team/SitePreview?${query}`);
  } else {
    let packageJson;
    try {
      packageJson = fs.readJsonSync(path.resolve(process.cwd(), 'package.json'));
    } catch (err) {
      if (err.code === 'ENOENT') {
        print.error('[arco preview]', 'No valid package.json found');
      } else {
        print.error(err);
      }
      process.exit(1);
    }
    fileServer(port);
    openBrowser(`${hostArco}/material/detail?name=${packageJson.name}&${query}`);
  }
}
