/* -------------------------------------------------------------------------- */
/*                       Gestion d'affichage de la ligne                      */
/* -------------------------------------------------------------------------- */

var ligne_data;
var all_lignes;
var indexDirection = 0
var selectedStation = 0

// Set des dirrections
function setDirections() {
    const textList = document.getElementById('top-page-dirction-selection')
    textList.innerHTML = "";

    if (ligne_data.directions.retour === undefined) {
        textList.style.display = "none";
        return;
    }

    for (direction in ligne_data.directions) {
        var option = document.createElement("option");
        option.value = ligne_data.directions[direction].nom;
        option.text = ligne_data.directions[direction].nom;
        textList.appendChild(option);
    }
}

// Decrémentation du temps automatique
async function decrement_time() {
    ligne_data = await get_all_data_ligne(ligne_data.id, true)
    refreshTimes()
    setTimeout(function () {
        decrement_time()
    }, 30000)
}


// Rafraichit le temps des lignes
function refreshTimes() {
    const stations_list = document.getElementById('stations-list')
    let stations = ligne_data.directions[indexDirection ? "retour" : "aller"].stations
    for (i in stations) {
        if (i == stations.length - 1 && ligne_data.directions.retour !== undefined) {
            stations_list.children[i].getElementsByClassName('station-cell-time-text')[0].innerHTML = "Termin."
        } else if (indexDirection == 0) {
            if (!stations[i].temps.aller[0]) {
                stations_list.children[i].getElementsByClassName('station-cell-time-text')[0].innerHTML = "❌"
            } else {
                stations_list.children[i].getElementsByClassName('station-cell-time-text')[0].innerHTML = stations[i].temps.aller[0]
            }
        } else if (indexDirection == 1) {
            if (!stations[i].temps.retour[0]) {
                stations_list.children[i].getElementsByClassName('station-cell-time-text')[0].innerHTML = "❌"
            } else {
                stations_list.children[i].getElementsByClassName('station-cell-time-text')[0].innerHTML = stations[i].temps.retour[0]
            }
        }
    }
    refreshStationInfoSilent()
}

// Lorsque la direction change
async function directionChanged(a) {
    if (indexDirection != a.selectedIndex) {
        indexDirection = a.selectedIndex
        selectedStation = (Object.keys(ligne_data.directions[indexDirection ? "retour" : "aller"].stations).length - 1) - selectedStation
        await refresh_entire_ligne()
        selectStationRaw(selectedStation)
    }
}

// Set les infos de la ligne sur la page
function setLigne() {
    document.getElementById('top-page-ligne-rect-text').innerHTML = ligne_data.numero
    if (ligne_data.numero.length > 2) {
        document.getElementById('top-page-ligne-rect').classList.add('long')
        document.getElementById('top-page-ligne-rect-text').classList.add('long')
    }
    var aRgbHex = ligne_data.couleur.substring(1).match(/.{1,2}/g);
    var aRgb = [
    parseInt(aRgbHex[0], 16),
    parseInt(aRgbHex[1], 16),
    parseInt(aRgbHex[2], 16)
    ];
    document.documentElement.style.setProperty('--color', `${aRgb[0]}, ${aRgb[1]}, ${aRgb[2]}`);

    aRgbHex = ligne_data.text_couleur.substring(1).match(/.{1,2}/g);
    aRgb = [
    parseInt(aRgbHex[0], 16),
    parseInt(aRgbHex[1], 16),
    parseInt(aRgbHex[2], 16)
    ];
    document.documentElement.style.setProperty('--text-color', `${aRgb[0]}, ${aRgb[1]}, ${aRgb[2]}`);
}


// Initialisation de la page
async function initPage() {
    setDirections()
    setLigne()

    await refresh_entire_ligne()
    selectStationRaw(selectedStation)
    setTimeout(function () {
        decrement_time()
    }, 30000)
}


// Affichage de toute la ligne et ses stations
async function refresh_entire_ligne() {
    const stations_list = document.getElementById('stations-list')
    stations_list.innerHTML = ""
    let stations = ligne_data.directions[indexDirection ? "retour" : "aller"].stations
    for (i in stations) {
        var position = "mid";
        var dotType = "-dot";

        if (i < 1) {
            position = "top"
        } else if (i == stations.length - 1){
            position = "bot"
        }

        if (stations[i].isTerminus == true) {
            dotType = "-terminus"
        }

        if (i == stations.length - 1 && ligne_data.directions.retour !== undefined) {
            stations_list.insertAdjacentHTML('beforeend', `<button id='${i}' class="station-cell" onClick='selectStationRaw(this.id)'><div class="station-cell-route"><div class="station-cell-route-rect-${position}"></div><div class="station-cell${dotType}-mask"><div class="station-cell${dotType}"></div></div></div><div class="station-cell-container"><div class="station-cell-name${dotType}">${stations[i].nom}</div><div class="station-cell-time"><div class="station-cell-time-text">Termin.</div></div></div></button>`)
            continue;
        }

        if (indexDirection == 0) {
            if (!stations[i].temps.aller[0]) {
                stations_list.insertAdjacentHTML('beforeend', `<button id='${i}' class="station-cell" onClick='selectStationRaw(this.id)'><div class="station-cell-route"><div class="station-cell-route-rect-${position}"></div><div class="station-cell${dotType}-mask"><div class="station-cell${dotType}"></div></div></div><div class="station-cell-container"><div class="station-cell-name${dotType}">${stations[i].nom}</div><div class="station-cell-time"><div class="station-cell-time-text">❌</div></div></div></button>`)
            } else {
                stations_list.insertAdjacentHTML('beforeend', `<button id='${i}' class="station-cell" onClick='selectStationRaw(this.id)'><div class="station-cell-route"><div class="station-cell-route-rect-${position}"></div><div class="station-cell${dotType}-mask"><div class="station-cell${dotType}"></div></div></div><div class="station-cell-container"><div class="station-cell-name${dotType}">${stations[i].nom}</div><div class="station-cell-time"><div class="station-cell-time-text">${stations[i].temps.aller[0]}</div></div></div></button>`)
            }
        } else if (indexDirection == 1) {
            if (!stations[i].temps.retour[0]) {
                stations_list.insertAdjacentHTML('beforeend', `<button id='${i}' class="station-cell" onClick='selectStationRaw(this.id)'><div class="station-cell-route"><div class="station-cell-route-rect-${position}"></div><div class="station-cell${dotType}-mask"><div class="station-cell${dotType}"></div></div></div><div class="station-cell-container"><div class="station-cell-name${dotType}">${stations[i].nom}</div><div class="station-cell-time"><div class="station-cell-time-text">❌</div></div></div></button>`)
            } else {
                stations_list.insertAdjacentHTML('beforeend', `<button id='${i}' class="station-cell" onClick='selectStationRaw(this.id)'><div class="station-cell-route"><div class="station-cell-route-rect-${position}"></div><div class="station-cell${dotType}-mask"><div class="station-cell${dotType}"></div></div></div><div class="station-cell-container"><div class="station-cell-name${dotType}">${stations[i].nom}</div><div class="station-cell-time"><div class="station-cell-time-text">${stations[i].temps.retour[0]}</div></div></div></button>`)
            }
        }
    }
}

// Affichage des informations de la station
function refreshStationInfo() {
    let station_data = ligne_data.directions[indexDirection ? "retour" : "aller"].stations[selectedStation]
    let container =  document.getElementById("station-info-passages-container")
    container.innerHTML = ""
    document.getElementById("stations-info-text").innerText = station_data.nom
    if (station_data.temps.aller.length <1  && station_data.temps.retour.length < 1) {
        container.insertAdjacentHTML('beforeend', `<div class='station-info-cell'><div class='station-info-cell-direction'>⚠️ Cette station n'est actuellement pas désservie.</div></div>`)
    } else {
        let temp_temps; 
        if (station_data.temps.aller.length > 0) {
            temp_temps = ""
            for (time of station_data.temps.aller) {
                temp_temps += `<div class='station-info-cell-temps'><div class='station-info-cell-temps-text'>${time}</div></div>`
            }
            container.insertAdjacentHTML('beforeend', `<div class='station-info-cell'><div class='station-info-cell-direction'>• Vers ${ligne_data.directions.aller.nom} :</div><div class='station-info-cell-temps-container'>${temp_temps}</div></div>`)
        }
        if (station_data.temps.retour.length > 0) {
            temp_temps = ""
            for (time of station_data.temps.retour) {
                temp_temps += `<div class='station-info-cell-temps'><div class='station-info-cell-temps-text'>${time}</div></div>`
            }
            container.insertAdjacentHTML('beforeend', `<div class='station-info-cell'><div class='station-info-cell-direction'>• Vers ${ligne_data.directions.retour.nom} :</div><div class='station-info-cell-temps-container'>${temp_temps}</div></div>`)
        }
    }
    const linked_lignes = station_data.linked_lignes.filter(ligne => ligne.id != ligne_data.id)
    const lignesList = document.getElementById('station-info-other-lignes-container')
    lignesList.innerHTML = ""
    
    if (linked_lignes.length < 1) {
        document.getElementById('station-info-other-lignes-text').innerText = "Cette station ne dessert pas d'autres lignes."
    } else {
        document.getElementById('station-info-other-lignes-text').innerText = "Autres lignes désservies :"
        for (const ligne in Object.values(linked_lignes)) {
            if (linked_lignes[ligne].numero.length > 2) {
                lignesList.insertAdjacentHTML('beforeend', `<button class="ligne-child-long" id='${ligne}' onClick='changeLigne(this.id)' style="background-color: ${linked_lignes[ligne].couleur}"><div class="ligne-child-text-long style="color: ${linked_lignes[ligne].text_couleur}">${linked_lignes[ligne].numero}</div></button>`)
            } else {
                lignesList.insertAdjacentHTML('beforeend', `<button class="ligne-child" id='${ligne}' onClick='changeLigne(this.id)' style="background-color: ${linked_lignes[ligne].couleur}"><div class="ligne-child-text" style="color: ${linked_lignes[ligne].text_couleur}">${linked_lignes[ligne].numero}</div></button>`)
            }
        }
    }
}

// Rafraichit des informations de la station de maniere silencieuse
function refreshStationInfoSilent() {
    let station_data = ligne_data.directions[indexDirection ? "retour" : "aller"].stations[selectedStation]
    let container =  document.getElementById("station-info-passages-container")
    container.innerHTML = ""
    document.getElementById("stations-info-text").innerText = station_data.nom
    if (station_data.temps.aller.length <1  && station_data.temps.retour.length < 1) {
        container.insertAdjacentHTML('beforeend', `<div class='station-info-cell'><div class='station-info-cell-direction'>⚠️ Cette station n'est actuellement pas désservie.</div></div>`)
    } else {
        let temp_temps; 
        if (station_data.temps.aller.length > 0) {
            temp_temps = ""
            for (time of station_data.temps.aller) {
                temp_temps += `<div class='station-info-cell-temps'><div class='station-info-cell-temps-text'>${time}</div></div>`
            }
            container.insertAdjacentHTML('beforeend', `<div class='station-info-cell'><div class='station-info-cell-direction'>• Vers ${ligne_data.directions.aller.nom} :</div><div class='station-info-cell-temps-container'>${temp_temps}</div></div>`)
        }
        if (station_data.temps.retour.length > 0) {
            temp_temps = ""
            for (time of station_data.temps.retour) {
                temp_temps += `<div class='station-info-cell-temps'><div class='station-info-cell-temps-text'>${time}</div></div>`
            }
            container.insertAdjacentHTML('beforeend', `<div class='station-info-cell'><div class='station-info-cell-direction'>• Vers ${ligne_data.directions.retour.nom} :</div><div class='station-info-cell-temps-container'>${temp_temps}</div></div>`)
        }
    }
}


// Changement de page vers la station souhaitée
function showMore() {
    parent.show_station(ligne_data.directions[indexDirection ? "retour" : "aller"].stations[selectedStation].id)
}

// Bouton retour
function backButton() {
    parent.changePage("../html/realtime/realtime.html")
}

// Changement de page vers la ligne souhaitée
function changeLigne(ligneIndex) {
    const lignesList = ligne_data.directions[indexDirection ? "retour" : "aller"].stations[selectedStation].linked_lignes.filter(ligne => ligne.id != ligne_data.id)
    parent.show_ligne(lignesList[ligneIndex].id)
}

// Système de selection de station
function selectStationRaw(id) {
    document.getElementById(selectedStation).classList.remove("selected")
    document.getElementById(id).classList.add("selected")
    selectedStation = id
    refreshStationInfo()
}