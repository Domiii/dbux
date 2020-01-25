set -e

if [ $# -ne 0 ]; then args=" $*"; else args=""; fi
cmd="yarn install$args"
eval "$cmd"