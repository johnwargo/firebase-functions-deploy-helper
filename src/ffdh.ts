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

// How to get a list of exported functions
// https://stackoverflow.com/questions/25529290/node-js-module-how-to-get-list-of-exported-functions

const chalk = require('chalk');
const fs = require('fs');
const logger = require('cli-logger');
const path = require('path');
const program = require('commander');
const shell = require('shelljs');
const cp = require("child_process");
// const { execSync } = require("child_process");

// https://stackoverflow.com/questions/9153571/is-there-a-way-to-get-version-from-package-json-in-nodejs-code
const packageDotJSON = require('./package.json');

// constants
const APP_NAME = '\nFirebase Functions Deployment Helper (ffdh)';
const APP_AUTHOR = 'by John M. Wargo (https://johnwargo.com)';
const COMMAND_ROOT = 'firebase deploy --only ';
const CURRENT_PATH = process.cwd();
const EXIT_HEADING = chalk.red('Exiting:');
const FIREBASE_CONFIG_FILE = 'firebase.json';
const FUNCTIONS_FILE = 'ffdh.json';
const FUNCTIONS_STRING = 'functions:';
const MAX_BATCHES = 25;

var functionsList: any;
var log = logger();

function checkFile(filePath: string): boolean {
  // log.debug(`checkFile(${filePath})`);
  log.debug(`Locating ${filePath}`);
  try {
    return fs.existsSync(filePath);
  } catch (err) {
    log.error(`checkFile error: ${err}`);
    return false;
  }
}

function checkDirectory(filePath: string): boolean {
  log.debug(`Locating ${filePath}`);
  // log.debug(`checkDirectory(${filePath})`);
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
  log.debug(chalk.yellow('\nValidating Firebase project'));

  // Does the functions list exist?  
  let filePath = path.join(CURRENT_PATH, FUNCTIONS_FILE);
  if (!checkFile(filePath)) {
    log.info(`${EXIT_HEADING} Unable to locate the ${filePath} file\n`);
    return false;
  } else {
    log.debug(`Located ${filePath}`);
    functionsList = require(filePath);
  }

  // Does the config file exist?
  filePath = path.join(CURRENT_PATH, FIREBASE_CONFIG_FILE);
  if (!checkFile(filePath)) {
    log.info(`${EXIT_HEADING} Unable to locate the ${filePath} file\n`);
    return false;
  } else {
    log.debug(`Located ${filePath}`);
  }

  // load the Firebase config file
  log.debug(`Loading Firebase configuration file (${FIREBASE_CONFIG_FILE})`);
  const firebaseConfig = require(`./${FIREBASE_CONFIG_FILE}`);
  // get the path for the functions folder
  const sourceStr = firebaseConfig.functions.source;
  if (sourceStr) {
    // does the path exist?
    filePath = path.join(CURRENT_PATH, sourceStr);
    log.debug(`Determined Firebase functions folder: ${filePath}`);
    if (!checkDirectory(filePath)) {
      log.info(`${EXIT_HEADING} Unable to locate the ${filePath} folder\n`);
      return false;
    } else {
      log.debug(`Located ${filePath}`);
    }
  } else {
    log.info(EXIT_HEADING + '${EXIT_HEADING} Unable to determine the Functions source folder\n');
    return false;
  }

  // is the Firebase CLI installed?
  log.debug('Looking for Firebase CLI command');
  let res = shell.which('firebase');
  if (res) {
    filePath = res.toString();
    log.debug(`firebase command at ${filePath}`);
    if (!filePath) {
      log.info(EXIT_HEADING + ' Unable to locate the Firebase command\n');
      return false;
    } else {
      log.debug(`Firebase command found at ${path.dirname(filePath)}`);
    }
    log.debug(chalk.green('We have a Firebase project'));
    return true;
  } else {
    log.info(EXIT_HEADING + ' Unable to locate the Firebase command\n');
    return false;
  }
}

function processBatch(batches: number, batch: number,): string {
  let resultsArray: string[] = [];
  let batchSize = Math.ceil(functionsList.length / batches);
  log.debug(`Batch: ${batch} of ${batches}, size ${batchSize}`);

  const start = batchSize * (batch - 1);
  const end = start + batchSize;
  log.debug(`From ${start} to ${end - 1}`);
  // grab from start to one less than end
  resultsArray = functionsList.slice(start, end);
  // Add 'functions:' to the beginning of every function name
  resultsArray = resultsArray.map(func => FUNCTIONS_STRING + func);
  // split the array into a comma-separated list
  return resultsArray.join(',');
}

function processSearch(start: string, end: string): string {
  let resultsArray: string[] = [];
  if (start && end) {
    resultsArray = functionsList.filter((func: string) => {
      return func.startsWith(start) && func.endsWith(end);
    });
  } else {
    if (start) {
      resultsArray = functionsList.filter((func: string) => {
        return func.startsWith(start);
      });
    } else {
      resultsArray = functionsList.filter((func: string) => {
        return func.endsWith(end);
      });
    }
  }
  resultsArray = resultsArray.map(func => FUNCTIONS_STRING + func);
  return resultsArray.join(',');
}

console.log(APP_NAME);
program.version(packageDotJSON.version);
program.option('-s, --start <searchStr>', 'Search start of function name for <string>');
program.option('-e, --end <searchStr>', 'Search end of function name for <string>');
program.option('-b, --batches <number>', '');
program.option('-bn, --batch <number>', '1');
program.option('-d, --debug', 'Output extra information during operation');
program.parse();
const options = program.opts();
if (options.debug) {
  log.level(log.DEBUG);
} else {
  log.level(log.INFO);
}
// write the version number to the console
log.debug(APP_AUTHOR);
log.debug(`Version: ${packageDotJSON.version}`);
// Write the command line options to the console
log.debug('Command Options:', options);

if (isValidConfig()) {
  let strFunctionList: string;

  if (options.batches) {
    // do we have -b and not -bn? then set the default batch number (1)
    options.batch = options.batch ? options.batch : "1";
    // get numeric values for our parameters
    const batches = parseInt(options.batches, 10);
    if (batches < 1 || batches > MAX_BATCHES) {
      log.info(chalk.red(`Invalid iterations value: ${batches} (Must be 1-${MAX_BATCHES})`));
      process.exit(1);
    }
    // do we have a valid iteration?
    const batch = parseInt(options.batch, 10);
    if (batch < 1 || batch > batches) {
      log.info(chalk.red(`Invalid iteration value: ${batch} (Must be 1-${batches})`));
      process.exit(1);
    }
    // We got this far, we're good to go!
    strFunctionList = processBatch(batches, batch);
  } else {
    // do we have start or end?
    if (!options.start && !options.end) {
      // nothing to do here, goodbye
      log.info(chalk.red('Nothing to do here (missing actionable parameters)'));
      process.exit(1);
    }
    strFunctionList = processSearch(options.start, options.end);
  }

  if (strFunctionList.length > 0) {
    try {
      var cmd = `firebase deploy --only ${strFunctionList}`;
      log.info(chalk.yellow('Executing:'), cmd);
      cp.execSync(cmd, { stdio: 'inherit' });
    } catch (e) {
      log.warn(e);
    }
  } else {
    log.info(chalk.red('No function match for specified options'));
    process.exit(1);
  }

}
