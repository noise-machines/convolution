import React, { Component } from 'react'
import ConvolutionFilter from './ConvolutionFilter'
import PixelMatrix, { COLOR_PROFILES } from './PixelMatrix'

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

const filterMapper = filter => (pixel, point, matrix) => {
  const windowMatrix = matrix.getWindow(point, filter.width, filter.height)
  return filter.apply(windowMatrix)
}

const verticalEdgeFilter = filterMapper(
  new ConvolutionFilter([[1, 0, -1], [1, 0, -1], [1, 0, -1]])
)

const horizontalEdgeFilter = filterMapper(
  new ConvolutionFilter([[1, 1, 1], [0, 0, 0], [-1, -1, -1]])
)

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
      COLOR_PROFILES.RGBA,
      imageData.data
    )
    const convolved = pixelMatrix.map(greyscale).map(horizontalEdgeFilter)
    return new ImageData(convolved.pixels, imageData.width, imageData.height)
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
