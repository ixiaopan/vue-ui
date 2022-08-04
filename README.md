# Vue UI


## Install
```
npm install pnpm -g 
pnpm i
```

## Playground
```
npm run dev
```

## Develop a new comp

We follow kebab-case naming style, so a valid name includes

- modal
- Alert
- input-number
- InputNumber

They will be transformed to kebab-case style automatically.


```
pnpm run create
```

## Build
```
pnpm run build

```

## Publish

```
pnpm run pub
```





## Debug
```
pnpm run debug
```

## Doc

```
# if @wxp/wxp-ui has not published yet, you should use npm link
pnpm run build
cd dist/wxp-ui
npm link

cd docs
npm link @wxp/wxp-ui


# preview
pnpm run docs


# build
pnpm run docs:build
```
