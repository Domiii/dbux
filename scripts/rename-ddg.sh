# Rename utiltiy file, we used to rename all "ddg" files to "pdg" files.
# see: https://stackoverflow.com/questions/1086502/rename-multiple-files-based-on-pattern-in-unix/72825427#72825427

find "C:/Users/domin/code/dbux/dbux-data/src/ddg" -type f -not \( -path "**/node_modules/**" -prune \) -name "*.js" | 
  sed -nE "s/(.*)\/DDG(.*\.js)/& \1\/PDG\2/p" |
  xargs -n 2 mv