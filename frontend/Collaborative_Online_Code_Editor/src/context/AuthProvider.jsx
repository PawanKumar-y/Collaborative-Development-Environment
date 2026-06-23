import { createContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [authState, setAuthState] = useState({ token: null, email: null, user: null });

    // Load auth from localStorage once on mount
    useEffect(() => {
        const token = localStorage.getItem('token');
        const email = localStorage.getItem('email');
        const user = localStorage.getItem('user');
        
        if (token && email) {
            setAuthState({
                token,
                email,
                user: user ? JSON.parse(user) : null
            });
        }
    }, []); // Empty dependency - runs only once

    // Custom setAuth that also saves to localStorage
    const setAuth = (newAuth) => {
        if (newAuth?.token) {
            localStorage.setItem('token', newAuth.token);
            localStorage.setItem('email', newAuth.email);
            if (newAuth.user) {
                localStorage.setItem('user', JSON.stringify(newAuth.user));
            }
        } else {
            localStorage.removeItem('token');
            localStorage.removeItem('email');
            localStorage.removeItem('user');
        }
        setAuthState(newAuth);
    };

    return (
        <AuthContext.Provider value={{ authState, setAuth }}>
            {children}
        </AuthContext.Provider>
    );
};

export { AuthContext };