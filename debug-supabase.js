// Supabase 데이터 디버깅 스크립트
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugSupabaseData() {
  try {
    console.log('🔍 Supabase 데이터 디버깅 시작...\n');

    // 1. 전체 데이터 개수 확인
    const { data: countData, error: countError, count } = await supabase
      .from('ktas_data')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ 카운트 조회 실패:', countError);
      return;
    }

    console.log(`📊 전체 데이터 개수: ${count}개\n`);

    // 2. 카테고리 분포 확인
    const { data: categories, error: catError } = await supabase
      .from('ktas_data')
      .select('category')
      .not('category', 'is', null);

    if (catError) {
      console.error('❌ 카테고리 조회 실패:', catError);
      return;
    }

    const categoryCount = {};
    categories.forEach(row => {
      const cat = row.category;
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });

    console.log('📋 카테고리별 데이터 분포:');
    Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)
      .forEach(([category, count]) => {
        console.log(`  - ${category}: ${count}개`);
      });
    console.log('');

    // 3. 샘플 데이터 5개 확인
    const { data: sampleData, error: sampleError } = await supabase
      .from('ktas_data')
      .select('*')
      .limit(5);

    if (sampleError) {
      console.error('❌ 샘플 데이터 조회 실패:', sampleError);
      return;
    }

    console.log('📝 샘플 데이터 (처음 5개):');
    sampleData.forEach((row, index) => {
      console.log(`  ${index + 1}. [${row.category}] ${row.disease} - ${row.consideration_type}`);
    });
    console.log('');

    // 4. loadKtasData 함수 테스트
    console.log('🧪 loadKtasData 함수 테스트...');
    const { data: allData, error: allError } = await supabase
      .from('ktas_data')
      .select('*')
      .order('id');

    if (allError) {
      console.error('❌ 전체 데이터 조회 실패:', allError);
      return;
    }

    console.log(`✅ 로드된 데이터: ${allData.length}개`);

    // CSV 형식으로 변환해서 카테고리 추출 테스트
    const transformedData = allData.map(row => ({
      '구분': row.category,
      '병명': row.disease,
      '고려사항 구분': row.consideration_type,
      '고려사항 상세': row.consideration,
      '응급등급': row.emergency_level?.toString() || '',
      'Coding System': row.coding_system,
      'Codes': row.codes,
      '비고': row.note
    }));

    // 변환된 데이터에서 카테고리 추출
    const transformedCategories = new Set();
    transformedData.forEach(row => {
      if (row['구분'] && row['구분'] !== '구분') {
        transformedCategories.add(row['구분']);
      }
    });

    console.log('\n🔄 변환 후 카테고리 목록:');
    Array.from(transformedCategories).sort().forEach(cat => {
      console.log(`  - ${cat}`);
    });

  } catch (error) {
    console.error('❌ 디버깅 중 오류:', error);
  }
}

debugSupabaseData();