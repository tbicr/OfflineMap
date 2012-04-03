function MozIndexedDbImpl() {

}

function WebkitIndexedDbImpl() {

}

function WebSqlWebStorageImpl() {

}

function LocalStorageWebStorageImpl() {
    this.getItem = function(name) {
        return localStorage.getItem(name);
    };

    this.setItem = function(name, value) {
        localStorage.setItem(name, value);
    };

    this.clear = function() {
        localStorage.clear();
    };
}

function WebStorage() {
    var webStorage = null;

    if ('NI_mozIndexedDB' in window) {
        webStorage = new MozIndexedDbImpl();
    } else if ('NI_webkitIndexedDB' in window) {
        webStorage = new WebkitIndexedDbImpl();
    } else if ('NI_openDatabase' in window) {
        webStorage = WebSqlWebStorageImpl();
    } else if ('localStorage' in window) {
        webStorage = new LocalStorageWebStorageImpl();
    } else {
        alert("Your browser don't support web storage");
    }

    this.getItem = function(name) {
        return webStorage.getItem(name);
    };

    this.setItem = function(name, value) {
        webStorage.setItem(name, value);
    };

    this.clear = function() {
        webStorage.clear();
    };
}