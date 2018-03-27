#!/usr/local/bin/node
let program = require("commander");

program
  .arguments("<preset>")
  .option("-e, --emoji <emoji>", "Use custom emoji")
  .option("-m, --message <message>", "Use custom message")
  .parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}

