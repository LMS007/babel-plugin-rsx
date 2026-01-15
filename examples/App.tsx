import './App.css'
import HighResTimer from './stop-watch/TimerORD.rsx'
import HighResTimerReact from './stop-watch/TimerReact'



function App() {

  return (
    <>
      <div style={{marginBottom: '3em'}}>
        <label>ODR Timer</label>
        <HighResTimer/> 
      </div>
      
      <div>
        <label>React Timer</label>
        <HighResTimerReact/>
      </div>
    </>
  )
}

export default App
