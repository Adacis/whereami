import { getData, lastSeen, optionDatatable } from '../module/xhr'
import { translate as t } from '@nextcloud/l10n'
import DataTable from 'datatables.net-bs/js/dataTables.bootstrap.min.js'
import 'datatables.net-fixedcolumns/js/dataTables.fixedColumns'
import 'datatables.net-bs/css/dataTables.bootstrap.min.css'



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
  // if page containing 'dtstart' not loaded
  // if (document.getElementById('dtStart') === null) {
  //   return;
  // }
  const toDay = new Date()
  document.getElementById('dtStart').valueAsDate = toDay
  toDay.setDate(toDay.getDate() + 7)
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
