set -e # cancel on error
set -x # verbose echo mode

thisDirRelative=$(dirname "$0")
thisDir=$(node -e "console.log(require('path').resolve('$thisDirRelative'))") # get absolute path using node
rootDir="$thisDir/.."

echo '`npm install`ing all `dbux` projects...'

# cd "$rootDir" && npm install # root has some stuff as well (just to simplify things with eslint for now)
cd "$rootDir/dbux-common" && npm install
cd "$rootDir/dbux-data" && npm install
cd "$rootDir/dbux-babel-plugin" && npm install
cd "$rootDir/dbux-runtime" && npm install
cd "$rootDir/dbux-code" && npm install
cd "$rootDir/samples" && npm install

# for dir in $rootDir/dbux-*
# do 
#   cd "$dir" && pwd
# done