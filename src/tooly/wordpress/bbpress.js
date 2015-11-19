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
        "tooly/wordpress/bbpress/config"
    ],
    function($, wordpress, modal, config) {
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