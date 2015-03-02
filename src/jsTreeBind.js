/**
 * Created by Miguel on 26/01/2015.
 */
(function ($) {
    var warn = require("./warn");
    var getDefaults = require("./options");
    var observe = require("./observe");

    $.fn.jstreeBind = function (target, options) {

        //Main variables
        options = options || {};
        //template is the element that has associated data bindings that we're basing the tree off
        var template = $(target);
        //tree is the actual tree element that $().jstree will be called on
        var tree = this;

        //Perform error checking
        if (typeof $.fn.jstree != "function")
            throw new Error("jsTree must be installed for jsTree-bind to work!");
        if (template[0] instanceof Element === false)
            throw new Error("You need to pass in a valid jQuery selector or DOM element as the first element of jstreeBind()");
        if (template.length > 1)
            warn("You can only define one root element to bind to the jsTree. Additional elements ignored.");

        //Merge this configuration object with whatever the user has passed in
        var merged = $.extend(getDefaults(template), options);

        //Actually call jstree()
        tree.jstree(merged);

        //Observe the template for changes
        observe(template[0], tree.jstree(merged));
    };
}(jQuery));