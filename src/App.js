import React from 'react';
import './App.css';
import interact from 'interactjs'

function App() {
  const sns = 'http://www.w3.org/2000/svg'
  const xns = 'http://www.w3.org/1999/xlink'
  let root
  let star
  let rootMatrix
  const originalPoints = []
  const pointHandles = []
  const originalPaths = []
  const pathHandles = []
  let transformedPoints = []

  React.useEffect(() => {
    root = document.getElementById('svg-edit-demo')
    star = document.getElementById('edit-star')

    generateHandles();

    interact(root)
      .on('mousedown', applyTransforms)
      .on('touchstart', applyTransforms)

    interact('.point-handle')
      .draggable({
        onstart: function (event) {
          root.setAttribute('class', 'dragging')
        },
        onmove: function (event) {
          const i = event.target.getAttribute('data-index') | 0
          const point = star.points.getItem(i)
          const line1 = originalPaths[i];
          const line2 = originalPaths[(i - 1 + originalPaths.length) % originalPaths.length];

          point.x += event.dx / rootMatrix.a
          point.y += event.dy / rootMatrix.d

          line1.x1.baseVal.value += event.dx / rootMatrix.a
          line1.y1.baseVal.value += event.dy / rootMatrix.d

          line2.x2.baseVal.value += event.dx / rootMatrix.a
          line2.y2.baseVal.value += event.dy / rootMatrix.d

          event.target.x.baseVal.value = point.x
          event.target.y.baseVal.value = point.y
        },
        onend: function (event) {
          root.setAttribute('class', '')
        },
        snap: {
          targets: originalPoints,
          range: 10,
          relativePoints: [{ x: 0.5, y: 0.5 }],
        },
        restrict: { restriction: document.rootElement },
      })
      .styleCursor(false)

    interact('.line-handle')
      .on('mousedown', addNewNode)
      .on('touchstart', addNewNode)

    document.addEventListener('dragstart', (event) => {
      event.preventDefault()
    })
  }, []);

  const generateHandles = () => {
    generatePoints();
    generateLines();
  }

  const generatePoints = () => {
    for(let i = 0; i < star.points.numberOfItems; i ++) {
      generatePoint(star.points.getItem(i), i)
    }
  }

  const generatePoint = (point, index) => {
    const handle = document.createElementNS(sns, 'use')
    const newPoint = root.createSVGPoint()

    handle.setAttributeNS(xns, 'href', '#point-handle')
    handle.setAttribute('class', 'point-handle')

    handle.x.baseVal.value = newPoint.x = point.x
    handle.y.baseVal.value = newPoint.y = point.y

    handle.setAttribute('data-index', index)

    originalPoints.splice(index, 0, newPoint);
    pointHandles.splice(index, 0, handle);

    root.appendChild(handle)
  }

  const generateLines = () => {
    originalPoints.forEach((point, index) => {
      const handle = generateLine(point, originalPoints[(index + 1) % originalPoints.length], index)
      root.insertBefore(handle, star.nextSibling)
      originalPaths.push(handle)
    })
  }

  const generateLine = (point1, point2, index) => {
    const handle = document.createElementNS(sns, 'line')

    handle.setAttributeNS(xns, 'href', '#line-handle')
    handle.setAttribute('class', 'line-handle')

    handle.x1.baseVal.value = point1.x
    handle.y1.baseVal.value = point1.y

    handle.x2.baseVal.value = point2.x
    handle.y2.baseVal.value = point2.y

    handle.strokeWidth = 20;
    handle.strokeWidth = 20;
    handle.strokeWidth = 20;

    handle.setAttribute('stroke-width', 20);
    handle.setAttribute('stroke-linejoin', 'round');
    handle.setAttribute('fill', 'none');
    handle.setAttribute('stroke', 'red');

    handle.setAttribute('data-index', index);

    return handle;
  }


  const applyTransforms = (event) => {
    rootMatrix = root.getScreenCTM()

    transformedPoints = originalPoints.map((point) => {
      return point.matrixTransform(rootMatrix);
    })

    interact('.point-handle').draggable({
      snap: {
        targets: transformedPoints,
        range: 20 * Math.max(rootMatrix.a, rootMatrix.d),
      },
    })
  }

  const addNewNode = (event) => {
    const dataIndex = parseInt(event.target.attributes['data-index'].value);
    const startPoint = {
      x: parseInt(event.target.getAttribute('x1')),
      y: parseInt(event.target.getAttribute('y1')),
    }
    const endPoint = {
      x: parseInt(event.target.getAttribute('x2')),
      y: parseInt(event.target.getAttribute('y2')),
    }
    const newPoint = root.createSVGPoint()

    newPoint.x = (startPoint.x + endPoint.x) / 2;
    newPoint.y = (startPoint.y + endPoint.y) / 2;

    star.points.insertItemBefore(newPoint, dataIndex + 1);

    generatePoint(newPoint, dataIndex + 1)

    const newLine1 = generateLine(startPoint, newPoint, dataIndex);
    const newLine2 = generateLine(newPoint, endPoint, dataIndex + 1);

    root.removeChild(originalPaths[dataIndex]);
    originalPaths.splice(dataIndex, 1, newLine1, newLine2);

    root.insertBefore(newLine1, star.nextSibling)
    root.insertBefore(newLine2, star.nextSibling)

    for (let i = dataIndex; i < pointHandles.length; i++) {
      originalPaths[i].setAttribute('data-index', i);
      pointHandles[i].setAttribute('data-index', i);
    }
  }

  return (
    <div className="App">
      <div className="star-wrapper">
        <svg id="svg-edit-demo" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg" style={{ backgroundColor: 'green' }}>
          <defs>
            <circle id="point-handle"
              r="10" x="0" y="0"
              strokeWidth="4"
              fill="#fff"
              fillOpacity="1"
              stroke="#fff" />
          </defs>
          <polygon id="edit-star"
            stroke="#29e"
            strokeWidth="20"
            strokeLinejoin="round"
            fill="none"
            points="300,300 500,300 500,500 300,500" />
        </svg>
      </div>
    </div >
  );
}

export default App;
