import { getCalendars, getTags, registerNewEvent, isTimeSlotAvailable } from '../module/xhr'
import { ALLOWED_CLIENTS, ALLOWED_PLACES } from '../config/config.js'
import { showError, showSuccess } from '@nextcloud/dialogs'
import { appendChildren, isWeekendDay } from '../module/utils'
import { translate as t } from '@nextcloud/l10n'
import "../../../css/formStyle.css"


export class NewEventForm {
    constructor(opts) {
        if (opts != undefined)
            opts && Object.assign(this.opts, opts)
        this.init()
        this.initEvents()
    }

    init() {
        this.form = document.createElementOptions('div', { id: "newEventForm" })
        this.form.classList.add('form-wrapper')

        let divDates = this.createDivDates()
        this.divCalendar = this.createDivCalendars()
        let divPlaces = this.createDivPlaces()
        let divSummary = this.createDivSummary()
        let divSubmit = this.createDivSubmit()

        this.populateSelectOptions()

        appendChildren(this.form, [divDates, this.divCalendar, divPlaces, divSummary, divSubmit])

        console.log('Form initialized')
    }

    get getFormE() {
        return this.form
    }

    createDivDates() {
        let div = document.createElement('div')

        let labelStart = document.createElementOptions('label', { innerText: t('whereami', 'Event from ') })
        this.dtStartE = document.createElementOptions('input', { type: 'date', id: 'dtStart' })
        let labelTo = document.createElementOptions('label', { innerText: t('whereami', ' to ') })
        this.dtEndE = document.createElementOptions('input', { type: 'date', id: 'dtEnd' })

        let divRound = document.createElement('span')
        divRound.classList.add('round')
        this.halfDayE = document.createElementOptions('input', { type: 'checkbox', id: 'halfDay' })
        let labelRound = document.createElement('label')
        labelRound.setAttribute('for', 'halfDay')
        appendChildren(divRound, [this.halfDayE, labelRound])

        let labelHalfDay = document.createElementOptions('label', { innerText: t('whereami', 'half day') })

        this.dateInfoE = document.createElementOptions('div', { id: 'dateInfo' })

        appendChildren(div, [labelStart, this.dtStartE, labelTo, this.dtEndE, divRound, labelHalfDay, this.dateInfoE])

        return div
    }

    createDivCalendars() {
        let div = document.createElement('div')

        let labelCalendar = document.createElementOptions('label', { innerText: t('whereami', 'Calendar : ') })
        this.selectCalendarE = document.createElementOptions('select', { id: 'calendar' })

        appendChildren(div, [labelCalendar, this.selectCalendarE])

        return div
    }

    createDivPlaces() {
        let div = document.createElement('div')

        this.labelPlacesE = document.createElementOptions('span', { id: 'labelPlaces' })
        this.labelPlacesE.classList.add('icon-address')
        this.selectPlace1E = document.createElementOptions('select', { id: 'place1', required: 'true' })
        this.selectPlace2E = document.createElementOptions('select', { id: 'place2', hidden: 'true', required: 'true' })

        appendChildren(div, [this.labelPlacesE, this.selectPlace1E, this.selectPlace2E])

        return div
    }

    createDivClients() {
        let div = document.createElement('div')

        this.labelClientsE = document.createElementOptions('label', { innerText: 'Client', id: 'labelClients' })
        let div2 = document.createElement('div')
        this.labelClientsAME = document.createElementOptions('label', { innerText: 'Matin', hidden: 'true', id: 'labelClientsAM' })
        this.selectClient1E = document.createElementOptions('select', { id: 'Client1' })
        this.labelClientsPME = document.createElementOptions('label', { innerText: 'Après-midi', hidden: 'true', id: 'labelClientsPM' })
        this.selectClient2E = document.createElementOptions('select', { id: 'Client2', hidden: 'true' })

        appendChildren(div2, [this.labelClientsAME, this.selectClient1E, this.labelClientsPME, this.selectClient2E])
        appendChildren(div, [this.labelClientsE, div2])

        return div
    }

    createDivSummary() {
        let div = document.createElement('div')

        let labelSummaryE = document.createElement('span')
        labelSummaryE.classList.add('icon-category-office')
        this.summaryAME = document.createElementOptions('input', { id: 'summary1', type: 'text', placeholder: t('whereami', 'Description') })
        this.summaryPME = document.createElementOptions('input', { id: 'summary1', type: 'text', placeholder: t('whereami', 'Description'), hidden: 'true' })

        appendChildren(div, [labelSummaryE, this.summaryAME, this.summaryPME])

        return div
    }

    createDivSubmit() {
        let div = document.createElement('div')

        this.submitE = document.createElementOptions('button', { id: 'submitButton', innerText: 'Créer' })

        div.appendChild(this.submitE)

        return div
    }

    populateSelectOptions() {
        new Promise(() => {
            let opts = []
            let values = []
            this.calendars = getCalendars().onload()
            this.calendars.forEach((elem) => {
                opts.push(elem.displayname)
                values.push(elem.id)
            })
            this.selectCalendarE.populate(opts, values)

            if (this.calendars.length === 1)
                this.divCalendar.setAttribute('hidden', 'true')
        })

        new Promise(() => {
            let res = ["Journée"]
            let values = [""]
            getTags(ALLOWED_PLACES).onload().forEach(element => {
                res.push(element.word)
                values.push(element.word)
            });
            this.selectPlace1E.populate(res, values)
            this.selectPlace2E.populate(res, values)

            this.selectPlace1E.firstChild.setAttribute('disabled', 'true')
            this.selectPlace2E.firstChild.setAttribute('disabled', 'true')
            this.selectPlace1E.firstChild.setAttribute('hidden', 'true')
            this.selectPlace2E.firstChild.setAttribute('hidden', 'true')
        })

        // new Promise(() => {
        //     let res = []
        //     getTags(ALLOWED_CLIENTS).onload().forEach(element => {
        //         res.push(element.word)
        //     })
        //     this.selectClient1E.populate(res)
        //     this.selectClient2E.populate(res)
        // })
    }

    emptyValues() {
        this.dtEndE.value = ''
        this.dtStartE.value = ''
        this.summaryAME.value = ''
        this.summaryPME.value = ''
        this.dateInfoE.innerText = ''
    }

    informSlotNotAvailable() {
        new Promise(() => {
            let response = isTimeSlotAvailable(this.dtStartE.value, this.dtEndE.value).onload()
            if (response === true) {
                this.dateInfoE.innerText = 'No conflict found.'
                this.dateInfoE.style = 'color:var(--color-success);'
            }
            else {
                this.dateInfoE.innerText = 'Conflict with event named : "' + response[0].summary + '"'
                this.dateInfoE.style = 'color:var(--color-error);'
            }
        })
    }

    checkFormValidity() {
        if (this.dtEndE.valueAsDate === null || this.dtStartE.valueAsDate === null) {
            showError(t('whereami', 'Please make sure to enter a valid date.'))
            return false
        }
        if (this.dtStartE.valueAsDate > this.dtEndE.valueAsDateEnd) {
            showError(t('whereami', 'Please make sure your end date is superior or equal to your start date.'))
            return false
        }

        if (this.selectPlace1E.value === '') {
            if (this.halfDayE.checked)
                showError(t('whereami', 'Please make sure to select the location for the morning.'))
            else
                showError(t('whereami', 'Please make sure to select the location.'))
            return false
        }
        if (this.halfDayE.checked && this.selectPlace2E.value === '') {
            showError(t('whereami', 'Please make sure to select the location for the afternoon.'))
            return false
        }

        return true
    }

    createSummary() {
        let place1 = this.selectPlace1E.value
        let place2 = this.selectPlace2E.value
        let summary1 = this.summaryAME.value
        let summary2 = this.summaryPME.value

        let res = '@' + place1

        if (this.halfDayE.checked) {
            res += ', @' + place2
        }

        if (summary1 != '')
            res += ', ' + summary1

        if (summary2 != '' && this.halfDayE.checked)
            res += ', ' + summary2

        return res
    }

    /**
     * We do not want to create events over the weekend, so we split the event to remove them
     * @param {Date} dtStart 
     * @param {Date} dtEnd 
     */
    createEvents(dtStart, dtEnd) {
        let res = []
        let tmpDtEnd
        while (dtStart < dtEnd) {
            if (isWeekendDay(dtStart)) {
                dtStart.setDate(dtStart.getDate() + 1)
            }
            else {
                tmpDtEnd = new Date(dtStart)
                while (tmpDtEnd < dtEnd && !isWeekendDay(tmpDtEnd)) {
                    tmpDtEnd.setDate(tmpDtEnd.getDate() + 1)
                    tmpDtEnd.setHours(0, 0, 0, 0) // just in case
                }

                res.push({
                    dateStart: new Date(dtStart),
                    dateEnd: new Date(tmpDtEnd),
                    summary: this.createSummary()
                })

                dtStart = tmpDtEnd
            }
        }

        return res
    }

    initEvents() {
        this.halfDayE.addEventListener('change', (event) => {
            if (event.currentTarget.checked) {
                this.selectPlace2E.removeAttribute('hidden')

                this.summaryPME.removeAttribute('hidden')

                this.selectPlace1E.firstChild.innerText = 'Matin'
                this.selectPlace2E.firstChild.innerText = 'Après-midi'
            } else {
                this.selectPlace2E.setAttribute('hidden', true)

                this.summaryPME.setAttribute('hidden', true)

                this.selectPlace1E.firstChild.innerText = 'Journée'
            }
        })

        this.dtStartE.addEventListener('change', (e) => {
            if (this.dtEndE.valueAsDate < this.dtStartE.valueAsDate || this.dtEndE.valueAsDate === null) {
                this.dtEndE.valueAsDate = this.dtStartE.valueAsDate
            }
            this.informSlotNotAvailable()
        })

        this.dtEndE.addEventListener('change', (e) => {
            if (this.dtEndE.valueAsDate < this.dtStartE.valueAsDate || this.dtStartE.valueAsDate === null) {
                this.dtStartE.valueAsDate = this.dtEndE.valueAsDate
            }
            this.informSlotNotAvailable()
        })

        // this.selectPlace1E.addEventListener('change', (e) => {
        //     if (this.selectPlace1E.value === "-1") {
        //         this.selectClient1E.style = "color: var(--color-placeholder-dark);"
        //     } else {
        //         this.selectClient1E.style = ""
        //     }
        // })


        // creating and uploading the event
        this.submitE.addEventListener('click', (e) => {
            if (!this.checkFormValidity())
                return

            let dateStart = new Date(this.dtStartE.valueAsDate)
            dateStart.setHours(0, 0, 0, 0)
            let dateEnd = new Date(this.dtEndE.valueAsDate)
            dateEnd.setDate(dateEnd.getDate() + 1)
            dateEnd.setHours(0, 0, 0, 0)

            let selectedCalendar
            this.calendars.forEach(elem => {
                if (elem.id == this.selectCalendarE.value)
                    selectedCalendar = elem
            })

            this.createEvents(dateStart, dateEnd).forEach(event => {
                registerNewEvent(event, selectedCalendar)
            });

            this.emptyValues()
        })
    }
}