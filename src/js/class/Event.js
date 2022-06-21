export class Events {
    constructor(obj) {
        obj && Object.assign(this, obj);
    }

    getSummary() {
        return this.summary;
    }

    inInterval(from) {
        var dtStart = new Date(this.dtStart);
        var dtEnd = new Date(this.dtEnd);
        if (from >= dtStart
            && from < dtEnd) {
            return true;
        }
        return false;
    }
}