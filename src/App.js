import React from 'react';
import './App.css';
import PolygonSelector from './PolygonSelector';

function App() {
  return (
    <div className="App">
      <div className="star-wrapper">
        <PolygonSelector onChange={(points) => console.log(points)} />
      </div>
    </div >
  );
}

export default App;
