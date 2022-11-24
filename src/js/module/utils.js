
/**
 * 
 * @param {int} diff added to the month number (-2 months from today)
 * @return
 */
export function getDateFirstOfMonth(diff) {
    let today = new Date()
    let first = new Date(today.getFullYear(), today.getMonth() + diff, 1)
    first.setDate(first.getDate() + 1)
    return first
}