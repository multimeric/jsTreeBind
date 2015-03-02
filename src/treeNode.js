/**
 * The ID to be used by the next created node
 */
var id = 0;

/**
 * Creates a new tree node to be used in jsTree based on a DOM element
 */
module.exports = function treeNode(domNode) {

    var dNode = $(domNode);
    var tNode = this;

    //Store the ID of the corresponding node in our template node
    dNode.data("jstb", id);

    //Default values
    tNode.children = Boolean(dNode.children().length);
    tNode.state = {'opened': false, 'selected': false};
    tNode.node = domNode;
    tNode.id = "jstb" + id++;

    //Add JSON data if present
    var extraJson = dNode.data("jstree");
    if (extraJson)
        $.extend(true, tNode, extraJson);

    //Add all data attributes except for the jstree attribute
    var extraAttrs = dNode.data();
    delete extraAttrs.jstree;
    $.extend(true, tNode, extraAttrs);

    //Put all the state variables into the state property
    $.each(["opened", "selected", "disabled"], function (index, value) {
        if (value in tNode) {
            tNode.state[value] = tNode[value];
            delete tNode[value];
        }
    });

    //Make sure it has text by checking for text nodes
    var text = "";
    if ("text" in this === false) {
        $.each(domNode.childNodes, function (index, node) {
            if (node.nodeType === 3)
                text += node.nodeValue;
        });
        tNode.text = text;
    }
};