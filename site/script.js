var spriteRanges = {
    0: {
        tl: {x: 0, y: 0},
        br: {x: 0, y: 0}
    },
    1: {
        tl: {x: 1, y: 0},
        br: {x: 1, y: 0}
    },
    2: {
        tl: {x: 2, y: 1},
        br: {x: 2, y: 1}
    },
    3: {
        tl: {x: 4, y: 2},
        br: {x: 4, y: 2}
    },
    4: {
        tl: {x: 9, y: 5},
        br: {x: 9, y: 5}
    },
    5: {
        tl: {x: 18, y: 10},
        br: {x: 18, y: 10}
    },
    6: {
        tl: {x: 36, y: 20},
        br: {x: 36, y: 20}
    },
    7: {
        tl: {x: 73, y: 41},
        br: {x: 73, y: 41}
    },
    8: {
        tl: {x: 147, y: 82},
        br: {x: 147, y: 82}
    },
    9: {
        tl: {x: 294, y: 164},
        br: {x: 295, y: 164}
    },
    10: {
        tl: {x: 589, y: 328},
        br: {x: 591, y: 329}
    },
    11: {
        tl: {x: 1179, y: 657},
        br: {x: 1182, y: 659}
    },
    12: {
        tl: {x: 2358, y: 1315},
        br: {x: 2364, y: 1319}
    },
    13: {
        tl: {x: 4717, y: 2630},
        br: {x: 4728, y: 2639}
    },
    14: {
        tl: {x: 9439, y: 5262},
        br: {x: 9452, y: 5277}
    },
    15: {
        tl: {x: 18878, y: 10525},
        br: {x: 18905, y: 10554}
    },
    16: {
        tl: {x: 37757, y: 21051},
        br: {x: 37810, y: 21108}
    }
};

var max_zoom = 13;

var webStorage = new WebStorage();

function imageToBase64(image) {
    var canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;

    var ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0);

    return canvas.toDataURL("image/png");
}

function loadImageToWebStorage(z, x, y){
    var url =  "cache/" + z + "/" + x + "_" + y + ".png";
    var img = new Image();
    img.onload = function() {
        webStorage.setItem([z,x,y].join('_'), imageToBase64(img));
    };
    img.src = url;
}

function clearWebStorage() {
    webStorage.clear();
}

function prepareWebStorage() {
    for (var z in spriteRanges) {
        if (z > max_zoom) {
            break;
        }
        var sprites = spriteRanges[z];
        for (var x=sprites.tl.x; x<=sprites.br.x; x++) {
            for (var y=sprites.tl.y; y<=sprites.br.y; y++) {
                loadImageToWebStorage(z, x, y);
            }
        }
    }
}

function checkTileInSprites(coord, zoom) {
    var sprites = spriteRanges[zoom];
    return sprites.tl.x <= coord.x && coord.x <= sprites.br.x && sprites.tl.y <= coord.y && coord.y <= sprites.br.y;
}

function getOsmTileImgSrc(coord, zoom) {
    return "http://tile.openstreetmap.org/" + zoom + "/" + coord.x + "/" + coord.y + ".png";
}

function getGmapTileImgSrc(coord, zoom) {
    return "http://mt0.googleapis.com/vt?src=apiv3&x=" + coord.x + "&y=" + coord.y + "&z=" + zoom;
}

function getLocalTileImgSrc(coord, zoom) {
    return "cache/" + zoom + "/" + coord.x + "_" + coord.y + ".png";
}

function getWebStorageTileImgSrc(coord, zoom) {
    return webStorage.getItem([zoom, coord.x, coord.y].join('_'));
}