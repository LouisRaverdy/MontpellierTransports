
/* -------------------------------------------------------------------------- */
/*                 Fichier de gestion de la fenêtre principale                */
/* -------------------------------------------------------------------------- */

var pageSrc = "../html/home.html"
var inErreur = false

// Fonction pour changer de page
function changePage(src) {
    return new Promise(resolve => {
        var newPage = src
        var page = document.getElementById('page-child')
        if (pageSrc != newPage) {
            if (document.getElementById('loading-child').classList.contains('visible')) {
                hideLoadingScreen()
            }
            page.classList.add('hidden')
            setTimeout(function() {
                page.src = newPage
                pageSrc = newPage
                page.addEventListener("load", (event) => {
                    setTimeout(function()  {
                        page.classList.remove('hidden')
                        resolve()
                    }, 100)     
                }, { once: true })
            }, 300)
        } else {
            resolve()
        }
    })
}

// Fonction pour afficher l'ecran de chargement
async function showLoadingScreen() {
    await changePage("../html/loading/background-loading.html")
    document.getElementById('loading-child').classList.add('visible')
}

// Fonction pour retirer l'ecran de chargement
function hideLoadingScreen() {
    document.getElementById('loading-child').classList.remove('visible')
    setTimeout(function () {
        document.getElementById('loading-child').contentWindow.location.reload();
    }, 1000)
}

// Fonction pour charger et afficher la ligne demandée
async function show_ligne(ligneNumber) {
    await showLoadingScreen()
    var data = await document.getElementById('loading-child').contentWindow.get_all_data_ligne(ligneNumber, false)
    await changePage("../html/realtime/ligne.html")
    var page = document.getElementById('page-child').contentWindow
    page.ligne_data = data
    page.initPage()
}

// Fonction pour charger et afficher la station demandée
async function show_station(stationId) {
    await showLoadingScreen()
    var station_data = await document.getElementById('loading-child').contentWindow.get_station_data(stationId)
    await changePage("../html/realtime/station.html")
    var page = document.getElementById('page-child').contentWindow
    page.station_info = station_data
    page.initPage()
}

// Fonction pour charger et afficher les itinéraires disponibles
async function show_itineraire(itineraireData) {
    await showLoadingScreen()
    await new Promise((resolve) =>setTimeout(resolve, 1000))
    var itineraires_result = await document.getElementById('loading-child').contentWindow.get_itineraire_result(itineraireData)
    await changePage("../html/itineraire/itineraire_result.html")
    var page = document.getElementById('page-child').contentWindow
    page.itineraires_result = itineraires_result
    page.stations_travel = {depart: itineraireData.start_station.nom, destination: itineraireData.destination_station.nom}
    page.initPage()
}

// Set le pourcecentage de la progress bar de l'UI pour l'itinéraire
function set_percentage(percentage) {
    document.getElementById('loading-child').contentWindow.document.getElementById("full-progress-bar-loading").style.width = `${percentage}%`
}

// Fonction pour afficher un message d'erreur
function showError(errorTitle, errorDescription) {

    if (inErreur) {
        return;
    }
    inErreur = true 

    document.getElementById('error-child').contentWindow.document.getElementById('title-error').innerHTML = errorTitle
    document.getElementById('error-child').contentWindow.document.getElementById('description-error').innerHTML = errorDescription
    document.getElementById('error-child').contentWindow.document.getElementById('content-error').classList.add('visible')
    document.getElementById('error-child').classList.add('visible')
    setTimeout(function () {
        document.getElementById('error-child').contentWindow.document.getElementById('content-error').classList.remove('visible')
        document.getElementById('error-child').classList.remove('visible')
        setTimeout(function () {
            inErreur = false
        }, 1000)
    }, 5000)
}
