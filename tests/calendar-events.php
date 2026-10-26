<?php
/**
 * Standalone regression tests for Nextcloud's expanded search result contract.
 * NEXTCLOUD_VENDOR_AUTOLOAD must point to Nextcloud 3rdparty/autoload.php.
 * Run: php tests/calendar-events.php
 * No database, calendar writes, HTTP server, or real user data is used.
 */
namespace OCP {
    interface IRequest {}
    interface IURLGenerator {}
}
namespace OCP\Calendar {
    interface IManager { public function search($pattern, array $properties = [], array $options = [], $limit = null, $offset = null): array; }
}
namespace OCP\AppFramework {
    class Controller { public function __construct($app, $request) {} }
    class Http { const STATUS_NO_CONTENT = 204; const STATUS_OK = 200; }
}
namespace OCP\AppFramework\Http {
    class DataResponse {
        public function __construct(private $data, private $status = 200, $headers = []) {}
        public function getData() { return $this->data; }
        public function getStatus() { return $this->status; }
    }
}
namespace OCA\Whereami\Db {
    class Bdd {
        public function getCalendars($id) { return [['principaluri' => 'principals/users/' . $id]]; }
        public function getUID($uid) { return [['data' => json_encode(['displayname' => ['value' => 'Person ' . $uid]])]]; }
        public function getWordInWordList($usage) { return array_map(fn($word) => ['word' => $word], ['Congés', 'Cenon', 'Bordeaux', 'DNUM', 'Télétravail', 'Déplacement', 'Bureau secondaire']); }
    }
}
namespace {
    require getenv('NEXTCLOUD_VENDOR_AUTOLOAD') ?: '/usr/src/nextcloud/3rdparty/autoload.php';
    require __DIR__ . '/../lib/MyClass/MyEvent.php';
    require __DIR__ . '/../lib/Controller/PageController.php';

    use OCA\Whereami\Controller\PageController;
    use OCA\Whereami\MyClass\MyEvent;
    use OCA\Whereami\Db\Bdd;
    use Sabre\VObject\Reader;
    use Sabre\VObject\Property\ICalendar\DateTime as DateTimeProperty;
    use Psr\Log\NullLogger;

    set_error_handler(function ($severity, $message, $file, $line) { throw new \ErrorException($message, 0, $severity, $file, $line); });
    function check($actual, $expected, string $label): void {
        if ($actual !== $expected) {
            throw new \RuntimeException($label . '\nExpected: ' . var_export($expected, true) . '\nActual: ' . var_export($actual, true));
        }
    }
    class CalendarManager implements \OCP\Calendar\IManager {
        public array $calls = [];
        public function __construct(public array $calendars, public array $extra = []) {}
        public function search($pattern, array $properties = [], array $options = [], $limit = null, $offset = null): array {
            $this->calls[] = [$pattern, $properties, $options, $limit, $offset];
            $result = [];
            foreach ($this->calendars as $id => $ics) {
                // Same expansion library and property shape as Nextcloud CalDavBackend.
                $expanded = Reader::read($ics)->expand($options['timerange']['start'], $options['timerange']['end']);
                $objects = [];
                foreach ($expanded->select('VEVENT') as $event) {
                    $object = [];
                    foreach ($event->children() as $property) {
                        if ($property instanceof \Sabre\VObject\Property) {
                            $object[$property->name] = [$property instanceof DateTimeProperty ? $property->getDateTime() : $property->getValue(), $property->parameters()];
                        }
                    }
                    $objects[] = $object;
                }
                $result[] = ['id' => $id, 'uid' => 'test-' . $id, 'type' => 'VEVENT', 'calendar-key' => 'calendar-' . $id, 'objects' => $objects];
            }
            return array_merge($result, $this->extra);
        }
    }
    function controller(CalendarManager $manager, string $uid = '1'): PageController {
        return new PageController('whereami', $uid, new class implements \OCP\IRequest {}, $manager, new class implements \OCP\IURLGenerator {}, new Bdd(), new NullLogger());
    }
    function calendar(string $body): string { return "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Whereami regression tests//EN\r\n" . str_replace("\n", "\r\n", trim($body)) . "\r\nEND:VCALENDAR\r\n"; }
    function dates(array $events): array { return array_map(fn($e) => substr($e->dtStart, 0, 10), $events); }
    function events(CalendarManager $manager, string $start = '2026-10-19', string $end = '2026-10-23'): array {
        $groups = controller($manager)->getEvents('nextcloud_users', $start, $end)->getData();
        return array_merge([], ...array_values($groups));
    }
    $weekly = file_get_contents(__DIR__ . '/fixtures/calendar/weekly-leave.ics');
    $manager = new CalendarManager([1 => $weekly]);
    $week = events($manager);
    check(dates($week), ['2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23'], 'Every expanded occurrence, including Wednesday');
    check(array_column($week, 'place'), array_fill(0, 5, 'congés'), 'Accented leave label retained');
    check($manager->calls[0][0], '', 'Search edited titles independently from master');
    check($manager->calls[0][2]['types'], ['VEVENT'], 'Exclude tasks and journals');
    check($manager->calls[0][3], null, 'No result limit truncating a recurring series');
    check($manager->calls[0][2]['timerange']['end']->format('Y-m-d H:i:s'), '2026-10-24 00:00:00', 'Full last selected day');
    check(dates(events($manager, '2026-10-21', '2026-10-21')), ['2026-10-21'], 'Single Wednesday query');
    check(dates(events($manager, '2026-10-23', '2026-10-23')), ['2026-10-23'], 'Final day included');

    $weekdaysRule = str_replace('RRULE:FREQ=DAILY;COUNT=5', 'RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR;COUNT=10', $weekly);
    check(count(events(new CalendarManager([1 => $weekdaysRule]), '2026-10-19', '2026-10-30')), 10, 'Weekly BYDAY recurrence contains both complete workweeks');
    $spanning = str_replace(['DTEND;VALUE=DATE:20261020', 'RRULE:FREQ=DAILY;COUNT=5'], ['DTEND;VALUE=DATE:20261024', 'RRULE:FREQ=WEEKLY;COUNT=2'], $weekly);
    $spanningEvents = events(new CalendarManager([1 => $spanning]), '2026-10-19', '2026-10-30');
    check(dates($spanningEvents), ['2026-10-19', '2026-10-26'], 'Recurring multi-day events retain both weekly spans');
    check(count(events(new CalendarManager([1 => $spanning]), '2026-10-28', '2026-10-28')), 1, 'Wednesday within a repeated full-week absence is found');

    $excluded = str_replace('SUMMARY:@Congés', "EXDATE;VALUE=DATE:20261021\nSUMMARY:@Congés", $weekly);
    check(dates(events(new CalendarManager([1 => $excluded]))), ['2026-10-19', '2026-10-20', '2026-10-22', '2026-10-23'], 'EXDATE is respected, never filled in');
    $exception = "BEGIN:VEVENT\nUID:weekly-leave\nRECURRENCE-ID;VALUE=DATE:20261021\nDTSTART;VALUE=DATE:20261021\nDTEND;VALUE=DATE:20261022\nSUMMARY:@Cenon\nEND:VEVENT\n";
    $edited = str_replace('END:VCALENDAR', $exception . 'END:VCALENDAR', $weekly);
    check(array_column(events(new CalendarManager([1 => $edited])), 'place'), ['congés', 'congés', 'cenon', 'congés', 'congés'], 'An edited Wednesday replaces its master occurrence');
    $moved = str_replace('DTSTART;VALUE=DATE:20261021', 'DTSTART;VALUE=DATE:20261022', $exception);
    $moved = str_replace('DTEND;VALUE=DATE:20261022', 'DTEND;VALUE=DATE:20261023', $moved);
    $movedEvents = events(new CalendarManager([1 => str_replace('END:VCALENDAR', $moved . 'END:VCALENDAR', $weekly)]));
    $movedDates = dates($movedEvents); sort($movedDates);
    check($movedDates, ['2026-10-19', '2026-10-20', '2026-10-22', '2026-10-22', '2026-10-23'], 'Moved exceptions keep their actual date');
    $cancelled = str_replace('SUMMARY:@Cenon', "STATUS:CANCELLED\nSUMMARY:@Cenon", $exception);
    check(dates(events(new CalendarManager([1 => str_replace('END:VCALENDAR', $cancelled . 'END:VCALENDAR', $weekly)]))), ['2026-10-19', '2026-10-20', '2026-10-22', '2026-10-23'], 'Cancelled occurrence is not resurrected');
    $unmarkedMaster = str_replace('SUMMARY:@Congés', 'SUMMARY:Ordinary appointment', $weekly);
    check(dates(events(new CalendarManager([1 => str_replace('END:VCALENDAR', $exception . 'END:VCALENDAR', $unmarkedMaster)]))), ['2026-10-21'], 'Marked exception in an unmarked series is found');
    $rdate = str_replace('RRULE:FREQ=DAILY;COUNT=5', "RRULE:FREQ=WEEKLY;COUNT=1\nRDATE;VALUE=DATE:20261021", $weekly);
    check(dates(events(new CalendarManager([1 => $rdate]))), ['2026-10-19', '2026-10-21'], 'RDATE occurrences are included');

    $allDay = ['DTSTART' => [new \DateTime('2026-10-21', new \DateTimeZone('UTC')), ['VALUE' => 'DATE']], 'DTEND' => [new \DateTime('2026-10-22', new \DateTimeZone('UTC')), ['VALUE' => 'DATE']], 'SUMMARY' => ['@Congés', []]];
    $row = ['id' => '1', 'type' => 'VEVENT', 'objects' => [$allDay]];
    $before = $allDay['DTSTART'][0]->format('c');
    $first = new MyEvent($row, new Bdd(), new NullLogger());
    $second = new MyEvent($row, new Bdd(), new NullLogger());
    check($allDay['DTSTART'][0]->format('c'), $before, 'Provider DateTime is never mutated');
    check($first->dtStart, $second->dtStart, 'Repeated parsing is stable');
    check($first->dtStart, '2026-10-21T00:00:00', 'All-day date stays timezone-free');
    check($first->dtEnd, '2026-10-22T00:00:00', 'Exclusive midnight end, no minute adjustments');
    $noEnd = $allDay; unset($noEnd['DTEND']);
    check((new MyEvent(['id' => '1', 'objects' => [$noEnd]], new Bdd(), new NullLogger()))->dtEnd, '2026-10-22T00:00:00', 'DATE without DTEND defaults to one day');
    $timed = ['DTSTART' => [new \DateTimeImmutable('2026-10-21T09:00:00+02:00'), []], 'DURATION' => ['PT3H', []], 'SUMMARY' => ['@Cenon', []]];
    $timedEvent = new MyEvent(['id' => '1', 'objects' => [$timed]], new Bdd(), new NullLogger());
    check($timedEvent->dtStart, '2026-10-21T09:00:00+02:00', 'Timed event keeps its offset');
    check($timedEvent->dtEnd, '2026-10-21T12:00:00+02:00', 'DURATION is supported');
    $badDuration = $timed; $badDuration['DURATION'][0] = 'invalid';
    check((new MyEvent(['id' => '1', 'objects' => [$badDuration]], new Bdd(), new NullLogger()))->valid, false, 'Malformed duration skipped');
    $missingStart = $allDay; unset($missingStart['DTSTART']);
    $backwards = $allDay; $backwards['DTEND'][0] = new \DateTimeImmutable('2026-10-20');
    $mixed = new CalendarManager([], [['id' => '1', 'type' => 'VEVENT', 'objects' => [$missingStart, $backwards, $allDay]], ['id' => '1', 'type' => 'VTODO', 'objects' => [$allDay]]]);
    check(count(events($mixed)), 1, 'Malformed neighbours and tasks cannot hide a valid occurrence');
    check(count(events(new CalendarManager([], [$row, $row]))), 1, 'Duplicate occurrences are not counted twice');
    $samePlace = $allDay; $samePlace['SUMMARY'][0] = '@Cenon, @Cenon';
    check(count(controller(new CalendarManager([], [['id' => '1', 'objects' => [$samePlace]]]))->getEvents('place', '2026-10-21', '2026-10-21')->getData()['cenon']), 1, 'Same place in both halves does not duplicate the event');
    foreach ([" \u{FEFF}@CONGÉS ", "@\u{00A0}Conge\u{0301}s", "\t@Congés\n"] as $title) {
        $object = $allDay; $object['SUMMARY'][0] = $title;
        check((new MyEvent(['id' => '1', 'objects' => [$object]], new Bdd(), new NullLogger()))->place, 'congés', 'Unicode whitespace, case and accents');
    }
    $multiword = $allDay; $multiword['SUMMARY'][0] = '@Bureau secondaire, @Cenon, D26010';
    $parsed = new MyEvent(['id' => '1', 'objects' => [$multiword]], new Bdd(), new NullLogger());
    check([$parsed->place, $parsed->place2], ['bureau secondaire', 'cenon'], 'Multiword places and trailing quote reference');
    check(controller(new CalendarManager([1 => $weekly]))->isTimeSlotAvailable('2026-10-21', '2026-10-21')->getStatus(), 200, 'Recurring occurrence participates in owner conflict detection');
    check(controller(new CalendarManager([1 => $weekly]), 'other')->isTimeSlotAvailable('2026-10-21', '2026-10-21')->getStatus(), 204, 'Another user does not cause an owner conflict');
    $office = str_replace('SUMMARY:@Congés', 'SUMMARY:@Cenon', $weekly);
    $pastOffice = str_replace('2026', '2020', $office);
    $seen = controller(new CalendarManager([1 => $pastOffice, 2 => $pastOffice]))->getLastSeen('2020-10-19', '2020-10-23')->getData();
    check($seen['person 1']['person 2']['count'], 5.0, 'Last seen includes all five recurring workdays');
    check($seen['person 1']['person 2']['seen'], '2020-10-23', 'Last seen ends on the actual last occurrence');
    $overlap = str_replace(['20261019', '20261020', 'RRULE:FREQ=DAILY;COUNT=5'], ['20261016', '20261024', ''], $weekly);
    check(count(events(new CalendarManager([1 => $overlap]))), 1, 'Multi-day event starting before the selected period retained');
    $dst = str_replace(['20261019', '20261020'], ['20261023', '20261024'], $weekly);
    check(dates(events(new CalendarManager([1 => $dst]), '2026-10-23', '2026-10-27')), ['2026-10-23', '2026-10-24', '2026-10-25', '2026-10-26', '2026-10-27'], 'All-day recurrence across daylight-saving boundary');
    foreach ([['2026-02-30', '2026-03-03'], ['2026-10-23', '2026-10-19'], ['invalid', '2026-10-23']] as [$start, $end]) {
        try { controller($manager)->search($start, $end); throw new \RuntimeException('Invalid date range accepted'); } catch (\InvalidArgumentException $expected) {}
    }
    if ($output = getenv('WHEREAMI_CALENDAR_FIXTURE_OUTPUT')) {
        file_put_contents($output, json_encode(['weekly' => $week, 'dst' => events(new CalendarManager([1 => $dst]), '2026-10-23', '2026-10-27'), 'timed' => $timedEvent, 'spanning' => $spanningEvents], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    }
    echo "PASS: expanded daily/weekly recurrences, Wednesday, EXDATE, RDATE, edited/moved/cancelled exceptions, date bounds, DST, Unicode, malformed records, deduplication, conflict checks and last-seen.\n";
}
