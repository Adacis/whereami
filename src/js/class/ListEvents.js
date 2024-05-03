import { Events } from './Event';
import { groupBy } from 'lodash/collection';


export const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
export const daysFr = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi']

/**
 *
 */
export class ListEvents {
  /**
     *
     * @param {*} element
     * @param {*} le
     */
  constructor(element, le) {
    this.id = element
    this.ListEvents = le
  }

  /**
     *
     * @param {*} from
     * @returns
     */
  eventsAtDay(from) {
    const myCell = document.createElement('td')
    let found = false
    let res = ' '
    let title = ''

    this.ListEvents.forEach(events => {
      const e = new Events(events)
      if (e.inInterval(from)) {
        const filter = e.getSummary()
        //res += filter.includes(',') ? filter.split(',')[0] + '<br/>' : filter + '<br/>'
        res += e.place + '<br/>'
        if (e.place2 === '')
          title += filter.includes(',') ? filter.split(',')[1] + '\n' : ''
        else {
          res += e.place2 + '<br/>'
          title += filter.includes(',') ? filter.split(',')[2] + '\n' : ''
        }

        found = true
      }
    })

    if (days[from.getDay()] === 'sunday' || days[from.getDay()] === 'saturday') {
      myCell.setAttribute('style', 'background-color: var(--color-box-shadow);')
      res = ''
    } else if (!found) {
      myCell.setAttribute('style', 'background-color: yellow; color: #222;')
      res += 'shame'
    }

    myCell.setAttribute('title', title)
    myCell.innerHTML = res
    return myCell
  }

  createDiv(res, title, found, isSomeoneThere, from) {
    let myDiv = document.createElement('div')
    myDiv.setAttribute('title', title)

    myDiv.innerText = res

    if (days[from.getDay()] === 'sunday' || days[from.getDay()] === 'saturday') {
      myDiv.classList.add('cell-weekend')
      myDiv.innerText = ' \n'
    } else if (!found) {
      myDiv.classList.add('cell-no-one')
      myDiv.innerText = '0'
    }
    else if (!isSomeoneThere)
      myDiv.classList.add('cell-no-keys')

    return myDiv
  }

  /**
     *
     * @param {*} from
     * @param {*} icons
     * @param {*} exluded_places
     * @returns
     */
  eventsAtDayCount(from, icons, placeIsExcluded) {
    const myCell = document.createElement('td')
    let found = false
    let found2 = false
    let res = 0
    let res2 = 0
    let title = ''
    let title2 = ''
    let isSomeoneThere = false
    let isSomeoneThere2 = false
    let groupedIcons = groupBy(icons, 'person')
    this.ListEvents.forEach(events => {
      const e = new Events(events)
      if (e.inInterval(from)) {
        let userTetra = Events.compute_tetragraph(e.nextcloud_users)
        if (e.place2 === '') {
          e.place2 = e.place
        }

        if (placeIsExcluded) {
          isSomeoneThere = true
          isSomeoneThere2 = true
        }
        else if (groupedIcons[userTetra])
          for (let dic of groupedIcons[userTetra]) {
            if (e.place === dic.label.toLowerCase()) {
              title += dic.prefix + "(" + dic.label + ") "
              isSomeoneThere = true
            }
            if (e.place2 === dic.label.toLowerCase()) {
              title2 += dic.prefix + "(" + dic.label + ") "
              isSomeoneThere2 = true
            }
          }

        if (e.place === this.id) {
          title += e.nextcloud_users + '\n'
          res += 1
          found = true
        }
        if (e.place2 === this.id) {
          title2 += e.nextcloud_users + '\n'
          res2 += 1
          found2 = true
        }
      }
    })

    myCell.style = "text-align: center"

    let div = document.createElement('div')
    div.classList.add('cell-main')
    myCell.appendChild(div)

    let div1 = this.createDiv(res, title, found, isSomeoneThere, from)
    div.appendChild(div1)
    if (title !== title2) {
      let div2 = this.createDiv(res2, title2, found2, isSomeoneThere2, from)
      div1.classList.add('cell-base-two')
      div2.classList.add('cell-base-two')
      div.appendChild(div2)
    }
    else
      div1.classList.add('cell-base-alone')

    myCell.classList.add('td-location')
    return myCell
  }

  /**
   * Returns the interval between dtStart and dtEnd as a string
   * @param {Date} dtStart
   * @param {Date} dtEnd
   * @return {String}
   */
  getDateString(dtStart, dtEnd) {
    let str1 = dtStart.toLocaleDateString()
    let str2 = dtEnd.toLocaleDateString()
    if (str1 === str2)
      return str1
    else
      return str1 + ' - ' + str2
  }

  /**
   *
   * @param {string} type
   * @param {Date} periodStart
   * @param {Date} periodEnd
   * @returns
   */
  countTypeForUser(type, periodStart, periodEnd) {
    const myCell = document.createElement('td')
    let res = 0
    let title = ''
    this.ListEvents.forEach(event => {
      const e = new Events(event)
      let fullDay = false
      if (e.place2 === '') {
        e.place2 = e.place
        fullDay = true
      }
      const ar = [e.place, e.place2]

      var tmp = 0
      ar.forEach(place => {
        if ((place.toLowerCase() === type.toLowerCase() || type.toLowerCase() === 'total')) {
          let dtStart = new Date(e.dtStart)
          let dtEnd = new Date(e.dtEnd)
          // if event overflows, clamp to current period
          if (dtStart < periodStart)
            dtStart = periodStart

          if (dtEnd > periodEnd)
            dtEnd = periodEnd


          let dateString = this.getDateString(dtStart, dtEnd)
          if (fullDay && tmp == 0) {
            title += dateString + '\n'
          }
          else if (tmp == 0) {
            title += dateString
            if (place === e.place)
              title += ' (matin)\n'
            else
              title += ' (après-midi)\n'
          }
          tmp += Math.round((dtEnd - dtStart) / (3600 * 1000 * 24)) / 2
        }
      })
      res += tmp
    })

    myCell.innerText = res
    myCell.style = 'text-align: center; '
    myCell.title = title

    return myCell
  }
}
