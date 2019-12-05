#!/bin/bash

npx babel-node --debug --presets env --no-lazy "$@"

# see: https://stackoverflow.com/questions/4824590/propagate-all-arguments-in-a-bash-shell-script

# "--config-file", "babel-debug.config.js",