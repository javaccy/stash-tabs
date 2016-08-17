#!/bin/bash
rm -f dist.zip
zip -r dist.zip * -x "*.DS_Store" ".git/*" "dist.zip" ".gitignore" "jsconfig.json" "LICENSE.txt" "README.md" "zip.sh" "img/screenshot.png" "img/promo-images/*"
