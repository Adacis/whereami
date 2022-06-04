<div id="contentTable">
	<h1> bienvenue </h1>
	<table id="table">
		<tr>
			<th>Personne</th>
	<?php 
		use DateTimeImmutable;

		$dtStart = new DateTimeImmutable('2022-06-01');
		$dtEnd = new DateTimeImmutable('2022-06-15');

		while($dtStart <= $dtEnd){
			echo "<th>".$dtStart->format("d/m/Y")."</th>";
			$dtStart = $dtStart->modify('+1 day');
		}

		echo "</tr>";

		foreach($_['Events'] as $k => $myE){
			echo "<tr><td>$k</td>";
			
			$dtStart = new DateTimeImmutable('2022-06-01');
			while($dtStart <= $dtEnd){
				$trouve = false;
				foreach($_['Events'][$k] as $e){
					if($e->inInterval($dtStart)){
						echo "<td>$e->summary</td>";
						$trouve = true;
					}
				}
				if(!$trouve)
					echo "<td></td>";
				$dtStart = $dtStart->modify('+1 day');
			}

			echo "</tr>";
		}
	?>
	</table>
</div>
