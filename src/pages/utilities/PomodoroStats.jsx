import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './PomodoroTimer.css';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, startOfWeek, startOfMonth, parseISO } from 'date-fns';

// Helper function to process session data for charts
const processSessionData = (sessions, groupBy) => {
    const dataMap = sessions.reduce((acc, session) => {
        const date = parseISO(session.completedAt);
        let key;
        if (groupBy === 'day') {
            key = format(date, 'yyyy-MM-dd');
        } else if (groupBy === 'week') {
            key = format(startOfWeek(date), 'yyyy-MM-dd');
        } else { // month
            key = format(startOfMonth(date), 'yyyy-MM');
        }

        if (!acc[key]) {
            acc[key] = { date: key, work: 0, shortBreak: 0, longBreak: 0 };
        }

        acc[key][session.sessionType] += session.duration;
        return acc;
    }, {});

    return Object.values(dataMap).sort((a, b) => new Date(a.date) - new Date(b.date));
};


function PomodoroStats() {
    const [sessions, setSessions] = useState([]);
    const [dailyData, setDailyData] = useState([]);
    const [weeklyData, setWeeklyData] = useState([]);
    const [monthlyData, setMonthlyData] = useState([]);

    useEffect(() => {
        axios.get('/api/pomodoro/sessions')
            .then(res => {
                setSessions(res.data);
                setDailyData(processSessionData(res.data, 'day'));
                setWeeklyData(processSessionData(res.data, 'week'));
                setMonthlyData(processSessionData(res.data, 'month'));
            })
            .catch(err => console.error("Error fetching sessions:", err));
    }, []);

    const totalWorkMinutes = sessions.filter(s => s.sessionType === 'work').reduce((sum, s) => sum + s.duration, 0);
    const totalSessions = sessions.length;

    const renderChart = (data, title) => (
        <div className="chart-container">
            <h3>{title}</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="work" stackId="a" fill="#c44545" name="Work" />
                    <Bar dataKey="shortBreak" stackId="a" fill="#4a90e2" name="Short Break" />
                    <Bar dataKey="longBreak" stackId="a" fill="#50e3c2" name="Long Break" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );

    return (
    <div className="pomodoro-page-container">
            <div className="page-header">
                <h1>Pomodoro Statistics</h1>
                <Link to="/utilities/pomodoro-timer">Back to Timer</Link>
            </div>
            <div className="stats-summary">
                <div className="stat-card">
                    <h4>Total Work Time</h4>
                    <p>{Math.floor(totalWorkMinutes / 60)}h {totalWorkMinutes % 60}m</p>
                </div>
                <div className="stat-card">
                    <h4>Total Sessions</h4>
                    <p>{totalSessions}</p>
                </div>
            </div>

            {renderChart(dailyData, "Daily Activity")}
            {renderChart(weeklyData, "Weekly Activity (by week start date)")}
            {renderChart(monthlyData, "Monthly Activity")}
        </div>
    );
}

export default PomodoroStats;
