import { showError, showSuccess } from '@nextcloud/dialogs'
import { generateUrl } from '@nextcloud/router'
import { translate as t } from '@nextcloud/l10n'
import DataTable from 'datatables.net-bs/js/dataTables.bootstrap.min.js'
import 'datatables.net-fixedcolumns/js/dataTables.fixedColumns'
import 'datatables.net-bs/css/dataTables.bootstrap.min.css'
import { newTablePersonne, newTableSeen } from "./datatables.js"
import { makeIcsString } from './ics.js'
import { makeid, toFloatingString } from './utils.js'


export const baseUrl = generateUrl('/apps/whereami')
export const homeUrl = generateUrl('/')

export const optionDatatable2 = {
  scrollY: true,
  scrollX: true,
  scrollCollapse: true,
  autoWidth: false,
  stateSave: true,
  paging: false,
  fixedColumns: {
    left: 2
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

export const optionDatatable1 = {
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
export function getData(dtStart, dtEnd, classement, tableName, filter = null) {
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
      newTablePersonne(this.response, dtStart, dtEnd, tableName)
      if (tableName == 'byEmployee')
        var dt = new DataTable('#' + tableName, optionDatatable2)
      else
        var dt = new DataTable('#' + tableName, optionDatatable1)

      if (filter != null)
        dt.search(filter).draw()
      else
        dt.search('').draw()

      showSuccess('table loaded')
    } else {
      showError(this.response)
    }
  }
  oReq.send(JSON.stringify(data))
}

export function retrieveData(dtStart, dtEnd, classement, callback) {
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
      callback(data, this.response)
      showSuccess('table loaded')
    } else {
      showError(this.response)
    }
  }
  oReq.send(JSON.stringify(data))
}


export function lastSeen(dtStart, dtEnd) {
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
      newTableSeen(this.response, dtStart, dtEnd);
      new DataTable('#seen', optionDatatable1);
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
  oReq.open('GET', baseUrl + '/getAllIcons', false)
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


export function getCalendars() {
  const oReq = new XMLHttpRequest()
  oReq.open('GET', baseUrl + '/getCalendars', false)
  oReq.setRequestHeader('Content-Type', 'application/json')
  oReq.setRequestHeader('requesttoken', OC.requestToken)
  oReq.onload = function (e) {
    if (this.status === 200) {
      console.log("Received calendars");
      return JSON.parse(this.response);
    } else {
      console.log('Controller error');
      showError(this.response);
    }
  }
  oReq.send();
  return oReq;
}

/**
 * 
 * @param {Date} dtStart 
 * @param {Date} dtEnd 
 */
export function isTimeSlotAvailable(dtStart, dtEnd) {
  const data = {
    dtStart,
    dtEnd
  }

  const oReq = new XMLHttpRequest()
  oReq.open('POST', baseUrl + '/isTimeSlotAvailable', false)
  oReq.setRequestHeader('Content-Type', 'application/json')
  oReq.setRequestHeader('requesttoken', OC.requestToken)
  oReq.onload = function (e) {
    if (this.status === 200) {
      return JSON.parse(this.response)
    } else if (this.status === 204) {
      return true
    }
    else {
      showError(this.response)
    }
  }
  oReq.send(JSON.stringify(data))
  return oReq
}


export function registerNewEvent(event, calendar) {
  const uid = makeid(16)
  const data = makeIcsString(event.dateStart, event.dateEnd, event.summary, "", uid)

  const userID = calendar.principaluri.split('/').at(-1)
  const uri = calendar.uri
  const filename = userID + '/' + uri + '/' + uid + '.ics'

  const oReq = new XMLHttpRequest()
  oReq.open('PUT', homeUrl + 'remote.php/dav/calendars/' + filename, true)
  oReq.setRequestHeader('Content-Type', 'application/json')
  oReq.setRequestHeader('requesttoken', OC.requestToken)
  oReq.onload = function (e) {
    if (this.status === 201) {
      showSuccess('Event created')
    } else if (this.status == 204) {
      showSuccess('Event modified')
    } else {
      showError(this.response)
    }
  }
  oReq.send(data)
  return oReq;
}