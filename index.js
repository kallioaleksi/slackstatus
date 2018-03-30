#!/usr/local/bin/node
let program = require("commander");
let request = require("superagent");
let path = require("path");
let jsonfile = require("jsonfile");

const os = require("os");
const DEBUG = true;

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

loadConfig(configfile).then((data) => {
  console.log("Loaded config!");
  cfg = data;
}, (err) => {
  if(DEBUG) console.log(err);
  console.log("Error loading config, trying to create...");
  let template = {"token": ""};
  let createP = createConfig(configfile, template);
  createP.then((config) => {
    console.log("Config created successfully!");
    cfg = config;
  }, (err) => {
    if(DEBUG) console.log(err);
    console.log("Couldn't create configfile, quitting!");
    process.exit(1);
  });
}).catch((err) => {
  console.log(err);
});

function loadConfig(configFile) {
  return new Promise((resolve, reject) => {
    jsonfile.readFile(configFile, (err, data) => {
      if(err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

function createConfig(configFile, template) {
  return new Promise((resolve, reject) => {
    jsonfile.writeFile(configFile, template, (err) => {
      if(err) {
        reject(err);
      } else {
        resolve(template);
      }
    });
  });
}