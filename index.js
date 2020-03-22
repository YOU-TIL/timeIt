const electron = require('electron');
const {app} = electron;
const {BrowserWindow} = electron;
let win, aWin;

global.r = 0;
global.setTime = 10;
let toR = 1;
let begin;

function createWindow() {
    win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true
        }
    });
    win.loadURL(`file://${__dirname}/index.html`);
    //win.webContents.openDevTools();
    win.setMenu(null);
    win.on('closed', () => {
        win = null;
        if (toR === 0 && !aWin) app.exit();
    });
    setTimeout(function () {
        setInterval(function () {
            if (global.r >= 1) global.r = 1;
            if (toR > global.r && Math.pow(toR - global.r, 0.8) * 0.03) global.r += Math.pow(toR - global.r, 0.8) * 0.03;
            if (toR < global.r && Math.pow(global.r - toR, 0.8) * 0.03) global.r -= Math.pow(global.r - toR, 0.8) * 0.03;
        }, 10);
        begin = new Date().getTime();
        let decIntv = setInterval(function () {
            let now = new Date().getTime();
            toR = 1 - ((now - begin) / 1000 / global.setTime);
            if (toR <= 0) {
                toR = 0;
                clearInterval(decIntv);
                aWin = new BrowserWindow({
                    width: 600,
                    height: 400,
                    frame: false,
                    webPreferences: {
                        nodeIntegration: true
                    }
                });
                aWin.loadURL(`file://${__dirname}/popup.html`);
                aWin.on('closed', () => {
                    aWin = null;
                    if (!win) app.exit();
                });
                aWin.setAlwaysOnTop(true, 'screen');
            }
        }, 100);
    }, 1000);
}

app.on('ready', createWindow);

app.on('window-all-closed', (e) => {
    e.preventDefault();
});

app.on('activate', () => {
    if (win === null) {
        createWindow();
    }
});