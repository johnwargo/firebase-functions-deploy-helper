#!/usr/bin/env node
"use strict";
var boxen = require('boxen');
var chalk = require('chalk');
var fs = require('fs');
var logger = require('cli-logger');
var path = require('path');
var program = require('commander');
var shell = require('shelljs');
var packageDotJSON = require('./package.json');
var APP_NAME = 'Firebase Functions Deployment Helper (ffdh)';
var APP_AUTHOR = 'by John M. Wargo (https://johnwargo.com)';
var CURRENT_PATH = process.cwd();
var EXIT_HEADING = chalk.red('Exiting:');
var firebaseConfigFile = 'firebase.json';
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
    var filePath = path.join(CURRENT_PATH, firebaseConfigFile);
    if (!checkFile(filePath)) {
        log.info(EXIT_HEADING + (" Unable to locate the " + filePath + " file\n"));
        return false;
    }
    else {
        log.info("Located " + filePath);
    }
    var firebaseConfig = require("./" + firebaseConfigFile);
    var functionsPath = firebaseConfig.functions.source;
    if (functionsPath) {
        filePath = path.join(CURRENT_PATH, functionsPath);
        console.log("Determined Firebase functions folder: " + filePath);
        if (!checkDirectory(filePath)) {
            log.info(EXIT_HEADING + (" Unable to locate the " + filePath + " folder\n"));
            return false;
        }
        else {
            log.info("Located " + filePath);
        }
    }
    else {
        log.info(EXIT_HEADING + (" Unable to locate the " + filePath + " folder\n"));
        return false;
    }
    var res = shell.which('firebase');
    if (res) {
        filePath = res.toString();
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
console.log(APP_NAME);
console.log(APP_AUTHOR);
console.log("Version: " + packageDotJSON.version);
program.version(packageDotJSON.version);
program.option('-e,', 'Search the end of function names');
program.option('-i,', '');
program.option('-s,', '');
program.option('-%', '');
program.option('-d, --debug', 'Output extra information during operation');
program.parse(process.argv);
var options = program.opts();
if (options.debug) {
    console.log('Enabling debug mode');
    log.level(log.DEBUG);
}
else {
    log.level(log.INFO);
}
log.debug(program.opts());
if (isValidConfig()) {
    console.log('woohoo!');
}
else {
    console.log(chalk.red('Exiting'));
}
