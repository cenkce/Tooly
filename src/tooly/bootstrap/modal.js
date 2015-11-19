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
                        elements[name] = element;
                        $(element).remove();
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