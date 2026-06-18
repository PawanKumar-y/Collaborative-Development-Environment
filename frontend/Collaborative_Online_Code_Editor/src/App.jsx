import './App.css'
import MyNav from './MyNav.jsx';
import { Routes, Route } from 'react-router-dom';
import LoginPage from './LoginPage.jsx'
import SignUpPage from './SignUpPage.jsx'
import LandingPage from './LandingPage.jsx';
import CollaborativeCode from './CollaborativeCode.jsx'
import ProgramPage from './ProgramPage.jsx';
import RoomEditor from './RoomEditor.jsx'
function App() {

  return ( 
    <div className="app-container">
      <MyNav ></MyNav>
      <Routes>
        <Route element={<LandingPage/>} path="/"/>
        <Route element={<LoginPage/>} path="/login"/>
        <Route element={<SignUpPage/>} path="/signup"/>
        {/* <Route element={<InterviewRoom/>} path="/interview-room"/>*/}
        <Route element={<CollaborativeCode/>} path="/create-room"/>
        <Route element={<ProgramPage/>} path="/execute"/> 
        <Route element={<RoomEditor/>} path="/room/:roomId"/>
      </Routes>
    </div>
  )
}

export default App
