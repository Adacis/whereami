<div class="navcss">
	<span>V0.2.0</span>
	<table>
		<?php
			//If we are on the index.php page else null
			foreach ($_['listeNbTache'] as $line) {
				if($_['userInfo'][0]["gid"] == "admin" || 
					$_['userId'] == $line["uid_affectation"]){
				    echo '<tr>
				    			<td><a href="#" class="affecte">'. $_['NomComplet']($line["affecté à"]) . "</a></td>
				    			<td style=\"padding-left:5px;\">".$line["nb tache"]."</td>
				    	</tr>\n";
				    	//<td style=\"padding-left:5px;\">".$line["admin"]."</td>
				}
			}

			//If we are on the devisindex.php page else null
			foreach ($_['listeDevis'] as $devis){
			    echo '<tr><td><a href="#" class="affecte">'. $devis . "</a></td></tr>";
	   		}
		?>
	</table>
</div>