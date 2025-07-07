import React, { useState, useRef, useEffect } from 'react';
import { findMinTransferRoute, getStationNames } from '../utils/routeFinder';
import { colors, fontSize, spacing, borderRadius } from '../styles/constants';

interface Route {
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
}

interface RouteSearchProps {
  onRoutesFound: (routes: Route[]) => void;
  distanceThreshold: number;
}

const RouteSearch: React.FC<RouteSearchProps> = ({ onRoutesFound, distanceThreshold }) => {
  const [selectedStations, setSelectedStations] = useState<string[]>(['新宿', '下北沢']);
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState<string>('');
  
  const inputRef = useRef<HTMLInputElement>(null);
  const stationNames = getStationNames();

  // 入力値に基づいて候補を絞り込む
  const filterSuggestions = (input: string): string[] => {
    if (!input) return [];
    const lowerInput = input.toLowerCase();
    return stationNames
      .filter(name => 
        name.toLowerCase().includes(lowerInput) && 
        !selectedStations.includes(name)
      )
      .slice(0, 10);
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
    setSuggestions(filterSuggestions(value));
    setShowSuggestions(true);
  };

  const addStation = (station: string) => {
    if (!selectedStations.includes(station)) {
      setSelectedStations([...selectedStations, station]);
    }
    setInputValue('');
    setShowSuggestions(false);
  };

  const removeStation = (station: string) => {
    setSelectedStations(selectedStations.filter(s => s !== station));
  };

  const clearAllStations = () => {
    setSelectedStations([]);
  };

  const handleSearch = () => {
    if (selectedStations.length < 2) {
      setError('2つ以上の駅を選択してください');
      return;
    }

    setError('');
    
    // 全ての駅ペアの組み合わせを計算
    const routes: Route[] = [];
    
    for (let i = 0; i < selectedStations.length; i++) {
      for (let j = i + 1; j < selectedStations.length; j++) {
        const routeResult = findMinTransferRoute(selectedStations[i], selectedStations[j], distanceThreshold);
        
        if (!routeResult.error) {
          routes.push({
            from: selectedStations[i],
            to: selectedStations[j],
            ...routeResult
          });
        }
      }
    }
    
    if (routes.length === 0) {
      setError('有効な経路が見つかりませんでした');
    } else {
      // デバッグ用：経路の詳細をコンソールに出力
      routes.forEach((route, index) => {
        console.log(`Route ${index + 1}: ${route.from} → ${route.to}`);
        console.log('Path:', route.path.map(p => `${p.station.name} (${p.lineName})`));
        console.log('---');
      });
      onRoutesFound(routes);
    }
  };

  // 外側をクリックしたときに候補を非表示
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div style={{ marginBottom: spacing.xl }}>
      <h3 style={{ color: colors.text.primary, marginBottom: spacing.md }}>経路検索（複数駅対応）</h3>
      
      <div style={{ marginBottom: spacing.md }}>
        <div style={{ position: 'relative', marginBottom: spacing.md }} ref={inputRef}>
          <input
            type="text"
            placeholder="駅名を入力して追加"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && suggestions.length > 0) {
                addStation(suggestions[0]);
              }
            }}
            style={{ width: '300px', padding: spacing.sm, fontSize: fontSize.normal, border: `1px solid ${colors.border.primary}`, borderRadius: borderRadius.small, color: colors.text.input, backgroundColor: colors.background.primary }}
          />
          {showSuggestions && suggestions.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              width: '300px',
              background: colors.background.dropdown,
              border: `1px solid ${colors.border.dropdown}`,
              borderTop: 'none',
              maxHeight: '200px',
              overflowY: 'auto',
              zIndex: 1000
            }}>
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  onClick={() => addStation(suggestion)}
                  style={{
                    padding: spacing.sm,
                    cursor: 'pointer',
                    borderBottom: `1px solid ${colors.border.secondary}`,
                    color: colors.text.dropdown,
                    backgroundColor: colors.background.dropdown
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.background.hover;
                    e.currentTarget.style.color = colors.text.dropdown;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colors.background.dropdown;
                    e.currentTarget.style.color = colors.text.dropdown;
                  }}
                >
                  {suggestion}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginBottom: spacing.md, display: 'flex', alignItems: 'center', gap: spacing.md }}>
          <strong style={{ color: colors.text.primary }}>選択された駅:</strong>
          {selectedStations.length === 0 ? (
            <span style={{ color: colors.text.placeholder }}>なし</span>
          ) : (
            <button
              onClick={clearAllStations}
              style={{
                padding: `${spacing.xs} ${spacing.sm}`,
                fontSize: fontSize.small,
                backgroundColor: colors.button.secondary || '#f5f5f5',
                color: colors.text.secondary,
                border: '1px solid #ddd',
                borderRadius: borderRadius.small,
                cursor: 'pointer',
              }}
            >
              すべてクリア
            </button>
          )}
        </div>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md }}>
          {selectedStations.map((station, index) => (
            <div
              key={index}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: `${spacing.xs} ${spacing.sm}`,
                backgroundColor: colors.station.tag,
                borderRadius: borderRadius.small,
                fontSize: fontSize.normal,
                color: colors.station.tagText
              }}
            >
              {station}
              <button
                onClick={() => removeStation(station)}
                style={{
                  marginLeft: spacing.sm,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: fontSize.medium,
                  padding: 0,
                  color: colors.text.secondary
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={handleSearch}
          disabled={selectedStations.length < 2}
          style={{
            padding: `${spacing.sm} ${spacing.lg}`,
            fontSize: fontSize.normal,
            backgroundColor: selectedStations.length < 2 ? colors.button.disabled : colors.button.primary,
            color: colors.button.primaryText,
            border: 'none',
            borderRadius: borderRadius.small,
            cursor: selectedStations.length < 2 ? 'default' : 'pointer',
            color: selectedStations.length < 2 ? colors.button.disabledText : colors.button.primaryText
          }}
        >
          経路を検索
        </button>
      </div>

      {error && (
        <div style={{ color: colors.text.error, marginBottom: spacing.md }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default RouteSearch;