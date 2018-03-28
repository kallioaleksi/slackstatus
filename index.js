#!/usr/local/bin/node
let program = require("commander");
let request = require("superagent");
let path = require("path");
let jsonfile = require("jsonfile");

const os = require("os");

let cfg;

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
  .option("-c, --config <configfile>", "Define alternative config file")
  .parse(process.argv);

//program.parse(process.argv);
if (!process.argv.slice(2).length) {
  program.outputHelp();
}

let configfile = path.resolve(os.homedir(), ".slackstatus");
if(program.config) {
  configfile = program.config;
}

console.log("Using configfile: " + configfile);
loadConfig(configfile);


function loadConfig(configFile) {
  jsonfile.readFile(configfile, (err, loadedCfg) => {
    if(err) {
      if(err.code == "ENOENT") {
        console.log("Config file doesn't exit, creating...");
        createConfig(configFile);
      }
    }
    cfg = loadedCfg;
  });
}

function createConfig(configFile) {
  jsonfile.writeFile(configFile, {"token": ""}, (err) => {
    if(err) {
      console.log(err);
    }
  });
}