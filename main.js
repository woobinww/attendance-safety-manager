const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { runPythonExecutable } = require('./src/python_bridge.js');
const log = require('electron-log');

let mainWindow, employeeWindow;

process.on('uncaughtException', (error) =>{
  log.error(`❗ UncaughtException at ${new Date().toISOString()}\n`, error);
});
if (!app.isPackaged) {
  log.transports.console.level = 'info'; // 개발 중일 때 콘솔에 출력 
} else {
  log.transports.console.level = false; //  배포 버전 콘솔 로그 비활성화
}
log.transports.file.level = 'error'; // error만 파일 기록
log.transports.file.maxSize = 5 * 1024 * 1024; // 5MB 까지로 용량 제한

function initializeUserData() {
  const userDataDir = app.getPath('userData');
  const dataDir = path.join(userDataDir, 'data');
  const outputDir = path.join(userDataDir, 'output');

  const dataFilePath_att = path.join(userDataDir, 'attendance.csv');
  const dataFilePath_emp = path.join(userDataDir, 'employees.csv');

  const defaultDataPath_att = path.join(__dirname, 'data', 'attendance.csv');
  const defaultDataPath_emp = path.join(__dirname, 'data', 'employees.csv');

  // 데이터 폴더 생성
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(datadir, { recursive: true });
  }


  // 최초 실행 시에만 복사
  if (!fs.existsSync(dataFilePath_att)) {
    try {
      fs.copyFileSync(defaultDataPath_att, dataFilePath_att);
      console.log('기본 attendance.csv가 초기화 되었습니다.');
    } catch (err) {
      console.error('초기 데이터 복사 실패:', err);
    }
  }
  if (!fs.existsSync(dataFilePath_emp)) {
    try {
      fs.copyFileSync(defaultDataPath_emp, dataFilePath_emp);
      console.log('기본 employees.csv가 초기화 되었습니다.');
    } catch (err) {
      console.error('초기 데이터 복사 실패:', err);
    }
  }
  
  // output 폴더 생성 
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log('output 폴더 생성됨');
  }
}





app.whenReady().then(() => {
  initializeUserData(); // 이위치가 안전 
  // 근태기록 메인 창
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      additionalArguments: [`--userDataPath=${app.getPath('userData')}`],
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    },
    title: '영상의학과 근태관리'
  });
  mainWindow.loadFile('views/attendance.html');
});


ipcMain.on('run-python', (event, { scriptName, args, replyChannel }) => {
  const py = spawn('python', [path.join(process.resourcesPath, scriptName), ...args]);
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
