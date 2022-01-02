set -e

branch=$(git symbolic-ref --short HEAD)

if [ "$branch" != "master" ]; then
  echo "You are on the wrong branch."
  echo "  Expected=master"
  echo "  Actual  =$branch"
  exit -1
fi

# echo "You are on the right branch: $branch"
echo "DOCS BUILDING..."

yarn update-docs
yarn build


# TODO: get user input first
echo "Docs Built. You are on branch=$branch."
echo "Deploy? [y/N]"
read ok

if [ "$ok" != "y" ]; then
  exit -1
fi

echo 'DOCS DEPLOYING...'

git add -A
git commit -am "[deploy docs]"
git push

echo 'Done!'
