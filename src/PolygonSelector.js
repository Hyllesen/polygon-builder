import React from 'react';
import './App.css';
import interact from 'interactjs'

const dummyPoints = [{
  x: 300,
  y: 300,
}, {
  x: 500,
  y: 300,
}, {
  x: 500,
  y: 500,
}, {
  x: 300,
  y: 500,
}];


const sns = 'http://www.w3.org/2000/svg'
const xns = 'http://www.w3.org/1999/xlink'

/**
 *
 * @param {[{x: number, y: number}]} points
 */
const getPolygonPointsString = (points) => {
  return points.map(point => `${point.x},${point.y}`).join(' ');
}

const PolygonSelector = ({ points = dummyPoints, stroke = "#29e", strokeWidth = 20, handleColor = "#fff", onChange, width = 800, height = 800, ...svgProps }) => {
  const pointsString = getPolygonPointsString(points);

  let root
  let star
  let rootMatrix
  const originalPoints = []
  const pointHandles = []
  const originalPaths = []
  let transformedPoints = []

  React.useEffect(() => {
    root = document.getElementById('polygon-selector')
    star = document.getElementById('edit-polygon')

    generateHandles();

    interact(root)
      .on('mousedown', applyTransforms)
      .on('touchstart', applyTransforms)
      .on('mouseup', updateParent)
      .on('touchend', updateParent)

    interact('#drag-handle')
      .draggable({
        onmove: function (event) {
          const offsetX = event.dx / rootMatrix.a;
          const offsetY = event.dy / rootMatrix.d;
          for (let i = 0; i < star.points.numberOfItems; i++) {
            const point = star.points.getItem(i);
            point.x += offsetX;
            point.y += offsetY;
          }
          pointHandles.forEach(point => {
            point.x.baseVal.value += offsetX;
            point.y.baseVal.value += offsetY;
          })
          originalPaths.forEach(line => {
            line.x1.baseVal.value += offsetX
            line.y1.baseVal.value += offsetY

            line.x2.baseVal.value += offsetX
            line.y2.baseVal.value += offsetY
          });

          event.target.x.baseVal.value += offsetX
          event.target.y.baseVal.value += offsetY
        }
      })

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
    for (let i = 0; i < star.points.numberOfItems; i++) {
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
    handle.setAttribute('stroke', stroke);

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

  const updateParent = () => {
    onChange(originalPoints.map(point => ({ x: point.x, y: point.y })))
  }

  return (
    <svg id="polygon-selector" viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg" {...svgProps}>
      <defs>
        <circle id="point-handle"
          r="10" x="0" y="0"
          strokeWidth="4"
          fill={handleColor}
          fillOpacity="1"
          stroke={handleColor} />
      </defs>
      <polygon id="edit-polygon"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        fill="none"
        points={pointsString} />
      <svg id="drag-handle" width="30" height="30" x={width / 2 - 15} y={height / 2 - 15} viewBox="0 0 512 512">
        <path d="M507.353,245.245l-83.692-78.769c-4.289-4.039-10.57-5.141-15.98-2.803c-5.409,2.337-8.911,7.666-8.911,13.558v34.462
        h-98.462v-98.462h34.462c5.893,0,11.221-3.502,13.558-8.911c2.336-5.409,1.236-11.69-2.803-15.98L266.755,4.647
        C263.964,1.682,260.072,0,256,0c-4.072,0-7.964,1.682-10.755,4.647L166.476,88.34c-4.039,4.29-5.141,10.571-2.803,15.98
        c2.337,5.409,7.666,8.911,13.558,8.911h34.462v98.462h-98.462v-34.462c0-5.893-3.502-11.221-8.911-13.558
        c-5.41-2.337-11.69-1.236-15.98,2.803L4.647,245.245C1.682,248.036,0,251.928,0,256s1.682,7.964,4.647,10.755l83.692,78.769
        c4.29,4.039,10.57,5.142,15.98,2.803c5.409-2.337,8.911-7.666,8.911-13.558v-34.462h98.462v98.462h-34.462
        c-5.893,0-11.221,3.502-13.558,8.911c-2.336,5.41-1.236,11.69,2.803,15.98l78.769,83.692C248.036,510.318,251.928,512,256,512
        c4.072,0,7.964-1.682,10.755-4.647l78.769-83.692c4.039-4.29,5.141-10.571,2.803-15.98c-2.337-5.409-7.666-8.911-13.558-8.911
        h-34.462v-98.462h98.462v34.462c0,5.893,3.502,11.221,8.911,13.558c5.411,2.337,11.691,1.236,15.98-2.803l83.692-78.769
        C510.318,263.964,512,260.072,512,256C512,251.928,510.318,248.035,507.353,245.245z M428.308,300.587v-15.049
        c0-8.157-6.613-14.769-14.769-14.769h-128c-8.157,0-14.769,6.613-14.769,14.769v128c0,8.157,6.613,14.769,14.769,14.769h15.049
        L256,475.682l-44.587-47.374h15.049c8.157,0,14.769-6.613,14.769-14.769v-128c0-8.157-6.613-14.769-14.769-14.769h-128
        c-8.157,0-14.769,6.613-14.769,14.769v15.049L36.319,256l47.374-44.587v15.049c0,8.157,6.613,14.769,14.769,14.769h128
        c8.157,0,14.769-6.613,14.769-14.769v-128c0-8.157-6.613-14.769-14.769-14.769h-15.049L256,36.319l44.587,47.374h-15.049
        c-8.157,0-14.769,6.613-14.769,14.769v128c0,8.157,6.613,14.769,14.769,14.769h128c8.157,0,14.769-6.613,14.769-14.769v-15.049
        L475.682,256L428.308,300.587z"/>
      </svg>
    </svg>
  );
}

export default PolygonSelector;
