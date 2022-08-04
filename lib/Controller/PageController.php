<?php
namespace OCA\Whereami\Controller;

use OCA\Whereami\Db\Bdd;
use OCA\Whereami\MyClass\MyEvent;

use OCP\IRequest;
use OCP\AppFramework\Http\TemplateResponse;
use OCP\AppFramework\Http\DataResponse;

use OCP\AppFramework\Controller;
use OCP\Calendar\IManager;
use Sabre\VObject;
use OCA\Polls\Model\CalendarEvent;
use OCP\IURLGenerator;
use DateTimeImmutable;
use DateTime;

/**
 * 
 */
class PageController extends Controller {
	private $userId;
    private $calendarManager;
	private $myDb;
	private $urlGenerator;

	/**
	 * 
	 */
	public function __construct($AppName,
								$UserId,
								IRequest $request, 
								IManager $calendarManager,
								IURLGenerator $urlGenerator,
								Bdd $myDb
								){
		parent::__construct($AppName, $request);

		$this->userId = $UserId;
		$this->myDb = $myDb;
		$this->calendarManager = $calendarManager;
		$this->calendars = $this->calendarManager->getCalendars();
		$this->urlGenerator = $urlGenerator;
	}

	/**
	 * @NoAdminRequired
	 * @NoCSRFRequired
	 */
	public function index() {
		return new TemplateResponse('whereami', 'index', array('url' => $this->getNavigationLink()));
	}

	/**
	 * @NoAdminRequired
	 * @NoCSRFRequired
	 */
	public function quotes() {
		return new TemplateResponse('whereami', 'quotes', array('url' => $this->getNavigationLink()));
	}


	/**
	 * @NoAdminRequired
	 * @NoCSRFRequired
	 */
	public function getNavigationLink(){
		return array(	"index" => $this->urlGenerator->linkToRouteAbsolute("whereami.page.index"),
						"quotes" => $this->urlGenerator->linkToRouteAbsolute("whereami.page.quotes")
					);
	}

	/**
	 * @NoAdminRequired
	 * @param string $dtStart
	 * @param string $dtEnd
	 */
	public function getLastSeen(String $dtStart, String $dtEnd){
		$events = [];
		$charReplace = "@";

		//Récupération de la liste des événements sur la période
		foreach($this->search($dtStart,$dtEnd) as $c){
			$e = new MyEvent($c, $this->myDb);

			$cls = strtolower($e->{"nextcloud_users"});
			$cls = trim(str_replace($charReplace, "", $cls));
			$cls = explode(",",$cls)[0];
			$cls = trim($cls);

			array_push($events, $e);
		}

		//Récupération de la liste des événements croisées sur la période
		$listSeen = [];
		foreach($events as $e){
			$user = strtolower($e->nextcloud_users);
			if(!array_key_exists($user,$listSeen)){
				$listSeen[$user] = [];
			}
			
			$listSeen[$user] = $e->parseListEvents($events, $listSeen[$user]);
		}
		ksort($listSeen, SORT_STRING);
		return new DataResponse($listSeen, 200, ['Content-Type' => 'application/json']);
	}

	public function search(String $dtStart, String $dtEnd){
		$from = new DateTime($dtStart);
		$to = new DateTime($dtEnd);
		$searchResults = $this->calendarManager->search("@", ['SUMMARY'], ['timerange' => ['start' => $from, 'end' => $to]]);
		
		return $searchResults;
		// list de tous les utilisateurs
		// if($e->{$classement} === "nextcloud_users"){
		// 	$allUID = $this->myDb->getAllUID();
		// 	foreach ($allUID as $UID){
		// 		$events[json_decode($UID['data'])->{'displayname'}->{'value'}] = [];
		// 	}
		// }
	}

	/**
	 * @NoAdminRequired
	 * @param string $classement
	 * @param string $dtStart
	 * @param string $dtEnd
	 */
	public function getEvents(String $classement, String $dtStart, String $dtEnd){
		
		$events = [];
		$charReplace = "@";

		foreach($this->search($dtStart,$dtEnd) as $c){
			$e = new MyEvent($c, $this->myDb);
			// if(preg_match("/^".$charReplace."/", $e->summary)){

			$cls = strtolower($e->{$classement});
			$cls = trim(str_replace($charReplace, "", $cls));
			$cls = explode(",",$cls)[0];
			$cls = trim($cls);

			if(!array_key_exists($cls,$events)){
				$events[$cls] = [];
			}
			array_push($events[$cls], $e);
			// }
		}
		return new DataResponse($events, 200, ['Content-Type' => 'application/json']);
	}

}
