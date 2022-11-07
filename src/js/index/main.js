import { getData, lastSeen, optionDatatable, getLoader } from '../module/xhr'
import { translate as t } from '@nextcloud/l10n'
import 'datatables.net-fixedcolumns/js/dataTables.fixedColumns'
import 'datatables.net-bs/css/dataTables.bootstrap.min.css'

function setDateLastSeen() {
  const toDay = new Date()
  toDay.setDate(toDay.getDate() + 1)
  document.getElementById('dtEnd').valueAsDate = toDay
  toDay.setDate(toDay.getDate() - 35)
  document.getElementById('dtStart').valueAsDate = toDay
}

function setDateUsual() {
  const toDay = new Date()
  if (document.getElementById('seen') !== null) {
    document.getElementById('dtStart').valueAsDate = toDay
    toDay.setDate(toDay.getDate() + 14)
    document.getElementById('dtEnd').valueAsDate = toDay
  }
}


/**
 * Set the input fields for the dates to disabled or not
 * @param {Boolean} bool 
 */
function setDateDisabled(bool) {
  if (bool) {
    document.getElementById('dtStart').setAttribute('disabled', bool.toString());
    document.getElementById('dtEnd').setAttribute('disabled', bool.toString());
  }
  else {
    document.getElementById('dtStart').removeAttribute('disabled')
    document.getElementById('dtEnd').removeAttribute('disabled')
  }
}


window.addEventListener('click', e => {

  if (e.target.className.includes('showbyemployees')) {
    setDateUsual()
    setDateDisabled(false)
    document.getElementById('myapp').innerHTML = ''
    document.getElementById('myapp').appendChild(getLoader())
    getData(document.getElementById('dtStart').value, document.getElementById('dtEnd').value, 'nextcloud_users')
  }
  else if (e.target.className.includes('showbylocation')) {
    setDateUsual()
    setDateDisabled(false)
    document.getElementById('myapp').innerHTML = ''
    document.getElementById('myapp').appendChild(getLoader())
    getData(document.getElementById('dtStart').value, document.getElementById('dtEnd').value, 'summary')
  }
  else if (e.target.className.includes('showbyquote')) {
    setDateUsual()
    setDateDisabled(false)
    document.getElementById('myapp').innerHTML = ''
    document.getElementById('myapp').appendChild(getLoader())
    getData(document.getElementById('dtStart').value, document.getElementById('dtEnd').value, 'summary')
  }
  else if (e.target.className.includes('lastSeen')) {
    setDateLastSeen()
    setDateDisabled(true)
    document.getElementById('myapp').innerHTML = ''
    document.getElementById('myapp').appendChild(getLoader())
    lastSeen(document.getElementById('dtStart').value, document.getElementById('dtEnd').value)
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
  toDay.setDate(toDay.getDate() + 14)
  document.getElementById('dtEnd').valueAsDate = toDay

  document.getElementById('myapp').appendChild(getLoader())
  getData(document.getElementById('dtStart').value,
    document.getElementById('dtEnd').value,
    'nextcloud_users'
  )
})


