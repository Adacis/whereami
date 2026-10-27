import { getData, lastSeen, retrieveData, getContracts, getDevisTracker } from '../module/xhr'
import { getLoader, newTableHR } from '../module/datatables'
import 'datatables.net-fixedcolumns/js/dataTables.fixedColumns'
import 'datatables.net-bs/css/dataTables.bootstrap.min.css'
import { getDateFirstOfMonth } from '../module/utils'
import { BY_EMPLOYEE, BY_LOCATION, HR_SUMMARY, LAST_SEEN, CONTRACTS, DEVIS_TRACKER } from '../config/config'
import { NewEventForm } from '../class/NewEventForm'

/**
 * set function
 */
function setHash(hash) {
  window.location.hash = hash
  const ids = { byEmployee: 'showByEmployees', byLocation: 'showByLocations', lastSeen: 'showLastSeen', HRSummary: 'showHRSummary', contracts: 'showContracts', devisTracker: 'showDevisTracker' }
  document.querySelectorAll('.wai-nav-item').forEach(button => button.setAttribute('aria-current', button.id === ids[hash] ? 'page' : 'false'))
  const descriptions = { byEmployee: 'Les présences de l’équipe en un coup d’œil.', byLocation: 'Les effectifs et les clés, lieu par lieu.', lastSeen: 'Derniers croisements à Cenon, Bordeaux et DNUM. Congés, RTT et télétravail exclus.', HRSummary: 'Le bilan mensuel des RTT, du télétravail et des congés, en jours.', contracts: 'Sélectionnez un devis pour consulter les jours imputés et les collaborateurs concernés.', devisTracker: 'Le temps passé par devis, en heures et en jours, semaine par semaine.' }
  document.getElementById('viewDescription').textContent = descriptions[hash]
}

function setButtonsMonths(summary) {
  document.getElementById('monthControls').hidden = !summary
  document.getElementById('rangeControls').hidden = summary
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
  const month = document.getElementById('summaryMonth')
  const year = document.getElementById('summaryYear')
  const date = new Date(Number(year.value), Number(month.value) + diff, 1, 12)
  month.value = date.getMonth()
  year.value = date.getFullYear()
  const format = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  document.getElementById('dtStart').value = format(date)
  document.getElementById('dtEnd').value = format(new Date(date.getFullYear(), date.getMonth() + 1, 0, 12))
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
  setButtonsMonths(false)

  const toDay = new Date()
  if (document.getElementById('contracts') === null) {
    document.getElementById('dtEnd').valueAsDate = toDay
    toDay.setDate(toDay.getDate() - 30)
    document.getElementById('dtStart').valueAsDate = toDay
  }
}

function setDateDevisTracker() {
  setButtonsMonths(true)
  const lbpControls = document.getElementById('lbpControls')
  if (lbpControls) lbpControls.hidden = false
  const lbpDevis = document.getElementById('lbpDevis')
  if (lbpDevis) lbpDevis.addEventListener('change', () => showDevisTracker())
  const now = new Date()
  const month = document.getElementById('summaryMonth')
  const year = document.getElementById('summaryYear')
  month.value = now.getMonth()
  year.value = now.getFullYear()
  setDateSummary(0)
}

function hideLbpControls() {
  const lbpControls = document.getElementById('lbpControls')
  if (lbpControls) lbpControls.hidden = true
}

/**
 * Show function
 */

function showHRSummary(diff = 0) {
  hideLbpControls()
  setDateSummary(diff)
  document.getElementById('finalPath').innerText = "Summary"
  document.getElementById('myapp').innerHTML = ''
  document.getElementById('myapp').appendChild(getLoader())
  retrieveData(document.getElementById('dtStart').value, document.getElementById('dtEnd').value, 'nextcloud_users', newTableHR)
  setHash(HR_SUMMARY)
}

function showByEmployees() {
  hideLbpControls()
  setDateUsual()
  document.getElementById('finalPath').innerText = "Employees"
  document.getElementById('myapp').innerHTML = ''
  document.getElementById('myapp').appendChild(getLoader())
  getData(document.getElementById('dtStart').value, document.getElementById('dtEnd').value, 'nextcloud_users', BY_EMPLOYEE)
  setHash(BY_EMPLOYEE)
}

function showByLocations() {
  hideLbpControls()
  setDateUsual()
  document.getElementById('finalPath').innerText = "Locations"
  document.getElementById('myapp').innerHTML = ''
  document.getElementById('myapp').appendChild(getLoader())
  getData(document.getElementById('dtStart').value, document.getElementById('dtEnd').value, 'place', BY_LOCATION)
  setHash(BY_LOCATION)
}

function showLastSeen() {
  hideLbpControls()
  setDateLastSeen()
  document.getElementById('finalPath').innerText = "Last Seen"
  document.getElementById('myapp').innerHTML = ''
  document.getElementById('myapp').appendChild(getLoader())
  lastSeen(document.getElementById('dtStart').value, document.getElementById('dtEnd').value)
  setHash(LAST_SEEN)
}

function showContracts(){
  hideLbpControls()
  setDateContracts()
  document.getElementById('finalPath').innerText = "Contracts"
  document.getElementById('myapp').innerHTML = ''
  document.getElementById('myapp').appendChild(getLoader())
  getContracts(document.getElementById('dtStart').value, document.getElementById('dtEnd').value)
  setHash(CONTRACTS)
}

function showDevisTracker(diff = 0) {
  if (diff === 0) {
    setDateDevisTracker()
  } else {
    setDateSummary(diff)
  }
  document.getElementById('finalPath').innerText = "Devis Tracker"
  document.getElementById('myapp').innerHTML = ''
  document.getElementById('myapp').appendChild(getLoader())
  getDevisTracker(document.getElementById('dtStart').value, document.getElementById('dtEnd').value, document.getElementById('lbpDevis').value)
  setHash(DEVIS_TRACKER)
}

/**
 * Event Listeners
 */

var form
let modalReturnFocus

function openModal(id, trigger) {
  modalReturnFocus = trigger
  const modal = document.getElementById(id)
  modal.style.display = 'block'
  modal.querySelector('.modalClose').focus()
}

function closeModal(modal) {
  modal.style.display = 'none'
  if (modalReturnFocus) modalReturnFocus.focus()
  if (modal.id === 'newEvent') form = undefined
}
window.addEventListener('click', event => {
  if (event.target.matches('.modal')) { closeModal(event.target); return }
  const target = event.target.closest('button, a, .helper, .modalClose')
  if (!target) return
  if (target.matches('.wai-help-body nav a')) {
    event.preventDefault()
    document.getElementById(target.hash.slice(1)).scrollIntoView({ block: 'start' })
    return
  }
  const e = { target }
  if (target.closest('.wai-navigation')) event.preventDefault()
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

  else if (e.target.id === 'showDevisTracker' || (document.getElementById(DEVIS_TRACKER) != null && e.target.className.includes('setDates'))) {
    showDevisTracker();
  }

  else if (e.target.id === 'addOneMonth') {
    if (document.getElementById(DEVIS_TRACKER) != null) {
      showDevisTracker(1)
    } else {
      showHRSummary(1)
    }
  }
  else if (e.target.id === 'removeOneMonth') {
    if (document.getElementById(DEVIS_TRACKER) != null) {
      showDevisTracker(-1)
    } else {
      showHRSummary(-1)
    }
  }

  else if (e.target.id === 'showNewEventForm') {
    form = new NewEventForm()

    openModal('newEvent', target)
    document.getElementById('modal-content-NewEvent').innerHTML = ''
    document.getElementById('modal-content-NewEvent').appendChild(form.form)
    form.dtStartE.focus()
  }

  else if (e.target.className.includes('helper')) {
    openModal('helper', target)
  } else if (e.target.className.includes('modalClose')) {
    closeModal(e.target.closest('.modal'))
  }
})

window.addEventListener('DOMContentLoaded', function () {
  const now = new Date()
  const month = document.getElementById('summaryMonth')
  for (let i = 0; i < 12; i++) month.add(new Option(new Date(2024, i, 1).toLocaleString('fr-FR', { month: 'long' }), i))
  month.value = now.getMonth()
  document.getElementById('summaryYear').value = now.getFullYear()
  month.addEventListener('change', () => showHRSummary())
  document.getElementById('summaryYear').addEventListener('change', () => { if (document.getElementById('summaryYear').checkValidity()) showHRSummary() })
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
    } else if (loc == DEVIS_TRACKER) {
      toShow = showDevisTracker;
    }
  }
  toShow();
})



window.addEventListener('keydown', e => {
  const modal = Array.from(document.querySelectorAll('.modal')).find(element => element.style.display === 'block')
  if (!modal) return
  if (e.key === 'Escape') modal.querySelector('.modalClose').click()
  if (e.key === 'Tab') {
    const controls = Array.from(modal.querySelectorAll('button, a[href], input, select, textarea, summary')).filter(el => !el.hidden && el.getClientRects().length && !el.disabled)
    const first = controls[0], last = controls[controls.length - 1]
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
  }
})
