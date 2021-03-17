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

// modules
// const boxen = require('boxen');
const chalk = require('chalk');
const { exec } = require("child_process");
const fs = require('fs');
const logger = require('cli-logger');
const path = require('path');
// https://www.npmjs.com/package/commander
const program = require('commander');
const shell = require('shelljs');

// https://stackoverflow.com/questions/9153571/is-there-a-way-to-get-version-from-package-json-in-nodejs-code
const packageDotJSON = require('./package.json');

// constants
const APP_NAME = '\nFirebase Functions Deployment Helper (ffdh)';
const APP_AUTHOR = 'by John M. Wargo (https://johnwargo.com)';
const COMMAND_ROOT = 'firebase deploy --only ';
const CURRENT_PATH = process.cwd();
const EXIT_HEADING = chalk.red('Exiting:');
const FIREBASE_CONFIG_FILE = 'firebase.json';
const FUNCTIONS_FILE = 'functions.json';
const FUNCTIONS_STRING = 'functions:';

var functionsList: any;
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

  // Does the functions list exist?  
  let filePath = path.join(CURRENT_PATH, FUNCTIONS_FILE);
  if (!checkFile(filePath)) {
    log.info(`${EXIT_HEADING} Unable to locate the ${filePath} file\n`);
    return false;
  } else {
    log.info(`Located ${filePath}`);
    functionsList = require(filePath);
  }

  // Does the config file exist?
  filePath = path.join(CURRENT_PATH, FIREBASE_CONFIG_FILE);
  if (!checkFile(filePath)) {
    log.info(`${EXIT_HEADING} Unable to locate the ${filePath} file\n`);
    return false;
  } else {
    log.info(`Located ${filePath}`);
  }

  // load the Firebase config file
  log.debug(`Loading Firebase configuration file (${FIREBASE_CONFIG_FILE})`);
  const firebaseConfig = require(`./${FIREBASE_CONFIG_FILE}`);
  // get the path for the functions folder
  const sourceStr = firebaseConfig.functions.source;
  if (sourceStr) {
    // does the path exist?
    filePath = path.join(CURRENT_PATH, sourceStr);
    console.log(`Determined Firebase functions folder: ${filePath}`);
    if (!checkDirectory(filePath)) {
      log.info(`${EXIT_HEADING} Unable to locate the ${filePath} folder\n`);
      return false;
    } else {
      log.info(`Located ${filePath}`);
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
      log.info(`Firebase command found at ${path.dirname(filePath)}`);
    }
    log.info(chalk.green('We have a Firebase project'));
    return true;
  } else {
    log.info(EXIT_HEADING + ' Unable to locate the Firebase command\n');
    return false;
  }
}

function processPercentage(pct: number, iteration: number, iterations: number): string {

  log.info(`processPercentage(${pct}, ${iteration}, ${iterations})`);

  let start, end;
  let batchSize = Math.floor(functionsList.length * pct);
  const remainder = functionsList.length % batchSize;

  log.info(`Function Count: ${functionsList.length}`);
  log.info(`Remainder: ${remainder}`);

  if (iteration <= remainder) {
    batchSize += 1;
  }
  log.info(`Batch size: ${batchSize}`);
  start = batchSize * (iteration - 1);

  if (iteration > remainder) {
    start += remainder;
  }
  end = start + batchSize - 1;
  log.info(`Returning from ${start} to ${end}`);

  return '';
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
  // Add 'functions:' to the beginning of every function name
  resultsArray = resultsArray.map(func => FUNCTIONS_STRING + func);
  // split the array into a comma-separated list
  return resultsArray.join(',');
}

console.log(APP_NAME);
console.log(APP_AUTHOR);
console.log(`Version: ${packageDotJSON.version}`);
program.version(packageDotJSON.version);
program.option('-s, --start <searchStr>', 'Search start of function name for <string>');
program.option('-e, --end <searchStr>', 'Search end of function name for <string>');
program.option('-p --percentage <percentage>', '');
program.option('-i, --iteration <iteration>', '1');
program.option('-d, --debug', 'Output extra information during operation');
program.parse();
const options = program.opts();
if (options.debug) {
  console.log('\nEnabling debug mode');
  log.level(log.DEBUG);
} else {
  log.level(log.INFO);
}
// Write the command line options to the console
log.debug(options);

if (isValidConfig()) {

  let strFunctionList: string;

  if (options.percentage) {
    // do we have i and not p? Set default iteration
    options.iteration = options.iteration ? options.iteration : "1";
    // get numeric values for our parameters
    const pct = parseInt(options.percentage, 10);
    const iter = parseInt(options.iteration, 10);
    // Do we have a valid percentage?
    if (pct < 1 || pct > 100) {
      log.info(chalk.red(`\nInvalid percentage value: ${pct} (Must be 1-100)`));
      process.exit(1);
    }
    // do we have a valid iteration?
    const iterations = Math.ceil(100 / pct);
    if (iter > iterations) {
      log.info(chalk.red(`\nInvalid iteration value: ${iter} (Must be 1-${iterations})`));
      process.exit(1);
    }
    // We got this far, we're good to go!
    strFunctionList = processPercentage(pct / 100, iter, iterations);
  } else {
    strFunctionList = processSearch(options.start, options.end);
  }

  if (strFunctionList.length > 0) {
    const commandStr = COMMAND_ROOT + strFunctionList
    if (options.debug) {
      log.info(commandStr);
    } else {
      // execute the command
      log.debug('Executing Firebase command');
      exec(commandStr, (error: any, stdout: any, stderr: any) => {
        if (error) {
          log.error(`error: ${error.message}`);
          // process.exit(1);
        }
        if (stderr) {
          log.error(`stderr: ${stderr}`);
          // process.exit(1);
        }
        log.info(`stdout: ${stdout}`);
      });
      // process.exit(0);
    }
  } else {
    log.info(chalk.red('\nNo function match for specified options'));
    process.exit(1);
  }

}
