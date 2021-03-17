#!/usr/bin/env node
"use strict";
var chalk = require('chalk');
var exec = require("child_process").exec;
var fs = require('fs');
var logger = require('cli-logger');
var path = require('path');
var program = require('commander');
var shell = require('shelljs');
var packageDotJSON = require('./package.json');
var APP_NAME = '\nFirebase Functions Deployment Helper (ffdh)';
var APP_AUTHOR = 'by John M. Wargo (https://johnwargo.com)';
var COMMAND_ROOT = 'firebase deploy --only ';
var CURRENT_PATH = process.cwd();
var EXIT_HEADING = chalk.red('Exiting:');
var FIREBASE_CONFIG_FILE = 'firebase.json';
var FUNCTIONS_FILE = 'functions.json';
var FUNCTIONS_STRING = 'functions:';
var functionsList;
var log = logger();
function checkFile(filePath) {
    log.debug("checkFile(" + filePath + ")");
    try {
        return fs.existsSync(filePath);
    }
    catch (err) {
        log.error("checkFile error: " + err);
        return false;
    }
}
function checkDirectory(filePath) {
    log.debug("checkDirectory(" + filePath + ")");
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
            log.error("checkDirectory error: " + err);
            return false;
        }
    }
    else {
        return false;
    }
}
function isValidConfig() {
    log.info(chalk.yellow('\nValidating Firebase project'));
    var filePath = path.join(CURRENT_PATH, FUNCTIONS_FILE);
    if (!checkFile(filePath)) {
        log.info(EXIT_HEADING + " Unable to locate the " + filePath + " file\n");
        return false;
    }
    else {
        log.info("Located " + filePath);
        functionsList = require(filePath);
    }
    filePath = path.join(CURRENT_PATH, FIREBASE_CONFIG_FILE);
    if (!checkFile(filePath)) {
        log.info(EXIT_HEADING + " Unable to locate the " + filePath + " file\n");
        return false;
    }
    else {
        log.info("Located " + filePath);
    }
    log.debug("Loading Firebase configuration file (" + FIREBASE_CONFIG_FILE + ")");
    var firebaseConfig = require("./" + FIREBASE_CONFIG_FILE);
    var sourceStr = firebaseConfig.functions.source;
    if (sourceStr) {
        filePath = path.join(CURRENT_PATH, sourceStr);
        console.log("Determined Firebase functions folder: " + filePath);
        if (!checkDirectory(filePath)) {
            log.info(EXIT_HEADING + " Unable to locate the " + filePath + " folder\n");
            return false;
        }
        else {
            log.info("Located " + filePath);
        }
    }
    else {
        log.info(EXIT_HEADING + '${EXIT_HEADING} Unable to determine the Functions source folder\n');
        return false;
    }
    log.debug('Looking for Firebase CLI command');
    var res = shell.which('firebase');
    if (res) {
        filePath = res.toString();
        log.debug("firebase command at " + filePath);
        if (!filePath) {
            log.info(EXIT_HEADING + ' Unable to locate the Firebase command\n');
            return false;
        }
        else {
            log.info("Firebase command found at " + path.dirname(filePath));
        }
        log.info(chalk.green('We have a Firebase project'));
        return true;
    }
    else {
        log.info(EXIT_HEADING + ' Unable to locate the Firebase command\n');
        return false;
    }
}
function processPercentage(pct, iteration) {
    log.info("processPercentage(" + pct + ", " + iteration + ")");
    var start, end;
    var batchSize = Math.floor(functionsList.length * pct);
    var remainder = functionsList.length % batchSize;
    log.info("Function Count: " + functionsList.length);
    log.info("Remainder: " + remainder);
    if (iteration <= remainder) {
        batchSize += 1;
    }
    log.info("Batch size: " + batchSize);
    start = batchSize * (iteration - 1);
    if (iteration > remainder) {
        start += remainder;
    }
    end = start + batchSize - 1;
    log.info("Returning from " + start + " to " + end);
    return '';
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
console.log(APP_AUTHOR);
console.log("Version: " + packageDotJSON.version);
program.version(packageDotJSON.version);
program.option('-s, --start <searchStr>', 'Search start of function name for <string>');
program.option('-e, --end <searchStr>', 'Search end of function name for <string>');
program.option('-p --percentage <percentage>', '');
program.option('-i, --iteration <iteration>', '1');
program.option('-d, --debug', 'Output extra information during operation');
program.parse();
var options = program.opts();
if (options.debug) {
    console.log('\nEnabling debug mode');
    log.level(log.DEBUG);
}
else {
    log.level(log.INFO);
}
log.debug(options);
if (isValidConfig()) {
    var strFunctionList = void 0;
    if (options.percentage) {
        options.iteration = options.iteration ? options.iteration : "1";
        var pct = parseInt(options.percentage, 10);
        var iter = parseInt(options.iteration, 10);
        if (pct < 1 || pct > 100) {
            log.info(chalk.red("\nInvalid percentage value: " + pct + " (Must be 1-100)"));
            process.exit(1);
        }
        var ceiling = Math.ceil(100 / pct);
        if (iter > ceiling) {
            log.info(chalk.red("\nInvalid iteration value: " + iter + " (Must be 1-" + ceiling + ")"));
            process.exit(1);
        }
        strFunctionList = processPercentage(pct / 100, iter);
    }
    else {
        strFunctionList = processSearch(options.start, options.end);
    }
    if (strFunctionList.length > 0) {
        var commandStr = COMMAND_ROOT + strFunctionList;
        if (options.debug) {
            log.info(commandStr);
        }
        else {
            log.debug('Executing Firebase command');
            exec(commandStr, function (error, stdout, stderr) {
                if (error) {
                    log.error("error: " + error.message);
                }
                if (stderr) {
                    log.error("stderr: " + stderr);
                }
                log.info("stdout: " + stdout);
            });
        }
    }
    else {
        log.info(chalk.red('\nNo function match for specified options'));
        process.exit(1);
    }
}
