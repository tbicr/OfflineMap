function LocalStorageWebStorageImpl() {
    this.webStorageType = 'localStorage';

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

function WebStorageFactory() {
    var webStorage = null;

    if (window.localStorage) {
        webStorage = new LocalStorageWebStorageImpl();
    } else {
        alert("Your browser don't support localStorage");
    }

    this.getWebStorage = function() {
        return webStorage;
    }
}