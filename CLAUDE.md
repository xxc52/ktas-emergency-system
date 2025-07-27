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

### Data Structure

The application loads KTAS data from `public/data/ktas_data.csv` with the following key columns:
- `구분` - Medical category
- `병명` - Disease/condition name
- `고려사항 구분` - Type of consideration (1차/2차)
- `고려사항 상세` - Detailed consideration
- `응급등급` - Emergency level (1-5)

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