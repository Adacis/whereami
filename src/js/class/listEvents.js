import {Events} from "./Event";

export let days = ['sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'saturday'];
export let days_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

export class listEvents {

    constructor(element, le) {
        this.id = element
        this.listEvents = le;
    }

    eventsAtDay(from) {
        let myCase = document.createElement("td");
        let found = false;
        let res = "";
        let title = "";

        this.listEvents.forEach(events => {
            let e = new Events(events);
            if (e.inInterval(from)) {
                let filter = e.getSummary().replace('@', '');
                res += filter.includes(",") ? filter.split(',')[0] + "<br/>" : filter + "<br/>";
                title += filter.includes(",") ? filter.split(',')[1] + "\n" : "";
                found = true;
            }
        });

        if (!found && (days[from.getDay()] === "sunday" || days[from.getDay()] === "saturday")) {
            myCase.setAttribute('style', 'background-color: var(--color-box-shadow);');
        } else if (!found) {
            myCase.setAttribute('style', 'background-color: yellow;');
            res += "shame";
        }

        myCase.setAttribute('title', title);
        myCase.innerHTML = res;
        return myCase;
    }

    eventsAtDayCount(from) {
        let myCase = document.createElement("td");
        let found = false;
        let res = 0;
        let title = "";
        this.listEvents.forEach(events => {
            let e = new Events(events);
            if (e.inInterval(from)) {
                res += 1;
                title += e.nextcloud_users + '\n';
                found = true;
            }
        });
        myCase.setAttribute('style', 'text-align: center;');
        myCase.setAttribute('title', title);
        myCase.innerText = res;

        if (!found && (days[from.getDay()] === "sunday" || days[from.getDay()] === "saturday")) {
            myCase.setAttribute('style', 'text-align: center; background-color: var(--color-box-shadow);');
            myCase.innerText = "";
        } else if (!found) {
            myCase.setAttribute('style', 'text-align: center; color: white; background-color: green;');
            myCase.innerText = "0";
        }

        return myCase;
    }
}