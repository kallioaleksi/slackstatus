# slackstatus
CLI program to set status to Slack. Just a simple CLI program which should be easy to use when interfacing with other apps. The goal is to have a scriptable way to e.g. update Spotify information to Slack status, automatically set status to "In a meeting" when in Hangouts etc...

    Usage: slackstatus [options] [command]

    Options:

      -v, --version              output the version number
      -e, --emoji <emoji>        Use custom emoji
      -m, --message <message>    Use custom message
      -c, --config <configfile>  Define alternative config file
      -h, --help                 output usage information

    Commands:

      token [token]              Saves your token
      preset <preset>            Uses the preset (can be listed with command list-presets)
      default                    Restores your default status (can be set with setdefault)
      list-presets               Lists the available presets
      save-preset <preset>       Saves the preset defined by -e and -m
      setdefault                 Sets the default status, use -e and -m to set
      set                        Sets the emoji and message provided with the -e and -m options