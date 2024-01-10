import { toFloatingString } from './utils'

/**
 * Creates an ICS event. Dates are floating date time as per RFC5545
 * @param {Date} dateStart 
 * @param {Date} dateEnd 
 * @param {String} summary 
 * @param {String} description 
 * @param {String} uid 
 * @returns 
 */
export function makeIcsString(dateStart, dateEnd, summary, description, uid) {
    var test =
        "BEGIN:VCALENDAR\n" +
        "CALSCALE:GREGORIAN\n" +
        "PRODID:-// whereami //EN\n" +
        "VERSION:2.0\n" +
        "BEGIN:VEVENT\n" +
        "UID:" + uid + "\n" +
        "DTSTART;VALUE=DATE:" +
        toFloatingString(dateStart) +
        "\n" +
        "DTEND;VALUE=DATE:" +
        toFloatingString(dateEnd) +
        "\n" +
        "SUMMARY:" +
        summary +
        "\n" +
        "DESCRIPTION:" +
        description +
        "\n" +
        "END:VEVENT\n" +
        "END:VCALENDAR";

    return test
}