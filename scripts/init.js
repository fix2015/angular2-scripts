var fs = require('fs-extra');
var path = require('path');
var spawn = require('cross-spawn');
var pathExists = require('path-exists');
var chalk = require('chalk');

module.exports = function(appPath, appName, verbose, originalDirectory) {
  var ownPackageName = require(path.join(__dirname, '..', 'package.json')).name;
  var ownPath = path.join(appPath, 'node_modules', ownPackageName);
  var appPackage = require(path.join(appPath, 'package.json'));

  // Copy over some of the devDependencies
  appPackage.dependencies = appPackage.dependencies || {};
  appPackage.devDependencies = appPackage.devDependencies || {};
  

  fs.writeFileSync(
    path.join(appPath, 'package.json'),
    JSON.stringify(appPackage, null, 2)
  );

  var readmeExists = pathExists.sync(path.join(appPath, 'README.md'));
  if (readmeExists) {
    fs.renameSync(path.join(appPath, 'README.md'), path.join(appPath, 'README.old.md'));
  }

  fs.copySync(path.join(ownPath, 'path'), appPath);

  fs.move(path.join(appPath, 'gitignore'), path.join(appPath, '.gitignore'), [], function (err) {
    if (err) {
      if (err.code === 'EEXIST') {
        var data = fs.readFileSync(path.join(appPath, 'gitignore'));
        fs.appendFileSync(path.join(appPath, '.gitignore'), data);
        fs.unlinkSync(path.join(appPath, 'gitignore'));
      } else {
        throw err;
      }
    }
  });

  console.log('Installing angular2 from npm...');
  console.log();
  var args = [
    'install',
    '@angular/common',
    '@angular/compiler',
    '@angular/core',
    '@angular/forms',
    '@angular/http',
    '@angular/platform-browser',
    '@angular/platform-browser-dynamic',
    '@angular/router',
    '@angular/upgrade',
    'angular-in-memory-web-api',
    'bootstrap',
    'systemjs',
    'core-js',
    'reflect-metadata',
    'rxjs',
    'zone.js',
    '--save',
    verbose && '--verbose'
  ].filter(function(e) { return e; });
  var proc = spawn('npm', args, {stdio: 'inherit'});
  proc.on('close', function (code) {
    if (code !== 0) {
      console.error('`npm ' + args.join(' ') + '` failed');
      return;
    }
    
    var cdpath;
    if (originalDirectory &&
        path.join(originalDirectory, appName) === appPath) {
      cdpath = appName;
    } else {
      cdpath = appPath;
    }

    console.log();
    console.log('Success! Created ' + appName + ' at ' + appPath);
    console.log('Inside that directory, you can run several commands:');
    console.log();
    console.log(chalk.cyan('  npm start'));
    console.log('     Runs the compiler and a server at the same time, both in "watch mode".');
    console.log();
    console.log(chalk.cyan('  npm run tsc'));
    console.log('     Runs the TypeScript compiler once.');
    console.log();
    console.log(chalk.cyan('  npm run tsc:w'));
    console.log('    Runs the TypeScript compiler in watch mode; the process keeps running, awaiting changes to TypeScript files and re-compiling when it sees them.');
    console.log();
    console.log(chalk.cyan('  npm run lite'));
    console.log('    Runs the lite-server, a light-weight, static file server, written and maintained by John Papa and Christopher Martin with excellent support for Angular apps that use routing.');
    console.log();
    console.log(chalk.cyan('  npm run typings'));
    console.log('    Runs the typings tool.');
    console.log();
    console.log(chalk.cyan('  npm run postinstall'));
    console.log('    Called by npm automatically after it successfully completes package installation. This script installs the TypeScript definition files this app requires. Here are the test related scripts:');
    console.log();
    console.log(chalk.cyan('  npm test'));
    console.log('    Compiles, runs and watches the karma unit tests');
    console.log();
    console.log(chalk.cyan('  npm run e2e'));
    console.log('    Run protractor e2e tests, written in JavaScript (*e2e-spec.js)');
    console.log();
    console.log('We suggest that you begin by typing:');
    console.log();
    console.log(chalk.cyan('  cd'), cdpath);
    console.log('  ' + chalk.cyan('npm start'));
  });
};
