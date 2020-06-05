#!/usr/bin/env node

// Copyright (c) 2019-2020 Neruthes <i@neruthes.xyz> <OpenPGP:0x5200DF38>
// Published under GNU AGPL v3 license. <https://www.gnu.org/licenses/agpl-3.0.html>

const pkg = require('./package.json');

const fs = require('fs');
const exec = require('child_process').exec;
const crypto = require('crypto');
const CryptoJS = require('crypto-js');

const homedir = require('os').homedir();

// --------------------------------------------

exec(`
mkdir ~/.config/.xyz.neruthes.clipass.v2;
mkdir ~/.config/.xyz.neruthes.clipass.v2/password;
mkdir ~/.config/.xyz.neruthes.clipass.v2/tbotp;
mkdir ~/.config/.xyz.neruthes.clipass.v2/globalAesKey.backups;
echo "globalAesKey" > ~/.config/.xyz.neruthes.clipass.v2/.gitignore;
echo "globalAesKey.backups/*" > ~/.config/.xyz.neruthes.clipass.v2/.gitignore;
`);

// --------------------------------------------

var $args = process.argv.slice(2);

// --------------------------------------------
// Init

let globalAesKey = '';
(function () {
    if (fs.existsSync(homedir+`/.config/.xyz.neruthes.clipass.v2/globalAesKey`)) {
        var tmpglobalAesKey = fs.readFileSync(homedir+`/.config/.xyz.neruthes.clipass.v2/globalAesKey`).toString().trim();
        if (tmpglobalAesKey.length > 5) {
            globalAesKey = tmpglobalAesKey;
            return 0;
        };
    };
    globalAesKey = crypto.prng(32).toString('hex');
    fs.writeFileSync(homedir+`/.config/.xyz.neruthes.clipass.v2/globalAesKey`, globalAesKey);
    fs.writeFileSync(homedir+`/.config/.xyz.neruthes.clipass.v2/globalAesKey.backups/keyBakcup_${(new Date()).toISOString().slice(0,19).replace(/\:/g, '.').replace('T', '_')}.key`, globalAesKey);
})();

// --------------------------------------------

const DBMan = {
    read: function (category, name) {
        try {
            fs.readFileSync(homedir+`/.config/.xyz.neruthes.clipass.v2/${category}/${name}`).toString().trim();
            return {
                err: 0,
                res: CryptoJS.AES.decrypt(fs.readFileSync(homedir+`/.config/.xyz.neruthes.clipass.v2/${category}/${name}`).toString().trim(), globalAesKey).toString(CryptoJS.enc.Utf8)
            };
        } catch (e) {
            return {
                err: 1,
                msg: 'No match found in database entry'
            }
        };
    },
    readRaw: function (category, name) {
        try {
            fs.readFileSync(homedir+`/.config/.xyz.neruthes.clipass.v2/${category}/${name}`).toString().trim();
            return {
                err: 0,
                res: fs.readFileSync(homedir+`/.config/.xyz.neruthes.clipass.v2/${category}/${name}`).toString().trim()
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
            fs.writeFileSync(homedir+`/.config/.xyz.neruthes.clipass.v2/${category}/${name}`, CryptoJS.AES.encrypt(content, globalAesKey));
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
    },
    writeRaw: function (category, name, content) {
        try {
            fs.writeFileSync(homedir+`/.config/.xyz.neruthes.clipass.v2/${category}/${name}`, content);
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
    'man': 'man',

    'set': 'set',
    's': 'set',
    'set-sudo': 'set-sudo',

    'gen': 'gen',
    'g': 'gen',

    'copy': 'copy',
    'c': 'copy',

    'print': 'print',
    'p': 'print',

    'ls': 'ls-password',
    'rm': 'rm-password',

    'clear': 'clear',
    'cl': 'clear'
};

const subcommandEntryDebugInfo = function (args) {
    // console.log(`[Invoked Subcommand] ${matchedSubcommand}, args: ` + args);
};

const ct = {
    red: `\x1b[31m%s\x1b[0m`,
    green: `\x1b[32m%s\x1b[0m`,
    yellow: `\x1b[33m%s\x1b[0m`
};

const c = {
    end: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m'
};

const normalizeFilename = function (filename) {
    return filename.replace(/\./g, ' ').trim().replace(/\s/g, '.').replace(/[^@\d\w\.]/g, '-');
};

const commandHandlers = {
    'help': function (args) {
        subcommandEntryDebugInfo(args);
        console.log(
`
${c.green}Clipass${c.end} (v${pkg.version}) is a Free Software, as published under <GNU AGPL 3.0> license.

The source code is available at <https://github.com/neruthes/Clipass>.
Copyright (c) 2019-2020 Neruthes <https://neruthes.xyz/>.

${(new Array(74)).fill('#').join('')}

Usages:
    ${c.green}clipass set {entry name} {password}     ${c.end}: Set a password
    ${c.green}clipass gen {entry name} {complexity}   ${c.end}: Generate a password
    ${c.green}clipass copy {entry name}               ${c.end}: Copy a password to clipboard

Other subcommands:
    ${'print,ls,rm,clear'.split(',').map(x=>c.green+x+c.end).join(', ')}

Lookup subcommand-specific manual:
    ${c.green}clipass man {subcommand}${c.end}

Your data is stored at: ${c.green}~/.config/.xyz.neruthes.clipass.v2${c.end}
`
        );
    },
    'man': function (args) {
        var _def_args = [ '', 'subcommand' ];
        subcommandEntryDebugInfo(args);
        if (!commandHandlerAliasTable[args[1]]) {
            console.error(ct.red, '[ERROR] No such subcommand.');
            return 1;
        };
        var info = manpageInfo[commandHandlerAliasTable[args[1]]].trim();
        console.log(info);
    },
    'set': function (args) {
        var _def_args = [ '', 'Entry Name', 'Password', '--force, -f' ];
        subcommandEntryDebugInfo(args);
        var query1 = DBMan.read('password', normalizeFilename(args[1]));
        if (args[3] === '-f' || args[3] === '--force' || query1.err === 1) { // Good
            commandHandlers['set-sudo'](args);
        } else {
            console.error(ct.red, `[ERROR 400] Entry name "${normalizeFilename(args[1])}" already exists; append "-f" or "--force" to overwrite.`);
        };
    },
    'set-sudo': function (args) {
        var _def_args = [ '', 'Entry Name', 'Password' ];
        var query2 = DBMan.write('password', normalizeFilename(args[1]), args[2]);
        if (query2.err === 0) { // Good
            console.log(ct.green, `[Notice] Success! Saved a password as "${normalizeFilename(args[1])}".`);
        } else {
            console.error(ct.red, '[ERROR 500] Cannot write data.');
        };
    },
    'gen': function (args) {
        var _def_args = [ '', 'Entry Name', '[Complexity]', '--force, -f' ];
        subcommandEntryDebugInfo(args);
        var currentComplexity = 'h';

        if (!args[1]) {
            // Too few arguments
            console.error(ct.red, '[ERROR 100] Invalid invokation. Run "clipass h" to see help info.');
            return 1;
        };
        if (!args[2]) {
            // No specific args[2]
            console.error(ct.yellow, '[Warning] Complexity is not specified.');
        } else {
            // Given args[2]
            if (!args[2].match(/^(l|m|h|x|xx|-f|--force)$/)) {
                // Invalid args[2] value
                console.error(ct.red, '[ERROR 100] Invalid invokation. Run "clipass h" to see help info.');
                return 1;
            };
            if (!args[2].match(/^(l|m|h|x|xx)$/)) {
                // Warn: Complexity is not specified
                console.error(ct.yellow, '[Warning] Complexity is not specified.');
            };
        };

        // Predefined data
        var charsAlphabet = [
            '1234567890qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM', // 0: Traditional
            ']})~!@#%^&_+-=;:,./<>?', // 1: Symbols
            'ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩαβγδεζηθικλμνξοπρστυφχψωАБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзийклмнопрстуфхцчшщъыьэюя' // 2: Extension
        ];
        var complexityDict = {
            l: [1,8],
            m: [1,12],
            h: [2,16],
            x: [3,20],
            xx: [3,43],
        };

        // Query
        var query1 = DBMan.read('password', normalizeFilename(args[1]));
        if (args[2] === '-f' || args[2] === '--force' || args[3] === '-f' || args[3] === '--force' || query1.err === 1) { // Good
            // Generate
            if (!args[2]) {
                currentComplexity = 'h';
            } else if (args[2].match(/^(l|m|h|x|xx)$/)) { // Determine complexity
                currentComplexity = args[2].match(/^(l|m|h|x|xx)$/)[0];
            };
            var currentAlphabet = charsAlphabet.slice(0, complexityDict[currentComplexity][0]).join('');
            var currentPassword = new Array(complexityDict[currentComplexity][1]).fill(1).map(function (v, i) {
                return currentAlphabet[Math.floor(Math.random()*currentAlphabet.length)];
            }).join('');
            if (currentComplexity.match(/^(l|m)$/)) {
                currentPassword = currentPassword.replace(/(.{3})/g, '$1 ').trim().replace(/\s/g, '_');
            };
            // Save
            commandHandlers['set-sudo'](['', args[1], currentPassword]);
        } else {
            console.error(ct.red, `[ERROR 400] Entry name "${normalizeFilename(args[1])}" already exists; append "-f" or "--force" to overwrite.`);
        };
    },
    'copy': function (args) {
        var _def_args = [ '', 'Entry Name' ];
        subcommandEntryDebugInfo(args);
        var query1 = DBMan.read('password', normalizeFilename(args[1]));
        if (query1.err !== 0) {
            console.error(ct.red, '[ERROR 300] No match found in database. Use "clipass ls" to view the list.');
        } else { // Good
            console.log(ct.green, '[Notice] The password has been copied into clipboard.');
            var tmpFileName = homedir + '/.config/.xyz.neruthes.clipass.v2/tmp-b1b8652287f0.txt';
            fs.writeFileSync(tmpFileName, query1.res);
            exec(`cat ${tmpFileName} | pbcopy; rm ${tmpFileName};`);
        };
    },
    'print': function (args) {
        var _def_args = [ '', 'Entry Name' ];
        subcommandEntryDebugInfo(args);
        var query1 = DBMan.read('password', normalizeFilename(args[1]));
        if (query1.err !== 0) {
            console.error(ct.red, '[ERROR 300] No match found in database. Use "clipass ls" to view the list.');
        } else { // Good
            console.log(ct.green, query1.res);
        };
    },
    'ls-password': function (args) {
        subcommandEntryDebugInfo(args);
        exec('ls ~/.config/.xyz.neruthes.clipass.v2/password', function (err, stdin, stderr) {
            console.log(ct.green, `[Notice] Total passwords: ${stdin.length === 0 ? 0 : stdin.trim().split('\n').length}\n----------------`);
            if (stdin.length > 0) {
                console.log(stdin.trim().split('\n').map(x=>normalizeFilename(x)).join('\n'));
            };
        });
    },
    'rm-password': function (args) {
        var _def_args = [ '', 'Entry Name' ];
        subcommandEntryDebugInfo(args);
        try {
            fs.unlink(homedir+`/.config/.xyz.neruthes.clipass.v2/password/${args[1]}`, function () {});
            console.log(ct.green, `[Notice] Successfully deleted password of "${args[1]}"`);
        } catch (e) {
            console.error(ct.red, `[ERROR 600] Cannot delete file "~/.config/.xyz.neruthes.clipass.v2/password/${args[1]}"\n${(new Array(12)).fill(' ').join('')}You may try deleting it manually`);
        };
    },
    'clear': function (args) {
        exec('echo "NODATA" | pbcopy');
        console.log(ct.green, 'Cleared clipboard data.');
    }
};

const manpageInfo = {
    'help': `
Usage: Print help info
    $ ${c.green}clipass help${c.end}`,
// --------------------
    'man': `
Usage: Print subdommand manual
    $ ${c.green}clipass man {subcommand}${c.end}`,
// --------------------
    'set': `
Usage: Set a password
    $ ${c.green}clipass set {entry name} {password} [-f, --force]${c.end}

Shortcut:
    $ ${c.green}clipass s ...${c.end}`,
// --------------------
    'set-sudo': `See "clipass man set"`,
// --------------------
    'export': `
Usage: Export all passwords (bare, unprotected) (uninplemented yet)
$ ${c.green}clipass export {filename}${c.end}`,
// --------------------
    'import': `
Usage: Import several passwords (uninplemented yet)
$ ${c.green}clipass import {filename}${c.end}`,
// --------------------
    'gen': `
Usage: Generate a password
    $ ${c.green}clipass gen {entry name} {complexity}${c.end}

Shortcut:
    $ ${c.green}clipass g ...${c.end}

Def {Complexity}:
    l    -  Low complexity.            8-char.
    m    -  Medium complexity.         12-char.
    h    -  High complexity.           16-char.
    x    -  Extreme complexity.        20-char.
    xx   -  Super Extreme complexity.  32-char.`,
// --------------------
    'copy': `
Usage: Copy a password to clipboard
    $ ${c.green}clipass copy {entry name}${c.end}

Shortcut:
    $ ${c.green}clipass c ...${c.end}`,
// --------------------
    'print': `
Usage: Print a password to terminal
    $ ${c.green}clipass print {entry name}${c.end}

Shortcut:
    $ ${c.green}clipass p ...${c.end}`,
// --------------------
    'ls-password': `
Usage: Show list of password entries
    $ ${c.green}clipass ls${c.end}`,
// --------------------
    'rm-password': `
Usage: Delete a password entry
    $ ${c.green}clipass rm {entry name}${c.end}`,
// --------------------
    'clear': `
Usage: Clear clipboard data
    $ ${c.green}clipass clear${c.end}

Shortcut:
    $ ${c.green}clipass cl${c.end}`
};

// --------------------------------------------

if ($args.length === 0) { // No subcommand supplied
    commandHandlers.help(['', '']);
} else {
    var givenSubcommand = $args[0];
    var matchedSubcommand = '';
    if (commandHandlerAliasTable[givenSubcommand]) {
        matchedSubcommand = commandHandlerAliasTable[givenSubcommand];
    } else {
        console.error('[ERROR 200] Invalid subcommand. No such usage.');
    };
    if (matchedSubcommand !== '') {
        if ($args.length === 1) { // No argument for the subcommand
            commandHandlers[matchedSubcommand]([
                $args[0],
                ($args[1]),
            ]);
        } else {
            commandHandlers[matchedSubcommand]([
                $args[0],
                ($args[1]),
            ].concat($args.slice(2)));
        }
    };
};

// --------------------------------------------
// --------------------------------------------
