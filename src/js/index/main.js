import { getData, lastSeen, retrieveData } from '../module/xhr'
import { getLoader, newTableHR } from '../module/datatables'
import 'datatables.net-fixedcolumns/js/dataTables.fixedColumns'
import 'datatables.net-bs/css/dataTables.bootstrap.min.css'

function setDateUsual() {
  const toDay = new Date()
  if (document.getElementById('HRsummary') != null || document.getElementById('seen') != null) {
    document.getElementById('dtStart').valueAsDate = toDay
    toDay.setDate(toDay.getDate() + 14)
    document.getElementById('dtEnd').valueAsDate = toDay
  }
}

function setDateSummary() {
  const toDay = new Date()
  if (document.getElementById('HRsummary') === null) {
    document.getElementById('dtEnd').valueAsDate = toDay
    toDay.setDate(toDay.getDate() - 30)
    document.getElementById('dtStart').valueAsDate = toDay
  }
}

function setDateLastSeen() {
  const toDay = new Date()
  if (document.getElementById('seen') === null) {
    toDay.setDate(toDay.getDate())
    document.getElementById('dtEnd').valueAsDate = toDay
    toDay.setDate(toDay.getDate() - 35)
    document.getElementById('dtStart').valueAsDate = toDay
  }
}


window.addEventListener('click', e => {

  if (e.target.id === 'showByEmployees' || (e.target.className.includes('setDates') && document.getElementById('byEmployee') != null)) {
    setDateUsual()
    document.getElementById('finalPath').innerText = "Employees"
    document.getElementById('myapp').innerHTML = ''
    document.getElementById('myapp').appendChild(getLoader())
    getData(document.getElementById('dtStart').value, document.getElementById('dtEnd').value, 'nextcloud_users', 'byEmployee')
  }

  else if (e.target.id === 'showByLocations' || (document.getElementById('byLocation') != null && e.target.className.includes('setDates'))) {
    setDateUsual()
    document.getElementById('finalPath').innerText = "Locations"
    document.getElementById('myapp').innerHTML = ''
    document.getElementById('myapp').appendChild(getLoader())
    getData(document.getElementById('dtStart').value, document.getElementById('dtEnd').value, 'place', 'byLocation')
  }

  else if (e.target.id === 'showLastSeen' || (document.getElementById('seen') != null && e.target.className.includes('setDates'))) {
    setDateLastSeen()
    document.getElementById('finalPath').innerText = "Last Seen"
    document.getElementById('myapp').innerHTML = ''
    document.getElementById('myapp').appendChild(getLoader())
    lastSeen(document.getElementById('dtStart').value, document.getElementById('dtEnd').value)
  }

  else if (e.target.id === 'showHRSummary' || (document.getElementById('HRsummary') != null && e.target.className.includes('setDates'))) {
    setDateSummary()
    document.getElementById('finalPath').innerText = "Summary"
    document.getElementById('myapp').innerHTML = ''
    document.getElementById('myapp').appendChild(getLoader())
    retrieveData(document.getElementById('dtStart').value, document.getElementById('dtEnd').value, 'nextcloud_users', newTableHR)
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
  toDay.setDate(toDay.getDate() + 14)
  document.getElementById('dtEnd').valueAsDate = toDay

  document.getElementById('myapp').appendChild(getLoader())
  getData(document.getElementById('dtStart').value,
    document.getElementById('dtEnd').value,
    'nextcloud_users',
    'byEmployee'
  )
})


