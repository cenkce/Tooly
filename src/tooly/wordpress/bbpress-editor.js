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
                        if(QTags.getInstance(id).canvas.value){
                            var qt = quicktags({id:id,buttons: buttons});
                        }
                        return this;
                    },
                    addQutoedReply: function (id, quote) {
                        QTags.getInstance(id).canvas.value = '<blockquote>'+quote+'</blockquote>';
                        return this;
                    },
                    reset: function (editor_id, title_id) {
                        QTags.getInstance(editor_id);

                        if(title_id !== undefined) {
                            QTags.getInstance(editor_id).canvas.value = '';
                            $('#'+title_id).val('');
                        }

                        return this;
                    }
                }
        };
});