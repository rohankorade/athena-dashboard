import React, { createContext, useContext, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const socket = useRef(null);

    useEffect(() => {
        const API_BASE = `http://${window.location.hostname}:5000`;
        socket.current = io(API_BASE);

        // Optional: Log connection status for debugging
        socket.current.on('connect', () => {
            console.log('Socket connected:', socket.current.id);
        });

        socket.current.on('disconnect', () => {
            console.log('Socket disconnected');
        });

        // Cleanup on component unmount
        return () => {
            if (socket.current) {
                socket.current.disconnect();
            }
        };
    }, []); // Empty dependency array ensures this runs only once on mount

    return (
        <SocketContext.Provider value={socket.current}>
            {children}
        </SocketContext.Provider>
    );
};
