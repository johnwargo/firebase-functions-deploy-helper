#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
var functionsFile = 'functions.json';
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
    log.info(chalk.yellow('Validating Firebase project'));
    var filePath = path.join(CURRENT_PATH, functionsFile);
    if (!checkFile(filePath)) {
        log.info(EXIT_HEADING + (" Unable to locate the " + filePath + " file\n"));
        return false;
    }
    else {
        log.info("Located " + filePath);
        var functionsList = require(filePath);
        console.log(functionsList);
    }
    filePath = path.join(CURRENT_PATH, firebaseConfigFile);
    if (!checkFile(filePath)) {
        log.info(EXIT_HEADING + (" Unable to locate the " + filePath + " file\n"));
        return false;
    }
    else {
        log.info("Located " + filePath);
    }
    var firebaseConfig = require("./" + firebaseConfigFile);
    var sourceStr = firebaseConfig.functions.source;
    if (sourceStr) {
        filePath = path.join(CURRENT_PATH, sourceStr);
        console.log("Determined Firebase functions folder: " + filePath);
        if (!checkDirectory(filePath)) {
            log.info(EXIT_HEADING + (" Unable to locate the " + filePath + " folder\n"));
            return false;
        }
        else {
            log.info("Located " + filePath);
            var modulePath = path.join(filePath, 'src', 'index.ts');
            Promise.resolve().then(function () { return __importStar(require(modulePath)); }).then(function (obj) {
                console.dir(obj);
            })
                .catch(function (err) {
                console.dir(err);
            });
        }
    }
    else {
        log.info(EXIT_HEADING + ' Unable to determine the Functions source folder\n');
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
console.log("Version: " + packageDotJSON.version + "\n");
program.version(packageDotJSON.version);
program.option('-s, --start <searchStr>', 'Search function name start for <string>');
program.option('-e, --end <searchStr>', 'Search function name end for <string>');
program.option('-p, -% <percentage>', '');
program.option('-i, --iteration <iteration>', '');
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
