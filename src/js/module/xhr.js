import { showError, showSuccess } from '@nextcloud/dialogs'
import { generateUrl } from '@nextcloud/router'
import { daysFr, ListEvents } from '../class/ListEvents'
export const baseUrl = generateUrl('/apps/whereami')

export const optionDatatable = {
  scrollY: true,
  scrollX: true,
  scrollCollapse: true,
  autoWidth: false,
  stateSave: true,
  paging: false,
  fixedColumns: {
    left: 1
  },
  language: {
    search: t('gestion', 'Search'),
    emptyTable: t('gestion', 'No data available in table'),
    info: t('gestion', 'Showing {start} to {end} of {total} entries', { start: '_START_', end: '_END_', total: '_TOTAL_' }),
    infoEmpty: t('gestion', 'Showing 0 to 0 of 0 entries'),
    loadingRecords: t('gestion', 'Loading records …'),
    processing: t('gestion', 'Processing …'),
    infoFiltered: t('gestion', '{max} entries filtered', { max: '_MAX_' }),
    lengthMenu: t('gestion', 'Show {menu} entries', { menu: '_MENU_' }),
    zeroRecords: t('gestion', 'No corresponding entry'),
    paginate: {
      first: t('gestion', 'First'),
      last: t('gestion', 'Last'),
      next: t('gestion', 'Next'),
      previous: t('gestion', 'Previous')
    },
    fixedHeader: {
      header: true,
      footer: true
    }
  }
}

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
  oReq.setRequestHeader('requesttoken', OC.requestToken)
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

export function lastSeen(dtStart, dtEnd, DataTable){
  const data = {
    dtStart,
    dtEnd
  }

  const oReq = new XMLHttpRequest()
  oReq.open('POST', baseUrl + '/getLastSeen', true)
  oReq.setRequestHeader('Content-Type', 'application/json')
  oReq.setRequestHeader('requesttoken', OC.requestToken)
  oReq.onload = function (e) {
    if (this.status === 200) {
      newTableSeen(this.response);
      new DataTable('#seen', optionDatatable);
    } else {
      showError(this.response);
    }
  }
  oReq.send(JSON.stringify(data));
}


function newTableSeen (response){
  const res = JSON.parse(response)
  var totalPeople = 1;

  const table = document.createElement('table')
  table.setAttribute('id', 'seen')
  table.setAttribute('class', 'table table-striped')

  let thead = document.createElement('thead')
  let tbody = document.createElement('tbody')

  const headLine = document.createElement('tr')
  headLine.appendChild(newCell('th', ""))

  Object.keys(res).forEach(element => {
    headLine.appendChild(newCell('th', element));
    var newLine = document.createElement('tr');
    newLine.appendChild(newCell('td',element));
    tbody.appendChild(newLine);

    totalPeople ++;
  })

  thead.appendChild(headLine);  
  table.appendChild(thead);
  table.appendChild(tbody);

  let rows = 0;
  table.rows.forEach(r => {
    if(rows > 0){
      for(var cellPosition = 1 ; cellPosition < totalPeople ; cellPosition++){
        let peoplerow = r.cells[0].innerText;
        let peoplecolumn = table.rows[0].cells[cellPosition].innerText
        
        let msg = ":'(";
        let title = "No title";

        if(peoplerow === peoplecolumn){
          msg = "-";
        }

        if(res[peoplerow]!=null && res[peoplerow][peoplecolumn] != null){
          title = res[peoplerow][peoplecolumn].place;
          msg = res[peoplerow][peoplecolumn].seen;
        }
  
        let newCell = r.insertCell(cellPosition);
        let newText = document.createTextNode(msg);
        newCell.setAttribute('title', title);
        newCell.appendChild(newText);
      }
    }
    rows ++;
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
  line.appendChild(newCell('th', 'Date'))
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
 * @param {*} count
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


/**
 * @param {*} tags
 */
export function sendTags (tags) {
  const data = {tags};

  const oReq = new XMLHttpRequest()
  oReq.open('POST', baseUrl + '/setTags', true)
  oReq.setRequestHeader('Content-Type', 'application/json')
  oReq.setRequestHeader('requesttoken', OC.requestToken)
  oReq.onload = function (e) {
    if (this.status === 200) {
      console.log(this.response);
    } else {
      console.log('Controller error');
      showError(this.response);
    }
  }
  oReq.send(JSON.stringify(data));
}