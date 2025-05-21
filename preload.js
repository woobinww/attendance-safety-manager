// preload.js
const { contextBridge, ipcRenderer } = require('electron');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// 생성할 파일 경로
const filesToEnsure = [
  {
    path: path.join(__dirname, 'data/employees.csv'),
    header: "이름,부서,주민등록번호,직종,면허번호,입사일,퇴사일,배치전검사,변경신고,TLD신청"
  },
  {
    path: path.join(__dirname, 'data/attendance.csv'),
    header: "date,name,ot,nightOt,holidayOt,flexOt,off,note"
  }
];

// 초기 실행 시 디렉토리 확인 및 생성 
const dirs = ['data', 'output'];
dirs.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath);
    console.log(`📁 '${dir}' 폴더를 자동 생성했습니다.`);
  }
});

// 파일 생성
filesToEnsure.forEach(file => {
  if (!fs.existsSync(file.path)) {
    fs.writeFileSync(file.path, file.header + "\n", 'utf-8');
    console.log(`📄 파일 생성됨: ${path.basename(file.path)}`);
  }
});





// exposeInMainWorld 이하에 API 정의
contextBridge.exposeInMainWorld('api', {
  readCSV: () => {
    const csvPath = path.join(__dirname, 'data/employees.csv');
    return fs.readFileSync(csvPath, 'utf-8');
  },
  getPath: (type) => {
    const base = __dirname;
    if (type == 'csv') return path.join(base, 'data/employees.csv');
    if (type == 'output') return path.join(base, 'output');
    if (type == 'regiTemplate') return path.join(base, 'templates', '방사선관계종사자신고서_template.hwp');
    if (type == 'testTemplate') return path.join(base, 'templates', '방사선관계종사자건강진단표_template.hwp');
    if (type == 'tldTemplate') return path.join(base, 'templates', 'TLD종사자신상변동사항신청서_template.hwp');
  },
  saveCSV: (content) => {
    const csvPath = path.join(__dirname, 'data/employees.csv');
    fs.writeFileSync(csvPath, content, 'utf-8');
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
    const subprocess = spawn(path.join(__dirname, 'python_dist', exeName), args);
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
    const csvPath = path.join(__dirname, 'data/attendance.csv');
    if (!fs.existsSync(csvPath)) return ''; // 파일 없으면 빈 문자열
    return fs.readFileSync(csvPath, 'utf-8');
  },
  saveAttendanceCSV: (content) => {
    const csvPath = path.join(__dirname, 'data/attendance.csv');
    fs.writeFileSync(csvPath, content, 'utf-8');
  },
  getEmployeeNames: () => {
    const csvPath = path.join(__dirname, 'data/employees.csv');
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
    const exeName = path.join(__dirname, 'python_dist', 'attendanceToExcel.exe');
    const csvPath = path.join(__dirname, 'data', 'attendance.csv');
    const templatePath = path.join(__dirname, 'templates/근무현황_부서명(2025)_template.xlsx');
    const outputDir = path.join(__dirname, 'output')

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
  }
});
