/**
 * Created by Miguel on 26/01/2015.
 */
(function ($) {
    function treeNode(domNode) {

        //Default values
        this.children = true;
        this.state = {'opened': false, 'selected': false};

        //Add all data attributes
        for (key in domNode.attributes) {
            var sub = key.substr(0, 5);
            if (sub === "data-")
                this[sub] = domNode.attributes[key];
        }

        //Make sure it has text
        if ("text" in this === false)
            this.text = domNode.textContent;

    }

    $.fn.jstreeBind = function (target, options) {

        //Main variables
        var bind = $(target);
        var tree = this;
        options = options || {};

        //Perform error checking
        if (typeof $.jstree != "function")
            throw new Error("jsTree must be installed for jsTree-bind to work!");
        if (bind[0] instanceof Element === false)
            throw new Error("You need to pass in a valid jQuery selector or DOM element as the first element of jstreeBind()");

        var merged = $.extend({
            'core': {
                'data': function (obj, callback) {

                    var nodes;

                    //If it's the root node, use the top level nodes
                    if (!obj.parent)
                        nodes = bind;
                    //Otherwise use the child nodes of the current element
                    else
                        nodes = $(obj.original.node);

                    //Construct a treeNode out of each element and return it
                    callback(nodes.children().map(function (el) {
                        return new treeNode(el);
                    }));
                }
            }
        }, options);

        tree.jstree(merged);
    };
}(jQuery));