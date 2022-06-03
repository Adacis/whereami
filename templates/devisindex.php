<?php
style('Whereami', ['style', 'datatables1.10']);
script('Whereami', ['script', 'datatables1.10.19']);
?>

<div id="app">
	<div id="app-navigation">
		<?php print_unescaped($this->inc('navigation/index')); ?>
		<?php print_unescaped($this->inc('settings/index')); ?>
	</div>

	<div id="app-content">
		<div id="app-content-wrapper">
			<?php print_unescaped($this->inc('content/devisindex')); ?>
		</div>
	</div>
</div>

