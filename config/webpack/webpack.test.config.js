const path = require('path');

module.exports = {
  mode: 'development',

  entry: './index.ts',

  devtool: 'inline-source-map',

  resolve: {
    extensions: ['.ts', '.js'],
    modules: [path.resolve(__dirname, '..', '..', 'src'), 'node_modules'],
  },

  module: {
    rules: [
      {
        test: /\.ts$/,
        loaders: ['ts-loader'],
      },
      {
        enforce: 'post',
        test: /\.(js|ts)$/,
        loader: 'istanbul-instrumenter-loader!source-map-inline-loader',
        include: path.resolve(__dirname, '..', '..', 'src'),
        exclude: [/\.(e2e|spec)\.ts$/, /node_modules/, /index\.ts/],
      },
    ],
  },
};
