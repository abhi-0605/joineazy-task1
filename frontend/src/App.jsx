import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import {Routes, Route} from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import StudentDashboard from "./pages/StudentDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";


function Home() {
    const { user } = useAuth();
    
    if (!user) {
        return <Navigate to="/login" replace />;
    }
    return <Navigate to={user.role === 'admin' ? '/admin' : '/student'} replace />;
}

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/student" element={
                <ProtectedRoute role="student">
                    <StudentDashboard />
                </ProtectedRoute>
            } />
            <Route path="/admin" element={
                <ProtectedRoute role="admin">
                    <AdminDashboard />
                </ProtectedRoute>
            } />
        </Routes>
    );
}