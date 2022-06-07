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

    eventsAtDayCount(from){
        var myCase = document.createElement("td");
        var trouve = false;
        var res = 0;

        this.listEvents.forEach(events => {
            var e = new Events(events);
            if(e.inInterval(from)){
                res +=  1;
                myCase.setAttribute('style', 'text-align: center;');
                trouve = true;
            }
        });
        if(!trouve){
            myCase.setAttribute('style', 'text-align: center; color: white; background-color: green;');
        }
        myCase.innerText = res;
        return myCase;
    }
}