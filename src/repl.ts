#!/usr/bin/env node

import * as ricecakes from '@module/compiler';
import * as flour from '@module/flour';
import * as figlet from 'figlet';
import * as readline from 'readline';
import chalk from 'chalk';

function questionAsync(repl: readline.Interface, prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    repl.question(prompt, (answer) => {
      resolve(answer);
    })
  });
}

/**
 * The entry point for our Scheme REPL.
 */
async function main(): Promise<void> {
  // TODO(kosinw): Add command line argument to disable banner and version
  const banner = chalk.blue(figlet.textSync('mochi', { font: 'Slant' }));
  const authors = chalk.blue('Version 0.1.0');
  const repo = chalk.blue('https://github.com/kosinw/mochi/');
  const notice = chalk.green('This is free software; see the source for copying conditions.\nThere is NO warranty; not even for MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.');

  console.log(banner);
  console.log(authors);
  console.log(repo);
  console.log();
  console.log(notice);
  console.log();

  const repl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  while (true) {
    const response = await questionAsync(repl, chalk.green('λ > '));
    const object = ricecakes.compile(response);

    console.log(chalk.dim(flour.disassemble(object)));
  }
}

if (require.main === module) {
  void main();
}