(() => {
    //画像をImageData化
    const createImageData = function (ctx, img, width, height) {
        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, width, height);
        return data;
    }
    //上がa,下がb
    //上限下限
    const clamp = function (val, min, max) {
        return val > max ? max : (val < min ? min : val);
    };
    //加算
    const addition = function (pixel_a, pixel_b) {
        return clamp(pixel_a + pixel_b, 0, 255);
    }
    //差の絶対値
    const difference = function (pixel_a, pixel_b) {
        return clamp(Math.abs(pixel_a - pixel_b), 0, 255);
    }
    //除算
    const division = function (pixel_a, pixel_b) {
        return clamp(Math.round(256 * pixel_b / (pixel_a + 1)), 0, 255);
    }
    //ハードライト
    const hardlight = function (pixel_a, pixel_b) {
        return pixel_a > 128 ?
            clamp(Math.round(255 - (255 - 2 * (pixel_a - 128)) * (255 - pixel_b) / 256), 0, 255) :
            clamp(Math.round(2 * pixel_a * pixel_b / 256), 0, 255);
    }
    //合成（α最大）
    const compoundImageData = function (ctx, mode, imageData_a, imageData_b, width, height) {
        let x, y, i;
        let imageData_dst = ctx.createImageData(width, height);
        for (y = 0; y < height; y++) {
            for (x = 0; x < width; x++) {
                i = (x + y * width) * 4;
                imageData_dst.data[i] =
                    mode(imageData_a.data[i], imageData_b.data[i]);
                imageData_dst.data[i + 1] =
                    mode(imageData_a.data[i + 1], imageData_b.data[i + 1]);
                imageData_dst.data[i + 2] =
                    mode(imageData_a.data[i + 2], imageData_b.data[i + 2]);
                imageData_dst.data[i + 3] = 255;
            }
        }
        return imageData_dst;
    };
    //単色出力
    const getPlaneImageData = function (ctx, width, height, r, g, b, a) {
        let x, y, i;
        let imageData_dst = ctx.createImageData(width, height);
        for (y = 0; y < height; y++) {
            for (x = 0; x < width; x++) {
                i = (x + y * width) * 4;
                imageData_dst.data[i] = r;
                imageData_dst.data[i + 1] = g;
                imageData_dst.data[i + 2] = b;
                imageData_dst.data[i + 3] = a;
            }
        }
        return imageData_dst;
    };
    //明度でグレースケール化
    const getGrayImageData = function (ctx, imageData, width, height) {
        let x, y, i;
        let imageData_dst = ctx.createImageData(width, height);
        for (y = 0; y < height; y++) {
            for (x = 0; x < width; x++) {
                i = (x + y * width) * 4;
                let max = Math.max(imageData.data[i], imageData.data[i + 1], imageData.data[i + 2]);
                imageData_dst.data[i] = max;
                imageData_dst.data[i + 1] = max;
                imageData_dst.data[i + 2] = max;
                imageData_dst.data[i + 3] = 255;
            }
        }
        return imageData_dst;
    };
    //色域選択マスク作成
    const getColorSelectiveMask = function (ctx, imageData, width, height, color = [0, 0, 0], range = 5) {
        let x, y, i;
        let imageData_dst = ctx.createImageData(width, height);
        for (y = 0; y < height; y++) {
            for (x = 0; x < width; x++) {
                i = (x + y * width) * 4;
                let col = Math.hypot(
                    imageData.data[i] - color[0],
                    imageData.data[i + 1] - color[1],
                    imageData.data[i + 2] - color[2]
                ) < range ? 255 : 0;
                imageData_dst.data[i] = col;
                imageData_dst.data[i + 1] = col;
                imageData_dst.data[i + 2] = col;
                imageData_dst.data[i + 3] = 255;
            }
        }
        return imageData_dst;
    }
    //選択部分の膨張
    const getExpandedMask = function (ctx, imageData, width, height, degree) {
        let x, y, i;
        let imageData_dst = getPlaneImageData(ctx, width, height, 0, 0, 0, 255);
        for (y = 0; y < height; y++) {
            for (x = 0; x < width; x++) {
                i = (x + y * width) * 4;
                if (imageData.data[i] == 255) {
                    for (let dx = -degree; dx < degree + 1; dx++) {
                        for (let dy = -degree; dy < degree + 1; dy++) {
                            console.log()
                            let l = (x + dx + (y + dy) * width) * 4;
                            imageData_dst.data[l] = 255;
                            imageData_dst.data[l + 1] = 255;
                            imageData_dst.data[l + 2] = 255;
                        }
                    }
                }
            }
        }
        return imageData_dst;
    };
    //反転（α最大）
    const getInversedImageData = function (ctx, imageData, width, height) {
        let x, y, i;
        let imageData_dst = ctx.createImageData(width, height);
        for (y = 0; y < height; y++) {
            for (x = 0; x < width; x++) {
                i = (x + y * width) * 4;
                imageData_dst.data[i] =
                    clamp(255 - imageData.data[i], 0, 255);
                imageData_dst.data[i + 1] =
                    clamp(255 - imageData.data[i + 1], 0, 255);
                imageData_dst.data[i + 2] =
                    clamp(255 - imageData.data[i + 2], 0, 255);
                imageData_dst.data[i + 3] = 255;
            }
        }
        return imageData_dst;
    };
    //マスク適用
    const getMaskedImageData = function (ctx, imageData, mask, width, height) {
        let x, y, i;
        let imageData_dst = ctx.createImageData(width, height);
        for (y = 0; y < height; y++) {
            for (x = 0; x < width; x++) {
                i = (x + y * width) * 4;
                imageData_dst.data[i] = imageData.data[i];
                imageData_dst.data[i + 1] = imageData.data[i + 1];
                imageData_dst.data[i + 2] = imageData.data[i + 2];
                imageData_dst.data[i + 3] = mask.data[i];
            }
        }
        return imageData_dst;
    };
    //通常合成（下α最大）
    const compoundImageDataNormal = function (ctx, imageData_a, imageData_b, width, height) {
        let x, y, i;
        let imageData_dst = ctx.createImageData(width, height);
        for (y = 0; y < height; y++) {
            for (x = 0; x < width; x++) {
                i = (x + y * width) * 4;
                imageData_dst.data[i] =
                    clamp(imageData_a.data[i] * imageData_a.data[i + 3] / 255 + imageData_b.data[i] * (255 - imageData_a.data[i + 3]) / 255, 0, 255);
                imageData_dst.data[i + 1] =
                    clamp(imageData_a.data[i + 1] * imageData_a.data[i + 3] / 255 + imageData_b.data[i + 1] * (255 - imageData_a.data[i + 3]) / 255, 0, 255);
                imageData_dst.data[i + 2] =
                    clamp(imageData_a.data[i + 2] * imageData_a.data[i + 3] / 255 + imageData_b.data[i + 2] * (255 - imageData_a.data[i + 3]) / 255, 0, 255);
                imageData_dst.data[i + 3] = 255;
            }
        }
        return imageData_dst;
    };
    //角丸マスク生成
    const getLeagueCardMask = function (ctx, width, height, x, y, w, h, r, color) {
        function drawsq(x, y, w, h, r, color) {
            ctx.beginPath();
            ctx.lineWidth = 1;
            ctx.strokeStyle = color;
            ctx.fillStyle = color;
            ctx.moveTo(x, y + r);
            ctx.arc(x + r, y + h - r, r, Math.PI, Math.PI * 0.5, true);
            ctx.arc(x + w - r, y + h - r, r, Math.PI * 0.5, 0, 1);
            ctx.arc(x + w - r, y + r, r, 0, Math.PI * 1.5, 1);
            ctx.arc(x + r, y + r, r, Math.PI * 1.5, Math.PI, 1);
            ctx.closePath();
            ctx.stroke();
            ctx.fill();
        }
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, width, height);
        drawsq(x, y, w, h, r, color);
        return ctx.getImageData(0, 0, width, height);
    }
    //トリミング
    const getTrimedImageData = function (ctx, imageData, width, height, dx, dy, dw, dh) {
        let x, y, i, j;
        let imageData_dst = ctx.createImageData(dw, dh);
        for (y = dy; y < dy + dh + 1; y++) {
            for (x = dx; x < dx + dw + 1; x++) {
                i = (x + y * width) * 4;
                j = (x - dx + (y - dy) * dw) * 4;
                imageData_dst.data[j] = imageData.data[i];
                imageData_dst.data[j + 1] = imageData.data[i + 1];
                imageData_dst.data[j + 2] = imageData.data[i + 2];
                imageData_dst.data[j + 3] = imageData.data[i + 3];
            }
        }
        return imageData_dst;
    }

    const cropCard = function (ctx, card_a, card_b, back_a, back_b, width, height) {
        const difference_card = compoundImageData(ctx, difference, createImageData(ctx, card_a, width, height), createImageData(ctx, card_b, width, height), width, height);
        const difference_back = compoundImageData(ctx, difference, createImageData(ctx, back_a, width, height), createImageData(ctx, back_b, width, height), width, height);
        const division_ctob = compoundImageData(ctx, division, difference_card, difference_back, width, height);
        const division_btoc = compoundImageData(ctx, division, difference_back, difference_card, width, height);
        //const hardlight_dtod = compoundImageData(ctx, hardlight, division_btoc, division_ctob, width, height);
        const alphaMask = getInversedImageData(ctx, getGrayImageData(ctx, division_btoc, width, height), width, height);
        const colorDifferenceMask = getColorSelectiveMask(ctx, difference_card, width, height);
        const expandedDiffMask = getExpandedMask(ctx, colorDifferenceMask, width, height, 2);
        const expandedDiffMaskInv = getInversedImageData(ctx, expandedDiffMask, width, height);
        const alphaexpandedDiffMask = getMaskedImageData(ctx, getPlaneImageData(ctx, width, height, 0, 0, 0, 255), expandedDiffMaskInv, width, height);
        const alphaDiffMask = getMaskedImageData(ctx, getPlaneImageData(ctx, width, height, 255, 255, 255, 255), colorDifferenceMask, width, height);
        const coveredAlphaMask = compoundImageDataNormal(ctx, alphaexpandedDiffMask, alphaMask, width, height);
        const resultMask = compoundImageDataNormal(ctx, alphaDiffMask, coveredAlphaMask, width, height);
        const result = getMaskedImageData(ctx, createImageData(ctx, card_a, width, height), resultMask, width, height);
        ctx.putImageData(result, 0, 0);
    };
    const maskCard = function (ctx, card_a, card_b, back_a, back_b, width, height) {
        const difference_card = compoundImageData(ctx, difference, createImageData(ctx, card_a, width, height), createImageData(ctx, card_b, width, height), width, height);
        const difference_back = compoundImageData(ctx, difference, createImageData(ctx, back_a, width, height), createImageData(ctx, back_b, width, height), width, height);
        const division_ctob = compoundImageData(ctx, division, difference_card, difference_back, width, height);
        const division_btoc = compoundImageData(ctx, division, difference_back, difference_card, width, height);
        //const hardlight_dtod = compoundImageData(ctx, hardlight, division_btoc, division_ctob, width, height);
        const alphaMask = getInversedImageData(ctx, getGrayImageData(ctx, division_btoc, width, height), width, height);
        const colorDifferenceMask = getColorSelectiveMask(ctx, difference_card, width, height);
        const expandedDiffMask = getExpandedMask(ctx, colorDifferenceMask, width, height, 2);
        const expandedDiffMaskInv = getInversedImageData(ctx, expandedDiffMask, width, height);
        const alphaexpandedDiffMask = getMaskedImageData(ctx, getPlaneImageData(ctx, width, height, 0, 0, 0, 255), expandedDiffMaskInv, width, height);
        const alphaDiffMask = getMaskedImageData(ctx, getPlaneImageData(ctx, width, height, 255, 255, 255, 255), colorDifferenceMask, width, height);
        const coveredAlphaMask = compoundImageDataNormal(ctx, alphaexpandedDiffMask, alphaMask, width, height);
        const resultMask = compoundImageDataNormal(ctx, alphaDiffMask, coveredAlphaMask, width, height);
        ctx.putImageData(resultMask, 0, 0);
    };
    const trimCard = function (ctx, card_a, width, height) {
        let x = 40;
        let y = 36;
        let w = 800;
        let h = 960;
        let r = 19;
        let color = "#FFFFFF";
        if (width == 1280) {
            x = 27;
            y = 24;
            w = 533;
            h = 640;
            r = 13;
        }
        const mask = getLeagueCardMask(ctx, width, height, x, y, w, h, r, color);
        const masked = getMaskedImageData(ctx, card_a, mask, width, height);
        const trimed = getTrimedImageData(ctx, masked, width, height, x, y, w, h);
        ctx.canvas.width = w;
        ctx.canvas.height = h;
        ctx.putImageData(trimed, 0, 0);
    }

    let images = {};

    let cardAfile = document.getElementById('card_a');
    let cardAresult = document.getElementById('preview_card_a');
    let cardBfile = document.getElementById('card_b');
    let cardBresult = document.getElementById('preview_card_b');
    let backAfile = document.getElementById('back_a');
    let backAresult = document.getElementById('preview_back_a');
    let backBfile = document.getElementById('back_b');
    let backBresult = document.getElementById('preview_back_b');

    function loadLocalImage(e, result, name) {
        let fileData = e.target.files[0];

        if (!fileData.type.match('image.*')) {
            alert('画像を選択してください');
            return;
        }
        let reader = new FileReader();
        reader.onload = function () {
            let img = document.createElement('img');
            img.src = reader.result;
            images[name] = img;
            result.textContent = null;
            result.appendChild(img);
        }
        reader.readAsDataURL(fileData);
    }

    cardAfile.addEventListener('change', function (e) {
        loadLocalImage(e, cardAresult, "card_a");
    }, false);
    cardBfile.addEventListener('change', function (e) {
        loadLocalImage(e, cardBresult, "card_b");
    }, false);
    backAfile.addEventListener('change', function (e) {
        loadLocalImage(e, backAresult, "back_a");
    }, false);
    backBfile.addEventListener('change', function (e) {
        loadLocalImage(e, backBresult, "back_b");
    }, false);
    const canvas = document.getElementById("card");
    const onSubmit = function (e) {
        let radio = document.getElementsByName("mode");
        let selected = "";
        for (let i = 0; i < radio.length; i++) {
            if (radio[i].checked) {
                selected = radio[i].value;
                break;
            }
        }
        if ((!images.card_a || !images.card_b || !images.back_a || !images.back_b) && selected != "trim") {
            alert("画像が足りません");
            return;
        }
        if (selected != "trim" && (images.card_a.naturalWidth != images.card_b.naturalWidth ||
            images.card_a.naturalWidth != images.back_a.naturalWidth ||
            images.card_a.naturalWidth != images.back_b.naturalWidth)) {
            alert("サイズの異なる画像が含まれています");
            return;
        }
        const width = images.card_a.naturalWidth;
        const height = images.card_a.naturalHeight;
        const ctx = canvas.getContext("2d");
        canvas.width = width;
        canvas.height = height;
        if (selected == "crop") {
            cropCard(ctx, images.card_a, images.card_b, images.back_a, images.back_b, width, height);
        }
        if (selected == "mask") {
            maskCard(ctx, images.card_a, images.card_b, images.back_a, images.back_b, width, height);
        }
        if (selected == "trim") {
            trimCard(ctx, createImageData(ctx, images.card_a, width, height), width, height);
        }
    };
    document.getElementById("bash").addEventListener("click", onSubmit, false);
    let downloadLink = document.getElementById('download_link');
    let button = document.getElementById('download');
    let filename = "leaguecard.png"
    button.addEventListener('click', function () {
        if (canvas.msToBlob) {
            let blob = canvas.msToBlob();
            window.navigator.msSaveBlob(blob, filename);
        } else {
            downloadLink.href = canvas.toDataURL('image/png');
            downloadLink.download = filename;
            downloadLink.click();
        }
    });
})();