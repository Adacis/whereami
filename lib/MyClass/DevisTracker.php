<?php

namespace OCA\Whereami\MyClass;

use OCA\Whereami\Db\Bdd;
use OCP\Calendar\IManager;
use Psr\Log\LoggerInterface;

class DevisTracker
{
    public const HOURS_MAX_DAY = 8.0;
    public const HOLIDAY_TAGS = ['@rtt', '@congés', '@férié'];

    private IManager $calendarManager;
    private Bdd $db;
    private LoggerInterface $logger;
    private \DateTime $startDate;
    private \DateTime $endDate;
    private array $events = [];
    private array $summary = [];
    private array $summaryByUser = [];

    /**
     * @param IManager $calendarManager
     * @param Bdd $db
     * @param LoggerInterface $logger
     * @param \DateTime $startDate
     * @param \DateTime $endDate
     * @param array $usersQuadri
     * @param array $listwords
     */
    public function __construct(
        IManager $calendarManager,
        Bdd $db,
        LoggerInterface $logger,
        \DateTime $startDate,
        \DateTime $endDate,
        array $usersQuadri = [],
        array $listwords = []
    ) {
        $this->calendarManager = $calendarManager;
        $this->db = $db;
        $this->logger = $logger;
        $this->startDate = $startDate;
        $this->endDate = $endDate;
        $this->run($usersQuadri, $listwords);
    }

    public function getEvents(): array
    {
        return $this->events;
    }

    public function getSummary(): array
    {
        return $this->summary;
    }

    public function getSummaryByUser(): array
    {
        return $this->summaryByUser;
    }

    private function run(array $usersQuadri, array $listwords): void
    {
        $occurrences = $this->findOccurrences();
        $data = [];
        $days = new \DatePeriod(
            (clone $this->startDate)->setTime(0, 0, 0),
            new \DateInterval('P1D'),
            (clone $this->endDate)->setTime(0, 0, 0)
        );
        foreach ($days as $day) {
            $data['all'][$day->format('Y-m-d')] = [];
        }
        foreach ($occurrences as $occurrence) {
            $calendar = $occurrence['calendar'];
            $event = $occurrence['event'];
            $user = $this->userFromCalendar($calendar);
            if ($user === null) {
                continue;
            }
            if (count($usersQuadri) > 0 && !in_array($user['quadri'], $usersQuadri, true)) {
                continue;
            }
            $dtStart = $event['DTSTART'][0] ?? null;
            $dtEnd = $event['DTEND'][0] ?? null;
            if (!$dtStart instanceof \DateTimeInterface) {
                continue;
            }
            if (!$dtEnd instanceof \DateTimeInterface) {
                $duration = $event['DURATION'][0] ?? null;
                if ($duration === null) {
                    continue;
                }
                $dtEnd = (clone $dtStart)->add($duration instanceof \DateInterval ? $duration : new \DateInterval($duration));
            }
            $summary = trim((string)($event['SUMMARY'][0] ?? ''));
            if ($summary === '') {
                continue;
            }
            if (count($listwords) > 0 && !$this->matchesListwords($summary, $listwords)) {
                continue;
            }
            $this->addEvent($data, $user['quadri'], $dtStart, $dtEnd, $summary, (string)($event['UID'][0] ?? ''));
        }
        foreach ($data as $quadri => $quadriEvents) {
            if ($quadri === 'all') {
                continue;
            }
            foreach ($this->normalizeEvents($quadriEvents) as $day => $report) {
                $this->events[$day][$quadri] = $report;
            }
        }
        foreach ($data['all'] ?? [] as $day => $quadris) {
            if (!isset($this->events[$day])) {
                continue;
            }
            ksort($this->events[$day]);
        }
        ksort($this->events);
        $this->computeSummary();
    }

    /**
     * Search the team calendars for the period, like PageController::search,
     * but keeps the calendar and the raw event.
     *
     * @return array
     */
    private function findOccurrences(): array
    {
        $from = \DateTimeImmutable::createFromFormat('!Y-m-d', $this->startDate->format('Y-m-d'));
        $last = \DateTimeImmutable::createFromFormat('!Y-m-d', $this->endDate->format('Y-m-d'));
        $to = $last->modify('+1 day');
        $results = $this->calendarManager->search('', [], [
            'timerange' => ['start' => $from, 'end' => $to],
            'types' => ['VEVENT'],
        ]);
        $occurrences = [];
        foreach ($results as $calendar) {
            if (isset($calendar['type']) && strtoupper($calendar['type']) !== 'VEVENT') {
                continue;
            }
            foreach ($calendar['objects'] ?? [] as $object) {
                if (!is_array($object) || strtoupper($object['STATUS'][0] ?? '') === 'CANCELLED') {
                    continue;
                }
                $occurrences[] = ['calendar' => $calendar, 'event' => $object];
            }
        }
        return $occurrences;
    }

    private function userFromCalendar(array $calendar): ?array
    {
        $principaluri = $calendar['principaluri'] ?? '';
        $quadri = strtoupper(trim(explode('/', $principaluri)[1] ?? ''));
        if (strlen($quadri) !== 4) {
            return null;
        }
        $uid = str_replace(' ', '', explode('/', $principaluri)[1] ?? '');
        $users = $this->db->getUID($uid);
        if (empty($users)) {
            return null;
        }
        $myObj = json_decode($users[0]['data']);
        if (!$myObj || !isset($myObj->displayname->value)) {
            return null;
        }
        return ['quadri' => $quadri, 'name' => strtolower($myObj->displayname->value)];
    }

    private function matchesListwords(string $summary, array $listwords): bool
    {
        foreach ($listwords as $word) {
            if (stripos($summary, $word) !== false) {
                return true;
            }
        }
        return false;
    }

    /**
     * Spread an event over the days of the period, one slot per day.
     *
     * @param array $data
     * @param string $quadri
     * @param \DateTimeInterface $dtStart
     * @param \DateTimeInterface $dtEnd
     * @param string $summary
     * @param string $uidEvent
     */
    private function addEvent(array &$data, string $quadri, \DateTimeInterface $dtStart, \DateTimeInterface $dtEnd, string $summary, string $uidEvent): void
    {
        $eventStart = clone $dtStart;
        $eventEnd = clone $dtEnd;
        if ($eventEnd < $eventStart) {
            $eventEnd = (clone $eventStart)->modify('+30 minutes');
        }
        $isAllDay = $eventStart->format('H:i:s') === '00:00:00' && $eventEnd->format('H:i:s') === '00:00:00' && $eventEnd->format('Y-m-d') > $eventStart->format('Y-m-d');
        $periodEnd = $isAllDay ? (clone $eventEnd)->modify('-1 day') : (clone $eventEnd)->setTime(23, 59, 59);
        $period = new \DatePeriod(
            (clone $eventStart)->setTime(0, 0, 0),
            new \DateInterval('P1D'),
            $periodEnd
        );
        $days = 0;
        foreach ($period as $day) {
            $days++;
            $key = $day->format('Y-m-d');
            $data[$quadri][$key][] = [
                'uid' => $uidEvent,
                'summary' => $summary,
                'hours' => 1,
                'isAllDay' => $isAllDay,
                'day' => $key,
            ];
        }
    }

    /**
     * Build the per-day report: split events by devis/holiday, cap hours to the
     * working day, handle half days and "!"/"?" markers.
     *
     * @param array $quadriEvents
     * @return array
     */
    private function normalizeEvents(array $quadriEvents): array
    {
        $result = [];
        foreach ($quadriEvents as $day => $events) {
            $date = new \DateTime($day . 'T12:00:00');
            $isWeekend = $date->format('N') >= 6;
            $isHalfDay = $this->isHalfDayEventsDay($events);
            $hoursMaxDay = $isHalfDay ? self::HOURS_MAX_DAY / 2 : self::HOURS_MAX_DAY;
            $eventsByUid = [];
            $report = [
                'isWeekend' => $isWeekend,
                'isHalfDay' => $isHalfDay,
                'hoursMaxDay' => $hoursMaxDay,
                'isAllDayDevisImportant' => false,
                'events' => [],
            ];
            foreach ($events as $event) {
                $uid = $event['uid'] !== '' ? $event['uid'] : $event['summary'];
                if (isset($eventsByUid[$uid])) {
                    continue;
                }
                $eventsByUid[$uid] = true;
                $eventDays = 0;
                foreach ($quadriEvents as $otherDay => $otherEvents) {
                    foreach ($otherEvents as $otherEvent) {
                        if ($otherEvent['uid'] === $event['uid'] || ($event['uid'] === '' && $otherEvent['summary'] === $event['summary'])) {
                            $eventDays++;
                        }
                    }
                }
                $eventDays = max(1, $eventDays);
                $hours = 1 / $eventDays;
                $hours = min($hours, $hoursMaxDay);
                $base = [
                    'summary' => $event['summary'],
                    'isAllDay' => $event['isAllDay'],
                    'hours' => 0.0,
                    'isDevis' => false,
                    'devis' => null,
                    'isHoliday' => false,
                    'holiday' => null,
                    'isAllDayDevisImportant' => false,
                    'isIgnoreEvent' => $this->isIgnoreEvent($event['summary']),
                ];
                $devis = $this->getDevis($event['summary']);
                $holidays = $this->getHoliday($event['summary']);
                if (count($devis) > 0) {
                    foreach ($devis as $number) {
                        $eventDevis = $base;
                        $eventDevis['isDevis'] = true;
                        $eventDevis['devis'] = strtoupper($number);
                        $eventDevis['hours'] = $hours / count($devis);
                        $eventDevis['isAllDayDevisImportant'] = $this->isAllDayDevisImportant($eventDevis);
                        if ($eventDevis['isAllDayDevisImportant']) {
                            $report['isAllDayDevisImportant'] = true;
                        }
                        $report['events'][] = $eventDevis;
                    }
                    continue;
                }
                if (count($holidays) > 0) {
                    foreach ($holidays as $type) {
                        $eventHoliday = $base;
                        $eventHoliday['isHoliday'] = true;
                        $eventHoliday['holiday'] = $type;
                        $eventHoliday['hours'] = $hours;
                        $report['events'][] = $eventHoliday;
                    }
                    continue;
                }
                if ($event['isAllDay']) {
                    continue;
                }
                $base['hours'] = $hours;
                $report['events'][] = $base;
            }
            if ($report['isAllDayDevisImportant']) {
                foreach ($report['events'] as $key => $event) {
                    if (!$event['isAllDay']) {
                        $report['events'][$key]['isIgnoreEvent'] = true;
                    }
                    if ($event['isAllDay'] && $event['isDevis'] && !$event['isAllDayDevisImportant']) {
                        $report['events'][$key]['hours'] = $hoursMaxDay;
                    }
                }
            } else {
                $hoursNotAllDay = 0.0;
                $nbAllDayDevis = 0;
                foreach ($report['events'] as $event) {
                    if ($event['isIgnoreEvent']) {
                        continue;
                    }
                    if ($event['isAllDay'] && $event['isDevis']) {
                        $nbAllDayDevis++;
                    }
                    if (!$event['isAllDay']) {
                        $hoursNotAllDay += $event['hours'];
                    }
                }
                if ($nbAllDayDevis > 0) {
                    $hoursAllDayDevis = max(0, ($hoursMaxDay - $hoursNotAllDay) / $nbAllDayDevis);
                    foreach ($report['events'] as $key => $event) {
                        if ($event['isAllDay'] && $event['isDevis']) {
                            $report['events'][$key]['hours'] = $hoursAllDayDevis;
                        }
                    }
                }
            }
            $result[$day] = $report;
        }
        ksort($result);
        return $result;
    }

    private function isHalfDayEventsDay(array $eventsDay): bool
    {
        $holidayTags = self::HOLIDAY_TAGS;
        unset($holidayTags['@férié']);
        $isHalfDay = false;
        foreach ($eventsDay as $eventDay) {
            if (!$eventDay['isAllDay']) {
                continue;
            }
            $summary = $eventDay['summary'];
            foreach ($holidayTags as $tag) {
                if (stripos($summary, $tag) !== false) {
                    $nbAt = substr_count($summary, '@');
                    if ($nbAt > 1 && strcasecmp($summary, $tag) !== 0) {
                        $isHalfDay = true;
                    }
                    break;
                }
            }
        }
        return $isHalfDay;
    }

    private function isAllDayDevisImportant(array $event): bool
    {
        if (!$event['isAllDay']) {
            return false;
        }
        $summary = trim($event['summary']);
        return ($summary[0] ?? null) === '!';
    }

    private function isIgnoreEvent(string $summary): bool
    {
        $summary = trim($summary);
        return ($summary[0] ?? null) === '?';
    }

    private function getDevis(string $summary): array
    {
        $devis = [];
        if (preg_match_all('/[Dd]2[0-9]{4}/', $summary, $matches)) {
            $devis = array_unique($matches[0]);
        }
        return $devis;
    }

    private function getHoliday(string $summary): array
    {
        $regex = '/(' . implode('|', array_map('preg_quote', self::HOLIDAY_TAGS, PREG_QUOTES)) . ')/';
        $holiday = [];
        if (preg_match_all($regex, $summary, $matches)) {
            $holiday = array_unique($matches[1]);
        }
        return $holiday;
    }

    private function computeSummary(): void
    {
        foreach ($this->events as $day => $quadris) {
            foreach ($quadris as $quadri => $report) {
                if ($report['isWeekend']) {
                    continue;
                }
                foreach ($report['events'] as $event) {
                    if ($event['isIgnoreEvent']) {
                        continue;
                    }
                    if ($event['isDevis']) {
                        $this->addSummary($event['devis'], $event['hours']);
                        $this->addSummaryByUser($event['devis'], $quadri, $event['hours']);
                    }
                    if ($event['isHoliday']) {
                        $this->addSummary($event['holiday'], $event['hours']);
                    }
                }
            }
        }
    }

    private function addSummary(string $label, float $hours): void
    {
        if (!isset($this->summary[$label])) {
            $this->summary[$label] = 0.0;
        }
        $this->summary[$label] += $hours;
    }

    private function addSummaryByUser(string $label, string $quadri, float $hours): void
    {
        if (!isset($this->summaryByUser[$label])) {
            $this->summaryByUser[$label] = ['_sum' => 0.0, 'users' => []];
        }
        $this->summaryByUser[$label]['_sum'] += $hours;
        if (!isset($this->summaryByUser[$label]['users'][$quadri])) {
            $this->summaryByUser[$label]['users'][$quadri] = 0.0;
        }
        $this->summaryByUser[$label]['users'][$quadri] += $hours;
    }
}
