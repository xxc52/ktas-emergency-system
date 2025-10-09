"use client";
import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  addressToCoordinates,
  refineAddressForGeocoding,
  isValidKoreanCoordinates,
} from "@/utils/geocoder";

export default function LeafletMap({
  currentLocation,
  hospitals = [],
  selectedHospitalId = null,
  onHospitalSelect = null,
}) {
  const [leafletIcons, setLeafletIcons] = useState(null);
  const [openPopupId, setOpenPopupId] = useState(null);
  const markerRefs = useRef({});
  // Leaflet 아이콘 설정 (Next.js에서 필요)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const L = require("leaflet");

      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "/leaflet/marker-icon-2x.png",
        iconUrl: "/leaflet/marker-icon.png",
        shadowUrl: "/leaflet/marker-shadow.png",
      });

      // 사용자 위치 아이콘
      const userIcon = new L.Icon({
        iconUrl: "/leaflet/marker-icon.png",
        iconRetinaUrl: "/leaflet/marker-icon-2x.png",
        shadowUrl: "/leaflet/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      // 일반 병원 아이콘 (빨간색 - 눈에 띄게)
      const hospitalIcon = new L.Icon({
        iconUrl:
          "data:image/svg+xml;charset=utf-8," +
          encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="48" viewBox="0 0 32 48">
            <path d="M16 0C9.1 0 3.5 5.6 3.5 12.5c0 8.3 12.5 31.5 12.5 31.5s12.5-23.2 12.5-31.5C28.5 5.6 22.9 0 16 0z" fill="#dc2626"/>
            <circle cx="16" cy="12.5" r="9" fill="white"/>
            <path d="M16 6v13M9.5 12.5h13" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
        `),
        iconSize: [32, 48],
        iconAnchor: [16, 48],
        popupAnchor: [1, -34],
      });

      // 상위 1위 아이콘 (금색 + 크라운 + border)
      const rank1Icon = new L.Icon({
        iconUrl:
          "data:image/svg+xml;charset=utf-8," +
          encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="44" height="64" viewBox="0 0 44 64">
            <path d="M22 8C15.1 8 9.5 13.6 9.5 20.5c0 8.3 12.5 35.5 12.5 35.5s12.5-27.2 12.5-35.5C34.5 13.6 28.9 8 22 8z" fill="#fbbf24" stroke="#854d0e" stroke-width="2"/>
            <circle cx="22" cy="20.5" r="11" fill="white" stroke="#854d0e" stroke-width="1.5"/>
            <text x="22" y="27" text-anchor="middle" font-size="16" font-weight="bold" fill="#fbbf24">1</text>
            <path d="M13 5 L17 11 L22 9 L27 11 L31 5 L27 9 L22 6 L17 9 Z" fill="#fbbf24" stroke="#854d0e" stroke-width="1"/>
          </svg>
        `),
        iconSize: [44, 64],
        iconAnchor: [22, 64],
        popupAnchor: [1, -38],
      });

      // 상위 2위 아이콘 (은색 + border)
      const rank2Icon = new L.Icon({
        iconUrl:
          "data:image/svg+xml;charset=utf-8," +
          encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="58" viewBox="0 0 40 58">
            <path d="M20 6C13.1 6 7.5 11.6 7.5 18.5c0 8.3 12.5 33.5 12.5 33.5s12.5-25.2 12.5-33.5C32.5 11.6 26.9 6 20 6z" fill="#94a3b8" stroke="#475569" stroke-width="2"/>
            <circle cx="20" cy="18.5" r="10" fill="white" stroke="#475569" stroke-width="1.5"/>
            <text x="20" y="25" text-anchor="middle" font-size="15" font-weight="bold" fill="#94a3b8">2</text>
          </svg>
        `),
        iconSize: [40, 58],
        iconAnchor: [20, 58],
        popupAnchor: [1, -36],
      });

      // 상위 3위 아이콘 (동색 + border)
      const rank3Icon = new L.Icon({
        iconUrl:
          "data:image/svg+xml;charset=utf-8," +
          encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="38" height="56" viewBox="0 0 38 56">
            <path d="M19 5C12.1 5 6.5 10.6 6.5 17.5c0 8.3 12.5 32.5 12.5 32.5s12.5-24.2 12.5-32.5C31.5 10.6 25.9 5 19 5z" fill="#cd7f32" stroke="#78350f" stroke-width="2"/>
            <circle cx="19" cy="17.5" r="9.5" fill="white" stroke="#78350f" stroke-width="1.5"/>
            <text x="19" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="#cd7f32">3</text>
          </svg>
        `),
        iconSize: [38, 56],
        iconAnchor: [19, 56],
        popupAnchor: [1, -36],
      });

      setLeafletIcons({
        user: userIcon,
        hospital: hospitalIcon,
        rank1: rank1Icon,
        rank2: rank2Icon,
        rank3: rank3Icon,
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
      const hospitalsNeedingCoords = hospitals.filter(
        (hospital) =>
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
            setHospitalCoords(
              (prev) =>
                new Map(
                  prev.set(hospital.id, {
                    latitude: coords.lat,
                    longitude: coords.lng,
                    refinedAddress: coords.refinedAddress,
                    isGeocoded: true,
                  })
                )
            );
            console.log(`✅ ${hospital.name}: (${coords.lat}, ${coords.lng})`);
          } else {
            console.warn(`⚠️ ${hospital.name}: 좌표 변환 실패, 기본 위치 사용`);
            // 서울 중심부 기본 좌표 + 약간의 오프셋
            const defaultCoords = {
              latitude: 37.5665 + (Math.random() - 0.5) * 0.02,
              longitude: 126.978 + (Math.random() - 0.5) * 0.02,
              isEstimated: true,
            };
            setHospitalCoords(
              (prev) => new Map(prev.set(hospital.id, defaultCoords))
            );
          }

          // API 제한 준수를 위한 지연 (100ms)
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error("❌ Geocoding 오류:", error);
      } finally {
        setGeocodingInProgress(false);
      }
    };

    geocodeHospitals();
  }, [hospitals, hospitalCoords, geocodingInProgress]);

  // 지도에 표시할 병원들 (전체 20개, 순위 정보 포함)
  const getDisplayHospitals = () => {
    if (!hospitals || hospitals.length === 0) return [];

    // 병원에 좌표 추가
    const hospitalsWithCoords = hospitals
      .map((hospital, index) => {
        // 이미 좌표가 있는 경우
        if (hospital.latitude && hospital.longitude) {
          return { ...hospital, rank: index + 1 };
        }

        // 캐시된 좌표 사용
        const cachedCoords = hospitalCoords.get(hospital.id);
        if (cachedCoords) {
          return {
            ...hospital,
            latitude: cachedCoords.latitude,
            longitude: cachedCoords.longitude,
            isGeocoded: cachedCoords.isGeocoded,
            isEstimated: cachedCoords.isEstimated,
            rank: index + 1,
          };
        }

        // 좌표가 없는 경우 null 반환 (지도에 표시하지 않음)
        return null;
      })
      .filter(Boolean);

    return hospitalsWithCoords;
  };

  const displayHospitals = getDisplayHospitals();

  // 마커 아이콘 선택 함수
  const getHospitalIcon = (rank) => {
    if (!leafletIcons) return null;
    if (rank === 1) return leafletIcons.rank1;
    if (rank === 2) return leafletIcons.rank2;
    if (rank === 3) return leafletIcons.rank3;
    return leafletIcons.hospital;
  };

  // 선택된 병원으로 이동 + 팝업 열기
  useEffect(() => {
    if (!selectedHospitalId) return;

    const selectedHospital = displayHospitals.find(
      (h) => h.id === selectedHospitalId
    );
    if (
      selectedHospital &&
      selectedHospital.latitude &&
      selectedHospital.longitude
    ) {
      // 팝업 열기
      setOpenPopupId(selectedHospitalId);

      // 마커의 팝업 열기
      const markerRef = markerRefs.current[selectedHospitalId];
      if (markerRef) {
        setTimeout(() => {
          markerRef.openPopup();
        }, 100);
      }
    }
  }, [selectedHospitalId, displayHospitals]);

  // 지도 자동 조정 컴포넌트 (현재 위치 + 상위 3개 병원이 모두 보이도록)
  function MapUpdater({ position, hospitals, selectedHospitalId }) {
    const map = useMap();

    useEffect(() => {
      if (!map || !position) return;

      const validHospitals = hospitals.filter((h) => h.latitude && h.longitude);

      if (validHospitals.length === 0) {
        // 병원이 없으면 현재 위치만 표시
        map.setView([position.lat, position.lng], 15);
        return;
      }

      // 현재 위치 + 상위 3개 병원의 좌표를 포함하는 bounds 계산
      if (typeof window !== "undefined") {
        const L = require("leaflet");
        const top3Hospitals = validHospitals.slice(0, 3);
        const bounds = L.latLngBounds([
          [position.lat, position.lng], // 현재 위치 포함
          ...top3Hospitals.map((h) => [h.latitude, h.longitude]),
        ]);

        // 부드럽게 bounds로 이동 (패딩 추가로 여유 공간 확보)
        map.flyToBounds(bounds, {
          padding: [50, 50], // 50px 패딩
          maxZoom: 15, // 최대 줌 레벨 제한
          duration: 1.5, // 애니메이션 시간 (초)
        });
      }
    }, [map, position, hospitals]);

    // 선택된 병원으로 지도 이동
    useEffect(() => {
      if (!map || !selectedHospitalId) return;

      const selectedHospital = hospitals.find(
        (h) => h.id === selectedHospitalId
      );
      if (
        selectedHospital &&
        selectedHospital.latitude &&
        selectedHospital.longitude
      ) {
        // 해당 병원으로 지도 이동
        map.flyTo([selectedHospital.latitude, selectedHospital.longitude], 16, {
          duration: 1.0,
        });
      }
    }, [map, selectedHospitalId, hospitals]);

    return null;
  }

  if (!position || !leafletIcons) {
    return (
      <div className="map-loading">
        <p>지도를 로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="map-wrapper" style={{ height: "100%", width: "100%" }}>
      <MapContainer
        center={[position.lat, position.lng]}
        zoom={15}
        style={{
          height: "100%",
          width: "100%",
          borderRadius: "var(--radius-lg)",
        }}
        className="leaflet-map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | &copy; <a href="https://carto.com/">CartoDB</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        {/* 지도 자동 조정 (현재 위치 + 상위 3개 병원) */}
        <MapUpdater
          position={position}
          hospitals={displayHospitals}
          selectedHospitalId={selectedHospitalId}
        />

        {/* 사용자 현재 위치 마커 */}
        <Marker
          position={[position.lat, position.lng]}
          icon={leafletIcons.user}
        >
          <Popup>
            <div style={{ minWidth: "200px" }}>
              <h3 style={{ margin: "0 0 8px 0", color: "#3b82f6" }}>
                📍 현재 위치
              </h3>
              <p style={{ margin: "4px 0" }}>위도: {position.lat.toFixed(6)}</p>
              <p style={{ margin: "4px 0" }}>경도: {position.lng.toFixed(6)}</p>
            </div>
          </Popup>
        </Marker>

        {/* 병원 마커들 (전체 20개) */}
        {displayHospitals &&
          displayHospitals.length > 0 &&
          displayHospitals
            .filter((hospital) => hospital.latitude && hospital.longitude)
            .map((hospital, index) => (
              <Marker
                key={hospital.id || index}
                position={[hospital.latitude, hospital.longitude]}
                icon={getHospitalIcon(hospital.rank)}
                ref={(ref) => {
                  if (ref) {
                    markerRefs.current[hospital.id] = ref;
                  }
                }}
                eventHandlers={{
                  click: () => {
                    setOpenPopupId(hospital.id);
                  },
                }}
              >
                <Popup
                  onClose={() => {
                    if (openPopupId === hospital.id) {
                      setOpenPopupId(null);
                    }
                  }}
                >
                  <div style={{ minWidth: "250px" }}>
                    <h3
                      style={{
                        margin: "0 0 8px 0",
                        color: hospital.hasEmergencyRoom
                          ? "#ef4444"
                          : "#dc2626",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      {hospital.hasEmergencyRoom ? "🚨" : "🏥"} {hospital.name}
                    </h3>

                    <div style={{ fontSize: "14px", lineHeight: "1.4" }}>
                      {hospital.distanceText && (
                        <p
                          style={{
                            margin: "4px 0",
                            fontWeight: "600",
                            color: "#3b82f6",
                          }}
                        >
                          📍 거리: {hospital.distanceText}
                        </p>
                      )}

                      <p style={{ margin: "4px 0" }}>
                        <strong>분류:</strong>{" "}
                        {hospital.divisionName || "정보 없음"}
                      </p>

                      {hospital.phone && (
                        <p style={{ margin: "4px 0" }}>
                          <strong>전화:</strong> {hospital.phone}
                        </p>
                      )}

                      {hospital.emergencyPhone && (
                        <p style={{ margin: "4px 0", color: "#ef4444" }}>
                          <strong>응급실:</strong> {hospital.emergencyPhone}
                        </p>
                      )}

                      <p
                        style={{
                          margin: "4px 0",
                          fontSize: "12px",
                          color: "#6b7280",
                        }}
                      >
                        {hospital.address}
                      </p>

                      {/* Geocoding 상태 표시 */}
                      {hospital.isGeocoded && (
                        <p
                          style={{
                            margin: "4px 0",
                            fontSize: "11px",
                            color: "#10b981",
                            fontWeight: "500",
                          }}
                        >
                          🎯 정확한 위치
                        </p>
                      )}

                      {hospital.isEstimated && (
                        <p
                          style={{
                            margin: "4px 0",
                            fontSize: "11px",
                            color: "#f59e0b",
                            fontWeight: "500",
                          }}
                        >
                          📍 추정 위치
                        </p>
                      )}

                      {hospital.status && (
                        <p
                          style={{
                            margin: "6px 0 0 0",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: "12px",
                            fontWeight: "600",
                            backgroundColor: hospital.status.isOpen
                              ? "#dcfce7"
                              : "#fef3c7",
                            color: hospital.status.isOpen
                              ? "#16a34a"
                              : "#d97706",
                          }}
                        >
                          {hospital.status.status}
                        </p>
                      )}

                      {hospital.departmentInfo && (
                        <p
                          style={{
                            margin: "6px 0 0 0",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: "12px",
                            fontWeight: "600",
                            backgroundColor: "#dbeafe",
                            color: "#3b82f6",
                          }}
                        >
                          {hospital.departmentInfo.name}
                        </p>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
      </MapContainer>
    </div>
  );
}
