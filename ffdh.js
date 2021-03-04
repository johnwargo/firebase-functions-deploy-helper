#!/usr/bin/env node
"use strict";
var boxen = require('boxen');
var chalk = require('chalk');
var fs = require('fs');
var logger = require('cli-logger');
var packageDotJSON = require('./package.json');
var path = require('path');
var program = require('commander');
var shell = require('shelljs');
var APP_NAME = 'Firebase Functions Deployment Helper';
var APP_AUTHOR = 'by John M. Wargo (https://johnwargo.com)';
var CURRENT_PATH = process.cwd();
var EXIT_HEADING = chalk.red('Exiting:');
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
    var filePath = path.join(CURRENT_PATH, '.firebaserc');
    if (!checkFile(filePath)) {
        log.info(EXIT_HEADING + (" Unable to locate the " + filePath + " file\n"));
        return false;
    }
    else {
        log.info("Located " + filePath);
    }
    filePath = path.join(CURRENT_PATH, 'firebase.json');
    if (!checkFile(filePath)) {
        log.info(EXIT_HEADING + (" Unable to locate the " + filePath + " file\n"));
        return false;
    }
    else {
        log.info("Located " + filePath);
    }
    filePath = path.join(CURRENT_PATH, 'functions');
    if (!checkDirectory(filePath)) {
        log.info(EXIT_HEADING + (" Unable to locate the " + filePath + " folder\n"));
        return false;
    }
    else {
        log.info("Located " + filePath);
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
console.log(boxen(APP_NAME, { padding: 1 }));
console.log(APP_AUTHOR);
console.log("Version: " + packageDotJSON.version);
program.version(packageDotJSON.version);
program.option('-d, --debug', 'Output extra information during operation');
program.option('-u, --update', 'Update the Assets definition in the pubspec.yaml file');
if (isValidConfig()) {
    program.parse(process.argv);
    var conf = program.debug ? log.DEBUG : log.INFO;
    log.level(conf);
    log.debug(program.opts());
}
else {
    console.log(chalk.red('Exiting'));
}
