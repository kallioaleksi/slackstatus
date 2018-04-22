#!/usr/local/bin/node

const program = require("commander");
const path = require("path");
const jsonfile = require("jsonfile");
const co = require("co");
const prompt = require("co-prompt");
const clitable = require("cli-table");
const os = require("os");
const { WebClient } = require("@slack/client");

const DEBUG = false;

let cfg,
  providedToken,
  presetVar;

let mode = null;

let pr = parseArgs(process.argv);

let configfile = path.resolve(os.homedir(), ".slackstatus");
if (pr.config) {
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
  program.version("1.0.0", "-v, --version");

  program
    .command("token [token]")
    .description("Saves your token")
    .action((token) => {
      mode = "token";
      if (!token) {
        co(function * () {
          let tmpToken = yield prompt("Token: ");
          return tmpToken;
        }).then((value) => {
          providedToken = value;
        }).then(() => {
          process
            .stdin
            .pause();
        });
      } else {
        providedToken = token;
      }
    });

  program
    .command("preset <preset>")
    .description("Uses the preset (can be listed with command list-presets)")
    .action((preset) => {
      mode = "usepreset";
      presetVar = preset;
    });

  program
    .command("default")
    .description("Restores your default status (can be set with setdefault)")
    .action(() => {
      mode = "default";
    });

  program
    .command("list-presets")
    .description("Lists the available presets")
    .action(() => {
      mode = "list";
    });

  program
    .command("save-preset <preset>")
    .description("Saves the preset defined by -e and -m")
    .action((preset) => {
      mode = "save";
      presetVar = preset;
    });

  program
    .command("setdefault")
    .description("Sets the default status, use -e and -m to set")
    .action(() => {
      mode = "setDefault";
    });

  program
    .command("set")
    .description("Sets the emoji and message provided with the -e and -m options")
    .action(() => {
      mode = "set";
    });

  program
    .option("-e, --emoji <emoji>", "Use custom emoji")
    .option("-m, --message <message>", "Use custom message")
    .option("-c, --config <configfile>", "Define alternative config file")
    .parse(args);

  if (!args.slice(2).length) {
    program.outputHelp();
  }
  if (mode === null) {
    mode = "unset";
  }
  return program;
}

function loadConfig(configFile) {
  return new Promise((resolve, reject) => {
    jsonfile.readFile(configFile, (err, data) => {
      if (err) {
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
      if (err) {
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
      resolve(data);
    }, (err) => {
      if (DEBUG) 
        console.log(err);
      console.log("Creating new configfile...");
      let template = {
        "token": ""
      };
      createOrUpdateConfig(configfile, template).then((config) => {
        resolve(config);
      }, (err) => {
        if (DEBUG) 
          console.log(err);
        console.log("Couldn't create configfile, quitting!");
        process.exit(1);
      });
    }).catch((err) => {
      reject(err);
    });
  });
}

function handleMode() {
  switch (mode) {
    case "token":
      cfg.token = providedToken;
      createOrUpdateConfig(configfile, cfg);
      console.log("Saved new token!");
      break;
    case "list":
      if (typeof cfg.presets !== "undefined" && cfg.presets.length > 0) {
        console.log("Defined presets:");
        let table = new clitable({
          head: ["Preset name", "Emoji", "Message"]
        });
        for (let i in cfg.presets) {
          table.push([cfg.presets[i].name, cfg.presets[i].emoji, cfg.presets[i].message]);
        }
        console.log(table.toString());
      } else {
        console.log("No presets found!");
      }
      break;
    case "save":
      if (typeof pr.message === "undefined" || typeof pr.emoji === "undefined") {
        console.log("Missing preset argument(s) -e <emoji> or -m <message>!");
        return;
      }
      if (typeof cfg.presets === "undefined") {
        cfg.presets = [];
      }
      for (let i in cfg.presets) {
        if (cfg.presets[i].name === presetVar) {
          cfg
            .presets
            .splice(i, 1);
        }
      }
      if (pr.emoji.charAt(0) !== ":") {
        pr.emoji = ":" + pr.emoji;
      }
      if (pr.emoji.slice(-1) !== ":") {
        pr.emoji = pr.emoji + ":";
      }
      cfg
        .presets
        .push({name: presetVar, emoji: pr.emoji, message: pr.message});
      createOrUpdateConfig(configfile, cfg);
      console.log("Preset saved!");
      break;
    case "setDefault":
      if (typeof pr.emoji === "undefined" || typeof pr.emoji === "undefined") {
        console.log("Missing preset arguments -e <emoji> and -m <message>!");
        return;
      }
      if (pr.emoji.charAt(0) !== ":") {
        pr.emoji = ":" + pr.emoji;
      }
      if (pr.emoji.slice(-1) !== ":") {
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
      updateStatus(cfg.token, cfg.default.emoji, cfg.default.message);
      break;
    case "usepreset":
      for (let i in cfg.presets) {
        if (cfg.presets[i].name === presetVar) {
          updateStatus(cfg.token, cfg.presets[i].emoji, cfg.presets[i].message);
          break;
        }
      }
      break;
    case "set":
      if (typeof pr.emoji === "undefined" || typeof pr.emoji === "undefined") {
        console.log("Missing preset arguments -e <emoji> and -m <message>!");
        return;
      }
      if (pr.emoji.charAt(0) !== ":") {
        pr.emoji = ":" + pr.emoji;
      }
      if (pr.emoji.slice(-1) !== ":") {
        pr.emoji = pr.emoji + ":";
      }
      updateStatus(cfg.token, pr.emoji, pr.message);
      break;
    default:
      console.log("No mode selected!");
  }
}

function updateStatus(updateToken, updateEmoji, updateMessage) {
  let profile = {
    status_text: updateMessage,
    status_emoji: updateEmoji
  };
  let web = new WebClient(updateToken);
  web.users.profile.set({profile: profile})
    .then((res) => {
      if (res.ok) {
        console.log("Status updated successfully!");
      } else {
        console.log("Error: " + res.error);
      }
    });
}