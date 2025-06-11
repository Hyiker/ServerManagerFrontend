import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Components
import MainLayout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';

// Pages
import Login from './pages/Login';
import ServerPage from './pages/ServerPage';
import Settings from './pages/Settings';
import TodayLuck from './pages/TodayLuck';
import Games from './pages/Games';
import MyReservations from './pages/MyReservations';
import MyContainers from './pages/MyContainers';
import ApprovalReservations from './pages/ApprovalReservations';
import UserManagement from './pages/UserManagement';

// 动态导入服务器配置
import serverConfig from './assets/server.json';

function App() {
  // 使用索引0作为默认重定向目标
  const defaultServerIndex = 0;

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes */}
        <Route element={<PrivateRoute />}>
          <Route element={<MainLayout />}>
            {/* 动态服务器路由 */}
            <Route path="/server/:serverId" element={<ServerPage />} />
            <Route path="/approval" element={<ApprovalReservations />} />
            <Route path="/games" element={<Games />} />
            <Route path="/luck" element={<TodayLuck />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/reservations" element={<MyReservations />} />
            <Route path="/containers" element={<MyContainers />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/" element={<Navigate to={`/server/${defaultServerIndex}`} replace />} />
          </Route>
        </Route>
        
        {/* Redirect any unknown paths to default server */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
