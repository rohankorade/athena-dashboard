import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const API_BASE = `http://${window.location.hostname}:5000`;
        const newSocket = io(API_BASE);

        setSocket(newSocket);

        // Optional: Log connection status for debugging
        newSocket.on('connect', () => {
            console.log('Socket connected:', newSocket.id);
        });

        newSocket.on('disconnect', () => {
            console.log('Socket disconnected');
        });

        // Cleanup on component unmount
        return () => {
            newSocket.disconnect();
        };
    }, []); // Empty dependency array ensures this runs only once on mount

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
