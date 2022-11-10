<?php
script('whereami', ['lastSeen.app']);
style('whereami', ['style']);
?>

<div id="app">
    <div id="app-navigation">
        <?php print_unescaped($this->inc('navigation/index')); ?>
        <?php print_unescaped($this->inc('settings/index')); ?>
    </div>

    <div id="app-content">
        <div id="app-content-wrapper">
            <?php print_unescaped($this->inc('content/modal')); ?>
            <?php print_unescaped($this->inc('content/lastSeen')); ?>
        </div>
    </div>
</div>