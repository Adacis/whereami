<div id="contentTable">
	<h1> bienvenue </h1>
	<?php 
		foreach($_['Events'] as $e){
			var_dump($e->obj);
			echo "$e->nextcloud_users, $e->id<br/>";
		}
	?>
</div>
