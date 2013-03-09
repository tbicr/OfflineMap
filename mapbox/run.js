'use strict';

(function (emr) {
    emr.on('storageLoaded', 'mapLoad');
    emr.fire('storageLoad');
})(window.offlineMaps.eventManager);