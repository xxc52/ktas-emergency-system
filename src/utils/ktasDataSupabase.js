// Supabase 기반 KTAS data utilities
// 기존 ktasData.js와 호환되는 인터페이스 유지

import { createClient } from './supabase/client';

// 캐싱을 위한 변수들
let dataCache = null;
let categoriesCache = null;
let diseasesByCategory = new Map();
let considerationsByCategory = new Map();
let cacheTTL = 5 * 60 * 1000; // 5분 캐시
let lastCacheTime = 0;

// Supabase 클라이언트
const supabase = createClient();

// 캐시 유효성 검사
function isCacheValid() {
  return dataCache && (Date.now() - lastCacheTime) < cacheTTL;
}

// 전체 데이터 로드 (기존 loadKtasData와 호환)
export async function loadKtasData() {
  if (isCacheValid()) {
    return dataCache;
  }
  
  try {
    console.log('🔄 Supabase에서 KTAS 데이터 로드 중...');
    
    // 페이지네이션으로 모든 데이터 가져오기
    let allData = [];
    let hasMore = true;
    let page = 0;
    const pageSize = 1000;
    
    while (hasMore) {
      console.log(`📦 페이지 ${page + 1} 로드 중... (${page * pageSize + 1}~${(page + 1) * pageSize})`);
      
      const { data: pageData, error } = await supabase
        .from('ktas_data')
        .select('*')
        .order('id')
        .range(page * pageSize, (page + 1) * pageSize - 1);
      
      if (error) {
        console.error('Supabase 데이터 로드 실패:', error);
        break;
      }
      
      if (!pageData || pageData.length === 0) {
        hasMore = false;
        break;
      }
      
      allData = allData.concat(pageData);
      console.log(`✅ 페이지 ${page + 1} 완료: ${pageData.length}개 (총 ${allData.length}개)`);
      
      // 페이지 크기보다 적게 받았으면 마지막 페이지
      if (pageData.length < pageSize) {
        hasMore = false;
      }
      
      page++;
      
      // 안전장치: 최대 10페이지 (10,000개)
      if (page >= 10) {
        console.warn('⚠️ 안전장치: 10페이지 제한 도달');
        hasMore = false;
      }
    }
    
    const data = allData;
    
    // 기존 CSV 형식과 호환되도록 변환
    dataCache = data.map(row => ({
      '구분': row.category,
      '병명': row.disease,
      '고려사항 구분': row.consideration_type,
      '고려사항 상세': row.consideration,
      '응급등급': row.emergency_level?.toString() || '',
      'Coding System': row.coding_system,
      'Codes': row.codes,
      '비고': row.note
    }));
    
    lastCacheTime = Date.now();
    console.log(`✅ ${dataCache.length}개 KTAS 데이터 로드 완료`);
    
    // 캐시 맵들 초기화
    categoriesCache = null;
    diseasesByCategory.clear();
    considerationsByCategory.clear();
    
    return dataCache;
    
  } catch (error) {
    console.error('KTAS 데이터 로드 중 오류:', error);
    return dataCache || [];
  }
}

// 고유한 카테고리들 반환 (동기 버전 - 기존 호환성)
export function getUniqueCategories(data) {
  if (data && data.length > 0) {
    // 전달된 데이터 사용 (기존 방식)
    const categories = new Set();
    data.forEach(row => {
      if (row['구분'] && row['구분'] !== '구분') {
        categories.add(row['구분']);
      }
    });
    return Array.from(categories).sort();
  }
  
  // 데이터가 없으면 비동기 버전 호출
  return getUniqueCategoriesAsync();
}

// 고유한 카테고리들 반환 (성능 최적화 버전)  
export async function getUniqueCategoriesAsync() {
  if (categoriesCache) {
    return categoriesCache;
  }
  
  try {
    const { data, error } = await supabase
      .from('ktas_data')
      .select('category')
      .not('category', 'is', null);
    
    if (error) throw error;
    
    const categories = [...new Set(data.map(row => row.category))].sort();
    categoriesCache = categories;
    
    return categories;
    
  } catch (error) {
    console.error('카테고리 로드 실패:', error);
    // 폴백: 전체 데이터에서 추출
    const data = await loadKtasData();
    const categories = new Set();
    data.forEach(row => {
      if (row['구분'] && row['구분'] !== '구분') {
        categories.add(row['구분']);
      }
    });
    return Array.from(categories).sort();
  }
}

// 특정 카테고리의 질병들 반환 (동기 버전 - 기존 호환성)
export function getDiseasesByCategory(data, category) {
  if (data && data.length > 0) {
    // 전달된 데이터 사용 (기존 방식)
    const diseases = new Set();
    data.forEach(row => {
      if (row['구분'] === category && row['병명']) {
        diseases.add(row['병명']);
      }
    });
    return Array.from(diseases).sort();
  }
  
  // 데이터가 없으면 비동기 버전 호출
  return getDiseasesByCategoryAsync(category);
}

// 특정 카테고리의 질병들 반환 (성능 최적화 버전)
export async function getDiseasesByCategoryAsync(category) {
  const cacheKey = `diseases_${category}`;
  
  if (diseasesByCategory.has(cacheKey)) {
    return diseasesByCategory.get(cacheKey);
  }
  
  try {
    const { data, error } = await supabase
      .from('ktas_data')
      .select('disease')
      .eq('category', category)
      .not('disease', 'is', null);
    
    if (error) throw error;
    
    const diseases = [...new Set(data.map(row => row.disease))].sort();
    diseasesByCategory.set(cacheKey, diseases);
    
    return diseases;
    
  } catch (error) {
    console.error('질병 목록 로드 실패:', error);
    // 폴백: 전체 데이터에서 추출
    const data = await loadKtasData();
    const diseases = new Set();
    data.forEach(row => {
      if (row['구분'] === category && row['병명']) {
        diseases.add(row['병명']);
      }
    });
    return Array.from(diseases).sort();
  }
}

// getAllDiseasesByCategory는 getDiseasesByCategory와 동일 (동기 버전)
export function getAllDiseasesByCategory(data, category) {
  return getDiseasesByCategory(data, category);
}

// getAllDiseasesByCategory 비동기 버전
export async function getAllDiseasesByCategoryAsync(category) {
  return getDiseasesByCategoryAsync(category);
}

// 1차 고려사항들 반환 (동기 버전 - 기존 호환성)
export function getFirstConsiderationsByCategory(data, category) {
  if (data && data.length > 0) {
    // 전달된 데이터 사용 (기존 방식)
    const considerations = new Set();
    data.forEach(row => {
      if (row['구분'] === category && row['고려사항 구분'] && row['고려사항 상세']) {
        const type = row['고려사항 구분'];
        if (type.includes('활력징후 1차') || type.includes('그 밖의 1차')) {
          considerations.add(row['고려사항 상세']);
        }
      }
    });
    return Array.from(considerations).sort();
  }
  
  // 데이터가 없으면 비동기 버전 호출
  return getFirstConsiderationsByCategoryAsync(category);
}

// 1차 고려사항들 반환 (성능 최적화 버전)
export async function getFirstConsiderationsByCategoryAsync(category) {
  const cacheKey = `first_considerations_${category}`;
  
  if (considerationsByCategory.has(cacheKey)) {
    return considerationsByCategory.get(cacheKey);
  }
  
  try {
    const { data, error } = await supabase
      .from('ktas_data')
      .select('consideration')
      .eq('category', category)
      .or('consideration_type.ilike.%1차%,consideration_type.ilike.%그 밖의 1차%')
      .not('consideration', 'is', null);
    
    if (error) throw error;
    
    const considerations = [...new Set(data.map(row => row.consideration))].sort();
    considerationsByCategory.set(cacheKey, considerations);
    
    return considerations;
    
  } catch (error) {
    console.error('1차 고려사항 로드 실패:', error);
    // 폴백: 전체 데이터에서 추출
    const data = await loadKtasData();
    const considerations = new Set();
    data.forEach(row => {
      if (row['구분'] === category && row['고려사항 구분'] && row['고려사항 상세']) {
        const type = row['고려사항 구분'];
        if (type.includes('활력징후 1차') || type.includes('그 밖의 1차')) {
          considerations.add(row['고려사항 상세']);
        }
      }
    });
    return Array.from(considerations).sort();
  }
}

// 2차 고려사항들 반환 (동기 버전 - 기존 호환성)
export function getSecondConsiderationsByCategory(data, category) {
  if (data && data.length > 0) {
    // 전달된 데이터 사용 (기존 방식)
    const considerations = new Set();
    data.forEach(row => {
      if (row['구분'] === category && row['고려사항 구분'] && row['고려사항 상세']) {
        const type = row['고려사항 구분'];
        if (type.includes('증상별 2차')) {
          considerations.add(row['고려사항 상세']);
        }
      }
    });
    return Array.from(considerations).sort();
  }
  
  // 데이터가 없으면 비동기 버전 호출
  return getSecondConsiderationsByCategoryAsync(category);
}

// 2차 고려사항들 반환 (성능 최적화 버전)
export async function getSecondConsiderationsByCategoryAsync(category) {
  const cacheKey = `second_considerations_${category}`;
  
  if (considerationsByCategory.has(cacheKey)) {
    return considerationsByCategory.get(cacheKey);
  }
  
  try {
    const { data, error } = await supabase
      .from('ktas_data')
      .select('consideration')
      .eq('category', category)
      .ilike('consideration_type', '%2차%')
      .not('consideration', 'is', null);
    
    if (error) throw error;
    
    const considerations = [...new Set(data.map(row => row.consideration))].sort();
    considerationsByCategory.set(cacheKey, considerations);
    
    return considerations;
    
  } catch (error) {
    console.error('2차 고려사항 로드 실패:', error);
    // 폴백: 전체 데이터에서 추출
    const data = await loadKtasData();
    const considerations = new Set();
    data.forEach(row => {
      if (row['구분'] === category && row['고려사항 구분'] && row['고려사항 상세']) {
        const type = row['고려사항 구분'];
        if (type.includes('증상별 2차')) {
          considerations.add(row['고려사항 상세']);
        }
      }
    });
    return Array.from(considerations).sort();
  }
}

// 질병 호환성 체크 (동기 버전 - 기존 호환성)
export function getDiseasesCompatibility(data, { category, firstConsiderations = [], secondConsiderations = [] }) {
  if (data && data.length > 0) {
    // 전달된 데이터 사용 (기존 방식)
    return getDiseasesCompatibilityFallback(data, { category, firstConsiderations, secondConsiderations });
  }
  
  // 데이터가 없으면 비동기 버전 호출
  return getDiseasesCompatibilityAsync({ category, firstConsiderations, secondConsiderations });
}

// 질병 호환성 체크 (성능 최적화 버전)
export async function getDiseasesCompatibilityAsync({ category, firstConsiderations = [], secondConsiderations = [] }) {
  try {
    // 더 효율적인 쿼리를 위해 필요한 데이터만 가져오기
    const { data, error } = await supabase
      .from('ktas_data')
      .select('disease, consideration, consideration_type')
      .eq('category', category)
      .not('disease', 'is', null)
      .not('consideration', 'is', null);
    
    if (error) throw error;
    
    // 질병별로 고려사항 매핑
    const diseaseToFirstConsiderations = new Map();
    const diseaseToSecondConsiderations = new Map();
    
    data.forEach(row => {
      const disease = row.disease;
      const consideration = row.consideration;
      const type = row.consideration_type || '';
      
      if (type.includes('활력징후 1차') || type.includes('그 밖의 1차')) {
        if (!diseaseToFirstConsiderations.has(disease)) {
          diseaseToFirstConsiderations.set(disease, new Set());
        }
        diseaseToFirstConsiderations.get(disease).add(consideration);
      }
      
      if (type.includes('증상별 2차')) {
        if (!diseaseToSecondConsiderations.has(disease)) {
          diseaseToSecondConsiderations.set(disease, new Set());
        }
        diseaseToSecondConsiderations.get(disease).add(consideration);
      }
    });
    
    // 호환성 계산 (기존 로직과 동일)
    const allDiseases = [...new Set(data.map(row => row.disease))];
    const compatibility = {};
    
    allDiseases.forEach(disease => {
      let isCompatible = true;
      
      // 1차 고려사항 호환성 체크
      if (firstConsiderations.length > 0) {
        const diseaseFirstConsiderations = diseaseToFirstConsiderations.get(disease) || new Set();
        const hasFirstConsideration = firstConsiderations.some(consideration => 
          diseaseFirstConsiderations.has(consideration)
        );
        isCompatible = isCompatible && hasFirstConsideration;
      }
      
      // 2차 고려사항 호환성 체크
      if (secondConsiderations.length > 0) {
        const diseaseSecondConsiderations = diseaseToSecondConsiderations.get(disease) || new Set();
        const hasSecondConsideration = secondConsiderations.some(consideration => 
          diseaseSecondConsiderations.has(consideration)
        );
        isCompatible = isCompatible && hasSecondConsideration;
      }
      
      compatibility[disease] = isCompatible;
    });
    
    return compatibility;
    
  } catch (error) {
    console.error('질병 호환성 체크 실패:', error);
    // 폴백: 기존 방식
    const data = await loadKtasData();
    return getDiseasesCompatibilityFallback(data, { category, firstConsiderations, secondConsiderations });
  }
}

// 1차 고려사항 호환성 체크 (동기 버전 - 기존 호환성)
export function getFirstConsiderationsCompatibility(data, { category, diseases = [], secondConsiderations = [] }) {
  if (data && data.length > 0) {
    // 전달된 데이터 사용 (기존 방식)
    return getFirstConsiderationsCompatibilityFallback(data, { category, diseases, secondConsiderations });
  }
  
  // 데이터가 없으면 비동기 버전 호출
  return getFirstConsiderationsCompatibilityAsync({ category, diseases, secondConsiderations });
}

// 1차 고려사항 호환성 체크 (비동기 버전)
export async function getFirstConsiderationsCompatibilityAsync({ category, diseases = [], secondConsiderations = [] }) {
  const data = await loadKtasData();
  return getFirstConsiderationsCompatibilityFallback(data, { category, diseases, secondConsiderations });
}

// 2차 고려사항 호환성 체크 (동기 버전 - 기존 호환성)
export function getSecondConsiderationsCompatibility(data, { category, diseases = [], firstConsiderations = [] }) {
  if (data && data.length > 0) {
    // 전달된 데이터 사용 (기존 방식)
    return getSecondConsiderationsCompatibilityFallback(data, { category, diseases, firstConsiderations });
  }
  
  // 데이터가 없으면 비동기 버전 호출
  return getSecondConsiderationsCompatibilityAsync({ category, diseases, firstConsiderations });
}

// 2차 고려사항 호환성 체크 (비동기 버전)
export async function getSecondConsiderationsCompatibilityAsync({ category, diseases = [], firstConsiderations = [] }) {
  const data = await loadKtasData();
  return getSecondConsiderationsCompatibilityFallback(data, { category, diseases, firstConsiderations });
}

// KTAS 레벨 계산 (동기 버전 - 기존 호환성)
export function getKtasLevel(data, disease, firstConsideration, secondConsideration) {
  if (data && data.length > 0) {
    // 전달된 데이터 사용 (기존 방식)
    const matchingRows = data.filter(row => {
      return row['병명'] === disease && 
             (row['고려사항 상세'] === firstConsideration || row['고려사항 상세'] === secondConsideration);
    });
    
    if (matchingRows.length > 0) {
      const levels = matchingRows.map(row => parseInt(row['응급등급'])).filter(level => !isNaN(level));
      return levels.length > 0 ? Math.min(...levels) : null;
    }
    
    return null;
  }
  
  // 데이터가 없으면 비동기 버전 호출
  return getKtasLevelAsync(disease, firstConsideration, secondConsideration);
}

// KTAS 레벨 계산 (성능 최적화 버전)
export async function getKtasLevelAsync(disease, firstConsideration, secondConsideration) {
  try {
    const { data, error } = await supabase
      .from('ktas_data')
      .select('emergency_level')
      .eq('disease', disease)
      .or(`consideration.eq.${firstConsideration},consideration.eq.${secondConsideration}`)
      .not('emergency_level', 'is', null);
    
    if (error) throw error;
    
    if (data.length > 0) {
      // 가장 높은 우선순위 (가장 낮은 숫자) KTAS 레벨 반환
      const levels = data.map(row => row.emergency_level).filter(level => level !== null && level !== undefined);
      return levels.length > 0 ? Math.min(...levels) : null;
    }
    
    return null;
    
  } catch (error) {
    console.error('KTAS 레벨 계산 실패:', error);
    // 폴백: 기존 방식
    const data = await loadKtasData();
    const matchingRows = data.filter(row => {
      return row['병명'] === disease && 
             (row['고려사항 상세'] === firstConsideration || row['고려사항 상세'] === secondConsideration);
    });
    
    if (matchingRows.length > 0) {
      const levels = matchingRows.map(row => parseInt(row['응급등급'])).filter(level => !isNaN(level));
      return levels.length > 0 ? Math.min(...levels) : null;
    }
    
    return null;
  }
}

// 폴백 함수들 (기존 로직 복사)
function getDiseasesCompatibilityFallback(data, { category, firstConsiderations = [], secondConsiderations = [] }) {
  // 기존 ktasData.js의 로직을 그대로 복사
  const diseaseToFirstConsiderations = new Map();
  const diseaseToSecondConsiderations = new Map();
  const categoryToDiseases = new Map();
  
  data.forEach(row => {
    const cat = row['구분'];
    const disease = row['병명'];
    const consideration = row['고려사항 상세'];
    const considerationType = row['고려사항 구분'];
    
    if (!cat || !disease) return;
    
    if (!categoryToDiseases.has(cat)) {
      categoryToDiseases.set(cat, new Set());
    }
    categoryToDiseases.get(cat).add(disease);
    
    if (!consideration || !considerationType) return;
    
    if (considerationType.includes('활력징후 1차') || considerationType.includes('그 밖의 1차')) {
      if (!diseaseToFirstConsiderations.has(disease)) {
        diseaseToFirstConsiderations.set(disease, new Set());
      }
      diseaseToFirstConsiderations.get(disease).add(consideration);
    }
    
    if (considerationType.includes('증상별 2차')) {
      if (!diseaseToSecondConsiderations.has(disease)) {
        diseaseToSecondConsiderations.set(disease, new Set());
      }
      diseaseToSecondConsiderations.get(disease).add(consideration);
    }
  });
  
  const allDiseases = categoryToDiseases.get(category) || new Set();
  const compatibility = {};
  
  allDiseases.forEach(disease => {
    let isCompatible = true;
    
    if (firstConsiderations.length > 0) {
      const diseaseFirstConsiderations = diseaseToFirstConsiderations.get(disease) || new Set();
      const hasFirstConsideration = firstConsiderations.some(consideration => 
        diseaseFirstConsiderations.has(consideration)
      );
      isCompatible = isCompatible && hasFirstConsideration;
    }
    
    if (secondConsiderations.length > 0) {
      const diseaseSecondConsiderations = diseaseToSecondConsiderations.get(disease) || new Set();
      const hasSecondConsideration = secondConsiderations.some(consideration => 
        diseaseSecondConsiderations.has(consideration)
      );
      isCompatible = isCompatible && hasSecondConsideration;
    }
    
    compatibility[disease] = isCompatible;
  });
  
  return compatibility;
}

function getFirstConsiderationsCompatibilityFallback(data, { category, diseases = [], secondConsiderations = [] }) {
  // 룩업 맵 구축
  const diseaseToFirstConsiderations = new Map();
  const diseaseToSecondConsiderations = new Map();
  const categoryToFirstConsiderations = new Map();
  
  data.forEach(row => {
    const cat = row['구분'];
    const disease = row['병명'];
    const consideration = row['고려사항 상세'];
    const considerationType = row['고려사항 구분'];
    
    if (!cat || !disease || !consideration || !considerationType) return;
    
    if (considerationType.includes('활력징후 1차') || considerationType.includes('그 밖의 1차')) {
      if (!diseaseToFirstConsiderations.has(disease)) {
        diseaseToFirstConsiderations.set(disease, new Set());
      }
      diseaseToFirstConsiderations.get(disease).add(consideration);
      
      if (!categoryToFirstConsiderations.has(cat)) {
        categoryToFirstConsiderations.set(cat, new Set());
      }
      categoryToFirstConsiderations.get(cat).add(consideration);
    }
    
    if (considerationType.includes('증상별 2차')) {
      if (!diseaseToSecondConsiderations.has(disease)) {
        diseaseToSecondConsiderations.set(disease, new Set());
      }
      diseaseToSecondConsiderations.get(disease).add(consideration);
    }
  });
  
  const allFirstConsiderations = categoryToFirstConsiderations.get(category) || new Set();
  const compatibility = {};
  
  allFirstConsiderations.forEach(consideration => {
    let isCompatible = true;
    
    // If diseases are selected, consideration must be available for at least one disease
    if (diseases.length > 0) {
      const hasCompatibleDisease = diseases.some(disease => {
        const diseaseFirstConsiderations = diseaseToFirstConsiderations.get(disease) || new Set();
        return diseaseFirstConsiderations.has(consideration);
      });
      isCompatible = isCompatible && hasCompatibleDisease;
    }
    
    // If second considerations are selected, check compatibility
    if (secondConsiderations.length > 0) {
      const isCompatibleWithSecond = secondConsiderations.some(secondConsideration => {
        // Find diseases that have this first consideration
        const diseasesWithFirstConsideration = [];
        diseaseToFirstConsiderations.forEach((considerations, disease) => {
          if (considerations.has(consideration)) {
            diseasesWithFirstConsideration.push(disease);
          }
        });
        
        // Check if any of these diseases also have the second consideration
        return diseasesWithFirstConsideration.some(disease => {
          const diseaseSecondConsiderations = diseaseToSecondConsiderations.get(disease) || new Set();
          return diseaseSecondConsiderations.has(secondConsideration);
        });
      });
      isCompatible = isCompatible && isCompatibleWithSecond;
    }
    
    compatibility[consideration] = isCompatible;
  });
  
  return compatibility;
}

function getSecondConsiderationsCompatibilityFallback(data, { category, diseases = [], firstConsiderations = [] }) {
  // 룩업 맵 구축
  const diseaseToFirstConsiderations = new Map();
  const diseaseToSecondConsiderations = new Map();
  const categoryToSecondConsiderations = new Map();
  
  data.forEach(row => {
    const cat = row['구분'];
    const disease = row['병명'];
    const consideration = row['고려사항 상세'];
    const considerationType = row['고려사항 구분'];
    
    if (!cat || !disease || !consideration || !considerationType) return;
    
    if (considerationType.includes('활력징후 1차') || considerationType.includes('그 밖의 1차')) {
      if (!diseaseToFirstConsiderations.has(disease)) {
        diseaseToFirstConsiderations.set(disease, new Set());
      }
      diseaseToFirstConsiderations.get(disease).add(consideration);
    }
    
    if (considerationType.includes('증상별 2차')) {
      if (!diseaseToSecondConsiderations.has(disease)) {
        diseaseToSecondConsiderations.set(disease, new Set());
      }
      diseaseToSecondConsiderations.get(disease).add(consideration);
      
      if (!categoryToSecondConsiderations.has(cat)) {
        categoryToSecondConsiderations.set(cat, new Set());
      }
      categoryToSecondConsiderations.get(cat).add(consideration);
    }
  });
  
  const allSecondConsiderations = categoryToSecondConsiderations.get(category) || new Set();
  const compatibility = {};
  
  allSecondConsiderations.forEach(consideration => {
    let isCompatible = true;
    
    // If diseases are selected, consideration must be available for at least one disease
    if (diseases.length > 0) {
      const hasCompatibleDisease = diseases.some(disease => {
        const diseaseSecondConsiderations = diseaseToSecondConsiderations.get(disease) || new Set();
        return diseaseSecondConsiderations.has(consideration);
      });
      isCompatible = isCompatible && hasCompatibleDisease;
    }
    
    // If first considerations are selected, check compatibility
    if (firstConsiderations.length > 0) {
      const isCompatibleWithFirst = firstConsiderations.some(firstConsideration => {
        // Find diseases that have this second consideration
        const diseasesWithSecondConsideration = [];
        diseaseToSecondConsiderations.forEach((considerations, disease) => {
          if (considerations.has(consideration)) {
            diseasesWithSecondConsideration.push(disease);
          }
        });
        
        // Check if any of these diseases also have the first consideration
        return diseasesWithSecondConsideration.some(disease => {
          const diseaseFirstConsiderations = diseaseToFirstConsiderations.get(disease) || new Set();
          return diseaseFirstConsiderations.has(firstConsideration);
        });
      });
      isCompatible = isCompatible && isCompatibleWithFirst;
    }
    
    compatibility[consideration] = isCompatible;
  });
  
  return compatibility;
}

// 캐시 초기화 함수 (필요시 사용)
export function clearCache() {
  dataCache = null;
  categoriesCache = null;
  diseasesByCategory.clear();
  considerationsByCategory.clear();
  lastCacheTime = 0;
  console.log('🗑️ KTAS 데이터 캐시 초기화 완료');
}