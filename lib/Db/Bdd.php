<?php

namespace OCA\Whereami\Db;

use OCP\IDBConnection;

class Bdd
{
    // private String $charset = 'utf8mb4';
    private IDbConnection $pdo;
    private String $tableprefix;

    public function __construct(IDbConnection $db)
    {
        $this->pdo = $db;
        $this->tableprefix = '*PREFIX*' . "whereami_";
    }

    public function listUID()
    {
        $sql = 'SELECT * FROM `*PREFIX*accounts`';
        return $this->execSQLNoJsonReturn($sql, array());
    }

    public function getUID($uid)
    {
        $sql = 'SELECT * FROM `*PREFIX*accounts` WHERE uid = ?';
        return $this->execSQLNoJsonReturn($sql, array($uid));
    }

    public function getAllUID()
    {
        $sql = 'SELECT * FROM `*PREFIX*accounts`';
        return $this->execSQLNoJsonReturn($sql, array());
    }

    public function getCalendars($id)
    {
        $sql = 'SELECT `*PREFIX*calendars`.principaluri FROM `*PREFIX*calendarobjects`, `*PREFIX*calendars` WHERE `*PREFIX*calendarobjects`.id = ? AND `*PREFIX*calendarobjects`.calendarid = `*PREFIX*calendars`.id';
        return $this->execSQLNoJsonReturn($sql, array($id));
    }

    /**
     * Insert a word in table wordlist
     * @word 
     * @usage
     */
    public function insertWordInWordList($word, $usage)
    {
        $sql = "INSERT INTO `" . $this->tableprefix . "wordlist` (`word`,`usage`) VALUES (?,?);";
        $this->execSQLNoData($sql, array($word, $usage));
        return true;
    }

    /** 
     * Delete word from table wordlist
     * @word
     * @usage
     */
    public function deleteWordInWordList($word, $usage)
    {
        $sql = "DELETE FROM `" . $this->tableprefix . "wordlist` WHERE `word` = ? AND `usage` = ?";
        $this->execSQLNoJsonReturn($sql, array($word, $usage));
    }

    /** 
     * Delete word from table wordlist
     * @word
     * @usage
     */
    public function getWordInWordList($usage)
    {
        $sql = "SELECT word FROM `" . $this->tableprefix . "wordlist` WHERE `usage` = ?";
        return $this->execSQLNoJsonReturn($sql, array($usage));
    }


    /**
     * @sql
     * @array() //prepare statement
     */
    private function execSQL($sql, $conditions)
    {
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($conditions);
        $data = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        $stmt->closeCursor();
        return json_encode($data);
    }

    private function execSQLNoData($sql, $conditions)
    {
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($conditions);
        $stmt->closeCursor();
    }

    private function execSQLNoJsonReturn($sql, $conditions)
    {
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($conditions);
        $data = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        $stmt->closeCursor();
        return $data;
    }
}
