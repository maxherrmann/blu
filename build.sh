#!/bin/bash

# Clean
rm -rf ./build
rm -rf ./dist

# Build
npx tsc
node ./build.js
dts-bundle-generator \
    -o ./dist/index.d.ts \
    --external-inlines "@types/web-bluetooth" \
    --sort --no-banner \
    -- ./build/src/index.d.ts