import * as express from 'express';
import logger from '@arco-cli/legacy/dist/logger/logger';

interface ResponseError {
  status?: number;
  message?: string;
}

function handleError(
  err: ResponseError,
  req: express.Request,
  res: express.Response,
  // Do not remove unused next, it's needed for express to catch errors!
  _next: express.NextFunction
) {
  logger.error(`express.errorHandle, url ${req.url}, error:`, err);
  err.status = err.status || 500;
  res.status(err.status);
  return res.jsonp({
    message: err.message,
    error: err,
  });
}

export const catchErrors =
  (action: any) => (req: express.Request, res: express.Response, next: express.NextFunction) =>
    action(req, res, next).catch((error: ResponseError) => handleError(error, req, res, next));
