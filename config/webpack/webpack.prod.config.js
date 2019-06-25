var path = require('path');

function createConfig(libraryTarget, mode, name) {
  return {
    mode,
    entry: './index.ts',
    output: {
      path: path.resolve(__dirname, '..', '..', 'dist', 'bundles'),
      filename: `auth-client.${name || libraryTarget}.js`,
      library: 'BBAuthClient',
      libraryTarget
    },
    resolve: {
      extensions: ['.ts']
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          loader: 'ts-loader',
          options: {
            compilerOptions: {
              declaration: false
            }
          }
        }
      ]
    }
  };
}

module.exports = [
  createConfig('umd', 'none'),
  createConfig('umd', 'production', 'umd.min'),
  createConfig('window', 'none', 'global'),
  createConfig('window', 'production', 'global.min')
]
