/**
 * @license almond 0.3.1 Copyright (c) 2011-2014, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        hasOwn = Object.prototype.hasOwnProperty,
        aps = [].slice,
        jsSuffixRegExp = /\.js$/;

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap, lastIndex,
            foundI, foundStarMap, starI, i, j, part,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                name = name.split('/');
                lastIndex = name.length - 1;

                // Node .js allowance:
                if (config.nodeIdCompat && jsSuffixRegExp.test(name[lastIndex])) {
                    name[lastIndex] = name[lastIndex].replace(jsSuffixRegExp, '');
                }

                //Lop off the last part of baseParts, so that . matches the
                //"directory" and not name of the baseName's module. For instance,
                //baseName of "one/two/three", maps to "one/two/three.js", but we
                //want the directory, "one/two" for this normalization.
                name = baseParts.slice(0, baseParts.length - 1).concat(name);

                //start trimDots
                for (i = 0; i < name.length; i += 1) {
                    part = name[i];
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            break;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            } else if (name.indexOf('./') === 0) {
                // No baseName, so this is ID is resolved relative
                // to baseUrl, pull off the leading dot.
                name = name.substring(2);
            }
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            var args = aps.call(arguments, 0);

            //If first arg is not require('string'), and there is only
            //one arg, it is the array form without a callback. Insert
            //a null so that the following concat is correct.
            if (typeof args[0] !== 'string' && args.length === 1) {
                args.push(null);
            }
            return req.apply(undef, args.concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!hasProp(defined, name) && !hasProp(defining, name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
            index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relName) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i,
            args = [],
            callbackType = typeof callback,
            usingExports;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (callbackType === 'undefined' || callbackType === 'function') {
            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (hasProp(defined, depName) ||
                           hasProp(waiting, depName) ||
                           hasProp(defining, depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback ? callback.apply(defined[name], args) : undefined;

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (config.deps) {
                req(config.deps, config.callback);
            }
            if (!callback) {
                return;
            }

            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            //Using a non-zero value because of concern for what old browsers
            //do, and latest browsers "upgrade" to 4 if lower value is used:
            //http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
            //If want a value immediately, use require('id') instead -- something
            //that works in almond on the global level, but not guaranteed and
            //unlikely to work in other AMD implementations.
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 4);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        return req(cfg);
    };

    /**
     * Expose module registry for debugging and tooling
     */
    requirejs._defined = defined;

    define = function (name, deps, callback) {
        if (typeof name !== 'string') {
            throw new Error('See almond README: incorrect module build, no module name');
        }

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
            waiting[name] = [name, deps, callback];
        }
    };

    define.amd = {
        jQuery: true
    };
}());

define("almond.js", function(){});


/**
 * Created by cenkce on 10/2/15.
 */

/* ========================================================================
 * Tooly base
 * ======================================================================== */
define('jquery', [],function () {
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
define("tooly.js", function(){});


/**
 * Created by cenkce on 10/2/15.
 */
define('assertion/assertion-concern', [],function () {
    var AssertionConcern = function(){
    };

        /**
         * @param object anObject1
         * @param object anObject2
         * @param string aMessage
         * @throws Error
         */
        AssertionConcern.prototype.assertArgumentEquals = function (anObject1, anObject2, aMessage) {
            if (anObject1 !== anObject2) {
                throw new Error(aMessage);
            }
        };

        /**
         * @param bool aBoolean
         * @param string aMessage
         * @throws Error
         */
        AssertionConcern.prototype.assertArgumentFalse = function(aBoolean, aMessage) {
            if (aBoolean) {
                throw new Error(aMessage);
            }
        };

        /**
         * @param String aString
         * @param int aMaximum
         * @param String aMessage
         * @throws Error
         */
        AssertionConcern.prototype.assertArgumentLength = function (aString, aMaximum, aMessage) {
            if (!aString || this.getStrLen(aString) > aMaximum) {
                throw new Error(aMessage);
            }
        };

        AssertionConcern.prototype.getStrLen = function(aString) {
            return trim(aString).length;
        };

        /**
         * @param String aString
         * @param int aMinimum
         * @param int aMaximum
         * @param String aMessage
         * @throws Error
         */
        AssertionConcern.prototype.assertArgumentLengthBetween = function(aString, aMinimum, aMaximum, aMessage) {
            var length = this.getStrLen(aString);
            if (length < aMinimum || length > aMaximum) {
                throw new Error(aMessage);
            }
        };

        /**
         * @param string aString
         * @param String aMessage
         * @throws Error
         */
        AssertionConcern.prototype.assertArgumentNotEmpty = function(aString, aMessage) {
            if (aString == null || empty(aString)) {
                throw new Error(aMessage);
            }
        };

        /**
         * @param Object anObject1
         * @param Object anObject2
         * @param String aMessage
         * @throws Error
         */
        AssertionConcern.prototype.assertArgumentNotEquals = function(anObject1, anObject2, aMessage) {
            if (anObject1 === anObject2) {
                throw new Error(aMessage);
            }
        };

        /**
         * @param Object anObject
         * @param String aMessage
         * @throws Error
         */
        AssertionConcern.prototype.assertArgumentNotNull = function(anObject, aMessage) {
            if (anObject == null) {
                throw new Error(aMessage);
            }
        };

        /**
         * @param int aValue
         * @param int aMinimum
         * @param int aMaximum
         * @param String aMessage
         * @throws Error
         */
        AssertionConcern.prototype.assertArgumentRange = function(aValue, aMinimum, aMaximum, aMessage) {
            if (aValue < aMinimum || aValue > aMaximum) {
                throw new Error(aMessage);
            }
        };

        /**
         * @param boolean aBoolean
         * @param String aMessage
         * @throws Error
         */
        AssertionConcern.prototype.assertArgumentTrue = function(aBoolean, aMessage) {
            if (!aBoolean) {
                throw new Error(aMessage);
            }
        };

        /**
         * @param boolean aBoolean
         * @param String aMessage
         * @throws IllegalStateException
         */
        AssertionConcern.prototype.assertStateFalse = function(aBoolean, aMessage) {
            if (aBoolean) {
                throw new Error(aMessage);
            }
        };

        /**
         * @param boolean aBoolean
         * @param String aMessage
         * @throws IllegalStateException
         */
        AssertionConcern.prototype.assertStateTrue = function(aBoolean, aMessage) {
            if (!aBoolean) {
                throw new Error(aMessage);
            }
        };
});
define("assertion/assertion-concern.js", function(){});


/**
 * Created by cenkce on 10/2/15.
 */
define("tooly/bootstrap/modal",["jquery"], function($){

    var $b = {};
    $b.Version="0.1";
    var modal = [], elements = [];

    $b.Options = function () {
            var backdrop=true,
            keyboard=true,
            show=true,
            remote=false;

            return {
                backdrop: function (val) {
                    backdrop = val;
                    return this;
                },
                keyboard: function (val) {
                    keyboard = val;
                    return this;
                },
                show: function (val) {
                    show = val;
                    return this;
                },
                remote: function (val) {
                    remote = val;
                    return this;
                },
                get: function () {
                    return {
                        backdrop: backdrop,
                        show: show,
                        keyboard: keyboard,
                        remote: remote
                    };
                }
            };
        };
        $b.Event={
            show:"show.bs.modal",
            hide:"hide.bs.modal",
            hidden:"hidden.bs.modal",
            shown:"shown.bs.modal",
            loaded:"loaded.bs.modal"
        };
        $b.Helper={
            config: {
                topic_form_class:"",
                reply_form_class:"",
                reply_link_id:"bbp-reply-to-link",
                get: function () {
                    return {
                        topic_form_class:this.topic_form_class,
                        reply_form_class:this.reply_form_class
                    };
                }
            },
            unload: function () {
            },
            createController:function (_class){
                    var handlers = [],
                        onCloseHandler,
                        el = '<div class= "'+_class+' modal modal-form fade modal-new-topic-form" tabindex="-1" role="dialog" aria-labelledby="">'+
                                '<div class="modal-dialog modal-lg"">'+
                                    '<div class="modal-content">'+
                                    '</div>'+
                                '</div>'+
                             '</div>';
                var _modal;

                if(!modal[_class]){
                    _modal = $(el);
                    _modal.appendTo($("body"));
                    modal[_class] = _modal;
                } else {
                    _modal = modal[_class];
                }

                //$(body).append(el);
                //modal = $(".modal-injected");

                var options = $b.Options().get();

                var privateMethods = {
                    onHide: function () {
                    },
                    onHidden: function () {
                        privateMethods.clear();
                    },
                    onShow: function () {
                    },
                    onShown: function () {
                    },
                    clear: function () {
                        var modalContent = _modal.find(".modal-content");
                        $(modalContent).empty();
                    },
                    add: function (el) {
                        var modalContent = _modal.find(".modal-content");
                        modalContent.append(el, null);
                    },
                    unloadModal:function () {
                        _modal.unbind($b.Event.hide);
                        _modal.unbind($b.Event.hidden);
                        _modal.unbind($b.Event.show);
                        _modal.unbind($b.Event.shown);
                        _modal.remove();
                        handlers = null;
                        _modal    = null;
                    }
                };

                _modal.bind($b.Event.hide, privateMethods.onHide);
                _modal.bind($b.Event.hidden, privateMethods.onHidden);
                _modal.bind($b.Event.show, privateMethods.onShow);
                _modal.bind($b.Event.shown, privateMethods.onShown);

                var currentElementName = '';

                var publicMethods = {
                    register: function (name, element) {
                        if(elements[name] != undefined){
                            currentElementName = name;
                            return this;
                        }
                        elements[name] = element;
                        //$(element).remove();
                        currentElementName = name;
                        //console.log("inject", element);
                        return this;
                    },
                    setOptions:function(ops){
                        //console.log("set options", ops);
                        $(_modal).modal(options);
                        options = ops;
                    },
                    getOptions:function(){
                        return $(options).clone();
                    },
                    show:function (name) {
                        if(name === undefined)
                            name = currentElementName;
                        var element = elements[name];
                        $(element).show();

                        var modalContent = _modal.find(".modal-content");
                        privateMethods.clear();
                        privateMethods.add(element);

                        //console.log("show");

                        options.show = true;
                        this.setOptions(options);
                        return this;
                    },
                    hide: function () {
                        //console.log("hide");
                        options.show = false;
                        this.setOptions(options);
                        return this;
                    },
                    remove: function () {
                        console.log("modal removed");
                        _modal.remove();
                    },
                    onHide: function (cbk) {
                        var modalContent = _modal.find(".modal-content");
                        $(modalContent).empty();

                        onCloseHandler = cbk;

                        _modal.bind($b.Event.hide, function () {
                            cbk();
                            _modal.unbind($b.Event.hide);
                        });
                        return this;
                    },
                    onHidden: function (cbk) {
                        _modal.bind($b.Event.hidden, function () {
                            cbk();
                            _modal.unbind($b.Event.hidden);
                        });

                        return this;
                    },
                    onShow: function (cbk) {
                        _modal.bind($b.Event.show, function () {
                            cbk();
                            _modal.unbind($b.Event.show);
                        });

                        return this;
                    },
                    onShown: function (cbk) {
                        _modal.bind($b.Event.shown, function () {
                            cbk();
                            _modal.unbind($b.Event.shown);
                        });

                        return this;
                    },
                    onLoaded: function (cbk) {
                        _modal.bind($b.Event.loaded, function () {
                            cbk();
                            _modal.unbind($b.Event.loaded);
                        });

                        return this;
                    },
                    unload:function(){
                        privateMethods.unloadModal();
                    }
                };
                return publicMethods;
            }
        };

    return $b;

});
define("bootstrap/modal.js", function(){});


/**
 * Created by cenkce on 10/2/15.
 */

/* ========================================================================
 * Wordpress - bbPress plugin editor helper functions
 * ======================================================================== */

define("tooly/wordpress/bbpress/editor",
    [
        "jquery",
        "tooly/wordpress/wordpress",
        "tooly/bootstrap/modal",
        "tooly/wordpress/bbpress"
    ],
    function($, wordpress, modal, bbpress) {
        return {
                Helper:{
                    initForm:function(form){
                        if ( typeof( edButtons ) !== 'undefined' ) {
                            edButtons[110] = new QTags.TagButton( 'code', 'code', '`', '`', 'c' );
                            QTags._buttonsInit();
                        }

                        /* Tab from topic title */
                        form.bind( 'keydown.editor-focus', function(e) {
                            if ( e.which !== 9 )
                                return;

                            if ( !e.ctrlKey && !e.altKey && !e.shiftKey ) {
                                if ( typeof( tinymce ) !== 'undefined' ) {
                                    if ( ! tinymce.activeEditor.isHidden() ) {
                                        var editor = tinymce.activeEditor.editorContainer;
                                        form.find( '#' + editor + ' td.mceToolbar > a' ).focus();
                                    } else {
                                        form.find( 'textarea.bbp-the-content' ).focus();
                                    }
                                } else {
                                    form.find( 'textarea.bbp-the-content' ).focus();
                                }

                                e.preventDefault();
                            }
                        });

                        /* Shift + tab from topic tags */
                        form.bind( 'keydown.editor-focus', function(e) {
                            if ( e.which !== 9 )
                                return;

                            if ( e.shiftKey && !e.ctrlKey && !e.altKey ) {
                                if ( typeof( tinymce ) !== 'undefined' ) {
                                    if ( ! tinymce.activeEditor.isHidden() ) {
                                        var editor = tinymce.activeEditor.editorContainer;
                                        form.find( '#' + editor + ' td.mceToolbar > a' ).focus();
                                    } else {
                                        form.find( 'textarea.bbp-the-content' ).focus();
                                    }
                                } else {
                                    form.find( 'textarea.bbp-the-content' ).focus();
                                }

                                e.preventDefault();
                            }
                        });

            },
            addQutoedReply: function (form, quote) {
                
            }
        }
        };
});
define("wordpress/bbpress-editor.js", function(){});


/**
 * Created by cenkce on 10/2/15.
 */

/* ========================================================================
 * Wordpress - bbPress plugin helper functions
 * ======================================================================== */

define("tooly/wordpress/bbpress/config", {
    replyFormClass      : ".bbp-reply-form",
    topicReplyLinkClass : ".bbp-topic-reply-link",
    replyReplyLinkClass : ".bbp-reply-to-link",
    newTopicLinkClass   : ".new-topic-button",
    newTopicFormClass   : ".bbp-topic-form",
    modalClass          : ".modal-bbpress",
    warning             : '<div class="alert alert-warning">Üye olmalı veya üye girişi yapmalısınız. <a href="">Giriş</a> </div>'
});

define("tooly/wordpress/bbpress",
    [
        "jquery",
        "tooly/wordpress/wordpress",
        "tooly/bootstrap/modal",
        "tooly/wordpress/bbpress/config",
        "tooly/wordpress/bbpress/editor",
    ],
    function($, wordpress, modal, config, editor) {
        var modalController = modal.Helper.createController(config.modalClass);

        function parseReplyID(link){
            var res = link.match(/bbp_reply_to\=([0-9]*)/m);
            if(res["index"] >= 0) {
                return res[1];
            }
            return false;
        }

        function showNewTopicForm(e){
            if(cancelableEventDispatch(Event.newTopicFormOpen, e.target))
                return;

            var form = $(config.newTopicFormClass).clone();
            editor.Helper.initForm(form);
            modalController.register('bbpress_newTopicForm', form).show();
            e.preventDefault();
            cancelableEventDispatch(Event.newTopicFormOpened, e.target);
        }

        function cancelableEventDispatch(type, client){
            var e = tooly.EventManager.createEvent(type, client);
            tooly.EventManager.dispatch(e);
            return e.cancel;
        }

        function showTopicReplyForm(e) {
            if(cancelableEventDispatch(Event.topicReplyFormOpen, e.target))
                return;

            var reply_id = 0,
                type = "",
                form = $(config.replyFormClass).clone();
                editor.Helper.initForm(form);
            if(e.target.className.indexOf(config.topicReplyLinkClass.replace(".", "")) >= 0) {
                type = "topic";
            } else if(e.target.className.indexOf(config.replyReplyLinkClass.replace(".", "")) >= 0) {
                type = "reply";
                reply_id = parseReplyID(e.target.href);
            }

            var cancel = form.find('#bbp-cancel-reply-to-link'),
                parent = form.find('#bbp_reply_to'),
                post   = form.find('#bbp_topic_id');

            parent.val(reply_id);
            post.val(wordpress.Helper.getPostId());
            modalController.register('bbpress_replyForm', form).show();
            e.preventDefault();

            cancelableEventDispatch(Event.topicReplyFormOpened, e.target);
        }
        var Event = {
                newTopicFormOpen:"tooly.bbpress.newTopicFormOpen",
                newTopicFormOpened:"tooly.bbpress.newTopicFormOpened",
                topicReplyFormOpen:"tooly.bbpress.topicReplyFormOpen",
                topicReplyFormOpened:"tooly.bbpress.topicReplyFormOpened"
            },
            Helper = {
                init: function () {
                    switch(wordpress.Helper.getPageType()) {
                        case "topic":
                            $(config.topicReplyLinkClass).bind("click", showTopicReplyForm);
                            $(config.replyReplyLinkClass).bind("click", showTopicReplyForm);
                            break;
                        case "forum":
                            $(config.newTopicLinkClass).bind("click", showNewTopicForm);
                            break;
                    }
                },
                unload: function () {
                    $(config.topicReplyLinkClass).unbind("click",showTopicReplyForm);
                    modalController.unload();
                }
        };

        return {Event:Event, Helper:Helper};

});
define("wordpress/bbpress.js", function(){});


/**
 * Created by cenkce on 10/2/15.
 */
/* ========================================================================
 * Wordpress Wdiget helper functions
 * ======================================================================== */

define(
    "tooly/wordpress/widget",
    ["tooly/wordpress/wordpress", "jquery", "tooly"],
    function(wordpress, $, tooly) {

        var base = {},
            frame,
            w = window;

        function _getMediaFrame(options){
            var frame;
            frame = wp.media(options);
            return frame;
        }

        base.Event = {
                mediaModalOpen:"tooly.wordpress.widget.event.mediaModalOpen",
                mediaModalSelect:"tooly.wordpress.widget.event.mediaModalSelect"
            };
            base.Helper = {
                Media:{

                    imageUploadButtonDecorator: function (widget_id, upload_button, field_id, preview_container) {
                        var box              = $("div[id*=_"+widget_id+"]"),
                            boxForm          = box.find("form"),
                            fieldId          = "widget-"+widget_id+"-"+field_id,
                            formField        = box.find('#'+fieldId),
                            button           = box.find(upload_button),
                            previewContainer = box.find(preview_container),
                            mediaFrame,
                            attachment,
                            decorator = {
                                init: function (options) {
                                    mediaFrame = _getMediaFrame(options);
                                    return this;
                                },
                                unload: function () {
                                    button.unbind("click");
                                    button = null;
                                    previewContainer = null;
                                    box = null;
                                    formField = null;
                                },
                                onSelect: function (cbk) {
                                    tooly.EventManager.one(base.Event.mediaModalSelect, cbk);
                                    return this;
                                },
                                onModalOpen: function (cbk) {
                                    tooly.EventManager.one(base.Event.mediaModalOpen, cbk);
                                    return this;
                                }
                            };

                        mediaFrame = _getMediaFrame({
                            title: 'Select or Upload Media Of Your Chosen Persuasion',
                            button: {
                                text: 'Use this media'
                            },
                            multiple: false  // Set to true to allow multiple files to be selected
                        });

                        if(formField.val()){
                            showPreview(formField.val());
                        }

                        function showPreview(src) {
                            previewContainer.append('<img src="' + src + '" alt="" style="max-width:100%;"/>');
                        }

                        button.on('click', function (e) {
                            mediaFrame.open();
                            mediaFrame.on( 'select', function(e) {
                                tooly.EventManager.dispatch(base.Event.mediaModalSelect);
                                attachment = mediaFrame.state().get('selection').first().toJSON();
                                formField.val(attachment.url);
                                previewContainer.empty();
                                showPreview(attachment.url);
                            });
                            e.preventDefault();
                        });

                        return decorator;
                    }
                }
            };

        //wordpress.prototype.widget = base;

        return base;
});

define("wordpress/widget.js", function(){});


/**
 * Created by cenkce on 10/2/15.
 */
/* ========================================================================
 * Wordpress helper functions
 * ======================================================================== */

 define("tooly/wordpress/wordpress",[
     "jquery",
     "tooly",
     "tooly/bootstrap/modal"
], function( $, tooly, modal ) {

    var w=window,
        _wpEl,
        //WP login url
        _loginURL = "/wp/wp-login.php",
        //Public helper functions
        Helper = {
                    getPageType: function () {
                        return currentPageType;
                    },
                    getTemplateType: function () {
                        return currentTemplateType;
                    },
                    getPostId:function(){
                        return post_id;
                    },
                    isLoggedIn: function () {
                        return logged_in;
                    },
                    createController:function(){
                        return {
                            EventManager: function () {
                                return tooly.EventManager;
                            }
                        };
                    },
                    modalLogin: function () {
                        modal.Helper.createController("").show();
                    },
                    ajaxLogin: function (data) {
                    }
        },
        Event = {
             pageLoaded:"tooly.wordpress.event.pageLoaded",
             userLoggedIn:"tooly.wordpress.event.userLoggedIn",
             init:"tooly.wordpress.event.init"
        };
    function loadEvents() {
        tooly.EventManager.dispatch(tooly.EventManager.Event.pageLoaded, [pg]);
    }


    //Parses Body classes and finds initial wordpress variables
    var classes = document.body.className.split(/\s+/),
        currentPageType = classes[0],
        currentTemplateType = classes[2], post_id, logged_in;

    if(document.body.className.indexOf("postid-") > -1){
        post_id = classes[4].replace("postid-","")
    }

    function checkLogin(){
        return logged_in = (document.body.className.indexOf("logged-in") > -1)?true:false;
    }

    //is user logged in?
    checkLogin();

    //constrtuctor
    //Helper.init  = function(){
        if(!$("#__wordpress_notify__")) {
            $("body").append("<div id='__wordpress_notify__' style='display: none;'></div>");
        }

        _wpEl = $("#__wordpress_notify__");

        if(logged_in === false){
            document.body.addEventListener('DOMAttrModified', function(e){
                if (e.attrName === 'class') {
                    if(e.attributeName == "class"){
                        if(logged_in === false && checkLogin()){
                            tooly.EventManager.dispatch(Event.userLoggedIn);
                        }
                    }
                }
            }, false);
        }

        //tooly.EventManager.dispatch(Event.init);
    //};
    return {
        Helper:Helper
    }
});

define("wordpress/wordpress.js", function(){});


//# sourceMappingURL=tooly.js.map
