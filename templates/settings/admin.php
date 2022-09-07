<?php
    style('whereami', array('mycss'));
    script('whereami', array('adminSection.app'));
?>



<h2>Mots Autorisés Présence</h2>
<input type="text" id="tag-input-words">
<button class="button" id="submitWords" onclick="submit()"><?php p($l->t('Submit words')); ?></button>


<h2>Lieux pris en compte pour last seen</h2>
<input type="text" id="tag-input-places">
<button class="button" id="submitPlaces"><?php p($l->t('Submit places')); ?></button>
