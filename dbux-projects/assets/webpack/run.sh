
set -e # cancel on error
# set -x # verbose echo mode

cd examples/commonjs
node --stack-trace-limit=100    --require "c:\\Users\\domin\\code\\dbux\\dbux_projects\\webpack\\_dbux_\\alias.runtime.js" "c:\\Users\\domin\\code\\dbux\\dbux_projects\\webpack\\dist\\webpack-cli\\packages\\webpack-cli\\bin\\cli.js" --mode none --env none --stats-reasons --stats-used-exports --stats-provided-exports --no-stats-colors --stats-chunks  --stats-modules-space 99999 --stats-chunk-origins --output-public-path "dist/"  --entry ./example.js --output-filename output.js