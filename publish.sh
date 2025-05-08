#!/bin/bash
 
# 获取当前日期并格式化为版本号格式（年.月.日）
# v=$(date +"%Y.%-m%d.%H%M")
v=$(date +"%Y.%-m.%-d%H%M")

echo "当前版本号: $v"
sed -i '' -e 's/"version": "[0-9]\+\.[0-9]\+\.[0-9]\+"/"version": "'$v'"/' package.json

# npm publish --access public