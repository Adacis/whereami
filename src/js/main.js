import { getData, lastSeen } from './module/xhr'
import { translate as t } from '@nextcloud/l10n'
import DataTable from 'datatables.net-bs/js/dataTables.bootstrap.min.js'
import 'datatables.net-fixedcolumns/js/dataTables.fixedColumns'
import 'datatables.net-bs/css/dataTables.bootstrap.min.css'

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

window.addEventListener('click', e => {

  if (e.target.className.includes('showbyemployees')) {
    document.getElementById('myapp').innerHTML = ''
    document.getElementById('myapp').appendChild(getLoader())
    getData(document.getElementById('dtStart').value, document.getElementById('dtEnd').value, DataTable, 'nextcloud_users')
  } 
  else if (e.target.className.includes('showbylocation')) {
    document.getElementById('myapp').innerHTML = ''
    document.getElementById('myapp').appendChild(getLoader())
    getData(document.getElementById('dtStart').value, document.getElementById('dtEnd').value, DataTable, 'summary')
  } 
  else if (e.target.className.includes('showbyquote')) {
    document.getElementById('myapp').innerHTML = ''
    document.getElementById('myapp').appendChild(getLoader())
    getData(document.getElementById('dtStart').value, document.getElementById('dtEnd').value, DataTable, 'summary')
  }
  else if (e.target.className.includes('lastSeen')) {
    document.getElementById('myapp').innerHTML = ''
    document.getElementById('myapp').appendChild(getLoader())
    lastSeen(document.getElementById('dtStart').value, document.getElementById('dtEnd').value, DataTable)
  }
  else if (e.target.className.includes('helper')) {
    document.getElementById('helper').style.display = 'block'
  } else if (e.target.className.includes('modalClose')) {
    e.target.parentElement.parentElement.style.display = 'none'
  }
})

window.addEventListener('DOMContentLoaded', function () {
  const toDay = new Date()
  document.getElementById('dtStart').valueAsDate = toDay
  toDay.setDate(toDay.getDate() + 15)
  document.getElementById('dtEnd').valueAsDate = toDay

  document.getElementById('myapp').appendChild(getLoader())
  getData(document.getElementById('dtStart').value,
    document.getElementById('dtEnd').value,
    DataTable,
    'nextcloud_users'
  )
})

/**
 *
 * @returns
 */
function getLoader () {
  const center = document.createElement('center')
  const divLoader = document.createElement('div')
  divLoader.setAttribute('class', 'lds-dual-ring')
  center.appendChild(divLoader)
  return center
}
