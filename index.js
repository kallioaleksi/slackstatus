#!/usr/local/bin/node
let program = require("commander");
let request = require("superagent");
let path = require("path");
let jsonfile = require("jsonfile");
let co = require("co");
let prompt = require("co-prompt");

const os = require("os");
const DEBUG = true;

let cfg, mode, providedToken, providedUsePreset;

let pr = parseArgs(process.argv);

let configfile = path.resolve(os.homedir(), ".slackstatus");
if(pr.config) {
  configfile = pr.config;
}

handleConfig(configfile).then((cfg) => {
  switch(mode) {
  case "token":
    cfg.token = providedToken;
    createOrUpdateConfig(configfile, cfg);
    console.log("Saved new token!");
    break;
  default: 
    console.log("No mode selected!");
  }
});

function parseArgs(args) {
  program
    .version("1.0.0", "-v, --version");

  program.command("token [token]").description("Saves your token").action((token) => {
    if(!token) {
      co(function *() {
        let tmpToken = yield prompt("Token: ");
        return tmpToken;
      }).then((value) => {
        providedToken = value;
      }).then(() => {
        process.stdin.pause();
      });
    } else {
      providedToken = token;
    }
    mode = "token";
  });

  program.command("preset <preset>").description("Uses the preset (can be listed with command list-presets)").action((preset) => {
    console.log("Preset selected: " + preset);
  });

  program.command("default").description("Restores your default status (can be set with setdefault").action((preset) => {
    console.log("Restoring default: " + cfg.default.emoji + " - " + cfg.default.message);
  });

  program.command("list-presets").description("Lists the available presets").action(() => {
    console.log("Defined presets: meeting, lunch");
  });

  program.command("setdefault").description("Sets the default status, use -e and -m to set").action((preset) => {
    console.log("Preset to set: " + emoji + " - " + message);
  });

  program
    .option("-e, --emoji <emoji>", "Use custom emoji")
    .option("-m, --message <message>", "Use custom message")
    .option("-c, --config <configfile>", "Define alternative config file")
    .parse(args);

  //program.parse(process.argv);
  if (!args.slice(2).length) {
    program.outputHelp();
  }

  return program;
}

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

function createOrUpdateConfig(configFile, template) {
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

function handleConfig(configfile) {
  return new Promise((resolve, reject) => {
    loadConfig(configfile).then((data) => {
      console.log("Loaded config!");
      resolve(data);
    }, (err) => {
      if(DEBUG) console.log(err);
      console.log("Error loading config, trying to create...");
      let template = {"token": ""};
      createOrUpdateConfig(configfile, template).then((config) => {
        console.log("Config created successfully!");
        resolve(config);
      }, (err) => {
        if(DEBUG) console.log(err);
        console.log("Couldn't create configfile, quitting!");
        process.exit(1);
      });
    }).catch((err) => {
      reject(err);
    });
  });
}