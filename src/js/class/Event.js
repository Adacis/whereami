/**
 *
 */
export class Events {
  constructor (obj) {
    obj && Object.assign(this, obj)
  }

  /**
     *
     * @returns
     */
  getSummary () {
    return this.summary
  }

  /**
     *
     * @param {*} from
     * @returns
     */
  inInterval (from) {
    const dtStart = new Date(this.dtStart)
    const dtEnd = new Date(this.dtEnd)
    return from >= dtStart && from < dtEnd;
  }
}
