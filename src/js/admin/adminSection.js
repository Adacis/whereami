import { TagsInput, initEventsBase } from '../class/tagsInput';
import { IconsToPerson } from '../class/iconsToPerson';
import { getAllIcons } from '../module/xhr';
import { groupBy } from 'lodash/collection';
import { ACCOUNTED_FOR_KEYS, ALLOWED_PLACES, EXCLUDED_PLACES } from '../config/config';


// Setup for selector allowed event in places
var opts1 = {
    selector: ALLOWED_PLACES,
    duplicate: false,
    wrapperClass: 'tags-input-wrapper',
    tagClass: 'tag',
    max: null,
    duplicate: false,
};

var tagInput1 = new TagsInput(opts1);
tagInput1.initDbTags();
initEventsBase(tagInput1);

// setup for selector of excluded places in last seen
var opts2 = {
    selector: EXCLUDED_PLACES,
    wrapperClass: 'tags-input-wrapper',
    tagClass: 'tag',
    max: null,
    duplicate: false
};
var tagInput2 = new TagsInput(opts2);
tagInput2.initDbTags();
initEventsBase(tagInput2);

// setup for selector of excluded places for the keys
var opts3 = {
    selector: ACCOUNTED_FOR_KEYS,
    wrapperClass: 'tags-input-wrapper',
    tagClass: 'tag',
    max: null,
    duplicate: false
};
var tagInput3 = new TagsInput(opts3);
tagInput3.initDbTags();
initEventsBase(tagInput3);

// base options for prefixe 
var optsIconTagInput = {
    wrapperClass: 'tags-input-wrapper',
    tagClass: 'tag',
    max: null,
    duplicate: false
}

var optsIconsToPerson = {
    wrapperClass: 'icons-to-person-wrapper',
    iconInputClass: 'inputIcon',
    optsTagsInput: optsIconTagInput,
    finalValueClass: 'finalValue',
    closeIconClass: 'closeIcon'
}


/**
 * Initializes with the values stored in DB
 */
function initDbIcons() {
    var data = getAllIcons().onload();
    var groupedLabel = groupBy(data, 'label');
    for (let label in groupedLabel) {
        var groupedIcon = groupBy(groupedLabel[label], 'prefix');
        for (let icon in groupedIcon) {
            var newElem = new IconsToPerson(optsIconsToPerson);
            var persons = [];
            for (let dic of groupedIcon[icon]) {
                persons.push(dic.person);
            }

            newElem.setIcon(icon);
            newElem.setLabel(label);
            newElem.setPersons(persons);
        }
    }
}

window.addEventListener("DOMContentLoaded", function () {
    var addIconsButton = document.getElementById("addIconsField");
    if (!addIconsButton) {
        return;
    }

    initDbIcons();

    addIconsButton.addEventListener("click", function () {
        new IconsToPerson(optsIconsToPerson);
    });
});