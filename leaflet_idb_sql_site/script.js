'use strict';

(function (window, L) {
    var storage = null;

    var StorageTileLayer = L.TileLayer.extend({
        _imageToDataUri: function (image) {
            var canvas = document.createElement('canvas');
            canvas.width = image.width;
            canvas.height = image.height;

            var context = canvas.getContext('2d');
            context.drawImage(image, 0, 0);

            return canvas.toDataURL('image/png');
        },

        _tileOnLoadWithCache: function () {
            if (storage) {
                storage.add(this._storageKey, this._layer._imageToDataUri(this));
            }
            L.TileLayer.prototype._tileOnLoad.apply(this, arguments);
        },

        _setUpTile: function (tile, key, value, cache) {
            tile._storageKey = key;
            tile._layer = this;
            if (cache) {
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
            var key = tilePoint.z + '_' + tilePoint.x + '_' + tilePoint.y;

            var self = this;
            if (storage) {
                storage.get(key, function () {
                    var dataUri = this.result;
                    if (dataUri) {
                        self._setUpTile(tile, key, dataUri.value, false);
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

    var initMap = function () {
        var map = L.map('map').setView([53.902254, 27.561850], 13);

        new StorageTileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png').addTo(map);
    };

    var getIndexedDBStorage = function () {
        var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;

        var IndexedDBImpl = function () {
            var db = null;
            var request = indexedDB.open('TileStorage');

            request.onsuccess = function() {
                db = this.result;
                initMap();
            };

            request.onerror = function (error) {
                console.log(error);
            };

            request.onupgradeneeded = function () {
                var store = this.result.createObjectStore('tile', { keyPath: 'key'});
                store.createIndex('key', 'key', { unique: true });
            };

            this.add = function (key, value) {
                var transaction = db.transaction(['tile'], 'readwrite');
                var objectStore = transaction.objectStore('tile');
                objectStore.put({key: key, value: value});
            };

            this.delete = function (key) {
                var transaction = db.transaction(['tile'], 'readwrite');
                var objectStore = transaction.objectStore('tile');
                objectStore.delete(key);
            };

            this.get = function (key, successCallback, errorCallback) {
                var transaction = db.transaction(['tile'], 'readonly');
                var objectStore = transaction.objectStore('tile');
                var result = objectStore.get(key);
                result.onsuccess = successCallback;
                result.onerror = errorCallback;
            };
        };

        return indexedDB ? new IndexedDBImpl() : null;
    };

    var getWebSqlStorage = function () {
        var openDatabase = window.openDatabase;

        var WebSqlImpl = function () {
            var db = openDatabase('TileStorage', '1.0', 'Tile Storage', 50 * 1024 * 1024);
            db.transaction(function (tx) {
                tx.executeSql('CREATE TABLE IF NOT EXISTS tile (key TEXT PRIMARY KEY, value TEXT)', []);
                initMap();
            });

            this.add = function (key, value) {
                db.transaction(function (tx) {
                    tx.executeSql('INSERT INTO tile (key, value) VALUES (?, ?)', [key, value]);
                });
            };

            this.delete = function (key) {
                db.transaction(function (tx) {
                    tx.executeSql('DELETE FROM tile WHERE key = ?', [key]);
                });
            };

            this.get = function (key, successCallback, errorCallback) {
                db.transaction(function (tx) {
                    tx.executeSql('SELECT value FROM tile WHERE key = ?', [key], successCallback, errorCallback);
                });
            };
        };

        return openDatabase ? new WebSqlImpl() : null;
    };

    var getStorage = function () {
        return getIndexedDBStorage() || getWebSqlStorage() || null;
    };

    storage = getStorage();
    if (!storage) {
        initMap();
    }
})(window, L);