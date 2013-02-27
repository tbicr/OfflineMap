'use strict';

(function (window, emr, mapbox, MM, undefined) {
    var StorageRequestManager = function (storage) {
        MM.RequestManager.apply(this, []);
        this._storage = storage;
    };

    StorageRequestManager.prototype._imageToDataUri = function (image) {
        var canvas = window.document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;

        var context = canvas.getContext('2d');
        context.drawImage(image, 0, 0);

        return canvas.toDataURL('image/png');
    };

    StorageRequestManager.prototype._createTileImage = function (id, coord, value, cache) {
        var img = window.document.createElement('img');
        img.id = id;
        img.style.position = 'absolute';
        img.coord = coord;
        this.loadingBay.appendChild(img);
        if (cache) {
            img.onload = this.getLoadCompleteWithCache();
            img.crossOrigin = 'Anonymous';
        } else {
            img.onload = this.getLoadComplete();
        }
        img.onerror = this.getLoadComplete();
        img.src = value;
    };

    StorageRequestManager.prototype._loadTile = function (id, coord, url) {
        var self = this;
        if (this._storage) {
            this._storage.get(id, function () {
                var dataUri = this.result;
                if (dataUri) {
                    self._createTileImage(id, coord, dataUri.value, false);
                } else {
                    self._createTileImage(id, coord, url, true);
                }
            }, function () {
                self._createTileImage(id, coord, url, true);
            });
        } else {
            self._createTileImage(id, coord, url, false);
        }
    };

    StorageRequestManager.prototype.processQueue = function (sortFunc) {
        if (sortFunc && this.requestQueue.length > 8) {
            this.requestQueue.sort(sortFunc);
        }
        while (this.openRequestCount < this.maxOpenRequests && this.requestQueue.length > 0) {
            var request = this.requestQueue.pop();
            if (request) {
                this.openRequestCount++;
                this._loadTile(request.id, request.coord, request.url);
                request = request.id = request.coord = request.url = null;
            }
        }
    };

    StorageRequestManager.prototype.getLoadCompleteWithCache = function () {
        if (!this._loadComplete) {
            var theManager = this;
            this._loadComplete = function(e) {
                e = e || window.event;

                var img = e.srcElement || e.target;
                img.onload = img.onerror = null;

                if (theManager._storage) {
                    theManager._storage.add(this.id, theManager._imageToDataUri(this));
                }

                theManager.loadingBay.removeChild(img);
                theManager.openRequestCount--;
                delete theManager.requestsById[img.id];

                if (e.type === 'load' && (img.complete ||
                    (img.readyState && img.readyState === 'complete'))) {
                    theManager.dispatchCallback('requestcomplete', img);
                } else {
                    theManager.dispatchCallback('requesterror', {
                        element: img,
                        url: ('' + img.src)
                    });
                    img.src = null;
                }

                setTimeout(theManager.getProcessQueue(), 0);
            };
        }
        return this._loadComplete;
    };

    MM.extend(StorageRequestManager, MM.RequestManager);

    var StorageLayer = function(provider, parent, name, storage) {
        this.parent = parent || document.createElement('div');
        this.parent.style.cssText = 'position: absolute; top: 0px; left: 0px;' +
            'width: 100%; height: 100%; margin: 0; padding: 0; z-index: 0';
        this.name = name;
        this.levels = {};
        this.requestManager = new StorageRequestManager(storage);
        this.requestManager.addCallback('requestcomplete', this.getTileComplete());
        this.requestManager.addCallback('requesterror', this.getTileError());
        if (provider) {
            this.setProvider(provider);
        }
    };

    MM.extend(StorageLayer, MM.Layer);

    var StorageTemplatedLayer = function(template, subdomains, name, storage) {
        return new StorageLayer(new MM.Template(template, subdomains), null, name, storage);
    };

    emr.on('mapLoad', function (storage) {
        var map = mapbox.map('map');
        map.addLayer(new StorageTemplatedLayer('http://{S}.tile.osm.org/{Z}/{X}/{Y}.png',
            ['a', 'b', 'c'], undefined, storage));
        map.ui.zoomer.add();
        map.ui.zoombox.add();
        map.centerzoom({lat: 53.902254, lon: 27.561850}, 13);
    });
})(window, window.offlineMaps.eventManager, mapbox, MM);