#!/usr/bin/env node

import * as ricecakes from '@module/compiler';
import * as flour from '@module/flour';
import figlet from 'figlet';
import readline from 'node:readline';
import chalk from 'chalk';
import assert from 'assert';
import util from 'util';
import { hexdump } from '@gct256/hexdump';

function count(s: string, c: string): number {
  assert(c.length === 1);

  return s
    .split("")
    .filter(ch => ch === c)
    .length;
}

/**
 * Asks use for multiple-line input.
 * 
 * @param prompt a prompt
 * @returns (a promise for) user response
 */
function question(
  prompt: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const PAIRS: [string, string][] = [
      ['(', ')'],
      ['{', '}'],
      ['[', ']']
    ];

    const repl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      tabSize: 2,
      prompt
    });

    const buffer: string[] = [];

    repl.addListener('line', (input) => {
      buffer.push(input);

      const program = buffer.join("\n");

      // const matched = PAIRS.
      //   every(pair =>
      //     count(
      //       program,
      //       pair[0]
      //     ) === count(
      //       program,
      //       pair[1]
      //     ));

      // if (matched) {
      repl.close();
      // }

      // repl.setPrompt("...");
    });

    repl.addListener('SIGINT', () => { process.exit(0); });

    repl.addListener('close', () => {
      resolve(buffer.join('\n'));
      return;
    });

    repl.prompt(true);
  });
}

/**
 * The entry point for our Scheme REPL.
 */
async function main(): Promise<void> {
  // TODO(kosinw): Add command line argument to disable banner and version
  const banner = chalk.blue(figlet.textSync('mochi', { font: 'Slant' }));
  const title = chalk.blue('mochi Scheme 0.1.0');
  const repo = chalk.blue('https://github.com/kosinw/mochi/');
  const notice = chalk.green('This is free software; see the source for copying conditions.\nThere is NO warranty; not even for MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.');

  console.log(banner);
  console.log(title);
  console.log(repo);
  console.log();
  console.log(notice);
  console.log();

  let object = flour.makeObjectFile();

  while (true) {
    const response = await question(chalk.green('λ > '));

    if (response === ":object") {
      console.log(chalk.yellow(util.inspect(object, false, null)));
      continue;
    } else if (response === ":quit") {
      break;
    } else if (response === ":reset") {
      object = flour.makeObjectFile();
      continue;
    } else if (response === ":asm") {
      const buffer = flour.serialize(object);
      console.log(chalk.dim(hexdump(buffer).join("\n")));
      continue;
    } else if (response === ":dis") {
      console.log(chalk.dim(flour.disassemble(object)));
      continue;
    }

    try {
      object = ricecakes.compile(response);
      console.log(chalk.dim(flour.disassemble(object)));
    } catch (err) {
      console.error(chalk.red(err));
    }
  }
}

if (require.main === module) {
  void main();
}