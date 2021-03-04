#!/usr/bin/env node
/**********************************************************
 * Firebase Functions Deployment Helper
 * by John M. Wargo
 * 
 * Simplifies deployment of a subset of a Firebase
 * project's functions. I created this thing because I 
 * constantly ran up against Firebase quote limits when
 * deploying my functions
 **********************************************************/

// modules
const boxen = require('boxen');
const chalk = require('chalk');
const fs = require('fs');
const logger = require('cli-logger');
const path = require('path');
// https://www.npmjs.com/package/commander
const program = require('commander');
const shell = require('shelljs');

// https://stackoverflow.com/questions/9153571/is-there-a-way-to-get-version-from-package-json-in-nodejs-code
const packageDotJSON = require('./package.json');

// constants
const APP_NAME = 'Firebase Functions Deployment Helper (ffdh)';
const APP_AUTHOR = 'by John M. Wargo (https://johnwargo.com)';
const CURRENT_PATH = process.cwd();
const EXIT_HEADING = chalk.red('Exiting:');
const firebaseConfigFile = 'firebase.json';

var log = logger();

function checkFile(filePath: string): boolean {
  log.debug(`checkFile(${filePath})`);
  try {
    return fs.existsSync(filePath);
  } catch (err) {
    log.error(`checkFile error: ${err}`);
    return false;
  }
}

function checkDirectory(filePath: string): boolean {
  log.debug(`checkDirectory(${filePath})`);
  // does the folder exist?
  if (fs.existsSync(filePath)) {
    // Check to see if it's a folder
    try {
      let stats = fs.statSync(filePath);
      if (stats) {
        return stats.isDirectory;
      } else {
        return false;
      }
    } catch (err) {
      log.error(`checkDirectory error: ${err}`);
      return false;
    }
  } else {
    return false;
  }
}

function isValidConfig(): Boolean {
  // Make sure this is a Flutter project
  log.info(chalk.yellow('Validating Firebase project'));

  // Does the config file exist?
  let filePath = path.join(CURRENT_PATH, firebaseConfigFile);
  if (!checkFile(filePath)) {
    log.info(EXIT_HEADING + ` Unable to locate the ${filePath} file\n`);
    return false;
  } else {
    log.info(`Located ${filePath}`);
  }

  // load the Firebase config file
  const firebaseConfig = require(`./${firebaseConfigFile}`);
  // get the path for the functions folder
  const functionsPath = firebaseConfig.functions.source;
  if (functionsPath) {
    // does the path exist?
    filePath = path.join(CURRENT_PATH, functionsPath);
    console.log(`Determined Firebase functions folder: ${filePath}`);
    if (!checkDirectory(filePath)) {
      log.info(EXIT_HEADING + ` Unable to locate the ${filePath} folder\n`);
      return false;
    } else {
      log.info(`Located ${filePath}`);
    }
  } else {
    log.info(EXIT_HEADING + ` Unable to locate the ${filePath} folder\n`);
    return false;
  }

  // is the Firebase CLI installed?
  let res = shell.which('firebase');
  if (res) {
    filePath = res.toString();
    if (!filePath) {
      log.info(EXIT_HEADING + ' Unable to locate the Firebase command\n');
      return false;
    } else {
      log.info(`Firebase command found at ${path.dirname(filePath)}`);
    }
    log.info(chalk.green('We have a Firebase project'));
    return true;
  } else {
    log.info(EXIT_HEADING + ' Unable to locate the Firebase command\n');
    return false;
  }
}

console.log(APP_NAME);
console.log(APP_AUTHOR);
console.log(`Version: ${packageDotJSON.version}\n`);
program.version(packageDotJSON.version);
program.option('-s, --start <searchStr>', 'Search function name start for <string>');
program.option('-e, --end <searchStr>', 'Search function name end for <string>');
program.option('-p, -% <percentage>', '');
program.option('-i, --iteration <iteration>', '');
program.option('-d, --debug', 'Output extra information during operation');
program.parse(process.argv);
const options = program.opts();
if (options.debug) {
  console.log('Enabling debug mode');
  log.level(log.DEBUG);
} else {
  log.level(log.INFO);
}
// Write the command line options to the console
log.debug(program.opts());

if (isValidConfig()) {
  console.log('woohoo!');
} 
