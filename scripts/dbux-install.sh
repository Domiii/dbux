set -e

baseDirRelative=$(dirname "$0")
baseDir=$(node -e "console.log(require('path').resolve('$baseDirRelative'))") # get absolute path using node
rootDir="$baseDir/.."

for dir in $rootDir/dbux-*
do 
  cd "$dir" && pwd
done