'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  getAllPatientRecords, 
  getPatientRecordsCount,
  getAllRescuers 
} from '../../utils/patientRecordsSupabase';

const ktasColors = {
  1: '#FF0000', // Red - 즉시
  2: '#FF8000', // Orange - 긴급
  3: '#FFFF00', // Yellow - 준응급
  4: '#00FF00', // Green - 비응급
  5: '#0080FF'  // Blue - 진료지연가능
};

const ktasLabels = {
  1: '즉시',
  2: '긴급',
  3: '준응급',
  4: '비응급',
  5: '진료지연가능'
};

export default function Records() {
  const router = useRouter();
  const [records, setRecords] = useState([]);
  const [rescuers, setRescuers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);

  // 필터 상태
  const [filters, setFilters] = useState({
    rescuerId: '',
    ktasLevel: '',
    category: '',
    patientType: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // 구조대원 목록과 전체 기록을 병렬로 로드
      const [recordsData, rescuersData, totalCount] = await Promise.all([
        getAllPatientRecords(),
        getAllRescuers(),
        getPatientRecordsCount()
      ]);

      setRecords(recordsData);
      setRescuers(rescuersData);
      setTotalRecords(totalCount);
    } catch (error) {
      console.error('데이터 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 필터링된 기록들
  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      // 구조대원 필터
      if (filters.rescuerId && record.rescuer_id !== parseInt(filters.rescuerId)) {
        return false;
      }

      // KTAS 레벨 필터
      if (filters.ktasLevel && record.final_level !== parseInt(filters.ktasLevel)) {
        return false;
      }

      // 환자 유형 필터
      if (filters.patientType && record.patient_type !== filters.patientType) {
        return false;
      }

      // 카테고리 필터
      if (filters.category && record.assessment_data?.category !== filters.category) {
        return false;
      }

      // 날짜 필터
      const recordDate = new Date(record.created_at);
      if (filters.startDate && recordDate < new Date(filters.startDate)) {
        return false;
      }
      if (filters.endDate && recordDate > new Date(filters.endDate + 'T23:59:59')) {
        return false;
      }

      return true;
    });
  }, [records, filters]);

  // 카테고리 목록 추출
  const categories = useMemo(() => {
    const categorySet = new Set();
    records.forEach(record => {
      if (record.assessment_data?.category) {
        categorySet.add(record.assessment_data.category);
      }
    });
    return Array.from(categorySet).sort();
  }, [records]);

  const handleFilterChange = (filterKey, value) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      rescuerId: '',
      ktasLevel: '',
      category: '',
      patientType: '',
      startDate: '',
      endDate: ''
    });
  };

  const handleBack = () => {
    router.push('/profile');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="container">
        <div className="content" style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div>환자 기록을 불러오는 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <button className="back-button" onClick={handleBack}>
          ← 이전
        </button>
        <h1 className="title">환자 기록 조회</h1>
        <div style={{ fontSize: '16px', color: '#666' }}>
          총 {totalRecords}건 (필터링: {filteredRecords.length}건)
        </div>
      </div>

      <div className="content">
        {/* 필터 섹션 */}
        <div className="records-filters">
          <div className="filter-row">
            <select 
              value={filters.rescuerId} 
              onChange={(e) => handleFilterChange('rescuerId', e.target.value)}
              className="filter-select"
            >
              <option value="">모든 구조대원</option>
              {rescuers.map(rescuer => (
                <option key={rescuer.id} value={rescuer.id}>
                  {rescuer.name}
                </option>
              ))}
            </select>

            <select 
              value={filters.ktasLevel} 
              onChange={(e) => handleFilterChange('ktasLevel', e.target.value)}
              className="filter-select"
            >
              <option value="">모든 KTAS 레벨</option>
              {[1, 2, 3, 4, 5].map(level => (
                <option key={level} value={level}>
                  KTAS {level}급 ({ktasLabels[level]})
                </option>
              ))}
            </select>

            <select 
              value={filters.category} 
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="filter-select"
            >
              <option value="">모든 카테고리</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <select 
              value={filters.patientType} 
              onChange={(e) => handleFilterChange('patientType', e.target.value)}
              className="filter-select"
            >
              <option value="">모든 연령대</option>
              <option value="adult">성인</option>
              <option value="pediatric">소아</option>
            </select>
          </div>

          <div className="filter-row">
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="filter-date"
              placeholder="시작 날짜"
            />
            <span style={{ margin: '0 10px', color: '#666' }}>~</span>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="filter-date"
              placeholder="종료 날짜"
            />
            
            <button className="clear-filters-btn" onClick={clearAllFilters}>
              🔄 필터 초기화
            </button>
          </div>
        </div>

        {/* 기록 테이블 */}
        <div className="records-table-container">
          {filteredRecords.length === 0 ? (
            <div className="no-records">
              <p>조건에 맞는 기록이 없습니다.</p>
            </div>
          ) : (
            <table className="records-table">
              <thead>
                <tr>
                  <th>평가 시간</th>
                  <th>구조대원</th>
                  <th>연령대</th>
                  <th>KTAS 레벨</th>
                  <th>카테고리</th>
                  <th>주요 병명</th>
                  <th>1차 고려사항</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map(record => (
                  <tr key={record.id}>
                    <td>{formatDate(record.created_at)}</td>
                    <td>{record.rescuers?.name || '알 수 없음'}</td>
                    <td>{record.patient_type === 'adult' ? '성인' : '소아'}</td>
                    <td>
                      <span 
                        className="ktas-badge"
                        style={{ 
                          backgroundColor: ktasColors[record.final_level],
                          color: record.final_level === 3 ? '#000' : '#fff'
                        }}
                      >
                        {record.final_level}급 ({ktasLabels[record.final_level]})
                      </span>
                    </td>
                    <td>{record.assessment_data?.category || '-'}</td>
                    <td>{record.assessment_data?.primaryDisease || '-'}</td>
                    <td>
                      {record.assessment_data?.firstConsiderations?.length > 0 
                        ? record.assessment_data.firstConsiderations.slice(0, 2).join(', ') +
                          (record.assessment_data.firstConsiderations.length > 2 ? '...' : '')
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}