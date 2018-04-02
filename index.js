#!/usr/local/bin/node
let program = require("commander");
let request = require("superagent");
let path = require("path");
let jsonfile = require("jsonfile");
let co = require("co");
let prompt = require("co-prompt");

const os = require("os");
const DEBUG = true;

let cfg, providedToken, providedUsePreset;

let mode = null;

let pr = parseArgs(process.argv);

let configfile = path.resolve(os.homedir(), ".slackstatus");
if(pr.config) {
  configfile = pr.config;
}

handleConfig(configfile).then((returncfg) => {
  cfg = returncfg;
  let modecheck = setInterval(() => {
    if (mode !== null) {
      clearInterval(modecheck);
      handleMode();
    }
  }, 100);
});

function parseArgs(args) {
  program
    .version("1.0.0", "-v, --version");

  program.command("token [token]").description("Saves your token").action((token) => {
    mode = "token";
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
  });

  program.command("preset <preset>").description("Uses the preset (can be listed with command list-presets)").action((preset) => {
    mode = "usepreset";
    console.log("Preset selected: " + preset);
  });

  program.command("default").description("Restores your default status (can be set with setdefault").action(() => {
    mode = "default";
    console.log("Restoring default: " + cfg.default.emoji + " - " + cfg.default.message);
  });

  program.command("list-presets").description("Lists the available presets").action(() => {
    mode = "list";
    console.log("Defined presets: meeting, lunch");
  });

  program.command("setdefault").description("Sets the default status, use -e and -m to set").action(() => {
    mode = "setDefault";
    console.log("Preset to set: " + program.emoji + " - " + program.message);
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
  if(mode === null) {
    mode = "unset";
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

function handleMode() {
  switch(mode) {
  case "token":
    cfg.token = providedToken;
    createOrUpdateConfig(configfile, cfg);
    console.log("Saved new token!");
    break;
  default: 
    console.log("No mode selected!");
  }
}