const api_connect = parent.require('../script/API/api-connect.js')
const fs = parent.require('fs')

async function exportLignes() {
    lignes = await api_connect.old_get_all_lignes()
    stations = await api_connect.get_all_stations()
    var perfectLignes = []

    for (ligne of lignes) {
        const ligne_data_aller = await api_connect.get_ligne(ligne.id, true)
        const ligne_data_retour = await api_connect.get_ligne(ligne.id, false)
        let all_stations_aller = []
        let all_stations_retour = []
        for (station of Object.values(ligne_data_aller.stops)) {

            let found_station = Object.values(stations).filter(i => i.id === station.logical_stop)[0];

            if (found_station === undefined) {
                console.log(station)
                continue;
            }

            let isTerminus = false
            if (station.isTerminus == null) {
                isTerminus = false
            } else {
                isTerminus = station.isTerminus
            }
            all_stations_aller.push({id: station.logical_stop, isTerminus: isTerminus, nom: station.nom, accessible: station.accessible})
        }

        if (ligne_data_retour.stops === undefined) {
            console.log(ligne_data_aller.numero)
        } else {
            for (station of Object.values(ligne_data_retour.stops)) {

                let found_station = Object.values(stations).filter(i => i.id === station.logical_stop)[0];
    
                if (found_station === undefined) {
                    console.log(station)
                    continue;
                }
    
                let isTerminus = false
                if (station.isTerminus == null) {
                    isTerminus = false
                } else {
                    isTerminus = station.isTerminus
                }
                all_stations_retour.push({id: station.logical_stop, isTerminus: isTerminus, nom: station.nom, accessible: station.accessible})
            }
        }

        if (!ligne.ligne_param.hasOwnProperty('isVisible') || !ligne.ligne_param.isVisible) {
            continue;
        }

        let couleur = ligne.couleur
        let text_couleur = ligne.ligne_param.ligneTextColor

        if (couleur === undefined || couleur == "#" || couleur == "") {
            couleur = ligne.ligne_param.ligneBackgroundColor
        }

        if (text_couleur === undefined || text_couleur == "#" || text_couleur == "") {
            text_couleur = "#FFFFFF"
        }

        if (!couleur.includes("#")) {
            couleur = `#${couleur}`
        }

        if (!text_couleur.includes("#")) {
            text_couleur = `#${text_couleur}`
        }

        perfectLignes.push({id: ligne.id, type: ligne.type, numero: ligne.numero.trim(), directions: {aller: {nom :ligne.ligne_param.nom_aller, stations: all_stations_aller}, retour: {nom : ligne.ligne_param.nom_retour, stations: all_stations_retour}}, couleur: couleur.toUpperCase(), text_couleur: text_couleur.toUpperCase()})
    }
    
    fs.writeFile('lignes.json', JSON.stringify(perfectLignes), function (err) {
        if (err) throw err;
        console.log('Saved!');
    });
}

async function exportStations() {
    stations = await api_connect.old_get_all_stations()
    lignes = await api_connect.get_all_lignes()
    console.log(lignes)

    var perfectStations = []

    for (station of stations) {
        let linked_lignes = []
        
        for (linked_ligne of station.linked_lignes) {
            let found_ligne = Object.values(lignes).filter(ligne => ligne.id === linked_ligne.id)[0];
            if (found_ligne) {
                linked_lignes.push({id: parseInt(found_ligne.id), numero: found_ligne.numero, couleur: found_ligne.couleur, text_couleur: found_ligne.text_couleur})
            }
        }

        if (linked_lignes < 1) {
            continue;
        }

        perfectStations.push({id: station.id, nom: station.nom.trim(), coords: {latitude: parseFloat(station.lat), longitude: parseFloat(station.lng)}, accessible: station.accessible, linked_lignes: linked_lignes})
    }

    fs.writeFile('stations.json', JSON.stringify(perfectStations), function (err) {
        if (err) throw err;
        console.log('Saved!');
    });
}

async function exportTravels() {
    var perfectTravels = {}

    fetch('../data/stations_childs.json').then(response => response.json())
    .then(data => {
        var childs_stations = data
        fetch('../data/travels_data.json').then(response => response.json())
        .then(data => {
            var travels_data = data
            fetch('../data/stop_times.json').then(response => response.json())
            .then(data => {
                for (travel in data) {
                    console.log(`${Number(travel/data.length*100).toFixed(2)}%`)

                    let station_ref = childs_stations.filter(station => station.stop_id == data[travel].stop_id)[0]
                    let travel_data = travels_data.filter(travel_info => travel_info.trip_id == data[travel].trip_id)[0]

                    if (!station_ref || !travel_data) continue

                    var station_id;
                    if (station_ref.parent_station == "") {
                        station_ref.stop_id
                    } else {
                        station_id = station_ref.parent_station
                    }

                    const arrivalTime = data[travel].arrival_time.split(":");
                    const departureTime = data[travel].departure_time.split(":");

                    if (perfectTravels[station_id] == undefined) {
                        perfectTravels[station_id] = [{id: data[travel].trip_id, ligne_id: travel_data.route_id, direction_id: travel_data.direction_id, arrival_time: new Date(`2000-01-01T${parseInt(arrivalTime[0], 10) > 23 ? "00" : arrivalTime[0]}:${arrivalTime[1]}:${arrivalTime[2]}Z`), depart_time: new Date(`2000-01-01T${parseInt(departureTime[0], 10) > 23 ? "00" : departureTime[0]}:${departureTime[1]}:${departureTime[2]}Z`)}]
                    } else {
                        perfectTravels[station_id].push({id: data[travel].trip_id, ligne_id: travel_data.route_id, direction_id: travel_data.direction_id, arrival_time: new Date(`2000-01-01T${parseInt(arrivalTime[0], 10) > 23 ? "00" : arrivalTime[0]}:${arrivalTime[1]}:${arrivalTime[2]}Z`), depart_time: new Date(`2000-01-01T${parseInt(departureTime[0], 10) > 23 ? "00" : departureTime[0]}:${departureTime[1]}:${departureTime[2]}Z`)})
                    }
                }

                fs.writeFile('travels.json', JSON.stringify(perfectTravels), function (err) {
                    if (err) throw err;
                    console.log('Saved!');
                });
            })
        })
    })

    
}

//exportStations()
//exportLignes()
exportTravels()