set -e    # exit on error

# thisDirRelative=$(dirname "$0")

jsEval () {
  echo "$(node -e "console.log($1)")"
}

# get absolute path using node
# NOTE: In bash, use `echo` to return arbitrary values
getAbsolutePath () {
  echo "$( jsEval "require('path').resolve('"$1"')" )"
}

getFirstInPath () {
  echo "$( jsEval "\"$1\".split('/')[0]" )"
}

# $1 = ${BASH_SOURCE[0]}
getScriptDir () {
  echo "$(getAbsolutePath "$( cd "$( dirname "$1" )" >/dev/null 2>&1 && pwd )")"
}

# see: https://stackoverflow.com/a/246128
commonDir="$(getScriptDir "${BASH_SOURCE[0]}")"

MonoRoot="$(getAbsolutePath "$commonDir/../..")"
ProjectsRoot="$MonoRoot/projects"

# MonoRoot="$thisDir/../../.."


if [[ ! -e $ProjectsRoot ]]; then
  mkdir $ProjectsRoot
fi

