export class Events {
    constructor(obj) {
        obj && Object.assign(this, obj);
    }

    getSummary() {
        return this.summary;
    }

    inInterval(from) {
        let dtStart = new Date(this.dtStart);
        let dtEnd = new Date(this.dtEnd);
        return from >= dtStart && from < dtEnd;
    }
}