import React from "react";
import { useZoomPan } from "./hooks/useZoomPan";
import lines from "./lines";
import Polyline from "./components/Polyline";
import StationMarkers from "./components/StationMarkers";
import StationLabels from "./components/StationLabels";
import type { Station } from "./types/Station";

interface StationWithLine {
  name: string;
  lat: number;
  lng: number;
  lineName: string;
}

const VIEW_WIDTH = 1024;
const VIEW_HEIGHT = 1024;
const backgroundColor = "white";
const textColor = "#333333";

function getLatLngBounds() {
  let minLat = Infinity,
    maxLat = -Infinity,
    minLng = Infinity,
    maxLng = -Infinity;
  Object.values(lines).forEach((line) => {
    line.stations.forEach((st) => {
      if (st.lat < minLat) minLat = st.lat;
      if (st.lat > maxLat) maxLat = st.lat;
      if (st.lng < minLng) minLng = st.lng;
      if (st.lng > maxLng) maxLng = st.lng;
    });
  });
  return { minLat, maxLat, minLng, maxLng };
}

function getRouteBounds(routes: Array<{
  from: string;
  to: string;
  path: Array<{
    station: {
      name: string;
      lat: number;
      lng: number;
      lineName: string;
    };
    lineName: string;
  }>;
  transfers: number;
}>) {
  if (routes.length === 0) {
    return getLatLngBounds();
  }
  
  let minLat = Infinity,
    maxLat = -Infinity,
    minLng = Infinity,
    maxLng = -Infinity;
  
  routes.forEach(route => {
    route.path.forEach(pathItem => {
      const station = pathItem.station;
      if (station.lat < minLat) minLat = station.lat;
      if (station.lat > maxLat) maxLat = station.lat;
      if (station.lng < minLng) minLng = station.lng;
      if (station.lng > maxLng) maxLng = station.lng;
    });
  });
  
  return { minLat, maxLat, minLng, maxLng };
}

const bounds = getLatLngBounds();

function latLngToSvg(lat: number, lng: number, customBounds?: { minLat: number; maxLat: number; minLng: number; maxLng: number }) {
  const { minLat, maxLat, minLng, maxLng } = customBounds || bounds;
  const latCenter = (minLat + maxLat) / 2;
  const lngScale = Math.cos((latCenter * Math.PI) / 180);

  const geoWidth = (maxLng - minLng) * lngScale;
  const geoHeight = maxLat - minLat;
  
  const padding = 80;
  const availableWidth = VIEW_WIDTH - padding * 2;
  const availableHeight = VIEW_HEIGHT - padding * 2;
  
  const scale = Math.min(availableWidth / geoWidth, availableHeight / geoHeight);

  const offsetX = padding + (availableWidth - geoWidth * scale) / 2;
  const offsetY = padding + (availableHeight - geoHeight * scale) / 2;

  const x = offsetX + (lng - minLng) * lngScale * scale;
  const y = VIEW_HEIGHT - (offsetY + (lat - minLat) * scale);
  return { x, y };
}

const stationList: Station[] = Object.values(lines).flatMap((line) =>
  line.stations.map((station) => ({
    name: station.name,
    lat: station.lat,
    lng: station.lng,
    line: line.name,
    color: line.color,
  }))
);

interface RailwayMapProps {
  selectedRoutes?: Array<{
    from: string;
    to: string;
    path: Array<{
      station: {
        name: string;
        lat: number;
        lng: number;
        lineName: string;
      };
      lineName: string;
    }>;
    transfers: number;
  }>;
}

const RailwayMap: React.FC<RailwayMapProps> = ({ selectedRoutes = [] }) => {
  const {
    zoom,
    offset,
    dragging,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    svgRef,
  } = useZoomPan();

  // 経路選択時の描画範囲を計算
  const routeBounds = selectedRoutes.length > 0 ? getRouteBounds(selectedRoutes) : null;
  const latLngToSvgWithBounds = (lat: number, lng: number) => latLngToSvg(lat, lng, routeBounds || undefined);

  return (
    <svg
      ref={svgRef}
      width={VIEW_WIDTH}
      height={VIEW_HEIGHT}
      style={{
        background: backgroundColor,
        cursor: dragging ? "grabbing" : "grab",
        userSelect: "none",
        border: "1px solid #e0e0e0",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <g transform={`translate(${VIEW_WIDTH/2},${VIEW_HEIGHT/2}) scale(${zoom}) translate(${-VIEW_WIDTH/2 + offset.x},${-VIEW_HEIGHT/2 + offset.y})`}>
        {selectedRoutes.length === 0 ? (
          // 経路が選択されていない場合は全路線を表示
          <>
            {Object.entries(lines).map(([lineName, line]) => (
              <g key={lineName}>
                <Polyline
                  color={line.color}
                  stations={line.stations}
                  latLngToSvg={latLngToSvg}
                />
              </g>
            ))}
            <StationMarkers
              stationList={stationList}
              latLngToSvg={latLngToSvg}
              backgroundColor={backgroundColor}
            />
            <StationLabels
              stationList={stationList}
              latLngToSvg={latLngToSvg}
              textColor={textColor}
            />
          </>
        ) : (
          // 経路が選択されている場合は経路のみ表示
          <>
            {selectedRoutes.map((route, routeIndex) => {
              // 経路を路線ごとに分割
              const pathSegments: Array<{
                stations: Array<{ name: string; lat: number; lng: number }>;
                color: string;
                lineName: string;
              }> = [];
              
              if (route.path.length === 0) return null;
              
              let currentSegment: Array<{ name: string; lat: number; lng: number }> = [];
              let currentLineName = route.path[0].lineName;
              
              // 最初の駅を追加
              currentSegment.push(route.path[0].station);
              
              for (let i = 1; i < route.path.length; i++) {
                const currentItem = route.path[i];
                
                if (currentItem.lineName === currentLineName) {
                  // 同じ路線の場合、駅を追加
                  currentSegment.push(currentItem.station);
                } else {
                  // 路線が変わる場合
                  // 現在の区間を保存
                  const lineData = lines[currentLineName as keyof typeof lines];
                  pathSegments.push({
                    stations: [...currentSegment],
                    color: lineData?.color || '#000',
                    lineName: currentLineName,
                  });
                  
                  // 新しい区間を開始（乗り換え駅から）
                  currentSegment = [currentItem.station];
                  currentLineName = currentItem.lineName;
                }
              }
              
              // 最後の区間を保存
              if (currentSegment.length > 0) {
                const lineData = lines[currentLineName as keyof typeof lines];
                pathSegments.push({
                  stations: currentSegment,
                  color: lineData?.color || '#000',
                  lineName: currentLineName,
                });
              }
              
              console.log(`Route ${routeIndex + 1}: ${route.from} → ${route.to}`);
              console.log('Original path:', route.path.map((p, i) => `${i}: ${p.station.name} (${p.lineName})`).join(' | '));
              pathSegments.forEach((segment, idx) => {
                console.log(`  Segment ${idx + 1} (${segment.lineName}):`, segment.stations.map(s => s.name).join(' → '));
              });
              
              return (
                <g key={`route-${routeIndex}`}>
                  {pathSegments.map((segment, segmentIndex) => (
                    <Polyline
                      key={`route-${routeIndex}-segment-${segmentIndex}`}
                      color={segment.color}
                      stations={segment.stations}
                      latLngToSvg={latLngToSvgWithBounds}
                      strokeWidth={6}
                    />
                  ))}
                </g>
              );
            })}
            
            {/* 乗り換え駅と終端駅のみマーカーとラベルを表示 */}
            {(() => {
              const transferAndEndStations = new Map<string, StationWithLine>();
              
              selectedRoutes.forEach(route => {
                // 各経路の始点と終点を追加
                if (route.path.length > 0) {
                  const firstStation = route.path[0].station;
                  const lastStation = route.path[route.path.length - 1].station;
                  
                  const firstKey = `${firstStation.name}-${firstStation.lat}-${firstStation.lng}`;
                  const lastKey = `${lastStation.name}-${lastStation.lat}-${lastStation.lng}`;
                  
                  transferAndEndStations.set(firstKey, firstStation);
                  transferAndEndStations.set(lastKey, lastStation);
                }
                
                // 乗り換え駅を検出（路線名が変わる箇所）
                for (let i = 1; i < route.path.length; i++) {
                  if (route.path[i].lineName !== route.path[i - 1].lineName) {
                    const transferStation = route.path[i].station;
                    const key = `${transferStation.name}-${transferStation.lat}-${transferStation.lng}`;
                    transferAndEndStations.set(key, transferStation);
                    
                    // 乗り換え前の駅も追加
                    const prevStation = route.path[i - 1].station;
                    const prevKey = `${prevStation.name}-${prevStation.lat}-${prevStation.lng}`;
                    transferAndEndStations.set(prevKey, prevStation);
                  }
                }
              });
              
              const displayStations = Array.from(transferAndEndStations.values()).map(station => {
                const lineData = lines[station.lineName as keyof typeof lines];
                return {
                  name: station.name,
                  lat: station.lat,
                  lng: station.lng,
                  line: station.lineName,
                  color: lineData?.color || '#000',
                };
              });
              
              return (
                <>
                  <StationMarkers
                    stationList={displayStations}
                    latLngToSvg={latLngToSvgWithBounds}
                    backgroundColor={backgroundColor}
                  />
                  <StationLabels
                    stationList={displayStations}
                    latLngToSvg={latLngToSvgWithBounds}
                    textColor={textColor}
                  />
                </>
              );
            })()}
          </>
        )}
      </g>
    </svg>
  );
};

export default RailwayMap;
