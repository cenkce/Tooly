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
                    initForm:function(id, buttons){
                        if(QTags.getInstance('bbp_topic_content').canvas.value){
                            var qt = quicktags({id:id,buttons: buttons});
                        }
                        QTags.getInstance('bbp_topic_content')
                        QTags.getInstance('bbp_topic_content').canvas.value = '';
                    },
                    addQutoedReply: function (id, quote) {
                        QTags.getInstance(id).canvas.value = '<blockquote>'+quote+'</blockquote>';
                    }

                }
        };
});