#!/usr/bin/env node

"use strict";


/**
 * Initialization
 */
const fs = require('fs');

global.Olm = require('olm');

const tmpDir = '.matrix-localstorage';

mkdirIfNotExists(tmpDir);

const LocalStorage = require('node-localstorage').LocalStorage;
const localStorage = new LocalStorage(tmpDir);


/**
 * Parse the CLI arguments and dispatch the commands.
 */
const program = require('commander');

program
    .version('0.1.0')
    .option('-u --user <username>', 'Specify the matrix user')
    .option('-p --password <password>', 'Specify the matrix password')
    .option('-s --server <server>', 'Specify the matrix server')
    .option('-e --encrypted', 'Use end-to-end encryption');

program
    .command('send <room> <message>')
    .description('Send a message to a room')
    .action(sendCommand);

// If no known command, output help
program
    .command('*')
    .action(function() {
        program.outputHelp();
    });

program.parse(process.argv);


/**
 * Get the options, asking for input if necessary.
 *
 * @return {object} the options
 */
function getOptions() {
    const co = require('co');
    const prompt = require('co-prompt');
    const options = {
        user: program.user,
        password: program.password,
        server: program.server,
        encrypted: program.encrypted,
    };

    return co(function* () {
        if (options.user === undefined) {
            options.user = yield prompt('username: ');
        }

        if (options.password === undefined) {
            options.password = yield prompt.password('password: ');
        }

        if (options.server === undefined) {
            options.server = yield prompt('server: ');
        }

        process.stdin.pause();

        return options;
    });
}

/**
 * Clean-up after the message is sent.
 */
function cleanUp() {
    rmDirRecursively(tmpDir);
}

/**
 * Commands
 */

/**
 * Send a message to a room.
 *
 * @param {string} room - the roomId
 * @param {string} msg - the message to send
 */
function sendCommand(room, msg) {
    getOptions().then(function(options) {
        // console.log(options);
        // console.log('send ' + msg + ' to ' + room);

        const sdk = require("matrix-js-sdk");

        sdk.createClient(options.server)
            .loginWithPassword(options.user, options.password, function(err, res) {
                // console.log("On login: Err %j, res %j", err, res);
                if (err) {
                    console.error(err.toString());
                    return;
                }

                if (! options.encrypted) {
                    const authedClient = sdk.createClient({
                        baseUrl: options.server,
                        accessToken: res.access_token,
                        userId: res.user_id,
                    });

                    authedClient.sendTextMessage(room, msg);
                } else {
                    const matrixStore = new sdk.MatrixInMemoryStore();
                    const authedClient = sdk.createClient({
                        baseUrl: options.server,
                        accessToken: res.access_token,
                        userId: res.user_id,
                        sessionStore: new sdk.WebStorageSessionStore(localStorage),
                        store: matrixStore,
                        deviceId: res.device_id,
                    });

                    authedClient.initCrypto()
                        .then(function() {
                            authedClient.sendTextMessage(room, msg, null, cleanUp);
                        });
                }
            });
    });
}


/**
 * Utilities
 */

function mkdirIfNotExists(directory) {
    try {
        fs.mkdirSync(directory);
    } catch (err) {
        // Do nothing if directory already exists, exit otherwise
        if (err.code !== 'EEXIST') {
            console.log('Could not create directory %s: %s', directory, err.code);
            process.exit(1);
        }
    }
}

function rmDirRecursively(dirPath) {
    let files;

    try {
        files = fs.readdirSync(dirPath);
    } catch (e) {
        return;
    }

   if (files.length > 0) {
        for (let i = 0; i < files.length; i++) {
            const filePath = dirPath + '/' + files[i];
            if (fs.statSync(filePath).isFile()) {
                fs.unlinkSync(filePath);
            } else {
                rmDirRecursively(filePath);
            }
        }
    }

    fs.rmdirSync(dirPath);
}
