#!/usr/local/bin/node

let program = require("commander");
let request = require("superagent");
let path = require("path");
let jsonfile = require("jsonfile");
let co = require("co");
let prompt = require("co-prompt");
let clitable = require("cli-table");

const os = require("os");
const url = "https://slack.com/api/users.profile.set";
const DEBUG = true;

let cfg, providedToken, presetVar;

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
    presetVar = preset;
    console.log("Preset selected: " + preset);
  });

  program.command("default").description("Restores your default status (can be set with setdefault").action(() => {
    mode = "default";
  });

  program.command("list-presets").description("Lists the available presets").action(() => {
    mode = "list";
  });

  program.command("save-preset <preset>").description("Saves the preset defined by -e and -m").action((preset) => {
    mode = "save";
    presetVar = preset;
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
  case "list":
    if(typeof cfg.presets !== "undefined" && cfg.presets.length > 0) {
      console.log("Defined presets:");
      let table = new clitable({
        head: ["Preset name", "Emoji", "Message"]
      });
      for(let i in cfg.presets) {
        table.push([
          cfg.presets[i].name,
          cfg.presets[i].emoji,
          cfg.presets[i].message
        ]);
        //console.log(" - " + cfg.presets[i].name);
      }
      console.log(table.toString());
    } else {
      console.log("No presets found!");
    }
    break;
  case "save":
    if(typeof pr.emoji === "undefined" || typeof pr.emoji === "undefined") {
      console.log("Missing preset arguments -e <emoji> and -m <message>!");
      return;
    }
    if(typeof cfg.presets === "undefined") {
      cfg.presets = [];
    }
    for(let i in cfg.presets) {
      if(cfg.presets[i].name === presetVar) {
        cfg.presets.splice(i, 1);
      }
    }
    if(pr.emoji.charAt(0) !== ":") {
      pr.emoji = ":" + pr.emoji;
    }
    if(pr.emoji.slice(-1) !== ":") {
      pr.emoji = pr.emoji + ":";
    }
    cfg.presets.push({
      name: presetVar,
      emoji: pr.emoji,
      message: pr.message
    });
    createOrUpdateConfig(configfile, cfg);
    console.log("Preset saved!");
    break;
  case "setDefault":
    if(typeof pr.emoji === "undefined" || typeof pr.emoji === "undefined") {
      console.log("Missing preset arguments -e <emoji> and -m <message>!");
      return;
    }
    if(pr.emoji.charAt(0) !== ":") {
      pr.emoji = ":" + pr.emoji;
    }
    if(pr.emoji.slice(-1) !== ":") {
      pr.emoji = pr.emoji + ":";
    }
    cfg.default = {
      name: presetVar,
      emoji: pr.emoji,
      message: pr.message
    };
    createOrUpdateConfig(configfile, cfg);
    console.log("Default preset saved!");
    break;
  case "default":
    updateStatus(providedToken, cfg.default.emoji, cfg.default.message);
    break;
  default: 
    console.log("No mode selected!");
  }
}

function updateStatus(updateToken, updateEmoji, updateMessage) {
  request.post(url, {
    method: "POST",
    body: {
      profile: encodeURIComponent(JSON.stringify({status_text: updateMessage, status_emoji: updateEmoji}))
    },
    auth: {
      bearer: updateToken
    }
  }, (err, response, body) => {
    if(!err) {
      if(typeof response.body !== "undefined") {
        if(response.body.ok) {
          console.log("Status updated successfully!");
        } else {
          console.log("Error: " + response.body.error);
        }
      }
    } else {
      console.log("Error!");
    }
  });
}