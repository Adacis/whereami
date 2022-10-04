<?php

namespace OCA\Whereami\Db;

use OCP\IDBConnection;
use Psr\Log\LoggerInterface;

class Bdd
{
    // private String $charset = 'utf8mb4';
    private IDbConnection $pdo;
    private String $tableprefix;
    private $logger;

    public function __construct(IDbConnection $db, LoggerInterface $log)
    {
        $this->pdo = $db;
        $this->tableprefix = '*PREFIX*' . "whereami_";
        $this->logger = $log;
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
        $sql = "INSERT INTO `" . $this->tableprefix . "wordlist` (`word`,`usage`) VALUES (?,?)";
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
        $this->execSQLNoData($sql, array($word, $usage));
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
     * Add prefix to person with a label in prefixlist
     * @person
     * @prefix
     * @label
     */
    public function addPrefixToList($person, $prefix, $label)
    {
        $sql = "SELECT `id` FROM `" . $this->tableprefix . "prefixlist` WHERE `person` = ? AND `label` = ? AND `prefix` = ?";
        $res = $this->execSQLNoJsonReturn($sql, array($person, $label, $prefix));
        if (empty($res)) {
            $sql = "INSERT INTO `" . $this->tableprefix . "prefixlist` (`person`,`prefix`,`label`) VALUES (?,?,?)";
            $this->execSQLNoData($sql, array($person, $prefix, $label));
        }
    }

    /**
     * Change prefix corresponding to (person, label) if it exists, otherwise add it
     * @person
     * @prefix
     * @label
     */
    public function changeIconInPrefixList($person, $prefix, $label)
    {
        $sql = "SELECT `id` FROM `" . $this->tableprefix . "prefixlist` WHERE `person` = ? AND `label` = ?";
        $res = $this->execSQLNoJsonReturn($sql, array($person, $label));
        $id = intval($res[0]['id']);
        if (empty($res)) {
            $sql = "INSERT INTO `" . $this->tableprefix . "prefixlist` (`person`,`prefix`,`label`) VALUES (?,?,?)";
            $this->execSQLNoData($sql, array($person, $prefix, $label));
        } else {
            $sql = "UPDATE `" . $this->tableprefix . "prefixlist` SET `person` = ? ,`prefix` = ? , `label` = ?  WHERE `id` = ?";
            $this->execSQLNoData($sql, array($person, $prefix, $label, $id));
        }
    }

    /**
     * Change label corresponding to (person, prefix) if it exists, otherwise add it
     * @person
     * @prefix
     * @label
     */
    public function changeLabelInPrefixList($person, $prefix, $label)
    {
        $sql = "SELECT `id` FROM `" . $this->tableprefix . "prefixlist` WHERE `person` = ? AND `prefix` = ?";
        $res = $this->execSQLNoJsonReturn($sql, array($person, $prefix));
        $id = intval($res[0]['id']);
        if (empty($res)) {
            $sql = "INSERT INTO `" . $this->tableprefix . "prefixlist` (`person`,`prefix`,`label`) VALUES (?,?,?)";
            $this->execSQLNoData($sql, array($person, $prefix, $label));
        } else {
            $sql = "UPDATE `" . $this->tableprefix . "prefixlist` SET `person` = ? ,`prefix` = ? , `label` = ?  WHERE `id` = ?";
            $this->execSQLNoData($sql, array($person, $prefix, $label, $id));
        }
    }

    /**
     * Delete prefix in prefixlist
     * @person
     * @prefix
     * @label
     */
    public function deletePrefixInPrefixList($person, $prefix, $label)
    {
        $sql = "DELETE FROM `" . $this->tableprefix . "prefixlist` WHERE `person` = ? AND `prefix` = ? AND `label` = ?";
        $this->execSQLNoData($sql, array($person, $prefix, $label));
    }

    /**
     * Get all entries from prefix list (to instantiate UI)
     */
    public function getAllEntriesInPrefixList()
    {
        $sql = "SELECT * FROM `" . $this->tableprefix . "prefixlist`";
        return $this->execSQLNoJsonReturn($sql, array());
    }

    /**
     * Get Icons for a given personne
     */
    public function getIconsInPrefixList($person)
    {
        $person = $this->getQuadri($person);
        $sql = "SELECT prefix, label FROM `" . $this->tableprefix . "prefixlist` WHERE `person` = ?";
        return $this->execSQLNoJsonReturn($sql, array($person));
    }


    private function getQuadri($name)
    {
        if (strlen($name) < 4) {
            throw new \Exception("Name given has less than 4 letters.");
        }

        $name = preg_split('/ (-| ) /', $name);
        if (count($name) == 1) {
            $quadri = substr($name[0], 0, 4);
            return strtoupper($quadri);
        }

        $quadri = '';
        for ($i = 0; $i < count($name); $i++) {
            if ($i == count($name) - 1) {
                $quadri = $quadri . substr($name[$i], 0, 4 - $i);
            } else
                $quadri = $quadri . substr($name[$i], 0, 1);
        }
        $quadri = substr($name[0], 0, 1) . substr($name[1], 0, 3);
        return strtoupper($quadri);
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
