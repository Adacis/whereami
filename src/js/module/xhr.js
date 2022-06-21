import {showError, showSuccess} from "@nextcloud/dialogs";
import {generateUrl} from "@nextcloud/router";
import {days_FR, listEvents} from "../class/listEvents";
import {optionDatatable} from "../main";

export var baseUrl = generateUrl('/apps/whereami');

/**
 *
 * @param {*} dtStart
 * @param {*} dtEnd
 * @param {*} DataTable
 */
export function getData(dtStart, dtEnd, DataTable, classement) {
    var data = {
        classement: classement,
        dtStart: dtStart,
        dtEnd: dtEnd
    };

    var oReq = new XMLHttpRequest();
    oReq.open('POST', baseUrl + '/getEvents', true);
    oReq.setRequestHeader("Content-Type", "application/json");
    oReq.setRequestHeader("requesttoken", oc_requesttoken);
    oReq.onload = function (e) {
        if (this.status == 200) {
            newTablePersonne(this.response, dtStart, dtEnd, classement);
            new DataTable("#" + classement, optionDatatable);
            showSuccess('table loaded');
        } else {
            showError(this.response);
        }
    };
    oReq.send(JSON.stringify(data));
}

/**
 *
 * @param {*} response
 * @param {*} dtStart
 * @param {*} dtEnd
 * @param {*} tablename
 */
function newTablePersonne(response, dtStart, dtEnd, tablename) {
    var table = document.createElement('table');
    var thead = document.createElement('thead');
    var tbody = document.createElement('tbody');
    var tfoot = document.createElement('tfoot');

    table.setAttribute('id', tablename);
    table.setAttribute('class', 'table table-striped');

    // var retHead = getHeader(from,to);
    var from = new Date(dtStart);
    var to = new Date(dtEnd);
    thead.appendChild(getHeader(from, to));

    var from = new Date(dtStart);
    var to = new Date(dtEnd);

    var res = JSON.parse(response);
    Object.keys(res).forEach(element => {
        var from = new Date(dtStart);
        var userListEvents = new listEvents(element, res[element]);
        if (tablename == 'summary') {
            tbody = getContent(tbody, from, to, userListEvents, true);
        } else {
            tbody = getContent(tbody, from, to, userListEvents, false);
        }

    });

    if (tablename == 'summary') {
        tfoot.appendChild(getTotal(tbody));
    }

    tfoot.appendChild(getHeader(from, to));

    table.appendChild(thead);
    table.appendChild(tbody);
    table.appendChild(tfoot);
    document.getElementById("myapp").innerHTML = "";
    document.getElementById("myapp").appendChild(table);
}


function getTotal(tbody) {
    var line = document.createElement('tr');
    line.appendChild(newCell('td', "Total"));

    var totalColumn = tbody.getElementsByTagName('tr')[0].getElementsByTagName('td').length;
    for (var i = 1; i < totalColumn; i++) {
        var totalByDay = 0;
        tbody.getElementsByTagName('tr').forEach(element => {
            totalByDay += parseInt(element.getElementsByTagName('td')[i].innerText);
        });
        line.appendChild(newCell('td',
            isNaN(totalByDay) ? "" : totalByDay,
            'text-align:center;'));
    }
    return line;
}


/**
 *
 * @param {*} type
 * @param {*} data
 * @param {*} style
 * @returns
 */
function newCell(type, data, style = "") {
    var myCase = document.createElement(type);
    myCase.setAttribute('style', style);
    myCase.innerText = data;
    return myCase;
}

/**
 * Header of table
 * @param {*} from
 * @param {*} to
 * @returns
 */
function getHeader(from, to) {
    var line = document.createElement('tr');
    line.appendChild(newCell("th", "Date"));
    while (from <= to) {
        line.appendChild(newCell("th", days_FR[from.getDay()] + "\n" + from.toLocaleDateString()));
        from.setDate(from.getDate() + 1);
    }

    return line;
}

/**
 *
 * @param {*} tbody
 * @param {*} from
 * @param {*} to
 * @param {*} userListEvents
 * @param {*} count
 * @returns
 */
function getContent(tbody, from, to, userListEvents, count = false) {
    var line = document.createElement('tr');
    line.appendChild(newCell("td", userListEvents.id));
    while (from <= to) {
        if (!count) {
            line.appendChild(userListEvents.eventsAtDay(from));
        } else {
            line.appendChild(userListEvents.eventsAtDayCount(from));
        }

        from.setDate(from.getDate() + 1);
    }
    tbody.appendChild(line);
    return tbody;
}