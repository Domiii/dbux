set -e # cancel on error
# set -x # verbose echo mode

thisDirRelative=$(dirname "$0")
rootDir=$(node -e "console.log(require('path').resolve('$thisDirRelative/..'))") # get absolute path using node

cd "$rootDir/dbux_projects/express"

max=27
for i in `seq 1 $max`
do
  delta=$(git diff --stat Bug-$i-fix Bug-$i-fix^1 | head -n 1)
  echo "$i $delta"
done