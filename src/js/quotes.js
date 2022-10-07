import { getData } from './module/xhr'
import { translate as t } from '@nextcloud/l10n'
import DataTable from 'datatables.net-bs/js/dataTables.bootstrap.min.js'
import 'datatables.net-fixedcolumns/js/dataTables.fixedColumns'
import 'datatables.net-bs/css/dataTables.bootstrap.min.css'

window.addEventListener('click', e => {

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
function getLoader() {
  const center = document.createElement('center')
  const divLoader = document.createElement('div')
  divLoader.setAttribute('class', 'lds-dual-ring')
  center.appendChild(divLoader)
  return center
}
