<?php
namespace OCA\Whereami\MyClass;

use OCA\Whereami\Db\Bdd;
use DateTimeImmutable;

class MyEvent{
    public String $id;
    public String $summary;
    public String $dtStart;
    public String $dtEnd;
    public $quote;

    private Bdd $myDb;

    public function __construct($e,
                                Bdd $myDb
                                ){
        $this->myDb = $myDb;
        $this->id = $e['id'];
        $this->dtStart  = $e["objects"][0]["DTSTART"][0]->format("Y-m-d");
        $this->dtEnd    = $e["objects"][0]["DTEND"][0]->format("Y-m-d");
        $this->nextcloud_users = $this->getNameCalendar($this->id);

        $this->summary  = str_replace("@","",$e["objects"][0]["SUMMARY"][0]);
        preg_match_all("/D[0-9]{5}/", $this->summary, $this->quote);

    }

    public function getNameCalendar($calendarsUid){
        $res = $this->myDb->getCalendars($calendarsUid)[0]["principaluri"];
        $name = $this->myDb->getUID(str_replace("principals/users/", "", $res));
        $myObj = json_decode($name[0]['data']);
        $parameters = $myObj->{'displayname'}->{'value'};
        if(empty($parameters))
            $parameters="Non affecté";
        return $parameters;
    }

    public function getDtStart(){
        return $this->dtStart->format("d/m/Y");
    }

    public function getDtEnd(){
        return $this->dtEnd->format("d/m/Y");
    }

    public function inInterval($d){
        if($d >= $this->dtStart
            && $d < $this->dtEnd){
                return true;
            }
        return false;
    }
}