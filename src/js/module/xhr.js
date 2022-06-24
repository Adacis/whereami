import { showError, showSuccess } from '@nextcloud/dialogs'
import { generateUrl } from '@nextcloud/router'
import { daysFr, ListEvents } from '../class/ListEvents'
import { optionDatatable } from '../main'
export const baseUrl = generateUrl('/apps/whereami')

/**
 *
 * @param {*} dtStart
 * @param {*} dtEnd
 * @param {*} DataTable
 * @param {*} classement
 */
export function getData (dtStart, dtEnd, DataTable, classement) {
  const data = {
    classement,
    dtStart,
    dtEnd
  }

  const oReq = new XMLHttpRequest()
  oReq.open('POST', baseUrl + '/getEvents', true)
  oReq.setRequestHeader('Content-Type', 'application/json')
  oReq.setRequestHeader('requesttoken', oc_requesttoken)
  oReq.onload = function (e) {
    if (this.status === 200) {
      newTablePersonne(this.response, dtStart, dtEnd, classement)
      new DataTable('#' + classement, optionDatatable)
      showSuccess('table loaded')
    } else {
      showError(this.response)
    }
  }
  oReq.send(JSON.stringify(data))
}

/**
 *
 * @param {*} response
 * @param {*} dtStart
 * @param {*} dtEnd
 * @param {*} tablename
 */
function newTablePersonne (response, dtStart, dtEnd, tablename) {
  const table = document.createElement('table')
  const thead = document.createElement('thead')
  let tbody = document.createElement('tbody')
  const tfoot = document.createElement('tfoot')

  table.setAttribute('id', tablename)
  table.setAttribute('class', 'table table-striped')

  // var retHead = getHeader(from,to);
  // var from = new Date(dtStart)
  // var to = new Date(dtEnd)
  thead.appendChild(getHeader(new Date(dtStart), new Date(dtEnd)))

  const to = new Date(dtEnd)
  const res = JSON.parse(response)

  Object.keys(res).forEach(element => {
    let from = new Date(dtStart)
    const userListEvents = new ListEvents(element, res[element])
    if (tablename === 'summary') {
      tbody = getContent(tbody, from, to, userListEvents, true)
    } else {
      tbody = getContent(tbody, from, to, userListEvents, false)
    }
  })

  if (tablename === 'summary') {
    tfoot.appendChild(getTotal(tbody))
  }

  tfoot.appendChild(getHeader(new Date(dtStart), to))

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
function getTotal (tbody) {
  const line = document.createElement('tr')
  line.appendChild(newCell('td', 'Total'))

  const totalColumn = tbody.getElementsByTagName('tr')[0].getElementsByTagName('td').length
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
function newCell (type, data, style = '') {
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
function getHeader (from, to) {
  const line = document.createElement('tr')
  line.appendChild(newCell('th', 'Name'))
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
 * @param {*} count is true when displaying 'by location', false when displaying 'by employees'
 * @returns
 */
function getContent (tbody, from, to, userListEvents, count = false) {
  const line = document.createElement('tr')
  line.appendChild(newCell('td', userListEvents.id))
  while (from <= to) {
    if (!count) {
      line.appendChild(userListEvents.eventsAtDay(from))
    } else {
      line.appendChild(userListEvents.eventsAtDayCount(from))
    }

    from.setDate(from.getDate() + 1)
  }
  tbody.appendChild(line)
  return tbody
}
