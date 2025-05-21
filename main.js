const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { runPythonExecutable } = require('./src/python_bridge.js');

let mainWindow, employeeWindow;

app.whenReady().then(() => {
  // 근태기록 메인 창
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    },
    title: '영상의학과 근태관리'
  });
  mainWindow.loadFile('views/attendance.html');
});


ipcMain.on('run-python', (event, { scriptName, args, replyChannel }) => {
  const py = spawn('python', [path.join(__dirname, scriptName), ...args]);
  let ouput = '';

  py.stdout.on('data', (data) => {
    output += data.toString();
  });

  py.stderr.on('data', (data) => {
    console.error("stderr:", data.toString());
  });

  py.on('close', (code) => {
    event.sender.send(replyChannel, output.trim()); // 호출된 채널로 응답
  });
});
