const zlib = require('zlib');
const fs = require('fs');

const readStream = fs.createReadStream('./readme4.txt');
const zlibStream = zlib.createGzip();
const writeSteram = fs.createWriteStream('./readme4.txt.gz');
readStream.pipe(zlibStream).pipe(writeSteram);
