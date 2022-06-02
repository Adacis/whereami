<?php
namespace OCA\Whereami\Controller;

use OCP\IRequest;
use OCP\AppFramework\Http\TemplateResponse;
use OCP\AppFramework\Http\DataResponse;
use OCP\AppFramework\Controller;

use OCA\Outils\Db\OutilsMapper;


class PageController extends Controller {
	private $userId;
	private $om;
	private $GetNomComplet;

	public function __construct($AppName, IRequest $request, $UserId, OutilsMapper $om){
		parent::__construct($AppName, $request);
		$this->userId = $UserId;
		$this->om = $om;

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
		return new TemplateResponse('outils', 'index', array(	'listetaches' => $this->om->listetaches(), 
																'NomComplet' => $this->GetNomComplet, //Fonction anonyme
																'listeNbTache' => $this->om->listeNbTache(),
																'userInfo' => $this->om->userInfo(array($this->userId)),
																'userId' => $this->userId,
																));  // templates/index.php
	}

}
