<?php

namespace OCA\Whereami\MyClass;

use OCA\Whereami\Db\Bdd;
use DateTime;
use Psr\Log\LoggerInterface;

class MyEvent
{
    public String $id;
    public String $summary;
    public String $dtStart;
    public String $dtEnd;
    public String $place;
    public String $place2;
    public String $nextcloud_users;
    public $quote;

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
        $this->dtStart          = $e["objects"][0]["DTSTART"][0]->modify('+ 1 minute')->format('Y-m-d H:i:s');
        $this->dtEnd            = $e["objects"][0]["DTEND"][0]->modify('- 1 minute')->format('Y-m-d H:i:s');
        $this->nextcloud_users  = $this->getNameCalendar($this->id);
        $this->summary          = str_replace("@", "", $e["objects"][0]["SUMMARY"][0]);

        $tmp                    = $this->extractData(",", 0, $e["objects"][0]["SUMMARY"][0]);
        $this->place = $tmp[0];
        if (count($tmp) >= 2) {
            $this->place2 = $tmp[1];
        } else {
            $this->place2 = '';
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
        $parameters = $myObj->{'displayname'}->{'value'};
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
        $re = '/@([^' . $separator . '\s]+)(' . $separator . '\s?@([^' . $separator . '\s]+))?.*/m';

        preg_match_all($re, strtolower($data), $matches, PREG_SET_ORDER, 0);

        $cls = [$matches[0][1]];
        if (count($matches[0]) >= 4) {
            array_push($cls, $matches[0][3]);
        }
        return $cls;
    }

    /**
     * test if two date intervals intersect, return 0 if event do not cross, return the length of intersection otherwise
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

    function getPlaceCommon($e): String
    {
        if ($this->nextcloud_users != $e->nextcloud_users) {
            $this->log->debug('First in comp : ' . $this->toString());
            $this->log->debug('Second in comp : ' . $e->toString());
        }
        if (strtoupper($e->place) === strtoupper($this->place)) {
            return $e->place;
        } else if (strtoupper($this->place2) === strtoupper($e->place)) {
            return $e->place;
        } else if (strtoupper($e->place2) === strtoupper($this->place)) {
            return $e->place2;
        } else if (strtoupper($this->place2) === strtoupper($e->place2)) {
            return $this->place2;
        }
        return '';
    }

    /**
     * Parse a list of events and determine last event that intersect with this event
     */
    public function parseListEvents($events, $listSeen, $toExclude): array
    {
        foreach ($events as $e) {
            $user = strtolower($e->nextcloud_users);
            $thisUser = strtolower($this->nextcloud_users);
            $inter = $this->eventCross($e);
            $commonPlace = $this->getPlaceCommon($e);
            if (
                $user != $thisUser // Je ne me teste pas moi même
                &&  $commonPlace != '' // On est sur le même lieu une partie de la journée
                &&  !in_array($commonPlace, $toExclude)
                &&  $inter // Nos dates sont dans le même interval
            ) {
                if (array_key_exists($user, $listSeen) && $listSeen[$user]['seen'] < $this->getSeen($e)) { // La date enregistrée est plus ancienne, on l'update
                    $listSeen[$user] = [
                        'load' => False,
                        'place' => $commonPlace,
                        'seen' => $this->getSeen($e),
                        'count' => $listSeen[$user]['count'] + $inter
                    ];
                } else if (array_key_exists($user, $listSeen)) { // La date enregistrée est plus récente, on incrémente le compteur tout de même
                    $listSeen[$user]['count'] = $listSeen[$user]['count'] + $inter;
                } else { // nouvel event, on l'ajoute
                    $listSeen[$user] = [
                        'load' => False,
                        'place' => $commonPlace,
                        'seen' => $this->getSeen($e),
                        'count' => $inter
                    ];
                }
            }
        }
        return $listSeen; // Retour 
    }
}
