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

function imageToBase64(image) {
    var canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;

    var ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0);

    return canvas.toDataURL("image/png");
}

function loadImageToLocalStorage(z, x, y){
    var url =  "cache/" + z + "/" + x + "_" + y + ".png";
    var img = new Image();
    img.onload = function() {
        localStorage.setItem([z,x,y].join('_'), imageToBase64(img));
    };
    img.src = url;
}

function clearLocalStorage() {
    console.info('Start clearing localstorage');
    localStorage.clear();
}

function prepareLocalStorage() {
    console.info('Start preparing localstorage');
    for (var z in spriteRanges) {
        if (z > max_zoom) {
            break;
        }
        var sprites = spriteRanges[z];
        for (var x=sprites.tl.x; x<=sprites.br.x; x++) {
            for (var y=sprites.tl.y; y<=sprites.br.y; y++) {
                loadImageToLocalStorage(z, x, y);
            }
        }
    }
}

function tileInSprites(zoom, x, y) {
    var sprites = spriteRanges[zoom];
    return sprites.tl.x <= x && x <= sprites.br.x && sprites.tl.y <= y && y <= sprites.br.y;
}

var element = document.getElementById("map");

var mapTypeIds = [];
for(var type in google.maps.MapTypeId) {
    mapTypeIds.push(google.maps.MapTypeId[type]);
}

mapTypeIds.push("OSM");
mapTypeIds.push("MyGmap");
mapTypeIds.push("LocalGmap");
mapTypeIds.push("LocalstorageGmap");
mapTypeIds.push("LocalMyGmap");
mapTypeIds.push("LocalstorageMyGmap");
mapTypeIds.push("LocalstorageLocalMyGmap");

var map = new google.maps.Map(element, {
    center: new google.maps.LatLng(53.902254, 27.561850),
    zoom: 3,
    mapTypeId: "MyGmap",
    mapTypeControlOptions: {
        mapTypeIds: mapTypeIds,
        style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
    }
});

map.mapTypes.set("OSM", new google.maps.ImageMapType({
    getTileUrl: function(coord, zoom) {
        return "http://tile.openstreetmap.org/" + zoom + "/" + coord.x + "/" + coord.y + ".png";
    },
    tileSize: new google.maps.Size(256, 256),
    name: "OSM",
    maxZoom: 15
}));

map.mapTypes.set("MyGmap", new google.maps.ImageMapType({
    getTileUrl: function(coord, zoom) {
        return ["http://mt0.googleapis.com/vt?src=apiv3",
            "x=" + coord.x,
            "y=" + coord.y,
            "z=" + zoom
        ].join('&');
    },
    tileSize: new google.maps.Size(256, 256),
    name: "MyGmap",
    maxZoom: 15
}));

map.mapTypes.set("LocalGmap", new google.maps.ImageMapType({
    getTileUrl: function(coord, zoom) {
        return "cache/" + zoom + "/" + coord.x + "_" + coord.y + ".png"
    },
    tileSize: new google.maps.Size(256, 256),
    name: "LocalGmap",
    maxZoom: 15
}));

map.mapTypes.set("LocalstorageGmap", new google.maps.ImageMapType({
    getTileUrl: function(coord, zoom) {
        return localStorage.getItem([zoom, coord.x, coord.y].join('_'));
    },
    tileSize: new google.maps.Size(256, 256),
    name: "LocalstorageGmap",
    maxZoom: 15
}));

map.mapTypes.set("LocalMyGmap", new google.maps.ImageMapType({
    getTileUrl: function(coord, zoom) {
        return tileInSprites(zoom, coord.x, coord.y) ?
            "cache/" + zoom + "/" + coord.x + "_" + coord.y + ".png" :
            ["http://mt0.googleapis.com/vt?src=apiv3",
                "x=" + coord.x,
                "y=" + coord.y,
                "z=" + zoom
            ].join('&');
    },
    tileSize: new google.maps.Size(256, 256),
    name: "LocalMyGmap",
    maxZoom: 15
}));

map.mapTypes.set("LocalstorageMyGmap", new google.maps.ImageMapType({
    getTileUrl: function(coord, zoom) {
        var image = localStorage.getItem([zoom, coord.x, coord.y].join('_'));
        return image ? image : ["http://mt0.googleapis.com/vt?src=apiv3",
            "x=" + coord.x,
            "y=" + coord.y,
            "z=" + zoom
        ].join('&');
    },
    tileSize: new google.maps.Size(256, 256),
    name: "LocalstorageMyGmap",
    maxZoom: 15
}));

map.mapTypes.set("LocalstorageLocalMyGmap", new google.maps.ImageMapType({
    getTileUrl: function(coord, zoom) {
        var image = localStorage.getItem([zoom, coord.x, coord.y].join('_'));
        return image ? image : tileInSprites(zoom, coord.x, coord.y) ?
            "cache/" + zoom + "/" + coord.x + "_" + coord.y + ".png" :
            ["http://mt0.googleapis.com/vt?src=apiv3",
                "x=" + coord.x,
                "y=" + coord.y,
                "z=" + zoom
            ].join('&');
    },
    tileSize: new google.maps.Size(256, 256),
    name: "LocalstorageLocalMyGmap",
    maxZoom: 15
}));

google.maps.event.addListener(map, 'click', function(point) {
    var marker = new google.maps.Marker({
        position: point.latLng,
        map: map
    });

    google.maps.event.addListener(marker, 'dblclick', function() {
        marker.setMap(null);
    });

    google.maps.event.addListener(marker, 'click', function() {
        new google.maps.InfoWindow({
            content: 'lat: ' + point.latLng.lat() + '<br>lng:' + point.latLng.lng()
        }).open(map, marker);
    });
});

function CustomControl(controlDiv, map, title, handler) {
    controlDiv.style.padding = '5px';

    var controlUI = document.createElement('DIV');
    controlUI.style.backgroundColor = 'white';
    controlUI.style.borderStyle = 'solid';
    controlUI.style.borderWidth = '2px';
    controlUI.style.cursor = 'pointer';
    controlUI.style.textAlign = 'center';
    controlUI.title = title;
    controlDiv.appendChild(controlUI);

    var controlText = document.createElement('DIV');
    controlText.style.fontFamily = 'Arial,sans-serif';
    controlText.style.fontSize = '12px';
    controlText.style.paddingLeft = '4px';
    controlText.style.paddingRight = '4px';
    controlText.innerHTML = title;
    controlUI.appendChild(controlText);

    google.maps.event.addDomListener(controlUI, 'click', handler);
}

var clearLocalStorageDiv = document.createElement('DIV');
var clearLocalStorageButton = new CustomControl(clearLocalStorageDiv, map,
    'Clear localStorage',  clearLocalStorage);

var prepareLocalStorageDiv = document.createElement('DIV');
var prepareLocalStorageButton = new CustomControl(prepareLocalStorageDiv, map,
    'Prepare localStorage', prepareLocalStorage);

clearLocalStorageDiv.index = 1;
prepareLocalStorageDiv.index = 1;
map.controls[google.maps.ControlPosition.TOP_RIGHT].push(clearLocalStorageDiv);
map.controls[google.maps.ControlPosition.TOP_RIGHT].push(prepareLocalStorageDiv);
