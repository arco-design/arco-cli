import fs from 'fs';
import http from 'http';
import path from 'path';

export default (port = 9000) => {
  http
    .createServer(function (req, res) {
      const fileName = path.resolve(process.cwd(), `.${req.url}`);
      const extName = path.extname(fileName).substr(1);

      const mineTypeMap = {
        html: 'text/html;charset=utf-8',
        htm: 'text/html;charset=utf-8',
        xml: 'text/xml;charset=utf-8',
        md: 'text/markdown;charset=utf-8',
        css: 'text/css;charset=utf-8',
        txt: 'text/plain;charset=utf-8',
        png: 'image/png',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        gif: 'image/gif',
        mp3: 'audio/mpeg',
        mp4: 'video/mp4',
        ico: 'image/x-icon',
        tif: 'image/tiff',
        svg: 'image/svg+xml',
        zip: 'application/zip',
        ttf: 'font/ttf',
        woff: 'font/woff',
        woff2: 'font/woff2',
      };

      res.setHeader('Access-Control-Allow-Origin', '*');
      if (mineTypeMap[extName]) {
        res.setHeader('Content-Type', mineTypeMap[extName]);
      }

      try {
        const fileContent = fs.readFileSync(fileName);
        res.write(fileContent, 'binary');
      } catch (err) {
        res.writeHead(404, 'Not Found');
      }

      res.end();
    })
    .listen(port);

  console.log(`File Server Started At http://localhost:${port}`);
};
