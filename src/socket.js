// src/socket.js
import { io } from 'socket.io-client';

const API_BASE = `http://${window.location.hostname}:5000`;
export const socket = io(API_BASE);