import moment from "moment"
/**
 * 
 * @param {int} diff added to the month number (-2 months from today for example)
 * @return
 */
export function getDateFirstOfMonth(diff = 0) {
    let adding = moment().add(diff, 'months')
    let first = new Date(Date.UTC(adding.year(), adding.month(), 1))
    return first
}