'use strict';

(function (window, OpenLayers, initStorage) {
    initStorage(function (storage) {
        var StorageImageTile = OpenLayers.Class(OpenLayers.Tile.Image, {
            _imageToDataUri: function (image) {
                var canvas = window.document.createElement('canvas');
                canvas.width = image.width;
                canvas.height = image.height;

                var context = canvas.getContext('2d');
                context.drawImage(image, 0, 0);

                return canvas.toDataURL('image/png');
            },

            renderTile: function() {
                var id = this.asyncRequestId = (this.asyncRequestId || 0) + 1;
                var self = this;
                this.layer.getURLasync(this.bounds, function(url, key, cache) {
                    if (id === self.asyncRequestId) {
                        self.url = url;
                        self._storageKey = key;
                        self._storageCache = cache;
                        self.initImage();
                    }
                }, this);
            },

            onImageLoadWithCache: function() {
                if (storage) {
                    storage.add(this._storageKey, this._imageToDataUri(this.imgDiv));
                }
                this.onImageLoad.apply(this, arguments);
            },

            initImage: function() {
                this.events.triggerEvent('beforeload');
                this.layer.div.appendChild(this.getTile());
                this.events.triggerEvent(this._loadEvent);
                var img = this.getImage();

                this.stopLoading();
                if (this.crossOriginKeyword) {
                    img.removeAttribute('crossorigin');
                }
                if (this._storageCache) {
                    OpenLayers.Event.observe(img, 'load',
                        OpenLayers.Function.bind(this.onImageLoadWithCache, this)
                    );
                } else {
                    OpenLayers.Event.observe(img, 'load',
                        OpenLayers.Function.bind(this.onImageLoad, this)
                    );
                }
                OpenLayers.Event.observe(img, 'error',
                    OpenLayers.Function.bind(this.onImageError, this)
                );
                this.imageReloadAttempts = 0;
                this.setImgSrc(this.url);
            }
        });

        var StorageOSMLayer = OpenLayers.Class(OpenLayers.Layer.OSM, {
            async: true,
            tileClass: StorageImageTile,

            clone: function (obj) {
                if (obj == null) {
                    obj = new OpenLayers.Layer.OSM(this.name,
                        this.url,
                        this.getOptions());
                }

                obj = OpenLayers.Layer.Grid.prototype.clone.apply(this, [obj]);
                return obj;
            },

            getURLasync: function (bounds, callback) {
                var xyz = this.getXYZ(bounds);
                var key = xyz.z + ',' + xyz.x + ',' + xyz.y;
                var url = this.getURL(bounds);
                if (storage) {
                    storage.get(key, function () {
                        var dataUri = this.result;
                        if (dataUri) {
                            callback(dataUri.value, key, false);
                        } else {
                            callback(url, key, true);
                        }
                    }, function () {
                        callback(url, key, true);
                    });
                } else {
                    callback(url, key, false);
                }
            }
        });

        var map = new OpenLayers.Map('map');
        map.addLayer(new StorageOSMLayer());
        var fromProjection = new OpenLayers.Projection('EPSG:4326');
        var toProjection   = new OpenLayers.Projection('EPSG:900913');
        var center = new OpenLayers.LonLat(27.561850, 53.902254).transform(fromProjection, toProjection);
        map.setCenter(center, 13);
    });
})(window, OpenLayers, initStorage);