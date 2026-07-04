import { useContext } from 'react'
import { Navigate } from 'react-router-dom'
import { AuthContext } from './context/AuthProvider.jsx'
import { isTokenExpired } from './utils/tokenUtils'

function ProtectedRoute({ children }) {
    const { authState, logout,authLoading } = useContext(AuthContext)

    if (authLoading) return <p>Loading...</p>

    if (!authState.token || isTokenExpired(authState.token)) {
        logout();// Clear auth state and localStorage
        return <Navigate to="/login?expired=1" replace />
    }
    return children
}

export default ProtectedRoute

