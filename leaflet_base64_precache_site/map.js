'use strict';

var StorageTileLayer = L.TileLayer.extend({
    _setUpTile: function (done, tile, value, blob) {
        tile.onload = L.bind(this._tileOnLoad, this, done, tile);
        tile.onerror = L.bind(this._tileOnError, this, done, tile);

        tile.src = value;
    },

    createTile: function (coords, done) {
        var tile = document.createElement('img');

        if (this.options.crossOrigin) {
            tile.crossOrigin = '';
        }

        /*
         Alt tag is set to empty string to keep screen readers from reading URL and for compliance reasons
         http://www.w3.org/TR/WCAG20-TECHS/H67
        */
        tile.alt = '';

        var x = coords.x,
            y = this.options.tms ? this._globalTileRange.max.y - coords.y : coords.y,
            z = this._getZoomForUrl(),
            key = z + ',' + x + ',' + y,
            self = this;
        if (this.options.storage) {
            this.options.storage.get(key, function (err, value) {
                if (value) {
                    tile.src = value.v;
                    self._setUpTile(done, tile, value.v, true);
                } else {
                    self._setUpTile(done, tile, self.getTileUrl(coords));
                }
            });
        } else {
            self._setUpTile(done, tile, self.getTileUrl(coords));
        }

        return tile;
    }
});

var Control = L.Control.extend({
    onAdd: function (map) {
        var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        container.innerHTML = '<a href="#" class="leaflet-control-zoom-in">' + this.options.innerHTML + '</a>';
        L.DomEvent
            .on(container, 'click', L.DomEvent.stopPropagation)
            .on(container, 'click', L.DomEvent.preventDefault)
            .on(container, 'click', this.options.handler, map)
            .on(container, 'dblclick', L.DomEvent.stopPropagation);
        return container;
    }
});

var ajax = function (src, responseType, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', src, true);
    xhr.responseType = responseType || 'text';
    xhr.onload = function(err) {
        if (this.status == 200) {
            callback(this.response);
        }
    };
    xhr.send();
};

/*
Probably btoa can work incorrect, you can override btoa with next example:
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Base64_encoding_and_decoding#Solution_.232_.E2.80.93_rewriting_atob%28%29_and_btoa%28%29_using_TypedArrays_and_UTF-8
 */
function arrayBufferToBase64ImagePNG(buffer) {
    var binary = '';
    var bytes = new Uint8Array(buffer);
    for (var i = 0, l = bytes.byteLength; i < l; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return 'data:image/png;base64,' + btoa(binary);
}

var dbname = 'tile';
var db = new PouchDB(dbname);
var map = L.map('map').setView([53.902254, 27.561850], 13);
new StorageTileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {storage: db}).addTo(map);

map.addControl(new Control({position: 'topleft', innerHTML: 'C', handler: function () {
    ajax('cache_keys.json', 'text', function (response) {
        var tile_key_list = JSON.parse(response);
        for (var i = 0, l = tile_key_list.length; i < l; i++) {
            (function (key) {
                var src = 'http://tile.osm.org/' + key.split(',').join('/') + '.png';
                ajax(src, 'arraybuffer', function (response) {
                    db.put({_id: key, v: arrayBufferToBase64ImagePNG(response)});
                });
            })(tile_key_list[i]);
        }
    });
}}));

map.addControl(new Control({position: 'topleft', innerHTML: 'D', handler: function () {
    PouchDB.destroy(dbname, function (err, value) {
        if (!err) {
            db = new PouchDB(db);
        }
    });
}}));