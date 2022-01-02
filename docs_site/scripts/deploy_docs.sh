set -e

echo 'DOCS BUILDING...'

yarn update-docs
yarn build

branch=$(git symbolic-ref --short HEAD)

# TODO: get user input first
echo Docs Built. You are on branch=$branch.
echo Deploy? [y/N]
read ok

if [ "$ok" != "y" ]; then
  exit -1
fi

echo 'DOCS DEPLOYING...'

git add -A
git commit -am "[deploy docs]"
git push

echo 'Done!'
