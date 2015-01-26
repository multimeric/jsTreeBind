/**
 * Created by Miguel on 26/01/2015.
 */
(function ($) {
    function treeNode(domNode) {

        var tNode = this;

        //Default values
        tNode.children = true;
        tNode.state = {'opened': false, 'selected': false};
        tNode.node = domNode;

        //Add all data attributes
        $.each(domNode.attributes, function (i, attr) {
            var key = attr.nodeName;

            var sub = key.substr(0, 5);
            if (sub === "data-")
                tNode[key.substr(5)] = attr.value;
        });

        //Make sure it has text
        if ("text" in this === false)
            tNode.text = domNode.textContent;

    }

    $.fn.jstreeBind = function (target, options) {

        //Main variables
        var bind = $(target);
        var tree = this;
        options = options || {};

        //Perform error checking
        if (typeof $.fn.jstree != "function")
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

                    //Turn into array of children
                    nodes = $.makeArray(nodes.children());

                    //Construct a treeNode out of each element and return it
                    callback($.map(nodes, function (el) {
                        return new treeNode(el);
                    }));
                }
            }
        }, options);

        tree.jstree(merged);
    };
}(jQuery));