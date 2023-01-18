import chalk from 'chalk';
import ArcoError from '../error/arcoError';
// import { Analytics, LEVEL } from '../analytics/analytics';
// import hashErrorIfNeeded from '../error/hashErrorObject';

const errorsMap: Array<[Error, (err: Error) => string]> = [];

function findErrorDefinition(err: Error) {
  return errorsMap.find(([ErrorType]) => {
    // in some cases, such as forked process, the received err is serialized.
    return err instanceof (ErrorType as any) || (err && err.name === ErrorType.name);
  });
}

function getErrorFunc(errorDefinition) {
  if (!errorDefinition) return null;
  const [, func] = errorDefinition;
  return func;
}

function getErrorMessage(
  error: Error | null | undefined,
  func: ((err: Error) => string) | null | undefined
): string {
  if (!error || !func) return '';
  return func(error);
}

/**
 * if err.userError is set, it inherits from AbstractError, which are user errors not Arco errors
 * and should not be reported to Sentry.
 * reason why we don't check (err instanceof AbstractError) is that it could be thrown from a fork,
 * in which case, it loses its class and has only the fields.
 */
// function sendToAnalyticsAndSentry(err: Error) {
//   const possiblyHashedError = hashErrorIfNeeded(err);
//   // @ts-ignore
//   const shouldNotReportToSentry = Boolean(err.isUserError || err.code === 'EACCES');
//   // only level FATAL are reported to Sentry.
//   const level = shouldNotReportToSentry ? LEVEL.INFO : LEVEL.FATAL;
//   Analytics.setError(level, possiblyHashedError);
// }

function handleNonArcoCustomErrors(err: Error): string {
  const { code, path } = err as any;
  if (code === 'EACCES' && path) {
    return chalk.red(
      `error: you do not have permissions to access '${path}', were you running arco, npm or git as root?`
    );
  }
  return chalk.red(err.message || err);
}

export default (err: Error): { message: string; error: Error } => {
  const errorDefinition = findErrorDefinition(err);
  const getErrMsg = (): string => {
    if (err instanceof ArcoError) {
      return err.report();
    }
    if (!errorDefinition) {
      return handleNonArcoCustomErrors(err);
    }
    const func = getErrorFunc(errorDefinition);
    const errorMessage = getErrorMessage(err, func) || 'unknown error';
    err.message = errorMessage;
    return errorMessage;
  };

  // sendToAnalyticsAndSentry(err);
  const errorMessage = getErrMsg();
  return { message: chalk.red(errorMessage), error: err };
};
