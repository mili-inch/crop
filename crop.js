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
    //最小値でグレースケール化
    const getGrayImageDataMin = function (ctx, imageData, width, height) {
        let x, y, i;
        let imageData_dst = ctx.createImageData(width, height);
        for (y = 0; y < height; y++) {
            for (x = 0; x < width; x++) {
                i = (x + y * width) * 4;
                let max = Math.min(imageData.data[i], imageData.data[i + 1], imageData.data[i + 2]);
                imageData_dst.data[i] = max;
                imageData_dst.data[i + 1] = max;
                imageData_dst.data[i + 2] = max;
                imageData_dst.data[i + 3] = 255;
            }
        }
        return imageData_dst;
    };
    //RGBフィルタ
    const getColorFilteredImageData = function (ctx, imageData, rgb, width, height) {
        let x, y, i;
        let imageData_dst = ctx.createImageData(width, height);
        for (y = 0; y < height; y++) {
            for (x = 0; x < width; x++) {
                i = (x + y * width) * 4;
                imageData_dst.data[i] = 0 == rgb ? imageData.data[i] : 0;
                imageData_dst.data[i + 1] = 1 == rgb ? imageData.data[i + 1] : 0;
                imageData_dst.data[i + 2] = 2 == rgb ? imageData.data[i + 2] : 0;
                imageData_dst.data[i + 3] = imageData.data[i + 3];
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

    const getCroppedImageData = function (ctx, card_a, card_b, back_a, back_b, width, height) {
        const difference_card = compoundImageData(ctx, difference, card_a, card_b, width, height);
        const difference_back = compoundImageData(ctx, difference, back_a, back_b, width, height);
        const division_btoc = compoundImageData(ctx, division, difference_back, difference_card, width, height);
        const alphaMask = getInversedImageData(ctx, getGrayImageData(ctx, division_btoc, width, height), width, height);
        const colorDifferenceMask = getColorSelectiveMask(ctx, difference_card, width, height);
        const expandedDiffMask = getExpandedMask(ctx, colorDifferenceMask, width, height, 2);
        const expandedDiffMaskInv = getInversedImageData(ctx, expandedDiffMask, width, height);
        const alphaexpandedDiffMask = getMaskedImageData(ctx, getPlaneImageData(ctx, width, height, 0, 0, 0, 255), expandedDiffMaskInv, width, height);
        const alphaDiffMask = getMaskedImageData(ctx, getPlaneImageData(ctx, width, height, 255, 255, 255, 255), colorDifferenceMask, width, height);
        const coveredAlphaMask = compoundImageDataNormal(ctx, alphaexpandedDiffMask, alphaMask, width, height);
        const resultMask = compoundImageDataNormal(ctx, alphaDiffMask, coveredAlphaMask, width, height);
        const result = getMaskedImageData(ctx, card_a, resultMask, width, height);
        return result;
    };
    const getMaskImageData = function (ctx, card_a, card_b, back_a, back_b, width, height) {
        const difference_card = compoundImageData(ctx, difference, card_a, card_b, width, height);
        const difference_back = compoundImageData(ctx, difference, back_a, back_b, width, height);
        const division_btoc = compoundImageData(ctx, division, difference_back, difference_card, width, height);
        const alphaMask = getInversedImageData(ctx, division_btoc, width, height);
        const colorDifferenceMask = getColorSelectiveMask(ctx, difference_card, width, height);
        const expandedDiffMask = getExpandedMask(ctx, colorDifferenceMask, width, height, 2);
        const expandedDiffMaskInv = getInversedImageData(ctx, expandedDiffMask, width, height);
        const alphaexpandedDiffMask = getMaskedImageData(ctx, getPlaneImageData(ctx, width, height, 0, 0, 0, 255), expandedDiffMaskInv, width, height);
        const alphaDiffMask = getMaskedImageData(ctx, getPlaneImageData(ctx, width, height, 255, 255, 255, 255), colorDifferenceMask, width, height);
        const coveredAlphaMask = compoundImageDataNormal(ctx, alphaexpandedDiffMask, alphaMask, width, height);
        const resultMask = compoundImageDataNormal(ctx, alphaDiffMask, coveredAlphaMask, width, height);
        const resultMaskInverse = getInversedImageData(ctx, resultMask, width, height);
        return alphaMask;
    };
    const getCardSizeMaskedImageData = function (ctx, imageData, w, h, r) {
        let color = "#FFFFFF";
        const mask = getLeagueCardMask(ctx, w, h, 0, 0, w, h, r, color);
        const masked = getMaskedImageData(ctx, imageData, mask, w, h);
        return masked;
    }

    const button_upload = document.getElementById("button_upload");
    const frame_previews = document.getElementById("previews");
    const buttons_mode = document.getElementsByName("mode");
    const frame_results = document.getElementById("results");

    let dragSrc;
    let dragDst;

    const onFileSelected = function (files) {
        for (let fileData of files) {
            if (!fileData.type.match('image.*')) {
                alert('画像を選択してください');
                return;
            }
            const reader = new FileReader();
            reader.onload = function () {
                const img = document.createElement('img');
                img.src = reader.result;
                frame_previews.appendChild(img);
                img.addEventListener("click", function () {
                    this.remove();
                });
                img.addEventListener("dragenter", function () {
                    if (dragSrc) {
                        this.style = "border-left:solid 5px blue;";
                        dragDst = this;
                    }
                });
                img.addEventListener("dragleave", function () {
                    this.style = "";
                    if (dragDst == this) {
                        dragDst = null;
                    }
                });
                img.addEventListener("dragstart", function () {
                    dragSrc = this;
                });
                img.addEventListener("dragend", function () {
                    if (dragSrc && dragDst) {
                        dragSrc.parentNode.insertBefore(dragSrc, dragDst);
                        dragDst.style = "";
                    }
                    dragSrc = null;
                    dragDst = null;
                });
            }
            reader.readAsDataURL(fileData);
        }
    }

    button_upload.addEventListener('change', function (e) {
        e.preventDefault();
        onFileSelected(e.target.files);
    }, false);
    document.addEventListener("dragover", function (e) {
        e.preventDefault();
    });
    document.addEventListener("drop", function (e) {
        e.preventDefault();
        onFileSelected(e.dataTransfer.files);
    });

    const onSubmit = function (e) {
        let selected = "";
        const images = Array.prototype.slice.call(frame_previews.children);
        for (let checked of buttons_mode) {
            if (checked.checked) {
                selected = checked.value;
                break;
            }
        }

        if (selected == "trim") {
            if (images.length == 0) {
                alert("画像がありません");
                return;
            }
            frame_results.textContent = null;
            for (let image of images) {
                const width = image.naturalWidth;
                const height = image.naturalHeight;
                let x = 40; let y = 36; let w = 800; let h = 960; let r = 19;
                if (width == 1280) {
                    x = 27; y = 24; w = 533; h = 640; r = 13;
                }
                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                const trimedImageData = getTrimedImageData(ctx, createImageData(ctx, image, width, height), width, height, x, y, w, h)
                const cardImageData = getCardSizeMaskedImageData(ctx, trimedImageData, w, h, r);
                canvas.width = w;
                canvas.height = h;
                ctx.putImageData(cardImageData, 0, 0);
                frame_results.appendChild(canvas);
                addDownloadLink(frame_results, canvas);
            }
        }
        //const trimed = getTrimedImageData(ctx, imageData, width, height, x, y, w, h);
        if (selected == "crop") {
            if (images.length < 4 || images.length % 2 != 0) {
                alert("画像の数が不正です 背景を二枚とカードを偶数枚指定してください");
                return;
            }
            if (!images.some(x => x.naturalWidth == images[0].naturalWidth)) {
                alert("サイズの異なる画像が含まれています");
                return;
            }
            frame_results.textContent = null;
            const width = images[0].naturalWidth;
            const height = images[0].naturalHeight;
            for (let i = 2; i + 1 < images.length; i += 2) {
                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                const back_a = createImageData(ctx, images[0], width, height);
                const back_b = createImageData(ctx, images[1], width, height);
                const card_a = createImageData(ctx, images[i], width, height);
                const card_b = createImageData(ctx, images[i + 1], width, height);
                const croppedImageData = getCroppedImageData(ctx, card_a, card_b, back_a, back_b, width, height);
                ctx.putImageData(croppedImageData, 0, 0);
                frame_results.appendChild(canvas);
                addDownloadLink(frame_results, canvas);
            }
        }
        if (selected == "mask") {
            if (images.length < 4 || images.length % 2 != 0) {
                alert("画像の数が不正です 背景を二枚とカードを偶数枚指定してください");
                return;
            }
            if (!images.some(x => x.naturalWidth == images[0].naturalWidth)) {
                alert("サイズの異なる画像が含まれています");
                return;
            }
            frame_results.textContent = null;
            const width = images[0].naturalWidth;
            const height = images[0].naturalHeight;
            for (let i = 2; i + 1 < images.length; i += 2) {
                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                const back_a = createImageData(ctx, images[0], width, height);
                const back_b = createImageData(ctx, images[1], width, height);
                const card_a = createImageData(ctx, images[i], width, height);
                const card_b = createImageData(ctx, images[i + 1], width, height);
                const mask = getMaskImageData(ctx, card_a, card_b, back_a, back_b, width, height)
                ctx.putImageData(mask, 0, 0);
                frame_results.appendChild(canvas);
                addDownloadLink(frame_results, canvas);
            }
            /*ctx_r.putImageData(getColorFilteredImageData(ctx_r, mask, 0, width, height), 0, 0);
            ctx_g.putImageData(getColorFilteredImageData(ctx_g, mask, 1, width, height), 0, 0);
            ctx_b.putImageData(getColorFilteredImageData(ctx_b, mask, 2, width, height), 0, 0);*/
        }
    };
    document.getElementById("bash").addEventListener("click", onSubmit, false);

    const addDownloadLink = (parent, canvas) => {
        const link_download = document.createElement("a");
        const button_download = document.createElement("button");
        button_download.textContent = "ダウンロード";
        const filename = "leaguecard.png";
        button_download.addEventListener("click", function () {
            if (canvas.msToBlob) {
                let blob = canvas.msToBlob();
                window.navigator.msSaveBlob(blob, filename);
            } else {
                link_download.href = canvas.toDataURL('image/png');
                link_download.download = filename;
                link_download.click();
            }
        });
        parent.appendChild(link_download);
        parent.appendChild(button_download);
    }
})();