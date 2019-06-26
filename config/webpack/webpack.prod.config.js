var path = require('path');

function createConfig(libraryTarget, mode, target, name) {
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
              declaration: false,
              target
            }
          }
        }
      ]
    }
  };
}

module.exports = [
  createConfig('umd', 'none', 'es5'),
  createConfig('umd', 'none', 'es2015', 'umd-es2015'),
  createConfig('umd', 'production', 'es5', 'umd.min'),
  createConfig('umd', 'production', 'es2015', 'umd-es2015.min'),
  createConfig('window', 'none', 'es5', 'global'),
  createConfig('window', 'none', 'es2015', 'global-es2015'),
  createConfig('window', 'production', 'es5', 'global.min'),
  createConfig('window', 'production', 'es2015', 'global-es2015.min')
]
