import { getData } from "./module/xhr";
import "datatables.net-dt/css/jquery.dataTables.css";
/**
 * 
 */
 export var optionDatatable = {
	scrollY:        true,
	scrollX:        true,
	scrollCollapse: true,
	paging:         false,
	autoWidth: false,
    stateSave: true,
    lengthMenu: [[100, 300, 500, -1], [100, 300, 500, "All"]],
	fixedColumns:   {
		left: 1
	},
    language: {
        "search": t('gestion', 'Search'),
        "emptyTable": t('gestion', 'No data available in table'),
        "info": t('gestion', 'Showing {start} to {end} of {total} entries', { start: '_START_', end: '_END_', total: '_TOTAL_' }),
        "infoEmpty": t('gestion', 'Showing 0 to 0 of 0 entries'),
        "loadingRecords": t('gestion', 'Loading records …'),
        "processing": t('gestion', 'Processing …'),
        "infoFiltered": t('gestion', '{max} entries filtered', { max: '_MAX_' }),
        "lengthMenu": t('gestion', 'Show {menu} entries', { menu: '_MENU_' }),
        "zeroRecords": t('gestion', 'No corresponding entry'),
        "paginate": {
            "first": t('gestion', 'First'),
            "last": t('gestion', 'Last'),
            "next": t('gestion', 'Next'),
            "previous": t('gestion', 'Previous'),
        }
    }
}

window.addEventListener("DOMContentLoaded", function () {
	let toDay = new Date("2022-06-01");
	document.getElementById("dtStart").valueAsDate = toDay;
	toDay.setDate(toDay.getDate() + 15);
	document.getElementById("dtEnd").valueAsDate = toDay;

	getData(document.getElementById("dtStart").value, document.getElementById("dtEnd").value);
});