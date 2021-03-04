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
// https://stackoverflow.com/questions/9153571/is-there-a-way-to-get-version-from-package-json-in-nodejs-code
const packageDotJSON = require('./package.json');
const path = require('path');
// https://www.npmjs.com/package/commander
const program = require('commander');
const shell = require('shelljs');

// constants
const APP_NAME = 'Firebase Functions Deployment Helper';
const APP_AUTHOR = 'by John M. Wargo (https://johnwargo.com)';
const CURRENT_PATH = process.cwd();
const EXIT_HEADING = chalk.red('Exiting:');

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
    log.info(chalk.yellow('\nValidating Firebase project'));

    let filePath = path.join(CURRENT_PATH, '.firebaserc');
    if (!checkFile(filePath)) {
      log.info(EXIT_HEADING + ` Unable to locate the ${filePath} file\n`);
      return false;
    } else {
      log.info(`Located ${filePath}`);
    }

    filePath = path.join(CURRENT_PATH, 'firebase.json');
    if (!checkFile(filePath)) {
      log.info(EXIT_HEADING + ` Unable to locate the ${filePath} file\n`);
      return false;
    } else {
      log.info(`Located ${filePath}`);
    }
    
    filePath = path.join(CURRENT_PATH, 'functions');
    if (!checkDirectory(filePath)) {
      log.info(EXIT_HEADING + ` Unable to locate the ${filePath} folder\n`);
      return false;
    } else {
      log.info(`Located ${filePath}`);
    }
  
    // is flutter installed?
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

// Get started
console.log(boxen(APP_NAME, { padding: 1 }));
console.log(APP_AUTHOR);
console.log(`Version: ${packageDotJSON.version}`);

// Get the version number from the package.json file
program.version(packageDotJSON.version);
program.option('-d, --debug', 'Output extra information during operation');
program.option('-u, --update', 'Update the Assets definition in the pubspec.yaml file');

if (isValidConfig()) {
    // Process the command line arguments
    program.parse(process.argv);
    // Configure the logger
    const conf = program.debug ? log.DEBUG : log.INFO;
    log.level(conf);
    log.debug(program.opts());

} else {
    console.log(chalk.red('Exiting'));
}