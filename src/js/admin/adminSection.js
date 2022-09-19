import { sendTags } from '../module/xhr';
import { TagsInput } from '../module/tagsInput';


function initEvents(tags) {
    tags.wrapper.addEventListener('click', function () {
        tags.input.focus();
    });


    tags.input.addEventListener('keydown', function (e) {
        var str = tags.input.value.trim();

        if (!!(~[9, 13, 188].indexOf(e.keyCode))) {
            e.preventDefault();
            tags.input.value = "";
            if (str != ""){
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
	selector: 'tag-input-places',
	duplicate: false,
	wrapperClass: 'tags-input-wrapper',
    tagClass: 'tag',
    max: null,
    duplicate: false
};
var tagInput2 = new TagsInput(opts1);

var opts2 = {
	selector: 'tag-input-words',
	wrapperClass: 'tags-input-wrapper',
    tagClass: 'tag',
    max: null,
    duplicate: false
};
var tagInput1 = new TagsInput(opts2);


initEvents(tagInput1);
initEvents(tagInput2);

