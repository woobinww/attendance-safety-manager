// preload.js
const { contextBridge, ipcRenderer, shell } = require('electron');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const log = require('electron-log');

// CLI 인자에서 userDataPath 추출
let userDataPath = '';
process.argv.forEach(arg => {
  if (arg.startsWith('--userDataPath=')) {
    userDataPath = arg.replace('--userDataPath=', '');
  }
});

const dataDir = path.join(userDataPath, 'data');
const outputDir = path.join(userDataPath, 'output');

// 오류 전달 코드
contextBridge.exposeInMainWorld('logger', {
  error: (msg) => log.error(`❗ 렌더러 오류 at ${new Date().toISOString()} ->`, msg)
});

// 개발/배포 판별 (process.resourcesPath가 'node_modules' 포함 여부로 판단)
const isDev = process.resourcesPath.includes('node_modules');

const pythonDistPath = isDev 
  ? path.join(__dirname, 'python_dist') 
  : path.join(process.resourcesPath, 'python_dist');
const templateDir = isDev 
  ? path.join(__dirname, 'templates')
  : path.join(process.resourcesPath, 'templates');


// exposeInMainWorld 이하에 API 정의
contextBridge.exposeInMainWorld('api', {
  readCSV: () => {
    const file = path.join(dataDir, 'employees.csv');
    return fs.existsSync(file) ? fs.readFileSync(file, 'utf-8') : '';
  },
  getPath: (type) => {
    switch(type) {
      case 'csv' : return path.join(dataDir, 'employees.csv');
      case 'output' : return outputDir;
      case 'regiTemplate' : return path.join(templateDir, 'rad_regi_template.hwp');
      case 'testTemplate' : return path.join(templateDir, 'rad_test_template.hwp');
      case 'tldTemplate' : return path.join(templateDir, 'TLD_template.hwp');
      default: throw new Error(`Unknown path type: ${type}`);
    }
  },
  saveCSV: (content) => {
    fs.writeFileSync(path.join(dataDir, 'employees.csv'), content, 'utf-8');
  },
  // .py 파이썬 코드 실행
  runPythonScript: (scriptName, args, callback) => {
    const py = spawn('python', [path.join(__dirname, 'python', scriptName), ...args]);
    let output = '';

    py.stdout.on('data', (data) => {
      output += data.toString();
    });

    py.stderr.on('data', (data) => {
      console.error("Python stderr:", data.toString());
    });

    py.on('close', (code) => {
      if (code !== 0) return callback(new Error(`Python 종료 코드 ${code}`));
      callback(null, output.trim());
    });
  },
  runPythonExecutable: (exeName, args, callback) => {
    const exePath = path.join(pythonDistPath, exeName);
    const subprocess = spawn(exePath, args);
    let output = '';

    subprocess.stdout.on('data', (data) => {
      output += data.toString();
    });

    subprocess.stderr.on('data', (data) => {
      console.err("Python stderr:", data.toString());
    });

    subprocess.on('close', (code) => {
      if (code !== 0) return callback(new Error(`Python 종료 코드 ${code}`));
      callback(null, output.trim());
    });
  },
  readAttendanceCSV: () => {
    const file = path.join(dataDir, 'attendance.csv');
    if (!fs.existsSync(file)) return ''; // 파일 없으면 빈 문자열
    return fs.readFileSync(file, 'utf-8');
  },
  saveAttendanceCSV: (content) => {
    const file = path.join(dataDir, 'attendance.csv');
    fs.writeFileSync(file, content, 'utf-8');
  },
  getEmployeeNames: () => {
    const csvPath = path.join(dataDir, 'employees.csv');
    const content = fs.readFileSync(csvPath, 'utf-8');
    const lines = content.trim().split('\n');
    if (lines.length < 2) return []; // 데이터 없음 처리

    const headers = lines[0].split(',').map(h => h.trim());
    const idxName = headers.indexOf('이름');
    const idxDept = headers.indexOf('부서');
    const idxLeave = headers.indexOf('퇴사일');

    if (idxName === -1 || idxDept === -1) return [];

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1; // 1~12

    return lines
      .slice(1)
      .map(line => line.split(',').map(v => v.trim()))
      .filter(cols => {
        const dept = cols[idxDept];
        const leave = cols[idxLeave];
        if (dept !== '영상의학과') return false;
        if (!leave) return true; // 퇴사일 없으면 현직자
        const [y, m] = leave.split('-').map(Number);
        if (!y || !m) return true; // 이상한 형식은 포함

        // 퇴사일의 다음달 부터 제외
        return y > currentYear || (y === currentYear && m >= currentMonth);
      })
      .map(cols => cols[idxName]) // 이름만 추출
      .filter(name => name); // 빈 문자열 제거 
      // .sort(); // 이름순 정렬 
  },
  runAttendanceToExcel: (month) => {
    const exeName = path.join(pythonDistPath, 'attendanceToExcel.exe');
    const csvPath = path.join(dataDir, 'attendance.csv');
    const templatePath = path.join(templateDir, 'attendance(2025)_template.xlsx');

    const args = [csvPath, templatePath, outputDir, month]; // 예: '2025-05'

    const py = spawn(exeName, args);
    py.stdout.on('data', (data) => console.log('stdout:', data.toString()));
    py.stderr.on('data', (data) => console.error('stderr:', data.toString()));
    py.on('close', (code) => {
      if (code === 0) {
        console.log("엑셀 생성 완료");
      } else {
        console.error("오류 발생, 종료코드:", code);
      }
    });
  },
  openFolder: (folderPath) => {
    shell.openPath(folderPath);
  }
});
