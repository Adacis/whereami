<?php
namespace OCA\Whereami\Db;

use OCP\IDBConnection;

class Bdd {
    // private String $charset = 'utf8mb4';
    private IDbConnection $pdo;

    public function __construct(IDbConnection $db) {
        $this->pdo = $db;
    }

    public function listUID(){
        $sql = 'SELECT * FROM `*PREFIX*accounts`';
        return $this->execSQLNoJsonReturn($sql, array());
    }

    public function getUID($uid){
        $sql = 'SELECT * FROM `*PREFIX*accounts` WHERE uid = ?';
        return $this->execSQLNoJsonReturn($sql, array($uid));
    }

    public function getCalendars($id){
        $sql = 'SELECT `*PREFIX*calendars`.principaluri FROM `*PREFIX*calendarobjects`, `*PREFIX*calendars` WHERE `*PREFIX*calendarobjects`.id = ? AND `*PREFIX*calendarobjects`.calendarid = `*PREFIX*calendars`.id';
        return $this->execSQLNoJsonReturn($sql, array($id));
    }

    /**
     * @sql
     * @array() //prepare statement
     */
    private function execSQL($sql, $conditions){
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($conditions);
        $data = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        $stmt->closeCursor();
        return json_encode($data);
    }

    private function execSQLNoData($sql, $conditions){
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($conditions);
        $stmt->closeCursor();
    }

    private function execSQLNoJsonReturn($sql, $conditions){
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($conditions);
        $data = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        $stmt->closeCursor();
        return $data;
    }
}