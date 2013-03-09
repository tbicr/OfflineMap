'use strict';

(function (window, emr, L, undefined) {
var StorageTileLayer = L.TileLayer.extend({
    _imageToDataUri: function (image) {
        var canvas = window.document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;

        var context = canvas.getContext('2d');
        context.drawImage(image, 0, 0);

        return canvas.toDataURL('image/png');
    },

    _tileOnLoadWithCache: function () {
        var storage = this._layer.options.storage;
        if (storage) {
            storage.add(this._storageKey, this._layer._imageToDataUri(this));
        }
        L.TileLayer.prototype._tileOnLoad.apply(this, arguments);
    },

    _setUpTile: function (tile, key, value, cache) {
        tile._layer = this;
        if (cache) {
            tile._storageKey = key;
            tile.onload = this._tileOnLoadWithCache;
            tile.crossOrigin = 'Anonymous';
        } else {
            tile.onload = this._tileOnLoad;
        }
        tile.onerror = this._tileOnError;
        tile.src = value;
    },

    _loadTile: function (tile, tilePoint) {
        this._adjustTilePoint(tilePoint);
        var key = tilePoint.z + ',' + tilePoint.y + ',' + tilePoint.x;

        var self = this;
        if (this.options.storage) {
            this.options.storage.get(key, function (value) {
                if (value) {
                    self._setUpTile(tile, key, value, false);
                } else {
                    self._setUpTile(tile, key, self.getTileUrl(tilePoint), true);
                }
            }, function () {
                self._setUpTile(tile, key, self.getTileUrl(tilePoint), true);
            });
        } else {
            self._setUpTile(tile, key, self.getTileUrl(tilePoint), false);
        }
    }
});

    emr.on('mapLoad', function (storage) {
        var map = L.map('map').setView([53.902254, 27.561850], 13);
        new StorageTileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {storage: storage}).addTo(map);
        emr.fire('mapLoaded');
    });
})(window, window.offlineMaps.eventManager, L);