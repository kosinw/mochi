#!/usr/bin/env node

import * as ricecakes from '@module/compiler';
import * as flour from '@module/flour';
import figlet from 'figlet';
import * as readline from 'readline';
import chalk from 'chalk';
import assert from 'assert';
import util from 'util';

function countParens(s: string): Map<string, number> {
  const map = new Map([
    ["(", 0],
    ["{", 0],
    ["[", 0],
    [")", 0],
    ["}", 0],
    ["]", 0],
  ]);

  for (const char of s) {
    if (map.has(char)) {
      const v = map.get(char) ?? assert.fail();
      map.set(char, v + 1);
    }
  }

  return map;
}

function questionAsync(repl: readline.Interface, prompt: string, buffer: string = ''): Promise<string> {
  return new Promise((resolve, reject) => {
    repl.question(prompt, (answer) => {
      const fullAnswer = buffer + answer;
      const counts = countParens(fullAnswer);

      if (
        counts.get("(") === counts.get(")") &&
        counts.get("{") === counts.get("}") &&
        counts.get("[") === counts.get("]")
      ) {
        resolve(fullAnswer);
        return;
      }

      questionAsync(repl, "", fullAnswer + "\n")
        .then(response => resolve(response));
    })
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

  const repl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  while (true) {
    const response = await questionAsync(repl, chalk.green('λ > '));

    if (response === ":object") {
      console.log(chalk.yellow(util.inspect(object, false, null)));
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