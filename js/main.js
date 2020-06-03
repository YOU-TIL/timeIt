getVal = require('electron').remote.getGlobal;
const {ipcRenderer} = require('electron');
let isMouseOver = false;

function mouseStatus(val) {
    isMouseOver = val;
}

function togglePause() {
    if (getVal('isPaused').value) {
        getVal('isPaused').value = false;
        ipcRenderer.send('resumeTimer', 'Timer');
    } else {
        getVal('isPaused').value = true;
        ipcRenderer.send('pauseTimer', 'Timer');
    }
}

function getCaretPosition(ctrl) {
    let CaretPos = 0;
    if (ctrl.selectionStart || ctrl.selectionStart == 0) {// Standard.
        CaretPos = ctrl.selectionStart;
    } else if (document.selection) {// Legacy IE
        ctrl.focus();
        var Sel = document.selection.createRange();
        Sel.moveStart('character', -ctrl.value.length);
        CaretPos = Sel.text.length;
    }
    return (CaretPos);
}


function setCaretPosition(ctrl, pos) {
    if (ctrl.setSelectionRange) {
        ctrl.focus();
        ctrl.setSelectionRange(pos, pos);
    } else if (ctrl.createTextRange) {
        var range = ctrl.createTextRange();
        range.collapse(true);
        range.moveEnd('character', pos);
        range.moveStart('character', pos);
        range.select();
    }
}

function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
    var angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;

    return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
    };
}

function updateArc(radius, startAngle, endAngle) {

    const start = polarToCartesian(220, 220, radius, endAngle);
    const end = polarToCartesian(220, 220, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    const d = [
        "M", start.x, start.y,
        "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(" ");
    document.getElementById("leftTime").setAttribute("d", d);
    document.getElementById("timeSelector").setAttribute("cx", start.x);
    document.getElementById("timeSelector").setAttribute("cy", start.y);
    return d;
}

function formatTime(sec) {
    const h = ("0" + Math.floor(sec / 3600)).slice(-2);
    const m = ("0" + Math.floor(sec / 60) % 60).slice(-2);
    const s = ("0" + sec % 60).slice(-2);
    return h + ":" + m + ":" + s;
}

setInterval(function () {
    const r = getVal('r').value;
    updateArc(150, 0, r * 360);
    if (r >= 1) {
        updateArc(150, 0, 359.99);
    }
    if (r) {
        document.getElementById('clockWorkForm').style.display = '';
        document.getElementById('clockTimeForm').style.display = 'none';
        if (getVal('isPaused').value) {
            if (isMouseOver) document.getElementById('clockTime').innerText = "클릭해서\n계속";
            else document.getElementById('clockTime').innerText = "일시정지됨\n" + formatTime(Math.round(r * getVal('setTime').value));
        } else {
            if (isMouseOver) document.getElementById('clockTime').innerText = "클릭해서\n일시정지";
            else document.getElementById('clockTime').innerText = formatTime(Math.round(r * getVal('setTime').value));
        }
    } else {
        document.getElementById('clockWorkForm').style.display = 'none';
        document.getElementById('clockTimeForm').style.display = '';
    }
}, 1);

function startTimer() {
    const str = document.getElementById('clockTimeInput').value.replace(/\D+/g, '');
    let time = 0;
    time += parseInt(str.substr(0, 2)) * 3600;
    time += parseInt(str.substr(2, 2)) * 60;
    time += parseInt(str.substr(4, 2));
    getVal('setTime').value = time;
    getVal('isPaused').value = false;
    ipcRenderer.send('startTimer', 'Timer');
}

function cancelTimer() {
    ipcRenderer.send('stopTimer', 'Timer');
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('clockTimeInput').value = "00:00:00";
    document.getElementById('clockTimeInput').addEventListener('input', () => {
        const rawStr = document.getElementById('clockTimeInput').value;
        const str = rawStr.replace(/\D+/g, '');
        let resStr;
        let pos = getCaretPosition(document.getElementById('clockTimeInput'));
        let numPos = 0;
        for (i = 0; i < pos; i++) {
            if (/^\d+$/.test(rawStr[i])) numPos++;
        }
        if (str.length > 6) {
            resStr = str.substr(0, numPos - (str.length - 6) + 1) + str.substr(numPos + 1);
            if (numPos % 2 === 0 && pos > 0) pos++;
        } else if (str.length < 6) {
            resStr = str.substr(0, numPos) + '0'.repeat(6 - str.length) + str.substr(numPos);
            if (numPos % 2 === 0 && pos > 0) pos--;
        } else resStr = str;
        resStr = resStr.substr(0, 6);
        resStr = resStr.substr(0, 2) + ':' + resStr.substr(2, 2) + ':' + resStr.substr(4, 2);
        document.getElementById('clockTimeInput').value = resStr;
        setCaretPosition(document.getElementById('clockTimeInput'), pos);
    });
});

function chgTime(time) {
    ipcRenderer.send('changeTime', time);
}