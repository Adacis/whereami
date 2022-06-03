<?php
namespace OCA\Whereami\Db;

use OCP\DB\QueryBuilder\IQueryBuilder;
use OCP\IDBConnection;



Class OutilsMapper{


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

    /**
	Liste de l'ensemble des tâches de tous les collaborateurs
    */
	public function listetaches() {
		$sql = 'SELECT 	IFNULL(deck_assigned.data, "Non affecté") as "affecté à",
						deck_assigned.uid as "uid_affectation",
						oc_deck_stacks.title as "Etat tache", 
						oc_deck_cards.title as "nom tache", 
						responsable.displaynameowner as "responsable", 
						responsable.title as "nom du client",
						responsable.id as "boardid",
						oc_deck_cards.id as "cardid"
				FROM (((oc_deck_stacks
				LEFT JOIN (	SELECT id, title, owner, data as displaynameowner 
							FROM oc_deck_boards, oc_accounts 
							WHERE oc_accounts.uid = oc_deck_boards.owner) responsable 
						ON oc_deck_stacks.board_id = responsable.id)
				LEFT JOIN oc_deck_cards 
						ON oc_deck_cards.stack_id = oc_deck_stacks.id)
				LEFT JOIN (	SELECT * 
							FROM oc_deck_assigned_users, oc_accounts 
							WHERE oc_accounts.uid = oc_deck_assigned_users.participant) deck_assigned 
				ON deck_assigned.card_id = oc_deck_cards.id)
				WHERE archived < 1
				AND oc_deck_cards.deleted_at = 0';

		return $this->executionSql($sql);
	}


	/**
	Liste du nombre de tâches par collaborateur
	*/
	public function listeNbTache() {
		$sql = 'SELECT 	IFNULL(data, "Non affecté") as "affecté à",
						IFNULL(deck_assigned.data, "Non affecté") as "affecté à",
						deck_assigned.uid as "uid_affectation",
						count(oc_deck_cards.title) as "nb tache",
						oc_group_user.gid as "admin"
				FROM (((oc_deck_stacks
				LEFT JOIN (	SELECT id, title, owner, data as displaynameowner 
							FROM oc_deck_boards, oc_accounts 
							WHERE oc_accounts.uid = oc_deck_boards.owner) responsable 
						ON oc_deck_stacks.board_id = responsable.id)
				LEFT JOIN oc_deck_cards 
						ON oc_deck_cards.stack_id = oc_deck_stacks.id)
				LEFT JOIN (	SELECT * 
							FROM oc_deck_assigned_users, oc_accounts 
							WHERE oc_accounts.uid = oc_deck_assigned_users.participant) deck_assigned 
						ON deck_assigned.card_id = oc_deck_cards.id)
                LEFT JOIN oc_group_user 
                		ON deck_assigned.uid = oc_group_user.uid
				WHERE archived < 1
				AND oc_deck_cards.deleted_at = 0
				GROUP BY data
				ORDER BY data asc';

		return $this->executionSql($sql);

	}

	public function userInfo($param){
		$sql = 'SELECT IFNULL(gid, "nonadmin") as gid
				FROM oc_group_user
				WHERE oc_group_user.uid = ?';

		return $this->executionSqlParam($sql, $param);
	}



}
