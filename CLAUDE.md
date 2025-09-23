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

### ✅ Completed (Current Session):

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

3. **LLM 시스템 개선:**
   - 해부학적 위치 기반 판단 로직 (귀→이비인후과, 눈→안과 등)
   - 의료 전문성 고려한 프롬프트 엔지니어링
   - 구조화된 환자 데이터 처리 (`ask_unified_json` 메서드 개선)
   - 강화된 진료과목 코드 파싱 (정규표현식 기반)

4. **Files Modified/Created:**
   - `src/utils/llmService.js` - LLM API 통신 및 진료과목 판단
   - `src/utils/hospitalApi.js` - 병원 API 통합 및 거리 계산
   - `src/app/result/components/HospitalListLevel5.js` - KTAS 5급 환자용 병원 목록
   - `src/app/result/components/KakaoMap.js` - 병원 지도 마커 및 팝업
   - `E:\0KoreaUniversity\DAB\llm\medical_rag_chromadb_final.py` - LLM 환자 데이터 처리 개선
   - `E:\0KoreaUniversity\DAB\llm\medical_rag_api.py` - FastAPI 진료과목 판단 엔드포인트

5. **검증된 기능:**
   - **LLM 판단 정확성**: "귀의 이물질" → D013 (이비인후과) ✅
   - **병원 검색**: 서울/경기 지역 실시간 병원 데이터 ✅
   - **거리 계산**: GPS 기반 정확한 거리 측정 ✅
   - **UI 표시**: 병원 정보, 진료과목 태그, 운영상태 ✅

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

**LLM System:**
- FastAPI server: `python medical_rag_api.py` → http://localhost:8000
- ngrok tunnel: `ngrok http 8000` → External access URL
- Medical documents: 255,162 ChromaDB entries
- Models: BGE-M3 embeddings + Gemma3:1b LLM
- API documentation: http://localhost:8000/docs (Swagger UI)

**Deployment Flow:**
1. Start FastAPI: `cd E:\0KoreaUniversity\DAB\llm && python medical_rag_api.py`
2. Start ngrok: `ngrok http 8000`
3. Update `PRIMARY_URL` in `src/app/profile/page.js` with ngrok URL
4. Deploy to Vercel: Global access to local LLM via ngrok tunnel
5. Test via Profile → "LLM 배포 테스트" button
