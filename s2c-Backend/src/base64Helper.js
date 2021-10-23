const Jimp = require('jimp');
const util = require('util');
const fs = require('fs');
const path = require('path');

async function getBase64Img(absPath) {
    try {
        let img = await Jimp.read(absPath);
        let ext = absPath.split('.').pop().toLowerCase();
        if (ext === 'jpg') {
            ext = 'jpeg';
        }
        return await img.getBase64Async(Jimp.AUTO);
    } catch (error) {
        console.log(error);
        return '';
    }
}

async function getCombinedBase64Img(pathA, pathB) {
    try {
        let imgA = await Jimp.read(pathA);
        let imgB = await Jimp.read(pathB);
        imgA.composite(imgB, 0, 0, {
            mode: Jimp.BLEND_DARKEN
        });
        let result = await imgA.getBase64Async(Jimp.AUTO);
        return result;
    } catch (e) {
        console.log(e);
        return '';
    }
}

// store image
async function saveBase64Image(dataString, absPath) {
    try {
        let matches = dataString.match(/^data:image\/([A-Za-z]+);base64,(.+)$/);
        if (matches.length !== 3) {
            return;
        }
        absPath += '.' + matches[1];
        await util.promisify(fs.writeFile)(absPath, Buffer.from(matches[2], 'base64'), );
        return absPath;
    } catch (e) {
        console.log(e);
        return '';
    }
}



module.exports = {
    getBase64Img,
    getCombinedBase64Img,
    saveBase64Image
}