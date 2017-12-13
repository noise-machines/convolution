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

export default ConvolutionFilter
