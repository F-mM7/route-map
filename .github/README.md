# route-map

鉄道路線図と経路探索を SVG 上に可視化する Web アプリ。

## 機能

- **路線図の俯瞰表示**: `src/lines/` に登録された全路線を 1024×1024 の SVG キャンバスに重ねて描画
- **経路検索**: 出発駅・到着駅を指定し、駅間の地理的距離を「同一視距離（メートル）」で吸収しながら経路を探索（乗り換え駅も含めて表示）
- **ズーム / パン**: マウスドラッグでパン、ホイールでズーム
- **画像エクスポート**: PNG / SVG として現在の表示をダウンロード

## 開発

```bash
npm install
npm run dev      # 開発サーバ
npm run build    # ビルド
npm run lint     # ESLint
npm run deploy   # gh-pages へデプロイ
```

## 技術スタック

React 19 / TypeScript / Vite / SVG（外部地図ライブラリは不使用）
