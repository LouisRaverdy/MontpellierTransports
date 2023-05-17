/*
    Ce script JavaScript s'occupe du temps réel.
    Il a des intéractions avec les entrées des utilisateurs,
    ainsi qu'avec l'API de la Tam au quel il récupère les données, pour les renvoyer
    par la suite, une fois les informations traité.

*/

// Modularité
const api_connect = parent.require('../script/API/api-connect.js')
const {ipcRenderer} = parent.require('electron');

// Initialisation des variables principales
var stations = [];
var stations_name = [];
var stations_name_formatted = [];

var lignes = [];
var lignes_numbers = [];

var selectedIndex = -1
var isLigne = false

var conditions = [[" ", "-"], ["é", "è", "ê", "ë"]]
var conditions_f = [[" "], ["é", "è", "ê", "ë"], "-"]

async function get_data() {
    /*  Cette fonction récupère tout les noms des stations et lignes
        Puis les modifies pour les adaptés a une nomenclature simplifié. */

    // cette appelle permet de stocker dans temp_stations le nom de toutes les stations.
    var temp_stations = await api_connect.get_all_stations()
    
    // Ces deux commandes, ainsi que ces deux boucles, permettent de gérer la 
    // nomenclature des arrets.
    stations.push(temp_stations[0])
    stations_name.push(temp_stations[0].nom)
    for (station of temp_stations){
        if (stations_name.length > 0 && !stations_name.includes(station.nom)){
            stations.push(station)
            stations_name.push(station.nom)
        }
    }
    for (station of stations_name){
        for (condition of conditions[0])
        {
            if (station.includes(condition))
            {
                station = station.replaceAll(condition, "")
            }
        }
        for (condition of conditions[1])
        {
            if (station.includes(condition))
            {
                station = station.replaceAll(condition, "e")
            } 
        }
        stations_name_formatted.push(station.toLowerCase())
    }
    // On récupère toutes les lignes ainsi que leurs couleurs.
    lignes = await api_connect.get_all_lignes()
    lignes_numbers = lignes.map(ligne => ligne.numero)
}

// On appelle l'initialisation des variables contenant tout les trams et lignes, 
// ainsi que leurs noms.
get_data()

window.addEventListener('DOMContentLoaded', (event) => {
    document.getElementById('search-entry').select()
});

function onInputSearch(input) {
    /* Cette fonction nomenclature l'entrée de l'utilisateur.
        Et affiche les éléments important à l'utilisateur. */

    // On récupère le tableau des résultats en html puis on le vide.
    const tableResult = document.getElementById('result-list')
    tableResult.innerHTML = ''

    // Cette condition s'occupe du cas dans lequel la recherche est vide.
    if (selectedIndex != -1) {
        if (isLigne) {
            document.getElementById('rect-child-ligne').classList.remove('visible')
            document.getElementById('rect-child-ligne').classList.remove('rect-child-ligne-long')
            document.getElementById('rect-child-ligne-text').classList.remove('rect-child-ligne-text-long')
        }
        selectedIndex = -1
        resetIcon()
    }
    
    // Cette condition s'occupe des entrée de l'utilisateur.
    // et s'occupe de ça nomenclature 
    if (input) {
        document.getElementById('search-bar').classList.add('expand')
        document.getElementById('result-list').classList.add('expand')
        document.getElementById('separator-bar').classList.add('expand')

        // Cette condition et ces deux boucles, transforme la nomenclature de l'entrée.
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
        if (input.includes(conditions_f[2]))
        {
            input = input.replaceAll(condition, "->")
        }
        // Cette boucle affiche les lignes.
        for (i in lignes_numbers){
            const ligne = lignes_numbers[i]
            if (ligne.toString().toLowerCase().includes(input.toLowerCase()) || ("ligne".includes(input.toLowerCase())) || ligne.toString().toLowerCase().includes(input.toLowerCase().replace("ligne", ""))){
                if (lignes[lignes_numbers.indexOf(ligne)].type == "tramway") {
                    tableResult.insertAdjacentHTML('beforeend', `<button class="child-result" id='${i}' onClick='selectLigneRaw(this.id, true)'><div class="child-result-container"><img class="img-child-result" src="../../src/tram.png"></img><div class="text-child-result">Ligne</div><div class="rect-child-result" style="background-color: ${lignes[i].couleur}"><div class="rect-child-result-text" style="color: ${lignes[i].text_couleur}">${ligne}</div></div></div></button>`)
                } else if (ligne.length > 2) {
                    tableResult.insertAdjacentHTML('beforeend', `<button class="child-result" id='${i}' onClick='selectLigneRaw(this.id, true)'><div class="child-result-container"><img class="img-child-result" src="../../src/bus.png"></img><div class="text-child-result">Ligne</div><div class="rect-child-result-long" style="background-color: ${lignes[i].couleur}"><div class="rect-child-result-text-long" style="color: ${lignes[i].text_couleur}">${ligne}</div></div></div></button>`)   
                } else {
                    tableResult.insertAdjacentHTML('beforeend', `<button class="child-result" id='${i}' onClick='selectLigneRaw(this.id, false)'><div class="child-result-container"><img class="img-child-result" src="../../src/bus.png"></img><div class="text-child-result">Ligne</div><div class="rect-child-result" style="background-color: ${lignes[i].couleur}"><div class="rect-child-result-text" style="color: ${lignes[i].text_couleur}">${ligne}</div></div></div></button>`)
                }
            }
        }
        // Cette boucle affiche les arrets.
        for (const station of stations_name_formatted) {
            if (station.includes(input.toLowerCase())) {
                const station_data = stations[stations_name_formatted.indexOf(station)]
                let begin_input = ""
                let begin_station = ""
                for (let i = 0; i < input.length; i++){
                    begin_input += input[i].toLowerCase()
                    begin_station += station.toString().toLowerCase()[i]
                }
                let all_lignes = ""
                for (const linked_ligne of station_data.linked_lignes) {
                    if (linked_ligne.numero.length > 2) {
                        all_lignes += `<div class='station-ligne-rect-long' style='background-color: ${linked_ligne.couleur}'><div class='station-ligne-rect-text-long' style="color: ${linked_ligne.text_couleur}">${linked_ligne.numero}</div></div>`
                    } else {
                        all_lignes += `<div class='station-ligne-rect' style='background-color: ${linked_ligne.couleur}'><div class='station-ligne-rect-text' style="color: ${linked_ligne.text_couleur}">${linked_ligne.numero}</div></div>`
                    }
                }
                var orga = [];
                if (begin_input == begin_station){
                    tableResult.insertAdjacentHTML('beforeend', `<button class="child-result" id='${stations_name_formatted.indexOf(station)}' onClick='selectStationRaw(this.id)'><div class="child-result-container"><img class="img-child-result" src="../../src/station.png"></img><div class="text-child-result">${stations_name[stations_name_formatted.indexOf(station)]}</div><div class="stations-lignes">${all_lignes}</div></div></button>`)
                } else {
                    orga.push(`<button class="child-result" id='${stations_name_formatted.indexOf(station)}' onClick='selectStationRaw(this.id)'><div class="child-result-container"><img class="img-child-result" src="../../src/station.png"></img><div class="text-child-result">${stations_name[stations_name_formatted.indexOf(station)]}</div><div class="stations-lignes">${all_lignes}</div></div></button>`)
                }

                for (const linked_ligne of station_data.linked_lignes) {
                    if (linked_ligne.numero.length > 2) {
                        all_lignes += `<div class='station-ligne-rect-long' style='background-color: ${linked_ligne.couleur}'><div class='station-ligne-rect-text-long' style="color: ${linked_ligne.text_couleur}">${linked_ligne.numero}</div></div>`
                    } else {
                        all_lignes += `<div class='station-ligne-rect' style='background-color: ${linked_ligne.couleur}'><div class='station-ligne-rect-text' style="color: ${linked_ligne.text_couleur}">${linked_ligne.numero}</div></div>`
                    }
                }
            }
        }
        if (orga != undefined){
            for (last_line of orga){
                tableResult.insertAdjacentHTML('beforeend', last_line)
            }
        }
    } else {
        document.getElementById('search-bar').classList.remove('expand')
        document.getElementById('result-list').classList.remove('expand')
        document.getElementById('separator-bar').classList.remove('expand')
    }
}

function selectStationRaw(id) {
    document.getElementById('search-entry').value = stations_name[parseInt(id)]
    document.getElementById('search-image').src = "../../src/station.png"
    document.getElementById('search-bar').classList.remove('expand')
    document.getElementById('result-list').classList.remove('expand')
    document.getElementById('separator-bar').classList.remove('expand')
    selectedIndex = parseInt(id)
    selected = stations[selectedIndex]
    isLigne = false
}

function selectLigneRaw(id, tram) {
    document.getElementById('search-entry').value = `Ligne`
    document.getElementById('rect-child-ligne').classList.add('visible')
    document.getElementById('rect-child-ligne').style.backgroundColor = lignes[id].couleur
    document.getElementById('rect-child-ligne-text').innerHTML = lignes_numbers[id]
    document.getElementById('rect-child-ligne-text').style.color = lignes[id].text_couleur
    if (String(lignes[id].numero).length > 2) {
        document.getElementById('rect-child-ligne').classList.add('rect-child-ligne-long')
        document.getElementById('rect-child-ligne-text').classList.add('rect-child-ligne-text-long')
    }
    if (tram) {
        document.getElementById('search-image').src = "../../src/tram.png"
    } else {
        document.getElementById('search-image').src = "../../src/bus.png"
    }
    document.getElementById('search-bar').classList.remove('expand')
    document.getElementById('result-list').classList.remove('expand')
    document.getElementById('separator-bar').classList.remove('expand')
    selectedIndex = parseInt(id)
    selected = lignes[selectedIndex]
    isLigne = true

}

function resetIcon() {
    document.getElementById('search-image').src = "https://cdn-icons-png.flaticon.com/512/711/711319.png"
}

async function press(){
    if (selectedIndex > -1){
        if (isLigne){
            parent.show_ligne(selected.id)
        } else {
            parent.show_station(selected.id)
        }
    } else {
        parent.showError("Aucune selection", "Veuillez sélectionner une ligne ou une station.")
    }
}

document.addEventListener('keydown', (event) => {
    if (event.key === "Enter") {
        document.getElementById("search-button").click();
    }
})