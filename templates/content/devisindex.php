<div id="contentTable">

	<table id="deck_sorts" class="display" style="table-layout: fixed;
	width: 100%; white-space: pre-wrap;">
	<thead>
	    <tr>
	    	<th>Détenteur</th>
	    	<th>Calendar Data</th>
	        <th>Temps début</th>
	        <th>Temps fin</th>
	        <th>Nombre Jours</th>
	    </tr>
	</thead>
	<tbody>
		<?php 
			foreach ( $_['events'] as $event) {

				//init
				$summary="";
				$dtstart="";
				$dtend="";

				//Recherche de la bonne date en fonction de la TZID.
				$dtstart=rechercheDate($event, "DTSTART");
				$dtend=rechercheDate($event, "DTEND");

				//Affichage
				echo "<tr><td>".$event['displayname']."</td>
						<td>".$event["SUMMARY"]."</td>
						<td>".date('d/m/Y H:i', strtotime($dtstart))."</td>
						<td>".date('d/m/Y H:i', strtotime($dtend))."</td>
						<td>".NbJours($dtstart, $dtend)."</td></tr>";
			}


			/**
			* Function de recherche d'une date dans un ics
			*/
			function rechercheDate($event, $stringDate){
				$ret = $event[$stringDate];

				if(is_null($ret) or substr($ret, 0, 2) === "19"){
					foreach($event as $key => $value){
					    $exp_key = explode(';', $key);
					    if($exp_key[0] == $stringDate
					    	and substr($value, 0, 2) !== "19"){
					         $ret = $value;
					    }
					}
				}

				return $ret;
			}

			/**
			* Calcul du nombre de jour et d'heure
			*
			*/
			function NbJours($debut, $fin) {
				if(empty($debut) || empty($fin))
					return "NC";

				$diff = strtotime($fin) - strtotime($debut);
				if(strpos($debut,"T")!==false){
					return(($diff / 3600)." heure(s)");
				}else{
					return(($diff / 86400))." Jour(s)";
				}
				
		    }
		?>
	</tbody>
</table>

</div>