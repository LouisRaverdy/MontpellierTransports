/* -------------------------------------------------------------------------- */
/*       Fichier de gestion de chargement & de refactorisation de l'API       */
/* -------------------------------------------------------------------------- */

const api_connect = parent.require('../script/API/api-connect.js')

// Fonction pour refactoriser toutes la ligne et ajouter les temps
async function get_all_data_ligne(ligneId, isSilent) {

    const all_stations = await api_connect.get_saved_stations()
    const all_lignes = await api_connect.get_saved_lignes()
    let ligne_info = all_lignes.filter(ligne => ligne.id == ligneId)[0]
    let all_stations_ligne = {}
    let estimated_stations = 0
    let processed_stations = 0

    for (const direction in ligne_info.directions) {
        for (const i in ligne_info.directions[direction].stations) {
            estimated_stations += 1
        }
    }

    for (const direction in ligne_info.directions) {
        for (let station of ligne_info.directions[direction].stations) {
            if (all_stations_ligne.hasOwnProperty(station.id)) {
                station.temps = all_stations_ligne[station.id].temps
                station.linked_lignes = all_stations_ligne[station.id].linked_lignes
            } else {
                // On ajoute les lignes liées
                let station_data = all_stations.filter(data_station => data_station.id == station.id)[0]
                all_stations_ligne[station.id] = {linked_lignes: station_data.linked_lignes}
                station.linked_lignes = station_data.linked_lignes

                // On ajoute les temps
                let times_data = {aller: [], retour: []}
                const brut_times = await api_connect.get_times_station(station.id)
                const times_station =  Object.values(brut_times).filter(station => Object.keys(brut_times)[Object.values(brut_times).indexOf(station)] ==  ligneId)[0]
                if (times_station) {
                    for(const times of Object.values(times_station)) {
                        for(const time of times) {
                            if (time.direction == 0) {
                                if (parseInt(time.delay.split(" ")[0]) <= 1) {
                                times_data.aller.push(`Proche`)
                                } else {
                                    if (time.delay.includes(":")) {
                                        times_data.aller.push(time.delay.split(" ")[1])
                                    } else {
                                        times_data.aller.push(`${parseInt(time.delay.split(" ")[0])} min.`)
                                    }
                                }
                            } else if (time.direction == 1) {
                                if (parseInt(time.delay.split(" ")[0]) <= 1) {
                                    times_data.retour.push(`Proche`)
                                } else {
                                    if (time.delay.includes(":")) {
                                        times_data.retour.push(time.delay.split(" ")[1])
                                    } else {
                                        times_data.retour.push(`${parseInt(time.delay.split(" ")[0])} min.`)
                                    }
                                }
                            }
                        }
                    }
                }  
                all_stations_ligne[station.id].temps = times_data
                station.temps = times_data
            }
            processed_stations += 1
            if (!isSilent) set_percentage(((processed_stations/estimated_stations)*90) + 10)  
        }
    }
    return ligne_info
}

// Fonction pour refactoriser toutes les données de la station et ajoute les temps
async function get_station_data(stationId) {
    set_percentage(10)

    // On get les prérequis
    const all_stations = await api_connect.get_saved_stations()
    const all_lignes = await api_connect.get_saved_lignes()
    let station_info = Object.values(all_stations).filter(station => station.id == stationId)[0]
    set_percentage(50)

    // On get les temps de la station
    const all_times_data = await api_connect.get_times_station(stationId)
    set_percentage(70)

    // On exploite les temps de la station
    for (let linked_ligne of station_info.linked_lignes) {
        const ligne_ref = all_lignes.filter(ligne => ligne.id == linked_ligne.id)[0]
        linked_ligne.directions = ligne_ref.directions
        linked_ligne.stations = ligne_ref.directions.aller.stations

        let temp_times_data = Object.values(all_times_data).filter(time => Object.keys(all_times_data)[Object.values(all_times_data).indexOf(time)] ==  linked_ligne.id)[0]
        let times_data = {aller: [], retour: []}

        if (temp_times_data) {
            for(const times of Object.values(temp_times_data)) {
                for(const time of times) {
                    if (time.direction == 0) {
                        if (parseInt(time.delay.split(" ")[0]) <= 1) {
                            times_data.aller.push(`Proche`)
                        } else {
                            if (time.delay.includes(":")) {
                                times_data.aller.push(time.delay.split(" ")[1])
                            } else {
                                    times_data.aller.push(`${parseInt(time.delay.split(" ")[0])} min.`)
                            }
                        }
                    } else if (time.direction == 1) {
                        if (parseInt(time.delay.split(" ")[0]) <= 1) {
                            times_data.retour.push(`Proche`)
                        } else {
                            if (time.delay.includes(":")) {
                                times_data.retour.push(time.delay.split(" ")[1])
                            } else {
                                times_data.retour.push(`${parseInt(time.delay.split(" ")[0])} min.`)
                            }
                        }
                    }
                }
            }
        }
        linked_ligne.times = times_data
    }

    set_percentage(100)
    return station_info
}

// Fonction pour refactoriser toutes les données de la station et ajouter les temps de maniere silencieuse
async function get_station_data_silent(stationId) {

    // On get les prérequis
    const all_stations = await api_connect.get_saved_stations()
    const all_lignes = await api_connect.get_saved_lignes()
    let station_info = Object.values(all_stations).filter(station => station.id == stationId)[0]

    // On get les temps de la station
    const all_times_data = await api_connect.get_times_station(stationId)

    // On exploite les temps de la station
    for (let linked_ligne of station_info.linked_lignes) {
        const ligne_ref = all_lignes.filter(ligne => ligne.id == linked_ligne.id)[0]
        linked_ligne.directions = ligne_ref.directions
        linked_ligne.stations = ligne_ref.stations

        let temp_times_data = Object.values(all_times_data).filter(time => Object.keys(all_times_data)[Object.values(all_times_data).indexOf(time)] ==  linked_ligne.id)[0]
        let times_data = {aller: [], retour: []}

        if (temp_times_data) {
            for(const times of Object.values(temp_times_data)) {
                for(const time of times) {
                    if (time.direction == 0) {
                        if (parseInt(time.delay.split(" ")[0]) <= 1) {
                            times_data.aller.push(`Proche`)
                        } else {
                            if (time.delay.includes(":")) {
                                times_data.aller.push(time.delay.split(" ")[1])
                            } else {
                                    times_data.aller.push(`${parseInt(time.delay.split(" ")[0])} min.`)
                            }
                        }
                    } else if (time.direction == 1) {
                        if (parseInt(time.delay.split(" ")[0]) <= 1) {
                            times_data.retour.push(`Proche`)
                        } else {
                            if (time.delay.includes(":")) {
                                times_data.retour.push(time.delay.split(" ")[1])
                            } else {
                                times_data.retour.push(`${parseInt(time.delay.split(" ")[0])} min.`)
                            }
                        }
                    }
                }
            }
        }
        linked_ligne.times = times_data
    }

    return station_info
}

// Fonction pour recuperer les meilleurs itinéraires
async function get_itineraire_result(itineraireData) {
    const itineraireFinder = parent.require('../script/itineraire/itineraire_finder.js');
    let travels_data = await itineraireFinder.MainFinder(itineraireData)
    return travels_data
}

// Set le pourcecentage de la progress bar de l'UI
function set_percentage(percentage) {
    document.getElementById("full-progress-bar-loading").style.width = `${percentage}%`
}