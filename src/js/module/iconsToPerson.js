import { sendIcon, deleteIcon } from './xhr';
import { TagsInput } from './tagsInput';

function initEventTagsIcons(iconField, labelField, tags) {
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
                if (!iconField.hidden || !labelField.hidden) {
                    alert("Veuillez finaliser la valeur du label et du préfixe.");
                    return;
                }
                tags.addTag(str);

                // Send to controller with corresponding suffixe
                sendIcon(str, iconField.value, labelField.value, false, false);
            }
        }
    });

    tags.wrapper.addEventListener('click', function (e) {
        if (e.target.nodeName === 'A' && e.target.innerHTML === "×") {
            var text = e.target.parentNode.firstChild.data;
            deleteIcon(text, iconField.value, labelField.value);
        }
    });
}

// Plugin Constructor
export var IconsToPerson = function (opts) {
    this.options = opts;
    this.init();
}

// Initialize the plugin
IconsToPerson.prototype.init = function () {
    if (this.initialized)
        this.destroy();

    this.wrapper = document.createElement('div');

    // Input field for the icon
    this.inputIcon = document.createElement('input');
    this.inputIcon.className = this.options.iconInputClass;

    this.inputIconLabel = document.createElement('label');
    this.inputIconLabel.setAttribute('for', this.inputIcon.id);
    this.inputIconLabel.textContent = 'Préfixe à ajouter : ';

    // Input field for the label of the icon
    this.inputLabel = document.createElement('input');
    this.inputLabel.className = this.options.iconInputClass;

    this.inputLabelLabel = document.createElement('label');
    this.inputLabelLabel.setAttribute('for', this.inputLabel.id);
    this.inputLabelLabel.textContent = 'Label du préfixe : ';
    var labeldiv = document.createElement('div');
    labeldiv.append(this.inputLabelLabel);
    labeldiv.append(this.inputLabel);
    this.wrapper.append(labeldiv);

    this.closeIcon = document.createElement('a');
    this.closeIcon.innerHTML = '&times;';
    this.closeIcon.classList.add(this.options.closeIconClass);
    this.wrapper.append(this.closeIcon);

    // definir id
    this.options.optsTagsInput.selector = 'test';

    // Position
    this.wrapper.classList.add(this.options.wrapperClass);
    var button = document.getElementById('addIconsField');
    button.parentNode.insertBefore(this.wrapper, button.nextSibling);
    this.events();
    this.initialized = true;
    this.tagInputInitialized = false;
    this.iconInputInitialized = false;
}

IconsToPerson.prototype.setLabel = function (labeltext) {
    this.inputLabel.value = labeltext;
    this.createBoxtext(this.inputLabel);
}

IconsToPerson.prototype.setIcon = function (icontext) {
    this.inputIcon.value = icontext;
    var icondiv = document.createElement('div');
    icondiv.append(this.inputIconLabel);
    icondiv.append(this.inputIcon);
    this.wrapper.append(icondiv);

    this.createBoxtext(this.inputIcon);
    this.iconInputInitialized = true;
}

IconsToPerson.prototype.setPersons = function (persons) {
    this.createTagInput(persons);
}

IconsToPerson.prototype.events = function () {

    var thisClass = this
    this.inputIcon.addEventListener('keydown', function (e) {
        var str = this.value.trim();
        if (!!(~[9, 13, 188].indexOf(e.keyCode))) {
            thisClass.createBoxtext(thisClass.inputIcon);
            if (!thisClass.tagInputInitialized)
                thisClass.createTagInput();

            else if (thisClass.inputLabel.hidden)
                thisClass.sendAllTags(false, true);

            thisClass.tagInput.input.focus();
        }
    });

    this.inputLabel.addEventListener('keydown', function (e) {
        var str = this.value.trim();
        if (!!(~[9, 13, 188].indexOf(e.keyCode))) {
            thisClass.createBoxtext(thisClass.inputLabel);
            if (!thisClass.iconInputInitialized) {
                thisClass.iconInputInitialized = true;
                var icondiv = document.createElement('div');
                icondiv.append(thisClass.inputIconLabel);
                icondiv.append(thisClass.inputIcon);
                thisClass.wrapper.append(icondiv);
                thisClass.inputIcon.focus();
            }
            else if (thisClass.inputIcon.hidden)
                thisClass.sendAllTags(true, false);
        }
    });

    this.closeIcon.addEventListener('click', function () {
        if (thisClass.tagInputInitialized && thisClass.iconInputInitialized)
            for (let person of thisClass.tagInput.arr) {
                deleteIcon(person, thisClass.inputIcon.value, thisClass.inputLabel.value);
            }
        thisClass.wrapper.remove();
    });
}

IconsToPerson.prototype.createBoxtext = function (input) {
    var tag = document.createElement('span');
    tag.className = this.options.finalValueClass;
    tag.innerText = input.value;

    tag.addEventListener('click', function () {
        input.removeAttribute('hidden');
        input.focus();
        tag.remove();
    });

    input.parentNode.insertBefore(tag, input);
    input.setAttribute('hidden', 'true');
}


IconsToPerson.prototype.createTagInput = function (tags) {
    this.textDiv = document.createElement('div');
    this.wrapper.append(this.textDiv);
    this.originalInputLabel = document.createTextNode("Pour les personnes : ");
    this.textDiv.append(this.originalInputLabel);

    this.originalInputTag = document.createElement('text');
    this.originalInputTag.setAttribute('id', this.options.optsTagsInput.selector);
    this.wrapper.append(this.originalInputTag);

    this.tagInput = new TagsInput(this.options.optsTagsInput);
    initEventTagsIcons(this.inputIcon, this.inputLabel, this.tagInput);

    if (tags)
        for (let tag of tags) {
            this.tagInput.addTag(tag);
        }

    this.tagInputInitialized = true;
}


IconsToPerson.prototype.sendAllTags = function (changeLabel, changeIcon) {
    var prefix = this.inputIcon.value;
    var label = this.inputLabel.value;
    this.tagInput.arr.forEach(text => {
        sendIcon(text, prefix, label, changeLabel, changeIcon);
    });
}