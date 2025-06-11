import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import ServerDashboard from '../components/ServerDashboard';
import serverConfig from '../assets/server.json';

const ServerPage = () => {
  const { serverId } = useParams();
  const username = localStorage.getItem('username') || 'User';

  // 将serverId转换为数字索引
  const serverIndex = parseInt(serverId, 10);
  
  // 根据索引查找对应的服务器配置
  const server = serverConfig.servers[serverIndex];

  // 如果找不到对应的服务器配置，重定向到第一个服务器
  if (!server || isNaN(serverIndex) || serverIndex < 0 || serverIndex >= serverConfig.servers.length) {
    return <Navigate to="/server/0" replace />;
  }

  // 构建完整的服务器配置对象
  const fullServerConfig = {
    ...server,
    apiUrl: serverConfig.apiUrl,
    index: serverIndex
  };

  // 渲染服务器Dashboard组件，传递服务器配置
  return (
    <ServerDashboard 
      serverConfig={fullServerConfig} 
      username={username} 
    />
  );
};

export default ServerPage; 