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
 * Generates an HTML table displaying contract data based on the provided JSON response.
 * The JSON response should contain contracts and user data in the specified format.
 *
 * @param {string} response - The JSON response containing contracts and user data.
 * Format:
 * {
 *   "contracts": {
 *     "ContractID": {
 *       "ContractType": {
 *         "Date": Value
 *       }
 *     },
 *     ...
 *   },
 *   "userByContract": {
 *     "ContractID": {
 *       "ContractType": TotalValue,
 *       ...
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
    const label = document.createElement('label')
    label.htmlFor = 'contractSelect'
    label.textContent = 'Devis'
    const select = document.createElement('select')
    select.id = 'contractSelect'
    select.add(new Option('Choisir un devis…', ''))
    Object.keys(res.userByContract || {}).sort().forEach(key => select.add(new Option(key, key)))
    toolbar.append(label, select)
    const result = document.createElement('div')
    result.className = 'wai-table-scroll'
    result.setAttribute('aria-live', 'polite')
    app.append(toolbar, result)
    const render = () => {
        result.replaceChildren()
        if (!select.value) {
            const hint = document.createElement('p')
            hint.className = 'wai-empty'
            hint.textContent = select.options.length > 1 ? 'Sélectionnez un devis pour afficher ses imputations.' : 'Aucune imputation sur cette période.'
            result.append(hint)
            return
        }
        const table = document.createElement('table')
        table.id = 'contracts'
        table.className = 'table table-striped'
        const head = table.createTHead()
        head.append(getHeaderWithValues(['Collaborateur', 'Jours imputés', 'Dates']))
        const body = table.createTBody()
        let total = 0
        Object.entries(res.userByContract[select.value]).sort(([a], [b]) => a.localeCompare(b)).forEach(([user, count]) => {
            const row = body.insertRow()
            row.append(newCell('td', user), newCell('td', Number(count).toLocaleString('fr-FR')), newCell('td', getAllDatesFromContract((res.contracts[select.value] || {})[user])))
            total += Number(count)
        })
        const foot = table.createTFoot().insertRow()
        foot.append(newCell('th', 'Total'), newCell('th', total.toLocaleString('fr-FR')), newCell('th', ''))
        result.append(table)
    }
    select.addEventListener('change', render)
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
