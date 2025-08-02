// CommonJS 버전 - ES6 import 오류시 이걸 사용
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 환경변수 로드
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경변수가 설정되지 않았습니다.');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl);
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '설정됨' : '설정안됨');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// CSV 파싱 함수
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
        i++;
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

function parseCSV(csvText) {
  const lines = csvText.split('\n');
  const headers = parseCSVLine(lines[0]);
  
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
  
  return { headers, data };
}

// 메인 마이그레이션 함수
async function migrateKtasData() {
  try {
    console.log('🚀 KTAS 데이터 마이그레이션 시작...');
    
    // CSV 파일 읽기
    const csvPath = path.join(__dirname, '../public/data/ktas_data.csv');
    const csvText = fs.readFileSync(csvPath, 'utf-8');
    const { headers, data } = parseCSV(csvText);
    
    console.log(`📊 CSV 헤더: ${headers.join(', ')}`);
    console.log(`📈 총 ${data.length}개 행 발견`);
    
    // 데이터 변환
    const transformedData = data.map(row => ({
      coding_system: row['Coding System'] || null,
      codes: row['Codes'] || null,
      category: row['구분'] || null,
      disease: row['병명'] || null,
      consideration_type: row['고려사항 구분'] || null,
      emergency_level: row['응급등급'] ? parseInt(row['응급등급']) : null,
      consideration: row['고려사항 상세'] || null,
      note: row['비고'] || null
    })).filter(row => row.category && row.disease);
    
    console.log(`✅ ${transformedData.length}개 유효한 행 변환 완료`);
    
    // 배치 삽입
    const batchSize = 500;
    let insertedCount = 0;
    
    for (let i = 0; i < transformedData.length; i += batchSize) {
      const batch = transformedData.slice(i, i + batchSize);
      
      console.log(`📦 배치 ${Math.floor(i / batchSize) + 1} 삽입 중... (${batch.length}개)`);
      
      const { data: inserted, error } = await supabase
        .from('ktas_data')
        .insert(batch)
        .select('id');
      
      if (error) {
        console.error('❌ 삽입 실패:', error);
        throw error;
      }
      
      insertedCount += inserted.length;
      console.log(`✅ ${inserted.length}개 삽입 완료 (총 ${insertedCount}개)`);
    }
    
    console.log(`🎉 마이그레이션 완료! 총 ${insertedCount}개 행 삽입됨`);
    
  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error);
    process.exit(1);
  }
}

// 샘플 구조대원 데이터 삽입
async function insertSampleRescuers() {
  try {
    console.log('👨‍🚒 샘플 구조대원 데이터 삽입...');
    
    const sampleRescuers = [
      { name: '김응급' },
      { name: '이구조' },
      { name: '박의료' },
      { name: '최안전' }
    ];
    
    const { data, error } = await supabase
      .from('rescuers')
      .insert(sampleRescuers)
      .select();
    
    if (error) {
      console.log('⚠️ 구조대원 삽입:', error.message);
    } else {
      console.log(`✅ ${data.length}명 구조대원 삽입 완료`);
    }
  } catch (error) {
    console.error('❌ 구조대원 삽입 실패:', error);
  }
}

// 실행
async function main() {
  await migrateKtasData();
  await insertSampleRescuers();
  console.log('🏁 모든 마이그레이션 완료!');
}

main();