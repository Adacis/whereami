import { Events } from "./Event";

export var days = ['sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'saturday'];

export class listEvents{
    
    constructor(element,le) {
        this.id = element
        this.listEvents = le;
    }

    eventsAtDay(from){
        var myCase = document.createElement("td");
        var trouve = false;
        var res = "";
        var title = "";

        this.listEvents.forEach(events => {
            var e = new Events(events);
            if(e.inInterval(from)){
                var filter = e.getSummary().replace('[loc]','');
                res +=  filter.includes(",") ? filter.split(',')[0] + "<br/>" : filter + "<br/>" ;
                title += filter.includes(",") ? filter.split(',')[1] + "," : "";
                trouve = true;
            }
        });

        if(!trouve && (days[from.getDay()] === "sunday" || days[from.getDay()] === "saturday")){
            myCase.setAttribute('style', 'background-color: var(--color-box-shadow);');
        }else if(!trouve){
            myCase.setAttribute('style', 'background-color: yellow;');
            res += "shame";
        }

        myCase.setAttribute('title', title);
        myCase.innerHTML = res;
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