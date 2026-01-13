import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
//import {usePaginatedFetch } from  './Hooks'
//import type {HomePageContentItem} from  './Hooks'
import Test from "./Test.rsx";
import HighResTimer from './TimerORD.rsx'
import HighResTimerReact from './TimerReact'
//import HighResTimerRT from './Timer2'


function App() {


  const [count, setCount] =  useState(0);

  function handleClick() {
    setCount((c) => (c + 1));
  }
  
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
      {/* <div>
        {count % 2 === 0 && <Test count={count}></Test>}
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
        <button onClick={handleClick}>
          App button
        </button>
      </div> */}
      {/* <h1>Vite + React</h1>
      <div className="card">

        <ul>
        {
            data.map((item, index)=>(<li key={index}>
              {item.name}
            </li>))
        }
        {loading && <div>Loading...</div>}
        
        </ul>
        <button onClick={handleClick}>
          Page
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p> */}
    </>
  )
}

export default App
