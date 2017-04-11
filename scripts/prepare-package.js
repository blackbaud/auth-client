/* jshint node: true */

'use strict';

const fs = require('fs-extra');
const path = require('path');

const rootPath = path.join(__dirname, '..');
const distPath = path.join(rootPath, 'dist');

function makePackageFileForDist() {
  const packageJson = fs.readJSONSync(path.join(rootPath, 'package.json'));

  packageJson.module = 'index.js';

  fs.writeJSONSync(path.join(distPath, 'package.json'), packageJson);
}

function copyFilesToDist() {
  fs.copySync(path.join(rootPath, 'README.md'), path.join(distPath, 'README.md'));
  fs.copySync(path.join(rootPath, 'CHANGELOG.md'), path.join(distPath, 'CHANGELOG.md'));
}

makePackageFileForDist();
copyFilesToDist();
