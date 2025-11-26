WebFramework25

🔹 개요

WebFramework25는 “국가대표선수촌 예약관리시스템”을 구현한 웹 애플리케이션입니다. 주사용 기술 스택은 React + TypeScript + Vite 로, 프론트엔드 중심 프로젝트이며, 예약 관리, 인증, DB 연동 등을 포함한 시스템을 목표로 합니다. 

📂 폴더 구조
```
/public         — 정적 파일 (index.html 등)  
/src            — 주요 React + TypeScript 소스 코드  
/supabase/functions/server — 백엔드 / 서버리스 함수 (예약/인증/관리 로직)  
기타 설정 파일들 (tsconfig, eslint, tailwind, vite 등)
``` 

## 🛠️ 사용 기술  

- React + TypeScript + Vite 3  
- Tailwind CSS (스타일링) 4  
- ESLint + 타입 체크 설정 (엄격한 타입스크립트 + 코드 품질 유지) 5  
- (백엔드) Supabase 기반 serverless 함수 — 예약/인증/관리 기능 구현. 

## ✅ 주요 기능  

- 사용자 인증 및 권한 관리  
- 선수촌 예약 신청 / 조회 / 관리  
- 관리자를 위한 예약 현황 관리 및 승인/거절 처리  
- 프론트엔드 + 백엔드 통합: UI ↔ 데이터베이스 ↔ 인증 흐름 완성  

## 📄 커밋 히스토리 기반 주요 변경 내역  

예:  
- “국가대표선수촌 예약관리시스템” 프로젝트 초기 셋업 — React + Vite 템플릿 적용  
- ESLint / TypeScript 엄격 설정 추가 (코드 품질 향상)  
- Supabase 함수 추가: 예약 신청, 관리, 인증 기능 구현  
- front + back 연동: UI에서 예약 신청 → 서버리스 함수로 처리 → DB 반영 흐름 완성  

(커밋 메시지들이 `guidelines`, configuration 세팅, 구조 변경, 기능 추가 등을 반영하고 있음) 

## 🚀 시작하기  

1. 레포지토리 클론  
   ```bash
   git clone https://github.com/dohb128/WebFramework25.git ```

2. dependencies 설치 & 개발 서버 실행
```
cd WebFramework25  
npm install  
npm run dev```