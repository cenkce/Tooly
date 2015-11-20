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
                        //quicktags();
                        //if ( typeof( edButtons ) !== 'undefined' ) {
                            edButtons[110] = new QTags.TagButton( 'code', 'code', '`', '`', 'c' );
                            QTags._buttonsInit();
                        //}

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