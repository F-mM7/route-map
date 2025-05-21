import "./App.css";
import React from "react";
import RailwayMap from "./RailwayMap";

function App() {
  return (
    <div style={{ padding: 20 }}>
      <h2>路線図（全路線重ねて表示）</h2>
      <RailwayMap />
    </div>
  );
}

export default App;
