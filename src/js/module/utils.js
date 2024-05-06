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

/**
 * Adds options to a select field
 * @param {Array} opts
 */
HTMLSelectElement.prototype.populate = function (opts, values = null) {
    if (values === null)
        values = opts
    for (var i = 0; i <= opts.length; i++) {
        this.appendChild(new Option(opts[i], values[i]))
    }
    this.removeChild(this.lastChild)
}

/**
 * creates the element tagName with the fields of options
 * @param {string} tagName
 * @param {Array} options
 * @returns
 */
Document.prototype.createElementOptions = function (tagName, options = null) {
    let elem = this.createElement(tagName)

    for (let key in options) {
        elem[key] = options[key]
    }

    return elem
}

/**
 *
 * @param {HTMLElement} element
 * @param {Array<HTMLElement>} children
 */
export function appendChildren(element, children) {
    children.forEach(child => {
        element.appendChild(child)
    })
}

/**
 * @param {Date} date
 * @returns Floating date string as per RFC5545
 */
export function toFloatingString(date) {
    let day   = date.getDate().toString().padStart(2, "0")
    let month = (date.getMonth() + 1).toString().padStart(2, "0")
    let year  = date.getFullYear().toString()

    let res = year + month + day
    return res
}

/**
 * Creates a random string Id (taken from : https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript)
 * @param {int} length
 * @returns {string}
 */
export function makeid(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() *
            charactersLength));
    }
    return result;
}

/**
 * Test if the given date is a sundat or a saturday
 * @param {Date} date
 * @returns
 */
export function isWeekendDay(date) {
    return date.getDay() === 0 || date.getDay() === 6
}
