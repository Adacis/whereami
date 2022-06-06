import { showError, showSuccess } from "@nextcloud/dialogs";
import { generateUrl } from "@nextcloud/router";
import { Events } from "../class/Event";
import { optionDatatable } from "../main";

export var baseUrl = generateUrl('/apps/whereami');

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
            var from = new Date(dtStart);
            var to = new Date(dtEnd);

            var table = document.createElement('table');
            table.setAttribute('id', 'personne');
            table.setAttribute('class', 'table table-striped ');
            var thead = document.createElement('thead');
            var tbody = document.createElement('tbody');

            var line = document.createElement('tr');
            var myCase = document.createElement('th');
            myCase.innerText = "Date";
            line.appendChild(myCase);

            while(from<=to){
                var myCase = document.createElement('th');
                myCase.innerText = from.toLocaleDateString();
                line.appendChild(myCase);
                from.setDate(from.getDate() + 1);
            }

            var res = JSON.parse(this.response);
            Object.keys(res).forEach(element => {
                from = new Date(dtStart);
                var line = document.createElement('tr');
                var myCase = document.createElement('td');
                myCase.innerText = element;
                line.appendChild(myCase);
                while(from<=to){
                    var trouve = false;
                    res[element].forEach(el => {
                        e = new Events(el);
                        if(e.inInterval(from)){
                            var myCase = document.createElement('td');
                            myCase.innerText = e.getSummary().replace('[loc]','');
                            line.appendChild(myCase);
                            trouve = true;
                        }
                    });
                    if(!trouve){
                        var myCase = document.createElement('td');
                        myCase.setAttribute('style', 'background-color: yellow;');
                        myCase.innerText = "shame";
                        line.appendChild(myCase);
                    }
                    from.setDate(from.getDate() + 1);
                }
                tbody.appendChild(line);
            });

            thead.appendChild(line);
            table.appendChild(thead);
            table.appendChild(tbody);
            document.getElementById("myapp").appendChild(table);

            new DataTable("#personne", optionDatatable);
        }else{
            showError(this.response);
        }
    };
    oReq.send(JSON.stringify(data));
}