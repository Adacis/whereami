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

    public function getCalendarsFromUID($uid)
    {
        $principalUri = "principals/users/" . $uid;
        $sql = 'SELECT * FROM `*PREFIX*calendars` WHERE `*PREFIX*calendars`.principaluri = ?';
        return $this->execSQLNoJsonReturn($sql, array($principalUri));
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
    public function getIconsInPrefixList($person, $label)
    {
        $person = $this->getQuadri($person);
        if ($label == "") {
            $sql = "SELECT prefix, label FROM `" . $this->tableprefix . "prefixlist` WHERE `person` = ?";
            return $this->execSQLNoJsonReturn($sql, array($person));
        } else {
            $sql = "SELECT prefix, label FROM `" . $this->tableprefix . "prefixlist` WHERE `person` = ? AND `label` = ?";
            return $this->execSQLNoJsonReturn($sql, array($person, $label));
        }
    }

    /**
     * Retrieve activity reports for contracts within a specified date range.
     *
     * This method fetches activity reports including the number of contracts (`nb_contract`),
     * associated usernames (`username`), aggregated activity values (`activity_report_value`),
     * and corresponding dates (`activity_report_date`) for a given time period.
     *
     * @param string $dtStart The start date of the date range (YYYY-MM-DD format).
     * @param string $dtEnd The end date of the date range (YYYY-MM-DD format).
     * @return array Fetched database results containing activity report details.
     */
    public function getContracts($dtStart, $dtEnd){
        $sql = "SELECT 
                    value as nb_contract,
                    username,
                    sum(past_times) AS activity_report_value,
                    CAST(first_occurence AS DATE) AS activity_report_date
                FROM (
                      SELECT 
                        ocp.value,
                        REPLACE(SUBSTRING_INDEX(ocal.principaluri, '/', -1), ' ', '') AS username,
                        FROM_UNIXTIME(oc.firstoccurence) AS first_occurence,
                        FROM_UNIXTIME(oc.lastoccurence) AS last_occurence,
                        CASE WHEN 
                            (DATEDIFF(FROM_UNIXTIME(oc.lastoccurence),FROM_UNIXTIME(oc.firstoccurence))) <= 0.5 then 0.5 else 1
                        END AS past_times
                    FROM
                        `*PREFIX*calendarobjects_props` ocp
                    LEFT JOIN
                        `*PREFIX*calendarobjects` oc ON ocp.objectid = oc.id
                    LEFT JOIN
                        `*PREFIX*calendars` ocal ON ocp.calendarid = ocal.id
                    WHERE
                        name = 'SUMMARY'
                        AND ocp.value REGEXP '^[dD][0-9]{5}$'
                        AND FROM_UNIXTIME(oc.firstoccurence) BETWEEN ? AND ?
                ) sr
                GROUP BY 
                    value, user, first_occurence";
        return $this->execSQLNoJsonReturn($sql, array($dtStart, $dtEnd));
    }


    private function getQuadri($name)
    {
        if (strlen($name) < 4) {
            throw new \Exception("Name given has less than 4 letters : " . $name);
        }

        $name = preg_split('/(-|\s)/', $name);
        if (count($name) == 1) {
            $quadri = substr($name[0], 0, 4);
            return strtoupper($quadri);
        }

        $quadri = '';
        for ($i = 0; $i < count($name); $i++) {
            if ($i == count($name) - 1)
                $quadri = $quadri . substr($name[$i], 0, 4 - $i);
            else
                $quadri = $quadri . substr($name[$i], 0, 1);
        }
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
