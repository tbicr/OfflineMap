# Online Map examples in web browser

## Main idea
Modern js map libraries support sync and async tiles loading. You can change this method to own where used some permanent storage. Each tile have unique `src` so you can use unique id based on same data as `src` to store tile data.

In this examples used caching behaviour (cache data that you seen before), but you always can implement own button to cache some area with required zooms. For this case you should know id's of all tiles in some area to download it and store to storage.

## Useful links
- http://gis.stackexchange.com/q/44813/31124
- http://stackoverflow.com/q/14113278/880326

## Notes
This samples just proof of concept and if you should avoid use this solution if it posible because:
- cache can eat to many memory and trafic to cache
- cache of images can't be compressed
- cache can work slow especially for mobile browsers
- cache can't be shared between several domains, for each domain you should duplicate cache or use for example iframe with one domain to avoid duplication

If you can use any special application for offline maps as osmand then better use it.

If you can implement any proxy solution on your system for tiles storing then better use it.

## Examples

### Google Maps with localstorage:
[Example](http://offline-map.appspot.com/) and [Code](https://github.com/tbicr/OfflineMap/tree/master/gmaps_localstorage_site). This code can contradict [Google Maps/Google Earth APIs Terms of Service](https://developers.google.com/maps/terms) par. 10.1.1.

### Leaflet with IndexedDB and WebSQL:
[Example](http://tbicr.github.com/OfflineMap/leaflet/index.html) and [Code](https://github.com/tbicr/OfflineMap/tree/master/leaflet_idb_sql_site). [MIT License](http://opensource.org/licenses/mit-license.php).

You can find more examples with LeafLet and [PouchDB](http://pouchdb.com/) there: http://tbicr.github.io/OfflineMap/.

Instead [PouchDB](http://pouchdb.com/) also can used [localForage](https://github.com/mozilla/localForage), [LargeLocalStorage](https://github.com/tantaman/LargeLocalStorage) and etc.

### Mapbox (Modest Maps) with IndexedDB and WebSQL:
[Example](http://tbicr.github.com/OfflineMap/mapbox/index.html) and [Code](https://github.com/tbicr/OfflineMap/tree/master/mapbox_idb_sql_site). [MIT License](http://opensource.org/licenses/mit-license.php).

### Open Layers with IndexedDB and WebSQL:
[Example](http://tbicr.github.com/OfflineMap/openlayers/index.html) and [Code](https://github.com/tbicr/OfflineMap/tree/master/openlayers_idb_sql_site). [MIT License](http://opensource.org/licenses/mit-license.php).
