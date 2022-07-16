set -e
# set -x

branch=$(git symbolic-ref --short HEAD)

if [ "$branch" != "master" ]; then
  echo "You are on the wrong branch: expected=master, actual=$branch"
  exit -1
fi

# echo "You are on the right branch: $branch"
echo "Building Docs..."

# yarn update-docs # "yarn build" already runs update-docs
yarn build:prod


# TODO: get user input first
echo "Docs Built. You are on branch=$branch."
echo "Deploy? [Y/n]"
read ok

# see https://stackoverflow.com/questions/13617843/unary-operator-expected-error-in-bash-if-condition
if [[ $ok != "" ]] && [[ $ok != "y" ]]; then
  echo "Cancelled: deploy_docs.sh"
  exit 0
fi

echo 'DOCS DEPLOYING...'

git add -A
git commit -am "[deploy docs]"
git push

echo 'Docs deployed successfully.'
