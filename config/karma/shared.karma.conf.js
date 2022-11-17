const path = require('path');

const testWebpackConfig = require('../webpack/webpack.test.config');

module.exports = (config) => {
  config.set({
    basePath: '',
    files: [
      {
        pattern: '../utils/spec-bundle.js',
        watched: false,
      },
    ],

    frameworks: ['jasmine', 'webpack'],

    preprocessors: {
      '../utils/spec-bundle.js': ['webpack'],
    },

    coverageIstanbulReporter: {
      dir: path.join(__dirname, '..', '..', 'coverage'),
      fixWebpackSourcePaths: true,
      reports: ['html', 'json'],
    },

    reporters: ['mocha', 'coverage-istanbul'],

    webpackServer: {
      noInfo: true,
    },

    browserConsoleLogOptions: {
      terminal: true,
      level: '',
    },

    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    webpack: testWebpackConfig,
    autoWatch: false,
    singleRun: true,
    client: {
      jasmine: {
        random: false,
      },
    },
  });
};
