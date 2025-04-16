import React from 'react'
import StatsSection from './components/StatsSection'
import ShowLogsButtons from './components/ShowLogsButtons'

const App = () => {
  // placeholder handlers – hook these up to your actual log‐display logic
  const handleLLMLogs = () => {
    // TODO: implement show LLM logs
  }
  const handleSDLogs = () => {
    // TODO: implement show Stable Diffusion logs
  }

  return (
    <>
      <StatsSection />
      <ShowLogsButtons
        onLLMClick={handleLLMLogs}
        onSDClick={handleSDLogs}
      />
    </>
  )
}

export default App