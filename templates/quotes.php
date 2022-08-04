<?php
style('whereami', ['style']);
script('whereami', ['quote.app']);
?>

<div id="app">
	<div id="app-navigation">
		<?php print_unescaped($this->inc('navigation/index')); ?>
		<?php print_unescaped($this->inc('settings/index')); ?>
	</div>

	<div id="app-content">
		<div id="app-content-wrapper">
		<?php print_unescaped($this->inc('content/modal')); ?>
			<?php print_unescaped($this->inc('content/quotes')); ?>
		</div>
	</div>
</div>
