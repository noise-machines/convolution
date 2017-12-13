import React, { Component } from 'react'

const isEven = n => n % 2 === 0

const greyscale = pixel => {
  const { red, green, blue, alpha } = pixel
  const average = (red + green + blue) / 3
  return {
    red: average,
    green: average,
    blue: average,
    alpha: alpha
  }
}

class ConvolutionFilter {
  constructor(weights) {
    this.weights = weights
    this.height = weights.length
    this.width = weights[0].length
  }
  apply(pixelMatrix) {
    if (pixelMatrix.height !== this.height)
      throw new Error(
        `Expected pixel matrix height (${
          pixelMatrix.height
        }) and filter height (${this.height}) to be the same, but they weren't.`
      )
    if (pixelMatrix.width !== this.width)
      throw new Error(
        `Expected pixel matrix width (${pixelMatrix.width}) and filter width (${
          this.width
        }) to be the same, but they weren't.`
      )
    const reducer = (sum, pixel, point) => {
      return sum + pixel.red * this.getWeight(point)
    }
    const result = pixelMatrix.reduce(reducer, 0)
    return {
      red: result,
      green: result,
      blue: result,
      alpha: 255
    }
  }
  getWeight(point) {
    return this.weights[point.y][point.x]
  }
}

const verticalEdgeFilter = new ConvolutionFilter([
  [1, 0, -1],
  [1, 0, -1],
  [1, 0, -1]
])

const detectVerticalEdges = (pixel, point, matrix) => {
  const windowMatrix = matrix.getWindow(
    point,
    verticalEdgeFilter.width,
    verticalEdgeFilter.height
  )
  return verticalEdgeFilter.apply(windowMatrix)
}

const identity = pixel => {
  return pixel
}

const EMPTY_PIXEL = {
  red: 0,
  green: 0,
  blue: 0,
  alpha: 0
}

class PixelMatrix {
  constructor(width, height, pixels) {
    if (pixels == null) pixels = new Uint8ClampedArray(width * height * 4)
    if (width == null)
      throw new Error(`Expected width to be defined, but was ${width}.`)
    if (height == null)
      throw new Error(`Expected height to be defined, but was ${height}.`)
    this.pixels = pixels
    this.width = width
    this.height = height
  }
  get(point) {
    if (!this.contains(point)) {
      return null
    }
    const i = this.getIndex(point)
    const red = this.pixels[i]
    const green = this.pixels[i + 1]
    const blue = this.pixels[i + 2]
    const alpha = this.pixels[i + 3]
    return { red, green, blue, alpha }
  }
  set(pixel, point) {
    const { red, green, blue, alpha } = pixel
    const i = this.getIndex(point)
    this.pixels[i] = red
    this.pixels[i + 1] = green
    this.pixels[i + 2] = blue
    this.pixels[i + 3] = alpha
  }
  getIndex(point) {
    const { x, y } = point
    const xTooBig = x >= this.width
    const yTooBig = y >= this.height
    if (xTooBig || yTooBig) {
      throw new Error(
        `Expected x and y to be less than or equal to (${this.width}, ${
          this.height
        }) but was actually (${x}, ${y})`
      )
    }
    return y * (this.width * 4) + x * 4
  }
  forEach(fn) {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const point = { x, y }
        const pixel = this.get(point)
        fn(pixel, point, this)
      }
    }
  }
  map(fn) {
    const newPixelMatrix = new PixelMatrix(this.width, this.height)
    this.forEach((pixel, point, pixelMatrix) => {
      const newPixel = fn(pixel, point, pixelMatrix)
      newPixelMatrix.set(newPixel, point)
    })
    return newPixelMatrix
  }
  reduce(fn, startingValue) {
    if (startingValue == null) {
      throw new Error(
        `Expected startingValue to be defined, but instead it was ${
          startingValue
        }.`
      )
    }
    let total = startingValue
    this.forEach((pixel, point) => {
      total = fn(total, pixel, point)
    })
    return total
  }
  getWindow(center, width, height) {
    if (isEven(width))
      throw new Error(`Expected an odd window width, but got ${width}`)
    if (isEven(height))
      throw new Error(`Expected an odd window height, but got ${height}`)
    const xRadius = (width - 1) / 2
    const yRadius = (height - 1) / 2
    const windowMatrix = new PixelMatrix(width, height)
    for (let yOffset = -yRadius; yOffset <= yRadius; yOffset++) {
      for (let xOffset = -xRadius; xOffset <= xRadius; xOffset++) {
        let x = center.x + xOffset
        let y = center.y + yOffset
        const pixel = this.get({ x, y }) || EMPTY_PIXEL
        windowMatrix.set(pixel, { x: xOffset + xRadius, y: yOffset + yRadius })
      }
    }
    return windowMatrix
  }
  contains(point) {
    return (
      point.x >= 0 &&
      point.x < this.width &&
      point.y >= 0 &&
      point.y < this.height
    )
  }
}

class ConvolvedImage extends Component {
  constructor(props) {
    super()
    this.image = new window.Image()
    this.image.src = props.src
    this.gotCanvas = this.gotCanvas.bind(this)
    this.convolve = this.convolve.bind(this)
    this.state = { width: 0, height: 0 }
  }
  gotCanvas(canvas) {
    this.canvas = canvas
    const context = this.canvas.getContext('2d')
    this.context = context
    this.image.onload = () => {
      console.log('image loaded')
      this.setState({ width: this.image.width, height: this.image.height })
      context.drawImage(this.image, 0, 0, this.image.width, this.image.height)
      const imageData = context.getImageData(
        0,
        0,
        this.image.width,
        this.image.height
      )
      const newImageData = this.convolve(imageData, context)
      context.putImageData(newImageData, 0, 0)
    }
  }
  convolve(imageData, context) {
    const pixelMatrix = new PixelMatrix(
      imageData.width,
      imageData.height,
      imageData.data
    )
    const verticalEdgesDetected = pixelMatrix
      .map(greyscale)
      .map(detectVerticalEdges)
    return new ImageData(
      verticalEdgesDetected.pixels,
      imageData.width,
      imageData.height
    )
  }
  render() {
    return (
      <div>
        <canvas
          ref={this.gotCanvas}
          width={this.state.width}
          height={this.state.height}
        />
      </div>
    )
  }
}

export default ConvolvedImage
