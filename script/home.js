const { shell } = parent.require('electron')


// Sauvegarde des formes du background
const background = [{
    ref: document.getElementById('background-buble-one'),
    base_location: [parseInt(getComputedStyle(document.getElementById('background-buble-one')).right), parseInt(getComputedStyle(document.getElementById('background-buble-one')).top)],
    coef: 30
},
{
    ref: document.getElementById('background-buble-two'),
    base_location: [parseInt(getComputedStyle(document.getElementById('background-buble-two')).right), parseInt(getComputedStyle(document.getElementById('background-buble-two')).top)],
    coef: 60
},
{
    ref: document.getElementById('background-buble-three'),
    base_location: [parseInt(getComputedStyle(document.getElementById('background-buble-three')).right), parseInt(getComputedStyle(document.getElementById('background-buble-three')).top)],
    coef: 40
}]


// Fonction de changement de page
function changePage(src) {
    parent.changePage(src)
}

// Fonction d'ouverture du lien dans le navigateur
function openURL(url) {
    shell.openExternal(url)
}

// Fonction de mouvement des formes du background
window.addEventListener('mousemove', (event) => {
    for (buble of background) {
        buble.ref.style.right = buble.base_location[0] - (buble.coef * (event.screenX / document.documentElement.clientWidth))
        buble.ref.style.top = buble.base_location[1] - (-buble.coef/4 * (event.screenY / document.documentElement.clientHeight))
    }
});

