import { Configuration } from 'webpack';

// This is the production and development configuration.
// It is focused on developer experience, fast rebuilds, and a minimal bundle.
export default function (): Configuration {
  return {
    module: {
      rules: [],
    },
  };
}
