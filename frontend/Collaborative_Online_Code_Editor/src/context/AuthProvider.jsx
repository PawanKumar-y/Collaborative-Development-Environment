import {createContext, useState } from 'react';

const AuthContext=createContext();
export const AuthProvider=({children})=>{
    const [authState, setAuth]=useState();
    return (
        <AuthContext.Provider value={{authState, setAuth}}>
            {children}
        </AuthContext.Provider>
    );
}
export {AuthContext};