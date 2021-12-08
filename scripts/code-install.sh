set -ex

files=(*.vsix)
code --install-extension "./${files[0]}"

echo 'DBUX installed. Use the \"Developer: Reload Window\" command to see it.'