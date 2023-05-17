/*
    Ce script JavaScript, permet la gestion de l'itinéraire.
    Il va permettre la recherche des stations, ainsi que la gestion des entrées de l'utilisateur.
    Il va aussi permettre d'appeler l'execution de la recherche d'itinéraire présente dans le fichier
    realtime.js, pour ensuite les afficher.
*/


const api_connect = parent.require('../script/API/api-connect.js')

var data_stations;
var stations_formatted = [];
var arrivalDepart = true;
var depart_index;
var destination_index;
var selectedDateAndTime = new Date();

var lignes = [];

var conditions = [[" ", "-"], ["é", "è", "ê", "ë"]]
var conditions_f = [[" "], ["é", "è", "ê", "ë"], "-"]

var stationsResult;

async function getData() {
	data_stations = await api_connect.get_all_stations()

	for (station_data of data_stations) {
		let station_name_formatted = station_data.nom

		for (condition of conditions[0]) {
			if (station_name_formatted.includes(condition)) {
				station_name_formatted = station_name_formatted.replaceAll(condition, "")
			}
		}

		for (condition of conditions[1])
        {
            if (station_name_formatted.includes(condition))
            {
                station_name_formatted = station_name_formatted.replaceAll(condition, "e")
            } 
        }

		if (!stations_formatted.includes(station_name_formatted)) {
			stations_formatted.push(station_name_formatted.toLowerCase())
		}
	}

	lignes = await api_connect.get_all_lignes()
}

getData()

function showStationsList(isStart) {
	stationsResult.classList.add('expand')
	stationsResult.style.top = document.getElementById(isStart ? 'trip-start' : 'trip-destination').getBoundingClientRect().top + (isStart ? 40 : 33) - document.getElementById('middle-page').getBoundingClientRect().top
	stationsResult.style.left = document.getElementById('trip-container').getBoundingClientRect().left - document.getElementById('middle-page').getBoundingClientRect().left
	document.getElementById('bottom-container').style.zIndex = isStart ? 0 : 1
}

window.addEventListener('DOMContentLoaded', (event) => {
	stationsResult = document.getElementById('stations-container')
    document.getElementById('trip-start').select()

    updateDate()
    updateTime()
});

function hideStationsList() {
	stationsResult.classList.remove('expand')
}

function selectStationRaw(id, isStart) {
	document.getElementById(isStart ? 'trip-start' : 'trip-destination').value = data_stations[parseInt(id)].nom
    if (isStart) {
        depart_index = id
    } else {
        destination_index = id
    }
	hideStationsList()
}

function arrivalChanged(value) {
    if (arrivalDepart != value) {
        arrivalDepart = value
    }
}

function setDate(date) {
    selectedDateAndTime.setMonth(date.getMonth())
    selectedDateAndTime.setDate(date.getDate())

    updateDate()
}

function setTime(time) {
    selectedDateAndTime.setHours(time.split(":")[0])
    selectedDateAndTime.setMinutes(time.split(":")[1])

    updateTime()
}

function updateDate() {
    document.getElementById('date-text').innerText = `${selectedDateAndTime.toLocaleString('fr-FR', {weekday: 'long'})} ${selectedDateAndTime.toLocaleString('fr-FR', {day: 'numeric'})} ${selectedDateAndTime.toLocaleString('fr-FR', {month: 'long'})}`
}

function updateTime() {
    document.getElementById('time-text').innerText = `à ${selectedDateAndTime.getHours() < 10 ? "0" + selectedDateAndTime.getHours() : selectedDateAndTime.getHours()}h${selectedDateAndTime.getMinutes() < 10 ? "0" + selectedDateAndTime.getMinutes() : selectedDateAndTime.getMinutes() }`
}

function showPicker(pickerId) {
    document.getElementById(pickerId).showPicker()
}


function searchItineraire() {
	console.log(data_stations[depart_index], " : ", data_stations[destination_index])
	if (!data_stations[depart_index] && !data_stations[destination_index]){
		parent.showError("Erreur de saisie", "Les deux arrêts n'ont pas été mentionnés.")
   	}
   	else if (data_stations[depart_index] == data_stations[destination_index]){
        parent.showError("Erreur de saisie", "Les deux arrêts sont identiques.")
   	}
   	else{
        parent.show_itineraire({start_station: data_stations[depart_index], destination_station: data_stations[destination_index], date: selectedDateAndTime, isArrivalDepart: arrivalDepart})
   	}
}

function onInputSearch(input, isStart) {
	stationsResult.innerHTML = ''
	if (input) {
		showStationsList(isStart)

		for (condition of conditions_f[0])
        {
            if (input.includes(condition))
            {
                input = input.replaceAll(condition, "")
            }
        }
        for (condition of conditions_f[1])
        {
            if (input.includes(condition))
            {
                input = input.replaceAll(condition, "e")
            }
        }
		for (const station of stations_formatted) {
            if (station.includes(input.toLowerCase())) {
                const station_data = data_stations[stations_formatted.indexOf(station)]
                let begin_input = ""
                let begin_station = ""
                for (let i = 0; i < input.length; i++) {
                    begin_input += input[i].toLowerCase()
                    begin_station += station.toString().toLowerCase()[i]
                }
                let all_lignes = ""
                for (const i of station_data.linked_lignes) {
                    if (i.numero.length > 2) {
                        all_lignes += `<div class='station-ligne-rect-long' style='background-color: ${i.couleur}'><div class='station-ligne-rect-text-long'>${i.numero}</div></div>`
                    } else {
                        all_lignes += `<div class='station-ligne-rect' style='background-color: ${i.couleur}'><div class='station-ligne-rect-text'>${i.numero}</div></div>`
                    }
                }
                var orga = [];
                if (begin_input == begin_station){
                    stationsResult.insertAdjacentHTML('beforeend', `<button class="child-result" id='${stations_formatted.indexOf(station)}' onClick='selectStationRaw(this.id, ${isStart})'><div class="child-result-container"><img class="img-child-result" src="../../src/station.png"></img><div class="text-child-result">${station_data.nom}</div><div class="stations-lignes">${all_lignes}</div></div></button>`)
                }else{
                    orga.push(`<button class="child-result" id='${stations_formatted.indexOf(station)}' onClick='selectStationRaw(this.id, ${isStart})'><div class="child-result-container"><img class="img-child-result" src="../../src/station.png"></img><div class="text-child-result">${station_data.nom}</div><div class="stations-lignes">${all_lignes}</div></div></button>`)
                }
                for (const i of station_data.linked_lignes) {
                    if (i.numero.length > 2) {
                        all_lignes += `<div class='station-ligne-rect-long' style='background-color: ${lignes.filter(ligne => ligne.id == String(i.id))[0].couleur}'><div class='station-ligne-rect-text-long'>${i.numero}</div></div>`
                    } else {
                        all_lignes += `<div class='station-ligne-rect' style='background-color: ${lignes.filter(ligne => ligne.id == String(i.id))[0].couleur}'><div class='station-ligne-rect-text'>${i.numero}</div></div>`
                    }
                }
            }
        }
    if (orga != undefined){
        for (last_line of orga){
            stationsResult.insertAdjacentHTML('beforeend', last_line)
        }
    }
	} else {
		hideStationsList()
	}
}