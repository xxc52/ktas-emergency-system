// 환자 기록 관련 Supabase 유틸리티 함수들

import { createClient } from './supabase/client';

const supabase = createClient();

// 환자 평가 기록 저장
export async function savePatientAssessment(rescuerId, patientType, assessmentData, finalLevel, hospital = null) {
  try {
    const { data, error } = await supabase
      .from('patient_assessments')
      .insert([{
        rescuer_id: rescuerId,
        patient_type: patientType,
        assessment_data: assessmentData,
        final_level: finalLevel,
        hospital: hospital
      }])
      .select()
      .single();

    if (error) {
      console.error('환자 기록 저장 오류:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return null;
    }

    console.log('✅ 환자 기록 저장 완료:', data.id);
    return data;
  } catch (error) {
    console.error('환자 기록 저장 중 예외:', error);
    return null;
  }
}

// 특정 구조대원의 환자 기록 조회
export async function getPatientRecordsByRescuer(rescuerId, options = {}) {
  try {
    let query = supabase
      .from('patient_assessments')
      .select('*')
      .eq('rescuer_id', rescuerId);

    // 필터링 옵션 적용
    if (options.startDate) {
      query = query.gte('created_at', options.startDate);
    }
    if (options.endDate) {
      query = query.lte('created_at', options.endDate);
    }
    if (options.ktasLevel) {
      query = query.eq('final_level', options.ktasLevel);
    }
    if (options.patientType) {
      query = query.eq('patient_type', options.patientType);
    }

    // 정렬
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('환자 기록 조회 오류:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('환자 기록 조회 중 예외:', error);
    return [];
  }
}

// 모든 환자 기록 조회 (관리자용)
export async function getAllPatientRecords(options = {}) {
  try {
    let query = supabase
      .from('patient_assessments')
      .select(`
        *,
        rescuers (
          id,
          name
        )
      `);

    // 필터링 옵션 적용
    if (options.rescuerIds && options.rescuerIds.length > 0) {
      query = query.in('rescuer_id', options.rescuerIds);
    }
    if (options.startDate) {
      query = query.gte('created_at', options.startDate);
    }
    if (options.endDate) {
      query = query.lte('created_at', options.endDate);
    }
    if (options.ktasLevel) {
      query = query.eq('final_level', options.ktasLevel);
    }
    if (options.patientType) {
      query = query.eq('patient_type', options.patientType);
    }

    // 정렬
    query = query.order('created_at', { ascending: false });

    // 페이지네이션
    if (options.page && options.pageSize) {
      const from = (options.page - 1) * options.pageSize;
      const to = from + options.pageSize - 1;
      query = query.range(from, to);
    }

    const { data, error } = await query;

    if (error) {
      console.error('전체 환자 기록 조회 오류:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('전체 환자 기록 조회 중 예외:', error);
    return [];
  }
}

// 환자 기록 수 조회
export async function getPatientRecordsCount(rescuerId = null, options = {}) {
  try {
    let query = supabase
      .from('patient_assessments')
      .select('*', { count: 'exact', head: true });

    if (rescuerId) {
      query = query.eq('rescuer_id', rescuerId);
    }

    // 필터링 옵션 적용
    if (options.startDate) {
      query = query.gte('created_at', options.startDate);
    }
    if (options.endDate) {
      query = query.lte('created_at', options.endDate);
    }
    if (options.ktasLevel) {
      query = query.eq('final_level', options.ktasLevel);
    }
    if (options.patientType) {
      query = query.eq('patient_type', options.patientType);
    }

    const { count, error } = await query;

    if (error) {
      console.error('환자 기록 수 조회 오류:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('환자 기록 수 조회 중 예외:', error);
    return 0;
  }
}

// 카테고리별 기록 조회 (필터링용)
export async function getRecordsByCategory(category, rescuerId = null) {
  try {
    let query = supabase
      .from('patient_assessments')
      .select('*');

    if (rescuerId) {
      query = query.eq('rescuer_id', rescuerId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('카테고리별 기록 조회 오류:', error);
      return [];
    }

    // assessment_data에서 category가 일치하는 것만 필터링
    const filteredData = (data || []).filter(record => 
      record.assessment_data && record.assessment_data.category === category
    );

    return filteredData;
  } catch (error) {
    console.error('카테고리별 기록 조회 중 예외:', error);
    return [];
  }
}

// 구조대원 목록 조회 (필터링용)
export async function getAllRescuers() {
  try {
    const { data, error } = await supabase
      .from('rescuers')
      .select('*')
      .order('name');

    if (error) {
      console.error('구조대원 목록 조회 오류:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('구조대원 목록 조회 중 예외:', error);
    return [];
  }
}