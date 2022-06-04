<?php
namespace OCA\Whereami\MyClass;

use OCA\Whereami\Db\Bdd;
use DateTimeImmutable;

class MyEvent{
    public String $id;
    public String $summary;
    private DateTimeImmutable $dtStart;
    private DateTimeImmutable $dtEnd;

    public $calendarName;
	
    
    private Bdd $myDb;

    public function __construct($e,
                                Bdd $myDb
                                ){
        $this->myDb = $myDb;
        $this->id = $e['id'];
        $this->summary  = $e["objects"][0]["SUMMARY"][0];
        $this->dtStart  = $e["objects"][0]["DTSTART"][0];
        $this->dtEnd    = $e["objects"][0]["DTEND"][0];
        $this->nextcloud_users = $this->getNameCalendar($this->id);
        // $this->obj = $e;
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