var treeNode = require("./treeNode");

/**
 * Custom options to be passed into $().jsTree
 */
module.exports = function getDefaults(root) {
    return {
        'core': {
            data: function (obj, callback) {

                var nodes;

                //If it's the root node, use the top level nodes
                if (!obj.parent)
                    nodes = root;
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
    };
};