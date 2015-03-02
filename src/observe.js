/**
 * Creates a mutation observer that will automatically refresh the jstree if it detects DOM mutation
 * @param instance The jstree instance (NOT a DOM or jQuery element) to refresh as necessary
 * @returns {Window.MutationObserver}
 */
function getObserver(instance) {
    return new MutationObserver(function (mutations) {

        //Map the mutation array into an array of depths.
        $.each(mutations, function (i, v) {

            //Only include the mutation if it's a new node added
            if (v.addedNodes.length <= 0)
                return;

            var t = v.addedNodes[0].parentNode;
            instance.refresh_node("jstb" + $(t).data("jstb"));
        });

    });
}

/**
 * The observe options to pass into observe()
 */
var observeOptions = {
    attributes: true,
    childList: true,
    characterData: true,
    subtree: true
};

module.exports = function (node, jsTree) {
    getObserver(jsTree).observe(node, observeOptions);
};
