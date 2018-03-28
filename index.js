#!/usr/local/bin/node
let program = require("commander");

program
  .version("1.0.0", "-v, --version");

program
  .command("token <token>")
  .description("Saves your token")
  .action((token) => {
    console.log("Save token " + token);
  });

program
  .command("preset <preset>")
  .description("Uses the preset (can be listed with command list-presets)")
  .action((preset) => {
    console.log("Preset selected: " + preset);
  });

program
  .command("default")
  .description("Restores your default status (can be set with setdefault")
  .action((preset) => {
    console.log("Preset selected: " + preset);
  });

program
  .command("list-presets")
  .description("Lists the available presets")
  .action(() => {
    console.log("Defined presets: meeting, lunch");
  });

program
  .command("setdefault")
  .description("Sets the default status, use -e and -m to set")
  .action((preset) => {
    console.log("Preset selected: " + preset);
  });

program
  .option("-e, --emoji <emoji>", "Use custom emoji")
  .option("-m, --message <message>", "Use custom message")

program.parse(process.argv);
if (!process.argv.slice(2).length) {
  program.outputHelp();
}

