<?php

namespace OCA\Whereami\Controller;

use OCA\Whereami\Db\Bdd;
use OCA\Whereami\MyClass\MyEvent;

use OCP\IRequest;
use OCP\AppFramework\Http\TemplateResponse;
use OCP\AppFramework\Http\DataResponse;

use OCP\AppFramework\Controller;
use OCP\Calendar\IManager;
use OCP\IURLGenerator;
use DateTime;
use OCP\AppFramework\Http;
use Psr\Log\LoggerInterface;

/**
 * 
 */
class PageController extends Controller
{
	private $userId;
	private $calendarManager;
	private $myDb;
	private $urlGenerator;
	public LoggerInterface $logger;

	/**
	 * 
	 */
	public function __construct(
		$AppName,
		$UserId,
		IRequest $request,
		IManager $calendarManager,
		IURLGenerator $urlGenerator,
		Bdd $myDb,
		LoggerInterface $log
	) {
		parent::__construct($AppName, $request);

		$this->userId = $UserId;
		$this->myDb = $myDb;
		$this->calendarManager = $calendarManager;
		$this->urlGenerator = $urlGenerator;
		$this->logger = $log;
	}

	/**
	 * @NoAdminRequired
	 * @NoCSRFRequired
	 */
	public function index()
	{
		return new TemplateResponse('whereami', 'index', array('url' => $this->getNavigationLink()));
	}

	/**
	 * @NoAdminRequired
	 * @NoCSRFRequired
	 */
	public function quotes()
	{
		return new TemplateResponse('whereami', 'quotes', array('url' => $this->getNavigationLink()));
	}

	/**
	 * @NoAdminRequired
	 * @NoCSRFRequired
	 */
	public function getNavigationLink()
	{
		return array(
			"index" => $this->urlGenerator->linkToRouteAbsolute("whereami.page.index"),
			"quotes" => $this->urlGenerator->linkToRouteAbsolute("whereami.page.quotes")
		);
	}

    /**
     * @param string $dtStart
     * @param string $dtEnd
     */
    public function getContracts(String $dtStart, String $dtEnd)
    {
        // Fetch data from the database
        $result = $this->myDb->getContracts($dtStart, $dtEnd);

        // Initialize arrays to store contracts and users per contract
        $contracts = [];
        $userByContracts = [];

        // Loop through the results and aggregate data by contract and user
        foreach ($result as $r) {
            $contractValue = $r['nb_contract'];
            $username = strtolower($r['username']);
            $acrValue = $r['activity_report_value'];
            $acrDate = $r['activity_report_date'];

            // Aggregate  for contract and user
            $contracts[$contractValue][$username][] = [
                'date_cra' => $acrDate,
                'ac' => $acrValue
            ];

            // Aggregate the total activity report per user for each contract.
            if (!isset($userByContracts[$contractValue][$username])) {
                $userByContracts[$contractValue][$username] = 0.0;
            }
            $userByContracts[$contractValue][$username] += $acrValue;
        }

        // Return aggregated data as a JSON response
        return new DataResponse([
            'contracts' => $contracts,
            'userByContract' => $userByContracts
        ], 200, ['Content-Type' => 'application/json']);
    }


    /**
	 * @NoAdminRequired
	 * @param string $dtStart
	 * @param string $dtEnd
	 */
	public function getLastSeen(String $dtStart, String $dtEnd)
	{
		$events = [];
		$charReplace = "@";

		$toExclude = $this->myDb->getWordInWordList("excluded_places");
		$toExclude = $this->arrayFromWordQuery($toExclude);

		//Récupération de la liste des événements sur la période
		foreach ($this->search($dtStart, $dtEnd) as $c) {
			$e = new MyEvent($c, $this->myDb, $this->logger);

			if (!$e->valid) {
				continue;
			}

			$cls = strtolower($e->{"nextcloud_users"});
			$cls = trim(str_replace($charReplace, "", $cls));
			$cls = explode(",", $cls)[0];
			$cls = trim($cls);

			array_push($events, $e);
		}

		//Récupération de la liste des événements croisées sur la période
		$listSeen = [];
		foreach ($events as $e) {
			$user = strtolower($e->nextcloud_users);
			if (!array_key_exists($user, $listSeen)) {
				$listSeen[$user] = [];
			}

			$listSeen[$user] = $e->parseListEvents($events, $listSeen[$user], $toExclude);
		}
		ksort($listSeen, SORT_STRING);
		return new DataResponse($listSeen, 200, ['Content-Type' => 'application/json']);
	}

	public function search(String $dtStart, String $dtEnd)
	{
		$from = new DateTime($dtStart);
		$to = new DateTime($dtEnd);
		// It looks like search does not include the upper bound (end of day at 00H00)
		$to->modify('+1 minute');
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
	public function getEvents(String $classement, String $dtStart, String $dtEnd)
	{

		$events = [];
		$charReplace = "@";

		$toInclude = $this->myDb->getWordInWordList('allowed_events');
		$toInclude = $this->arrayFromWordQuery($toInclude);

		foreach ($this->search($dtStart, $dtEnd) as $c) {
			$e = new MyEvent($c, $this->myDb, $this->logger);
			// if(preg_match("/^".$charReplace."/", $e->summary)){

			if (!$e->valid) {
				continue;
			}

			$cls = trim(strtolower($e->{$classement}));

			# selectionner tout ceux qui sont dans la db
			if (in_array($e->place, $toInclude) && ($e->place2 === "" || in_array($e->place2, $toInclude))) {
				if (!array_key_exists($cls, $events)) {
					$events[$cls] = [];
				}
				array_push($events[$cls], $e);
				if ($classement === 'place' && $e->place2 !== '') {
					if (!array_key_exists($e->place2, $events)) {
						$events[$e->place2] = [];
					}
					array_push($events[$e->place2], $e);
				}
			}
		}

		return new DataResponse($events, 200, ['Content-Type' => 'application/json']);
	}

	/**
	 * @NoAdminRequired
	 * @param string personName
	 */
	public function getIcons($person, $label)
	{
		$res = $this->myDb->getIconsInPrefixList($person, $label);
		return new DataResponse($res, 200, ['Content-Type' => 'application/json']);
	}

	/**
	 * @NoAdminRequired
	 */
	public function getCalendarsForUser()
	{
		$res = $this->myDb->getCalendarsFromUID($this->userId);
		return new DataResponse($res, 200, ['Content-Type' => 'application/json']);
	}

	/**
	 * @NoAdminRequired
	 * @param string dtStart
	 * @param string dtEnd
	 */
	public function isTimeSlotAvailable($dtStart, $dtEnd)
	{
		$collisions = [];
		$status = Http::STATUS_NO_CONTENT;
		foreach ($this->search($dtStart, $dtEnd) as $e) {
			$event = new MyEvent($e, $this->myDb, $this->logger);

			if ($event->nextcloud_users === $this->userId) {
				array_push($collisions, $event);
				$status = Http::STATUS_OK;
			}
		}

		return new DataResponse($collisions, $status, ['Content-Type' => 'application/json']);
	}

	/**
	 * @NoAdminRequired
	 */
	private function arrayFromWordQuery($wordQuery)
	{
		$res = array_map(function ($q) {
			return strtolower(trim($q['word']));
		}, $wordQuery);
		return $res;
	}
}
