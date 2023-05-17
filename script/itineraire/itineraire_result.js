
const api_connect = parent.require('../script/API/api-connect.js')
var itineraires_result;
var sorted_travels;
var stations_travel;

function backButton() {
    parent.changePage("../html/itineraire/itineraire.html")
}

async function initPage() {
    document.getElementById('top-page-text-travel').innerText = `${stations_travel.depart} → ${stations_travel.destination}`
    await sortBy(0)
}

async function sortBy(sortType) {
    if (sortType == 0) {
        sorted_travels = itineraires_result
        sorted_travels.sort(function(a, b) {
            return (a.destinationTime - a.departTime) - (b.destinationTime - b.departTime)
        })    
    } else if (sortType == 1) {
        sorted_travels = itineraires_result
        sorted_travels.sort(function(a, b) {
            return a.departTime - b.departTime
        })
    } else if (sortType == 2) {
        sorted_travels = itineraires_result
        sorted_travels.sort(function(a, b) {
            return a.destinationTime - b.destinationTime
        })
    }
    
    showTravels()
    return
}

async function showTravels() {

    let lignes = await api_connect.get_saved_lignes()
    const result_list = document.getElementById('result-page')
    result_list.innerHTML = ""

    if (sorted_travels.length == 0) {
        parent.showError("Itinéraire introuvable", "Le code est en développement. Nous travaillons continuellement à l'améliorer.")
    }

    for (travel in sorted_travels) {
        let travel_info = sorted_travels[travel]
        let previewLignes = "";

        let travel_time;
        let travel_ms = travel_info.destinationTime - travel_info.departTime
        let diffHrs = Math.floor((travel_ms % 86400000) / 3600000)
        let diffMins = Math.round(((travel_ms % 86400000) % 3600000) / 60000)

        if (diffHrs > 0) {
            travel_time = `${diffHrs}h. et ${diffMins} min.`
        } else {
            travel_time = `${diffMins} min.`
        }
        
        for (ligne_index in travel_info.previewArray) {
            let ligne_data = lignes.filter(ligne => ligne.id == travel_info.previewArray[ligne_index])[0]

            if (ligne_data.numero.length > 2) {
                previewLignes += `<div class='ligne-rect-long' style='background-color: ${ligne_data.couleur}'><div class='ligne-rect-text-long' style="color: ${ligne_data.text_couleur}">${ligne_data.numero}</div></div>`
            } else {
                previewLignes += `<div class='ligne-rect' style='background-color: ${ligne_data.couleur}'><div class='ligne-rect-text' style="color: ${ligne_data.text_couleur}">${ligne_data.numero}</div></div>`
            }
            if (ligne_index != travel_info.previewArray.length - 1) {
                previewLignes += '<div class="result-child-step"></div>'
            }
        }

        result_list.insertAdjacentHTML('beforeend', `<button class="result-child horizontal-container" onClick='resultClick()'>
                                                            <div class="result-child-times vertical-container">
                                                            <div class="result-child-time">${travel_info.departTime.getHours() < 10 ? "0" + travel_info.departTime.getHours() : travel_info.departTime.getHours()}h${travel_info.departTime.getMinutes() < 10 ? "0" + travel_info.departTime.getMinutes() : travel_info.departTime.getMinutes()}</div>
                                                            <div class="result-child-time">${travel_info.destinationTime.getHours() < 10 ? "0" + travel_info.destinationTime.getHours() : travel_info.destinationTime.getHours()}h${travel_info.destinationTime.getMinutes() < 10 ? "0" + travel_info.destinationTime.getMinutes() : travel_info.destinationTime.getMinutes()}</div>
                                                        </div>
                                                        <div class="result-child-stations vertical-container">
                                                            <div class="result-child-station">${travel_info.stationDepartName}</div>
                                                            <div class="result-child-station">${travel_info.stationDestinationName}</div>
                                                        </div>
                                                        <div class="result-child-separator"></div>
                                                        <div class="result-child-travel vertical-container">
                                                            <div class="result-child-travel-preview horizontal-container">
                                                                ${previewLignes}
                                                            </div>
                                                            <div class="result-child-travel-time horizontal-container">
                                                                <img class="result-child-travel-time-img" src="../../src/chrono.png">
                                                                <div class="result-child-travel-time-text">${travel_time}</div>
                                                            </div>
                                                        </div>
                                                    </button>`)
    }
}

function resultClick() {
    parent.showError("En développement", "Le detail du trajet est actuellement en cours de développement.")
}