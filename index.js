const {app, BrowserWindow, Tray, ipcMain} = require('electron');
let win = null, aWin = null, tray, decIntv, pauseStartTime, toR = 0, begin;

global.r = {value: 0};
global.setTime = {value: 0};
global.isPaused = {value: false};

ipcMain.on('startTimer', (event, arg) => {
    startTimer();
});
ipcMain.on('pauseTimer', (event, arg) => {
    pauseTimer();
});
ipcMain.on('resumeTimer', (event, arg) => {
    resumeTimer();
});
ipcMain.on('stopTimer', (event, arg) => {
    stopTimer();
});

function createWindow() {
    if (win) return;
    win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true
        },
        icon: `${__dirname}\\logo.ico`
    });
    win.loadURL(`file://${__dirname}/index.html`);
    //win.webContents.openDevTools();
    win.setMenu(null);
    win.on('closed', () => {
        win = null;
        if (toR === 0 && !aWin) closeApp();
    });
}

function resumeTimer() {
    if (pauseStartTime) {
        let resumeTime = new Date().getTime();
        begin += (resumeTime - pauseStartTime);
    }
    decIntv = setInterval(function () {
        let now = new Date().getTime();
        toR = 1 - ((now - begin) / 1000 / global.setTime.value);
        if (toR <= 0) {
            toR = 0;
            clearInterval(decIntv);
            aWin = new BrowserWindow({
                width: 600,
                height: 400,
                frame: false,
                webPreferences: {
                    nodeIntegration: true
                },
                icon: `${__dirname}\\logo.ico`
            });
            aWin.loadURL(`file://${__dirname}/popup.html`);
            aWin.on('closed', () => {
                aWin = null;
                if (!win) closeApp();
            });
            aWin.setAlwaysOnTop(true, 'screen');
        }
    }, 100);
}

function pauseTimer() {
    clearInterval(decIntv);
    pauseStartTime = new Date().getTime();
}

function stopTimer() {
    clearInterval(decIntv);
    global.isPaused = {value: false};
    toR = 0;
}

function startTimer() {
    global.isPaused = {value: false};
    pauseStartTime = null;
    begin = new Date().getTime();
    resumeTimer();
}

function firstRun() {
    createWindow();
    setTimeout(function () {
        setInterval(function () {
            let r = global.r.value;
            if (r >= 1) r = 1;
            if (r <= 0) r = 0;
            if (toR > r && Math.pow(toR - r, 0.8) * 0.03) r += Math.pow(toR - r, 0.8) * 0.03;
            if (toR < r && Math.pow(r - toR, 0.8) * 0.03) r -= Math.pow(r - toR, 0.8) * 0.03;
            global.r.value = r;
        }, 10);
        //startTimer();
    }, 1000);
    if (!tray) {
        tray = new Tray(`${__dirname}\\logo.ico`);
        tray.setToolTip('타이머가 실행 중입니다.');
        tray.on('click', createWindow);
    }
}

function closeApp() {
    app.exit();
    tray.destroy();
}

app.on('ready', firstRun);

app.on('window-all-closed', (e) => {
    e.preventDefault();
});

app.on('activate', () => {
    if (win === null) {
        firstRun();
    }
});