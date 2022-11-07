<?php

namespace OCA\Whereami\MyClass;

use OCA\Whereami\Db\Bdd;
use DateTime;

class MyEvent
{
    public String $id;
    public String $summary;
    public String $dtStart;
    public String $dtEnd;
    public String $place;
    public String $nextcloud_users;
    public $quote;

    private Bdd $myDb;

    public function __construct(
        $e,
        Bdd $myDb
    ) {
        $this->myDb             = $myDb;
        $this->id               = $e['id'];
        $this->dtStart          = $e["objects"][0]["DTSTART"][0]->modify('+ 1 minute')->format('Y-m-d H:i:s');
        $this->dtEnd            = $e["objects"][0]["DTEND"][0]->modify('- 1 minute')->format('Y-m-d H:i:s');
        $this->nextcloud_users  = $this->getNameCalendar($this->id);
        $this->summary          = str_replace("@", "", $e["objects"][0]["SUMMARY"][0]);
        $this->place            = $this->extractData(",", 0, $this->summary);

        preg_match_all("/D[0-9]{5}/", $this->summary, $this->quote);
    }

    public function toString()
    {
        return "Event at " . $this->place . " by " . $this->nextcloud_users . " From " . $this->dtStart . " to " . $this->dtStart;
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
    public function extractData($separator, $position, $data): String
    {
        $cls = strtolower($data);
        $cls = trim($cls);
        $cls = explode($separator, $cls)[$position];
        $cls = trim($cls);
        return $cls;
    }

    /**
     * test if two date intervals intersect
     */
    public function eventCross($event): bool
    {
        if ($this->dtEnd < $event->dtStart || $this->dtStart > $event->dtEnd) {
            return false;
        }
        return true;
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
     * Parse a list of events and determine last event that intersect with this event
     */
    public function parseListEvents($events, $listSeen): array
    {
        foreach ($events as $e) {
            $user = strtolower($e->nextcloud_users);
            $thisUser = strtolower($this->nextcloud_users);

            if (
                $user != $thisUser // Je ne me teste pas moi même
                &&  strtoupper($e->place) === strtoupper($this->place) // On est sur le même lieu
                &&  $this->eventCross($e) // Nos dates sont dans le même interval
            ) {
                if (array_key_exists($user, $listSeen) && $listSeen[$user]['seen'] < $this->getSeen($e)) { // La date enregistrée est plus ancienne, on l'update
                    $listSeen[$user] = [
                        'load' => False,
                        'place' => $e->place,
                        'seen' => $this->getSeen($e),
                        'count' => $listSeen[$user]['count'] + 1
                    ];
                } else if (array_key_exists($user, $listSeen)) { // La date enregistrée est plus récente, on incrémente le compteur tout de même
                    $listSeen[$user]['count'] = $listSeen[$user]['count'] + 1;
                } else { // nouvel event, on l'ajoute
                    $listSeen[$user] = [
                        'load' => False,
                        'place' => $e->place,
                        'seen' => $this->getSeen($e),
                        'count' => 1
                    ];
                }
            }
        }
        return $listSeen; // Retour 
    }
}
