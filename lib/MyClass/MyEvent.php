<?php

namespace OCA\Whereami\MyClass;

use OCA\Whereami\Db\Bdd;
use DateTime;
use Psr\Log\LoggerInterface;

class MyEvent
{
    public string $id;
    public string $summary;
    public ?string $dtStart;
    public ?string $dtEnd;
    public string $place;
    public string $place2;
    public string $nextcloud_users;
    public $quote;

    public bool $valid;

    private LoggerInterface $log;

    private Bdd $myDb;

    public function __construct(
        $e,
        Bdd $myDb,
        LoggerInterface $logger,
    ) {
        $this->log = $logger;
        $this->myDb             = $myDb;
        $this->id               = $e['id'];
        $this->dtStart          = ($e["objects"][0]["DTSTART"][0] ?? null)?->modify('+ 1 minute')?->format('Y-m-d H:i:s');
        $this->dtEnd            = ($e["objects"][0]["DTEND"][0] ?? null)?->modify('- 1 minute')?->format('Y-m-d H:i:s') ?? $this->dtStart;
        $this->nextcloud_users  = $this->getNameCalendar($this->id);
        $this->summary          = str_replace("@", "", $e["objects"][0]["SUMMARY"][0] ?? '');

        $tmp                    = $this->extractData(",", 0, $e["objects"][0]["SUMMARY"][0] ?? '');
        if (!is_null($this->dtStart) && count($tmp) > 0) {
            $this->place = $tmp[0];
            if (count($tmp) >= 2) {
                $this->place2 = $tmp[1];
            } else {
                $this->place2 = '';
            }
            $this->valid = true;
        } else {
            $this->valid = false;
        }

        preg_match_all("/D[0-9]{5}/", $this->summary, $this->quote);
    }

    public function toString()
    {
        return "Event at " . $this->place . '/' . $this->place2 . " by " . $this->nextcloud_users . " From " . $this->dtStart . " to " . $this->dtStart;
    }

    public function getNameCalendar($calendarsUid)
    {
        $res = $this->myDb->getCalendars($calendarsUid)[0]["principaluri"];
        $name = $this->myDb->getUID(str_replace("principals/users/", "", $res));
        $myObj = json_decode($name[0]['data']);
        $parameters = $myObj->displayname->value;
        if (empty($parameters))
            $parameters = "Non affecté";
        return $parameters;
    }

    public function getDtStart()
    {
        return $this->dtStart->format("d/m/Y");
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
        $re = '/^@\s*([^' . $separator . '\s]+)(' . $separator . '\s?@\s*([^' . $separator . '\s]+))?.*/m';

        preg_match_all($re, strtolower($data), $matches, PREG_SET_ORDER, 0);

        try {
            $cls = [];
            if (isset($matches[0][1])) {
                $cls[] = $matches[0][1];
            }
            if (count($matches[0] ?? []) >= 4) {
                $cls[] = $matches[0][3];
            }
        } catch (\Throwable $th) {
            $cls = [];
        }

        return $cls;
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
