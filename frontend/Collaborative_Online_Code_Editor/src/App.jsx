import './App.css'
import {useState} from 'react'
import MyNav from './MyNav.jsx'
import LandingPage from './LandingPage.jsx';
function App() {

  const [isLogin,setIsLogin]=useState(false);
  return ( 
    <div className="app-container">
      <MyNav setIsLogin={setIsLogin}></MyNav>
      { isLogin?<></>:<LandingPage/> }
    </div>
  )
}

export default App
