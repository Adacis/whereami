# Calendar regressions

`calendar-events.php` exercises Whereami's PHP controller and event parser against
Nextcloud's search-result format, using Nextcloud's real Sabre VObject recurrence
expansion. The calendar manager, database and HTTP response classes are test doubles;
no calendar, account or database is read or modified.

Run with a Nextcloud 33 PHP runtime and its bundled dependencies:

```sh
docker run --rm --entrypoint php \
  --mount "type=bind,src=$PWD,dst=/app,readonly" \
  nextcloud:33-apache /app/tests/calendar-events.php
```

Outside the image, set `NEXTCLOUD_VENDOR_AUTOLOAD` to Nextcloud's
`3rdparty/autoload.php` and run `php tests/calendar-events.php`.

Coverage includes daily and weekly series, repeated multi-day absences, Wednesday
inside a full-week absence, EXDATE/RDATE, edited/moved/cancelled exceptions,
exclusive end dates, daylight saving, missing end dates, DURATION, Unicode labels,
malformed neighbours, duplicate occurrences, owner conflicts and Last seen.

`browser-layout.cjs` also renders the serialized PHP fixture in
`fixtures/calendar/expanded-events.json`, checking Employees, Locations and the
monthly summary. It requires Playwright and Chromium (override the executable
with `WHEREAMI_BROWSER_EXECUTABLE`).

```sh
node tests/browser-layout.cjs
WHEREAMI_TEST_TIMEZONE=UTC node tests/browser-layout.cjs
WHEREAMI_TEST_TIMEZONE=America/New_York node tests/browser-layout.cjs
```

The default browser timezone is Europe/Paris. To regenerate the serialized fixture,
set `WHEREAMI_CALENDAR_FIXTURE_OUTPUT` to a writable path when running the PHP
suite. The browser suite can consume that output directly using
`WHEREAMI_CALENDAR_FIXTURE_INPUT`.
