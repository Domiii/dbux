set -e # cancel on error
# set -x # verbose echo mode

thisDirRelative=$(dirname "$0")
rootDir=$(node -e "console.log(require('path').resolve('$thisDirRelative/..'))") # get absolute path using node

dbuxDirs=(
  "dbux-common"
  "dbux-data"
  "dbux-babel-plugin"
  "dbux-runtime"
  "dbux-code"
  "dbux-cli"
  "samples"
)


if [ $# -ne 0 ]; then args=" $*"; else args=""; fi
cmd="$args"

# NOTE: NPM gobbles up flags; need to add the double-dash operator.
# NOTE2: funny thing is that the command still works (at least on MAC), since the flags are still accessible to `npm install`, but they would be invisible to us.
# see: https://unix.stackexchange.com/questions/11376/what-does-double-dash-mean
echo "NOTE: If you want to pass flags to this program, prefix all arguments with the double-dash operator (--) - e.g.: npm run dbux-install -- -f mylib"
echo ""

echo "Applying command to all dbux folders: '$cmd'..."

for dirName in "${dbuxDirs[@]}"; do 
  folder="$rootDir/${dirName}"
  cd "$folder"
  echo "$folder..."
  eval "$cmd"
done