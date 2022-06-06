import { Events } from "./Event";

export class listEvents{
    
    constructor(element,le) {
        this.id = element
        this.listEvents = le;
    }

    eventsAtDay(from){
        var myCase = document.createElement("td");
        var trouve = false;
        var res = "";

        this.listEvents.forEach(events => {
            var e = new Events(events);
            if(e.inInterval(from)){
                res +=  e.getSummary().replace('[loc]','')
                trouve = true;
            }
        });
        if(!trouve){
            myCase.setAttribute('style', 'background-color: yellow;');
            res += "shame";
        }
        myCase.innerText = res;
        return myCase;
    }
}