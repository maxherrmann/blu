#!/bin/bash

# Build
webpack --mode production --name package --progress

# Generate .d.ts rollup
api-extractor run --local

# Generate API reference
api-documenter markdown -i ./wiki -o ./wiki

# Fix links for GitHub wiki deployment
# Remove ".md" from all wiki files
# Replace "./index" with "./" in all wiki files
find ./wiki -type f -exec sed -i -e 's/\.md//g' -e 's/\.\/index/\.\/\ /g' {} \;

# Copy default files to wiki directory
cp -r .github/wiki/* wiki/