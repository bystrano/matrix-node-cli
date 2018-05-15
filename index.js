#!/usr/bin/env node

/**
 * Parse the CLI arguments and dispatch the commands.
 */
var program = require('commander');

program
    .version('0.0.1')
    .option('-u --user <username>', 'Specify the matrix user')
    .option('-p --password <password>', 'Specify the matrix password')
    .option('-s --server <server>', 'Specify the matrix server');

program
    .command('send <room> <message>')
    .description('Send a message to a room')
    .action(sendCommand);

// If no known command, output help
program
    .command('*')
    .action(function () {
        program.outputHelp();
    });

program.parse(process.argv);


/**
 * Get the options, asking for input if necessary.
 */
var options = {};

function getOptions() {
    var co = require('co'),
        prompt = require('co-prompt'),
        options = {
            user: program.user,
            password: program.password,
            server: program.server
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
 * Commands
 */
function sendCommand(room, msg) {

    getOptions().then(function (options) {

        console.log(options);
        console.log('send ' + msg + ' to ' + room);

        return options;
    });
}
