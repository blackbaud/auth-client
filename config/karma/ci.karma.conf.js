module.exports = function (config) {
  'use strict';

  require('./shared.karma.conf')(config);

  config.set({
    browsers: [
      'ChromeHeadless'
    ]
  });

};
