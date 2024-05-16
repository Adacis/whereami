<?php
script('whereami', array('adminSection.app'));
?>

<div class="section">
    <div class="div-main">
        <h2 class="header2">Lieux autorisés:</h2>
        <input type="text" id="allowed_events">
    </div>
    <div class="div-main">
        <h2 class="header2">Lieux non pris en compte pour last seen:</h2>
        <input type="text" id="excluded_places">
    </div>
    <div class="div-main">
        <h2 class="header2">Lieux à prendre en compte pour les clés:</h2>
        <input type="text" id="accounted_for_keys">
    </div>


    <div class="div-main">
        <h2 class="header2">Icons:</h2>
        <button id="addIconsField" class="button-custom">Ajouter une icône</button>
        <div id="divIconsToPerson"></div>
    </div>
</div>