<?php

namespace OCA\Whereami\Controller;

use OCA\Whereami\Db\Bdd;
use OCA\Whereami\MyClass\DevisTracker;
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

        // Aggregate per user: total days and work slots by contract
        $contractByUsers = [];
        foreach ($userByContracts as $contractValue => $users) {
            foreach ($users as $userDisplayName => $total) {
                if (!isset($contractByUsers[$userDisplayName])) {
                    $contractByUsers[$userDisplayName] = ['total' => 0.0, 'contracts' => []];
                }
                $contractByUsers[$userDisplayName]['total'] += $total;
                $contractByUsers[$userDisplayName]['contracts'][$contractValue] = [
                    'days' => $total,
                    'nb' => count($contracts[$contractValue][$userDisplayName])
                ];
            }
        }

        // Return aggregated data as a JSON response
        return new DataResponse([
            'contracts' => $contracts,
            'userByContract' => $userByContracts,
            'contractByUser' => $contractByUsers
        ], 200, ['Content-Type' => 'application/json']);
    }


    /**
     * @NoAdminRequired
     * @NoCSRFRequired
     */
    public function getDevisTracker(String $dtStart, String $dtEnd)
    {
        $from = new DateTime($dtStart . ' T00:00:00');
        $to = new DateTime($dtEnd . ' T23:59:59');
        $tracker = new DevisTracker($this->calendarManager, $this->myDb, $this->logger, $from, $to);
        $events = [];
        foreach ($tracker->getEvents() as $day => $quadris) {
            $events[$day] = [];
            foreach ($quadris as $quadri => $report) {
                $events[$day][$quadri] = [
                    'isHalfDay' => $report['isHalfDay'],
                    'isAllDayDevisImportant' => $report['isAllDayDevisImportant'],
                    'events' => $report['events'],
                ];
            }
        }
        $round = function (float $value): float {
            return round($value * 8) / 8;
        };
        $summary = [];
        foreach ($tracker->getSummary() as $label => $hours) {
            $summary[$label] = ['hours' => $round($hours), 'days' => round($hours / DevisTracker::HOURS_MAX_DAY, 2)];
        }
        $summaryByUser = [];
        foreach ($tracker->getSummaryByUser() as $label => $data) {
            $users = [];
            foreach ($data['users'] as $quadri => $hours) {
                $users[$quadri] = ['hours' => $round($hours), 'days' => round($hours / DevisTracker::HOURS_MAX_DAY, 2)];
            }
            $summaryByUser[$label] = [
                'total' => ['hours' => $round($data['_sum']), 'days' => round($data['_sum'] / DevisTracker::HOURS_MAX_DAY, 2)],
                'users' => $users
            ];
        }
        return new DataResponse([
            'hoursMaxDay' => DevisTracker::HOURS_MAX_DAY,
            'events' => $events,
            'summary' => $summary,
            'summaryByUser' => $summaryByUser
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

    /**
     * Nextcloud already expands RRULE/RDATE and applies EXDATE/RECURRENCE-ID.
     * A search result contains all occurrences in `objects`, not just index 0.
     */
    public function search(String $dtStart, String $dtEnd)
    {
        $from = \DateTimeImmutable::createFromFormat('!Y-m-d', $dtStart);
        $last = \DateTimeImmutable::createFromFormat('!Y-m-d', $dtEnd);
        if (!$from || !$last || $from->format('Y-m-d') !== $dtStart
            || $last->format('Y-m-d') !== $dtEnd || $last < $from) {
            throw new \InvalidArgumentException('Invalid calendar date range');
        }
        $to = $last->modify('+1 day');
        // Filter titles per occurrence, so an edited exception with an @ title
        // is found even when the series' master title does not contain @.
        $results = $this->calendarManager->search('', [], [
            'timerange' => ['start' => $from, 'end' => $to],
            'types' => ['VEVENT'],
        ]);
        $occurrences = [];
        $seen = [];
        foreach ($results as $calendar) {
            if (isset($calendar['type']) && strtoupper($calendar['type']) !== 'VEVENT') {
                continue;
            }
            foreach ($calendar['objects'] ?? [] as $object) {
                if (!is_array($object) || strtoupper($object['STATUS'][0] ?? '') === 'CANCELLED') {
                    continue;
                }
                if (!str_starts_with(MyEvent::normalizePlace($object['SUMMARY'][0] ?? ''), '@')) {
                    continue;
                }
                // Compare scalar values, not Sabre parameter objects and their parents.
                $dates = [];
                foreach (['RECURRENCE-ID', 'DTSTART', 'DTEND'] as $property) {
                    $value = $object[$property][0] ?? null;
                    $dates[] = $value instanceof \DateTimeInterface ? $value->format('c') : $value;
                }
                // Repeated copies of the same occurrence must not inflate counts.
                $key = hash('sha256', serialize([
                    $calendar['calendar-key'] ?? '', $calendar['id'] ?? '',
                    $calendar['uid'] ?? '', $dates,
                    $object['SUMMARY'][0] ?? '', $object['DURATION'][0] ?? '',
                    (string)($object['DTSTART'][1]['VALUE'] ?? ''),
                ]));
                if (isset($seen[$key])) {
                    continue;
                }
                $seen[$key] = true;
                $occurrence = $calendar;
                $occurrence['objects'] = [$object];
                $occurrences[] = $occurrence;
            }
        }
        return $occurrences;
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
				if ($classement === 'place' && $e->place2 !== '' && $e->place2 !== $e->place) {
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

			if ($event->valid && $event->userId === $this->userId) {
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
			return MyEvent::normalizePlace($q['word']);
		}, $wordQuery);
		return $res;
	}
}
