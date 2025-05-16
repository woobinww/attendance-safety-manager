
# 근무 및 방사선안전관리 프로그램

이 프로젝트는 영상의학과 업무를 위한 **근무 관리**와 **방사선 관계 종사자 관리** 기능을 통합한 데스크탑 Electron 애플리케이션입니다.  
월간 근태 입력, 시각적 달력, Excel 자동 출력, 종사자 신고서 자동 작성 등 다양한 기능을 제공합니다.

---

## 📦 주요 기능

### 🔹 근태 관리
- 근무 일자별 OT, 야간OT, 휴일OT, 탄력OT, 연차/반차, 비고 입력
- 달력 기반 시각화 및 일자별 기록 요약
- 월별 Excel 템플릿 자동 생성
- 토/일요일 배경 색상 구분 및 선택 강조
- 직원별 기록 필터링, 자동 포커싱 입력 흐름

### 🔹 방사선 종사자 관리
- 직원 목록 관리 (입사일, 퇴사일, 면허번호 등)
- 종사자신고서, 건강진단표, TLD 신청서 자동 생성 (Python + HWP 자동화)
- CSV 저장 및 수정 기능
- 필터링된 상태에서도 정확한 인덱스 유지

---

## 🔧 설치 방법

1. **필수 조건**
   - Node.js (v18 이상 권장)
   - Python (v3.9 이상)
   - Git
   - `pip install pandas openpyxl pyhwp` 등 사전 설치 필요 모듈

2. **설치**
  ```bash
  git clone https://github.com/woobinww/attendance-safety-manager.git
  cd attendance-safety-manager
  npm install
  ```
3. 실행
  ```bash
  npm start
  ```

---

## 📁 디렉토리 구조
```bash
attendance-safety-manager/
├── data/                   # 근태 및 종사자 CSV 저장 경로 (gitignore 대상)
├── output/                 # HWP/Excel 출력물 경로 (gitignore 대상)
├── templates/              # 템플릿(HWP, Excel) 파일 위치
├── python/                 # Python 자동화 스크립트
├── src/
│   ├── attendance.js       # 근태 UI/기능 스크립트
│   ├── safety.js           # 종사자 UI/기능 스크립트
├── index.html              # 메인 HTML
├── attendance.html         # 근태 기록 UI
├── safety.html             # 방사선 종사자 UI
├── preload.js              # Electron preload 연결
└── main.js                 # Electron 엔트리포인트
```

---

## 📌 라이선스

This project is licensed under the [MIT License](./LICENSE).  
You are free to use, modify, and distribute this software with attribution.

---

### 📃 MIT 라이선스 요약 (비공식 번역)

- 본 소프트웨어는 누구나 **자유롭게 사용, 복사, 수정, 병합, 게시, 배포**할 수 있습니다.
- 다만, **저작권 고지 및 라이선스 전문은 반드시 포함**해야 합니다.
- 이 소프트웨어는 **아무런 보증 없이 제공**됩니다. 사용에 따른 책임은 사용자에게 있습니다.


---

## 🙋‍♂️ 제작자

이우빈 - 감탄정형외과의원 영상의학과 팀장  
문의: [ss96232@naver.com](mailto:ss96232@naver.com)
