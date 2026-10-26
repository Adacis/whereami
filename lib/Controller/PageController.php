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
     * @NoAdminRequired
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
            $uid = $r['uid'];

            $contractValue = strtoupper($r['nb_contract']);
            $acrValue = $r['activity_report_value'];
            $acrDate = $r['activity_report_date'];

            // Extracting user infos
            $userInfos = $this->myDb->getUID($uid);
            $myObj = json_decode($userInfos[0]['data']);
            $userDisplayName = strtolower($myObj->displayname->value);

            // Aggregate for contract (contract number) and user (username)
            $contracts[$contractValue][$userDisplayName][] = [
                'date_cra' => $acrDate,
                'acr' => $acrValue
            ];

            // Aggregate the total activity report per user for each contract.
            if (!isset($userByContracts[$contractValue][$userDisplayName])) {
                $userByContracts[$contractValue][$userDisplayName] = 0.0;
            }
            $userByContracts[$contractValue][$userDisplayName] += $acrValue;
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
        $listSeen = [];
        $slots = [];
        $from = new DateTime($dtStart);
        $until = new DateTime($dtEnd);
        $until->setTime(23, 59, 59);
        $now = new DateTime();
        if ($until > $now) {
            $until = $now;
        }
        foreach ($this->search($dtStart, $dtEnd) as $calendarEvent) {
            $event = new MyEvent($calendarEvent, $this->myDb, $this->logger);
            if (!$event->valid) {
                continue;
            }
            $user = strtolower($event->nextcloud_users);
            $listSeen[$user] = $listSeen[$user] ?? [];
            $start = new DateTime($event->dtStart);
            $end = new DateTime($event->dtEnd);
            $day = clone ($start > $from ? $start : $from);
            $day->setTime(0, 0);
            while ($day < $end && $day <= $until) {
                if ((int)$day->format('N') <= 5) {
                    foreach ([$event->place, $event->place2 ?: $event->place] as $half => $place) {
                        $place = strtolower(trim($place));
                        if (in_array($place, ['cenon', 'bordeaux', 'dnum'], true)) {
                            $slots[$day->format('Y-m-d')][$half][$place][$user] = true;
                        }
                    }
                }
                $day->modify('+1 day');
            }
        }
        ksort($slots);
        foreach ($slots as $date => $halves) {
            foreach ($halves as $places) {
                foreach ($places as $place => $users) {
                    foreach (array_keys($users) as $user) {
                        foreach (array_keys($users) as $other) {
                            if ($user === $other) {
                                continue;
                            }
                            $count = ($listSeen[$user][$other]['count'] ?? 0) + 0.5;
                            $listSeen[$user][$other] = ['place' => $place, 'seen' => $date, 'count' => $count, 'load' => false];
                        }
                    }
                }
            }
        }
        ksort($listSeen, SORT_STRING);
        return new DataResponse($listSeen, 200, ['Content-Type' => 'application/json']);
    }

	public function search(String $dtStart, String $dtEnd)
	{
		$from = new DateTime($dtStart);
		$to = new DateTime($dtEnd);
		// It looks like search does not include the upper bound (end of day at 00H00)
		$to->modify('+1 day');
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

            // Selecting all the events that are in the database
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
