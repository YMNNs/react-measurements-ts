# React Measurements TS

This is a fork of [rmfisher/react-measurements](https://github.com/rmfisher/react-measurements). It was forked and published on npm under react-measurements-ts in order to address the following issues/features:

- 🔥 Upgrade to React 18
- 🛠️ Refactor with TypeScript and functional components (`React.FC`)
- 🛠️ Fix `Uncaught ReferenceError: global is not defined` when using Vite dev server
- 🆕 Supports measurement in rectangular areas of **unequal width and height**

A React component for measuring &amp; annotating images.

## Demo

Check out the demo [here](https://ymnns.github.io/react-measurements-ts).

## Usage

```tsx
import { type FC, useState } from 'react'
import pollenImage from '../assets/pollen.jpg'
import {
  MeasurementLayer,
  calculateArea,
  calculateDistance,
  type Circle,
  type Line,
  type Measurement,
} from 'react-measurements-ts'

const width = 800
const height = 500 // Not equal to the width

const measureLine = (line: Line) => Math.round(calculateDistance(line, width, height)) + ' μm'
const measureCircle = (circle: Circle) => Math.round(calculateArea(circle, width, height) / 10) * 10 + ' μm²'

const App: FC = () => {
  const [measurements, setMeasurements] = useState<Measurement[]>([])

  return (
    <div
      style={{
        position: 'absolute',
        width: width,
        height: height,
      }}
    >
      <img src={pollenImage} alt={'Pollen grains'} style={{ width: width, height: height }} />
      <MeasurementLayer
        measurements={measurements}
        widthInPx={width}
        heightInPx={height}
        onChange={setMeasurements}
        measureLine={measureLine}
        measureCircle={measureCircle}
      />
    </div>
  )
}

export default App
```

## Scope

The component is currently read-only on mobile. A mouse is required to create and edit measurements.

## License

MIT
