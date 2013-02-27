'use strict';

window.offlineMaps = {};

window.offlineMaps.eventManager = {
    _events: {},

    on: function (event, action) {
        console.log('event.on: ' + event);
        if (!(event in this._events)) {
            this._events[event] = [];
        }
        this._events[event].push(action);
        return this;
    },

    off: function (event) {
        console.log('event.off: ' + event);
        delete this._events[event];
        return this;
    },

    fire: function (event) {
        console.log('event.fire: ' + event);
        var events = this._events;
        if (event in events) {
            var actions = events[event];
            var args = Array.prototype.slice(arguments, 1);
            for (var i = 0, l = actions.length; i < l; i++) {
                var action = actions[i];
                if (action instanceof Function) {
                    action.apply(null, args);
                } else {
                    this.fire.apply(this, [action].concat(args));
                }
            }
        }
        return this;
    }
};