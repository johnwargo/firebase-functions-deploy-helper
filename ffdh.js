#!/usr/bin/env node
"use strict";
var chalk = require('chalk');
var fs = require('fs');
var logger = require('cli-logger');
var path = require('path');
var program = require('commander');
var shell = require('shelljs');
var cp = require("child_process");
var packageDotJSON = require('./package.json');
var APP_NAME = '\nFirebase Functions Deploy Helper (ffdh)';
var APP_AUTHOR = 'by John M. Wargo (https://johnwargo.com)';
var CURRENT_PATH = process.cwd();
var EXIT_HEADING = chalk.red('Exiting:');
var FIREBASE_CONFIG_FILE = 'firebase.json';
var FUNCTIONS_FILE = 'ffdh.json';
var FUNCTIONS_STRING = 'functions:';
var MAX_BATCHES = 25;
var functionsList;
var log = logger();
function checkFile(filePath) {
    log.debug("Locating ".concat(filePath));
    try {
        return fs.existsSync(filePath);
    }
    catch (err) {
        log.error("checkFile error: ".concat(err));
        return false;
    }
}
function checkDirectory(filePath) {
    log.debug("Locating ".concat(filePath));
    if (fs.existsSync(filePath)) {
        try {
            var stats = fs.statSync(filePath);
            if (stats) {
                return stats.isDirectory;
            }
            else {
                return false;
            }
        }
        catch (err) {
            log.error("checkDirectory error: ".concat(err));
            return false;
        }
    }
    else {
        return false;
    }
}
function isValidConfig() {
    log.debug(chalk.yellow('\nValidating Firebase project'));
    var filePath = path.join(CURRENT_PATH, FUNCTIONS_FILE);
    if (!checkFile(filePath)) {
        log.info("".concat(EXIT_HEADING, " Unable to locate the ").concat(filePath, " file\n"));
        return false;
    }
    else {
        log.debug("Located ".concat(filePath));
        functionsList = require(filePath);
    }
    filePath = path.join(CURRENT_PATH, FIREBASE_CONFIG_FILE);
    if (!checkFile(filePath)) {
        log.info("".concat(EXIT_HEADING, " Unable to locate the ").concat(filePath, " file\n"));
        return false;
    }
    else {
        log.debug("Located ".concat(filePath));
    }
    log.debug("Loading Firebase configuration from ".concat(FIREBASE_CONFIG_FILE));
    var firebaseConfig;
    try {
        firebaseConfig = require("./".concat(FIREBASE_CONFIG_FILE));
        log.debug("Firebase project configuration loaded");
    }
    catch (err) {
        log.info("".concat(EXIT_HEADING, " Unable to load the ").concat(FIREBASE_CONFIG_FILE, " file\n"));
        return false;
    }
    var sourceStr = '';
    if (firebaseConfig.functions.source) {
        sourceStr = firebaseConfig.functions.source;
    }
    if (sourceStr.length === 0) {
        sourceStr = 'functions';
        log.debug("Functions folder location: '".concat(sourceStr, "' (default)"));
    }
    else {
        log.debug("Functions folder location: '".concat(sourceStr, "'"));
    }
    if (sourceStr) {
        filePath = path.join(CURRENT_PATH, sourceStr);
        if (!checkDirectory(filePath)) {
            log.info("".concat(EXIT_HEADING, " Unable to locate the ").concat(filePath, " folder\n"));
            return false;
        }
        else {
            log.debug("Located ".concat(filePath));
        }
    }
    else {
        log.info("".concat(EXIT_HEADING, " Unable to determine the Functions source folder\n"));
        return false;
    }
    log.debug('Looking for Firebase CLI command');
    var res = shell.which('firebase');
    if (res) {
        filePath = res.toString();
        log.debug("firebase command at ".concat(filePath));
        if (!filePath) {
            log.info(EXIT_HEADING + ' Unable to locate the Firebase command\n');
            return false;
        }
        else {
            log.debug("Firebase command found at ".concat(path.dirname(filePath)));
        }
        log.debug(chalk.green('We have a Firebase project'));
        return true;
    }
    else {
        log.info(EXIT_HEADING + ' Unable to locate the Firebase command\n');
        return false;
    }
}
function processBatch(batches, batch) {
    var resultsArray = [];
    var batchSize = Math.ceil(functionsList.length / batches);
    log.debug("Batch: ".concat(batch, " of ").concat(batches, ", size ").concat(batchSize));
    var start = batchSize * (batch - 1);
    var end = start + batchSize;
    log.debug("From ".concat(start, " to ").concat(end - 1));
    resultsArray = functionsList.slice(start, end);
    resultsArray = resultsArray.map(function (func) { return FUNCTIONS_STRING + func; });
    return resultsArray.join(',');
}
function processSearch(start, end) {
    var resultsArray = [];
    if (start && end) {
        resultsArray = functionsList.filter(function (func) {
            return func.startsWith(start) && func.endsWith(end);
        });
    }
    else {
        if (start) {
            resultsArray = functionsList.filter(function (func) {
                return func.startsWith(start);
            });
        }
        else {
            resultsArray = functionsList.filter(function (func) {
                return func.endsWith(end);
            });
        }
    }
    resultsArray = resultsArray.map(function (func) { return FUNCTIONS_STRING + func; });
    return resultsArray.join(',');
}
console.log(APP_NAME);
program.version(packageDotJSON.version);
program.option('-s, --start <searchStr>', 'Search start of function name for <string>');
program.option('-e, --end <searchStr>', 'Search end of function name for <string>');
program.option('-b, --batches <number>', 'Deploy functions in <number> batches');
program.option('-bn, --batch <number>', 'When deploying via batches, specifies which batch number');
program.option('-d, --debug', 'Output extra information during operation');
program.parse();
var options = program.opts();
if (options.debug) {
    log.level(log.DEBUG);
}
else {
    log.level(log.INFO);
}
log.debug(APP_AUTHOR);
log.debug("Version: ".concat(packageDotJSON.version));
log.debug('Command Options:', options);
if (isValidConfig()) {
    var strFunctionList = void 0;
    if (options.batches) {
        options.batch = options.batch ? options.batch : "1";
        var batches = parseInt(options.batches, 10);
        if (batches < 1 || batches > MAX_BATCHES) {
            log.info(chalk.red("Invalid iterations value: ".concat(batches, " (Must be 1-").concat(MAX_BATCHES, ")")));
            process.exit(1);
        }
        var batch = parseInt(options.batch, 10);
        if (batch < 1 || batch > batches) {
            log.info(chalk.red("Invalid iteration value: ".concat(batch, " (Must be 1-").concat(batches, ")")));
            process.exit(1);
        }
        strFunctionList = processBatch(batches, batch);
    }
    else {
        if (!options.start && !options.end) {
            log.info(chalk.red('Nothing to do here (missing actionable parameters)'));
            process.exit(1);
        }
        strFunctionList = processSearch(options.start, options.end);
    }
    if (strFunctionList.length > 0) {
        try {
            var cmd = "firebase deploy --only ".concat(strFunctionList);
            log.info(chalk.yellow('Executing:'), cmd);
            cp.execSync(cmd, { stdio: 'inherit' });
        }
        catch (e) {
            log.warn(e);
        }
    }
    else {
        log.info(chalk.red('No function match for specified options'));
        process.exit(1);
    }
}
