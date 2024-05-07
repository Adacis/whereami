import { getData, lastSeen, retrieveData, getContracts } from '../module/xhr'
import { getLoader, newTableHR } from '../module/datatables'
import 'datatables.net-fixedcolumns/js/dataTables.fixedColumns'
import 'datatables.net-bs/css/dataTables.bootstrap.min.css'
import { getDateFirstOfMonth } from '../module/utils'
import { BY_EMPLOYEE, BY_LOCATION, HR_SUMMARY, LAST_SEEN, CONTRACTS } from '../config/config'
import { NewEventForm } from '../class/NewEventForm'

/**
 * set function
 */
function setHash(hash) {
  window.location.hash = hash
}

function setButtonsMonths(bool) {
  if (bool) {
    document.getElementById('addOneMonth').removeAttribute('hidden')
    document.getElementById('removeOneMonth').removeAttribute('hidden')
    document.getElementsByClassName('setDates')[0].setAttribute('hidden', true)
  }
  else {
    document.getElementById('addOneMonth').setAttribute('hidden', true)
    document.getElementById('removeOneMonth').setAttribute('hidden', true)
    document.getElementsByClassName('setDates')[0].removeAttribute('hidden')
  }
}

function setDateUsual() {
  setButtonsMonths(false)

  const toDay = new Date()
  if (document.getElementById(HR_SUMMARY) != null || document.getElementById(LAST_SEEN) != null) {
    document.getElementById('dtStart').valueAsDate = toDay
    toDay.setDate(toDay.getDate() + 14)
    document.getElementById('dtEnd').valueAsDate = toDay
  }
}

function setDateSummary(diff = 0) {
  setButtonsMonths(true)

  let start = getDateFirstOfMonth(diff)
  let end = getDateFirstOfMonth(1 + diff)
  end.setMinutes(end.getMinutes() - 1)
  document.getElementById('dtEnd').valueAsDate = end
  document.getElementById('dtStart').valueAsDate = start
}


function setDateLastSeen() {
  setButtonsMonths(false)

  const toDay = new Date()
  if (document.getElementById(LAST_SEEN) === null) {
    toDay.setDate(toDay.getDate())
    document.getElementById('dtEnd').valueAsDate = toDay
    toDay.setDate(toDay.getDate() - 35)
    document.getElementById('dtStart').valueAsDate = toDay
  }
}

function setDateContracts() {
  const toDay = new Date()
  if (document.getElementById('contracts') === null) {
    document.getElementById('dtEnd').valueAsDate = toDay
    toDay.setDate(toDay.getDate() - 30)
    document.getElementById('dtStart').valueAsDate = toDay
  }
}

/**
 * Show function
 */

function showHRSummary(diff = 0) {
  setDateSummary(diff)
  document.getElementById('finalPath').innerText = "Summary"
  document.getElementById('myapp').innerHTML = ''
  document.getElementById('myapp').appendChild(getLoader())
  retrieveData(document.getElementById('dtStart').value, document.getElementById('dtEnd').value, 'nextcloud_users', newTableHR)
  setHash(HR_SUMMARY)
}

function showByEmployees() {
  setDateUsual()
  document.getElementById('finalPath').innerText = "Employees"
  document.getElementById('myapp').innerHTML = ''
  document.getElementById('myapp').appendChild(getLoader())
  getData(document.getElementById('dtStart').value, document.getElementById('dtEnd').value, 'nextcloud_users', BY_EMPLOYEE)
  setHash(BY_EMPLOYEE)
}

function showByLocations() {
  setDateUsual()
  document.getElementById('finalPath').innerText = "Locations"
  document.getElementById('myapp').innerHTML = ''
  document.getElementById('myapp').appendChild(getLoader())
  getData(document.getElementById('dtStart').value, document.getElementById('dtEnd').value, 'place', BY_LOCATION)
  setHash(BY_LOCATION)
}

function showLastSeen() {
  setDateLastSeen()
  document.getElementById('finalPath').innerText = "Last Seen"
  document.getElementById('myapp').innerHTML = ''
  document.getElementById('myapp').appendChild(getLoader())
  lastSeen(document.getElementById('dtStart').value, document.getElementById('dtEnd').value)
  setHash(LAST_SEEN)
}

function showContracts(){
  setDateContracts()
  document.getElementById('finalPath').innerText = "Contracts"
  document.getElementById('myapp').innerHTML = ''
  document.getElementById('myapp').appendChild(getLoader())
  getContracts(document.getElementById('dtStart').value, document.getElementById('dtEnd').value)
  setHash(CONTRACTS)
}

/**
 * Event Listeners
 */

var form
window.addEventListener('click', e => {
  if (e.target.id === 'showByEmployees' || (e.target.className.includes('setDates') && document.getElementById(BY_EMPLOYEE) != null)) {
    showByEmployees();
  }

  else if (e.target.id === 'showByLocations' || (document.getElementById(BY_LOCATION) != null && e.target.className.includes('setDates'))) {
    showByLocations();
  }

  else if (e.target.id === 'showLastSeen' || (document.getElementById(LAST_SEEN) != null && e.target.className.includes('setDates'))) {
    showLastSeen();
  }

  else if (e.target.id === 'showHRSummary' || (document.getElementById(HR_SUMMARY) != null && e.target.className.includes('setDates'))) {
    showHRSummary();
  }

  else if (e.target.id === 'showContracts' || (document.getElementById(CONTRACTS) != null && e.target.className.includes('setDates'))) {
    showContracts();
  }

  else if (e.target.id === 'addOneMonth') {
    let realMonth = (new Date()).getMonth()
    let currentMonth = (new Date(document.getElementById('dtStart').value)).getMonth()
    showHRSummary(currentMonth - realMonth + 1)
  }

  else if (e.target.id === 'removeOneMonth') {
    let realMonth = (new Date()).getMonth()
    let currentMonth = (new Date(document.getElementById('dtStart').value)).getMonth()
    showHRSummary(currentMonth - realMonth - 1)
  }

  else if (e.target.id === 'showNewEventForm') {
    form = new NewEventForm()

    document.getElementById('newEvent').style.display = 'block'
    document.getElementById('modal-content-NewEvent').innerHTML = ''
    document.getElementById('modal-content-NewEvent').appendChild(form.form)
  }

  else if (e.target.className.includes('helper')) {
    document.getElementById('helper').style.display = 'block'
  } else if (e.target.className.includes('modalClose')) {
    e.target.parentElement.parentElement.style.display = 'none'
    form = undefined
  }
})

window.addEventListener('DOMContentLoaded', function () {
  setButtonsMonths(false)
  const toDay = new Date()
  document.getElementById('dtStart').valueAsDate = toDay
  toDay.setDate(toDay.getDate() + 14)
  document.getElementById('dtEnd').valueAsDate = toDay

  document.getElementById('myapp').appendChild(getLoader())
  let toShow = showByEmployees;
  if (window.location.hash) {
    let loc = window.location.hash.substring(1);
    if (loc == BY_LOCATION) {
      toShow = showByLocations;
    } else if (loc == HR_SUMMARY) {
      toShow = showHRSummary;
    } else if (loc == LAST_SEEN) {
      toShow = showLastSeen;
    } else if (loc== CONTRACTS) {
      toShow = showContracts;
    }
  }
  toShow();
})


