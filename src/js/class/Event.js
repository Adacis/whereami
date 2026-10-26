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
    const dtStart = Events.parseDate(this.dtStart)
    const dtEnd = Events.parseDate(this.dtEnd)
    const dayStart = new Date(from)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(dayStart)
    dayEnd.setDate(dayEnd.getDate() + 1)
    // Calendar intervals have an exclusive end. Check the whole displayed day,
    // so a valid occurrence does not disappear just because it ends before noon.
    return dtStart < dayEnd && dtEnd > dayStart
  }

  static parseDate(value) {
    if (typeof value === 'string') {
      value = value.length === 10 ? value + 'T00:00:00' : value.replace(' ', 'T')
    }
    return new Date(value)
  }

  /**
   * Takes a name and returns its tetragraph.
   * "Pierre Martin" will give "PMAR"
   * "Jean-Paul Dupont" will give "JPDU"
   * If the last name is short, we try to use elements from the previous names :
   * "Pierre O" => "PIEO", "Pierre O-LY" => "POLY", "Pierre-Jean O" => "PJEO", "Pierre Martin-O" => "PMAO"
   * @param {string} name of the user, separated by spaces or '-' for composed names.
   */
  static compute_tetragraph(name) {
    const words = name.replace("-", " ").replace(/\s+/, " ").trim().split(" ");  // split by space or -, removing duplicate blanks
    let tetragraph = "";
    let n = Math.min(3, words.length - 1);
    // take first letters of the first words, up to the before-last one, or 3 (consider the last one as the family name)
    for (let i = 0; i < n; i++) {
        tetragraph += words[i][0];
    }

    // Add the last first letter (family name)
    tetragraph += words[words.length-1][0]

    // Now, fix the tetragraph to have 4 letters, using the first letters of the last words
    let lettersMissingCount = Math.max(0, 4 - tetragraph.length);
    let suffix = "";
    let j = words.length - 1;
    // Handle the case where the last word is too short (e.g we need 3 letters, but the name is LY)
    // In this case, we just add letters from the previous word (e.g. Mary Ly --> MALY)
    while (lettersMissingCount > 0 && j >= 0) {
      // Remove the last letter from the tetragraph, it will be added back by the suffix at the right place
      tetragraph = tetragraph.slice(0, -1)

      // substring treats everything > length as if it were length, so it's fine to do that
      let toAdd = words[j].substring(0, lettersMissingCount + 1);
      lettersMissingCount -= toAdd.length - 1; // -1 since we remove a letter from the tetragraph
      suffix = toAdd + suffix;
      j--;
    }

    tetragraph += suffix;
    tetragraph = tetragraph.toUpperCase();

    return tetragraph;
  }
}
