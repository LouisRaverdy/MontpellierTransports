/* -------------------------------------------------------------------------- */
/*                    Pont entre l'API TAM et le programme                    */
/* -------------------------------------------------------------------------- */


// Import et configuration de firebase
const { initializeApp } =  parent.require("firebase/app");
const { getDatabase, ref, child, get } = parent.require("firebase/database");

const firebaseConfig = {
    apiKey: "AIzaSyCkGW5QMqPVKhtcB9py-KBF0F-aHQGnLs4",
    authDomain: "tam-api0.firebaseapp.com",
    databaseURL: "https://tam-api0-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "tam-api0",
    storageBucket: "tam-api0.appspot.com",
    messagingSenderId: "347771037756",
    appId: "1:347771037756:web:23faf22f894e8d8af6fb39",
    measurementId: "G-EY3MLW4T56"
};

initializeApp(firebaseConfig);
const database = ref(getDatabase());

// Sauvegarde des informations de stations et lignes
var temp_all_stations;
var temp_all_lignes;

// Récupération de toutes les stations du réseau
function get_all_stations() {
    return new Promise(resolve => {
        get(child(database, `stations/`)).then((snapshot) => {
            if (snapshot.exists()) {
                temp_all_stations = snapshot.val();
                resolve(snapshot.val());
            }
          }).catch((error) => {
            console.error(error);
            parent.showError("Erreur d'API.", "Impossible de récuperer les informations de l'API.")

        });
    });
}

// Old récupération de toutes les stations du réseau
function old_get_all_stations() {
    return new Promise(resolve => {
        fetch('https://cartographie.tam-voyages.com/gtfs/stopsarea').then(r => r.json())
            .then(data => {
                temp_all_stations = data
                resolve(data);
            })
            .catch(e => {
                console.log(e)
                parent.showError("Erreur d'API.", "Impossible de récuperer les informations de l'API.")
                resolve([]);
            })
    })
}

// Récupération de toutes les lignes du réseau
function get_all_lignes() {
    return new Promise(resolve => {
        get(child(database, `lignes/`)).then((snapshot) => {
            if (snapshot.exists()) {
                temp_all_lignes = snapshot.val();
                resolve(snapshot.val());
            }
          }).catch((error) => {
            console.error(error);
            parent.showError("Erreur d'API.", "Impossible de récuperer les informations de l'API.")

        });
    });
}

// Ancienne récupération de toutes les lignes du réseau
function old_get_all_lignes() {
    return new Promise(resolve => {
        fetch('https://cartographie.tam-voyages.com/gtfs/lignes').then(r => r.json())
            .then(data => {

                // On fix les couleurs vides a certains moment car l'api est pas bien codée
                for (let ligne of data) {
                    if (ligne.couleur === undefined || ligne.couleur == "#" || ligne.couleur == "") {
                        ligne.couleur = ligne.ligne_param.ligneBackgroundColor
                    }
                }
                temp_all_lignes = data
                resolve(data);
            })
            .catch(e => {
                console.log(e)
                parent.showError("Erreur d'API.", "Impossible de récuperer les informations de l'API.")
                resolve([]);
            })
    })
}

// Fonctions de sauvegarde des stations & lignes
async function get_saved_stations() {
    if (temp_all_stations === undefined) {
        return await get_all_stations()
    } else {
        return temp_all_stations
    }
}

async function get_saved_lignes() {
    if (temp_all_lignes === undefined) {
        return await get_all_lignes()
    } else {
        return temp_all_lignes
    }
}

function get_ligne(line, isAller){
    return new Promise(resolve => {
        fetch(`https://cartographie.tam-voyages.com/gtfs/ligne/${line}/ordered-arrets/${isAller ? 0 : 1}`).then(r => r.json())
            .then(data => {
                resolve(data);
            })
            .catch(e => {
                parent.showError("Erreur d'API.", "Impossible de récuperer les informations de l'API.")
                resolve([]);
            })
    })
}

// Récupération de toutes les informations concernant un arret
function get_times_station(arretId){
    return new Promise(resolve => {
        fetch(`https://cartographie.tam-voyages.com/gtfs/stop/rt/${arretId}`).then(r => r.json())
            .then(data => {
                resolve(data);
            })
            .catch(e => {
                console.log(e)
                parent.showError("Erreur d'API.", "Impossible de récuperer les informations de l'API.")
                resolve([]);
            })
    })
}

// Récupération de toutes les coordonnées des lignes du réseau en fonction de la position de la carte
function get_tram_path(){
    return new Promise(resolve => {
        fetch(`https://data.montpellier3m.fr/sites/default/files/ressources/MMM_MMM_LigneTram.json`).then(r => r.json())
            .then(data => {
                resolve(data);
            })
            .catch(e => {
                console.log(e)
                parent.showError("Erreur d'API.", "Impossible de récuperer les données de carte de l'API.")
                resolve([]);
            })
    })
}

function get_busUrb_path(){
    return new Promise(resolve => {
        fetch(`https://data.montpellier3m.fr/sites/default/files/ressources/MMM_MMM_BusLigneUrb.json`).then(r => r.json())
            .then(data => {
                resolve(data);
            })
            .catch(e => {
                console.log(e)
                parent.showError("Erreur d'API.", "Impossible de récuperer les données de carte de l'API.")
                resolve([]);
            })
    })
}

function get_busSub_path(){
    return new Promise(resolve => {
        fetch(`https://data.montpellier3m.fr/sites/default/files/ressources/MMM_MMM_BusLigneSub.json`).then(r => r.json())
            .then(data => {
                resolve(data);
            })
            .catch(e => {
                console.log(e)
                parent.showError("Erreur d'API.", "Impossible de récuperer les données de carte de l'API.")
                resolve([]);
            })
    })
}

// Récupération du temps théorique de la station
function get_theoric_times(stationId) {
    return new Promise(resolve => {
        get(child(database, `travels/${stationId}`))
        .then((snapshot) => {
            if (snapshot.exists()) {
                resolve(snapshot.val());
            }else{
                console.log(stationId); 
                resolve("error");
            }
        }).catch((error) => {
            console.error(error);
            parent.showError("Erreur d'API.", "Impossible de récuperer le temps théorique de l'arret dans l'API.")
        });
    });
}


// On exporte toutes les fonctions pour qu'elles soient accessibles partout
module.exports = {
    get_all_stations,
    old_get_all_stations,
    get_saved_stations,
    get_saved_lignes,
    get_all_lignes,
    old_get_all_lignes,
    get_ligne,
    get_times_station,
    get_tram_path,
    get_busUrb_path,
    get_busSub_path,
    get_theoric_times,
}