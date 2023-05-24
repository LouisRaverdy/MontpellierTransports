/* -------------------------------------------------------------------------- */
/*     Fichier Main (Gestion de fenêtres, de communication & mises à jour)    */
/* -------------------------------------------------------------------------- */

const { app, BrowserWindow, Menu } = require('electron');
const { autoUpdater } = require("electron-updater");
const { setupTitlebar, attachTitlebarToWindow } = require("custom-electron-titlebar/main");
const path = require('path');
const isDev = require('electron-is-dev');
const ipc = require("electron").ipcMain;

setupTitlebar();
Menu.setApplicationMenu(null)
let mainWindow;

// Création de la fenêtre de lancement
const createWindow = () => {
    mainWindow = new BrowserWindow({
        width:  600,
        height: 240,
        resizable: false,
        frame: false,
        fullscreenable: false,
        show: false,
        transparent: true,
        icon: path.join(__dirname, '../src/MT_Icon.ico'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    })

    mainWindow.loadFile('./html/launchscreen.html')
    mainWindow.webContents.on('did-finish-load', function() {
        mainWindow.show();
    });
}

// Systeme d'envoi de message vers les processus de rendu
function sendStatusToWindow(text) {
    if (mainWindow && text != "") {
        mainWindow.webContents.send('message', text);
    }
}

// Vérification de fermeture de toutes les fenêtres
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})

// Lancement de l'application
app.whenReady().then(() => {
    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})


// Systeme de communication vers les processus de rendu
ipc.on('asynchronous-message', (event, arg) => {

    // Création de la fenêtre principale
    if (arg === "show-main-page") {
        mainWindow.close()
        mainWindow = new BrowserWindow({
            width: 1100,
            height: 600,
            resizable: false,
            show: false,
            fullscreenable: false,
            icon: path.join(__dirname, '../src/MT_Icon.ico'),
            titleBarStyle: "hidden",
            frame: false,
            webPreferences: {
                sandbox: false,
                nodeIntegration: true,
                contextIsolation: false,
                enableRemoteModule: true,
                webviewTag: true,
                preload: path.join(__dirname, 'preload.js')
            }
        })
        mainWindow.loadFile('./html/index.html')
        attachTitlebarToWindow(mainWindow);
        mainWindow.webContents.on('did-finish-load', function() {
            setTimeout(function () {
                mainWindow.show();
            }, 500)
            
        });   
    } else if (arg === "check-for-updates") {

        // Vérification des mises à jour
        if (isDev) {
            sendStatusToWindow('no-update');
        } else {
            autoUpdater.setFeedURL({
                provider: 'github',
                repo: 'montpelliertransports',
                owner: 'LouisRaverdy',
            })
            autoUpdater.checkForUpdates()
        }
    } else {
        mainWindow.webContents.send('message', arg);
    }
})


// Système de mise à jour
autoUpdater.on('checking-for-update', () => {
    sendStatusToWindow('Vérification des mises à jour...');
});
autoUpdater.on('update-available', info => {
    sendStatusToWindow('Une mise à jour est disponible !');
});
autoUpdater.on('update-not-available', info => {
    sendStatusToWindow('no-update');
});
autoUpdater.on('error', err => {
    if (err.toString().includes("Unable to find latest version")) {
        noConnection(10)
    } else if (err.toString().includes("Could not get code signature")) {
        sendStatusToWindow(`Impossible de mettre à jour l'app. Veuillez la réinstaller.`);
    } else if (err.toString().includes("Cannot find")) {
        sendStatusToWindow(`Impossible de mettre à jour l'app. Veuillez la réinstaller.`);
    } else {
        sendStatusToWindow(`Erreur : ${err.toString()}`);
    }
});
autoUpdater.on('download-progress', progressObj => {
    sendStatusToWindow(`Téléchargement de la mise à jour. (${Math.round(progressObj.percent)}%)`
    );
});
autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
    autoUpdater.quitAndInstall()
})

// Fonction d'attente de connection au lancement
function noConnection(remainingTime) {
    if (remainingTime < 1) {
        autoUpdater.checkForUpdates()
    } else {
        sendStatusToWindow(`Auccune connection internet. Nouvelle tentative dans ${remainingTime} secondes.`);
        setTimeout(function() {
            noConnection(remainingTime - 1)
        }, 1000)
    }
}