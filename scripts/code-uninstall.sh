# set -x

ext=(`code --list-extensions | grep dbux`)

# https://serverfault.com/questions/477503/check-if-array-is-empty-in-bash
if (( ${#ext[@]} )); then
  code --uninstall-extension ${ext[0]}
fi