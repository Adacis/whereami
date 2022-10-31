import { showError, showSuccess } from '@nextcloud/dialogs'
import { generateUrl } from '@nextcloud/router'
import { toInteger } from 'lodash'
import { groupBy } from 'lodash/collection'
import { Events } from '../class/Event'
import { daysFr, ListEvents } from '../class/ListEvents'
import { translate as tr } from '@nextcloud/l10n'
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
export function getData(dtStart, dtEnd, DataTable, classement) {
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

export function lastSeen(dtStart, dtEnd, DataTable) {
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


/**
 * Get icons corresponding to person, with label if given
 * @param {string} person 
 * @param {string} label 
 */
export function getIcons(person, label = "") {
  const data = {
    person,
    label
  }

  const oReq = new XMLHttpRequest()
  oReq.open('POST', baseUrl + '/getIcons', false)
  oReq.setRequestHeader('Content-Type', 'application/json')
  oReq.setRequestHeader('requesttoken', OC.requestToken)
  oReq.onload = function (e) {
    if (this.status === 200) {
      return JSON.parse(this.response);
    } else {
      showError(this.response);
    }
  }
  oReq.send(JSON.stringify(data));
  return oReq;
}


function setTitleWithIcons(element, icons) {
  for (let dic of icons) {
    element.title = dic.prefix + "(" + dic.label + ")\n" + element.title;
    element.innerText = dic.prefix + element.innerText;
  }
}


function newTableSeen(response) {
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
function newTablePersonne(response, dtStart, dtEnd, tablename) {
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
  let icons = getAllIcons().onload()
  Object.keys(res).forEach(element => {
    let from = new Date(dtStart)
    const userListEvents = new ListEvents(element, res[element])
    if (tablename === 'summary') {
      tbody = getContent(tbody, from, to, userListEvents, icons, true)
    } else {
      tbody = getContent(tbody, from, to, userListEvents, icons, false)
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
function getTotal(tbody) {
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
function getHeader(from, to) {
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
 * @param {*} icons
 * @param {*} count
 * @returns
 */
function getContent(tbody, from, to, userListEvents, icons, count = false) {
  const line = document.createElement('tr')
  let td = newCell('td', userListEvents.id)
  line.appendChild(td)
  if (!count) {
    icons = groupBy(icons, "person")
    let tetra = Events.compute_tetragraph(userListEvents.id)
    if (icons[tetra] != undefined)
      setTitleWithIcons(td, icons[tetra])

  }

  while (from <= to) {
    if (!count) {
      line.appendChild(userListEvents.eventsAtDay(from))
    } else {
      line.appendChild(userListEvents.eventsAtDayCount(from, icons))
    }

    from.setDate(from.getDate() + 1)
  }
  tbody.appendChild(line)
  return tbody
}


/**
 * @param {*} tags
 */
export function sendTags(tag) {
  const data = { tag };

  const oReq = new XMLHttpRequest()
  oReq.open('POST', baseUrl + '/setTags', true)
  oReq.setRequestHeader('Content-Type', 'application/json')
  oReq.setRequestHeader('requesttoken', OC.requestToken)
  oReq.onload = function (e) {
    if (this.status === 200) {
      console.log("Tag sent.");
    } else {
      console.log('Controller error');
      showError(this.response);
    }
  }
  oReq.send(JSON.stringify(data));
}


export function deleteTag(tag) {
  const data = { tag };

  const oReq = new XMLHttpRequest()
  oReq.open('POST', baseUrl + '/deleteTag', true)
  oReq.setRequestHeader('Content-Type', 'application/json')
  oReq.setRequestHeader('requesttoken', OC.requestToken)
  oReq.onload = function (e) {
    if (this.status === 200) {
      console.log("Tag deleted.");
    } else {
      console.log('Controller error');
      showError(this.response);
    }
  }
  oReq.send(JSON.stringify(data));
}

export function getTags(usage) {
  const data = { usage };

  const oReq = new XMLHttpRequest()
  oReq.open('POST', baseUrl + '/getTags', false)
  oReq.setRequestHeader('Content-Type', 'application/json')
  oReq.setRequestHeader('requesttoken', OC.requestToken)
  oReq.onload = function (e) {
    if (this.status === 200) {
      console.log("Tag retrieved.");
      return JSON.parse(this.response);
    } else {
      console.log('Controller error');
      showError(this.response);
    }
  }
  oReq.send(JSON.stringify(data));
  return oReq;
}

export function sendIcon(person, prefix, label, changeLabel, changeIcon) {
  person = person.toUpperCase()
  const data = {
    person,
    prefix,
    label
  }

  if (person.length !== 4) {
    alert("Merci de vous assurer d'entrer le quadrigramme de la personne.");
    return;
  }

  const oReq = new XMLHttpRequest()
  if (changeLabel && !changeIcon)
    oReq.open('POST', baseUrl + '/changeLabel', true)
  else if (changeIcon && !changeLabel)
    oReq.open('POST', baseUrl + '/changeIcon', true)
  else if (!changeIcon && !changeLabel)
    oReq.open('POST', baseUrl + '/setIcon', true)
  else {
    showError("Cannot change Label and Icon at the same time");
    return;
  }
  oReq.setRequestHeader('Content-Type', 'application/json')
  oReq.setRequestHeader('requesttoken', OC.requestToken)
  oReq.onload = function (e) {
    if (this.status === 200) {
      console.log('Icon set (XHR)');
      return this.response;
    } else {
      console.log('Controller error');
      showError(this.response);
    }
  }
  oReq.send(JSON.stringify(data));
  return oReq;
}

export function deleteIcon(person, prefix, label) {
  const data = {
    person,
    prefix,
    label,
  }

  const oReq = new XMLHttpRequest()
  oReq.open('POST', baseUrl + '/deleteIcon', true)
  oReq.setRequestHeader('Content-Type', 'application/json')
  oReq.setRequestHeader('requesttoken', OC.requestToken)
  oReq.onload = function (e) {
    if (this.status === 200) {
      console.log("Icon deleted");
    } else {
      console.log('Controller error');
      showError(this.response);
    }
  }
  oReq.send(JSON.stringify(data));
}


export function getAllIcons() {
  const oReq = new XMLHttpRequest()
  oReq.open('POST', baseUrl + '/getAllIcons', false)
  oReq.setRequestHeader('Content-Type', 'application/json')
  oReq.setRequestHeader('requesttoken', OC.requestToken)
  oReq.onload = function (e) {
    if (this.status === 200) {
      console.log("Received all icons.");
      return JSON.parse(this.response);
    } else {
      console.log('Controller error');
      showError(this.response);
    }
  }
  oReq.send();
  return oReq;
}