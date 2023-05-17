var station_info;
var selected_ligne_index;

// Initialisation de la page
function initPage() {
    document.getElementById('top-page-station-text').innerText = station_info.nom
    setupLignes()
    setSelectedLigne(0)
    setTimeout(function () {
        decrement_time()
    }, 30000)
}

// Decrémentation du temps automatique
async function decrement_time() {
    station_info = await get_station_data_silent(station_info.id)
    refreshTimes()
    setTimeout(function () {
        decrement_time()
    }, 30000)
}

// Retour vers la page de temps réel
function backButton() {
    parent.changePage("../html/realtime/realtime.html")
}


// Rafraichit le temps des lignes
function refreshTimes() {
    let container =  document.getElementById("station-info-passages-container")
    container.innerHTML = ""
    
    data_info = station_info.linked_lignes[selected_ligne_index]

    if (data_info.times.aller.length <1  && data_info.times.retour.length < 1) {
        container.insertAdjacentHTML('beforeend', `<div class='station-info-cell'><div class='station-info-cell-direction'>⚠️ Cette station n'est actuellement pas désservie.</div></div>`)
    }
    if (data_info.times.aller.length > 0) {
        container.insertAdjacentHTML('beforeend', `<div class='station-info-cell'><div class='station-info-cell-direction'>• Vers ${data_info.directions.aller.nom} :</div><div class='station-info-cell-temps-container'><div class='station-info-cell-temps'><div class='station-info-cell-temps-text'>${data_info.times.aller[0]}</div></div><div class='station-info-cell-temps'><div class='station-info-cell-temps-text'>${data_info.times.aller[1]}</div></div></div></div>`)
    }
    if (data_info.times.retour.length > 0) {
        container.insertAdjacentHTML('beforeend', `<div class='station-info-cell'><div class='station-info-cell-direction'>• Vers ${data_info.directions.retour.nom} :</div><div class='station-info-cell-temps-container'><div class='station-info-cell-temps'><div class='station-info-cell-temps-text'>${data_info.times.retour[0]}</div></div><div class='station-info-cell-temps'><div class='station-info-cell-temps-text'>${data_info.times.retour[1]}</div></div></div></div>`)
    }
}

// Set des informations de la station sur la page
function setSelectedLigne(ligneIndex) {

    if (selected_ligne_index !== undefined) {
        document.getElementById(selected_ligne_index).classList.remove("selected")
    }
    document.getElementById(ligneIndex).classList.add("selected")
    selected_ligne_index = ligneIndex

    var aRgbHex = station_info.linked_lignes[selected_ligne_index].couleur.substring(1).match(/.{1,2}/g);
    var aRgb = [
    parseInt(aRgbHex[0], 16),
    parseInt(aRgbHex[1], 16),
    parseInt(aRgbHex[2], 16)
    ];
    document.documentElement.style.setProperty('--selected-ligne', `${aRgb[0]}, ${aRgb[1]}, ${aRgb[2]}`);

    aRgbHex = station_info.linked_lignes[selected_ligne_index].text_couleur.substring(1).match(/.{1,2}/g);
    aRgb = [
    parseInt(aRgbHex[0], 16),
    parseInt(aRgbHex[1], 16),
    parseInt(aRgbHex[2], 16)
    ];
    document.documentElement.style.setProperty('--text-selected-ligne', `${aRgb[0]}, ${aRgb[1]}, ${aRgb[2]}`);

    let container =  document.getElementById("station-info-passages-container")
    container.innerHTML = ""

    data_info = station_info.linked_lignes[selected_ligne_index]

    if (data_info.times.aller.length <1  && data_info.times.retour.length < 1) {
        container.insertAdjacentHTML('beforeend', `<div class='station-info-cell'><div class='station-info-cell-direction'>⚠️ Cette station n'est actuellement pas désservie.</div></div>`)
    }
    if (data_info.times.aller.length > 0) { 
        temp_temps = ""
        for (time of data_info.times.aller) {
            temp_temps += `<div class='station-info-cell-temps'><div class='station-info-cell-temps-text'>${time}</div></div>`
        }
        container.insertAdjacentHTML('beforeend', `<div class='station-info-cell'><div class='station-info-cell-direction'>• Vers ${data_info.directions.aller.nom} :</div><div class='station-info-cell-temps-container'>${temp_temps}</div></div>`)
    }
    if (data_info.times.retour.length > 0) {
        temp_temps = ""
        for (time of data_info.times.retour) {
            temp_temps += `<div class='station-info-cell-temps'><div class='station-info-cell-temps-text'>${time}</div></div>`
        }
        container.insertAdjacentHTML('beforeend', `<div class='station-info-cell'><div class='station-info-cell-direction'>• Vers ${data_info.directions.retour.nom} :</div><div class='station-info-cell-temps-container'>${temp_temps}</div></div>`)
    }

    const ligne_data = station_info.linked_lignes[selected_ligne_index]
    const stations_list = document.getElementById('stations-list')
    stations_list.innerHTML = ""

    for (i in ligne_data.stations) {
        var position = "mid";
        var dotType = "-dot";

        if (i < 1) {
            position = "top"
        } else if (i == ligne_data.stations.length - 1){
            position = "bot"
        }

        if (ligne_data.stations[i].isTerminus == true) {
            dotType = "-terminus"
        }

        if (i == ligne_data.stations.length - 1){
            stations_list.insertAdjacentHTML('beforeend', `<button id='${i}' class="station-cell" onClick='changeStation(this.id)'><div class="station-cell-route"><div class="station-cell-route-rect-${position}"></div><div class="station-cell${dotType}-mask"><div class="station-cell${dotType}"></div></div></div><div class="station-cell-container"><div class="station-cell-name${dotType}">${ligne_data.stations[i].nom}</div></div></button>`)
        } else {
            stations_list.insertAdjacentHTML('beforeend', `<button id='${i}' class="station-cell" onClick='changeStation(this.id)'><div class="station-cell-route"><div class="station-cell-route-rect-${position}"></div><div class="station-cell${dotType}-mask"><div class="station-cell${dotType}"></div></div></div><div class="station-cell-container"><div class="station-cell-name${dotType}">${ligne_data.stations[i].nom}</div></div></button>`)
        }
    }
}

// Systeme de gestion de station
function changeStation(stationIndex) {
    if (station_info.id == station_info.linked_lignes[selected_ligne_index].stations[stationIndex].id) {
        parent.showError("Station actuelle", "La station que vous avez choisie est déjà affichée.")
    } else {
        parent.show_station(station_info.linked_lignes[selected_ligne_index].stations[stationIndex].id)
    }
}


// Affichage de toutes les lignes déservies de la station selectionnée
function setupLignes() {
    const lignesList = document.getElementById("lignes-list")
    lignesList.innerHTML = ""
    for (const ligne in Object.values(station_info.linked_lignes)) {
        if (station_info.linked_lignes[ligne].numero.length > 2) {
            lignesList .insertAdjacentHTML('beforeend', `<button class="ligne-child-long" id='${ligne}' onClick='setSelectedLigne(this.id)' style="background-color: ${station_info.linked_lignes[ligne].couleur}"><div class="ligne-child-text-long" style="color: ${station_info.linked_lignes[ligne].text_couleur}">${station_info.linked_lignes[ligne].numero}</div></button>`)
        } else {
            lignesList .insertAdjacentHTML('beforeend', `<button class="ligne-child" id='${ligne}' onClick='setSelectedLigne(this.id)' style="background-color: ${station_info.linked_lignes[ligne].couleur}"><div class="ligne-child-text" style="color: ${station_info.linked_lignes[ligne].text_couleur}">${station_info.linked_lignes[ligne].numero}</div></button>`)
        }
    }
}