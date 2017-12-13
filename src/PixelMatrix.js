export const COLOR_PROFILES = {
  RGBA: {
    numberOfChannels: 4
  }
}

const isEven = n => n % 2 === 0
const EMPTY_PIXEL = {
  red: 0,
  green: 0,
  blue: 0,
  alpha: 0
}

class PixelMatrix {
  get numberOfChannels() {
    return this.colorProfile.numberOfChannels
  }
  constructor(width, height, colorProfile, pixels) {
    if (pixels == null)
      pixels = new Uint8ClampedArray(
        width * height * colorProfile.numberOfChannels
      )
    if (width == null)
      throw new Error(`Expected width to be defined, but was ${width}.`)
    if (height == null)
      throw new Error(`Expected height to be defined, but was ${height}.`)
    this.width = width
    this.height = height
    this.colorProfile = colorProfile
    this.pixels = pixels
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
    return y * (this.width * this.numberOfChannels) + x * this.numberOfChannels
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
    const newPixelMatrix = new PixelMatrix(
      this.width,
      this.height,
      this.colorProfile
    )
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
    const windowMatrix = new PixelMatrix(width, height, this.colorProfile)
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

export default PixelMatrix
