import Jimp from 'jimp/es';

/**
 * @param {Jimp} img 
 */
export const autocropTransparent = (img) => {
    let minBlackX = img.bitmap.width - 1;
    let maxBlackX = 0;
    let minBlackY = img.bitmap.height - 1;
    let maxBlackY = 0;

    for (let i = 3; i < img.bitmap.data.length; i += 4) {
        const alpha = img.bitmap.data[i];

        const y = Math.floor(((i - 3) / 4) / img.bitmap.width);
        const x = ((i - 3) / 4) % img.bitmap.width

        if (alpha > 127) {
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
    }

    let w = maxBlackX - minBlackX + 10
    let h = maxBlackY - minBlackY + 10;
    let x = Math.max(minBlackX - 5, 0);
    let y = Math.max(minBlackY - 5, 0);

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