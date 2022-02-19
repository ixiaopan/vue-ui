cd packages/wxp-ui
npm version prerelease --preid=alpha --no-git-tag-version

cd -
pnpm build

cd dist/wxp-ui
npm publish

cd -
cd docs
npm run update:version


cd - 
git add .
git commit -m "chore: upgrade version"

echo "Published!"
echo "Now you can push your branch."
