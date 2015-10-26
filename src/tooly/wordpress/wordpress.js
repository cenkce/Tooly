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
