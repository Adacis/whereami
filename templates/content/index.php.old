<div id="contentTable">
	<table id="deck_sorts" class="display" style="table-layout: fixed;
	width: 100%; white-space: pre-wrap;">
	<thead>
	    <tr>
	    	<th>Nom du client</th>
	        <th>Affecté à</th>
	        <th>Etat de la tâche</th>
	        <th>Nom de la tâche</th>
	        <th>Responsable de la tâche</th>
	    </tr>
	</thead>
	<tbody>
		<?php
			foreach ($_['listetaches'] as $line) {
				//Fonction anonyme dans Controller/PageController.php
				// si est admin ou si est l'owner de la carte
				if($_['userInfo'][0]["gid"] == "admin" || 
					$_['userId'] == $line["uid_affectation"]){

					echo "	<tr>	<td>".$line["nom du client"]."</td>".
			    			"<td>".$_['NomComplet']($line["affecté à"])."</td>".
			    			"<td>".$line["Etat tache"]."</td>".
			    			"<td><a href=\"\apps/deck/#!/board/".$line["boardid"]."//card/".$line["cardid"]."\">".$line["nom tache"]."</a></td>".
			    			"<td>".$_['NomComplet']($line["responsable"])."</td>".
			    			"</tr>";
				}
			    
			}
		?>
	</tbody>
	</table>
</div>