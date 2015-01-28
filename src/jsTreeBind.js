/**
 * Created by Miguel on 26/01/2015.
 */
(function ($) {
    function treeNode(domNode) {

        var dNode = $(domNode);
        var tNode = this;

        //Default values
        tNode.children = Boolean(dNode.children().length);
        tNode.state = {'opened': false, 'selected': false};
        tNode.node = domNode;

        //Add JSON data if present
        var extraJson = dNode.data("jstree");
        if (extraJson)
            $.extend(true, tNode, extraJson);

        //Add all data attributes except for the jstree attribute
        var extraAttrs = dNode.data();
        delete  extraAttrs.jstree;
        $.extend(true, tNode, extraAttrs);

        //Put all the state variables into the state property
        $.each(["opened", "selected", "disabled"], function (index, value) {
            if (value in tNode) {
                tNode.state[value] = tNode[value];
                delete tNode[value];
            }
        });

        //Make sure it has text
        var text = "";
        if ("text" in this === false) {
            $.each(domNode.childNodes, function (index, node) {
                if (node.nodeType === 3)
                    text += node.nodeValue;
            });
            tNode.text = text;
        }
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