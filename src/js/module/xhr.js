import { showError, showSuccess } from "@nextcloud/dialogs";
import { generateUrl } from "@nextcloud/router";
import { Events } from "../class/Event";
import { listEvents } from "../class/listEvents";
import { optionDatatable } from "../main";
export var baseUrl = generateUrl('/apps/whereami');

/**
 * 
 * @param {*} dtStart 
 * @param {*} dtEnd 
 * @param {*} DataTable 
 */
export function getData(dtStart, dtEnd, DataTable){
    var data = {
        dtStart : dtStart,
        dtEnd: dtEnd
    };

    var oReq = new XMLHttpRequest();
    oReq.open('POST', baseUrl + '/getEvents', true);
    oReq.setRequestHeader("Content-Type", "application/json");
    oReq.setRequestHeader("requesttoken", oc_requesttoken);
    oReq.onload = function(e){
        if (this.status == 200) {
            newTablePersonne(this.response,dtStart,dtEnd);
            new DataTable("#personne", optionDatatable);
            showSuccess('table loaded');
        }else{
            showError(this.response);
        }
    };
    oReq.send(JSON.stringify(data));
}

/**
 * 
 * @param {*} type 
 * @param {*} data 
 * @param {*} style 
 * @returns 
 */
function newCell(type, data, style = ""){
    var myCase = document.createElement(type);
    myCase.setAttribute('style', style);
    myCase.innerText = data;
    return myCase;
}

/**
 * 
 * @param {*} response 
 * @param {*} dtStart 
 * @param {*} dtEnd 
 */
function newTablePersonne(response, dtStart,dtEnd){
    var from = new Date(dtStart);
    var to = new Date(dtEnd);

    var table = document.createElement('table');
    var thead = document.createElement('thead');
    var tbody = document.createElement('tbody');
    
    table.setAttribute('id', 'personne');
    table.setAttribute('class', 'table table-striped ');

    thead.appendChild(getHeader(from,to));

    var res = JSON.parse(response);
    Object.keys(res).forEach(element => {
        var from = new Date(dtStart);
        var userListEvents = new listEvents(element,res[element]);
        tbody = getContent(tbody,from,to,userListEvents);
    });

    table.appendChild(thead);
    table.appendChild(tbody);
    document.getElementById("myapp").appendChild(table);
    
}

/**
 * 
 * @param {*} from 
 * @param {*} to 
 * @returns 
 */
function getHeader(from,to){
    var line = document.createElement('tr');
    line.appendChild(newCell("th","Date"));
    while(from<=to){
        line.appendChild(newCell("th",from.toLocaleDateString()));
        from.setDate(from.getDate() + 1);
    }

    return line;
}

/**
 * 
 * @param {*} tbody 
 * @param {*} from 
 * @param {*} to
 * @param {*} userListEvents 
 * @returns 
 */
function getContent(tbody,from,to,userListEvents){
    var line = document.createElement('tr');
    line.appendChild(newCell("td",userListEvents.id));
    while(from<=to){
        line.appendChild(userListEvents.eventsAtDay(from));
        from.setDate(from.getDate() + 1);
    }
    tbody.appendChild(line);
    return tbody;
}