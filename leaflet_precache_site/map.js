'use strict';

var StorageTileLayer = L.TileLayer.extend({
    _setUpTile: function (tile, value, blob) {
        tile._layer = this;
        if (blob) {
            value = URL.createObjectURL(value);
            tile.onload = function () {
                URL.revokeObjectURL(value);
                L.TileLayer.prototype._tileOnLoad.apply(this, arguments);
            };
            tile.onerror = function () {
                URL.revokeObjectURL(value);
                L.TileLayer.prototype._tileOnError.apply(this, arguments);
            };
        } else {
            tile.onload = this._tileOnLoad;
            tile.onerror = this._tileOnError;
        }

        tile.src = value;

        this.fire('tileloadstart', {
            tile: tile,
            url: tile.src
        });
    },

    _loadTile: function (tile, tilePoint) {
        this._adjustTilePoint(tilePoint);
        var key = tilePoint.z + ',' + tilePoint.x + ',' + tilePoint.y;
        var self = this;
        if (this.options.storage) {
            this.options.storage.getAttachment(key, key, function (err, value) {
                if (value) {
                    self._setUpTile(tile, value, true);
                } else {
                    self._setUpTile(tile, self.getTileUrl(tilePoint));
                }
            });
        } else {
            self._setUpTile(tile, self.getTileUrl(tilePoint));
        }
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

var db = new PouchDB('tile');
var map = L.map('map').setView([53.902254, 27.561850], 13);
new StorageTileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {storage: db}).addTo(map);

map.addControl(new Control({position: 'topleft', innerHTML: 'C', handler: function () {
    ajax('cache_keys.json', 'text', function (response) {
        var tile_key_list = JSON.parse(response);
        for (var i = 0, l = tile_key_list.length; i < l; i++) {
            (function (key) {
                var src = 'http://tile.osm.org/' + key.split(',').join('/') + '.png';
                ajax(src, 'blob', function (response) {
                    db.putAttachment(key, key, 1, response, 'image/png');
                });
            })(tile_key_list[i]);
        }
    });
}}));

map.addControl(new Control({position: 'topleft', innerHTML: 'D', handler: function () {
    PouchDB.destroy('tile', function (err, value) {
        if (!err) {
            db = new PouchDB('tile');
        }
    });
}}));