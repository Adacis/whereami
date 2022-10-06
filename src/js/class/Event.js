/**
 *
 */
export class Events {
  constructor(obj) {
    obj && Object.assign(this, obj)
  }

  /**
     *
     * @returns
     */
  getSummary() {
    return this.summary
  }

  /**
     *
     * @param {*} from
     * @returns
     */
  inInterval(from) {
    const dtStart = new Date(this.dtStart)
    const dtEnd = new Date(this.dtEnd)
    if (from >= dtStart &&
      from < dtEnd) {
      return true
    }
    return false
  }

  /**
   * Takes a name and returns its tetragraph.
   * "Pierre Martin" will give "PMAR"
   * "Jean-Paul Dupont" will give "JPDU"
   * @param {string} name of the user, separated by spaces or '-' for composed names.
   */
  static compute_tetragraph(name) {
    const words = name.replace("-", " ").split(" ");  // split by space or -
    let tetragraph = ""
    for (let i = 0; i < words.length; i++) {
      if (i >= words.length - 1) {
        // takes all first letters from the last word to finish the tetragraph
        let lettersMissing = Math.max(0, 4 - tetragraph.length)
        tetragraph += words[i].substring(0, lettersMissing).toUpperCase();
      } else {
        tetragraph += words[i][0].toUpperCase();
      }
    }
    return tetragraph;
  }
}
