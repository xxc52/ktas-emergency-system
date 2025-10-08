'use client';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { addressToCoordinates, refineAddressForGeocoding, isValidKoreanCoordinates } from '@/utils/geocoder';

export default function LeafletMap({ currentLocation, hospitals = [], selectedHospitalId = null }) {
  const [leafletIcons, setLeafletIcons] = useState(null);
  // Leaflet 아이콘 설정 (Next.js에서 필요)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const L = require('leaflet');

      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: '/leaflet/marker-icon-2x.png',
        iconUrl: '/leaflet/marker-icon.png',
        shadowUrl: '/leaflet/marker-shadow.png',
      });

      // 사용자 위치 아이콘
      const userIcon = new L.Icon({
        iconUrl: '/leaflet/marker-icon.png',
        iconRetinaUrl: '/leaflet/marker-icon-2x.png',
        shadowUrl: '/leaflet/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });

      // 병원 아이콘 (빨간색)
      const hospitalIcon = new L.Icon({
        iconUrl: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="25" height="41" viewBox="0 0 25 41">
            <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 8.3 12.5 28.5 12.5 28.5s12.5-20.2 12.5-28.5C25 5.6 19.4 0 12.5 0z" fill="#dc2626"/>
            <circle cx="12.5" cy="12.5" r="8" fill="white"/>
            <path d="M12.5 6v19M6 12.5h13" stroke="#dc2626" stroke-width="2" stroke-linecap="round"/>
          </svg>
        `),
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34]
      });

      // 응급실 아이콘 (더 큰 빨간색)
      const emergencyIcon = new L.Icon({
        iconUrl: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="30" height="46" viewBox="0 0 30 46">
            <path d="M15 0C6.7 0 0 6.7 0 15c0 10 15 31 15 31s15-21 15-31C30 6.7 23.3 0 15 0z" fill="#ef4444"/>
            <circle cx="15" cy="15" r="10" fill="white"/>
            <path d="M15 7v16M7 15h16" stroke="#ef4444" stroke-width="3" stroke-linecap="round"/>
            <circle cx="15" cy="20" r="2" fill="#ef4444"/>
          </svg>
        `),
        iconSize: [30, 46],
        iconAnchor: [15, 46],
        popupAnchor: [1, -34]
      });

      setLeafletIcons({
        user: userIcon,
        hospital: hospitalIcon,
        emergency: emergencyIcon
      });
    }
  }, []);

  // 기본 위치 (고려대학교)
  const defaultLocation = { lat: 37.5896, lng: 127.0321 };
  const position = currentLocation || defaultLocation;

  // 병원 좌표 캐시 상태
  const [hospitalCoords, setHospitalCoords] = useState(new Map());
  const [geocodingInProgress, setGeocodingInProgress] = useState(false);

  // 병원 주소를 좌표로 변환 (VWorld Geocoder API 사용)
  useEffect(() => {
    const geocodeHospitals = async () => {
      if (!hospitals || hospitals.length === 0 || geocodingInProgress) return;

      // 좌표가 없는 병원들 찾기
      const hospitalsNeedingCoords = hospitals.filter(hospital =>
        (!hospital.latitude || !hospital.longitude) &&
        hospital.address &&
        !hospitalCoords.has(hospital.id)
      );

      if (hospitalsNeedingCoords.length === 0) return;

      console.log(`🗺️ ${hospitalsNeedingCoords.length}개 병원 좌표 변환 시작`);
      setGeocodingInProgress(true);

      try {
        for (const hospital of hospitalsNeedingCoords) {
          if (hospitalCoords.has(hospital.id)) continue;

          const refinedAddress = refineAddressForGeocoding(hospital.address);
          const coords = await addressToCoordinates(refinedAddress);

          if (coords && isValidKoreanCoordinates(coords.lat, coords.lng)) {
            setHospitalCoords(prev => new Map(prev.set(hospital.id, {
              latitude: coords.lat,
              longitude: coords.lng,
              refinedAddress: coords.refinedAddress,
              isGeocoded: true
            })));
            console.log(`✅ ${hospital.name}: (${coords.lat}, ${coords.lng})`);
          } else {
            console.warn(`⚠️ ${hospital.name}: 좌표 변환 실패, 기본 위치 사용`);
            // 서울 중심부 기본 좌표 + 약간의 오프셋
            const defaultCoords = {
              latitude: 37.5665 + (Math.random() - 0.5) * 0.02,
              longitude: 126.9780 + (Math.random() - 0.5) * 0.02,
              isEstimated: true
            };
            setHospitalCoords(prev => new Map(prev.set(hospital.id, defaultCoords)));
          }

          // API 제한 준수를 위한 지연 (100ms)
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error('❌ Geocoding 오류:', error);
      } finally {
        setGeocodingInProgress(false);
      }
    };

    geocodeHospitals();
  }, [hospitals, hospitalCoords, geocodingInProgress]);

  // 지도에 표시할 병원들 필터링 (상위 3개 + 선택된 병원)
  const getDisplayHospitals = () => {
    if (!hospitals || hospitals.length === 0) return [];

    // 병원에 좌표 추가
    const hospitalsWithCoords = hospitals.map(hospital => {
      // 이미 좌표가 있는 경우
      if (hospital.latitude && hospital.longitude) {
        return hospital;
      }

      // 캐시된 좌표 사용
      const cachedCoords = hospitalCoords.get(hospital.id);
      if (cachedCoords) {
        return {
          ...hospital,
          latitude: cachedCoords.latitude,
          longitude: cachedCoords.longitude,
          isGeocoded: cachedCoords.isGeocoded,
          isEstimated: cachedCoords.isEstimated
        };
      }

      // 좌표가 없는 경우 null 반환 (지도에 표시하지 않음)
      return null;
    }).filter(Boolean);

    // 상위 3개 병원
    const top3Hospitals = hospitalsWithCoords.slice(0, 3);

    // 선택된 병원이 있고 상위 3개에 포함되지 않은 경우 추가
    let displayHospitals = [...top3Hospitals];
    if (selectedHospitalId) {
      const selectedHospital = hospitalsWithCoords.find(h => h.id === selectedHospitalId);
      if (selectedHospital && !top3Hospitals.some(h => h.id === selectedHospitalId)) {
        displayHospitals.push({ ...selectedHospital, isSelected: true });
      }
    }

    return displayHospitals;
  };

  const displayHospitals = getDisplayHospitals();

  // 병원이 있을 때 지도 범위 조정
  const getMapBounds = () => {
    if (!displayHospitals || displayHospitals.length === 0) {
      return { center: [position.lat, position.lng], zoom: 15 };
    }

    const validHospitals = displayHospitals.filter(h => h.latitude && h.longitude);
    if (validHospitals.length === 0) {
      return { center: [position.lat, position.lng], zoom: 15 };
    }

    // 모든 위치를 포함하는 중심점과 줌 레벨 계산
    const allLats = [position.lat, ...validHospitals.map(h => h.latitude)];
    const allLngs = [position.lng, ...validHospitals.map(h => h.longitude)];

    const minLat = Math.min(...allLats);
    const maxLat = Math.max(...allLats);
    const minLng = Math.min(...allLngs);
    const maxLng = Math.max(...allLngs);

    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;

    // 거리에 따른 줌 레벨 조정
    const latDiff = maxLat - minLat;
    const lngDiff = maxLng - minLng;
    const maxDiff = Math.max(latDiff, lngDiff);

    let zoom = 15;
    if (maxDiff > 0.02) zoom = 12;
    else if (maxDiff > 0.01) zoom = 13;
    else if (maxDiff > 0.005) zoom = 14;

    return { center: [centerLat, centerLng], zoom };
  };

  const mapConfig = getMapBounds();

  if (!position || !leafletIcons) {
    return (
      <div className="map-loading">
        <p>지도를 로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="map-wrapper" style={{ height: '100%', width: '100%' }}>
      <MapContainer
        center={mapConfig.center}
        zoom={mapConfig.zoom}
        style={{ height: '100%', width: '100%', borderRadius: 'var(--radius-lg)' }}
        className="leaflet-map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* 사용자 현재 위치 마커 */}
        <Marker
          position={[position.lat, position.lng]}
          icon={leafletIcons.user}
        >
          <Popup>
            <div style={{ minWidth: '200px' }}>
              <h3 style={{ margin: '0 0 8px 0', color: '#3b82f6' }}>📍 현재 위치</h3>
              <p style={{ margin: '4px 0' }}>위도: {position.lat.toFixed(6)}</p>
              <p style={{ margin: '4px 0' }}>경도: {position.lng.toFixed(6)}</p>
            </div>
          </Popup>
        </Marker>

        {/* 병원 마커들 (상위 3개 + 선택된 병원) */}
        {displayHospitals && displayHospitals.length > 0 && displayHospitals
          .filter(hospital => hospital.latitude && hospital.longitude)
          .map((hospital, index) => (
            <Marker
              key={hospital.id || index}
              position={[hospital.latitude, hospital.longitude]}
              icon={hospital.hasEmergencyRoom ? leafletIcons.emergency : leafletIcons.hospital}
            >
              <Popup>
                <div style={{ minWidth: '250px' }}>
                  <h3 style={{
                    margin: '0 0 8px 0',
                    color: hospital.hasEmergencyRoom ? '#ef4444' : '#dc2626',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    {hospital.hasEmergencyRoom ? '🚨' : '🏥'} {hospital.name}
                  </h3>

                  <div style={{ fontSize: '14px', lineHeight: '1.4' }}>
                    {hospital.distanceText && (
                      <p style={{ margin: '4px 0', fontWeight: '600', color: '#3b82f6' }}>
                        📍 거리: {hospital.distanceText}
                      </p>
                    )}

                    <p style={{ margin: '4px 0' }}>
                      <strong>분류:</strong> {hospital.divisionName || '정보 없음'}
                    </p>

                    {hospital.phone && (
                      <p style={{ margin: '4px 0' }}>
                        <strong>전화:</strong> {hospital.phone}
                      </p>
                    )}

                    {hospital.emergencyPhone && (
                      <p style={{ margin: '4px 0', color: '#ef4444' }}>
                        <strong>응급실:</strong> {hospital.emergencyPhone}
                      </p>
                    )}

                    <p style={{ margin: '4px 0', fontSize: '12px', color: '#6b7280' }}>
                      {hospital.address}
                    </p>

                    {/* Geocoding 상태 표시 */}
                    {hospital.isGeocoded && (
                      <p style={{
                        margin: '4px 0',
                        fontSize: '11px',
                        color: '#10b981',
                        fontWeight: '500'
                      }}>
                        🎯 정확한 위치
                      </p>
                    )}

                    {hospital.isEstimated && (
                      <p style={{
                        margin: '4px 0',
                        fontSize: '11px',
                        color: '#f59e0b',
                        fontWeight: '500'
                      }}>
                        📍 추정 위치
                      </p>
                    )}

                    {hospital.status && (
                      <p style={{
                        margin: '6px 0 0 0',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        backgroundColor: hospital.status.isOpen ? '#dcfce7' : '#fef3c7',
                        color: hospital.status.isOpen ? '#16a34a' : '#d97706'
                      }}>
                        {hospital.status.status}
                      </p>
                    )}

                    {hospital.departmentInfo && (
                      <p style={{
                        margin: '6px 0 0 0',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        backgroundColor: '#dbeafe',
                        color: '#3b82f6'
                      }}>
                        {hospital.departmentInfo.name}
                      </p>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))
        }
      </MapContainer>
    </div>
  );
}