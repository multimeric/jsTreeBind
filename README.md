# jsTree-bind
A jQuery plugin that allows the use of data binding frameworks (Angular, Ember, Knockout etc.) with the jsTree UI component.

## Rationale

jsTree is a fantastic plugin, but it's a bit behind the times. Unlike when it was first designed, web apps are now based on data binding rather than raw DOM manipulation. However using jsTree with a databinding framework has two main problems:

* jsTree is designed for static data; data that never changes once it's been set.
* You have to mangle your data into [jsTree's specific JSON format](http://www.jstree.com/docs/json/) in order for it to be displayed

My solution to these problems is to use the native capability of every framework; to bind data to the DOM. jsTree-bind uses the DOM as a template from which to create nodes, allowing you to have data in any structure, structure it in any way, but still present it in a tree format using jsTree

## Installation

Just run `npm install js-tree-bind` or `git clone https://github.com/TMiguelT/jsTree-bind` to get a copy of the
repository, then copy either `jsTree-bind.js` or `jsTree-bind.min.js` somewhere into your project.

## Usage

To use jsTree-bind, all you need to do is call `$("#js-tree").jstreeBind("#tree-template");`

The first element (`#js-tree` in this case) is the element that will *receive* the new tree.
It's the element that will actually be shown.

The second element, `#tree-template`, is the DOM element to be used as the template for the tree. Directly inside
the `#tree-template` element should be one or more HTML elements, which will serve as the root nodes for the tree.
These elements, and any child nodes nested further in the tree are used to generate jsTree nodes using the following
rules:

* Text directly inside a node will be merged into that the jsTree node's text

* Nested elements will be used to generate child nodes

* As in the [jsTree docs](http://www.jstree.com/docs/html/), the `data-jstree` attribute can be used on any element to
to provide a json object to use as the node's data

* Any other `data-*` attributes can be used on the HTML elements, which work as you'd expect (e.g. `data-icon` sets the
node's icon class or image URL, `data-disabled` disables the node etc.)

## Example

```html
<!--Set the template element to be hidden so it doesn't show up in the DOM-->
<div class="hidden" id="tree-template">

    <!--The root node that has the text 'People'-->
    <div>
        People
        <div ng-repeat="person in people()">

            <!--Using a text node to set the text property-->
            {{ person.name }}

            <!--Using a data-attribute to set the text property-->
            <div data-text="Tags">
                <!--Using a data-attribute to set the icon property-->
                <div data-icon="glyphicon glyphicon-leaf" ng-repeat="tag in person.tags track by $index">{{tag}}</div>
            </div>

            <div data-text="Friends">

                <!--Using data-jstree to disable the node (the only way to set boolean properties afaik-->
                <div data-jstree='{"disabled": true}' data-icon="glyphicon glyphicon-leaf"
                     ng-repeat="friend in person.friends">{{friend.name}}
                </div>
            </div>

            <div data-text="Age">
                <!--Using a data-jstree attribute to set the icon-->
                <div data-jstree='{"icon": "glyphicon glyphicon-leaf"}'>{{person.age}}</div>
            </div>

            <div data-text="Gender">
                <!--Using data-attribute to disable the node-->
                <div data-disabled="true" data-icon="glyphicon glyphicon-leaf">{{person.gender}}</div>
            </div>
        </div>
    </div>
</div>

<!--The element that will recieve the jsTree-->
<div id="js-tree"></div>
```

![Example](http://i.imgur.com/iAgTHX9.png)