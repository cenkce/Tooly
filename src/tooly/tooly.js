/**
 * Created by cenkce on 10/2/15.
 */

/* ========================================================================
 * Tooly base
 * ======================================================================== */
define('jquery', function () {
        return jQuery || {};
    }
);
define('tooly', ["jquery"], function($) {
    var tooly = {}, w = window;

    tooly.EventManager = {
        createEvent: function (type, client) {
            var e = $.Event(type);
            e._cancel = false;
            e._client = client;
            return e;
        },
        dispatch: function(event, data, cancelable) {
            $(w).trigger(event, data);
        },
        on: function (event, handler) {
            $(w).bind(event, handler);
        },
        one: function (event, handler) {
            $(w).one(event, handler);
        },
        off: function (event) {
            if(event instanceof $.Event) {
                return _wpEl.off(event);
            }
            throw new Error("Event must be instance of jQuery.Event");
        },
        unbind: function (event, handler) {
            $(w).unbind(event, handler);
        }
    };

    return tooly;
});

require(["tooly"], function (tooly) {
   window.tooly = tooly;
});