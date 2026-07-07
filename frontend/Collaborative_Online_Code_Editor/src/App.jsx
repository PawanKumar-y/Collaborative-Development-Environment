import './App.css'
import MyNav from './MyNav.jsx';
import { Routes, Route } from 'react-router-dom';
import LoginPage from './LoginPage.jsx'
import SignUpPage from './SignUpPage.jsx'
import LandingPage from './LandingPage.jsx';
import CollaborativeCode from './CollaborativeCode.jsx'
import ProtectedRoute from './ProtectedRoute.jsx'
import ProgramPage from './ProgramPage.jsx';
import RoomEditor from './RoomEditor.jsx';
import InterviewRoom from './InterviewRoom.jsx';
import InterviewRoomWorkspace from './InterviewRoomWorkspace.jsx';


function App() {

  return ( 
    <div className="app-container">
      <MyNav ></MyNav>
      <Routes>
        <Route element={<LandingPage/>} path="/"/>
        <Route element={<LoginPage/>} path="/login"/>
        <Route element={<SignUpPage/>} path="/signup"/>
        <Route path="/execute" element={<ProtectedRoute><ProgramPage /></ProtectedRoute>} />
        <Route path="/create-room" element={<ProtectedRoute><CollaborativeCode /></ProtectedRoute>} />
        <Route path="/room/:roomId" element={<ProtectedRoute><RoomEditor /></ProtectedRoute>} />
        <Route path="/interview-room" element={<ProtectedRoute><InterviewRoom /></ProtectedRoute>} />
        <Route path="/interview-room/:roomId" element={<ProtectedRoute><InterviewRoomWorkspace /></ProtectedRoute>} />
      </Routes>
    </div>
  )
}

export default App
