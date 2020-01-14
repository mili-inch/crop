function getWeight(t1, t2) {
    const d = Math.abs(t1 - t2);
    if (d < 1) {
        return 7 / 6 * Math.pow(d, 3) - 2 * Math.pow(d, 2) + 8 / 9;
    } else if (d < 2) {
        return -7 / 18 * Math.pow(d, 3) + 2 * Math.pow(d, 2) - 10 / 3 * d + 16 / 9;
    } else {
        return 0;
    }
}

const bicubic = function (ctx, imageData, width, height, rate) {
    const dw = ~~(width * rate);
    const dh = ~~(height * rate);
    const imageData_dst = ctx.createImageData(dw, dh);

    const range = [-1, 0, 1, 2];

    let pos = 0;
    for (let dy = 0; dy < dh; dy++) {
        const sy = dy / rate;
        const rangeY = range.map(i => i + ~~sy);
        for (let dx = 0; dx < dw; dx++) {
            const sx = dx / rate;
            const rangeX = range.map(i => i + ~~sx);

            let r, g, b, a;
            [r, g, b, a] = [0, 0, 0, 0];
            for (const y of rangeY) {
                const weightY = getWeight(y, sy);
                for (const x of rangeX) {
                    const weight = weightY * getWeight(x, sx);
                    if (weight === 0) {
                        continue;
                    }
                    const color = rgba(imageData.data, width, height, x, y);
                    r += color.r * weight;
                    g += color.g * weight;
                    b += color.b * weight;
                    a += color.a * weight;
                }
            }
            imageData_dst.data[pos++] = ~~r;
            imageData_dst.data[pos++] = ~~g;
            imageData_dst.data[pos++] = ~~b;
            imageData_dst.data[pos++] = ~~a;
        }
    }
    return imageData_dst;
}

function rgba(pixels, w, h, x, y) {
    x = x < 0 ? 0 : x < w ? x : w - 1;
    y = y < 0 ? 0 : y < h ? y : h - 1;
    const p = ((w * y) + x) * 4;
    return { r: pixels[p], g: pixels[p + 1], b: pixels[p + 2], a: pixels[p + 3] };
}