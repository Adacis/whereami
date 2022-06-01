<?php
namespace OCA\Outils\Controller;
use OCP\IRequest;
use OCP\AppFramework\Http\TemplateResponse;
use OCP\AppFramework\Http\DataResponse;
use OCP\AppFramework\Controller;
use OCA\Outils\Db\OutilsMapper;
use OCA\Outils\Db\DevisMapper;


class DevisController extends Controller {

	private $userId;
	private $om;
	private $dm;
	private $GetNomComplet;

	public function __construct($AppName, IRequest $request, $UserId, OutilsMapper $om, DevisMapper $dm){
		parent::__construct($AppName, $request);
		$this->userId = $UserId;
		$this->om = $om;
		$this->dm = $dm;

		//Fonction anonyme pour récupérer le nom d'un utilisateur (LDAP, ETC.);
		$this->GetNomComplet = function($val)
		{
			$myObj = json_decode($val);
			$parameters = $myObj->{'displayname'}->{'value'};
			if(empty($parameters))
				$parameters="Non affecté";
			return $parameters;
		};
	}

	/**
	 * CAUTION: the @Stuff turns off security checks; for this page no admin is
	 *          required and no CSRF check. If you don't know what CSRF is, read
	 *          it up in the docs or you might create a security hole. This is
	 *          basically the only required method to add this exemption, don't
	 *          add it to any other method if you don't exactly know what it does
	 *
	 * @NoAdminRequired
	 * @NoCSRFRequired
	 */
	public function index() {

		//Recherche de tous les devis
		

		return new TemplateResponse('outils', 'devisindex', array('NomComplet' => $this->GetNomComplet, //fonction anonyme
																'userInfo' => $this->om->userInfo(array($this->userId)),
																'userId' => $this->userId,
																'events' => $this->getListeEvents(),
																'listeDevis' => $this->getListeDevis(),
																));  // templates/index.php
	}

	private function getListeDevis(){
		$listeDevis[]="";
		foreach ($this->getListeEvents() as $myEvent){
			if(strpos($myEvent["SUMMARY"], "[*") !== false){
					$monDevis = substr($myEvent["SUMMARY"], 2, 6);
					$listeDevis[] = $monDevis;
			}
		}
		
		$listeDevis = array_unique($listeDevis);
		asort($listeDevis);

		return $listeDevis;
	}

	//Découpage en clef du résultat
	private function getListeEvents(){
		$events = $this->dm->getEvents();
		foreach ($events as $event) {
			$arrEvent = explode(PHP_EOL, $event['calendardata']);
			$listeEvents[] = $this->decoupeEvent($arrEvent, $event['displayname']);			
		}

		return $listeEvents;
	}

	private function decoupeEvent($arrEvent, $displayname){
		foreach ($arrEvent as $myEvent){
			$montab = explode(":", $myEvent);
			$listeEvents[$montab[0]] = implode(array_slice($montab, 1));
			$listeEvents['displayname']=$displayname;
		}
		return $listeEvents;
	}


}
