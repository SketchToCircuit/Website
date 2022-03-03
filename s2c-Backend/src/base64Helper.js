const Jimp = require('jimp');
const util = require('util');
const fs = require('fs');
const path = require('path');

async function getBase64Img(absPath) {//Load image from disk and convert it to base64
    try {
        let img = await Jimp.read(absPath);
        let ext = absPath.split('.').pop().toLowerCase();
        if (ext === 'jpg') {
            ext = 'jpeg';
        }
        return await img.colorType(0).getBase64Async(Jimp.MIME_PNG);
    } catch (error) {
        console.log(error);
        return '';
    }
}

async function getCombinedBase64Img(pathA, pathB) {//Load 2 images from disk and combines them and returns the new image as base64
    try {
        let [imgA, imgB] = await Promise.all([await Jimp.read(pathA), await Jimp.read(pathB)])
        imgA.composite(imgB, 0, 0, {
            mode: Jimp.BLEND_DARKEN
        });
        return await imgA.colorType(0).getBase64Async(Jimp.MIME_PNG);
    } catch (e) {
        console.log(e);
        return '';
    }
}

async function saveBase64Image(dataString, absPath) {//Save base64 image on disk
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