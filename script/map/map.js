const api_connect = parent.require('../script/API/api-connect.js')
const accessToken = 'nFURknugB23yMJ4MA2aTqXturqK8xcMr1eOS9U0jpnASmPhUL35pjhmv1ihUDl9P';
var stationsJSON;
var tramwayJSON;
var busUrbJSON;
var busSubJSON;
var lignes;
var stations;

async function formatStations() {
  stations = await api_connect.get_saved_stations()

  let temp_stations = "";
  for (station_data of stations) {
    let all_lignes = ""
    for (const i of station_data.linked_lignes) {
      if (i.numero.length > 2) {
          all_lignes += `<button onclick='showLigne(${i.id})' class='station-ligne-rect-long' style='background-color: ${i.couleur}'><div class='station-ligne-rect-text-long' style='color: ${i.text_couleur}'>${i.numero}</div></button>`
      } else {
          all_lignes += `<button onclick='showLigne(${i.id})' class='station-ligne-rect' style='background-color: ${i.couleur}'><div class='station-ligne-rect-text' style='color: ${i.text_couleur}'>${i.numero}</div></button>`
      }
    }
    if (Object.values(stations).indexOf(station_data) + 1 === stations.length) {
      temp_stations += `{"type": "Feature", "geometry": { "type": "Point", "coordinates": [${station_data.coords.longitude}, ${station_data.coords.latitude}]}, "properties": { "name": \"${station_data.nom}\", "lignes_data": "${all_lignes}", "index": ${Object.values(stations).indexOf(station_data)}}}`
    } else {
      temp_stations += `{"type": "Feature", "geometry": { "type": "Point", "coordinates": [${station_data.coords.longitude}, ${station_data.coords.latitude}]}, "properties": { "name": \"${station_data.nom}\", "lignes_data": "${all_lignes}", "index": ${Object.values(stations).indexOf(station_data)}}},`
    }
  }
  stationsJSON = JSON.parse(`{"type": "FeatureCollection", "features": [${temp_stations}]}`)
}

async function formatLignes() {
  lignes = await api_connect.get_saved_lignes()
  data_tram = await api_connect.get_tram_path()
  data_urb_bus = await api_connect.get_busUrb_path()
  data_sub_bus = await api_connect.get_busSub_path()

  for (tram of data_tram.features) {
    tram.properties.ligne_couleur = lignes.filter(ligne => ligne.id === tram.properties.num)[0].couleur
  }

  for (urbBus of data_urb_bus.features) {
    urbBus.properties.ligne_couleur = lignes.filter(ligne => ligne.id === urbBus.properties.num)[0].couleur
  }

  for (subBus of data_sub_bus.features) {
    subBus.properties.ligne_couleur = lignes.filter(ligne => ligne.id === subBus.properties.num)[0].couleur
  }

  tramwayJSON = data_tram
  busUrbJSON = data_urb_bus
  busSubJSON = data_sub_bus
}

formatStations();
formatLignes();

var map = new maplibregl.Map({
    container: "map",
    style: `https://api.jawg.io/styles/jawg-sunny.json?access-token=${accessToken}`,
    zoom: 13,
    center: [3.8772300, 43.6109200],
}).addControl(new maplibregl.NavigationControl(), 'top-right');

map.on("load", () => {
  if (map.getLayer("networks")) {
      map.removeLayer("networks")
      map.removeLayer("public-transport-label")
  };

  map.addLayer({
    id: 'tramway',
    type: 'line',
    source: {
      type: "geojson",
      data: tramwayJSON
    },
    layout: {
      'line-join': 'round',
      'line-cap': 'round'
      },
    paint: {
      'line-color': ['get', 'ligne_couleur'],
      'line-width': 4
    }
  });

  map.addLayer({
    id: 'busSub',
    type: 'line',
    source: {
      type: "geojson",
      data: busSubJSON
    },
    layout: {
      'line-join': 'round',
      'line-cap': 'round'
      },
    paint: {
      'line-color': ['get', 'ligne_couleur'],
      'line-width': 4
    },
    'minzoom': 12
  });

  map.addLayer({
    id: 'busUrb',
    type: 'line',
    source: {
      type: "geojson",
      data: busUrbJSON
    },
    layout: {
      'line-join': 'round',
      'line-cap': 'round'
      },
    paint: {
      'line-color': ['get', 'ligne_couleur'],
      'line-width': 4
    },
    'minzoom': 12
  });
  
  map.addLayer({
    id: 'station',
    type: 'circle',
    source: {
      type: "geojson",
      data: stationsJSON
    },
    paint : {
      'circle-color': '#414491',
      'circle-stroke-color': '#FFFFFF',
      'circle-stroke-width': [
        'interpolate', ['linear'], ['zoom'],
          11, 1,
          14, 2,
          18, 2,
      ],
      'circle-radius': [
        'interpolate', ['linear'], ['zoom'],
          11, 1,
          14, 6,
          18, 6,
      ],
    },
    'minzoom': 11
  });

  map.on('click', function (e) {
    var features = map.queryRenderedFeatures(e.point)[0];
    if (!features) return
    var id = features.layer.id;

    if (id === "station") {
      var coordinates = features.geometry.coordinates.slice();
      var description = `<div class="vertical-container"><div class="station-name">${features.properties.name}</div><div class="lignes-container">${features.properties.lignes_data}</div><button class="button-show-more" onclick="showStation(${features.properties.index})">En savoir +</button></div>`;
        
      while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
      }
      
      new maplibregl.Popup({
        closeButton: false
      })
        .setLngLat(coordinates)
        .setHTML(description)
        .addTo(map);
    } else if (id === "tramway" || id === "busUrb" || id === "busSub") {
      let ligne = lignes.filter(ligne => ligne.id === features.properties.num)[0]
      if (ligne.numero.length > 2) {
        var description = `<div class="vertical-container"><div class="horizontal-container"><div class="ligne-name">Ligne</div><div class='ligne-rect-long' style='background-color: ${ligne.couleur}'><div class='station-ligne-rect-text-long' style='color: ${ligne.text_couleur}'>${ligne.numero}</div></div></div><button class="button-show-more" onclick="showLigne(${ligne.id})">En savoir +</button></div>`;
      } else {
        var description = `<div class="vertical-container"><div class="horizontal-container"><div class="ligne-name">Ligne</div><div class='ligne-rect' style='background-color: ${ligne.couleur}'><div class='station-ligne-rect-text' style='color: ${ligne.text_couleur}'>${ligne.numero}</div></div></div><button class="button-show-more" onclick="showLigne(${ligne.id})">En savoir +</button></div>`;
      }
      
      new maplibregl.Popup({
        closeButton: false
      })
        .setLngLat(e.lngLat)
        .setHTML(description)
        .addTo(map);
    }
  });
    
  map.on('mouseenter', 'station', function () {
    map.getCanvas().style.cursor = 'pointer';
  });
    
  map.on('mouseleave', 'station', function () {
    map.getCanvas().style.cursor = '';
  });

  map.on('mouseenter', 'tramway', function () {
    map.getCanvas().style.cursor = 'pointer';
  });
    
  map.on('mouseleave', 'tramway', function () {
    map.getCanvas().style.cursor = '';
  });

  map.on('mouseenter', 'busUrb', function () {
    map.getCanvas().style.cursor = 'pointer';
  });
    
  map.on('mouseleave', 'busUrb', function () {
    map.getCanvas().style.cursor = '';
  });

  map.on('mouseenter', 'busSub', function () {
    map.getCanvas().style.cursor = 'pointer';
  });
    
  map.on('mouseleave', 'busSub', function () {
    map.getCanvas().style.cursor = '';
  });
});

// Affiche la page de la station demandée
function showStation(index) {
  parent.show_station(stations[index].id)
}

// Affiche la page de la ligne demandée
function showLigne(ligneId) {
  parent.show_ligne(ligneId)
}