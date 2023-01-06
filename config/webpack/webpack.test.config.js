const path = require('path');

module.exports = {
  mode: 'development',
  devtool: 'inline-source-map',
  output: {
    path: path.resolve(__dirname, '..', '..', '.karma_temp'),
  },
  resolve: {
    extensions: ['.ts', '.js'],
    modules: [path.resolve(__dirname, '..', '..', 'src'), 'node_modules'],
  },
  watchOptions: {
    ignored: ['**/dist', '**/.kamra_temp'],
  },
  module: {
    rules: [
      {
        test: /\.(js|ts)$/,
        loader: '@jsdevtools/coverage-istanbul-loader',
        include: path.resolve(__dirname, '..', '..', 'src'),
        exclude: [/\.(e2e|spec)\.ts$/, /node_modules/, /index\.ts/],
      },
      {
        exclude: /(node_modules)/,
        test: /\.ts$/,
        loader: 'ts-loader',
      },
    ],
  },
};
