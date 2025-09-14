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

1. **LLM Integration & ngrok Deployment**

   - FastAPI Medical RAG server integration with ChromaDB
   - ngrok tunnel setup for external access
   - Profile page LLM chat interface with auto-detection
   - External deployment support via Vercel

2. **Core Components Implemented:**

   - **LLM Chat Modal**: Real-time medical Q&A interface with performance metrics
   - **API Auto-Detection**: Smart URL fallback system (ngrok → localhost)
   - **Medical RAG System**: 255,162 medical documents with BGE-M3 + Gemma3:1b
   - **External Access**: ngrok tunnel enables global access to local LLM

3. **Files Modified/Created:**
   - `src/app/profile/page.js` - LLM chat integration with ngrok priority
   - `E:\0KoreaUniversity\DAB\llm\*` - FastAPI server and medical RAG system
   - `E:\0KoreaUniversity\DAB\llm\NGROK_SETUP.md` - Complete setup guide

4. **System Architecture:**
   - **FastAPI Server**: http://localhost:8000 (Medical RAG API)
   - **ngrok Tunnel**: https://c1744335a886.ngrok-free.app (External access)
   - **Next.js App**: http://localhost:3000 (Vercel deployable)
   - **Auto-Fallback**: Primary ngrok → fallback localhost

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
