export class BundlingStrategyNotFoundError extends Error {
  constructor(strategyName: string) {
    super(`bundling strategy with name ${strategyName} was not found`);
  }
}
