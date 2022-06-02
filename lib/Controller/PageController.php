<?php
namespace OCA\Whereami\Controller;

use OCP\IRequest;
use OCP\AppFramework\Http\TemplateResponse;
use OCP\AppFramework\Controller;
use OCP\Calendar\IManager;


class PageController extends Controller {
	private $userId;
	private $GetNomComplet;
	/** @var IManager */
    private $calendarManager;

	public function __construct($AppName,
								$UserId,
								IRequest $request, 
								IManager $calendarManager){
		parent::__construct($AppName, $request);
		$this->userId = $UserId;
		$this->calendarManager = $calendarManager;

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
		// return new TemplateResponse('outils', 'index', array(	'listetaches' => $this->om->listetaches(), 
		// 														'NomComplet' => $this->GetNomComplet, //Fonction anonyme
		// 														'listeNbTache' => $this->om->listeNbTache(),
		// 														'userInfo' => $this->om->userInfo(array($this->userId)),
		// 														'userId' => $this->userId,
		// 														));  // templates/index.php
		return new TemplateResponse('whereami', 'index', array( 'events' => $this->searchCalendar()));
	}


	//https://docs.nextcloud.com/server/latest/developer_manual/digging_deeper/groupware/calendar.html#access-calendars-and-events
	
	public function searchCalendar() {
		// return $this->calendarManager->getCalendars();
		// return $this->calendarManager->search("[loc]");
	}

	public function searchInUserCalendar(
		string $uid,
		string $calendarUri,
		DateTimeImmutable $from,
		DateTimeImmutable $to) {
		$principal = 'principals/users/' . $uid;

		// Prepare the query
		$query = $this->calendarManager->newQuery($principal);
		$query->addSearchCalendar($uri);
		$query->setTimerangeStart($from);
		$query->setTimerangeEnd($to);

		// Execute the query
		$objects = $this->calendarManager->searchForPrincipal($query);
		return $objects;
	}

	/**
	 * get all users uid
	 */
	public function getUids(): array{

	}
}
