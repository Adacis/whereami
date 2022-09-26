<?php
namespace OCA\Whereami\Tags;

use OCA\Whereami\Db\Bdd;
use DateTimeImmutable;
use DateTime;

class MyEvent{
    public String $id;
    public String $tags;
    public String $class;

    private Bdd $myDb;

    public function __construct($e,
                                Bdd $myDb
                                ){
        $this->myDb             = $myDb;
        $this->id               = $e['id'];
        $this->dtStart          = $e["objects"][0]["DTSTART"][0]->format("Y-m-d");
        $this->dtEnd            = $e["objects"][0]["DTEND"][0]->format("Y-m-d");
        $this->nextcloud_users  = $this->getNameCalendar($this->id);
        $this->summary          = str_replace("@","",$e["objects"][0]["SUMMARY"][0]);
        $this->place            = $this->extractData(",", 0, $this->summary);

        preg_match_all("/D[0-9]{5}/", $this->summary, $this->quote);

    }

    

}