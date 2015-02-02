/**
 * Created by Miguel on 26/01/2015.
 */
(function ($) {
    //The current ID we're up to
    var id = 0;

    /**
     * Alerts the user to an issue without causing an error
     */
    var warn = function (msg) {
        if (console.warn)
            console.warn(msg);
        else
            console.log(msg);
    };

    /**
     * Creates a new tree node to be used in jsTree based on a DOM element
     */
    function treeNode(domNode) {

        var dNode = $(domNode);
        var tNode = this;

        //Store the ID of the corresponding node in our template node
        dNode.data("jstb", id);

        //Default values
        tNode.children = Boolean(dNode.children().length);
        tNode.state = {'opened': false, 'selected': false};
        tNode.node = domNode;
        tNode.id ="jstb" + id++;

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
        if (bind.length > 1)
            warn("You can only define one root element to bind to the jsTree. Additional elements ignored.");

        //Merge this configuration object with whatever the user has passed in
        var merged = $.extend({
            'core': {
                data: function (obj, callback) {

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


        //When the tree node is created, store its ID in the template node so we can access one from the other
        tree.jstree(merged);

        var instance = tree.jstree(merged);

        var observer = new MutationObserver(function (mutations) {

            //Map the mutation array into an array of depths
            var minDepth = Infinity;
            var depths = $.map(mutations, function (v, i) {

                //Only include the mutation if it's a new node added
                if (v.addedNodes.length <= 0)
                    return;

                var t = v.addedNodes[0].parentNode;

                //Work out the minimum depth
                var depth = $(t).parents().length;
                if (depth < minDepth)
                    minDepth = depth;

                //Return the mapped object
                return {
                    depth: depth,
                    node: t
                };
            });

            //Refresh the top level nodes
            $.each(depths, function (i, v) {
                if (v.depth <= minDepth)
                    //Get the corresponding node
                    instance.refresh_node("jstb" + $(v.node).data("jstb"));
            });
        });

        observer.observe(bind[0], {
            attributes: true,
            childList: true,
            characterData: true,
            subtree: true
        });
    };
}(jQuery));