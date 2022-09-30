import { sendTags, getTags } from '../module/xhr';
import { TagsInput } from '../module/tagsInput';


function initEventsClick(tags) {
    tags.wrapper.addEventListener('click', function () {
        tags.input.focus();
    });
}


function initEventSendTag(tags) {
    tags.input.addEventListener('keydown', function (e) {
        var str = tags.input.value.trim();

        if (!!(~[9, 13, 188].indexOf(e.keyCode))) {
            e.preventDefault();
            tags.input.value = "";
            if (str != "") {
                if (tags.anyErrors(str))
                    return;
                tags.addTag(str);

                // Send to controller with corresponding suffixe
                sendTags(tags.options.selector + ':' + str);
            }
        }
    });
}

var opts1 = {
    selector: 'allowed_events',
    duplicate: false,
    wrapperClass: 'tags-input-wrapper',
    tagClass: 'tag',
    max: null,
    duplicate: false
};
var tagInput1 = new TagsInput(opts1);

var opts2 = {
    selector: 'excluded_places',
    wrapperClass: 'tags-input-wrapper',
    tagClass: 'tag',
    max: null,
    duplicate: false
};
var tagInput2 = new TagsInput(opts2);

// Event when input field clicked
initEventsClick(tagInput1);
initEventsClick(tagInput2);

// Event when enter key pressed with tag sent
initEventSendTag(tagInput1);
initEventSendTag(tagInput2);
