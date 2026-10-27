import groupBy from "lodash/groupBy"
import toInteger from "lodash/toInteger"
import { Events } from "../class/Event"
import { daysFr, ListEvents } from "../class/ListEvents"
import { getAllIcons, getData, getTags, optionDatatable1 } from "./xhr"
import DataTable from 'datatables.net-bs/js/dataTables.bootstrap.min.js'
import 'datatables.net-fixedcolumns/js/dataTables.fixedColumns'
import 'datatables.net-bs/css/dataTables.bootstrap.min.css'
import { BY_LOCATION, BY_EMPLOYEE, FRACTION_FOR_ORANGE, FRACTION_FOR_RED, ACCOUNTED_FOR_KEYS, HR_SUMMARY, ALLOWED_PLACES } from "../config/config"

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


/**
 * Fills the title and inner with the icons. For table byEmployee, adds an event
 * listenner to redirect to byLocation on click on the key's place
 * @param {HTMLBaseElement} element
 * @param {Array} icons
 * @param {boolean} tablePersonne
 */
function setTitleWithIcons(element, icons, tablePersonne = false) {
    for (let dic of icons) {
        element.title = dic.prefix + "(" + dic.label + ")\n" + element.title
        if (tablePersonne) {
            let a = document.createElement('a')
            a.innerText = dic.prefix + "(" + dic.label + ")\n"
            a.addEventListener('click', () => {
                document.getElementById('finalPath').innerText = "Locations"
                document.getElementById('myapp').innerHTML = ''
                document.getElementById('myapp').appendChild(getLoader())
                getData(document.getElementById('dtStart').value, document.getElementById('dtEnd').value, 'place', BY_LOCATION, dic.prefix)
            })
            element.appendChild(a)
        }
        else
            element.innerText = element.innerText + dic.prefix
    }
}

/**
 * Returns the dates of the contract work by employee
 * @param informations : Array of all dates of the contract work by employee
 * @returns {*|string} : The dates of the contract work by employee
 */
function getAllDatesFromContract (informations) {
    let dates = ''
    if (informations) {
        for(let key in informations) {
            let date_cra = informations[key].date_cra
            if (date_cra.includes(' - ')) {
                // If the string contains " - ", the string is at the format "yyyy-mm-dd - yyyy-mm-dd"
                let datesArray = date_cra.split(' - ')
                let startDate = datesArray[0].split('-').reverse().join('/')
                let endDate = datesArray[1].split('-').reverse().join('/')
                dates += startDate + ' - ' + endDate + '\n'
            } else {
                // Else, the string is at the format "yyyy-mm-dd"
                let date = date_cra.split('-').reverse().join('/')
                dates += date + '\n';
            }
        }
    }
    return dates
}

/**
 * Generates the contract filters and table based on the provided JSON response.
 * Two views, chosen by the first filter:
 * - "Tous les devis" : per user, total days and breakdown by contract.
 * - a specific quote : per user, days and dates on that quote.
 *
 * @param {string} response - The JSON response containing contracts and user data.
 * Format:
 * {
 *   "contracts": {
 *     "ContractID": {
 *       "User": [ { "date_cra": Value, "acr": Value }, ... ],
 *       ...
 *     },
 *     ...
 *   },
 *   "userByContract": {
 *     "ContractID": {
 *       "User": TotalValue,
 *       ...
 *     },
 *     ...
 *   },
 *   "contractByUser": {
 *     "User": {
 *       "total": TotalValue,
 *       "contracts": {
 *         "ContractID": { "days": Value, "nb": Value },
 *         ...
 *       }
 *     },
 *     ...
 *   }
 * }
 */
export function newTableContracts(response) {
    const res = JSON.parse(response)
    const app = document.getElementById('myapp')
    app.replaceChildren()
    const toolbar = document.createElement('div')
    toolbar.className = 'wai-toolbar'
    const ALL = 'Tous'
    const contractSelect = document.createElement('select')
    contractSelect.id = 'contractSelect'
    const contractLabel = document.createElement('label')
    contractLabel.htmlFor = 'contractSelect'
    contractSelect.add(new Option(ALL, ''))
    Object.keys(res.userByContract || {}).sort().forEach(key => contractSelect.add(new Option(key, key)))
    const userSelect = document.createElement('select')
    userSelect.id = 'userSelect'
    const userLabel = document.createElement('label')
    userLabel.htmlFor = 'userSelect'
    userSelect.add(new Option(ALL, ''))
    Object.keys(res.contractByUser || {}).sort((a, b) => a.localeCompare(b)).forEach(key => userSelect.add(new Option(key, key)))
    contractLabel.textContent = 'Devis'
    userLabel.textContent = 'Collaborateur'
    toolbar.append(contractLabel, contractSelect, userLabel, userSelect)
    const result = document.createElement('div')
    result.className = 'wai-table-scroll'
    result.setAttribute('aria-live', 'polite')
    app.append(toolbar, result)
    const fmt = value => Number(value).toLocaleString('fr-FR')
    const emptyTable = (title, head, rows, foot) => {
        const table = document.createElement('table')
        table.id = 'contracts'
        table.className = 'table table-striped'
        table.createTHead().append(getHeaderWithValues(head))
        const body = table.createTBody()
        rows.forEach(row => body.append(row))
        table.createTFoot().append(foot)
        const hint = document.createElement('p')
        hint.className = 'wai-empty'
        hint.textContent = title
        result.append(hint, table)
    }
    const byContractRow = (contract, user) => {
        const entry = (res.userByContract[contract] || {})[user]
        const row = document.createElement('tr')
        row.append(newCell('td', user), newCell('td', fmt(entry)), newCell('td', getAllDatesFromContract((res.contracts[contract] || {})[user])))
        return row
    }
    const byUserRow = (user, contract, days, nb) => {
        const row = document.createElement('tr')
        row.append(newCell('td', user), newCell('td', contract), newCell('td', fmt(days)), newCell('td', String(nb).toLocaleString('fr-FR')))
        return row
    }
    const render = () => {
        result.replaceChildren()
        const contract = contractSelect.value
        const user = userSelect.value
        if (!contract) {
            const sortedUsers = Object.entries(res.contractByUser || {}).sort(([a], [b]) => a.localeCompare(b))
            const usersToShow = user ? sortedUsers.filter(([name]) => name === user) : sortedUsers
            const rows = []
            const footRows = []
            let total = 0
            usersToShow.forEach(([name, data]) => {
                rows.push(byUserRow(name, ALL, data.total, Object.keys(data.contracts || {}).length))
                footRows.push(byUserRow('', ALL, data.total, Object.keys(data.contracts || {}).length))
                total += Number(data.total)
                Object.entries(data.contracts || {}).sort(([a], [b]) => a.localeCompare(b)).forEach(([c, entry]) => {
                    rows.push(byUserRow('', c, entry.days, entry.nb))
                })
            })
            const foot = document.createElement('tr')
            foot.append(newCell('th', 'Total'), newCell('th', ''), newCell('th', fmt(total)), newCell('th', ''))
            if (rows.length === 0) {
                emptyTable('Aucune imputation sur cette période.', ['Collaborateur', 'Devis', 'Jours imputés', 'Tranches de travail'], [], foot)
                return
            }
            const table = document.createElement('table')
            table.id = 'contracts'
            table.className = 'table table-striped'
            table.createTHead().append(getHeaderWithValues(['Collaborateur', 'Devis', 'Jours imputés', 'Tranches de travail']))
            const body = table.createTBody()
            rows.forEach(row => body.append(row))
            const tfoot = table.createTFoot()
            footRows.forEach(row => tfoot.append(row))
            tfoot.append(foot)
            result.append(table)
            return
        }
        const usersForContract = (res.userByContract[contract] || {})
        const userKeys = (user ? Object.keys(usersForContract).filter(name => name === user) : Object.keys(usersForContract)).sort((a, b) => a.localeCompare(b))
        if (userKeys.length === 0) {
            const foot = document.createElement('tr')
            foot.append(newCell('th', 'Total'), newCell('th', '0'), newCell('th', ''))
            emptyTable(`Aucune imputation sur ce devis${user ? ` pour ${user}` : ''} sur cette période.`, ['Collaborateur', 'Jours imputés', 'Dates'], [], foot)
            return
        }
        const rows = []
        let total = 0
        userKeys.forEach(name => {
            const entry = usersForContract[name]
            rows.push(byContractRow(contract, name))
            total += Number(entry)
        })
        const foot = document.createElement('tr')
        foot.append(newCell('th', 'Total'), newCell('th', fmt(total)), newCell('th', ''))
        const table = document.createElement('table')
        table.id = 'contracts'
        table.className = 'table table-striped'
        table.createTHead().append(getHeaderWithValues(['Collaborateur', 'Jours imputés', 'Dates']))
        const body = table.createTBody()
        rows.forEach(row => body.append(row))
        table.createTFoot().append(foot)
        result.append(table)
    }
    contractSelect.addEventListener('change', render)
    userSelect.addEventListener('change', render)
    render()
}

/**
 * Generates the devis tracker view: a detail table (per day, per user) plus
 * the summary tables (by event, by user, LBP projects when a LBP devis is set).
 * The detail table has a "Devis / congé" and a "Collaborateur" filter, both
 * with an "ALL" option.
 *
 * @param {string} response - The JSON response of /getDevisTracker.
 * Format:
 * {
 *   "hoursMaxDay": 8,
 *   "events": {
 *     "YYYY-MM-DD": {
 *       "QUADRI": {
 *         "isHalfDay": boolean,
 *         "isAllDayDevisImportant": boolean,
 *         "events": [
 *           {
 *             "summary": string,
 *             "hours": number,
 *             "isAllDay": boolean,
 *             "isDevis": boolean,
 *             "devis": string|null,
 *             "isHoliday": boolean,
 *             "holiday": string|null,
 *             "isAllDayDevisImportant": boolean,
 *             "isIgnoreEvent": boolean
 *           },
 *           ...
 *         ]
 *       },
 *       ...
 *     },
 *     ...
 *   },
 *   "summary": {
 *     "Label": { "hours": number, "days": number },
 *     ...
 *   },
 *   "summaryByUser": {
 *     "Label": {
 *       "total": { "hours": number, "days": number },
 *       "users": { "QUADRI": { "hours": number, "days": number }, ... }
 *     },
 *     ...
 *   }
 * }
 */
export function newTableDevisTracker(response) {
    const res = JSON.parse(response)
    const app = document.getElementById('myapp')
    app.replaceChildren()
    const toolbar = document.createElement('div')
    toolbar.className = 'wai-toolbar'
    const ALL = 'Tous'
    const eventSelect = document.createElement('select')
    eventSelect.id = 'dtEventSelect'
    const eventLabel = document.createElement('label')
    eventLabel.htmlFor = 'dtEventSelect'
    eventLabel.textContent = 'Devis / congé'
    const userSelect = document.createElement('select')
    userSelect.id = 'dtUserSelect'
    const userLabel = document.createElement('label')
    userLabel.htmlFor = 'dtUserSelect'
    userLabel.textContent = 'Collaborateur'
    const events = res.events || {}
    const eventLabels = new Set()
    const summaries = new Set()
    const quadris = new Set()
    Object.values(events).forEach(day => Object.values(day).forEach(report => {
        report.events.forEach(event => {
            const label = event.isDevis ? event.devis : (event.isHoliday ? event.holiday : '—')
            eventLabels.add(label)
            if (!event.isDevis && !event.isHoliday && event.summary) {
                const short = event.summary.length > 40 ? event.summary.substring(0, 37) + '…' : event.summary
                summaries.add(short)
            }
        })
        Object.keys(day).forEach(q => quadris.add(q))
    }))
    eventSelect.add(new Option(ALL, ''))
    Array.from(eventLabels).sort().forEach(label => eventSelect.add(new Option(label, label)))
    if (summaries.size > 0) {
        const optgroup = document.createElement('optgroup')
        optgroup.label = 'Autres (mot-clé)'
        Array.from(summaries).sort().forEach(s => optgroup.add(new Option(s, s)))
        eventSelect.append(optgroup)
    }
    userSelect.add(new Option(ALL, ''))
    Array.from(quadris).sort().forEach(q => userSelect.add(new Option(q, q)))
    toolbar.append(eventLabel, eventSelect, userLabel, userSelect)
    const dayHeader = document.createElement('th')
    dayHeader.textContent = 'Jour'
    const dayCell = (day) => {
        const cell = newCell('td', day)
        const date = new Date(day + 'T12:00:00')
        if (date.getDay() === 0 || date.getDay() === 6) {
            cell.classList.add('wai-seen-away')
        }
        return cell
    }
    const labelCell = (event) => {
        const label = event.isDevis ? event.devis : (event.isHoliday ? event.holiday : '—')
        const cell = newCell('td', label)
        if (event.isAllDayDevisImportant) {
            cell.classList.add('wai-seen-pending')
        } else if (event.isAllDay) {
            cell.title = 'Événement global'
        }
        if (!event.isDevis && !event.isHoliday) {
            cell.classList.add('wai-unfilled')
        }
        if (event.isIgnoreEvent) {
            cell.style.textDecoration = 'line-through'
            cell.classList.add('wai-unfilled')
        }
        cell.title = (event.isIgnoreEvent ? 'Ignoré — ' : '') + event.summary
        return cell
    }
    const fmtHours = hours => Number(hours).toLocaleString('fr-FR')
    const fmtDays = days => Number(days).toLocaleString('fr-FR')
    const mkFoot = cols => {
        const foot = document.createElement('tr')
        cols.forEach(c => foot.append(newCell('th', c)))
        return foot
    }
    const detailTable = document.createElement('table')
    detailTable.id = 'devisTracker'
    detailTable.className = 'table table-striped'
    const detailHead = detailTable.createTHead()
    const headRow = document.createElement('tr')
    headRow.append(dayHeader, newCell('th', 'Collaborateur'), newCell('th', 'Devis / congé'), newCell('th', 'Heures'), newCell('th', 'Détail'))
    detailHead.append(headRow)
    const detailBody = detailTable.createTBody()
    const summarySection = document.createElement('div')
    const renderSummaryTable = (title, head, rows, foot) => {
        const h3 = document.createElement('h3')
        h3.textContent = title
        const table = document.createElement('table')
        table.className = 'table table-striped'
        table.createTHead().append(getHeaderWithValues(head))
        const body = table.createTBody()
        rows.forEach(row => body.append(row))
        if (foot) table.createTFoot().append(foot)
        const wrapper = document.createElement('div')
        wrapper.className = 'wai-table-scroll'
        wrapper.append(h3, table)
        return wrapper
    }
    const summaryRows = (data) => {
        let total = 0
        const rows = []
        Object.entries(data || {}).sort(([a], [b]) => a.localeCompare(b)).forEach(([label, value]) => {
            total += Number(value.hours)
            rows.push([label, fmtHours(value.hours), fmtDays(value.days)])
        })
        const foot = mkFoot(['Total', fmtHours(total), fmtDays(total / (res.hoursMaxDay || 8))])
        return { rows, foot }
    }
    const render = () => {
        detailBody.replaceChildren()
        summarySection.replaceChildren()
        const eventFilter = eventSelect.value
        const userFilter = userSelect.value
        let firstDay = true
        Object.keys(events).sort().forEach(day => {
            const quadrisForDay = Object.keys(events[day]).sort()
            if (userFilter) {
                const idx = quadrisForDay.indexOf(userFilter)
                if (idx !== -1) quadrisForDay.length = idx + 1
            }
            let firstQuadriForDay = true
            quadrisForDay.forEach(quadri => {
                const report = events[day][quadri]
                const dayCellEl = (firstDay || firstQuadriForDay) && !userFilter ? dayCell(day) : newCell('td', '')
                const quadriCell = newCell('td', quadri)
                if (report.isHalfDay) {
                    quadriCell.classList.add('wai-seen-away')
                    quadriCell.title = 'Demi-journée'
                }
                let firstEvent = true
                report.events.forEach(event => {
                    const label = event.isDevis ? event.devis : (event.isHoliday ? event.holiday : '—')
                    if (eventFilter) {
                        if (event.isDevis || event.isHoliday) {
                            if (label !== eventFilter) return
                        } else {
                            const short = event.summary.length > 40 ? event.summary.substring(0, 37) + '…' : event.summary
                            if (short !== eventFilter) return
                        }
                    }
                    const row = detailBody.insertRow()
                    row.append(firstEvent ? dayCellEl : newCell('td', ''), firstEvent ? quadriCell : newCell('td', ''), labelCell(event), newCell('td', fmtHours(event.hours)), newCell('td', event.summary))
                    firstEvent = false
                })
                if (firstEvent) {
                    const row = detailBody.insertRow()
                    row.append(dayCellEl, quadriCell, newCell('td', ''), newCell('td', ''), newCell('td', ''))
                }
                firstQuadriForDay = false
            })
            firstDay = false
        })
        if (detailBody.rows.length === 0) {
            const row = detailBody.insertRow()
            const cell = row.insertCell()
            cell.colSpan = 5
            const hint = document.createElement('p')
            hint.className = 'wai-empty'
            hint.textContent = 'Aucun événement sur cette période.'
            cell.appendChild(hint)
        }
        const mkRows = (rows) => rows.map(row => {
            const tr = document.createElement('tr')
            row.forEach(value => tr.append(newCell('td', value)))
            return tr
        })
        const byEvent = summaryRows(res.summary)
        summarySection.append(renderSummaryTable('∑ des événements', ['Événement', 'Heures', 'Jours'], mkRows(byEvent.rows), byEvent.foot))
        const byUserRows = []
        let byUserTotal = 0
        Object.entries(res.summaryByUser || {}).sort(([a], [b]) => a.localeCompare(b)).forEach(([label, data]) => {
            byUserTotal += Number(data.total.hours)
            byUserRows.push([label, '', fmtHours(data.total.hours), fmtDays(data.total.days)])
            Object.entries(data.users || {}).sort(([a], [b]) => a.localeCompare(b)).forEach(([quadri, value]) => {
                byUserRows.push(['', quadri, fmtHours(value.hours), fmtDays(value.days)])
            })
        })
        const byUserFoot = mkFoot(['Total', '', fmtHours(byUserTotal), fmtDays(byUserTotal / (res.hoursMaxDay || 8))])
        summarySection.append(renderSummaryTable('∑ des événements par utilisateur', ['Événement', 'Collaborateur', 'Heures', 'Jours'], mkRows(byUserRows), byUserFoot))
        app.append(toolbar, detailTable, summarySection)
    }
    eventSelect.addEventListener('change', render)
    userSelect.addEventListener('change', render)
    render()
}

export function newTableSeen(response, dtStart, dtEnd) {
    const res = JSON.parse(response)
    var totalPeople = 1
    const today = new Date()
    const periodLength = toInteger((new Date(dtEnd + 'T00:00:00') - new Date(dtStart + 'T00:00:00')) / (1000 * 3600 * 24))

    const table = document.createElement('table')
    table.setAttribute('id', 'lastSeen')
    table.setAttribute('class', 'table table-striped')

    let thead = document.createElement('thead')
    let tbody = document.createElement('tbody')

    const headLine = document.createElement('tr')
    headLine.appendChild(newCell('th', ""))

    Array.from(Object.keys(res)).forEach(person => {
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
    Array.from(table.rows).forEach(r => {
        if (rows > 0) {
            let peoplerow = r.cells[0].innerText;
            for (var cellPosition = 1; cellPosition < totalPeople; cellPosition++) {

                let peoplecolumn = table.rows[0].cells[cellPosition].innerText

                let msg = '◷';
                let title = 'Pas de croisement sur cette période';
                var daysLastSeen = -1

                if (peoplerow === peoplecolumn) {
                    msg = "-";
                    daysLastSeen = 0
                }

                if (res[peoplerow] != null && res[peoplerow][peoplecolumn] != null) {
                    title = res[peoplerow][peoplecolumn].place;
                    msg = res[peoplerow][peoplecolumn].seen;

                    const timeLastSeen = new Date(today - new Date(msg.replace(/(\d{2})-(\d{2})-(\d{4})/, "$2/$1/$3")))
                    daysLastSeen = timeLastSeen / (1000 * 3600 * 24)
                    if (daysLastSeen < 0) {
                        res[peoplerow][peoplecolumn].count += daysLastSeen
                        res[peoplerow][peoplecolumn].count = toInteger(res[peoplerow][peoplecolumn].count)
                        daysLastSeen = 0
                    }
                    else
                        daysLastSeen = toInteger(daysLastSeen)
                    if (daysLastSeen == 0)
                        title = title + " today"
                    else
                        title = title + ' ' + daysLastSeen + ' day(s) ago'
                    title = title + " (" + res[peoplerow][peoplecolumn].count + ' jour(s) en commun)'
                }


                let newCell = r.insertCell(cellPosition)
                let newText = document.createTextNode(msg)
                newCell.setAttribute('title', title)
                newCell.appendChild(newText)

                if (daysLastSeen >= toInteger(FRACTION_FOR_ORANGE * periodLength)) {
                    newCell.classList.add('wai-seen-away')
                }
                if (daysLastSeen == -1 || daysLastSeen >= toInteger(FRACTION_FOR_RED * periodLength) && peoplerow != peoplecolumn) {
                    newCell.classList.add('wai-seen-pending')
                    newCell.title = 'Aucun croisement récent à Cenon, Bordeaux ou DNUM sur la période'
                    if (daysLastSeen === -1) newCell.setAttribute('aria-label', 'Pas encore croisés sur cette période')
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
    // var from = new Date(dtStart + 'T00:00:00')
    // var to = new Date(dtEnd + 'T00:00:00')
    const head = getHeader(new Date(dtStart + 'T00:00:00'), new Date(dtEnd + 'T00:00:00'), tablename == BY_EMPLOYEE)
    thead.appendChild(head)

    const to = new Date(dtEnd + 'T00:00:00')
    const res = JSON.parse(response)
    let icons = getAllIcons().onload()
    let whitelistKeys
    if (tablename === BY_LOCATION)
        whitelistKeys = getTags(ACCOUNTED_FOR_KEYS).onload().map(element => element.word.toLowerCase())

    Array.from(Object.keys(res)).forEach(element => {
        let from = new Date(dtStart + 'T00:00:00')
        const userListEvents = new ListEvents(element, res[element])
        if (tablename === BY_LOCATION) {
            tbody = getContent(tbody, head, 1, userListEvents, BY_LOCATION, icons, whitelistKeys)
        } else {
            tbody = getContent(tbody, head, 2, userListEvents, BY_EMPLOYEE, icons)
        }
    })

    if (tablename === BY_LOCATION) {
        tfoot.appendChild(getTotal(tbody))
    }

    tfoot.appendChild(getHeader(new Date(dtStart + 'T00:00:00'), to, tablename == BY_EMPLOYEE))

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
        let totalByDay2 = 0
        Array.from(tbody.getElementsByTagName('tr')).forEach(element => {
            let mainDiv = element.getElementsByTagName('td')[i].children[0]
            totalByDay += parseInt(mainDiv.firstChild.innerText)
            if (mainDiv.children.length === 2)
                totalByDay2 += parseInt(mainDiv.children[1].innerText)
            else
                totalByDay2 += parseInt(mainDiv.firstChild.innerText)
        })
        const cell = newCell('td', '')
        cell.className = 'td-location'
        const split = document.createElement('div')
        split.className = 'cell-main'
        ;[['Matin', totalByDay], ['Après-midi', totalByDay2]].forEach(([label, total]) => {
            const half = document.createElement('div')
            half.className = 'cell-base-two'
            half.textContent = Number.isFinite(total) ? total : 0
            half.setAttribute('aria-label', `${label} : ${half.textContent} personne(s)`)
            half.title = `${label} : ${half.textContent} personne(s)`
            split.append(half)
        })
        cell.append(split)
        line.appendChild(cell)
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
function newCell (type, data, style = '', titre = '') {
    const myCell = document.createElement(type)
    myCell.setAttribute('style', style)
    myCell.innerText = data
    myCell.title = titre
    return myCell
}

/**
 * Header of table
 * @param {*} from
 * @param {*} to
 * @returns
 */
function getHeader(from, to, tablePersonne = false) {
    const line = document.createElement('tr')
    let titre = (tablePersonne) ? 'Personne' : 'Lieu'
    line.appendChild(newCell('th', titre))
    if (tablePersonne)
        line.appendChild(newCell('th', 'Clés'))
    while (from <= to) {
        // If the day is a Saturday or a Sunday, we don't count it
        if (from.getDay() !== 0 && from.getDay() !== 6) {
            const cell = newCell('th', daysFr[from.getDay()].slice(0, 3) + '\n' + from.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }))
            cell.dataset.date = `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, '0')}-${String(from.getDate()).padStart(2, '0')}`
            if (!tablePersonne) {
                cell.classList.add('wai-location-day')
                const halves = document.createElement('div')
                halves.className = 'wai-half-headings'
                halves.append(newCell('span', 'Matin'), newCell('span', 'Après-midi'))
                cell.append(halves)
            }
            line.appendChild(cell)
        }
        from.setDate(from.getDate() + 1)
    }
    return line
}


/**
 * Creates an 'tr' element with given values
 * @param {Array} values
 * @returns
 */
function getHeaderWithValues(values) {
    const line = document.createElement('tr')
    Array.from(values).forEach(value => {
        line.appendChild(newCell('th', value))
    })
    return line
}

/**
 * Fills the content of the table from the values of the header starting at index "startIndex"
 * @param {*} tbody
 * @param {*} headerLine
 * @param {*} startIndex
 * @param {*} userListEvents
 * @param {*} icons
 * @param {*} count
 * @returns
 */
function getContent(tbody, headerLine, startIndex, userListEvents, type, icons = null, whitelistKeys = null) {
    const line = document.createElement('tr')
    let td = newCell('td', userListEvents.id)
    line.appendChild(td)
    let placeIsExcluded
    if (type === BY_EMPLOYEE) {
        let iconsCell = newCell('td', '')
        line.appendChild(iconsCell)
        icons = groupBy(icons, "person")
        let tetra = Events.compute_tetragraph(userListEvents.id)
        if (icons[tetra] != undefined)
            setTitleWithIcons(iconsCell, icons[tetra], true)
    }
    else if (type === BY_LOCATION)
        placeIsExcluded = !whitelistKeys.includes(userListEvents.id)

    let counter = 0
    Array.from(headerLine.children).forEach(elem => {
        let value
        if (counter >= startIndex) {
            if (type === BY_EMPLOYEE || type === BY_LOCATION) {
                value = new Date(elem.dataset.date + 'T12:00:00')
            }
            else if (type === HR_SUMMARY) {
                value = elem.innerText
            }

            if (type === BY_EMPLOYEE) {
                line.appendChild(userListEvents.eventsAtDay(value))
            } else if (type === BY_LOCATION) {
                line.appendChild(userListEvents.eventsAtDayCount(value, icons, placeIsExcluded))
            } else if (type === HR_SUMMARY) {
                let dtStart = new Date(`${document.getElementById('dtStart').value}T00:00`)
                let dtEnd = new Date(`${document.getElementById('dtEnd').value}T23:59`)
                line.appendChild(userListEvents.countTypeForUser(value, dtStart, dtEnd))
            }
        }

        counter += 1
    })
    tbody.appendChild(line)
    return tbody
}


/**
 *
 * @param {Array} dataSent
 * @param {*} response
 */
export function newTableHR(dataSent, response) {
    const tableName = HR_SUMMARY
    const table = document.createElement('table')
    const thead = document.createElement('thead')
    let tbody = document.createElement('tbody')
    const tfoot = document.createElement('tfoot')

    table.setAttribute('id', tableName)
    table.setAttribute('class', 'table table-striped')

    const places = getTags(ALLOWED_PLACES).onload().map(elem => elem.word)
    const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    const priority = value => /rtt|teletravail|remote|conge|vacation|leave/.test(normalize(value))
    const primary = places.filter(priority)
    const additional = places.filter(value => !priority(value))
    var headerValues = ['Personne'].concat(primary, additional, ['Total'])
    const head = getHeaderWithValues(headerValues)
    thead.appendChild(head)

    const res = JSON.parse(response)
    Object.keys(res).forEach(element => {
        const userListEvents = new ListEvents(element, res[element])
        tbody = getContent(tbody, head, 1, userListEvents, tableName)

    })

    tfoot.appendChild(getHeaderWithValues(headerValues))

    table.appendChild(thead)
    table.appendChild(tbody)
    table.appendChild(tfoot)
    document.getElementById('myapp').innerHTML = ''
    document.getElementById('myapp').appendChild(table)
    const dt = new DataTable('#' + tableName, { ...optionDatatable1, stateSave: false })
    const options = document.createElement('details')
    options.className = 'wai-columns'
    const summary = document.createElement('summary')
    summary.textContent = 'Colonnes additionnelles'
    options.append(summary)
    additional.concat(['Total']).forEach((place, offset) => {
        const index = 1 + primary.length + offset
        dt.column(index).visible(false, false)
        const label = document.createElement('label')
        const checkbox = document.createElement('input')
        checkbox.type = 'checkbox'
        checkbox.addEventListener('change', () => { dt.column(index).visible(checkbox.checked); dt.columns.adjust() })
        label.append(checkbox, document.createTextNode(place))
        options.append(label)
    })
    document.getElementById('myapp').prepend(options)
    dt.columns.adjust().draw(false)
}
