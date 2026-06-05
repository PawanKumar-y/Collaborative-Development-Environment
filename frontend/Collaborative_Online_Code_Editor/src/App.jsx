import './App.css'
import {useState} from 'react'
import MyNav from './MyNav.jsx'
import LoginPage from './LoginPage.jsx'
import SignUpPage from './SignUpPage.jsx'
import LandingPage from './LandingPage.jsx';
function App() {

  const [isLogin,setIsLogin]=useState(false);
  const [isSignUp,setIsSignUp]=useState(false);
  return ( 
    <div className="app-container">
      <MyNav setIsLogin={setIsLogin} setIsSignUp={setIsSignUp}></MyNav>
      { isLogin?<LoginPage/>:isSignUp?<SignUpPage/>:<LandingPage/> }
    </div>
  )
}

export default App
