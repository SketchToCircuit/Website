import Jimp from 'jimp/es';

/**
 * @param {Jimp} img 
 */
export const autocrop = (img) => {
    const borderColor = Jimp.intToRGBA(img.getPixelColor(0, 0));
    const tolerance = 0.01;

    let minBlackX = img.bitmap.width - 1;
    let maxBlackX = 0;
    let minBlackY = img.bitmap.height - 1;
    let maxBlackY = 0;

    img.scan(0, 0, img.bitmap.width, img.bitmap.height, function(x, y, idx) {
        if (Jimp.colorDiff(borderColor, Jimp.intToRGBA(this.bitmap.data.readUInt32BE(idx))) > tolerance) {
            if (x > maxBlackX) {
                maxBlackX = x;
            }

            if (x < minBlackX) {
                minBlackX = x;
            }

            if (y > maxBlackY) {
                maxBlackY = y;
            }

            if (y < minBlackY) {
                minBlackY = y;
            }
        }
    });

    let w = maxBlackX - minBlackX + 2;
    let h = maxBlackY - minBlackY + 2;
    let x = Math.max(minBlackX - 2, 0);
    let y = Math.max(minBlackY - 2, 0);

    if (x + w >= img.bitmap.width) {
        w = img.bitmap.width - 1 - x;
    }

    if (y + h >= img.bitmap.height) {
        h = img.bitmap.height - 1 - y;
    }

    if (w <= 0 || h <= 0) {
        return null;
    }

    img.crop(x, y, w, h);
    return {x: x, y: y, w: w, h: h};
};