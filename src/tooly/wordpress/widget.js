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
