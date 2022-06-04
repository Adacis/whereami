export class Events {
    constructor(obj) {
        obj && Object.assign(this, obj);
    }

    getSummary(){
        return this.summary;
    }
    // public function inInterval($d){
    //     if($d >= $this->dtStart
    //         && $d < $this->dtEnd){
    //             return true;
    //         }
    //     return false;
    // }
    inInterval(from){
        var dtStart = new Date(this.dtStart);
        console.log(dtStart)
        var dtEnd = new Date(this.dtEnd);
        if(from >= dtStart
            && from < dtEnd){
                return true;
            }
        return false;
    }
}