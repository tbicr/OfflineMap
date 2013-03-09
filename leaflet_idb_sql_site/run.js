'use strict';

(function (emr) {
    window.onerror = function (e, f, l) {
        alert(e + '\n' + f + ':' + 'l');
    };

    emr.on('storageLoaded', 'mapLoad');
    emr.fire('storageLoad');
})(window.offlineMaps.eventManager);