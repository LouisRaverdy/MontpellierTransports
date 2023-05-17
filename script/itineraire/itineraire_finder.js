/*
	Ce script JavaScript permet de générer les itinéraires.
	Il possède donc les classes et les fonctions pour cette usages.
	Il renvoie en dernier lieu ses résultats pour les afficher.
*/


const api_connect = parent.require('../script/API/api-connect.js')
var lignes;
var stations;


async function MainFinder(info){
	var date_info = [info.date.getDay() - 1, info.date.getHours(), info.date.getMinutes()];
	lignes = await api_connect.get_saved_lignes()
	stations = await api_connect.get_saved_stations()

	let tree = new Tree(info.start_station, info.destination_station);
	let bestWay = tree.searching();

	let alreadyFetched = {};

	let finalWays = [];
	let corruptedLines = [];
	for (let way = 0; way < bestWay.length; way++){

		let AllStops = [];
		let AllLines = [];
		let current_way = bestWay[way][1];
		while (current_way != undefined){
			AllStops.unshift(current_way);
			if (current_way.lineFrom != undefined){
				AllLines.unshift(current_way.lineFrom);
			}
			current_way = current_way.parent;
		}

		let AllSteps = [];
		for (let i = 0; i < AllLines.length; i++){
			let allStopOfThisLine = AllStops.filter(x => x["lineFrom"] == AllLines[i])
			AllSteps.push(AllStops[AllStops.indexOf(allStopOfThisLine[0]) - 1])
			AllSteps.push(allStopOfThisLine[allStopOfThisLine.length - 1])
		}

		let theTime = new Date(info.date);

		let error = false;
		let resultArr = [];
		for (let arr = 0; arr < AllSteps.length && !error; arr++){
			let line = AllSteps[arr].lineFrom;
			if (line == undefined && AllSteps[arr + 1] != undefined){
				line = AllSteps[arr + 1].lineFrom;
			}
			if (line == undefined && AllSteps[arr - 1] != undefined){
				line = AllSteps[arr - 1].lineFrom;
			}
			if (line == undefined){
				error = true
			}
			let t;
			if (!(AllSteps[arr].arret.id in alreadyFetched)){
				t = await api_connect.get_theoric_times(AllSteps[arr].arret.id);
				if (t == "error"){
					error = true;
				}
				else{
					alreadyFetched[AllSteps[arr].arret.id] = t;
				}
			}
			else{
				t = alreadyFetched[AllSteps[arr].arret.id];
			}
			if (!error){
				let printed = [];
				for (let prin of t.map(x => x.ligne_id)){
					if (!(prin in printed)){
						printed.push(prin);
					}
				}
				t = t.filter(x => x.ligne_id == line[0]);
				t = t.filter(x => x.direction_id == line[1])
				t = t.filter(x => {
					let deltaT = new Date(x["arrival_time"]);
					let times = deltaT.getHours() + deltaT.getMinutes() / 60;
					return (times > theTime.getHours() + theTime.getMinutes() / 60);
				});
				if (t.length > 0){
					let minimDate = new Date(t[0]["arrival_time"])
					let minimum = [t[0], minimDate.getHours() + minimDate.getMinutes() / 60];
					for (let timing of t){
						let theDate = new Date(timing["arrival_time"])
						if (theDate.getHours() + theDate.getMinutes() / 60 < minimum[1]){
							minimum = [timing, theDate.getHours() + theDate.getMinutes() / 60];
						}
					}
					
					let last_time = theTime;
					theTime = new Date(minimum[0]["arrival_time"]);

					resultArr.push({
						"stop": AllSteps[arr], 
						"arrive": last_time, 
						"depart": theTime, 
						"lineTo": line[0]
					});
				}
				else{
					error = true;
				}
			}
		}
		if (resultArr.length > 0){
			resultArr[0]["lineFrom"] = resultArr[0]["lineTo"];
			resultArr[resultArr.length - 1]["lineFrom"] = resultArr[resultArr.length - 1]["lineTo"];
			for (let k = 1; k < resultArr.length - 2; k++){
				resultArr[k]["lineFrom"] = resultArr[k + 1]["lineTo"];
			}

			let preview = [];
			for (let ar of resultArr){
				if (ar.lineTo != undefined){
					let boole = true;
					for (let element of preview){
						if (element == ar.lineTo){boole = false}
					}
					if (boole){preview.push(ar.lineTo)}
				}
			}
			resultWay = {
				"departTime": resultArr[0]["depart"],
				"destinationTime": resultArr[resultArr.length - 1]["arrive"],
				"stationDepartName": resultArr[0]["stop"]["arret"]["nom"],
				"stationDestinationName": resultArr[resultArr.length - 1]["stop"]["arret"]["nom"],
				"previewArray": preview,
				"detailTravel": resultArr
			};
			finalWays.push(resultWay);
		}
		if (error){
			corruptedLines.push(bestWay[way]);
		}
		parent.set_percentage(way / bestWay.length * 100)
	}
	for (let corrupt of corruptedLines){
		delete bestWay[bestWay.indexOf(corrupt)];
	}

	let finalReturn = [];
	//let secondTry = [];
	for (let path of finalWays){
		if (path.stationDestinationName == info.destination_station.nom){
			finalReturn.push(path)
		}
	}
	return finalReturn;
}

class Noeud{
	constructor(value, arret, parent, time, lineFrom){ // S5633
		this.arret = arret;
		this.value = value;
		this.sons = [];
		this.parent = parent;
		this.family = (this.parent != undefined) ? new Set(parent.family) : new Set();
		this.family.add(this.arret.id); // kill for parent
		this.time = time;
		this.lineFrom = lineFrom;
		this.lineTo;
	}
	check_parent(checker){
		if (this.parent != undefined){
			let current = this;
			while(current.parent != undefined || (current.parent != undefined && current.parent.arret.id != checker)){
				current = current.parent;
			}
			return (current.parent == undefined);
		} else{return true;}
	}
	catch_proximity(tree){
		if (tree.newBorn.includes(this)){
			tree.newBorn.splice(tree.newBorn.indexOf(this), 1);
		}
		let allLignes = [];
		for (let line of this.arret.linked_lignes){
			allLignes.push(lignes[lignes.map(x => x.id).indexOf(line.id)])		
		}
		let arrets = [];
		for (let line of allLignes){
			for (let k of Object.keys(line.directions)){
				let pos = line.directions[k].stations.map(x => x.id).indexOf(this.arret.id);
				if (line.directions[k].stations[0].id != line.directions[k].stations[line.directions[k].stations.length - 1].id){// check circle lines
					if (pos + 1 < line.directions[k].stations.length - 1){
						if(line.directions[k].stations[pos + 1].id == tree.destination_station.id){
							let finisher = new Noeud(this.value + 1, stations.filter(y => y.id == line.directions[k].stations[pos + 1].id)[0], this, 0, [line.id, ([k] == "aller") ? 0 : ([k] == "retour") ? 1 : -1])
							this.sons.push(finisher);
							tree.finish_search(finisher, this.value);
						}
						else{
							if (this.parent == undefined || !this.family.has(line.directions[k].stations[pos + 1].id)){
								let access = true;
								for (let posed of arrets){
									if (posed[0].id == line.directions[k].stations[pos + 1].id){
										access = false;
									}
								}
								if (access){
									arrets.push([line.directions[k].stations[pos + 1], line.id, ([k] == "aller") ? 0 : ([k] == "retour") ? 1 : -1]);
								}
							}
						}
					}
				}
				else{ // circle line
					let position = (pos + 1 >= line.directions[k].stations.length) ? (pos + 1 - line.directions[k].stations.length) : ((pos + 1 < 0) ? (pos + 1 + line.directions[k].stations.length) : (pos + 1));
					if(line.directions[k].stations[position].id == tree.destination_station.id){
						let finisher = new Noeud(this.value + 1, stations.filter(y => y.id == line.directions[k].stations[position].id)[0], this, 0, [line.id, ([k] == "aller") ? 0 : ([k] == "retour") ? 1 : -1])
						this.sons.push(finisher);
						tree.finish_search(finisher, this.value);
					}
					else{
						if (this.parent == undefined || !this.family.has(line.directions[k].stations[position].id)){
							let access = true;
							for (let posed of arrets){
								if (posed[0].id == line.directions[k].stations[position].id){
									access = false;
								}
							}
							if (access){
								arrets.push([line.directions[k].stations[position], line.id, (line.directions[k] == "aller") ? 0 : (line.directions[k] == "retour") ? 1 : -1]);
							}
						}				
					}
				}
			}
		}
		for (let arret of arrets){
			let son = new Noeud(this.value + 1, stations.filter(y => y.id == arret[0].id)[0], this, 0, [arret[1], arret[2]])
			this.sons.push(son);
			tree.newBorn.push(son);
		}
	}
}

class Tree{ // kill the branch and the ids when ya plus de gossse
	constructor(racine, destination_station){
		this.ids = {};
		this.ids[racine.id] = [];
		this.racine = new Noeud(0, racine, undefined, 0, undefined);
		this.bestWay = [];
		this.newBorn = [this.racine];
		this.tempBorn = [];
		this.destination_station = destination_station;
	}
	new_generation(){
		let born = this.newBorn;
		this.newBorn = [];
		this.ids = []
		for (let noeud of born){
			if (this.bestWay.length < 60){
				noeud.catch_proximity(this);
			}
		}
	}
	finish_search(before_stop, value){
		this.bestWay.push([value, before_stop])
	}
	searching(){
		while (this.newBorn.length && this.bestWay.length < 60){
			this.new_generation();
		}
		let end = [];
		for (let best of this.bestWay){
			let access = true;
			for (let placed of end){
				if (placed[1].family == best[1].family){
					access = false;
				}
			}
			if (access){
				end.push(best)
			}
		}
		return end;
	}
}

module.exports = {
	MainFinder
}