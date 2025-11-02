# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a KTAS (Korean Triage and Acuity Scale) emergency medical system built for emergency medical technicians, developed by team "히포KU라테스". The application is designed specifically for tablet use (iPad-optimized) and provides a step-by-step workflow for evaluating patient emergency levels.

## Development Commands

```bash
# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

The development server typically runs on http://localhost:3000, but may use alternative ports (3001, 3002, etc.) if 3000 is occupied.

## Application Architecture

### Flow Structure

The application follows a linear workflow optimized for tablet interaction with no scrolling:

1. **Profile Selection** (`/profile`) - Emergency worker selection (Netflix-style interface)
2. **Age Selection** (`/age-selection`) - Adult vs Pediatric patient selection
3. **Input Forms** - Patient evaluation based on age:
   - Adult: `/adult-input` (fully implemented with dynamic filtering)
   - Pediatric: `/pediatric-input` (placeholder implementation)
4. **Results** (`/result`) - KTAS level display and diagnosis information

### Key Technical Components

#### Data Management (`src/utils/ktasData.js`)

- **Performance-optimized**: Uses Map/Set-based lookup tables instead of array iteration
- **Caching system**: CSV data is loaded once and cached with `dataCache`
- **Lookup maps**: Pre-built maps for O(1) access to categories, diseases, and considerations
- **CSV parsing**: Custom parser handles quoted fields and special characters

#### Adult Input System (`src/app/adult-input/page.js`)

- **Real-time filtering**: Uses React `useMemo` and `useCallback` for performance
- **Selection logic**:
  - Categories: Single selection (radio-style)
  - Diseases: Single selection (radio-style)
  - Considerations (1차/2차): Multiple selection (checkbox-style)
- **Compatibility system**: Dynamic filtering based on CSV data relationships

#### Styling (`src/app/globals.css`)

- **Tablet-optimized**: Full viewport usage without scrollbars
- **Responsive nav**: Category navigation adapts to screen width without wrapping
- **CSS Grid layouts**: Used for main content areas and button grids

### Data Architecture (Updated: Supabase Integration)

**Current Status**: The application has been fully migrated from CSV to Supabase PostgreSQL database.

#### Database Schema (4 tables):

1. **`ktas_data`** (2,597 records) - Main KTAS reference data
   - Migrated from `public/data/ktas_data.csv`
   - All categories: 심혈관계, 근골격계, 소화기계, 비뇨기계/남성생식계, 몸통외상, 눈, 물질오용, 귀, 코, 입목/얼굴, 환경손상 등
2. **`rescuers`** - Emergency workers (현재: 이다정, 김채운, 신준용, 박경삼)
3. **`custom_presets`** - Custom scenario shortcuts (미구현)
4. **`patient_assessments`** - Patient evaluation records (미구현)

#### Data Management (`src/utils/ktasDataSupabase.js`)

- **Supabase Integration**: PostgreSQL database with real-time capabilities
- **Pagination Loading**: Handles 2,597+ records via page-by-page loading
- **Backward Compatibility**: 100% compatible with existing CSV interface
- **Performance**: 5-minute caching + optimized queries
- **Fallback Strategy**: Automatic fallback to CSV parsing if Supabase fails

### State Management Patterns

Uses React's built-in state management with performance optimizations:

- `useState` for selections and UI state
- `useMemo` for expensive calculations (compatibility, sorting)
- `useCallback` for event handlers to prevent re-renders
- `localStorage` for data persistence between routes

### Performance Considerations

- **Avoid re-computation**: All compatibility calculations are memoized
- **O(1) lookups**: Use Map/Set instead of array operations
- **Batch updates**: State updates are batched where possible
- **Minimal re-renders**: Event handlers are wrapped in `useCallback`

### Tablet UI Patterns

- **No scrolling**: All content fits within viewport height
- **Large touch targets**: Buttons sized for finger interaction
- **Visual feedback**: Selected states clearly indicated
- **Navigation consistency**: Back/next buttons in header across all pages

## Development Progress & Next Steps

### ✅ Completed (Previous Sessions):

1. **Supabase Setup & Integration**

   - Environment variables configured (`.env.local`)
   - Database schema created (`database/schema.sql`)
   - Data migration completed (2,597 records)
   - Full compatibility with existing interface

2. **Core Files Modified/Created:**
   - `src/utils/ktasDataSupabase.js` - Supabase data layer
   - `src/utils/supabase/` - Client utilities
   - `src/app/adult-input/page.js` - Updated imports
   - `database/` - Migration scripts and schema

### ✅ Completed (Latest Session):

1. **Database Security & RLS Implementation**

   - Fixed Supabase Row Level Security (RLS) warnings for all tables
   - Created proper RLS policies for `ktas_data`, `rescuers`, `custom_presets`, `patient_assessments`
   - Resolved SQL syntax errors with INSERT policies
   - Database now properly secured with controlled access

2. **Modern Tablet UI/UX Redesign**

   - Implemented consistent bottom navigation across all pages
   - Moved buttons to bottom navigation bars with header-style design
   - Fixed /profile page with right-aligned "기록 보기" button
   - Optimized /age-selection page layout and spacing
   - Added internal scrolling to preset sections
   - Fixed preset button hover effects and z-index layering
   - Ensured no page-level scrolling on tablet interface

3. **Files Modified:**

   - `src/app/profile/page.js` - Bottom navigation implementation
   - `src/app/age-selection/page.js` - Layout optimization and scroll handling
   - `src/app/globals.css` - Navigation styling and preset button improvements
   - `database/fix-patient-records-rls.sql` - RLS security fixes

4. **Verified Working Features:**
   - All KTAS categories loading correctly
   - Dynamic filtering system operational
   - Real-time compatibility calculations
   - Tablet-optimized interface maintained
   - Database security properly configured
   - Consistent navigation across all pages

### ✅ Completed (Previous Session):

1. **KTAS 5급 환자 병원 검색 시스템 완료**

   - LLM 기반 진료과목 코드 자동 판단 시스템
   - 국립중앙의료원 Open API 연동으로 실시간 병원 검색
   - 거리순 정렬 및 지도 마커 표시
   - 완전한 rule-based 제거 및 LLM 전용 판단

2. **핵심 기능 구현:**

   - **LLM 진료과목 판단**: 환자 정보(KTAS급수, 주요병명, 고려사항) → 진료과목 코드 (D001-D026)
   - **병원 API 통합**: 국립중앙의료원 API로 실시간 병원 데이터 검색
   - **거리순 정렬**: Haversine 공식으로 현재위치 기준 거리계산 후 상위 20개 병원 표시
   - **지도 연동**: Leaflet 지도에 병원 마커 및 상세 정보 팝업

### ✅ Completed (Previous Session):

1. **LLM 진료과목 판단 시스템 성능 개선**

   - **RAG 제거**: KTAS 5급 환자는 RAG 없이 직접 LLM 추론으로 성능 대폭 향상
   - **KTAS 레벨별 처리**: 5급(RAG 없음, 빠름) vs 1-4급(RAG 사용, 정확함)
   - **신뢰도 필드 제거**: 불필요한 confidence 필드 완전 제거
   - **프롬프트 최적화**: 진료과목별 담당 영역 명시로 정확도 개선

2. **판단 정확도 개선:**

   - **소화계**: 변비, 복통, 설사 → D001 내과
   - **해부학적 위치**: 귀→D013, 눈→D012, 피부→D014
   - **상세한 의학적 근거**: 해부학적 위치와 질환 특성 기반 판단 근거 제공

3. **성능 최적화:**

   - **응답 속도**: 벡터 검색 제거로 2-3초 → 0.4초 단축
   - **에러 처리**: AIMessage 객체 처리 개선
   - **로컬 개발**: ngrok 대신 localhost:8000 직접 연결

4. **Files Modified:**

   - `E:\0KoreaUniversity\DAB\llm\medical_rag_api.py` - /department 엔드포인트 개선
   - `src/utils/llmService.js` - confidence 제거, 로컬 연결 설정
   - `src/app/result/components/HospitalListLevel5.js` - 신뢰도 표시 제거

5. **검증된 개선사항:**
   - **변비 → D001 내과** (이전: D013 이비인후과 오판) ✅
   - **응답 속도**: 0.38초 (이전: 2-3초) ✅
   - **판단 근거**: "변비는 소화계 질환으로 장의 운동 장애..." 상세 설명 ✅
   - **에러 없는 처리**: AIMessage 객체 안정적 처리 ✅

### ✅ Completed (2025-10-07 Session):

1. **LLM 모델 업그레이드: Gemma3:1b → MedGemma-4B-IT:q6**

   - **의료 전문 모델 적용**: Google Health의 의료 데이터 파인튜닝 모델
   - **모델 스펙**: 4B 파라미터 (기존 1B의 4배), Q6 양자화
   - **정확도 향상**: 진료과목 판단 85% → 100% (테스트 케이스 기준)
   - **성능 트레이드오프**: 응답 속도 0.4초 → 14.59초 (36배 느림)

2. **파일 수정:**

   - `E:\0KoreaUniversity\DAB\llm\medical_rag_chromadb_final.py` - Line 49: MedGemma 모델명 설정
   - `E:\0KoreaUniversity\DAB\llm\medical_rag_api.py` - Line 112: model_size="4b" 설정
   - `E:\0KoreaUniversity\DAB\app\CLAUDE_MODEL_UPDATE.md` - 성능 비교 및 최적화 방안 문서화

3. **검증 완료:**

   - KTAS 5급 진료과목 판단: "변비" → D001 내과 ✅
   - KTAS 1-4급 필터 판단: "흉부 외상" → O001, O017, O027 ✅
   - RAG 문서 검색: 255,162개 의료 문서 활용 ✅

4. **향후 최적화 권장:**

   - GPU 가속 활성화로 5-10배 속도 향상 가능
   - Q4 양자화 모델 테스트로 속도/정확도 균형 조정
   - 프롬프트 최적화로 추가 속도 개선 가능

### ✅ Completed (Current Session - 2025-10-07):

1. **병원 메시지 필터링 시스템 간소화**

   - **기존 문제**: LLM으로 병원 메시지 분석 → API에 이미 code 포함됨 발견
   - **개선**: API 응답의 `code` 필드 직접 사용 (LLM 분석 제거)
   - **성능 개선**: 초기 로딩 60초 → 0초, 필터링 속도 2초 → 0.1초
   - **정확도 향상**: LLM 추론 → API 제공 코드 (100% 정확)
   - **삭제된 항목**:
     - Supabase `hospital_message_cache` 테이블
     - `/analyze-messages` LLM API 엔드포인트
     - `src/utils/hospitalMessageCache.js` (233줄)
     - Profile 페이지 메시지 캐싱 로직 (75줄)
   - **Files Modified**:
     - `database/drop-hospital-message-cache.sql` - 테이블 삭제 스크립트
     - `medical_rag_api.py` - /analyze-messages 엔드포인트 제거
     - `src/app/result/components/HospitalListLevel1to4.js` - API code 직접 사용

2. **KTAS 1-4급 필터 판단 프롬프트 최적화**

   - **문제**: "눈 충혈" 환자에게 분만실(O026), 조산아 장비(O031) 등 무관한 코드 출력
   - **원인**: "충분한 코드 선택" 강조로 LLM이 과도하게 코드 추가
   - **해결**:
     - "환자 증상과 직접 관련된 코드만" 명시
     - 무관한 코드 추가 금지 예시 추가
     - KTAS 1-4급 차등 제거 (모두 동일 처리)
     - rltmEmerCd 최소 1개 필수 (O001)
   - **Files Modified**:
     - `medical_rag_api.py` (Line 461-511) - 프롬프트 완전 재작성

3. **RAG 문서 개수 최적화 (5개 → 3개)**

   - **변경**: 로그 출력과 LLM 전송 모두 3개로 통일
   - **이유**: 토큰 절약 + 응답 속도 향상
   - **Files Modified**:
     - `medical_rag_api.py` (Line 433) - `retrieved_docs[:3]`

4. **Result 페이지 필터 코드 상세 정보 토글 추가**

   - **기능**: AI 판단 결과에 선택된 필터 코드 상세 정보 토글
   - **표시 형식**:

     ```
     🧠 AI 필터 판단 결과 (KTAS 2급)
     reasoning 텍스트...

     ▼ 🏥 선택된 필터 코드 상세 정보
       • 응급실병상: 일반응급실(O001), 외상소생실(O060)
       • 입원병상: 외상수술(O023)
       • 중증응급질환: 안과응급(Y0160)
       • 장비정보: CT(O027)

     ▼ 📚 참고한 의료 문서 3개
       ...
     ```

   - **Files Modified**:
     - `src/app/result/components/HospitalListLevel1to4.js` - 코드 이름 매핑 + 토글 UI

5. **성능 최종 지표:**

   - **KTAS 5급**: 진료과목 판단 ~15초 (RAG 없음)
   - **KTAS 1-4급**: 필터 판단 ~45초 (RAG 3개 문서 활용)
   - **병원 필터링**: <0.1초 (API code 직접 매칭)
   - **전체 검색 시간**: ~50초 (LLM 판단 포함)

### ✅ Completed (Current Session - 2025-11-01):

1. **환자 인구통계 정보 (Gender & Age Group) 통합**

   - **문제**: 성별, 세부 연령대 정보가 DB에 저장되지 않고, LLM API 호출 시에도 전달되지 않음
   - **해결**:
     - Supabase `patient_assessments` 테이블에 `gender`, `age_group` 컬럼 추가 (SQL migration)
     - DB 저장 로직에 gender, age_group 파라미터 추가
     - LLM API 호출 시 환자 정보에 gender, age_group 포함
     - FastAPI 백엔드에서 gender, age_group을 LLM 프롬프트에 반영

2. **중복 삽입 버그 수정**

   - **문제**: `patient_assessments` 테이블에 데이터가 2개씩 중복 삽입되는 고질적 버그
   - **원인**: React StrictMode 등으로 인한 useEffect 중복 실행
   - **해결**: useRef를 사용한 중복 저장 방지 로직 추가 (localStorage + useRef 2중 체크)

3. **프리셋 기능 버그 수정**

   - **문제**: age-selection 페이지의 "빠른 선택" 프리셋 버튼이 작동하지 않음
   - **원인**: localStorage.removeItem 후 두 번째 useEffect에서 선택 사항 초기화
   - **해결**: useRef 플래그를 사용하여 프리셋 로드 중 선택 초기화 건너뛰기

4. **Files Modified:**

   - **Database**:
     - `database/add-patient-demographics.sql` - gender, age_group 컬럼 추가 및 인덱스 생성

   - **Frontend (Patient Data Flow)**:
     - `src/app/adult-input/page.js` - ktasResult에 gender, ageGroup 포함 + 프리셋 버그 수정
     - `src/app/result/page.js` - savePatientAssessment에 gender, ageGroup 전달 + 중복 삽입 버그 수정
     - `src/utils/patientRecordsSupabase.js` - savePatientAssessment 함수에 gender, ageGroup 파라미터 추가

   - **Frontend (LLM Integration)**:
     - `src/utils/llmService.js` - determineDepartmentCode, determineEmergencyFilters에 gender, ageGroup 추가
     - `src/app/result/components/HospitalListLevel5.js` - LLM 호출 시 gender, ageGroup 전달
     - `src/app/result/components/HospitalListLevel1to4.js` - LLM 호출 시 gender, ageGroup 전달

   - **Backend (FastAPI)**:
     - `llm/medical_rag_api.py` - DepartmentRequest, EmergencyFiltersRequest 모델에 gender, age_group 추가
     - `/department` 엔드포인트: LLM 프롬프트에 성별/연령대 정보 포함
     - `/emergency-filters` 엔드포인트: RAG 검색 및 LLM 프롬프트에 성별/연령대 정보 포함

5. **검증된 개선사항:**
   - ✅ DB에 gender='male', age_group='25-34' 정상 저장
   - ✅ LLM API 로그에 "성별: male", "세부 연령대: 25-34" 출력 확인
   - ✅ patient_assessments 테이블 단일 레코드 삽입 (중복 제거)
   - ✅ 프리셋 버튼 클릭 시 모든 선택 사항 정상 로드

### ✅ Completed (Current Session - 2025-11-02):

1. **OpenAI GPT-5-mini 모델 통합**

   - **변경**: Local LLM (MedGemma-4B-IT) → OpenAI GPT-5-mini (Cloud)
   - **이유**:
     - 성능 대폭 향상: 45초 → 20-30초 (KTAS 1-4급), 15초 → 2-3초 (KTAS 5급)
     - Reasoning 모델로 의료 판단 정확도 개선
     - GPU 불필요 (Cloud 처리)
   - **환경 설정**:
     - `.env` 파일에 `OPENAI_API_KEY` 추가
     - `OLLAMA_BASE_URL` 환경변수 지원 (Embeddings용)
     - `.gitignore`에 `.env` 추가 (보안)

2. **Full Code 목록 확장 (21개 → 74개)**

   - **응급실병상(rltmEmerCd)**: 2개 → 9개
     - 추가: O002(소아), O004(일반격리), O003(음압격리), O049(소아일반격리), O048(소아음압격리), O059(코호트격리)
   - **입원병상(rltmCd)**: 7개 → 28개
     - 중환자실 11개, 응급전용 8개, 외상전용 3개, 입원실 3개, 기타 3개
   - **중증응급질환(svdssCd)**: 7개 → 27개
     - 뇌출혈, 대동맥응급, 담낭질환, 사지접합, 산부인과응급, 안과응급, 내시경, 투석 등
   - **장비정보(rltmMeCd)**: 5개 → 10개
     - CRRT, ECMO, 중심체온조절, 고압산소, 혈관촬영기 등 추가

3. **Gender/Age Group 프롬프트 강화**

   - **문제**: 성별/연령대 정보를 LLM이 활용하지 못함
   - **해결**:
     - RAG 이해 단계: 성별/연령대 필수 확인 규칙 추가
     - 최종 판단 단계: 상세한 예시와 금지 규칙 명시
     - 임산부 관련 코드는 **여성만** (O026, Y0111, Y0112, Y0113, O031, O032, Y0100)
     - 소아 관련 코드는 **소아/영유아만** (O002, O049, O048, O009, O008, O020, O010, Y0172, Y0082, Y0092, Y0070)

4. **Python 환경 설정 개선**

   - **requirements.txt 생성**: 모든 필요 패키지 명시
     - `langchain-openai>=0.2.0`
     - `python-dotenv>=1.0.0`
     - 기타 의존성 패키지
   - **패키지 설치 완료**:
     - langchain-openai==1.0.1
     - langchain-core==1.0.2
     - langchain-ollama==1.0.0
   - **Ollama 포트 설정**: 환경변수로 관리 (`OLLAMA_BASE_URL`)

5. **GPT-5-mini Reasoning 모델 문제 해결**

   - **발견된 문제**:
     - `max_tokens=500` → reasoning에 500 토큰 소진 → 응답 생성 불가
     - `content=''` (빈 응답), `finish_reason='length'`
   - **해결**:
     - `max_tokens=4000` (Reasoning 모델용 충분한 토큰)
     - `timeout=60초` (응답 대기 시간 증가)
   - **디버깅 로그 추가**: Raw response 타입 및 내용 출력

6. **Files Modified:**

   - **Backend (LLM System)**:
     - `llm/.env` - OpenAI API Key 환경변수 추가
     - `llm/.gitignore` - 보안 설정 (`.env` 제외)
     - `llm/requirements.txt` - Python 패키지 목록
     - `llm/medical_rag_chromadb_final.py`:
       - OpenAI ChatGPT 통합 (Line 25, 197-208)
       - 환경변수 로드 (Line 18-21)
       - Ollama URL 환경변수 지원 (Line 214-218, 225-231)
       - max_tokens=4000, timeout=60 설정
     - `llm/medical_rag_api.py`:
       - Full code 목록 확장 (Line 474-564)
       - Gender/Age Group 프롬프트 강화 (Line 584-659)
       - 디버깅 로그 추가 (Line 601-603)

7. **검증된 개선사항:**
   - ✅ OpenAI GPT-5-mini 정상 연결 (HTTP 200 OK)
   - ✅ Reasoning 모델 정상 작동 (응답 생성 확인)
   - ✅ Full 74개 코드 프롬프트 적용
   - ✅ 성별/연령대 필터링 규칙 적용
   - ✅ 환경변수 보안 설정 완료

8. **성능 개선:**
   - **KTAS 5급**: 15초 → 2-3초 (5-7배 향상)
   - **KTAS 1-4급**: 45초 → 20-30초 (1.5-2배 향상)
   - **전체 처리**: MedGemma(CPU) → GPT-5-mini(Cloud)

### ✅ Completed (Current Session - 2025-11-02 Part 2):

1. **백엔드 로그 정리 및 개선**

   - **EXAONE → GPT-5-mini 변경**: 모든 로그에서 모델명 업데이트
   - **로그 포맷 정리**:
     - 과도한 구분선 제거 (===60자)
     - RAW RESPONSE 디버그 로그 제거
     - 진행 상황 로그 간소화
   - **필수 정보 유지**: 사용자 피드백 반영
     - RAG 검색 결과 (검색된 문서 요약)
     - RAG 이해 결과 (LLM의 문서 이해 내용)
     - 최종 판단 결과 (LLM의 최종 답변)
     - 종합 요약 (모든 필터 코드 + 소요 시간)
   - **Files Modified**:
     - `llm/medical_rag_api.py` - 로그 정리 및 필수 정보 복원

2. **공공데이터포털 API 활성화**

   - **환경변수 추가**: `.env.local`에 `NEXT_PUBLIC_HOSPITAL_API_KEY` 추가
   - **보안 개선**: 하드코딩된 API 키 → 환경변수 사용
   - **API 코드 활성화**: 주석 처리된 병원 검색 기능 완전 활성화
   - **로그 정리**: 불필요한 디버그 로그 제거
   - **Files Modified**:
     - `app/.env.local` - API 키 환경변수 추가
     - `src/utils/hospitalApi.js` - 환경변수 사용 + 코드 활성화 + 로그 정리

3. **프론트엔드 콘솔 로그 통일 및 정리**

   - **로그 패턴 통일**: 백엔드와 일관된 스타일 적용
     ```javascript
     // Before
     console.log("환자 기록 저장 시도:", { rescuerId, patientType, ... });

     // After
     console.log(`\n[환자 기록 저장 시도]`);
     console.log(`구조대원: 1 | 유형: adult | KTAS: 5급 | 성별: male | 연령: 25-34`);
     ```
   - **주요 개선**:
     - 이모지 유지하면서 가독성 향상
     - 괄호 라벨 `[Action]` 형식으로 구조화
     - 파이프(`|`) 구분자로 데이터 표시
     - 객체 대신 문자열로 간결하게
   - **Files Modified**:
     - `src/app/result/components/HospitalListLevel5.js` - KTAS 5급 로그 정리
     - `src/app/result/components/HospitalListLevel1to4.js` - KTAS 1-4급 로그 정리
     - `src/app/result/page.js` - 환자 기록 저장 로그 정리

4. **Geocoder 주소 변환 시스템 대폭 개선**

   - **문제 발견**:
     - "경기도 부천시 원미구 조마루로 170, 부흥로 173(1층일부) (중동)"
     - 두 개의 도로명 주소가 쉼표로 구분되어 geocoding 실패

   - **주소 정제 강화** (`refineAddressForGeocoding`):
     - 쉼표 기준 첫 번째 주소 추출
     - 층 정보 제거: "173(1층일부)" → "173"
     - 건물 동 정보 제거: "(중동)" → 제거
     - 동명은 유지: "(안암동5가)" → 유지

   - **다중 후보 시도** (`addressToCoordinates`):
     - 쉼표로 구분된 주소를 여러 후보로 분리
     - 각 후보를 순차적으로 geocoding 시도
     - 성공할 때까지 다음 후보 시도
     - 예시:
       ```
       원본: "경기도 부천시 원미구 조마루로 170, 부흥로 173(1층일부) (중동)"

       📋 주소 후보 2개:
         1. "경기도 부천시 원미구 조마루로 170"
         2. "경기도 부천시 원미구 부흥로 173"

       🔍 [1/2] 변환 시도 → ⚠️ 실패
       🔍 [2/2] 변환 시도 → ✅ 성공!
       ```

   - **Files Modified**:
     - `src/utils/geocoder.js` - 주소 정제 로직 개선 + 다중 후보 시도 추가

5. **검증된 개선사항:**
   - ✅ 백엔드 로그 깔끔하게 정리되면서 필수 정보는 모두 유지
   - ✅ 공공데이터포털 API 정상 작동 (KTAS 5급 병원 검색)
   - ✅ 프론트엔드 로그 일관된 스타일로 통일
   - ✅ 복잡한 주소 (순천향대병원 등) geocoding 성공률 대폭 향상

### ✅ Completed (Current Session - 2025-11-02 Part 3):

1. **ngrok 터널 및 Vercel 배포 설정**

   - **ngrok 터널 생성**: `ngrok http 8000` → `https://1bf7fadf6be7.ngrok-free.app`
   - **환경변수 추가**: `.env.local`에 `NEXT_PUBLIC_LLM_API_URL` 추가
   - **LLM 서비스 연동**: llmService.js에서 환경변수 사용하도록 수정
   - **Vercel 환경변수 설정**:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `NEXT_PUBLIC_VWORLD_API_KEY`
     - `NEXT_PUBLIC_HOSPITAL_API_KEY`
     - `NEXT_PUBLIC_LLM_API_URL`
   - **Files Modified**:
     - `app/.env.local` - LLM API URL 환경변수 추가
     - `src/utils/llmService.js` - 환경변수 사용 설정

2. **Vercel Production 환경 Mixed Content 오류 해결**

   - **문제**: HTTPS → HTTP 요청이 브라우저에서 차단됨
     ```
     Mixed Content: The page at 'https://ktas-emergency-system.vercel.app/result'
     was loaded over HTTPS, but requested an insecure resource
     'http://apis.data.go.kr/...'
     ```
   - **원인**: hospital-proxy/route.js가 이전 세션에서 주석 처리되어 비활성화됨
   - **해결**:
     - hospital-proxy API Route 완전 활성화
     - hospitalName 파라미터 지원 추가 (병원명 검색용)
     - 환경변수 사용 설정 (NEXT_PUBLIC_HOSPITAL_API_KEY)
     - Production/Localhost 자동 감지 로직 추가
   - **Files Modified**:
     - `src/app/api/hospital-proxy/route.js` - 프록시 활성화 + hospitalName 지원
     - `src/utils/hospitalApi.js` - Production 환경에서 프록시 사용 설정

3. **VWorld Geocoding API 안정성 개선**

   - **문제**: VWorld API에서 502 Bad Gateway 에러 빈번히 발생
     ```
     [Geocode Proxy] VWorld API HTTP 502
     TypeError: fetch failed
     cause: Error [SocketError]: other side closed
     ```
   - **재시도 로직 추가**:
     - 최대 3번 재시도
     - Exponential backoff (1초, 2초 대기)
     - 502, 503 에러 시 자동 재시도
     - VWorld API 에러 응답도 재시도 대상
   - **타임아웃 증가**: 10초 → 15초
   - **User-Agent 추가**: `Mozilla/5.0 (compatible; KTAS-Emergency-System/1.0)`
   - **Files Modified**:
     - `src/app/api/geocode/route.js` - 재시도 로직 + 타임아웃 증가

4. **VWorld API domain 파라미터 추가**

   - **발견**: VWorld API 문서에서 브라우저 사용 시 domain 파라미터 필수 요구사항 확인
     - "https나 Flex 등 웹뷰어가 아닌 브라우저에서의 API사용은 요청URL에 도메인정보를 추가하여 서비스를 이용합니다."
   - **해결**:
     - Vercel deployment URL을 domain 파라미터로 추가
     - `&domain=https://ktas-emergency-system.vercel.app`
   - **Files Modified**:
     - `src/app/api/geocode/route.js` - domain 파라미터 추가

5. **검증된 개선사항:**
   - ✅ ngrok 터널로 Vercel에서 로컬 LLM 접근 가능
   - ✅ Vercel 환경변수 5개 모두 설정 완료
   - ✅ Mixed Content 에러 해결 (HTTPS 프록시 정상 작동)
   - ✅ VWorld Geocoding API 재시도 로직으로 안정성 향상
   - ✅ VWorld API domain 파라미터 추가로 브라우저 요구사항 충족

6. **주요 참고사항:**
   - **ngrok URL 갱신**: ngrok 무료 버전은 8시간마다 URL 변경 → Vercel 환경변수 업데이트 필요
   - **환경변수 위치**: Vercel Dashboard → Settings → Environment Variables
   - **Redeploy 필요**: 환경변수 변경 후 자동 redeploy 트리거됨

### ✅ Completed (Current Session - 2025-11-02 Part 4):

1. **Vercel 리전 설정 및 API 최적화**

   - **문제**: VWorld Geocoding API 502 Bad Gateway 에러 빈번 발생
   - **시도한 해결책**:
     - VWorld API에 domain 파라미터 추가 (브라우저 요구사항)
     - Vercel 리전을 icn1 (Seoul) 으로 설정 → 한국 API 접근 개선
     - `vercel.json` 생성: 리전 설정 및 서버리스 함수 타임아웃 30초 설정
     - API Route에 `runtime = 'nodejs'` 명시

   - **Files Modified**:
     - `src/app/api/geocode/route.js` - runtime 설정, domain 파라미터
     - `vercel.json` - 신규 생성 (리전 및 타임아웃 설정)

2. **모바일 Viewport 최적화 (최종 버전 - Simple Approach)**

   - **문제**: 핸드폰에서 접속 시 레이아웃이 깨짐 (태블릿 전용 앱)
   - **최종 해결책**: "데스크탑 사이트" 모드처럼 작동 (심플)

   **구현 방법**:
   - Next.js metadata에서 viewport export 사용 (server-side)
   - **모든 페이지**: 1024 x 1024 viewport 고정
   - **Bottom Navigation**: 원래 크기 유지 (건드리지 않음)
   - **사용자**: 확대/축소 자유

   **Viewport 설정**:
   ```javascript
   export const viewport = {
     width: 1024,
     height: 1024,
     initialScale: 1.0,
     userScalable: true,
   };
   ```

   - **Files Modified**:
     - `src/app/layout.js` - viewport export 추가
     - `src/app/profile/layout.js` - 신규 생성 (profile 페이지용 viewport)

3. **삭제된 복잡한 구현들**:
   - ❌ MobileViewportManager 컴포넌트 (삭제)
   - ❌ mobile-mode CSS 스타일 (삭제)
   - ❌ JavaScript 기반 동적 감지 (불필요)
   - ❌ Bottom navigation scale 조정 (제거)

4. **효과**:
   - ✅ 모든 디바이스에서 1024x1024 viewport
   - ✅ 모바일에서 "데스크탑 사이트" 모드처럼 작동
   - ✅ 사용자가 확대/축소 자유롭게 가능
   - ✅ 모든 페이지 일관 적용 (profile 포함)
   - ✅ 새로고침 필요 없음
   - ✅ 로그 없음, 무한 루프 없음

5. **기술 세부사항**:
   - **Viewport**: 1024 x 1024 (정사각형)
   - **Initial Scale**: 1.0 (딱 맞게)
   - **User Scalable**: true (확대/축소 허용)
   - **적용 방식**: Next.js metadata export (server-side)

6. **검증된 개선사항:**
   - ✅ 핸드폰에서 태블릿 UI 그대로 표시
   - ✅ 확대/축소 정상 작동
   - ✅ 좌우 스크롤 정상 작동
   - ✅ Bottom Navigation 원래 크기 유지
   - ✅ Profile 페이지 포함 모든 페이지 정상 작동

### 🎯 Next Steps (Immediate):

**1. 병원 스코어링 및 거리 반경 수정**

- 현재 스코어링 알고리즘 개선 필요
- 거리 반경 조정 (현재 설정 확인 필요)

**2. 지도 위치 표현 및 병원 마커 개선**

- 현재 위치 마커 스타일 개선
- 병원 마커 디자인 업그레이드
- 마커 클러스터링 고려

**3. 병원 리스트 디테일 살리기**

- 병원 정보 표시 개선
- 추가 정보 표시 (가용 병상, 대기 시간 등)
- UI/UX 디테일 개선

### 🎯 Future Implementation Ideas:

**Patient Records Dashboard Enhancement**

- Add detailed analytics and statistics view
- Implement data export functionality
- Create visual charts for KTAS level distributions

**Advanced Preset Management**

- Add preset sharing between rescuers
- Implement preset templates for common scenarios
- Add preset usage analytics

### 🔧 Technical Notes for Next Developer:

**Database & Infrastructure:**

- Supabase URL: https://bnmlpygidqjvgmbajxfg.supabase.co
- Dev server: `npm run dev` → http://localhost:3000 (or 3001 if 3000 occupied)
- All original CSV logic preserved in `src/utils/ktasData.js` as backup
- Migration scripts available in `database/` folder for reference

**LLM System (2025-11-02 업데이트):**

- FastAPI server: `python medical_rag_api.py` → http://localhost:8000
- ngrok tunnel: `ngrok http 8000` → External access URL
- Medical documents: 255,162 ChromaDB entries
- Models:
  - **Embedding**: BGE-M3:latest (1.2GB) - Ollama (로컬)
  - **LLM**: ✅ **OpenAI GPT-5-mini** - Cloud-based reasoning model
  - **이전 모델**: MedGemma-4B-IT:q6 (4.0GB), Gemma3:1b (815MB) - 백업용
- API documentation: http://localhost:8000/docs (Swagger UI)
- **성능 참고**: KTAS 5급 판단 ~2-3초, KTAS 1-4급 판단 ~20-30초
- **비용 (GPT-5-mini)**:
  - 입력 토큰: $0.25 / 1M
  - 캐시된 입력: $0.025 / 1M (90% 할인)
  - 출력 토큰: $2 / 1M
  - RAG 활용 시 캐싱으로 비용 절감 가능

**Deployment Flow:**

1. Start FastAPI: `cd E:\0KoreaUniversity\DAB\llm && python medical_rag_api.py`
2. Start ngrok: `ngrok http 8000`
3. Update `PRIMARY_URL` in `src/app/profile/page.js` with ngrok URL
4. Deploy to Vercel: Global access to local LLM via ngrok tunnel
5. Test via Profile → "LLM 배포 테스트" button
