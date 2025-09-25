# KTAS 응급 구조 시스템 (히포KU라테스)

한국형 중증도 분류 체계(KTAS) 기반 응급 구조 시스템 - 태블릿 최적화 버전

## 프로젝트 개요

응급 구조 대원을 위한 KTAS 평가 시스템으로, 환자의 상태를 단계별로 평가하여 적절한 응급실을 안내하는 웹 애플리케이션입니다.

### 주요 기능
- **KTAS 평가**: 2,597개의 의료 데이터를 기반으로 5단계 중증도 분류
- **병원 추천**: KTAS 5급 환자에게 LLM 기반 적절한 병원 추천
- **실시간 지도**: Leaflet 지도에 병원 위치 표시
- **환자 기록**: Supabase를 통한 평가 기록 저장

## 시작하기

### 개발 서버 실행

```bash
npm run dev
```

http://localhost:3000 에서 애플리케이션 확인

### 빌드 및 배포

```bash
npm run build
npm start
```

## LLM 시스템 설정 (KTAS 5급 병원 추천)

### 1. LLM 서버 실행

```bash
cd E:\0KoreaUniversity\DAB\llm
python medical_rag_api.py
```

서버가 http://localhost:8000 에서 실행됩니다.

### 2. ngrok 터널 설정

```bash
ngrok http 8000
```

ngrok이 제공하는 공개 URL (예: https://abc123.ngrok-free.app)을 복사합니다.

### 3. 애플리케이션 설정 업데이트

`src/utils/llmService.js` 파일을 열어 PRIMARY_URL을 업데이트:

```javascript
// ngrok URL로 변경 (마지막 슬래시 제거 필수)
const PRIMARY_URL = 'https://abc123.ngrok-free.app';  // 실제 ngrok URL로 변경
```

### 4. 배포 후 테스트

1. Vercel에 배포 후
2. Profile 페이지에서 "LLM 배포 테스트" 버튼으로 연결 확인
3. KTAS 5급 환자 평가 시 자동으로 병원 추천 실행

## 기술 스택

- **Frontend**: Next.js 15, React 18
- **Database**: Supabase (PostgreSQL)
- **Maps**: Leaflet, OpenStreetMap
- **LLM**: FastAPI + Gemma3:1b + ChromaDB
- **Hospital API**: 국립중앙의료원 Open API
- **Deployment**: Vercel + ngrok

## 환경 변수

`.env.local` 파일에 다음 변수 설정:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 프로젝트 구조

```
app/
├── src/
│   ├── app/          # Next.js 페이지
│   ├── utils/        # 유틸리티 함수
│   │   ├── llmService.js      # LLM API 통신
│   │   ├── hospitalApi.js     # 병원 API 통합
│   │   └── ktasDataSupabase.js # Supabase 데이터
│   └── components/   # React 컴포넌트
└── llm/             # LLM 서버 (Python)
    └── medical_rag_api.py
```

## 개발팀

**히포KU라테스** - 고려대학교 DAB 프로젝트
