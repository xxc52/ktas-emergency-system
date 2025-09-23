'use client';
import { useEffect, useState } from 'react';

export default function HospitalListLevel1to4({ currentLocation, patientData, ktasLevel }) {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // KTAS 1-4급: 응급실이 있는 종합병원/대학병원 우선
    // 실제로는 API를 통해 병원 정보를 가져와야 하지만, 현재는 목업 데이터 사용
    const mockHospitals = [
      {
        id: 1,
        name: '고려대학교 안암병원',
        distance: '0.9 KM',
        type: '대학병원',
        address: '서울 성북구 고려대로 73',
        tel: '02-920-5374',
        waitTime: 'Y',
        category: '상급종합병원',
        departments: ['응급실', '중환자실', '수술실'],
        emergencyRoom: true
      },
      {
        id: 2,
        name: '서울대학교병원',
        distance: '1.5 KM',
        type: '대학병원',
        address: '서울 종로구 대학로 101',
        tel: '02-2072-1182',
        waitTime: 'Y',
        category: '상급종합병원',
        departments: ['응급실', '중환자실', '수술실'],
        emergencyRoom: true
      },
      {
        id: 3,
        name: '경희대학교병원',
        distance: '3.4 KM',
        type: '대학병원',
        address: '서울 동대문구 경희대로 23',
        tel: '02-958-8114',
        waitTime: 'Y',
        category: '상급종합병원',
        departments: ['응급실', '중환자실'],
        emergencyRoom: true
      },
      {
        id: 4,
        name: '서울특별시 동부병원',
        distance: '1.6 KM',
        type: '종합병원',
        address: '서울 동대문구 무학로 124',
        tel: '02-920-9115',
        waitTime: 'N',
        category: '종합병원',
        departments: ['응급실'],
        emergencyRoom: true
      },
      {
        id: 5,
        name: '서울성심병원',
        distance: '1.7 KM',
        type: '종합병원',
        address: '서울 동대문구 왕산로 259',
        tel: '02-957-0119',
        waitTime: 'N',
        category: '종합병원',
        departments: ['응급실'],
        emergencyRoom: true
      }
    ];

    // KTAS 레벨에 따라 병원 우선순위 정렬
    const sortedHospitals = mockHospitals.sort((a, b) => {
      // 1-2급: 상급종합병원 우선
      if (ktasLevel <= 2) {
        if (a.category === '상급종합병원' && b.category !== '상급종합병원') return -1;
        if (a.category !== '상급종합병원' && b.category === '상급종합병원') return 1;
      }
      // 거리순 정렬
      return parseFloat(a.distance) - parseFloat(b.distance);
    });

    setTimeout(() => {
      setHospitals(sortedHospitals);
      setLoading(false);
    }, 1000);
  }, [ktasLevel, currentLocation]);

  if (loading) {
    return (
      <div className="hospital-list-loading">
        <p>최적 병원을 검색 중...</p>
      </div>
    );
  }

  return (
    <div className="hospital-list">
      {hospitals.map((hospital) => (
        <div key={hospital.id} className="hospital-item">
          <div className="hospital-header">
            <h3 className="hospital-name">
              {hospital.name}
              {hospital.category === '상급종합병원' && (
                <span className="hospital-badge">🏥</span>
              )}
            </h3>
            <span className="hospital-distance">{hospital.distance}</span>
          </div>
          <div className="hospital-details">
            <div className="hospital-row">
              <span className="detail-label">병상 수용 여부 : </span>
              <span className="detail-value">{hospital.waitTime}</span>
            </div>
            <div className="hospital-row">
              <span className="detail-label">전문의 여부 : </span>
              <span className="detail-value">{hospital.waitTime}</span>
            </div>
            <div className="hospital-row">
              <span className="detail-label">장비 여부 : </span>
              <span className="detail-value">{hospital.waitTime}</span>
            </div>
            <div className="hospital-row">
              <span className="detail-label">연락처 : </span>
              <span className="detail-value">{hospital.tel}</span>
            </div>
            <div className="hospital-tags">
              {hospital.departments.map((dept, index) => (
                <span key={index} className="hospital-tag">{dept}</span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}