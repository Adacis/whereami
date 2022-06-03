<?php
namespace OCA\Whereami\MyClass;

use OCA\Whereami\Db\Bdd;

class MyEvent{
    public String $id;
    public String $summary;
    public $calendarName;
	
    
    private Bdd $myDb;

    public function __construct($e,
                                Bdd $myDb
                                ){
        $this->myDb = $myDb;
        $this->id = $e['id'];
        $this->summary = $e["objects"][0]["SUMMARY"][0];
        $this->nextcloud_users = $this->getNameCalendar($this->id);
        $this->obj = $e;
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
}