import lines from "../lines";

interface Station {
  name: string;
  lat: number;
  lng: number;
}

interface StationWithLine extends Station {
  lineName: string;
}

interface TransferStation {
  stations: StationWithLine[];
}

// 距離計算関数
function calcDistance(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const dLat = lat2 - lat1;
  const dLng = toRad(b.lng - a.lng);
  const avgLat = (lat1 + lat2) / 2;
  const R = 6378137;
  const x = dLng * Math.cos(avgLat) * R;
  const y = dLat * R;
  return Math.sqrt(x * x + y * y);
}

// 全駅を路線名付きで取得
function getAllStationsWithLines(): StationWithLine[] {
  const allStations: StationWithLine[] = [];
  
  Object.entries(lines).forEach(([lineName, lineData]) => {
    lineData.stations.forEach(station => {
      allStations.push({
        ...station,
        lineName
      });
    });
  });
  
  return allStations;
}

// 乗り換え可能な駅グループを作成
function buildTransferStations(distanceThreshold: number): TransferStation[] {
  const allStations = getAllStationsWithLines();
  const transferGroups: TransferStation[] = [];
  const processedIndices = new Set<number>();
  
  for (let i = 0; i < allStations.length; i++) {
    if (processedIndices.has(i)) continue;
    
    const group: StationWithLine[] = [allStations[i]];
    processedIndices.add(i);
    
    for (let j = i + 1; j < allStations.length; j++) {
      if (processedIndices.has(j)) continue;
      
      // 同じ駅名または距離が閾値以内
      const isSameName = allStations[i].name === allStations[j].name;
      const isNearby = calcDistance(allStations[i], allStations[j]) < distanceThreshold;
      
      if (isSameName || isNearby) {
        group.push(allStations[j]);
        processedIndices.add(j);
      }
    }
    
    if (group.length > 0) {
      transferGroups.push({ stations: group });
    }
  }
  
  return transferGroups;
}

// 駅名から乗り換えグループを検索
function findTransferGroup(stationName: string, transferGroups: TransferStation[]): TransferStation | null {
  return transferGroups.find(group => 
    group.stations.some(station => station.name === stationName)
  ) || null;
}

// 路線グラフを構築


// 最短乗り換え経路を検索（BFS）
export function findMinTransferRoute(fromStationName: string, toStationName: string, distanceThreshold: number = 300) {
  const transferGroups = buildTransferStations(distanceThreshold);
  
  // 始点と終点の乗り換えグループを検索
  const fromGroup = findTransferGroup(fromStationName, transferGroups);
  const toGroup = findTransferGroup(toStationName, transferGroups);
  
  if (!fromGroup || !toGroup) {
    return {
      error: "指定された駅が見つかりません",
      fromFound: !!fromGroup,
      toFound: !!toGroup
    };
  }
  
  // 同一路線内での直接経路をチェック
  for (const fromStation of fromGroup.stations) {
    for (const toStation of toGroup.stations) {
      if (fromStation.lineName === toStation.lineName) {
        const lineData = lines[fromStation.lineName as keyof typeof lines];
        const fromIndex = lineData.stations.findIndex(s => s.name === fromStation.name);
        const toIndex = lineData.stations.findIndex(s => s.name === toStation.name);
        
        if (fromIndex !== -1 && toIndex !== -1) {
          const start = Math.min(fromIndex, toIndex);
          const end = Math.max(fromIndex, toIndex);
          const path = [];
          
          for (let i = start; i <= end; i++) {
            const station = lineData.stations[i];
            path.push({
              station: { ...station, lineName: fromStation.lineName },
              lineName: fromStation.lineName
            });
          }
          
          return {
            path,
            transfers: 0,
            error: null
          };
        }
      }
    }
  }
  
  // BFSで最短乗り換え経路を検索
  const queue: Array<{
    transferGroup: TransferStation;
    path: Array<{ station: StationWithLine; lineName: string }>;
    transfers: number;
    currentLine: string | null;
  }> = [];
  
  const visited = new Set<TransferStation>();
  
  // 始点からの初期化
  fromGroup.stations.forEach(station => {
    queue.push({
      transferGroup: fromGroup,
      path: [{ station, lineName: station.lineName }],
      transfers: 0,
      currentLine: station.lineName
    });
  });
  
  visited.add(fromGroup);
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    
    // 終点に到達
    if (current.transferGroup === toGroup) {
      return {
        path: current.path,
        transfers: current.transfers,
        error: null
      };
    }
    
    // 現在の乗り換えグループから行ける次の駅を探索
    current.transferGroup.stations.forEach(currentStation => {
      const lineData = lines[currentStation.lineName as keyof typeof lines];
      const stationIndex = lineData.stations.findIndex(s => s.name === currentStation.name);
      
      // 同じ路線の前後の駅のみを隣接として扱う
      const neighbors: Station[] = [];
      if (stationIndex > 0) neighbors.push(lineData.stations[stationIndex - 1]);
      if (stationIndex < lineData.stations.length - 1) neighbors.push(lineData.stations[stationIndex + 1]);
      
      neighbors.forEach(neighbor => {
        const neighborGroup = findTransferGroup(neighbor.name, transferGroups);
        if (neighborGroup && !visited.has(neighborGroup)) {
          visited.add(neighborGroup);
          
          const isTransfer = current.currentLine !== currentStation.lineName;
          const newTransfers = current.transfers + (isTransfer ? 1 : 0);
          
          // 経路の完全な駅列を生成
          let fullPath = [...current.path];
          
          // 現在の駅から隣接駅までの間の全駅を取得
          const currentIndex = lineData.stations.findIndex(s => s.name === currentStation.name);
          const neighborIndex = lineData.stations.findIndex(s => s.name === neighbor.name);
          
          if (currentIndex !== -1 && neighborIndex !== -1) {
            const start = Math.min(currentIndex, neighborIndex);
            const end = Math.max(currentIndex, neighborIndex);
            
            // 経路が空の場合（始点）は現在駅から開始
            if (current.path.length === 1) {
              fullPath = [{
                station: { ...currentStation, lineName: currentStation.lineName },
                lineName: currentStation.lineName
              }];
              
              // 現在駅から隣接駅まで全て追加
              for (let i = start + 1; i <= end; i++) {
                const station = lineData.stations[i];
                fullPath.push({
                  station: { ...station, lineName: currentStation.lineName },
                  lineName: currentStation.lineName
                });
              }
            } else {
              // 現在駅の次の駅から隣接駅まで全て追加
              for (let i = start + 1; i <= end; i++) {
                const station = lineData.stations[i];
                fullPath.push({
                  station: { ...station, lineName: currentStation.lineName },
                  lineName: currentStation.lineName
                });
              }
            }
          }
          
          queue.push({
            transferGroup: neighborGroup,
            path: fullPath,
            transfers: newTransfers,
            currentLine: currentStation.lineName
          });
        }
      });
    });
  }
  
  return {
    error: "経路が見つかりません",
    path: null,
    transfers: null
  };
}

// 駅名の候補を取得（オートコンプリート用）
export function getStationNames(): string[] {
  const stationSet = new Set<string>();
  
  Object.values(lines).forEach(line => {
    line.stations.forEach(station => {
      stationSet.add(station.name);
    });
  });
  
  return Array.from(stationSet).sort();
}