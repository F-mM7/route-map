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
    lastStation: StationWithLine;
  }> = [];
  
  const visited = new Set<TransferStation>();
  
  // 始点からの初期化 - 指定された駅名に一致する駅のみを使用
  const startStations = fromGroup.stations.filter(s => s.name === fromStationName);
  if (startStations.length === 0) {
    return {
      error: "指定された始点駅が見つかりません",
      path: null,
      transfers: null
    };
  }
  
  startStations.forEach(station => {
    queue.push({
      transferGroup: fromGroup,
      path: [{ station, lineName: station.lineName }],
      transfers: 0,
      lastStation: station
    });
  });
  
  visited.add(fromGroup);
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    
    // 終点に到達
    if (current.transferGroup === toGroup) {
      // 終点グループの中で実際の目的駅を見つける
      const targetStation = toGroup.stations.find(s => s.name === toStationName);
      if (targetStation) {
        // 現在のパスの最後の駅から目的駅までの経路を補完
        const lastPathItem = current.path[current.path.length - 1];
        let finalPath = [...current.path];
        
        // 最後の駅と目的駅が異なる場合、経路を補完
        if (lastPathItem.station.name !== targetStation.name) {
          // 同じ乗り換えグループ内の駅を探す
          const lastStation = toGroup.stations.find(s => 
            s.name === lastPathItem.station.name && s.lineName === lastPathItem.lineName
          );
          const finalStation = toGroup.stations.find(s => 
            s.name === targetStation.name
          );
          
          if (lastStation && finalStation && lastStation.lineName === finalStation.lineName) {
            // 同じ路線内で移動
            const lineData = lines[lastStation.lineName as keyof typeof lines];
            const lastIndex = lineData.stations.findIndex(s => s.name === lastStation.name);
            const finalIndex = lineData.stations.findIndex(s => s.name === finalStation.name);
            
            if (lastIndex !== -1 && finalIndex !== -1) {
              const start = Math.min(lastIndex, finalIndex);
              const end = Math.max(lastIndex, finalIndex);
              
              // 最後の駅の次から目的駅まで追加
              for (let i = start + 1; i <= end; i++) {
                const station = lineData.stations[i];
                finalPath.push({
                  station: { ...station, lineName: lastStation.lineName },
                  lineName: lastStation.lineName
                });
              }
            }
          }
        }
        
        return {
          path: finalPath,
          transfers: current.transfers,
          error: null
        };
      }
      
      return {
        path: current.path,
        transfers: current.transfers,
        error: null
      };
    }
    
    // 現在の乗り換えグループから行ける次の駅を探索
    current.transferGroup.stations.forEach(currentStation => {
      // 乗り換えが必要かチェック
      const isTransfer = current.lastStation.lineName !== currentStation.lineName;
      
      // 乗り換えが必要な場合は、現在の駅を経路に追加
      let pathToCurrentStation = [...current.path];
      if (isTransfer) {
        // 乗り換え駅を新しい路線として追加
        pathToCurrentStation.push({
          station: { ...currentStation, lineName: currentStation.lineName },
          lineName: currentStation.lineName
        });
      }
      
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
          
          const newTransfers = current.transfers + (isTransfer ? 1 : 0);
          
          // 経路を構築：現在の駅から隣接駅までの全駅を追加
          let newPath = [...pathToCurrentStation];
          
          // 現在の駅から隣接駅までの間の全駅を取得
          const currentIndex = lineData.stations.findIndex(s => s.name === currentStation.name);
          const neighborIndex = lineData.stations.findIndex(s => s.name === neighbor.name);
          
          if (currentIndex !== -1 && neighborIndex !== -1) {
            const step = currentIndex < neighborIndex ? 1 : -1;
            
            // 現在駅の次の駅から隣接駅まで順番に追加
            for (let i = currentIndex + step; i !== neighborIndex + step; i += step) {
              const station = lineData.stations[i];
              newPath.push({
                station: { ...station, lineName: currentStation.lineName },
                lineName: currentStation.lineName
              });
            }
          }
          
          queue.push({
            transferGroup: neighborGroup,
            path: newPath,
            transfers: newTransfers,
            lastStation: { ...neighbor, lineName: currentStation.lineName }
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

// 最小乗り換え回数の全経路を検索
export function findAllMinTransferRoutes(fromStationName: string, toStationName: string, distanceThreshold: number = 300) {
  const transferGroups = buildTransferStations(distanceThreshold);
  
  // 始点と終点の乗り換えグループを検索
  const fromGroup = findTransferGroup(fromStationName, transferGroups);
  const toGroup = findTransferGroup(toStationName, transferGroups);
  
  if (!fromGroup || !toGroup) {
    return {
      error: "指定された駅が見つかりません",
      fromFound: !!fromGroup,
      toFound: !!toGroup,
      routes: []
    };
  }
  
  // 同一路線内での直接経路をチェック
  const directRoutes: Array<{ path: any[], transfers: number }> = [];
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
          
          directRoutes.push({ path, transfers: 0 });
        }
      }
    }
  }
  
  if (directRoutes.length > 0) {
    return {
      routes: directRoutes,
      minTransfers: 0,
      error: null
    };
  }
  
  // BFSで最短乗り換え経路を全て検索
  const queue: Array<{
    transferGroup: TransferStation;
    path: Array<{ station: StationWithLine; lineName: string }>;
    transfers: number;
    lastStation: StationWithLine;
    visitedGroups: Set<TransferStation>;
  }> = [];
  
  let minTransfers = Infinity;
  const allRoutes: Array<{ path: any[], transfers: number }> = [];
  
  // 始点からの初期化
  const startStations = fromGroup.stations.filter(s => s.name === fromStationName);
  if (startStations.length === 0) {
    return {
      error: "指定された始点駅が見つかりません",
      routes: [],
      minTransfers: null
    };
  }
  
  startStations.forEach(station => {
    const visitedGroups = new Set<TransferStation>();
    visitedGroups.add(fromGroup);
    queue.push({
      transferGroup: fromGroup,
      path: [{ station, lineName: station.lineName }],
      transfers: 0,
      lastStation: station,
      visitedGroups
    });
  });
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    
    // 既に見つかった最小乗り換え回数より多い場合はスキップ
    if (current.transfers > minTransfers) {
      continue;
    }
    
    // 終点に到達
    if (current.transferGroup === toGroup) {
      const targetStation = toGroup.stations.find(s => s.name === toStationName);
      if (targetStation) {
        const lastPathItem = current.path[current.path.length - 1];
        let finalPath = [...current.path];
        
        if (lastPathItem.station.name !== targetStation.name) {
          const lastStation = toGroup.stations.find(s => 
            s.name === lastPathItem.station.name && s.lineName === lastPathItem.lineName
          );
          const finalStation = toGroup.stations.find(s => 
            s.name === targetStation.name
          );
          
          if (lastStation && finalStation && lastStation.lineName === finalStation.lineName) {
            const lineData = lines[lastStation.lineName as keyof typeof lines];
            const lastIndex = lineData.stations.findIndex(s => s.name === lastStation.name);
            const finalIndex = lineData.stations.findIndex(s => s.name === finalStation.name);
            
            if (lastIndex !== -1 && finalIndex !== -1) {
              const start = Math.min(lastIndex, finalIndex);
              const end = Math.max(lastIndex, finalIndex);
              
              for (let i = start + 1; i <= end; i++) {
                const station = lineData.stations[i];
                finalPath.push({
                  station: { ...station, lineName: lastStation.lineName },
                  lineName: lastStation.lineName
                });
              }
            }
          }
        }
        
        // 最小乗り換え回数を更新
        if (current.transfers < minTransfers) {
          minTransfers = current.transfers;
          allRoutes.length = 0; // 古い経路をクリア
        }
        
        // 同じ乗り換え回数の経路を追加
        if (current.transfers === minTransfers) {
          allRoutes.push({
            path: finalPath,
            transfers: current.transfers
          });
        }
      }
      continue;
    }
    
    // 現在の乗り換えグループから行ける次の駅を探索
    current.transferGroup.stations.forEach(currentStation => {
      const isTransfer = current.lastStation.lineName !== currentStation.lineName;
      
      let pathToCurrentStation = [...current.path];
      if (isTransfer) {
        pathToCurrentStation.push({
          station: { ...currentStation, lineName: currentStation.lineName },
          lineName: currentStation.lineName
        });
      }
      
      const lineData = lines[currentStation.lineName as keyof typeof lines];
      const stationIndex = lineData.stations.findIndex(s => s.name === currentStation.name);
      
      const neighbors: Station[] = [];
      if (stationIndex > 0) neighbors.push(lineData.stations[stationIndex - 1]);
      if (stationIndex < lineData.stations.length - 1) neighbors.push(lineData.stations[stationIndex + 1]);
      
      neighbors.forEach(neighbor => {
        const neighborGroup = findTransferGroup(neighbor.name, transferGroups);
        if (neighborGroup && !current.visitedGroups.has(neighborGroup)) {
          const newVisitedGroups = new Set(current.visitedGroups);
          newVisitedGroups.add(neighborGroup);
          
          const newTransfers = current.transfers + (isTransfer ? 1 : 0);
          
          // 既に見つかった最小乗り換え回数より多い場合はスキップ
          if (newTransfers > minTransfers) {
            return;
          }
          
          let newPath = [...pathToCurrentStation];
          
          const currentIndex = lineData.stations.findIndex(s => s.name === currentStation.name);
          const neighborIndex = lineData.stations.findIndex(s => s.name === neighbor.name);
          
          if (currentIndex !== -1 && neighborIndex !== -1) {
            const step = currentIndex < neighborIndex ? 1 : -1;
            
            for (let i = currentIndex + step; i !== neighborIndex + step; i += step) {
              const station = lineData.stations[i];
              newPath.push({
                station: { ...station, lineName: currentStation.lineName },
                lineName: currentStation.lineName
              });
            }
          }
          
          queue.push({
            transferGroup: neighborGroup,
            path: newPath,
            transfers: newTransfers,
            lastStation: { ...neighbor, lineName: currentStation.lineName },
            visitedGroups: newVisitedGroups
          });
        }
      });
    });
  }
  
  if (allRoutes.length === 0) {
    return {
      error: "経路が見つかりません",
      routes: [],
      minTransfers: null
    };
  }
  
  return {
    routes: allRoutes,
    minTransfers,
    error: null
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