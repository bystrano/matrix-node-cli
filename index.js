#!/usr/bin/env node


/**
 * Parsing the CLI arguments
 */
var program = require('commander');

program
    .version('0.0.1')
    .option('-u --user', 'Specify the matrix user')
    .option('-p --password', 'Specify the matrix password');

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
 * Commands
 */
function sendCommand(room, msg) {

    console.log('send ' + message + ' to ' + room);
}
