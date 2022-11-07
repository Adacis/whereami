import groupBy from "lodash/groupBy"
import toInteger from "lodash/toInteger"
import { Events } from "../class/Event"
import { daysFr, ListEvents } from "../class/ListEvents"
import { getAllIcons, getData, getTags } from "./xhr"

/**
 *
 * @returns
 */
export function getLoader() {
    const center = document.createElement('center')
    const divLoader = document.createElement('div')
    divLoader.setAttribute('class', 'lds-dual-ring')
    center.appendChild(divLoader)
    return center
}

function setTitleWithIcons(element, icons, tablePersonne = false) {
    for (let dic of icons) {
        element.title = dic.prefix + "(" + dic.label + ")\n" + element.title
        if (tablePersonne) {
            let a = document.createElement('a')
            a.innerText = dic.prefix + "(" + dic.label + ")\n"
            a.addEventListener('click', () => {
                document.getElementById('myapp').innerHTML = ''
                document.getElementById('myapp').appendChild(getLoader())
                getData(document.getElementById('dtStart').value, document.getElementById('dtEnd').value, 'summary', dic.label)
            })
            element.appendChild(a)

        }
        else
            element.innerText = element.innerText + dic.prefix
    }
}


export function newTableSeen(response) {
    const res = JSON.parse(response)
    var totalPeople = 1
    const today = new Date()

    const table = document.createElement('table')
    table.setAttribute('id', 'seen')
    table.setAttribute('class', 'table table-striped')

    let thead = document.createElement('thead')
    let tbody = document.createElement('tbody')

    const headLine = document.createElement('tr')
    headLine.appendChild(newCell('th', ""))

    Object.keys(res).forEach(person => {
        let th = newCell('th', person);
        headLine.appendChild(th);

        var newLine = document.createElement('tr');
        let tr = newCell('td', person);
        newLine.appendChild(tr);
        tbody.appendChild(newLine);

        totalPeople++;
    })

    thead.appendChild(headLine);
    table.appendChild(thead);
    table.appendChild(tbody);

    let icons = getAllIcons().onload();
    let groupedIcons = groupBy(icons, 'person');
    let rows = 0;
    table.rows.forEach(r => {
        if (rows > 0) {
            let peoplerow = r.cells[0].innerText;
            for (var cellPosition = 1; cellPosition < totalPeople; cellPosition++) {

                let peoplecolumn = table.rows[0].cells[cellPosition].innerText

                let msg = ":'(";
                let title = "No title";
                var daysLastSeen = -1

                if (peoplerow === peoplecolumn) {
                    msg = "-";
                    daysLastSeen = 0
                }

                if (res[peoplerow] != null && res[peoplerow][peoplecolumn] != null) {
                    title = res[peoplerow][peoplecolumn].place;
                    msg = res[peoplerow][peoplecolumn].seen;
                    const timeLastSeen = new Date(today - new Date(msg.replace(/(\d{2})-(\d{2})-(\d{4})/, "$2/$1/$3")))
                    daysLastSeen = toInteger(timeLastSeen / (1000 * 3600 * 24))
                    msg = msg + " (" + res[peoplerow][peoplecolumn].count + ' times)'
                    if (daysLastSeen == 0)
                        title = title + " today"
                    else
                        title = title + ' ' + daysLastSeen + ' day(s) ago'
                }


                let newCell = r.insertCell(cellPosition);
                let newText = document.createTextNode(msg);
                newCell.setAttribute('title', title);
                newCell.appendChild(newText);
                if (daysLastSeen >= 20) {
                    newCell.style = "background-color: orange;"
                }
                if (daysLastSeen == -1 || daysLastSeen >= 30) {
                    newCell.style = "background-color: red;"
                }

                //setTitleWithIcons(table.rows[0].cells[cellPosition], groupedIcons[peoplecolumn])
            }
            let tetrarow = Events.compute_tetragraph(peoplerow)
            if (groupedIcons[tetrarow])
                setTitleWithIcons(r.cells[0], groupedIcons[tetrarow])
        }
        rows++;
    })

    document.getElementById('myapp').innerHTML = ''
    document.getElementById('myapp').appendChild(table)

}


/**
 *
 * @param {*} response
 * @param {*} dtStart
 * @param {*} dtEnd
 * @param {*} tablename
 */
export function newTablePersonne(response, dtStart, dtEnd, tablename) {
    const table = document.createElement('table')
    const thead = document.createElement('thead')
    let tbody = document.createElement('tbody')
    const tfoot = document.createElement('tfoot')

    table.setAttribute('id', tablename)
    table.setAttribute('class', 'table table-striped')

    // var retHead = getHeader(from,to);
    // var from = new Date(dtStart)
    // var to = new Date(dtEnd)
    thead.appendChild(getHeader(new Date(dtStart), new Date(dtEnd), tablename != 'summary'))

    const to = new Date(dtEnd)
    const res = JSON.parse(response)
    let icons = getAllIcons().onload()
    let whitelistKeys
    if (tablename === 'summary')
        whitelistKeys = getTags("accounted_for_keys").onload().map(element => element.word.toLowerCase())

    Object.keys(res).forEach(element => {
        let from = new Date(dtStart)
        const userListEvents = new ListEvents(element, res[element])
        if (tablename === 'summary') {
            tbody = getContent(tbody, from, to, userListEvents, icons, whitelistKeys, true)
        } else {
            tbody = getContent(tbody, from, to, userListEvents, icons)
        }
    })

    if (tablename === 'summary') {
        tfoot.appendChild(getTotal(tbody))
    }

    tfoot.appendChild(getHeader(new Date(dtStart), to, tablename != 'summary'))

    table.appendChild(thead)
    table.appendChild(tbody)
    table.appendChild(tfoot)
    document.getElementById('myapp').innerHTML = ''
    document.getElementById('myapp').appendChild(table)
}

/**
 *
 * @param {*} tbody
 * @returns
 */
function getTotal(tbody) {
    const line = document.createElement('tr')
    line.appendChild(newCell('td', 'Total'))

    let totalColumn
    try {
        totalColumn = tbody.getElementsByTagName('tr')[0].getElementsByTagName('td').length
    } catch (error) {
        totalColumn = 0
    }
    for (let i = 1; i < totalColumn; i++) {
        let totalByDay = 0
        tbody.getElementsByTagName('tr').forEach(element => {
            totalByDay += parseInt(element.getElementsByTagName('td')[i].innerText)
        })
        line.appendChild(newCell('td',
            isNaN(totalByDay) ? '' : totalByDay,
            'text-align:center;'))
    }
    return line
}

/**
 *
 * @param {*} type
 * @param {*} data
 * @param {*} style
 * @returns
 */
function newCell(type, data, style = '') {
    const myCase = document.createElement(type)
    myCase.setAttribute('style', style)
    myCase.innerText = data
    return myCase
}

/**
 * Header of table
 * @param {*} from
 * @param {*} to
 * @returns
 */
function getHeader(from, to, tablePersonne = false) {
    const line = document.createElement('tr')
    line.appendChild(newCell('th', 'Date'))
    if (tablePersonne)
        line.appendChild(newCell('th', 'Clés'))
    while (from <= to) {
        line.appendChild(newCell('th', daysFr[from.getDay()] + '\n' + from.toLocaleDateString()))
        from.setDate(from.getDate() + 1)
    }
    return line
}

/**
 *
 * @param {*} tbody
 * @param {*} from
 * @param {*} to
 * @param {*} userListEvents
 * @param {*} icons
 * @param {*} count
 * @returns
 */
function getContent(tbody, from, to, userListEvents, icons, whitelistKeys = null, count = false) {
    const line = document.createElement('tr')
    let td = newCell('td', userListEvents.id)
    line.appendChild(td)
    let placeIsExcluded
    if (!count) {
        let iconsCell = newCell('td', '')
        line.appendChild(iconsCell)
        icons = groupBy(icons, "person")
        let tetra = Events.compute_tetragraph(userListEvents.id)
        if (icons[tetra] != undefined)
            setTitleWithIcons(iconsCell, icons[tetra], true)
    }
    else
        placeIsExcluded = !whitelistKeys.includes(userListEvents.id)

    while (from <= to) {
        if (!count) {
            line.appendChild(userListEvents.eventsAtDay(from))
        } else {
            line.appendChild(userListEvents.eventsAtDayCount(from, icons, placeIsExcluded))
        }

        from.setDate(from.getDate() + 1)
    }
    tbody.appendChild(line)
    return tbody
}
