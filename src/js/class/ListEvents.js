import { Events } from './Event';
import { groupBy } from 'lodash/collection';


export const days = ['sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'saturday']
export const daysFr = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

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
    let res = ''
    let title = ''

    this.ListEvents.forEach(events => {
      const e = new Events(events)
      if (e.inInterval(from)) {
        const filter = e.getSummary()
        res += filter.includes(',') ? filter.split(',')[0] + '<br/>' : filter + '<br/>'
        title += filter.includes(',') ? filter.split(',')[1] + '\n' : ''
        found = true
      }
    })

    if (!found && (days[from.getDay()] === 'sunday' || days[from.getDay()] === 'saturday')) {
      myCell.setAttribute('style', 'background-color: var(--color-box-shadow);')
    } else if (!found) {
      myCell.setAttribute('style', 'background-color: yellow; color: #222;')
      res += 'shame'
    }

    myCell.setAttribute('title', title)
    myCell.innerHTML = res
    return myCell
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
    let res = 0
    let title = ''
    let isSomeoneThere = false
    let groupedIcons = groupBy(icons, 'person')
    this.ListEvents.forEach(events => {
      const e = new Events(events)
      if (e.inInterval(from)) {
        let userTetra = Events.compute_tetragraph(e.nextcloud_users)
        res += 1
        if (placeIsExcluded)
          isSomeoneThere = true

        else if (groupedIcons[userTetra])
          for (let dic of groupedIcons[userTetra]) {
            if (e.place === dic.label.toLowerCase()) {
              title += dic.prefix + "(" + dic.label + ") "
              isSomeoneThere = true
            }
          }

        title += e.nextcloud_users + '\n'
        found = true
      }
    })
    myCell.setAttribute('style', 'text-align: center;')
    myCell.setAttribute('title', title)
    myCell.innerText = res
    if (!isSomeoneThere)
      myCell.style = "background-color: red; text-align: center;"

    if (!found && (days[from.getDay()] === 'sunday' || days[from.getDay()] === 'saturday')) {
      myCell.setAttribute('style', 'text-align: center; background-color: var(--color-box-shadow);')
      myCell.innerText = ''
    } else if (!found) {
      myCell.setAttribute('style', 'text-align: center; color: white; background-color: green;')
      myCell.innerText = '0'
    }

    return myCell
  }
}
