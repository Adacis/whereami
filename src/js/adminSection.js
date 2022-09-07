import { translate as t } from '@nextcloud/l10n';
import { sendTags } from './module/xhr';
import { TagsInput } from './module/tagsInput';


var tagInput1 = new TagsInput({
	selector: 'tag-input-words',
	duplicate: false
});

var tagInput2 = new TagsInput({
	selector: 'tag-input-places',
	duplicate: false
});



// submit tags
window.addEventListener('click', e => {
	var elem = null;
	if (e.target.innerText.includes('words')) {
		console.log("Submit words");
		elem = document.getElementById('tag-input-words').getInputString;
	}
	else if (e.target.innerText.includes('places')) {
		console.log("Submit places");
		elem = document.getElementById('tag-input-places').getInputString();
	}
	if (elem != null) {
		sendTags(elem);
	}s
})

export function submit() {
	elem = document.getElementById('tag-input-words');
	console.log("onlclick worked");
	sendTags(elem);
}

