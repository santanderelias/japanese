const fs = require('fs');
const path = require('path');

const assetsDir = 'static/assets';
const files = fs.readdirSync(assetsDir);

const assetList = files.map(file => '/' + path.join('assets', file));

console.log(JSON.stringify(assetList, null, 2));
