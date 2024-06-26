import "../../../css/mycss.css";
import { deleteTag, getTags, sendTags } from "../module/xhr";
// Tags input
"use strict"


// Plugin Constructor
// Plugin Constructor
export class TagsInput {
    constructor(opts) {
        this.options = opts;
        this.init(opts);
    }

    // Initialize the plugin
    init(opts) {
        this.options = opts ? Object.assign(this.options, opts) : this.options;

        if (this.initialized)
            this.destroy();

        if (!(this.orignal_input = document.getElementById(this.options.selector))) {
            console.error("tags-input couldn't find an element with the specified ID");
            return this;
        }

        this.arr = [];

        this.wrapper = document.createElement('div');
        this.input = document.createElement('input');
        this.input.setAttribute("id", this.orignal_input.getAttribute('id') + "-input-field");
        init(this);

        this.initialized = true;
        return this;
    }

    initDbTags() {

        var initialTags = getTags(this.options.selector).onload();
        for (const tag of initialTags) {
            this.addTag(tag.word);
        }
    }

    // Add Tags
    addTag(string) {

        this.arr.push(string);
        var tagInput = this;

        var tag = document.createElement('span');
        tag.className = this.options.tagClass;
        tag.innerText = string;

        var closeIcon = document.createElement('a');
        closeIcon.innerHTML = '&times;';

        // delete the tag when icon is clicked
        closeIcon.addEventListener('click', function (e) {
            e.preventDefault();
            var tag = this.parentNode;

            deleteTag(tagInput.options.selector + ':' + string);

            for (var i = 0; i < tagInput.wrapper.childNodes.length; i++) {
                if (tagInput.wrapper.childNodes[i] == tag)
                    tagInput.deleteTag(tag, i);
            }
        });


        tag.appendChild(closeIcon);
        this.wrapper.insertBefore(tag, this.input);
        this.orignal_input.value = this.arr.join(',');

        return this;
    }

    // Delete Tags
    deleteTag(tag, i) {
        tag.remove();
        this.arr.splice(i, 1);
        this.orignal_input.value = this.arr.join(',');
        return this;
    }

    // Make sure input string have no error with the plugin
    anyErrors(string) {
        if (this.options.max != null && this.arr.length >= this.options.max) {
            console.log('max tags limit reached');
            return true;
        }
        if (!this.options.duplicate && (this.arr.indexOf(string) != -1 || this.arr.indexOf(string.toLowerCase()) != -1)) {
            console.log('duplicate found " ' + string + ' " ');
            return true;
        }

        return false;
    }

    // Add tags programmatically
    addData(array) {
        var plugin = this;

        array.forEach(function (string) {
            plugin.addTag(string);
        });
        return this;
    }

    // Get the Input String
    getInputString() {
        return this.arr.join(',');
    }

    // destroy the plugin
    destroy() {
        this.orignal_input.removeAttribute('hidden');

        delete this.orignal_input;
        var self = this;

        Object.keys(this).forEach(function (key) {
            if (self[key] instanceof HTMLElement)
                self[key].remove();

            if (key != 'options')
                delete self[key];
        });

        this.initialized = false;
    }
}

// Private function to initialize the tag input plugin
function init(tags) {
    tags.wrapper.append(tags.input);
    tags.wrapper.classList.add(tags.options.wrapperClass);
    tags.orignal_input.setAttribute('hidden', 'false');
    tags.orignal_input.parentNode.insertBefore(tags.wrapper, tags.orignal_input);
}

// // Set All the Default Values
// TagsInput.defaults = {
//     selector: '',
//     wrapperClass: 'tags-input-wrapper',
//     tagClass: 'tag',
//     max: null,
//     duplicate: false
// }

export function initEventsBase(tags) {
    tags.wrapper.addEventListener('click', function () {
        tags.input.focus();
    });


    tags.input.addEventListener('keydown', function (e) {
        var str = tags.input.value.trim();

        if (!!(~[9, 13, 188].indexOf(e.keyCode))) {
            e.preventDefault();
            tags.input.value = "";
            if (str != "") {
                if (tags.anyErrors(str))
                    return;
                tags.addTag(str);

                // Send to controller with corresponding preffixe
                if (tags.options.dbPrefixe)
                    sendTags(tags.options.dbPrefixe + ':' + str);
                else
                    sendTags(tags.options.selector + ':' + str);
            }
        }
    });

    tags.wrapper.addEventListener('click', function (e) {
        if (e.target.nodeName === 'A' && e.target.innerHTML === "×") {
            var text = e.target.parentNode.firstChild.data;
            deleteTag(tags.options.selector + ':' + text);
        }
    });
}
