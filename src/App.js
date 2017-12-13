import React, { Component } from 'react'
import ConvolvedImage from './ConvolvedImage'
import './App.css'

class App extends Component {
  render() {
    return (
      <div className="App">
        <ConvolvedImage src="/dog.jpeg" alt="convolution target" />
      </div>
    )
  }
}

export default App
