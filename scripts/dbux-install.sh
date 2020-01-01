set -e

thisDirRelative=$(dirname "$0")
thisDir=$(node -e "console.log(require('path').resolve('$thisDirRelative'))") # get absolute path using node
rootDir="$thisDir/.."

cd "$rootDir/dbux-common" && npm install
cd "$rootDir/dbux-babel-plugin" && npm install
cd "$rootDir/dbux-runtime" && npm install

# for dir in $rootDir/dbux-*
# do 
#   cd "$dir" && pwd
# done