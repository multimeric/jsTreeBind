(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * @license
 * Copyright (c) 2014 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */
(function (global) {
    var registrationsTable = new WeakMap();
    var setImmediate;
// As much as we would like to use the native implementation, IE
// (all versions) suffers a rather annoying bug where it will drop or defer
// callbacks when heavy DOM operations are being performed concurrently.
//
// For a thorough discussion on this, see:
// http://codeforhire.com/2013/09/21/setimmediate-and-messagechannel-broken-on-internet-explorer-10/
    if (/Trident|Edge/.test(navigator.userAgent)) {
// Sadly, this bug also affects postMessage and MessageQueues.
//
// We would like to use the onreadystatechange hack for IE <= 10, but it is
// dangerous in the polyfilled environment due to requiring that the
// observed script element be in the document.
        setImmediate = setTimeout;
// If some other browser ever implements it, let's prefer their native
// implementation:
    } else if (window.setImmediate) {
        setImmediate = window.setImmediate;
// Otherwise, we fall back to postMessage as a means of emulating the next
// task semantics of setImmediate.
    } else {
        var setImmediateQueue = [];
        var sentinel = String(Math.random());
        window.addEventListener('message', function (e) {
            if (e.data === sentinel) {
                var queue = setImmediateQueue;
                setImmediateQueue = [];
                queue.forEach(function (func) {
                    func();
                });
            }
        });
        setImmediate = function (func) {
            setImmediateQueue.push(func);
            window.postMessage(sentinel, '*');
        };
    }
// This is used to ensure that we never schedule 2 callas to setImmediate
    var isScheduled = false;
// Keep track of observers that needs to be notified next time.
    var scheduledObservers = [];

    /**
     * Schedules |dispatchCallback| to be called in the future.
     * @param {MutationObserver} observer
     */
    function scheduleCallback(observer) {
        scheduledObservers.push(observer);
        if (!isScheduled) {
            isScheduled = true;
            setImmediate(dispatchCallbacks);
        }
    }

    function wrapIfNeeded(node) {
        return window.ShadowDOMPolyfill &&
            window.ShadowDOMPolyfill.wrapIfNeeded(node) ||
            node;
    }

    function dispatchCallbacks() {
// http://dom.spec.whatwg.org/#mutation-observers
        isScheduled = false; // Used to allow a new setImmediate call above.
        var observers = scheduledObservers;
        scheduledObservers = [];
// Sort observers based on their creation UID (incremental).
        observers.sort(function (o1, o2) {
            return o1.uid_ - o2.uid_;
        });
        var anyNonEmpty = false;
        observers.forEach(function (observer) {
// 2.1, 2.2
            var queue = observer.takeRecords();
// 2.3. Remove all transient registered observers whose observer is mo.
            removeTransientObserversFor(observer);
// 2.4
            if (queue.length) {
                observer.callback_(queue, observer);
                anyNonEmpty = true;
            }
        });
// 3.
        if (anyNonEmpty)
            dispatchCallbacks();
    }

    function removeTransientObserversFor(observer) {
        observer.nodes_.forEach(function (node) {
            var registrations = registrationsTable.get(node);
            if (!registrations)
                return;
            registrations.forEach(function (registration) {
                if (registration.observer === observer)
                    registration.removeTransientObservers();
            });
        });
    }

    /**
     * This function is used for the "For each registered observer observer (with
     * observer's options as options) in target's list of registered observers,
     * run these substeps:" and the "For each ancestor ancestor of target, and for
     * each registered observer observer (with options options) in ancestor's list
     * of registered observers, run these substeps:" part of the algorithms. The
     * |options.subtree| is checked to ensure that the callback is called
     * correctly.
     *
     * @param {Node} target
     * @param {function(MutationObserverInit):MutationRecord} callback
     */
    function forEachAncestorAndObserverEnqueueRecord(target, callback) {
        for (var node = target; node; node = node.parentNode) {
            var registrations = registrationsTable.get(node);
            if (registrations) {
                for (var j = 0; j < registrations.length; j++) {
                    var registration = registrations[j];
                    var options = registration.options;
// Only target ignores subtree.
                    if (node !== target && !options.subtree)
                        continue;
                    var record = callback(options);
                    if (record)
                        registration.enqueue(record);
                }
            }
        }
    }

    var uidCounter = 0;

    /**
     * The class that maps to the DOM MutationObserver interface.
     * @param {Function} callback.
     * @constructor
     */
    function JsMutationObserver(callback) {
        this.callback_ = callback;
        this.nodes_ = [];
        this.records_ = [];
        this.uid_ = ++uidCounter;
    }

    JsMutationObserver.prototype = {
        observe: function (target, options) {
            target = wrapIfNeeded(target);
// 1.1
            if (!options.childList && !options.attributes && !options.characterData ||
// 1.2
                options.attributeOldValue && !options.attributes ||
// 1.3
                options.attributeFilter && options.attributeFilter.length && !options.attributes ||
// 1.4
                options.characterDataOldValue && !options.characterData) {
                throw new SyntaxError();
            }
            var registrations = registrationsTable.get(target);
            if (!registrations)
                registrationsTable.set(target, registrations = []);
// 2
// If target's list of registered observers already includes a registered
// observer associated with the context object, replace that registered
// observer's options with options.
            var registration;
            for (var i = 0; i < registrations.length; i++) {
                if (registrations[i].observer === this) {
                    registration = registrations[i];
                    registration.removeListeners();
                    registration.options = options;
                    break;
                }
            }
// 3.
// Otherwise, add a new registered observer to target's list of registered
// observers with the context object as the observer and options as the
// options, and add target to context object's list of nodes on which it
// is registered.
            if (!registration) {
                registration = new Registration(this, target, options);
                registrations.push(registration);
                this.nodes_.push(target);
            }
            registration.addListeners();
        },
        disconnect: function () {
            this.nodes_.forEach(function (node) {
                var registrations = registrationsTable.get(node);
                for (var i = 0; i < registrations.length; i++) {
                    var registration = registrations[i];
                    if (registration.observer === this) {
                        registration.removeListeners();
                        registrations.splice(i, 1);
// Each node can only have one registered observer associated with
// this observer.
                        break;
                    }
                }
            }, this);
            this.records_ = [];
        },
        takeRecords: function () {
            var copyOfRecords = this.records_;
            this.records_ = [];
            return copyOfRecords;
        }
    };
    /**
     * @param {string} type
     * @param {Node} target
     * @constructor
     */
    function MutationRecord(type, target) {
        this.type = type;
        this.target = target;
        this.addedNodes = [];
        this.removedNodes = [];
        this.previousSibling = null;
        this.nextSibling = null;
        this.attributeName = null;
        this.attributeNamespace = null;
        this.oldValue = null;
    }

    function copyMutationRecord(original) {
        var record = new MutationRecord(original.type, original.target);
        record.addedNodes = original.addedNodes.slice();
        record.removedNodes = original.removedNodes.slice();
        record.previousSibling = original.previousSibling;
        record.nextSibling = original.nextSibling;
        record.attributeName = original.attributeName;
        record.attributeNamespace = original.attributeNamespace;
        record.oldValue = original.oldValue;
        return record;
    };
// We keep track of the two (possibly one) records used in a single mutation.
    var currentRecord, recordWithOldValue;

    /**
     * Creates a record without |oldValue| and caches it as |currentRecord| for
     * later use.
     * @param {string} oldValue
     * @return {MutationRecord}
     */
    function getRecord(type, target) {
        return currentRecord = new MutationRecord(type, target);
    }

    /**
     * Gets or creates a record with |oldValue| based in the |currentRecord|
     * @param {string} oldValue
     * @return {MutationRecord}
     */
    function getRecordWithOldValue(oldValue) {
        if (recordWithOldValue)
            return recordWithOldValue;
        recordWithOldValue = copyMutationRecord(currentRecord);
        recordWithOldValue.oldValue = oldValue;
        return recordWithOldValue;
    }

    function clearRecords() {
        currentRecord = recordWithOldValue = undefined;
    }

    /**
     * @param {MutationRecord} record
     * @return {boolean} Whether the record represents a record from the current
     * mutation event.
     */
    function recordRepresentsCurrentMutation(record) {
        return record === recordWithOldValue || record === currentRecord;
    }

    /**
     * Selects which record, if any, to replace the last record in the queue.
     * This returns |null| if no record should be replaced.
     *
     * @param {MutationRecord} lastRecord
     * @param {MutationRecord} newRecord
     * @param {MutationRecord}
     */
    function selectRecord(lastRecord, newRecord) {
        if (lastRecord === newRecord)
            return lastRecord;
// Check if the the record we are adding represents the same record. If
// so, we keep the one with the oldValue in it.
        if (recordWithOldValue && recordRepresentsCurrentMutation(lastRecord))
            return recordWithOldValue;
        return null;
    }

    /**
     * Class used to represent a registered observer.
     * @param {MutationObserver} observer
     * @param {Node} target
     * @param {MutationObserverInit} options
     * @constructor
     */
    function Registration(observer, target, options) {
        this.observer = observer;
        this.target = target;
        this.options = options;
        this.transientObservedNodes = [];
    }

    Registration.prototype = {
        enqueue: function (record) {
            var records = this.observer.records_;
            var length = records.length;
// There are cases where we replace the last record with the new record.
// For example if the record represents the same mutation we need to use
// the one with the oldValue. If we get same record (this can happen as we
// walk up the tree) we ignore the new record.
            if (records.length > 0) {
                var lastRecord = records[length - 1];
                var recordToReplaceLast = selectRecord(lastRecord, record);
                if (recordToReplaceLast) {
                    records[length - 1] = recordToReplaceLast;
                    return;
                }
            } else {
                scheduleCallback(this.observer);
            }
            records[length] = record;
        },
        addListeners: function () {
            this.addListeners_(this.target);
        },
        addListeners_: function (node) {
            var options = this.options;
            if (options.attributes)
                node.addEventListener('DOMAttrModified', this, true);
            if (options.characterData)
                node.addEventListener('DOMCharacterDataModified', this, true);
            if (options.childList)
                node.addEventListener('DOMNodeInserted', this, true);
            if (options.childList || options.subtree)
                node.addEventListener('DOMNodeRemoved', this, true);
        },
        removeListeners: function () {
            this.removeListeners_(this.target);
        },
        removeListeners_: function (node) {
            var options = this.options;
            if (options.attributes)
                node.removeEventListener('DOMAttrModified', this, true);
            if (options.characterData)
                node.removeEventListener('DOMCharacterDataModified', this, true);
            if (options.childList)
                node.removeEventListener('DOMNodeInserted', this, true);
            if (options.childList || options.subtree)
                node.removeEventListener('DOMNodeRemoved', this, true);
        },
        /**
         * Adds a transient observer on node. The transient observer gets removed
         * next time we deliver the change records.
         * @param {Node} node
         */
        addTransientObserver: function (node) {
// Don't add transient observers on the target itself. We already have all
// the required listeners set up on the target.
            if (node === this.target)
                return;
            this.addListeners_(node);
            this.transientObservedNodes.push(node);
            var registrations = registrationsTable.get(node);
            if (!registrations)
                registrationsTable.set(node, registrations = []);
// We know that registrations does not contain this because we already
// checked if node === this.target.
            registrations.push(this);
        },
        removeTransientObservers: function () {
            var transientObservedNodes = this.transientObservedNodes;
            this.transientObservedNodes = [];
            transientObservedNodes.forEach(function (node) {
// Transient observers are never added to the target.
                this.removeListeners_(node);
                var registrations = registrationsTable.get(node);
                for (var i = 0; i < registrations.length; i++) {
                    if (registrations[i] === this) {
                        registrations.splice(i, 1);
// Each node can only have one registered observer associated with
// this observer.
                        break;
                    }
                }
            }, this);
        },
        handleEvent: function (e) {
// Stop propagation since we are managing the propagation manually.
// This means that other mutation events on the page will not work
// correctly but that is by design.
            e.stopImmediatePropagation();
            switch (e.type) {
                case 'DOMAttrModified':
// http://dom.spec.whatwg.org/#concept-mo-queue-attributes
                    var name = e.attrName;
                    var namespace = e.relatedNode.namespaceURI;
                    var target = e.target;
// 1.
                    var record = new getRecord('attributes', target);
                    record.attributeName = name;
                    record.attributeNamespace = namespace;
// 2.
                    var oldValue =
                        e.attrChange === MutationEvent.ADDITION ? null : e.prevValue;
                    forEachAncestorAndObserverEnqueueRecord(target, function (options) {
// 3.1, 4.2
                        if (!options.attributes)
                            return;
// 3.2, 4.3
                        if (options.attributeFilter && options.attributeFilter.length &&
                            options.attributeFilter.indexOf(name) === -1 &&
                            options.attributeFilter.indexOf(namespace) === -1) {
                            return;
                        }
// 3.3, 4.4
                        if (options.attributeOldValue)
                            return getRecordWithOldValue(oldValue);
// 3.4, 4.5
                        return record;
                    });
                    break;
                case 'DOMCharacterDataModified':
// http://dom.spec.whatwg.org/#concept-mo-queue-characterdata
                    var target = e.target;
// 1.
                    var record = getRecord('characterData', target);
// 2.
                    var oldValue = e.prevValue;
                    forEachAncestorAndObserverEnqueueRecord(target, function (options) {
// 3.1, 4.2
                        if (!options.characterData)
                            return;
// 3.2, 4.3
                        if (options.characterDataOldValue)
                            return getRecordWithOldValue(oldValue);
// 3.3, 4.4
                        return record;
                    });
                    break;
                case 'DOMNodeRemoved':
                    this.addTransientObserver(e.target);
// Fall through.
                case 'DOMNodeInserted':
// http://dom.spec.whatwg.org/#concept-mo-queue-childlist
                    var target = e.relatedNode;
                    var changedNode = e.target;
                    var addedNodes, removedNodes;
                    if (e.type === 'DOMNodeInserted') {
                        addedNodes = [changedNode];
                        removedNodes = [];
                    } else {
                        addedNodes = [];
                        removedNodes = [changedNode];
                    }
                    var previousSibling = changedNode.previousSibling;
                    var nextSibling = changedNode.nextSibling;
// 1.
                    var record = getRecord('childList', target);
                    record.addedNodes = addedNodes;
                    record.removedNodes = removedNodes;
                    record.previousSibling = previousSibling;
                    record.nextSibling = nextSibling;
                    forEachAncestorAndObserverEnqueueRecord(target, function (options) {
// 2.1, 3.2
                        if (!options.childList)
                            return;
// 2.2, 3.3
                        return record;
                    });
            }
            clearRecords();
        }
    };
    global.JsMutationObserver = JsMutationObserver;
    if (!global.MutationObserver)
        global.MutationObserver = JsMutationObserver;
})(this);
},{}],2:[function(require,module,exports){
/**
 * @license
 * Copyright (c) 2014 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */
if (typeof WeakMap === 'undefined') {
    (function() {
        var defineProperty = Object.defineProperty;
        var counter = Date.now() % 1e9;
        var WeakMap = function() {
            this.name = '__st' + (Math.random() * 1e9 >>> 0) + (counter++ + '__');
        };
        WeakMap.prototype = {
            set: function(key, value) {
                var entry = key[this.name];
                if (entry && entry[0] === key)
                    entry[1] = value;
                else
                    defineProperty(key, this.name, {value: [key, value], writable: true});
                return this;
            },
            get: function(key) {
                var entry;
                return (entry = key[this.name]) && entry[0] === key ?
                    entry[1] : undefined;
            },
            delete: function(key) {
                var entry = key[this.name];
                if (!entry || entry[0] !== key) return false;
                entry[0] = entry[1] = undefined;
                return true;
            },
            has: function(key) {
                var entry = key[this.name];
                if (!entry) return false;
                return entry[0] === key;
            }
        };
        window.WeakMap = WeakMap;
    })();
}
},{}],3:[function(require,module,exports){
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
},{"./observe":4,"./options":5,"./warn":7}],4:[function(require,module,exports){
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

},{}],5:[function(require,module,exports){
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
},{"./treeNode":6}],6:[function(require,module,exports){
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
    delete  extraAttrs.jstree;
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
},{}],7:[function(require,module,exports){
/**
 * Alerts the user to an issue without causing an error
 */
module.exports = function warn(msg) {
    if (console.warn)
        console.warn(msg);
    else
        console.log(msg);
};
},{}]},{},[1,2,3])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlc1xcYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwic3JjL011dGF0aW9uT2JzZXJ2ZXIuanMiLCJzcmMvV2Vha01hcC5qcyIsInNyYy9qc1RyZWVCaW5kLmpzIiwic3JjL29ic2VydmUuanMiLCJzcmMvb3B0aW9ucy5qcyIsInNyYy90cmVlTm9kZS5qcyIsInNyYy93YXJuLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDemVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKipcclxuICogQGxpY2Vuc2VcclxuICogQ29weXJpZ2h0IChjKSAyMDE0IFRoZSBQb2x5bWVyIFByb2plY3QgQXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cclxuICogVGhpcyBjb2RlIG1heSBvbmx5IGJlIHVzZWQgdW5kZXIgdGhlIEJTRCBzdHlsZSBsaWNlbnNlIGZvdW5kIGF0IGh0dHA6Ly9wb2x5bWVyLmdpdGh1Yi5pby9MSUNFTlNFLnR4dFxyXG4gKiBUaGUgY29tcGxldGUgc2V0IG9mIGF1dGhvcnMgbWF5IGJlIGZvdW5kIGF0IGh0dHA6Ly9wb2x5bWVyLmdpdGh1Yi5pby9BVVRIT1JTLnR4dFxyXG4gKiBUaGUgY29tcGxldGUgc2V0IG9mIGNvbnRyaWJ1dG9ycyBtYXkgYmUgZm91bmQgYXQgaHR0cDovL3BvbHltZXIuZ2l0aHViLmlvL0NPTlRSSUJVVE9SUy50eHRcclxuICogQ29kZSBkaXN0cmlidXRlZCBieSBHb29nbGUgYXMgcGFydCBvZiB0aGUgcG9seW1lciBwcm9qZWN0IGlzIGFsc29cclxuICogc3ViamVjdCB0byBhbiBhZGRpdGlvbmFsIElQIHJpZ2h0cyBncmFudCBmb3VuZCBhdCBodHRwOi8vcG9seW1lci5naXRodWIuaW8vUEFURU5UUy50eHRcclxuICovXHJcbihmdW5jdGlvbiAoZ2xvYmFsKSB7XHJcbiAgICB2YXIgcmVnaXN0cmF0aW9uc1RhYmxlID0gbmV3IFdlYWtNYXAoKTtcclxuICAgIHZhciBzZXRJbW1lZGlhdGU7XHJcbi8vIEFzIG11Y2ggYXMgd2Ugd291bGQgbGlrZSB0byB1c2UgdGhlIG5hdGl2ZSBpbXBsZW1lbnRhdGlvbiwgSUVcclxuLy8gKGFsbCB2ZXJzaW9ucykgc3VmZmVycyBhIHJhdGhlciBhbm5veWluZyBidWcgd2hlcmUgaXQgd2lsbCBkcm9wIG9yIGRlZmVyXHJcbi8vIGNhbGxiYWNrcyB3aGVuIGhlYXZ5IERPTSBvcGVyYXRpb25zIGFyZSBiZWluZyBwZXJmb3JtZWQgY29uY3VycmVudGx5LlxyXG4vL1xyXG4vLyBGb3IgYSB0aG9yb3VnaCBkaXNjdXNzaW9uIG9uIHRoaXMsIHNlZTpcclxuLy8gaHR0cDovL2NvZGVmb3JoaXJlLmNvbS8yMDEzLzA5LzIxL3NldGltbWVkaWF0ZS1hbmQtbWVzc2FnZWNoYW5uZWwtYnJva2VuLW9uLWludGVybmV0LWV4cGxvcmVyLTEwL1xyXG4gICAgaWYgKC9UcmlkZW50fEVkZ2UvLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkpIHtcclxuLy8gU2FkbHksIHRoaXMgYnVnIGFsc28gYWZmZWN0cyBwb3N0TWVzc2FnZSBhbmQgTWVzc2FnZVF1ZXVlcy5cclxuLy9cclxuLy8gV2Ugd291bGQgbGlrZSB0byB1c2UgdGhlIG9ucmVhZHlzdGF0ZWNoYW5nZSBoYWNrIGZvciBJRSA8PSAxMCwgYnV0IGl0IGlzXHJcbi8vIGRhbmdlcm91cyBpbiB0aGUgcG9seWZpbGxlZCBlbnZpcm9ubWVudCBkdWUgdG8gcmVxdWlyaW5nIHRoYXQgdGhlXHJcbi8vIG9ic2VydmVkIHNjcmlwdCBlbGVtZW50IGJlIGluIHRoZSBkb2N1bWVudC5cclxuICAgICAgICBzZXRJbW1lZGlhdGUgPSBzZXRUaW1lb3V0O1xyXG4vLyBJZiBzb21lIG90aGVyIGJyb3dzZXIgZXZlciBpbXBsZW1lbnRzIGl0LCBsZXQncyBwcmVmZXIgdGhlaXIgbmF0aXZlXHJcbi8vIGltcGxlbWVudGF0aW9uOlxyXG4gICAgfSBlbHNlIGlmICh3aW5kb3cuc2V0SW1tZWRpYXRlKSB7XHJcbiAgICAgICAgc2V0SW1tZWRpYXRlID0gd2luZG93LnNldEltbWVkaWF0ZTtcclxuLy8gT3RoZXJ3aXNlLCB3ZSBmYWxsIGJhY2sgdG8gcG9zdE1lc3NhZ2UgYXMgYSBtZWFucyBvZiBlbXVsYXRpbmcgdGhlIG5leHRcclxuLy8gdGFzayBzZW1hbnRpY3Mgb2Ygc2V0SW1tZWRpYXRlLlxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICB2YXIgc2V0SW1tZWRpYXRlUXVldWUgPSBbXTtcclxuICAgICAgICB2YXIgc2VudGluZWwgPSBTdHJpbmcoTWF0aC5yYW5kb20oKSk7XHJcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgICAgICBpZiAoZS5kYXRhID09PSBzZW50aW5lbCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHF1ZXVlID0gc2V0SW1tZWRpYXRlUXVldWU7XHJcbiAgICAgICAgICAgICAgICBzZXRJbW1lZGlhdGVRdWV1ZSA9IFtdO1xyXG4gICAgICAgICAgICAgICAgcXVldWUuZm9yRWFjaChmdW5jdGlvbiAoZnVuYykge1xyXG4gICAgICAgICAgICAgICAgICAgIGZ1bmMoKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgc2V0SW1tZWRpYXRlID0gZnVuY3Rpb24gKGZ1bmMpIHtcclxuICAgICAgICAgICAgc2V0SW1tZWRpYXRlUXVldWUucHVzaChmdW5jKTtcclxuICAgICAgICAgICAgd2luZG93LnBvc3RNZXNzYWdlKHNlbnRpbmVsLCAnKicpO1xyXG4gICAgICAgIH07XHJcbiAgICB9XHJcbi8vIFRoaXMgaXMgdXNlZCB0byBlbnN1cmUgdGhhdCB3ZSBuZXZlciBzY2hlZHVsZSAyIGNhbGxhcyB0byBzZXRJbW1lZGlhdGVcclxuICAgIHZhciBpc1NjaGVkdWxlZCA9IGZhbHNlO1xyXG4vLyBLZWVwIHRyYWNrIG9mIG9ic2VydmVycyB0aGF0IG5lZWRzIHRvIGJlIG5vdGlmaWVkIG5leHQgdGltZS5cclxuICAgIHZhciBzY2hlZHVsZWRPYnNlcnZlcnMgPSBbXTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFNjaGVkdWxlcyB8ZGlzcGF0Y2hDYWxsYmFja3wgdG8gYmUgY2FsbGVkIGluIHRoZSBmdXR1cmUuXHJcbiAgICAgKiBAcGFyYW0ge011dGF0aW9uT2JzZXJ2ZXJ9IG9ic2VydmVyXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIHNjaGVkdWxlQ2FsbGJhY2sob2JzZXJ2ZXIpIHtcclxuICAgICAgICBzY2hlZHVsZWRPYnNlcnZlcnMucHVzaChvYnNlcnZlcik7XHJcbiAgICAgICAgaWYgKCFpc1NjaGVkdWxlZCkge1xyXG4gICAgICAgICAgICBpc1NjaGVkdWxlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIHNldEltbWVkaWF0ZShkaXNwYXRjaENhbGxiYWNrcyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHdyYXBJZk5lZWRlZChub2RlKSB7XHJcbiAgICAgICAgcmV0dXJuIHdpbmRvdy5TaGFkb3dET01Qb2x5ZmlsbCAmJlxyXG4gICAgICAgICAgICB3aW5kb3cuU2hhZG93RE9NUG9seWZpbGwud3JhcElmTmVlZGVkKG5vZGUpIHx8XHJcbiAgICAgICAgICAgIG5vZGU7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZGlzcGF0Y2hDYWxsYmFja3MoKSB7XHJcbi8vIGh0dHA6Ly9kb20uc3BlYy53aGF0d2cub3JnLyNtdXRhdGlvbi1vYnNlcnZlcnNcclxuICAgICAgICBpc1NjaGVkdWxlZCA9IGZhbHNlOyAvLyBVc2VkIHRvIGFsbG93IGEgbmV3IHNldEltbWVkaWF0ZSBjYWxsIGFib3ZlLlxyXG4gICAgICAgIHZhciBvYnNlcnZlcnMgPSBzY2hlZHVsZWRPYnNlcnZlcnM7XHJcbiAgICAgICAgc2NoZWR1bGVkT2JzZXJ2ZXJzID0gW107XHJcbi8vIFNvcnQgb2JzZXJ2ZXJzIGJhc2VkIG9uIHRoZWlyIGNyZWF0aW9uIFVJRCAoaW5jcmVtZW50YWwpLlxyXG4gICAgICAgIG9ic2VydmVycy5zb3J0KGZ1bmN0aW9uIChvMSwgbzIpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG8xLnVpZF8gLSBvMi51aWRfO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHZhciBhbnlOb25FbXB0eSA9IGZhbHNlO1xyXG4gICAgICAgIG9ic2VydmVycy5mb3JFYWNoKGZ1bmN0aW9uIChvYnNlcnZlcikge1xyXG4vLyAyLjEsIDIuMlxyXG4gICAgICAgICAgICB2YXIgcXVldWUgPSBvYnNlcnZlci50YWtlUmVjb3JkcygpO1xyXG4vLyAyLjMuIFJlbW92ZSBhbGwgdHJhbnNpZW50IHJlZ2lzdGVyZWQgb2JzZXJ2ZXJzIHdob3NlIG9ic2VydmVyIGlzIG1vLlxyXG4gICAgICAgICAgICByZW1vdmVUcmFuc2llbnRPYnNlcnZlcnNGb3Iob2JzZXJ2ZXIpO1xyXG4vLyAyLjRcclxuICAgICAgICAgICAgaWYgKHF1ZXVlLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgb2JzZXJ2ZXIuY2FsbGJhY2tfKHF1ZXVlLCBvYnNlcnZlcik7XHJcbiAgICAgICAgICAgICAgICBhbnlOb25FbXB0eSA9IHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuLy8gMy5cclxuICAgICAgICBpZiAoYW55Tm9uRW1wdHkpXHJcbiAgICAgICAgICAgIGRpc3BhdGNoQ2FsbGJhY2tzKCk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gcmVtb3ZlVHJhbnNpZW50T2JzZXJ2ZXJzRm9yKG9ic2VydmVyKSB7XHJcbiAgICAgICAgb2JzZXJ2ZXIubm9kZXNfLmZvckVhY2goZnVuY3Rpb24gKG5vZGUpIHtcclxuICAgICAgICAgICAgdmFyIHJlZ2lzdHJhdGlvbnMgPSByZWdpc3RyYXRpb25zVGFibGUuZ2V0KG5vZGUpO1xyXG4gICAgICAgICAgICBpZiAoIXJlZ2lzdHJhdGlvbnMpXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIHJlZ2lzdHJhdGlvbnMuZm9yRWFjaChmdW5jdGlvbiAocmVnaXN0cmF0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAocmVnaXN0cmF0aW9uLm9ic2VydmVyID09PSBvYnNlcnZlcilcclxuICAgICAgICAgICAgICAgICAgICByZWdpc3RyYXRpb24ucmVtb3ZlVHJhbnNpZW50T2JzZXJ2ZXJzKCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhpcyBmdW5jdGlvbiBpcyB1c2VkIGZvciB0aGUgXCJGb3IgZWFjaCByZWdpc3RlcmVkIG9ic2VydmVyIG9ic2VydmVyICh3aXRoXHJcbiAgICAgKiBvYnNlcnZlcidzIG9wdGlvbnMgYXMgb3B0aW9ucykgaW4gdGFyZ2V0J3MgbGlzdCBvZiByZWdpc3RlcmVkIG9ic2VydmVycyxcclxuICAgICAqIHJ1biB0aGVzZSBzdWJzdGVwczpcIiBhbmQgdGhlIFwiRm9yIGVhY2ggYW5jZXN0b3IgYW5jZXN0b3Igb2YgdGFyZ2V0LCBhbmQgZm9yXHJcbiAgICAgKiBlYWNoIHJlZ2lzdGVyZWQgb2JzZXJ2ZXIgb2JzZXJ2ZXIgKHdpdGggb3B0aW9ucyBvcHRpb25zKSBpbiBhbmNlc3RvcidzIGxpc3RcclxuICAgICAqIG9mIHJlZ2lzdGVyZWQgb2JzZXJ2ZXJzLCBydW4gdGhlc2Ugc3Vic3RlcHM6XCIgcGFydCBvZiB0aGUgYWxnb3JpdGhtcy4gVGhlXHJcbiAgICAgKiB8b3B0aW9ucy5zdWJ0cmVlfCBpcyBjaGVja2VkIHRvIGVuc3VyZSB0aGF0IHRoZSBjYWxsYmFjayBpcyBjYWxsZWRcclxuICAgICAqIGNvcnJlY3RseS5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge05vZGV9IHRhcmdldFxyXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbihNdXRhdGlvbk9ic2VydmVySW5pdCk6TXV0YXRpb25SZWNvcmR9IGNhbGxiYWNrXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIGZvckVhY2hBbmNlc3RvckFuZE9ic2VydmVyRW5xdWV1ZVJlY29yZCh0YXJnZXQsIGNhbGxiYWNrKSB7XHJcbiAgICAgICAgZm9yICh2YXIgbm9kZSA9IHRhcmdldDsgbm9kZTsgbm9kZSA9IG5vZGUucGFyZW50Tm9kZSkge1xyXG4gICAgICAgICAgICB2YXIgcmVnaXN0cmF0aW9ucyA9IHJlZ2lzdHJhdGlvbnNUYWJsZS5nZXQobm9kZSk7XHJcbiAgICAgICAgICAgIGlmIChyZWdpc3RyYXRpb25zKSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHJlZ2lzdHJhdGlvbnMubGVuZ3RoOyBqKyspIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcmVnaXN0cmF0aW9uID0gcmVnaXN0cmF0aW9uc1tqXTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgb3B0aW9ucyA9IHJlZ2lzdHJhdGlvbi5vcHRpb25zO1xyXG4vLyBPbmx5IHRhcmdldCBpZ25vcmVzIHN1YnRyZWUuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5vZGUgIT09IHRhcmdldCAmJiAhb3B0aW9ucy5zdWJ0cmVlKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcmVjb3JkID0gY2FsbGJhY2sob3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlY29yZClcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVnaXN0cmF0aW9uLmVucXVldWUocmVjb3JkKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICB2YXIgdWlkQ291bnRlciA9IDA7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgY2xhc3MgdGhhdCBtYXBzIHRvIHRoZSBET00gTXV0YXRpb25PYnNlcnZlciBpbnRlcmZhY2UuXHJcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjay5cclxuICAgICAqIEBjb25zdHJ1Y3RvclxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBKc011dGF0aW9uT2JzZXJ2ZXIoY2FsbGJhY2spIHtcclxuICAgICAgICB0aGlzLmNhbGxiYWNrXyA9IGNhbGxiYWNrO1xyXG4gICAgICAgIHRoaXMubm9kZXNfID0gW107XHJcbiAgICAgICAgdGhpcy5yZWNvcmRzXyA9IFtdO1xyXG4gICAgICAgIHRoaXMudWlkXyA9ICsrdWlkQ291bnRlcjtcclxuICAgIH1cclxuXHJcbiAgICBKc011dGF0aW9uT2JzZXJ2ZXIucHJvdG90eXBlID0ge1xyXG4gICAgICAgIG9ic2VydmU6IGZ1bmN0aW9uICh0YXJnZXQsIG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgdGFyZ2V0ID0gd3JhcElmTmVlZGVkKHRhcmdldCk7XHJcbi8vIDEuMVxyXG4gICAgICAgICAgICBpZiAoIW9wdGlvbnMuY2hpbGRMaXN0ICYmICFvcHRpb25zLmF0dHJpYnV0ZXMgJiYgIW9wdGlvbnMuY2hhcmFjdGVyRGF0YSB8fFxyXG4vLyAxLjJcclxuICAgICAgICAgICAgICAgIG9wdGlvbnMuYXR0cmlidXRlT2xkVmFsdWUgJiYgIW9wdGlvbnMuYXR0cmlidXRlcyB8fFxyXG4vLyAxLjNcclxuICAgICAgICAgICAgICAgIG9wdGlvbnMuYXR0cmlidXRlRmlsdGVyICYmIG9wdGlvbnMuYXR0cmlidXRlRmlsdGVyLmxlbmd0aCAmJiAhb3B0aW9ucy5hdHRyaWJ1dGVzIHx8XHJcbi8vIDEuNFxyXG4gICAgICAgICAgICAgICAgb3B0aW9ucy5jaGFyYWN0ZXJEYXRhT2xkVmFsdWUgJiYgIW9wdGlvbnMuY2hhcmFjdGVyRGF0YSkge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFN5bnRheEVycm9yKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdmFyIHJlZ2lzdHJhdGlvbnMgPSByZWdpc3RyYXRpb25zVGFibGUuZ2V0KHRhcmdldCk7XHJcbiAgICAgICAgICAgIGlmICghcmVnaXN0cmF0aW9ucylcclxuICAgICAgICAgICAgICAgIHJlZ2lzdHJhdGlvbnNUYWJsZS5zZXQodGFyZ2V0LCByZWdpc3RyYXRpb25zID0gW10pO1xyXG4vLyAyXHJcbi8vIElmIHRhcmdldCdzIGxpc3Qgb2YgcmVnaXN0ZXJlZCBvYnNlcnZlcnMgYWxyZWFkeSBpbmNsdWRlcyBhIHJlZ2lzdGVyZWRcclxuLy8gb2JzZXJ2ZXIgYXNzb2NpYXRlZCB3aXRoIHRoZSBjb250ZXh0IG9iamVjdCwgcmVwbGFjZSB0aGF0IHJlZ2lzdGVyZWRcclxuLy8gb2JzZXJ2ZXIncyBvcHRpb25zIHdpdGggb3B0aW9ucy5cclxuICAgICAgICAgICAgdmFyIHJlZ2lzdHJhdGlvbjtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZWdpc3RyYXRpb25zLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAocmVnaXN0cmF0aW9uc1tpXS5vYnNlcnZlciA9PT0gdGhpcykge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlZ2lzdHJhdGlvbiA9IHJlZ2lzdHJhdGlvbnNbaV07XHJcbiAgICAgICAgICAgICAgICAgICAgcmVnaXN0cmF0aW9uLnJlbW92ZUxpc3RlbmVycygpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlZ2lzdHJhdGlvbi5vcHRpb25zID0gb3B0aW9ucztcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4vLyAzLlxyXG4vLyBPdGhlcndpc2UsIGFkZCBhIG5ldyByZWdpc3RlcmVkIG9ic2VydmVyIHRvIHRhcmdldCdzIGxpc3Qgb2YgcmVnaXN0ZXJlZFxyXG4vLyBvYnNlcnZlcnMgd2l0aCB0aGUgY29udGV4dCBvYmplY3QgYXMgdGhlIG9ic2VydmVyIGFuZCBvcHRpb25zIGFzIHRoZVxyXG4vLyBvcHRpb25zLCBhbmQgYWRkIHRhcmdldCB0byBjb250ZXh0IG9iamVjdCdzIGxpc3Qgb2Ygbm9kZXMgb24gd2hpY2ggaXRcclxuLy8gaXMgcmVnaXN0ZXJlZC5cclxuICAgICAgICAgICAgaWYgKCFyZWdpc3RyYXRpb24pIHtcclxuICAgICAgICAgICAgICAgIHJlZ2lzdHJhdGlvbiA9IG5ldyBSZWdpc3RyYXRpb24odGhpcywgdGFyZ2V0LCBvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgIHJlZ2lzdHJhdGlvbnMucHVzaChyZWdpc3RyYXRpb24pO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5ub2Rlc18ucHVzaCh0YXJnZXQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJlZ2lzdHJhdGlvbi5hZGRMaXN0ZW5lcnMoKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGRpc2Nvbm5lY3Q6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdGhpcy5ub2Rlc18uZm9yRWFjaChmdW5jdGlvbiAobm9kZSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHJlZ2lzdHJhdGlvbnMgPSByZWdpc3RyYXRpb25zVGFibGUuZ2V0KG5vZGUpO1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZWdpc3RyYXRpb25zLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJlZ2lzdHJhdGlvbiA9IHJlZ2lzdHJhdGlvbnNbaV07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlZ2lzdHJhdGlvbi5vYnNlcnZlciA9PT0gdGhpcykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZWdpc3RyYXRpb24ucmVtb3ZlTGlzdGVuZXJzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlZ2lzdHJhdGlvbnMuc3BsaWNlKGksIDEpO1xyXG4vLyBFYWNoIG5vZGUgY2FuIG9ubHkgaGF2ZSBvbmUgcmVnaXN0ZXJlZCBvYnNlcnZlciBhc3NvY2lhdGVkIHdpdGhcclxuLy8gdGhpcyBvYnNlcnZlci5cclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LCB0aGlzKTtcclxuICAgICAgICAgICAgdGhpcy5yZWNvcmRzXyA9IFtdO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgdGFrZVJlY29yZHM6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIGNvcHlPZlJlY29yZHMgPSB0aGlzLnJlY29yZHNfO1xyXG4gICAgICAgICAgICB0aGlzLnJlY29yZHNfID0gW107XHJcbiAgICAgICAgICAgIHJldHVybiBjb3B5T2ZSZWNvcmRzO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbiAgICAvKipcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlXHJcbiAgICAgKiBAcGFyYW0ge05vZGV9IHRhcmdldFxyXG4gICAgICogQGNvbnN0cnVjdG9yXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIE11dGF0aW9uUmVjb3JkKHR5cGUsIHRhcmdldCkge1xyXG4gICAgICAgIHRoaXMudHlwZSA9IHR5cGU7XHJcbiAgICAgICAgdGhpcy50YXJnZXQgPSB0YXJnZXQ7XHJcbiAgICAgICAgdGhpcy5hZGRlZE5vZGVzID0gW107XHJcbiAgICAgICAgdGhpcy5yZW1vdmVkTm9kZXMgPSBbXTtcclxuICAgICAgICB0aGlzLnByZXZpb3VzU2libGluZyA9IG51bGw7XHJcbiAgICAgICAgdGhpcy5uZXh0U2libGluZyA9IG51bGw7XHJcbiAgICAgICAgdGhpcy5hdHRyaWJ1dGVOYW1lID0gbnVsbDtcclxuICAgICAgICB0aGlzLmF0dHJpYnV0ZU5hbWVzcGFjZSA9IG51bGw7XHJcbiAgICAgICAgdGhpcy5vbGRWYWx1ZSA9IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gY29weU11dGF0aW9uUmVjb3JkKG9yaWdpbmFsKSB7XHJcbiAgICAgICAgdmFyIHJlY29yZCA9IG5ldyBNdXRhdGlvblJlY29yZChvcmlnaW5hbC50eXBlLCBvcmlnaW5hbC50YXJnZXQpO1xyXG4gICAgICAgIHJlY29yZC5hZGRlZE5vZGVzID0gb3JpZ2luYWwuYWRkZWROb2Rlcy5zbGljZSgpO1xyXG4gICAgICAgIHJlY29yZC5yZW1vdmVkTm9kZXMgPSBvcmlnaW5hbC5yZW1vdmVkTm9kZXMuc2xpY2UoKTtcclxuICAgICAgICByZWNvcmQucHJldmlvdXNTaWJsaW5nID0gb3JpZ2luYWwucHJldmlvdXNTaWJsaW5nO1xyXG4gICAgICAgIHJlY29yZC5uZXh0U2libGluZyA9IG9yaWdpbmFsLm5leHRTaWJsaW5nO1xyXG4gICAgICAgIHJlY29yZC5hdHRyaWJ1dGVOYW1lID0gb3JpZ2luYWwuYXR0cmlidXRlTmFtZTtcclxuICAgICAgICByZWNvcmQuYXR0cmlidXRlTmFtZXNwYWNlID0gb3JpZ2luYWwuYXR0cmlidXRlTmFtZXNwYWNlO1xyXG4gICAgICAgIHJlY29yZC5vbGRWYWx1ZSA9IG9yaWdpbmFsLm9sZFZhbHVlO1xyXG4gICAgICAgIHJldHVybiByZWNvcmQ7XHJcbiAgICB9O1xyXG4vLyBXZSBrZWVwIHRyYWNrIG9mIHRoZSB0d28gKHBvc3NpYmx5IG9uZSkgcmVjb3JkcyB1c2VkIGluIGEgc2luZ2xlIG11dGF0aW9uLlxyXG4gICAgdmFyIGN1cnJlbnRSZWNvcmQsIHJlY29yZFdpdGhPbGRWYWx1ZTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIENyZWF0ZXMgYSByZWNvcmQgd2l0aG91dCB8b2xkVmFsdWV8IGFuZCBjYWNoZXMgaXQgYXMgfGN1cnJlbnRSZWNvcmR8IGZvclxyXG4gICAgICogbGF0ZXIgdXNlLlxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG9sZFZhbHVlXHJcbiAgICAgKiBAcmV0dXJuIHtNdXRhdGlvblJlY29yZH1cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gZ2V0UmVjb3JkKHR5cGUsIHRhcmdldCkge1xyXG4gICAgICAgIHJldHVybiBjdXJyZW50UmVjb3JkID0gbmV3IE11dGF0aW9uUmVjb3JkKHR5cGUsIHRhcmdldCk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBHZXRzIG9yIGNyZWF0ZXMgYSByZWNvcmQgd2l0aCB8b2xkVmFsdWV8IGJhc2VkIGluIHRoZSB8Y3VycmVudFJlY29yZHxcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBvbGRWYWx1ZVxyXG4gICAgICogQHJldHVybiB7TXV0YXRpb25SZWNvcmR9XHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIGdldFJlY29yZFdpdGhPbGRWYWx1ZShvbGRWYWx1ZSkge1xyXG4gICAgICAgIGlmIChyZWNvcmRXaXRoT2xkVmFsdWUpXHJcbiAgICAgICAgICAgIHJldHVybiByZWNvcmRXaXRoT2xkVmFsdWU7XHJcbiAgICAgICAgcmVjb3JkV2l0aE9sZFZhbHVlID0gY29weU11dGF0aW9uUmVjb3JkKGN1cnJlbnRSZWNvcmQpO1xyXG4gICAgICAgIHJlY29yZFdpdGhPbGRWYWx1ZS5vbGRWYWx1ZSA9IG9sZFZhbHVlO1xyXG4gICAgICAgIHJldHVybiByZWNvcmRXaXRoT2xkVmFsdWU7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gY2xlYXJSZWNvcmRzKCkge1xyXG4gICAgICAgIGN1cnJlbnRSZWNvcmQgPSByZWNvcmRXaXRoT2xkVmFsdWUgPSB1bmRlZmluZWQ7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAcGFyYW0ge011dGF0aW9uUmVjb3JkfSByZWNvcmRcclxuICAgICAqIEByZXR1cm4ge2Jvb2xlYW59IFdoZXRoZXIgdGhlIHJlY29yZCByZXByZXNlbnRzIGEgcmVjb3JkIGZyb20gdGhlIGN1cnJlbnRcclxuICAgICAqIG11dGF0aW9uIGV2ZW50LlxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiByZWNvcmRSZXByZXNlbnRzQ3VycmVudE11dGF0aW9uKHJlY29yZCkge1xyXG4gICAgICAgIHJldHVybiByZWNvcmQgPT09IHJlY29yZFdpdGhPbGRWYWx1ZSB8fCByZWNvcmQgPT09IGN1cnJlbnRSZWNvcmQ7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTZWxlY3RzIHdoaWNoIHJlY29yZCwgaWYgYW55LCB0byByZXBsYWNlIHRoZSBsYXN0IHJlY29yZCBpbiB0aGUgcXVldWUuXHJcbiAgICAgKiBUaGlzIHJldHVybnMgfG51bGx8IGlmIG5vIHJlY29yZCBzaG91bGQgYmUgcmVwbGFjZWQuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtNdXRhdGlvblJlY29yZH0gbGFzdFJlY29yZFxyXG4gICAgICogQHBhcmFtIHtNdXRhdGlvblJlY29yZH0gbmV3UmVjb3JkXHJcbiAgICAgKiBAcGFyYW0ge011dGF0aW9uUmVjb3JkfVxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBzZWxlY3RSZWNvcmQobGFzdFJlY29yZCwgbmV3UmVjb3JkKSB7XHJcbiAgICAgICAgaWYgKGxhc3RSZWNvcmQgPT09IG5ld1JlY29yZClcclxuICAgICAgICAgICAgcmV0dXJuIGxhc3RSZWNvcmQ7XHJcbi8vIENoZWNrIGlmIHRoZSB0aGUgcmVjb3JkIHdlIGFyZSBhZGRpbmcgcmVwcmVzZW50cyB0aGUgc2FtZSByZWNvcmQuIElmXHJcbi8vIHNvLCB3ZSBrZWVwIHRoZSBvbmUgd2l0aCB0aGUgb2xkVmFsdWUgaW4gaXQuXHJcbiAgICAgICAgaWYgKHJlY29yZFdpdGhPbGRWYWx1ZSAmJiByZWNvcmRSZXByZXNlbnRzQ3VycmVudE11dGF0aW9uKGxhc3RSZWNvcmQpKVxyXG4gICAgICAgICAgICByZXR1cm4gcmVjb3JkV2l0aE9sZFZhbHVlO1xyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ2xhc3MgdXNlZCB0byByZXByZXNlbnQgYSByZWdpc3RlcmVkIG9ic2VydmVyLlxyXG4gICAgICogQHBhcmFtIHtNdXRhdGlvbk9ic2VydmVyfSBvYnNlcnZlclxyXG4gICAgICogQHBhcmFtIHtOb2RlfSB0YXJnZXRcclxuICAgICAqIEBwYXJhbSB7TXV0YXRpb25PYnNlcnZlckluaXR9IG9wdGlvbnNcclxuICAgICAqIEBjb25zdHJ1Y3RvclxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBSZWdpc3RyYXRpb24ob2JzZXJ2ZXIsIHRhcmdldCwgb3B0aW9ucykge1xyXG4gICAgICAgIHRoaXMub2JzZXJ2ZXIgPSBvYnNlcnZlcjtcclxuICAgICAgICB0aGlzLnRhcmdldCA9IHRhcmdldDtcclxuICAgICAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xyXG4gICAgICAgIHRoaXMudHJhbnNpZW50T2JzZXJ2ZWROb2RlcyA9IFtdO1xyXG4gICAgfVxyXG5cclxuICAgIFJlZ2lzdHJhdGlvbi5wcm90b3R5cGUgPSB7XHJcbiAgICAgICAgZW5xdWV1ZTogZnVuY3Rpb24gKHJlY29yZCkge1xyXG4gICAgICAgICAgICB2YXIgcmVjb3JkcyA9IHRoaXMub2JzZXJ2ZXIucmVjb3Jkc187XHJcbiAgICAgICAgICAgIHZhciBsZW5ndGggPSByZWNvcmRzLmxlbmd0aDtcclxuLy8gVGhlcmUgYXJlIGNhc2VzIHdoZXJlIHdlIHJlcGxhY2UgdGhlIGxhc3QgcmVjb3JkIHdpdGggdGhlIG5ldyByZWNvcmQuXHJcbi8vIEZvciBleGFtcGxlIGlmIHRoZSByZWNvcmQgcmVwcmVzZW50cyB0aGUgc2FtZSBtdXRhdGlvbiB3ZSBuZWVkIHRvIHVzZVxyXG4vLyB0aGUgb25lIHdpdGggdGhlIG9sZFZhbHVlLiBJZiB3ZSBnZXQgc2FtZSByZWNvcmQgKHRoaXMgY2FuIGhhcHBlbiBhcyB3ZVxyXG4vLyB3YWxrIHVwIHRoZSB0cmVlKSB3ZSBpZ25vcmUgdGhlIG5ldyByZWNvcmQuXHJcbiAgICAgICAgICAgIGlmIChyZWNvcmRzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgIHZhciBsYXN0UmVjb3JkID0gcmVjb3Jkc1tsZW5ndGggLSAxXTtcclxuICAgICAgICAgICAgICAgIHZhciByZWNvcmRUb1JlcGxhY2VMYXN0ID0gc2VsZWN0UmVjb3JkKGxhc3RSZWNvcmQsIHJlY29yZCk7XHJcbiAgICAgICAgICAgICAgICBpZiAocmVjb3JkVG9SZXBsYWNlTGFzdCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlY29yZHNbbGVuZ3RoIC0gMV0gPSByZWNvcmRUb1JlcGxhY2VMYXN0O1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHNjaGVkdWxlQ2FsbGJhY2sodGhpcy5vYnNlcnZlcik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmVjb3Jkc1tsZW5ndGhdID0gcmVjb3JkO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYWRkTGlzdGVuZXJzOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHRoaXMuYWRkTGlzdGVuZXJzXyh0aGlzLnRhcmdldCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBhZGRMaXN0ZW5lcnNfOiBmdW5jdGlvbiAobm9kZSkge1xyXG4gICAgICAgICAgICB2YXIgb3B0aW9ucyA9IHRoaXMub3B0aW9ucztcclxuICAgICAgICAgICAgaWYgKG9wdGlvbnMuYXR0cmlidXRlcylcclxuICAgICAgICAgICAgICAgIG5vZGUuYWRkRXZlbnRMaXN0ZW5lcignRE9NQXR0ck1vZGlmaWVkJywgdGhpcywgdHJ1ZSk7XHJcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmNoYXJhY3RlckRhdGEpXHJcbiAgICAgICAgICAgICAgICBub2RlLmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNoYXJhY3RlckRhdGFNb2RpZmllZCcsIHRoaXMsIHRydWUpO1xyXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5jaGlsZExpc3QpXHJcbiAgICAgICAgICAgICAgICBub2RlLmFkZEV2ZW50TGlzdGVuZXIoJ0RPTU5vZGVJbnNlcnRlZCcsIHRoaXMsIHRydWUpO1xyXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5jaGlsZExpc3QgfHwgb3B0aW9ucy5zdWJ0cmVlKVxyXG4gICAgICAgICAgICAgICAgbm9kZS5hZGRFdmVudExpc3RlbmVyKCdET01Ob2RlUmVtb3ZlZCcsIHRoaXMsIHRydWUpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgcmVtb3ZlTGlzdGVuZXJzOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlTGlzdGVuZXJzXyh0aGlzLnRhcmdldCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICByZW1vdmVMaXN0ZW5lcnNfOiBmdW5jdGlvbiAobm9kZSkge1xyXG4gICAgICAgICAgICB2YXIgb3B0aW9ucyA9IHRoaXMub3B0aW9ucztcclxuICAgICAgICAgICAgaWYgKG9wdGlvbnMuYXR0cmlidXRlcylcclxuICAgICAgICAgICAgICAgIG5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcignRE9NQXR0ck1vZGlmaWVkJywgdGhpcywgdHJ1ZSk7XHJcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmNoYXJhY3RlckRhdGEpXHJcbiAgICAgICAgICAgICAgICBub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ0RPTUNoYXJhY3RlckRhdGFNb2RpZmllZCcsIHRoaXMsIHRydWUpO1xyXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5jaGlsZExpc3QpXHJcbiAgICAgICAgICAgICAgICBub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ0RPTU5vZGVJbnNlcnRlZCcsIHRoaXMsIHRydWUpO1xyXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5jaGlsZExpc3QgfHwgb3B0aW9ucy5zdWJ0cmVlKVxyXG4gICAgICAgICAgICAgICAgbm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKCdET01Ob2RlUmVtb3ZlZCcsIHRoaXMsIHRydWUpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQWRkcyBhIHRyYW5zaWVudCBvYnNlcnZlciBvbiBub2RlLiBUaGUgdHJhbnNpZW50IG9ic2VydmVyIGdldHMgcmVtb3ZlZFxyXG4gICAgICAgICAqIG5leHQgdGltZSB3ZSBkZWxpdmVyIHRoZSBjaGFuZ2UgcmVjb3Jkcy5cclxuICAgICAgICAgKiBAcGFyYW0ge05vZGV9IG5vZGVcclxuICAgICAgICAgKi9cclxuICAgICAgICBhZGRUcmFuc2llbnRPYnNlcnZlcjogZnVuY3Rpb24gKG5vZGUpIHtcclxuLy8gRG9uJ3QgYWRkIHRyYW5zaWVudCBvYnNlcnZlcnMgb24gdGhlIHRhcmdldCBpdHNlbGYuIFdlIGFscmVhZHkgaGF2ZSBhbGxcclxuLy8gdGhlIHJlcXVpcmVkIGxpc3RlbmVycyBzZXQgdXAgb24gdGhlIHRhcmdldC5cclxuICAgICAgICAgICAgaWYgKG5vZGUgPT09IHRoaXMudGFyZ2V0KVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB0aGlzLmFkZExpc3RlbmVyc18obm9kZSk7XHJcbiAgICAgICAgICAgIHRoaXMudHJhbnNpZW50T2JzZXJ2ZWROb2Rlcy5wdXNoKG5vZGUpO1xyXG4gICAgICAgICAgICB2YXIgcmVnaXN0cmF0aW9ucyA9IHJlZ2lzdHJhdGlvbnNUYWJsZS5nZXQobm9kZSk7XHJcbiAgICAgICAgICAgIGlmICghcmVnaXN0cmF0aW9ucylcclxuICAgICAgICAgICAgICAgIHJlZ2lzdHJhdGlvbnNUYWJsZS5zZXQobm9kZSwgcmVnaXN0cmF0aW9ucyA9IFtdKTtcclxuLy8gV2Uga25vdyB0aGF0IHJlZ2lzdHJhdGlvbnMgZG9lcyBub3QgY29udGFpbiB0aGlzIGJlY2F1c2Ugd2UgYWxyZWFkeVxyXG4vLyBjaGVja2VkIGlmIG5vZGUgPT09IHRoaXMudGFyZ2V0LlxyXG4gICAgICAgICAgICByZWdpc3RyYXRpb25zLnB1c2godGhpcyk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICByZW1vdmVUcmFuc2llbnRPYnNlcnZlcnM6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIHRyYW5zaWVudE9ic2VydmVkTm9kZXMgPSB0aGlzLnRyYW5zaWVudE9ic2VydmVkTm9kZXM7XHJcbiAgICAgICAgICAgIHRoaXMudHJhbnNpZW50T2JzZXJ2ZWROb2RlcyA9IFtdO1xyXG4gICAgICAgICAgICB0cmFuc2llbnRPYnNlcnZlZE5vZGVzLmZvckVhY2goZnVuY3Rpb24gKG5vZGUpIHtcclxuLy8gVHJhbnNpZW50IG9ic2VydmVycyBhcmUgbmV2ZXIgYWRkZWQgdG8gdGhlIHRhcmdldC5cclxuICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlTGlzdGVuZXJzXyhub2RlKTtcclxuICAgICAgICAgICAgICAgIHZhciByZWdpc3RyYXRpb25zID0gcmVnaXN0cmF0aW9uc1RhYmxlLmdldChub2RlKTtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmVnaXN0cmF0aW9ucy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChyZWdpc3RyYXRpb25zW2ldID09PSB0aGlzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlZ2lzdHJhdGlvbnMuc3BsaWNlKGksIDEpO1xyXG4vLyBFYWNoIG5vZGUgY2FuIG9ubHkgaGF2ZSBvbmUgcmVnaXN0ZXJlZCBvYnNlcnZlciBhc3NvY2lhdGVkIHdpdGhcclxuLy8gdGhpcyBvYnNlcnZlci5cclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LCB0aGlzKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGhhbmRsZUV2ZW50OiBmdW5jdGlvbiAoZSkge1xyXG4vLyBTdG9wIHByb3BhZ2F0aW9uIHNpbmNlIHdlIGFyZSBtYW5hZ2luZyB0aGUgcHJvcGFnYXRpb24gbWFudWFsbHkuXHJcbi8vIFRoaXMgbWVhbnMgdGhhdCBvdGhlciBtdXRhdGlvbiBldmVudHMgb24gdGhlIHBhZ2Ugd2lsbCBub3Qgd29ya1xyXG4vLyBjb3JyZWN0bHkgYnV0IHRoYXQgaXMgYnkgZGVzaWduLlxyXG4gICAgICAgICAgICBlLnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgICAgICBzd2l0Y2ggKGUudHlwZSkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnRE9NQXR0ck1vZGlmaWVkJzpcclxuLy8gaHR0cDovL2RvbS5zcGVjLndoYXR3Zy5vcmcvI2NvbmNlcHQtbW8tcXVldWUtYXR0cmlidXRlc1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBuYW1lID0gZS5hdHRyTmFtZTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbmFtZXNwYWNlID0gZS5yZWxhdGVkTm9kZS5uYW1lc3BhY2VVUkk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRhcmdldCA9IGUudGFyZ2V0O1xyXG4vLyAxLlxyXG4gICAgICAgICAgICAgICAgICAgIHZhciByZWNvcmQgPSBuZXcgZ2V0UmVjb3JkKCdhdHRyaWJ1dGVzJywgdGFyZ2V0KTtcclxuICAgICAgICAgICAgICAgICAgICByZWNvcmQuYXR0cmlidXRlTmFtZSA9IG5hbWU7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVjb3JkLmF0dHJpYnV0ZU5hbWVzcGFjZSA9IG5hbWVzcGFjZTtcclxuLy8gMi5cclxuICAgICAgICAgICAgICAgICAgICB2YXIgb2xkVmFsdWUgPVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlLmF0dHJDaGFuZ2UgPT09IE11dGF0aW9uRXZlbnQuQURESVRJT04gPyBudWxsIDogZS5wcmV2VmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yRWFjaEFuY2VzdG9yQW5kT2JzZXJ2ZXJFbnF1ZXVlUmVjb3JkKHRhcmdldCwgZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuLy8gMy4xLCA0LjJcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFvcHRpb25zLmF0dHJpYnV0ZXMpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbi8vIDMuMiwgNC4zXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLmF0dHJpYnV0ZUZpbHRlciAmJiBvcHRpb25zLmF0dHJpYnV0ZUZpbHRlci5sZW5ndGggJiZcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbnMuYXR0cmlidXRlRmlsdGVyLmluZGV4T2YobmFtZSkgPT09IC0xICYmXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25zLmF0dHJpYnV0ZUZpbHRlci5pbmRleE9mKG5hbWVzcGFjZSkgPT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuLy8gMy4zLCA0LjRcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMuYXR0cmlidXRlT2xkVmFsdWUpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZ2V0UmVjb3JkV2l0aE9sZFZhbHVlKG9sZFZhbHVlKTtcclxuLy8gMy40LCA0LjVcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlY29yZDtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgJ0RPTUNoYXJhY3RlckRhdGFNb2RpZmllZCc6XHJcbi8vIGh0dHA6Ly9kb20uc3BlYy53aGF0d2cub3JnLyNjb25jZXB0LW1vLXF1ZXVlLWNoYXJhY3RlcmRhdGFcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdGFyZ2V0ID0gZS50YXJnZXQ7XHJcbi8vIDEuXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJlY29yZCA9IGdldFJlY29yZCgnY2hhcmFjdGVyRGF0YScsIHRhcmdldCk7XHJcbi8vIDIuXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG9sZFZhbHVlID0gZS5wcmV2VmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yRWFjaEFuY2VzdG9yQW5kT2JzZXJ2ZXJFbnF1ZXVlUmVjb3JkKHRhcmdldCwgZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuLy8gMy4xLCA0LjJcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFvcHRpb25zLmNoYXJhY3RlckRhdGEpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbi8vIDMuMiwgNC4zXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLmNoYXJhY3RlckRhdGFPbGRWYWx1ZSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBnZXRSZWNvcmRXaXRoT2xkVmFsdWUob2xkVmFsdWUpO1xyXG4vLyAzLjMsIDQuNFxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVjb3JkO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnRE9NTm9kZVJlbW92ZWQnOlxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkVHJhbnNpZW50T2JzZXJ2ZXIoZS50YXJnZXQpO1xyXG4vLyBGYWxsIHRocm91Z2guXHJcbiAgICAgICAgICAgICAgICBjYXNlICdET01Ob2RlSW5zZXJ0ZWQnOlxyXG4vLyBodHRwOi8vZG9tLnNwZWMud2hhdHdnLm9yZy8jY29uY2VwdC1tby1xdWV1ZS1jaGlsZGxpc3RcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdGFyZ2V0ID0gZS5yZWxhdGVkTm9kZTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgY2hhbmdlZE5vZGUgPSBlLnRhcmdldDtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgYWRkZWROb2RlcywgcmVtb3ZlZE5vZGVzO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChlLnR5cGUgPT09ICdET01Ob2RlSW5zZXJ0ZWQnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFkZGVkTm9kZXMgPSBbY2hhbmdlZE5vZGVdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZW1vdmVkTm9kZXMgPSBbXTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhZGRlZE5vZGVzID0gW107XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZWROb2RlcyA9IFtjaGFuZ2VkTm9kZV07XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBwcmV2aW91c1NpYmxpbmcgPSBjaGFuZ2VkTm9kZS5wcmV2aW91c1NpYmxpbmc7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5leHRTaWJsaW5nID0gY2hhbmdlZE5vZGUubmV4dFNpYmxpbmc7XHJcbi8vIDEuXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJlY29yZCA9IGdldFJlY29yZCgnY2hpbGRMaXN0JywgdGFyZ2V0KTtcclxuICAgICAgICAgICAgICAgICAgICByZWNvcmQuYWRkZWROb2RlcyA9IGFkZGVkTm9kZXM7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVjb3JkLnJlbW92ZWROb2RlcyA9IHJlbW92ZWROb2RlcztcclxuICAgICAgICAgICAgICAgICAgICByZWNvcmQucHJldmlvdXNTaWJsaW5nID0gcHJldmlvdXNTaWJsaW5nO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlY29yZC5uZXh0U2libGluZyA9IG5leHRTaWJsaW5nO1xyXG4gICAgICAgICAgICAgICAgICAgIGZvckVhY2hBbmNlc3RvckFuZE9ic2VydmVyRW5xdWV1ZVJlY29yZCh0YXJnZXQsIGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcbi8vIDIuMSwgMy4yXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghb3B0aW9ucy5jaGlsZExpc3QpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbi8vIDIuMiwgMy4zXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZWNvcmQ7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY2xlYXJSZWNvcmRzKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuICAgIGdsb2JhbC5Kc011dGF0aW9uT2JzZXJ2ZXIgPSBKc011dGF0aW9uT2JzZXJ2ZXI7XHJcbiAgICBpZiAoIWdsb2JhbC5NdXRhdGlvbk9ic2VydmVyKVxyXG4gICAgICAgIGdsb2JhbC5NdXRhdGlvbk9ic2VydmVyID0gSnNNdXRhdGlvbk9ic2VydmVyO1xyXG59KSh0aGlzKTsiLCIvKipcclxuICogQGxpY2Vuc2VcclxuICogQ29weXJpZ2h0IChjKSAyMDE0IFRoZSBQb2x5bWVyIFByb2plY3QgQXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cclxuICogVGhpcyBjb2RlIG1heSBvbmx5IGJlIHVzZWQgdW5kZXIgdGhlIEJTRCBzdHlsZSBsaWNlbnNlIGZvdW5kIGF0IGh0dHA6Ly9wb2x5bWVyLmdpdGh1Yi5pby9MSUNFTlNFLnR4dFxyXG4gKiBUaGUgY29tcGxldGUgc2V0IG9mIGF1dGhvcnMgbWF5IGJlIGZvdW5kIGF0IGh0dHA6Ly9wb2x5bWVyLmdpdGh1Yi5pby9BVVRIT1JTLnR4dFxyXG4gKiBUaGUgY29tcGxldGUgc2V0IG9mIGNvbnRyaWJ1dG9ycyBtYXkgYmUgZm91bmQgYXQgaHR0cDovL3BvbHltZXIuZ2l0aHViLmlvL0NPTlRSSUJVVE9SUy50eHRcclxuICogQ29kZSBkaXN0cmlidXRlZCBieSBHb29nbGUgYXMgcGFydCBvZiB0aGUgcG9seW1lciBwcm9qZWN0IGlzIGFsc29cclxuICogc3ViamVjdCB0byBhbiBhZGRpdGlvbmFsIElQIHJpZ2h0cyBncmFudCBmb3VuZCBhdCBodHRwOi8vcG9seW1lci5naXRodWIuaW8vUEFURU5UUy50eHRcclxuICovXHJcbmlmICh0eXBlb2YgV2Vha01hcCA9PT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgIChmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgZGVmaW5lUHJvcGVydHkgPSBPYmplY3QuZGVmaW5lUHJvcGVydHk7XHJcbiAgICAgICAgdmFyIGNvdW50ZXIgPSBEYXRlLm5vdygpICUgMWU5O1xyXG4gICAgICAgIHZhciBXZWFrTWFwID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHRoaXMubmFtZSA9ICdfX3N0JyArIChNYXRoLnJhbmRvbSgpICogMWU5ID4+PiAwKSArIChjb3VudGVyKysgKyAnX18nKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIFdlYWtNYXAucHJvdG90eXBlID0ge1xyXG4gICAgICAgICAgICBzZXQ6IGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcclxuICAgICAgICAgICAgICAgIHZhciBlbnRyeSA9IGtleVt0aGlzLm5hbWVdO1xyXG4gICAgICAgICAgICAgICAgaWYgKGVudHJ5ICYmIGVudHJ5WzBdID09PSBrZXkpXHJcbiAgICAgICAgICAgICAgICAgICAgZW50cnlbMV0gPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgICBkZWZpbmVQcm9wZXJ0eShrZXksIHRoaXMubmFtZSwge3ZhbHVlOiBba2V5LCB2YWx1ZV0sIHdyaXRhYmxlOiB0cnVlfSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbihrZXkpIHtcclxuICAgICAgICAgICAgICAgIHZhciBlbnRyeTtcclxuICAgICAgICAgICAgICAgIHJldHVybiAoZW50cnkgPSBrZXlbdGhpcy5uYW1lXSkgJiYgZW50cnlbMF0gPT09IGtleSA/XHJcbiAgICAgICAgICAgICAgICAgICAgZW50cnlbMV0gOiB1bmRlZmluZWQ7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGRlbGV0ZTogZnVuY3Rpb24oa2V5KSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZW50cnkgPSBrZXlbdGhpcy5uYW1lXTtcclxuICAgICAgICAgICAgICAgIGlmICghZW50cnkgfHwgZW50cnlbMF0gIT09IGtleSkgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgZW50cnlbMF0gPSBlbnRyeVsxXSA9IHVuZGVmaW5lZDtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBoYXM6IGZ1bmN0aW9uKGtleSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGVudHJ5ID0ga2V5W3RoaXMubmFtZV07XHJcbiAgICAgICAgICAgICAgICBpZiAoIWVudHJ5KSByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZW50cnlbMF0gPT09IGtleTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgd2luZG93LldlYWtNYXAgPSBXZWFrTWFwO1xyXG4gICAgfSkoKTtcclxufSIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IE1pZ3VlbCBvbiAyNi8wMS8yMDE1LlxyXG4gKi9cclxuKGZ1bmN0aW9uICgkKSB7XHJcbiAgICB2YXIgd2FybiA9IHJlcXVpcmUoXCIuL3dhcm5cIik7XHJcbiAgICB2YXIgZ2V0RGVmYXVsdHMgPSByZXF1aXJlKFwiLi9vcHRpb25zXCIpO1xyXG4gICAgdmFyIG9ic2VydmUgPSByZXF1aXJlKFwiLi9vYnNlcnZlXCIpO1xyXG5cclxuICAgICQuZm4uanN0cmVlQmluZCA9IGZ1bmN0aW9uICh0YXJnZXQsIG9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgLy9NYWluIHZhcmlhYmxlc1xyXG4gICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG4gICAgICAgIC8vdGVtcGxhdGUgaXMgdGhlIGVsZW1lbnQgdGhhdCBoYXMgYXNzb2NpYXRlZCBkYXRhIGJpbmRpbmdzIHRoYXQgd2UncmUgYmFzaW5nIHRoZSB0cmVlIG9mZlxyXG4gICAgICAgIHZhciB0ZW1wbGF0ZSA9ICQodGFyZ2V0KTtcclxuICAgICAgICAvL3RyZWUgaXMgdGhlIGFjdHVhbCB0cmVlIGVsZW1lbnQgdGhhdCAkKCkuanN0cmVlIHdpbGwgYmUgY2FsbGVkIG9uXHJcbiAgICAgICAgdmFyIHRyZWUgPSB0aGlzO1xyXG5cclxuICAgICAgICAvL1BlcmZvcm0gZXJyb3IgY2hlY2tpbmdcclxuICAgICAgICBpZiAodHlwZW9mICQuZm4uanN0cmVlICE9IFwiZnVuY3Rpb25cIilcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwianNUcmVlIG11c3QgYmUgaW5zdGFsbGVkIGZvciBqc1RyZWUtYmluZCB0byB3b3JrIVwiKTtcclxuICAgICAgICBpZiAodGVtcGxhdGVbMF0gaW5zdGFuY2VvZiBFbGVtZW50ID09PSBmYWxzZSlcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiWW91IG5lZWQgdG8gcGFzcyBpbiBhIHZhbGlkIGpRdWVyeSBzZWxlY3RvciBvciBET00gZWxlbWVudCBhcyB0aGUgZmlyc3QgZWxlbWVudCBvZiBqc3RyZWVCaW5kKClcIik7XHJcbiAgICAgICAgaWYgKHRlbXBsYXRlLmxlbmd0aCA+IDEpXHJcbiAgICAgICAgICAgIHdhcm4oXCJZb3UgY2FuIG9ubHkgZGVmaW5lIG9uZSByb290IGVsZW1lbnQgdG8gYmluZCB0byB0aGUganNUcmVlLiBBZGRpdGlvbmFsIGVsZW1lbnRzIGlnbm9yZWQuXCIpO1xyXG5cclxuICAgICAgICAvL01lcmdlIHRoaXMgY29uZmlndXJhdGlvbiBvYmplY3Qgd2l0aCB3aGF0ZXZlciB0aGUgdXNlciBoYXMgcGFzc2VkIGluXHJcbiAgICAgICAgdmFyIG1lcmdlZCA9ICQuZXh0ZW5kKGdldERlZmF1bHRzKHRlbXBsYXRlKSwgb3B0aW9ucyk7XHJcblxyXG4gICAgICAgIC8vQWN0dWFsbHkgY2FsbCBqc3RyZWUoKVxyXG4gICAgICAgIHRyZWUuanN0cmVlKG1lcmdlZCk7XHJcblxyXG4gICAgICAgIC8vT2JzZXJ2ZSB0aGUgdGVtcGxhdGUgZm9yIGNoYW5nZXNcclxuICAgICAgICBvYnNlcnZlKHRlbXBsYXRlWzBdLCB0cmVlLmpzdHJlZShtZXJnZWQpKTtcclxuICAgIH07XHJcbn0oalF1ZXJ5KSk7IiwiLyoqXHJcbiAqIENyZWF0ZXMgYSBtdXRhdGlvbiBvYnNlcnZlciB0aGF0IHdpbGwgYXV0b21hdGljYWxseSByZWZyZXNoIHRoZSBqc3RyZWUgaWYgaXQgZGV0ZWN0cyBET00gbXV0YXRpb25cclxuICogQHBhcmFtIGluc3RhbmNlIFRoZSBqc3RyZWUgaW5zdGFuY2UgKE5PVCBhIERPTSBvciBqUXVlcnkgZWxlbWVudCkgdG8gcmVmcmVzaCBhcyBuZWNlc3NhcnlcclxuICogQHJldHVybnMge1dpbmRvdy5NdXRhdGlvbk9ic2VydmVyfVxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0T2JzZXJ2ZXIoaW5zdGFuY2UpIHtcclxuICAgIHJldHVybiBuZXcgTXV0YXRpb25PYnNlcnZlcihmdW5jdGlvbiAobXV0YXRpb25zKSB7XHJcblxyXG4gICAgICAgIC8vTWFwIHRoZSBtdXRhdGlvbiBhcnJheSBpbnRvIGFuIGFycmF5IG9mIGRlcHRocy5cclxuICAgICAgICAkLmVhY2gobXV0YXRpb25zLCBmdW5jdGlvbiAoaSwgdikge1xyXG5cclxuICAgICAgICAgICAgLy9Pbmx5IGluY2x1ZGUgdGhlIG11dGF0aW9uIGlmIGl0J3MgYSBuZXcgbm9kZSBhZGRlZFxyXG4gICAgICAgICAgICBpZiAodi5hZGRlZE5vZGVzLmxlbmd0aCA8PSAwKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICAgICAgdmFyIHQgPSB2LmFkZGVkTm9kZXNbMF0ucGFyZW50Tm9kZTtcclxuICAgICAgICAgICAgaW5zdGFuY2UucmVmcmVzaF9ub2RlKFwianN0YlwiICsgJCh0KS5kYXRhKFwianN0YlwiKSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgfSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBUaGUgb2JzZXJ2ZSBvcHRpb25zIHRvIHBhc3MgaW50byBvYnNlcnZlKClcclxuICovXHJcbnZhciBvYnNlcnZlT3B0aW9ucyA9IHtcclxuICAgIGF0dHJpYnV0ZXM6IHRydWUsXHJcbiAgICBjaGlsZExpc3Q6IHRydWUsXHJcbiAgICBjaGFyYWN0ZXJEYXRhOiB0cnVlLFxyXG4gICAgc3VidHJlZTogdHJ1ZVxyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAobm9kZSwganNUcmVlKSB7XHJcbiAgICBnZXRPYnNlcnZlcihqc1RyZWUpLm9ic2VydmUobm9kZSwgb2JzZXJ2ZU9wdGlvbnMpO1xyXG59O1xyXG4iLCJ2YXIgdHJlZU5vZGUgPSByZXF1aXJlKFwiLi90cmVlTm9kZVwiKTtcclxuXHJcbi8qKlxyXG4gKiBDdXN0b20gb3B0aW9ucyB0byBiZSBwYXNzZWQgaW50byAkKCkuanNUcmVlXHJcbiAqL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGdldERlZmF1bHRzKHJvb3QpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgJ2NvcmUnOiB7XHJcbiAgICAgICAgICAgIGRhdGE6IGZ1bmN0aW9uIChvYmosIGNhbGxiYWNrKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIG5vZGVzO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vSWYgaXQncyB0aGUgcm9vdCBub2RlLCB1c2UgdGhlIHRvcCBsZXZlbCBub2Rlc1xyXG4gICAgICAgICAgICAgICAgaWYgKCFvYmoucGFyZW50KVxyXG4gICAgICAgICAgICAgICAgICAgIG5vZGVzID0gcm9vdDtcclxuICAgICAgICAgICAgICAgIC8vT3RoZXJ3aXNlIHVzZSB0aGUgY2hpbGQgbm9kZXMgb2YgdGhlIGN1cnJlbnQgZWxlbWVudFxyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgIG5vZGVzID0gJChvYmoub3JpZ2luYWwubm9kZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy9UdXJuIGludG8gYXJyYXkgb2YgY2hpbGRyZW5cclxuICAgICAgICAgICAgICAgIG5vZGVzID0gJC5tYWtlQXJyYXkobm9kZXMuY2hpbGRyZW4oKSk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy9Db25zdHJ1Y3QgYSB0cmVlTm9kZSBvdXQgb2YgZWFjaCBlbGVtZW50IGFuZCByZXR1cm4gaXRcclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrKCQubWFwKG5vZGVzLCBmdW5jdGlvbiAoZWwpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IHRyZWVOb2RlKGVsKTtcclxuICAgICAgICAgICAgICAgIH0pKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH07XHJcbn07IiwiLyoqXHJcbiAqIFRoZSBJRCB0byBiZSB1c2VkIGJ5IHRoZSBuZXh0IGNyZWF0ZWQgbm9kZVxyXG4gKi9cclxudmFyIGlkID0gMDtcclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGEgbmV3IHRyZWUgbm9kZSB0byBiZSB1c2VkIGluIGpzVHJlZSBiYXNlZCBvbiBhIERPTSBlbGVtZW50XHJcbiAqL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHRyZWVOb2RlKGRvbU5vZGUpIHtcclxuXHJcbiAgICB2YXIgZE5vZGUgPSAkKGRvbU5vZGUpO1xyXG4gICAgdmFyIHROb2RlID0gdGhpcztcclxuXHJcbiAgICAvL1N0b3JlIHRoZSBJRCBvZiB0aGUgY29ycmVzcG9uZGluZyBub2RlIGluIG91ciB0ZW1wbGF0ZSBub2RlXHJcbiAgICBkTm9kZS5kYXRhKFwianN0YlwiLCBpZCk7XHJcblxyXG4gICAgLy9EZWZhdWx0IHZhbHVlc1xyXG4gICAgdE5vZGUuY2hpbGRyZW4gPSBCb29sZWFuKGROb2RlLmNoaWxkcmVuKCkubGVuZ3RoKTtcclxuICAgIHROb2RlLnN0YXRlID0geydvcGVuZWQnOiBmYWxzZSwgJ3NlbGVjdGVkJzogZmFsc2V9O1xyXG4gICAgdE5vZGUubm9kZSA9IGRvbU5vZGU7XHJcbiAgICB0Tm9kZS5pZCA9IFwianN0YlwiICsgaWQrKztcclxuXHJcbiAgICAvL0FkZCBKU09OIGRhdGEgaWYgcHJlc2VudFxyXG4gICAgdmFyIGV4dHJhSnNvbiA9IGROb2RlLmRhdGEoXCJqc3RyZWVcIik7XHJcbiAgICBpZiAoZXh0cmFKc29uKVxyXG4gICAgICAgICQuZXh0ZW5kKHRydWUsIHROb2RlLCBleHRyYUpzb24pO1xyXG5cclxuICAgIC8vQWRkIGFsbCBkYXRhIGF0dHJpYnV0ZXMgZXhjZXB0IGZvciB0aGUganN0cmVlIGF0dHJpYnV0ZVxyXG4gICAgdmFyIGV4dHJhQXR0cnMgPSBkTm9kZS5kYXRhKCk7XHJcbiAgICBkZWxldGUgIGV4dHJhQXR0cnMuanN0cmVlO1xyXG4gICAgJC5leHRlbmQodHJ1ZSwgdE5vZGUsIGV4dHJhQXR0cnMpO1xyXG5cclxuICAgIC8vUHV0IGFsbCB0aGUgc3RhdGUgdmFyaWFibGVzIGludG8gdGhlIHN0YXRlIHByb3BlcnR5XHJcbiAgICAkLmVhY2goW1wib3BlbmVkXCIsIFwic2VsZWN0ZWRcIiwgXCJkaXNhYmxlZFwiXSwgZnVuY3Rpb24gKGluZGV4LCB2YWx1ZSkge1xyXG4gICAgICAgIGlmICh2YWx1ZSBpbiB0Tm9kZSkge1xyXG4gICAgICAgICAgICB0Tm9kZS5zdGF0ZVt2YWx1ZV0gPSB0Tm9kZVt2YWx1ZV07XHJcbiAgICAgICAgICAgIGRlbGV0ZSB0Tm9kZVt2YWx1ZV07XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgLy9NYWtlIHN1cmUgaXQgaGFzIHRleHQgYnkgY2hlY2tpbmcgZm9yIHRleHQgbm9kZXNcclxuICAgIHZhciB0ZXh0ID0gXCJcIjtcclxuICAgIGlmIChcInRleHRcIiBpbiB0aGlzID09PSBmYWxzZSkge1xyXG4gICAgICAgICQuZWFjaChkb21Ob2RlLmNoaWxkTm9kZXMsIGZ1bmN0aW9uIChpbmRleCwgbm9kZSkge1xyXG4gICAgICAgICAgICBpZiAobm9kZS5ub2RlVHlwZSA9PT0gMylcclxuICAgICAgICAgICAgICAgIHRleHQgKz0gbm9kZS5ub2RlVmFsdWU7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdE5vZGUudGV4dCA9IHRleHQ7XHJcbiAgICB9XHJcbn07IiwiLyoqXHJcbiAqIEFsZXJ0cyB0aGUgdXNlciB0byBhbiBpc3N1ZSB3aXRob3V0IGNhdXNpbmcgYW4gZXJyb3JcclxuICovXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gd2Fybihtc2cpIHtcclxuICAgIGlmIChjb25zb2xlLndhcm4pXHJcbiAgICAgICAgY29uc29sZS53YXJuKG1zZyk7XHJcbiAgICBlbHNlXHJcbiAgICAgICAgY29uc29sZS5sb2cobXNnKTtcclxufTsiXX0=
