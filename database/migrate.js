// CSV 데이터를 Supabase로 마이그레이션하는 스크립트
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 환경변수 로드
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경변수가 설정되지 않았습니다.');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl);
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '설정됨' : '설정안됨');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// CSV 파싱 함수 (기존 ktasData.js와 동일)
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
    
    // 기존 데이터 삭제 (테스트용)
    console.log('🗑️ 기존 데이터 삭제 중...');
    const { error: deleteError } = await supabase
      .from('ktas_data')
      .delete()
      .neq('id', 0); // 모든 행 삭제
    
    if (deleteError) {
      console.log('⚠️ 기존 데이터 삭제 실패 (테이블이 비어있을 수 있음):', deleteError.message);
    }
    
    // 데이터 변환 및 삽입
    const transformedData = data.map(row => ({
      coding_system: row['Coding System'] || null,
      codes: row['Codes'] || null,
      category: row['구분'] || null,
      disease: row['병명'] || null,
      consideration_type: row['고려사항 구분'] || null,
      emergency_level: row['응급등급'] ? parseInt(row['응급등급']) : null,
      consideration: row['고려사항 상세'] || null,
      note: row['비고'] || null
    })).filter(row => row.category && row.disease); // 필수 필드가 있는 것만
    
    console.log(`✅ ${transformedData.length}개 유효한 행 변환 완료`);
    
    // 배치 삽입 (Supabase는 1000개씩 처리 권장)
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
    
    // 검증
    const { data: countData, error: countError } = await supabase
      .from('ktas_data')
      .select('*', { count: 'exact', head: true });
    
    if (!countError) {
      console.log(`✅ 검증 완료: 데이터베이스에 ${countData.length || 0}개 행 존재`);
    }
    
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
      .upsert(sampleRescuers, { onConflict: 'name' })
      .select();
    
    if (error) {
      console.error('❌ 구조대원 삽입 실패:', error);
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