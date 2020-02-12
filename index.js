#!/usr/bin/env node

// Copyright (c) 2019-2020 Neruthes <i@neruthes.xyz> <OpenPGP:0x5200DF38>
// Published under GNU AGPL v3 license. <https://www.gnu.org/licenses/agpl-3.0.html>

const pkg = require('./package.json');

const fs = require('fs');
const exec = require('child_process').exec;

const homedir = require('os').homedir();

// --------------------------------------------

exec(`
mkdir ~/.xyz.neruthes.clipass.v1;
mkdir ~/.xyz.neruthes.clipass.v1/password;
mkdir ~/.xyz.neruthes.clipass.v1/tbotp;
`);

// --------------------------------------------

var $args = process.argv.slice(2);

// --------------------------------------------

const DBMan = {
    read: function (category, name) {
        try {
            fs.readFileSync(homedir+`/.xyz.neruthes.clipass.v1/${category}/${name}`).toString().trim();
            return {
                err: 0,
                res: fs.readFileSync(homedir+`/.xyz.neruthes.clipass.v1/${category}/${name}`).toString().trim()
            };
        } catch (e) {
            return {
                err: 1,
                msg: 'No match found in database entry'
            }
        };
    },
    write: function (category, name, content) {
        try {
            // fs.writeFileSync(`~/.xyz.neruthes.clipass.v1/${category}/${name}`, content);
            fs.writeFileSync(homedir+`/.xyz.neruthes.clipass.v1/${category}/${name}`, content);
            return {
                err: 0,
                res: null
            };
        } catch (e) {
            return {
                err: 1,
                msg: 'Cannot write database'
            }
        } finally {
        }
    }
};

const commandHandlerAliasTable = {
    'help': 'help',
    'h': 'help',

    'set': 'set',
    's': 'set',
    'set-sudo': 'set-sudo',

    'copy': 'copy',
    'c': 'copy',

    'print': 'print',
    'p': 'print',

    'ls': 'ls-password',
    'rm': 'rm-password'
};

const subcommandEntryDebugInfo = function (args) {
    // console.log(`[Invoked Subcommand] ${matchedSubcommand}, args`, args.slice(1));
};

const commandHandlers = {
    'help': function () {
        subcommandEntryDebugInfo([]);
        console.log(
`Clipass - Help Document

Usages:
    clipass set [entry name] [password]     : Set a password
    clipass copy [entry name]               : Copy a password to clipboard

Your data is stored at: ~/.xyz.neruthes.clipass.v1
`
        );
    },
    'set': function (args) {
        var _def_args = [ '', 'Entry Name', 'Password', '--force' ];
        subcommandEntryDebugInfo(args);
        var query1 = DBMan.read('password', args[1]);
        if (args[3] === '-f' || query1.err === 1) { // Good
            commandHandlers['set-sudo'](args);
        } else {
            console.error(`[ERROR 400] Entry name "${decodeURIComponent(args[1])}" already exists; use "clipass set-sudo" to overwrite.`);
        };
    },
    'set-sudo': function (args) {
        var _def_args = [ '', 'Entry Name', 'Password' ];
        var query2 = DBMan.write('password', args[1], args[2]);
        if (query2.err === 0) { // Good
            console.log(`Success! Saved a password as "${decodeURIComponent(args[1])}"`);
        } else {
            console.error('[ERROR 500] DB: Cannot write data');
        };
    },
    'copy': function (args) {
        var _def_args = [ '', 'Entry Name' ];
        subcommandEntryDebugInfo(args);
        var query = DBMan.read('password', args[1]);
        if (query.err !== 0) {
            console.error('[ERROR 300] ' + query.msg);
        } else { // Good
            console.log('[Notice] The password has been copied into clipboard.');
            var tmpFileName = homedir + '/.xyz.neruthes.clipass.v1/tmp-b1b8652287f0.txt';
            fs.writeFileSync(tmpFileName, query.res);
            exec(`cat ${tmpFileName} | pbcopy; rm ${tmpFileName};`);
        };
    },
    'print': function (args) {
        var _def_args = [ '', 'Entry Name' ];
        subcommandEntryDebugInfo(args);
        var query = DBMan.read('password', args[1]);
        if (query.err !== 0) {
            console.error('[ERROR 300] ' + query.msg);
        } else { // Good
            console.log(query.res);
            // exec(`echo "${query.res}" | pbcopy`);
        };
    },
    'ls-password': function (args) {
        subcommandEntryDebugInfo(args);
        exec('ls ~/.xyz.neruthes.clipass.v1/password', function (err, stdin, stderr) {
            console.log(`[Notice] Total passwords: ${stdin.trim().split('\n').length}\n----------------`);
            if (stdin.length > 0) {
                console.log(decodeURIComponent(stdin));
            };
        });
    },
    'rm-password': function (args) {
        var _def_args = [ '', 'Entry Name' ];
        subcommandEntryDebugInfo(args);
        try {
            fs.unlink(homrdir+`/.xyz.neruthes.clipass.v1/password/${args[1]}`);
            console.log(`[Notice] Successfully deleted password of "${args[1]}"`);
        } catch (e) {
            console.error(`[ERROR 600] Cannot delete file "~/.xyz.neruthes.clipass.v1/password/${args[1]}"\n${(new Array('[ERROR 600] '.length)).fill(' ').join('')}You may try deleting it manually`);
        };
    }
};

// --------------------------------------------

if ($args.length === 0) { // No subcommand supplied
    commandHandlers.help();
} else {
    var givenSubcommand = $args[0];
    var matchedSubcommand = '';
    if (commandHandlerAliasTable[givenSubcommand]) {
        matchedSubcommand = commandHandlerAliasTable[givenSubcommand];
    } else {
        console.error('[ERROR 200] Invalid subcommand. No such usage.');
    };
    if (matchedSubcommand !== '') {
        commandHandlers[matchedSubcommand]([
            $args[0],
            encodeURIComponent($args[1]),
        ].concat($args.slice(2)));
    };
};

// --------------------------------------------
// --------------------------------------------
