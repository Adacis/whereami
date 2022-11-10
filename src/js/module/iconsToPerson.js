import { sendIcon, deleteIcon } from './xhr';
import { TagsInput } from './tagsInput';


/**
 * Creates a random string Id (taken from : https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript)
 * @param {int} length 
 * @returns {string}
 */
function makeid(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() *
            charactersLength));
    }
    return result;
}


/**
 * Initializes the event for the TagsInput of the IconToPerson class
 * @param {IconsToPerson} mainClass 
 * @param {TagsInput} tags 
 */
function initEventTagsIcons(mainClass, tags) {
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
                if (!mainClass.iconValueFinalised || !mainClass.labelValueFinalised) {
                    alert("Veuillez finaliser la valeur du label et du préfixe.");
                    return;
                }
                if (str.length !== 4) {
                    alert("Assurez vous d'entrer le quadrigramme de la personne");
                    tags.input.value = str;
                    return;
                }
                tags.addTag(str);

                // Send to controller with corresponding suffixe
                sendIcon(str, mainClass.inputIcon.value, mainClass.inputLabel.value, false, false);
            }
        }
    });

    tags.wrapper.addEventListener('click', function (e) {
        if (e.target.nodeName === 'A' && e.target.innerHTML === "×") {
            var text = e.target.parentNode.firstChild.data;
            deleteIcon(text, mainClass.inputIcon.value, mainClass.inputLabel.value);
        }
    });
}

/**
 * Constructor of the class
 * @param {Object} opts
 */
export class IconsToPerson {
    constructor(opts) {
        this.options = opts;
        this.init();
    }

    /**
     * Initializes all the attributes from the class
     */
    init() {
        if (this.initialized)
            this.destroy();

        this.wrapper = document.createElement('div');

        // Input field for the icon
        this.inputIcon = document.createElement('input');
        this.inputIcon.className = this.options.iconInputClass;

        this.inputIconLabel = document.createElement('label');
        this.inputIconLabel.setAttribute('for', this.inputIcon.id);
        this.inputIconLabel.textContent = 'Préfixe à ajouter : ';
        var icondiv = document.createElement('div');
        icondiv.append(this.inputIconLabel);
        icondiv.append(this.inputIcon);

        // Input field for the label of the icon
        this.inputLabel = document.createElement('input');
        this.inputLabel.className = this.options.iconInputClass;

        this.inputLabelLabel = document.createElement('label');
        this.inputLabelLabel.setAttribute('for', this.inputLabel.id);
        this.inputLabelLabel.textContent = 'Label du préfixe : ';
        var labeldiv = document.createElement('div');
        labeldiv.append(this.inputLabelLabel);
        labeldiv.append(this.inputLabel);

        // Close button to delete the element
        this.closeIcon = document.createElement('a');
        this.closeIcon.innerHTML = '&times;';
        this.closeIcon.classList.add(this.options.closeIconClass);

        this.options.optsTagsInput.selector = makeid(8);

        // Position everything
        this.wrapper.append(labeldiv);
        this.wrapper.append(icondiv);
        this.wrapper.append(this.closeIcon);
        this.wrapper.classList.add(this.options.wrapperClass);
        document.getElementById("divIconsToPerson").append(this.wrapper);
        this.setIcon('');
        this.createTagInput();


        // init events and check variables
        this.events();
        this.initialized = true;

        this.labelValueFinalised = false;
        this.iconValueFinalised = false;
    }

    /**
     * Set the the value of the label Input field
     * @param {string} labeltext
     */
    setLabel(labeltext) {
        this.inputLabel.value = labeltext;
        this.labelValueFinalised = true;
    }

    /**
     * Set the value of the icon input field
     * @param {string} icontext
     */
    setIcon(icontext) {
        this.inputIcon.value = icontext;

        this.iconValueFinalised = true;
    }

    /**
     * Add tags with the corresponding values in the tagsInput field
     * @param {Array<string>} persons
     */
    setPersons(persons) {
        if (persons)
            for (let tag of persons) {
                this.tagInput.addTag(tag);
            }
    }

    /**
     * Initializes events for the class
     */
    events() {

        var thisClass = this;
        this.inputIcon.addEventListener('keydown', function (e) {
            thisClass.iconValueFinalised = false;
            if (!!(~[9, 13, 188].indexOf(e.keyCode))) {
                thisClass.iconValueFinalised = true;

                if (thisClass.labelValueFinalised)
                    thisClass.sendAllTags(false, true);

                thisClass.tagInput.input.focus();
            }
        });

        this.inputLabel.addEventListener('keydown', function (e) {
            thisClass.labelValueFinalised = false;
            if (!!(~[9, 13, 188].indexOf(e.keyCode))) {
                thisClass.labelValueFinalised = true;

                if (thisClass.iconValueFinalised)
                    thisClass.sendAllTags(true, false);

                thisClass.inputIcon.focus();
            }
        });

        this.closeIcon.addEventListener('click', function () {
            if (thisClass.tagInputInitialized)
                for (let person of thisClass.tagInput.arr) {
                    deleteIcon(person, thisClass.inputIcon.value, thisClass.inputLabel.value);
                }
            thisClass.wrapper.remove();
        });
    }

    /**
     * (Not used anymore)
     * Used to express that the value is finalized, hides the input field and shows a tag instead
     * @param {*} input
     */
    createBoxtext(input) {
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

    /**
     * Creates the tagsInput field
     */
    createTagInput() {
        this.textDiv = document.createElement('div');
        this.wrapper.append(this.textDiv);
        this.originalInputLabel = document.createTextNode("Pour les personnes : ");
        this.textDiv.append(this.originalInputLabel);

        this.originalInputTag = document.createElement('text');
        this.originalInputTag.setAttribute('id', this.options.optsTagsInput.selector);
        this.wrapper.append(this.originalInputTag);

        this.tagInput = new TagsInput(this.options.optsTagsInput);
        initEventTagsIcons(this, this.tagInput);


        this.tagInputInitialized = true;
    }

    /**
     * Send all the tags contained in the the tagsInput field. Used when the label or the icon has been changed
     * @param {Boolean} changeLabel
     * @param {Boolean} changeIcon
     */
    sendAllTags(changeLabel, changeIcon) {
        var prefix = this.inputIcon.value;
        var label = this.inputLabel.value;
        this.tagInput.arr.forEach(text => {
            sendIcon(text, prefix, label, changeLabel, changeIcon);
        });
    }
}















