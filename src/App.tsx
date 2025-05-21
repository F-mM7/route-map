import "./App.css";
import React, { useRef, useState } from "react";

// 路線データ（駅リスト・色など）をまとめて管理
const lines = {
  三田線: {
    color: "#0072bc",
    stations: [
      { name: "目黒", lat: 35.633998, lng: 139.715719 },
      { name: "白金台", lat: 35.638202, lng: 139.726136 },
      { name: "白金高輪", lat: 35.645736, lng: 139.736294 },
      { name: "三田", lat: 35.648415, lng: 139.747634 },
      { name: "芝公園", lat: 35.654895, lng: 139.749634 },
      { name: "御成門", lat: 35.661307, lng: 139.753372 },
      { name: "内幸町", lat: 35.666295, lng: 139.757684 },
      { name: "日比谷", lat: 35.674927, lng: 139.760908 },
      { name: "大手町", lat: 35.687406, lng: 139.767125 },
      { name: "神保町", lat: 35.695027, lng: 139.757765 },
      { name: "水道橋", lat: 35.702069, lng: 139.752802 },
      { name: "春日", lat: 35.708355, lng: 139.751891 },
      { name: "白山", lat: 35.722022, lng: 139.751219 },
      { name: "千石", lat: 35.731247, lng: 139.744697 },
      { name: "巣鴨", lat: 35.733923, lng: 139.739047 },
      { name: "西巣鴨", lat: 35.745028, lng: 139.728338 },
      { name: "新板橋", lat: 35.751432, lng: 139.718857 },
      { name: "板橋区役所前", lat: 35.754824, lng: 139.710885 },
      { name: "板橋本町", lat: 35.759234, lng: 139.702857 },
      { name: "本蓮沼", lat: 35.765003, lng: 139.692857 },
      { name: "志村坂上", lat: 35.771003, lng: 139.683857 },
      { name: "志村三丁目", lat: 35.778003, lng: 139.673857 },
      { name: "蓮根", lat: 35.785003, lng: 139.664857 },
      { name: "西台", lat: 35.790003, lng: 139.655857 },
      { name: "高島平", lat: 35.796003, lng: 139.646857 },
      { name: "新高島平", lat: 35.801003, lng: 139.637857 },
      { name: "西高島平", lat: 35.807003, lng: 139.628857 },
    ],
  },
  新宿線: {
    color: "#8dc21f",
    stations: [
      { name: "新宿", lat: 35.690921, lng: 139.700257 },
      { name: "新宿三丁目", lat: 35.688079, lng: 139.704051 },
      { name: "曙橋", lat: 35.693003, lng: 139.719003 },
      { name: "市ヶ谷", lat: 35.693003, lng: 139.735003 },
      { name: "九段下", lat: 35.695003, lng: 139.751003 },
      { name: "神保町", lat: 35.695027, lng: 139.757765 },
      { name: "小川町", lat: 35.695003, lng: 139.766003 },
      { name: "岩本町", lat: 35.694003, lng: 139.776003 },
      { name: "馬喰横山", lat: 35.690003, lng: 139.784003 },
      { name: "浜町", lat: 35.687003, lng: 139.792003 },
      { name: "森下", lat: 35.682003, lng: 139.800003 },
      { name: "菊川", lat: 35.682003, lng: 139.813003 },
      { name: "住吉", lat: 35.682003, lng: 139.826003 },
      { name: "西大島", lat: 35.689003, lng: 139.837003 },
      { name: "大島", lat: 35.689003, lng: 139.849003 },
      { name: "東大島", lat: 35.689003, lng: 139.862003 },
      { name: "船堀", lat: 35.689003, lng: 139.873003 },
      { name: "一之江", lat: 35.689003, lng: 139.885003 },
      { name: "瑞江", lat: 35.689003, lng: 139.897003 },
      { name: "篠崎", lat: 35.689003, lng: 139.909003 },
      { name: "本八幡", lat: 35.720003, lng: 139.928003 },
    ],
  },
  小田急線: {
    color: "#00a7db",
    stations: [
      { name: "新宿", lat: 35.690921, lng: 139.700257 },
      { name: "南新宿", lat: 35.683003, lng: 139.698003 },
      { name: "参宮橋", lat: 35.676003, lng: 139.692003 },
      { name: "代々木八幡", lat: 35.669003, lng: 139.683003 },
      { name: "代々木上原", lat: 35.668003, lng: 139.677003 },
      { name: "東北沢", lat: 35.662003, lng: 139.673003 },
      { name: "下北沢", lat: 35.661003, lng: 139.668003 },
      { name: "世田谷代田", lat: 35.656003, lng: 139.661003 },
      { name: "梅ヶ丘", lat: 35.655003, lng: 139.655003 },
      { name: "豪徳寺", lat: 35.653003, lng: 139.648003 },
      { name: "経堂", lat: 35.651003, lng: 139.642003 },
      { name: "千歳船橋", lat: 35.648003, lng: 139.634003 },
      { name: "祖師ヶ谷大蔵", lat: 35.646003, lng: 139.624003 },
      { name: "成城学園前", lat: 35.643003, lng: 139.614003 },
      { name: "喜多見", lat: 35.641003, lng: 139.606003 },
      { name: "狛江", lat: 35.639003, lng: 139.599003 },
      { name: "和泉多摩川", lat: 35.637003, lng: 139.591003 },
      { name: "登戸", lat: 35.620003, lng: 139.570003 },
      { name: "向ヶ丘遊園", lat: 35.617003, lng: 139.563003 },
      { name: "生田", lat: 35.611003, lng: 139.546003 },
      { name: "読売ランド前", lat: 35.606003, lng: 139.534003 },
      { name: "百合ヶ丘", lat: 35.603003, lng: 139.527003 },
      { name: "新百合ヶ丘", lat: 35.602003, lng: 139.516003 },
      { name: "柿生", lat: 35.601003, lng: 139.505003 },
      { name: "鶴川", lat: 35.603003, lng: 139.484003 },
      { name: "玉川学園前", lat: 35.606003, lng: 139.472003 },
      { name: "町田", lat: 35.546003, lng: 139.450003 },
      // 必要に応じてさらに追加
    ],
  },
  井の頭線: {
    color: "#e9546b",
    stations: [
      { name: "渋谷", lat: 35.658034, lng: 139.701636 },
      { name: "神泉", lat: 35.656003, lng: 139.692003 },
      { name: "駒場東大前", lat: 35.655003, lng: 139.683003 },
      { name: "池ノ上", lat: 35.656003, lng: 139.673003 },
      { name: "下北沢", lat: 35.661003, lng: 139.668003 },
      { name: "新代田", lat: 35.664003, lng: 139.660003 },
      { name: "東松原", lat: 35.667003, lng: 139.653003 },
      { name: "明大前", lat: 35.668003, lng: 139.650003 },
      { name: "永福町", lat: 35.673003, lng: 139.636003 },
      { name: "西永福", lat: 35.676003, lng: 139.629003 },
      { name: "浜田山", lat: 35.680003, lng: 139.623003 },
      { name: "高井戸", lat: 35.684003, lng: 139.614003 },
      { name: "富士見ヶ丘", lat: 35.688003, lng: 139.606003 },
      { name: "久我山", lat: 35.691003, lng: 139.599003 },
      { name: "三鷹台", lat: 35.697003, lng: 139.589003 },
      { name: "井の頭公園", lat: 35.701003, lng: 139.582003 },
      { name: "吉祥寺", lat: 35.703306, lng: 139.579493 },
    ],
  },
  中央総武線: {
    color: "#f7d31d",
    stations: [
      { name: "三鷹", lat: 35.703097, lng: 139.560997 },
      { name: "吉祥寺", lat: 35.703306, lng: 139.579493 },
      { name: "西荻窪", lat: 35.703003, lng: 139.601003 },
      { name: "荻窪", lat: 35.704003, lng: 139.620003 },
      { name: "阿佐ヶ谷", lat: 35.705003, lng: 139.635003 },
      { name: "高円寺", lat: 35.706003, lng: 139.650003 },
      { name: "中野", lat: 35.707003, lng: 139.665003 },
      { name: "東中野", lat: 35.708003, lng: 139.684003 },
      { name: "大久保", lat: 35.700003, lng: 139.697003 },
      { name: "新宿", lat: 35.690921, lng: 139.700257 },
      { name: "代々木", lat: 35.683003, lng: 139.702003 },
      { name: "千駄ケ谷", lat: 35.678003, lng: 139.712003 },
      { name: "信濃町", lat: 35.676003, lng: 139.719003 },
      { name: "四ツ谷", lat: 35.686003, lng: 139.730003 },
      { name: "市ヶ谷", lat: 35.693003, lng: 139.735003 },
      { name: "飯田橋", lat: 35.701003, lng: 139.746003 },
      { name: "水道橋", lat: 35.702069, lng: 139.752802 },
      { name: "御茶ノ水", lat: 35.700003, lng: 139.765003 },
      { name: "秋葉原", lat: 35.698003, lng: 139.774003 },
      { name: "浅草橋", lat: 35.697003, lng: 139.785003 },
      { name: "両国", lat: 35.696003, lng: 139.796003 },
      { name: "錦糸町", lat: 35.697003, lng: 139.815003 },
      { name: "亀戸", lat: 35.697003, lng: 139.827003 },
      { name: "平井", lat: 35.707003, lng: 139.842003 },
      { name: "新小岩", lat: 35.716003, lng: 139.856003 },
      { name: "小岩", lat: 35.733003, lng: 139.872003 },
      { name: "市川", lat: 35.728003, lng: 139.908003 },
      { name: "本八幡", lat: 35.720003, lng: 139.928003 },
    ],
  },
  // 今後追加したい路線はここに追加
};

// 表示領域サイズ（縦横別々に指定可能）
const VIEW_WIDTH = 700;
const VIEW_HEIGHT = 700;

// 全駅の緯度経度範囲を自動計算
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

const bounds = getLatLngBounds();

// 緯度経度をSVG座標に変換（全駅が必ず収まるようにスケーリング＆中央寄せ）
function latLngToSvg(lat: number, lng: number) {
  // 地理的範囲（全駅分）
  const { minLat, maxLat, minLng, maxLng } = bounds;
  // 東京付近の緯度1度と経度1度の距離比（cos緯度で補正）
  const latCenter = (minLat + maxLat) / 2;
  const lngScale = Math.cos((latCenter * Math.PI) / 180);

  // 地理的な幅・高さ（km相当の比率）
  const geoWidth = (maxLng - minLng) * lngScale;
  const geoHeight = maxLat - minLat;
  // 表示領域に収めるスケール
  const scale = Math.min(VIEW_WIDTH / geoWidth, VIEW_HEIGHT / geoHeight);

  // 余白（中央寄せ）
  const offsetX = (VIEW_WIDTH - geoWidth * scale) / 2;
  const offsetY = (VIEW_HEIGHT - geoHeight * scale) / 2;

  // 緯度経度→SVG座標
  const x = offsetX + (lng - minLng) * lngScale * scale;
  const y = VIEW_HEIGHT - (offsetY + (lat - minLat) * scale);
  return { x, y };
}

// 路線名を指定して描画する汎用コンポーネント
const LineMap: React.FC<{ lineName: string }> = ({ lineName }) => {
  const line = lines[lineName];
  if (!line) return <div>路線データがありません</div>;
  return (
    <svg
      width={VIEW_WIDTH}
      height={VIEW_HEIGHT}
      style={{
        background: "#f9f9f9",
        border: "1px solid #ccc",
        marginBottom: 32,
      }}
    >
      {/* 駅間を線で結ぶ */}
      <polyline
        fill="none"
        stroke={line.color}
        strokeWidth={4}
        points={line.stations
          .map((st) => {
            const { x, y } = latLngToSvg(st.lat, st.lng);
            return `${x},${y}`;
          })
          .join(" ")}
      />
      {/* 駅をプロット */}
      {line.stations.map((station) => {
        const { x, y } = latLngToSvg(station.lat, station.lng);
        return (
          <g key={station.name}>
            <circle
              cx={x}
              cy={y}
              r={8}
              fill="#fff"
              stroke={line.color}
              strokeWidth={3}
            />
            <text
              x={x + 12}
              y={y + 4}
              fontSize={14}
              fill="#333"
              fontFamily="sans-serif"
            >
              {station.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// 全路線を重ねて描画するコンポーネント
const AllLinesMap: React.FC = () => (
  <svg
    width={VIEW_WIDTH}
    height={VIEW_HEIGHT}
    style={{
      background: "#f9f9f9",
      border: "1px solid #ccc",
      marginBottom: 32,
    }}
  >
    {Object.entries(lines).map(([lineName, line]) => (
      <g key={lineName}>
        {/* 駅間を線で結ぶ */}
        <polyline
          fill="none"
          stroke={line.color}
          strokeWidth={4}
          points={line.stations
            .map((st) => {
              const { x, y } = latLngToSvg(st.lat, st.lng);
              return `${x},${y}`;
            })
            .join(" ")}
        />
        {/* 駅をプロット */}
        {line.stations.map((station) => {
          const { x, y } = latLngToSvg(station.lat, station.lng);
          return (
            <g key={station.name}>
              <circle
                cx={x}
                cy={y}
                r={8}
                fill="#fff"
                stroke={line.color}
                strokeWidth={3}
              />
              <text
                x={x + 12}
                y={y + 4}
                fontSize={14}
                fill="#333"
                fontFamily="sans-serif"
              >
                {station.name}
              </text>
            </g>
          );
        })}
      </g>
    ))}
  </svg>
);

function App() {
  // ズーム・パン用の状態
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  // ホイールでズーム
  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const scale = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom((z) => Math.max(1, Math.min(5, z * scale)));
  };

  // ドラッグでパン
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    setDragging(true);
    lastPos.current = { x: e.clientX, y: e.clientY };
  };
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragging || !lastPos.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    setOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    lastPos.current = { x: e.clientX, y: e.clientY };
  };
  const handleMouseUp = () => {
    setDragging(false);
    lastPos.current = null;
  };

  // AllLinesMapをラップしてズーム・パンを適用
  return (
    <div style={{ padding: 20 }}>
      <h2>路線図（全路線重ねて表示）</h2>
      <svg
        width={VIEW_WIDTH}
        height={VIEW_HEIGHT}
        style={{
          background: "#f9f9f9",
          border: "1px solid #ccc",
          marginBottom: 32,
          cursor: dragging ? "grabbing" : "grab",
          userSelect: "none",
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <g transform={`translate(${offset.x},${offset.y}) scale(${zoom})`}>
          {/* ...AllLinesMapの中身をここに直接展開... */}
          {Object.entries(lines).map(([lineName, line]) => (
            <g key={lineName}>
              {/* 駅間を線で結ぶ */}
              <polyline
                fill="none"
                stroke={line.color}
                strokeWidth={4}
                points={line.stations
                  .map((st) => {
                    const { x, y } = latLngToSvg(st.lat, st.lng);
                    return `${x},${y}`;
                  })
                  .join(" ")}
              />
              {/* 駅をプロット */}
              {line.stations.map((station) => {
                const { x, y } = latLngToSvg(station.lat, station.lng);
                return (
                  <g key={station.name}>
                    <circle
                      cx={x}
                      cy={y}
                      r={8}
                      fill="#fff"
                      stroke={line.color}
                      strokeWidth={3}
                    />
                    <text
                      x={x + 12}
                      y={y + 4}
                      fontSize={14}
                      fill="#333"
                      fontFamily="sans-serif"
                    >
                      {station.name}
                    </text>
                  </g>
                );
              })}
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}

export default App;
