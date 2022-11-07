export class InvalidVersionError extends Error {
  version: string | null | undefined;

  constructor(version?: string | null) {
    super(
      `error: version ${
        version || '(empty)'
      } is not a valid semantic version. learn more: https://semver.org`
    );
  }
}
