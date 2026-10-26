<?php

namespace OCA\Whereami\MyClass;

use OCA\Whereami\Db\Bdd;
use DateTime;
use Psr\Log\LoggerInterface;

class MyEvent
{
    public string $id;
    public string $summary;
    public ?string $dtStart = null;
    public ?string $dtEnd = null;
    public string $place = '';
    public string $place2 = '';
    public string $nextcloud_users = '';
    public string $userId = '';
    public bool $allDay = false;
    public $quote;

    public bool $valid = false;

    private LoggerInterface $log;

    private Bdd $myDb;

    public function __construct(
        $e,
        Bdd $myDb,
        LoggerInterface $logger,
    ) {
        $this->log = $logger;
        $this->myDb             = $myDb;
        $this->id = (string)($e['id'] ?? '');
        $object = $e['objects'][0] ?? [];
        $summary = $object['SUMMARY'][0] ?? '';
        $this->summary = str_replace('@', '', $summary);
        preg_match_all('/D[0-9]{5}/i', $this->summary, $this->quote);
        $places = $this->extractData(',', 0, $summary);
        if (!$places || strtoupper($object['STATUS'][0] ?? '') === 'CANCELLED') {
            return;
        }
        $start = $object['DTSTART'][0] ?? null;
        if (!$start instanceof \DateTimeInterface) {
            $this->log->warning('Ignoring Whereami occurrence without a valid DTSTART', ['id' => $this->id]);
            return;
        }
        // Never modify DateTime instances owned by the calendar provider.
        $start = \DateTimeImmutable::createFromInterface($start);
        $this->allDay = strtoupper((string)($object['DTSTART'][1]['VALUE'] ?? '')) === 'DATE';
        $end = $object['DTEND'][0] ?? null;
        if ($end instanceof \DateTimeInterface) {
            $end = \DateTimeImmutable::createFromInterface($end);
        } elseif (isset($object['DURATION'][0])) {
            try {
                $end = $start->add(new \DateInterval($object['DURATION'][0]));
            } catch (\Exception $exception) {
                $this->log->warning('Ignoring Whereami occurrence with invalid duration', ['id' => $this->id]);
                return;
            }
        } elseif ($this->allDay) {
            // RFC 5545: a DATE event without DTEND lasts one calendar day.
            $end = $start->modify('+1 day');
        } else {
            $this->log->warning('Ignoring Whereami occurrence without an end', ['id' => $this->id]);
            return;
        }
        if ($end <= $start) {
            $this->log->warning('Ignoring Whereami occurrence with an empty or reversed interval', ['id' => $this->id]);
            return;
        }
        // DATE values are civil dates: a browser timezone must not move them to
        // the previous day. Timed events retain their explicit UTC offset.
        $format = $this->allDay ? 'Y-m-d\TH:i:s' : 'Y-m-d\TH:i:sP';
        $this->dtStart = $start->format($format);
        $this->dtEnd = $end->format($format);
        $this->place = $places[0];
        $this->place2 = $places[1] ?? '';
        $this->nextcloud_users = $this->getNameCalendar($this->id);
        $this->valid = true;
    }

    public function toString()
    {
        return "Event at " . $this->place . '/' . $this->place2 . " by " . $this->nextcloud_users . " From " . $this->dtStart . " to " . $this->dtStart;
    }

    public function getNameCalendar($calendarsUid)
    {
        $res = $this->myDb->getCalendars($calendarsUid)[0]["principaluri"];
        $this->userId = str_replace("principals/users/", "", $res);
        $name = $this->myDb->getUID($this->userId);
        $myObj = json_decode($name[0]['data']);
        $parameters = $myObj->displayname->value;
        if (empty($parameters))
            $parameters = "Non affecté";
        return $parameters;
    }

    public function getDtStart()
    {
        return (new DateTime($this->dtStart))->format("d/m/Y");
    }

    /**
     * Check if a date is in an interval
     */
    public function inInterval($d)
    {
        if (
            $d >= $this->dtStart
            && $d < $this->dtEnd
        ) {
            return true;
        }
        return false;
    }

    // /**
    //  * Check if a date is in an interval
    //  */
    // public function inIntervalNotStrict($d){
    //     if($d >= $this->dtStart
    //         && $d <= $this->dtEnd){
    //             return true;
    //         }
    //     return false;
    // }

    /**
     * Clean data
     */
    public function extractData($separator, $position, $data): array
    {
        $data = self::normalizePlace($data);
        if (!preg_match('/^@\s*([^,@]+)(?:,\s*@\s*([^,@]+))?/u', $data, $matches)) {
            return [];
        }
        $places = [trim($matches[1])];
        if (isset($matches[2]) && trim($matches[2]) !== '') {
            $places[] = trim($matches[2]);
        }
        return $places[0] !== '' ? $places : [];
    }

    public static function normalizePlace(string $value): string
    {
        // Calendar clients can introduce NBSPs, decomposed accents or a BOM.
        $value = preg_replace('/\x{FEFF}/u', '', $value);
        $value = trim(preg_replace('/[\p{Z}\s]+/u', ' ', $value));
        if (class_exists('\Normalizer')) {
            $value = \Normalizer::normalize($value, \Normalizer::FORM_C);
        }
        return mb_strtolower($value, 'UTF-8');
    }

    /**
     * Test if two date intervals intersect, return 0 if event do not cross, return the length of intersection otherwise
     */
    public function eventCross($event): int
    {
        if ($this->dtEnd < $event->dtStart || $this->dtStart > $event->dtEnd) {
            return 0;
        }
        if ($this->dtEnd >= $event->dtEnd && $this->dtStart <= $event->dtStart) {
            $dateEnd = new Datetime($event->dtEnd);
            $dateStart = new Datetime($event->dtStart);
        } else if ($this->dtEnd <= $event->dtEnd && $this->dtStart >= $event->dtStart) {
            $dateEnd = new Datetime($this->dtEnd);
            $dateStart = new Datetime($this->dtStart);
        } else if ($this->dtEnd >= $event->dtEnd && $this->dtStart >= $event->dtStart) {
            $dateEnd = new Datetime($event->dtEnd);
            $dateStart = new Datetime($this->dtStart);
        } else {
            $dateEnd = new Datetime($this->dtEnd);
            $dateStart = new Datetime($event->dtStart);
        }
        $inter = $dateEnd->modify('+1 minute')->diff($dateStart->modify('-1 minute'))->days;
        return $inter;
    }

    /**
     * Get when event have seen, you need to check if eventCross before
     */
    public function getSeen($e)
    {
        if ($this->dtEnd > $e->dtEnd) {
            return (new DateTime($e->dtEnd))->format("Y-m-d");
        } else {
            return (new DateTime($this->dtEnd))->format("Y-m-d");
        }
    }

    /**
     * Gets the place in common between 2 events, return empty string if nothing in common
     */
    function getPlaceCommon($e): String
    {
        if (strtoupper($e->place) === strtoupper($this->place)) {
            return $e->place;
        } else if (strtoupper($this->place2) === strtoupper($e->place) && $e->place2 == '') {
            return $e->place;
        } else if (strtoupper($e->place2) === strtoupper($this->place) && $this->place2 == '') {
            return $e->place2;
        } else if (strtoupper($this->place2) === strtoupper($e->place2)) {
            return $this->place2;
        }
        return '';
    }

    /**
     * Parse a list of events and determine the last event that intersects with each event.
     *
     * @param array $events List of events to parse.
     * @param array $listSeen Previously seen events to compare against.
     * @param array $toExclude List of places to exclude from consideration.
     * @return array Updated list of seen events after processing the input events.
     */
    public function parseListEvents($events, $listSeen, $toExclude): array
    {
        foreach ($events as $e) {
            $user = strtolower($e->nextcloud_users);
            $thisUser = strtolower($this->nextcloud_users);
            $intersects = $this->eventCross($e);
            $commonPlace = $this->getPlaceCommon($e);

            // Check conditions for updating seen events
            if (
                $user != $thisUser // Exclude self-comparison
                && $commonPlace != '' // Events share a common place during part of the day
                && !in_array($commonPlace, $toExclude) // Common place is not in the exclusion list
                && $intersects // Events have intersecting dates
            ) {
                // Update or add to the list of seen events for the user
                if (array_key_exists($user, $listSeen) && $listSeen[$user]['seen'] < $this->getSeen($e)) {
                    // Update existing seen event if the current event is more recent
                    $listSeen[$user] = [
                        'load' => false,
                        'place' => $commonPlace,
                        'seen' => $this->getSeen($e),
                        'count' => $listSeen[$user]['count'] + $intersects
                    ];
                } else if (array_key_exists($user, $listSeen)) {
                    // Increment the counter of seen events if the current event is not more recent
                    $listSeen[$user]['count'] = $listSeen[$user]['count'] + $intersects;
                } else {
                    // Add new event to the list of seen events
                    $listSeen[$user] = [
                        'load' => false,
                        'place' => $commonPlace,
                        'seen' => $this->getSeen($e),
                        'count' => $intersects
                    ];
                }
            }
        }
        return $listSeen;
    }

    public function parseListContracts($contracts, $userContracts, $allEvents, $userId)
    {
        foreach($contracts as $c) {
            $daysWorkedOnThisContractForThisUser = 0;
            foreach($allEvents as $e){
                if(strtolower($e->nextcloud_users) == $userId){
                    $daysWorkedOnThisContractForThisUser++;
                }
            }
            if (!array_key_exists($c, $userContracts)) {
				$userContracts[$c] = [];
			}
            $userContracts[$c] = $daysWorkedOnThisContractForThisUser;
        }
        return $userContracts;
    }
}
