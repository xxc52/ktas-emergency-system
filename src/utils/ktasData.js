// Performance optimized KTAS data utilities
let dataCache = null;
let diseaseToFirstConsiderations = new Map();
let diseaseToSecondConsiderations = new Map();
let categoryToDiseases = new Map();
let categoryToFirstConsiderations = new Map();
let categoryToSecondConsiderations = new Map();

export async function loadKtasData() {
  if (dataCache) return dataCache;
  
  try {
    const response = await fetch('/data/ktas_data.csv');
    const csvText = await response.text();
    dataCache = parseCSV(csvText);
    buildLookupMaps(dataCache);
    return dataCache;
  } catch (error) {
    console.error('Error loading KTAS data:', error);
    return [];
  }
}

function parseCSV(csvText) {
  const lines = csvText.split('\n');
  const headers = lines[0].split(',');
  
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = parseCSVLine(line);
    if (values.length < headers.length) continue;
    
    const row = {};
    headers.forEach((header, index) => {
      row[header.trim()] = values[index] ? values[index].trim() : '';
    });
    
    data.push(row);
  }
  
  return data;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
}

function buildLookupMaps(data) {
  // Clear existing maps
  diseaseToFirstConsiderations.clear();
  diseaseToSecondConsiderations.clear();
  categoryToDiseases.clear();
  categoryToFirstConsiderations.clear();
  categoryToSecondConsiderations.clear();
  
  data.forEach(row => {
    const category = row['구분'];
    const disease = row['병명'];
    const consideration = row['고려사항 상세'];
    const considerationType = row['고려사항 구분'];
    
    if (!category || !disease) return;
    
    // Build category to diseases map
    if (!categoryToDiseases.has(category)) {
      categoryToDiseases.set(category, new Set());
    }
    categoryToDiseases.get(category).add(disease);
    
    if (!consideration || !considerationType) return;
    
    // Build disease to considerations maps
    if (considerationType.includes('활력징후 1차') || considerationType.includes('그 밖의 1차')) {
      if (!diseaseToFirstConsiderations.has(disease)) {
        diseaseToFirstConsiderations.set(disease, new Set());
      }
      diseaseToFirstConsiderations.get(disease).add(consideration);
      
      if (!categoryToFirstConsiderations.has(category)) {
        categoryToFirstConsiderations.set(category, new Set());
      }
      categoryToFirstConsiderations.get(category).add(consideration);
    }
    
    if (considerationType.includes('증상별 2차')) {
      if (!diseaseToSecondConsiderations.has(disease)) {
        diseaseToSecondConsiderations.set(disease, new Set());
      }
      diseaseToSecondConsiderations.get(disease).add(consideration);
      
      if (!categoryToSecondConsiderations.has(category)) {
        categoryToSecondConsiderations.set(category, new Set());
      }
      categoryToSecondConsiderations.get(category).add(consideration);
    }
  });
}

export function getUniqueCategories(data) {
  const categories = new Set();
  data.forEach(row => {
    if (row['구분'] && row['구분'] !== '구분') {
      categories.add(row['구분']);
    }
  });
  return Array.from(categories).sort();
}

export function getDiseasesByCategory(data, category) {
  if (categoryToDiseases.size === 0) buildLookupMaps(data);
  const diseases = categoryToDiseases.get(category) || new Set();
  return Array.from(diseases).sort();
}

export function getAllDiseasesByCategory(data, category) {
  return getDiseasesByCategory(data, category);
}

export function getFirstConsiderationsByCategory(data, category) {
  if (categoryToFirstConsiderations.size === 0) buildLookupMaps(data);
  const considerations = categoryToFirstConsiderations.get(category) || new Set();
  return Array.from(considerations).sort();
}

export function getSecondConsiderationsByCategory(data, category) {
  if (categoryToSecondConsiderations.size === 0) buildLookupMaps(data);
  const considerations = categoryToSecondConsiderations.get(category) || new Set();
  return Array.from(considerations).sort();
}

export function getDiseasesCompatibility(data, { category, firstConsiderations = [], secondConsiderations = [] }) {
  if (categoryToDiseases.size === 0) buildLookupMaps(data);
  
  const allDiseases = categoryToDiseases.get(category) || new Set();
  const compatibility = {};
  
  allDiseases.forEach(disease => {
    let isCompatible = true;
    
    // Check first considerations compatibility
    if (firstConsiderations.length > 0) {
      const diseaseFirstConsiderations = diseaseToFirstConsiderations.get(disease) || new Set();
      const hasFirstConsideration = firstConsiderations.some(consideration => 
        diseaseFirstConsiderations.has(consideration)
      );
      isCompatible = isCompatible && hasFirstConsideration;
    }
    
    // Check second considerations compatibility
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

export function getFirstConsiderationsCompatibility(data, { category, diseases = [], secondConsiderations = [] }) {
  if (categoryToFirstConsiderations.size === 0) buildLookupMaps(data);
  
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

export function getSecondConsiderationsCompatibility(data, { category, diseases = [], firstConsiderations = [] }) {
  if (categoryToSecondConsiderations.size === 0) buildLookupMaps(data);
  
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

export function getKtasLevel(data, disease, firstConsideration, secondConsideration) {
  const matchingRows = data.filter(row => {
    return row['병명'] === disease && 
           (row['고려사항 상세'] === firstConsideration || row['고려사항 상세'] === secondConsideration);
  });
  
  if (matchingRows.length > 0) {
    // Return the highest priority (lowest number) KTAS level
    const levels = matchingRows.map(row => parseInt(row['응급등급'])).filter(level => !isNaN(level));
    return levels.length > 0 ? Math.min(...levels) : null;
  }
  
  return null;
}