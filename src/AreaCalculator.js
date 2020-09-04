import React from 'react';
import PolygonSelector from './PolygonSelector';

const AreaCalculator = ({ name, initialPoints, onComplete }) => {
  const nameRef = React.useRef();
  let points = initialPoints;

  const handlePointsUpdate = (newPoints) => {
    points = newPoints;
  }

  const handleSave = () => {
    onComplete(nameRef.current.value, points);
  }

  console.log(initialPoints);


  return (
    <div>
      <div className="input-container">
        <input ref={nameRef} placeholder="Name the area" value={name} />
        <button onClick={handleSave}>Save</button>
      </div>
      <div className="polygon-wrapper">
        <PolygonSelector points={initialPoints} onChange={handlePointsUpdate} />
      </div>
    </div>
  )
}

export default AreaCalculator;
