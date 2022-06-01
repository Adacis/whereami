<?php
namespace OCA\Outils\Db;

use OCP\DB\QueryBuilder\IQueryBuilder;
use OCP\IDBConnection;



Class DevisMapper{


	private $db;

    public function __construct(IDBConnection $db) {
    	//Création d'un objet PDO pour accéder à la base.
        $this->db = $db;
    }

	/**
	Execution d'une requête sql
	*/
	private function executionSql($sql){
		$res = $this->db->prepare($sql);
		$res->execute();
		$ret = $res->fetchall(2);

		return $ret;
	}

	/**
	Execution d'une requête sql avec paramètre
	param $string, $array
	*/
	private function executionSqlParam($sql, $param){
		$res = $this->db->prepare($sql);
		$res->execute($param);
		$ret = $res->fetchall(2);
		return $ret;
	}

	//Exemple
	public function userInfo($param){
		$sql = 'SELECT IFNULL(gid, "nonadmin") as gid
				FROM oc_group_user
				WHERE oc_group_user.uid = ?';

		return $this->executionSqlParam($sql, $param);
	}

	public function getEvents(){
		$sql = 'SELECT calendardata, displayname
				FROM (oc_calendarobjects
				LEFT JOIN oc_calendars on oc_calendars.id = oc_calendarobjects.calendarid )';

		return $this->executionSql($sql);
	}

}
