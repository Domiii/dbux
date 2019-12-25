set -e

thisDir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$thisDir"
cd ../dbux-common && npm install
cd ../dbux-runtime && npm install
cd ../dbux-babel-plugin && npm install