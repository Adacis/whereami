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
use DateTimeImmutable;
use DateTime;

class PageController extends Controller {
	private $userId;
    private $calendarManager;
	private $myDb;

	public function __construct($AppName,
								$UserId,
								IRequest $request, 
								IManager $calendarManager,
								Bdd $myDb
								){
		parent::__construct($AppName, $request);

		$this->userId = $UserId;
		$this->myDb = $myDb;
		$this->calendarManager = $calendarManager;
		$this->calendars = $this->calendarManager->getCalendars();
	}

	/**
	 * @NoAdminRequired
	 * @NoCSRFRequired
	 */
	public function index() {
		return new TemplateResponse('whereami', 'index', array());
	}


	/**
	 * @NoAdminRequired
	 * @NoCSRFRequired
	 * @param string $dtStart
	 * @param string $dtEnd
	 */
	public function getEvents(String $dtStart, String $dtEnd){
		$from = new DateTime($dtStart);
		$to = new DateTime($dtEnd);

		$searchResults = $this->calendarManager->search("[loc]", ['SUMMARY'], ['timerange' => ['start' => $from, 'end' => $to]]);
		$events = [];

		//list de tous les utilisateurs
		// $allUID = $this->myDb->getAllUID();
		// foreach ($allUID as $UID){
		// 	$events[json_decode($UID['data'])->{'displayname'}->{'value'}] = [];
		// }

		foreach($searchResults as $c){
			$e = new MyEvent($c, $this->myDb);
			if(!array_key_exists($e->nextcloud_users,$events)){
				$events[$e->nextcloud_users] = [];
			}
			array_push($events[$e->nextcloud_users], $e);
		}
		return new DataResponse($events, 200, ['Content-Type' => 'application/json']);
	}
}
