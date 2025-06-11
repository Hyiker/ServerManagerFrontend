import React, { useState, useEffect } from 'react';
import '../assets/Dashboard.css';
import axios from 'axios';
import serverConfig from '../assets/server.json';

// CSS 样式定义
const reservationTableStyles = `
  .reservation-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    background: white;
    border-radius: 12px;
    overflow: hidden;
  }

  .reservation-table thead th {
    background: #F7FAFC;
    border-bottom: 2px solid #E2E8F0;
    padding: 16px 12px;
    font-weight: 600;
    color: #4A5568;
    font-size: 14px;
    text-align: left;
  }

  /* 为"我的预约"表格设置列宽 */
  .reservation-table th:nth-child(1) { width: 22%; } /* 显卡 */
  .reservation-table th:nth-child(2) { width: 18%; } /* 容器ID */
  .reservation-table th:nth-child(3) { width: 16%; } /* 开始日期 */
  .reservation-table th:nth-child(4) { width: 16%; } /* 结束日期 */
  .reservation-table th:nth-child(5) { width: 12%; } /* 状态 */
  .reservation-table th:nth-child(6) { width: 16%; } /* 操作 */

  .reservation-table tbody td {
    padding: 12px;
    border-bottom: 1px solid #E2E8F0;
    color: #2D3748;
    font-size: 14px;
    vertical-align: middle;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* 为"我的预约"表格设置列宽和特殊样式 */
  .reservation-table td:nth-child(1) { 
    width: 22%; 
    padding-left: 8px;
    white-space: normal; /* 显卡标签允许换行 */
  }
  .reservation-table td:nth-child(2) { 
    width: 18%; 
    font-family: monospace; 
    font-size: 13px;
  }
  .reservation-table td:nth-child(3) { width: 16%; }
  .reservation-table td:nth-child(4) { width: 16%; }
  .reservation-table td:nth-child(5) { width: 12%; }
  .reservation-table td:nth-child(6) { 
    width: 16%; 
    white-space: normal; /* 操作按钮允许换行 */
  }

  .reservation-table-container {
    background: white;
    border-radius: 12px;
    margin-bottom: 24px;
    overflow: visible;
    box-shadow: 0 2px 10px rgba(0,0,0,0.08);
  }
`;

// 动态添加样式到页面
const addStyles = () => {
  const styleId = 'reservation-table-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = reservationTableStyles;
    document.head.appendChild(style);
  }
};

// API配置
const API_URL = serverConfig.apiUrl;

// Helper function to format date for display
const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// 将UTC时间字符串转换为本地时间的Date对象
const utcToLocal = (utcTimeString) => {
  // 创建UTC时间的Date对象
  const utcDate = new Date(utcTimeString);
  // 直接返回，JavaScript会自动处理时区转换
  return utcDate;
};

// 将本地时间转换为UTC时间字符串
const localToUtc = (localDate) => {
  // 如果是Date对象，直接转换为UTC字符串
  if (localDate instanceof Date) {
    return localDate.toISOString();
  }
  // 如果是字符串，先创建Date对象再转换
  const date = new Date(localDate);
  return date.toISOString();
};

const MyReservations = ({ username }) => {
  const [reservations, setReservations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeServer, setActiveServer] = useState('all');
  const [processingId, setProcessingId] = useState(null);

  // 从server.json构建服务器映射（serverIp -> server信息）
  const serverMapping = serverConfig.servers.reduce((mapping, server, index) => {
    mapping[server.serverIp] = {
      name: server.name,
      serverIp: server.serverIp,
      index: index
    };
    return mapping;
  }, {});

  // 获取服务器名称的辅助函数
  const getServerName = (serverKey) => {
    if (serverKey === 'all') return '全部服务器';
    
    // 从serverMapping中查找对应的服务器信息
    const serverInfo = serverMapping[serverKey];
    return serverInfo ? serverInfo.name : serverKey;
  };

  // 添加样式
  useEffect(() => {
    addStyles();
  }, []);

  // 获取预约记录
  useEffect(() => {
    const fetchReservations = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await axios.get(`${API_URL}/reserve/reservations/user`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        // 处理API返回的数据
        if (response.data) {
          // 转换API数据到应用所需的格式
          const formattedReservations = response.data.map(reservation => {
            // 根据server_id从serverMapping中获取服务器信息
            const serverInfo = serverMapping[reservation.server_id];
            const serverKey = serverInfo ? serverInfo.serverIp : 'unknown';
            
            // 为每个GPU添加前缀
            const gpuNames = reservation.gpu_list.map(gpuIndex => `GPU ${gpuIndex}`);
            
            // 转换状态
            let status;
            switch (reservation.allocation_status) {
              case 'active':
                status = 'active';
                break;
              case 'pending':
                status = 'pending';
                break;
              case 'rejected':
                status = 'rejected';
                break;
              case 'approved':
                status = 'approved';
                break;
              default:
                status = 'completed';
            }
            
            return {
              id: reservation._id,
              server: serverKey,
              gpuName: gpuNames,
              container: reservation.container_id,
              startDate: reservation.allocation_start_time,
              endDate: reservation.allocation_end_time,
              status: status,
              raw: reservation // 保留原始数据，以便后续可能需要
            };
          });
          
          setReservations(formattedReservations);
        } else {
          setReservations([]);
        }
      } catch (err) {
        console.error('获取预约记录失败:', err);
        setError('获取预约记录失败，请稍后重试');
        
        // 如果是401错误，可能是token过期
        if (err.response && err.response.status === 401) {
          setError('登录已过期，请重新登录');
          // 可以添加重定向到登录页面或其他处理
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchReservations();
  }, []);

  // Handle canceling a reservation
  const handleCancelReservation = async (id) => {
    if (window.confirm('确定要取消这个预约吗？')) {
      try {
        // 获取原始预约数据
        const reservation = reservations.find(res => res.id === id);
        if (!reservation) return;
        
        // 调用取消预约API
        const response = await axios.post(`${API_URL}/reserve/terminate`, {
          allocation_id: reservation.raw._id
        }, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        // 更新本地数据
        setReservations(prev => prev.filter(res => res.id !== id));
        
        // 提示成功信息
        alert('预约已成功取消');
      } catch (err) {
        console.error('取消预约失败:', err);
        let errorMessage = '请稍后重试';
        
        // 处理特定错误情况
        if (err.response) {
          const { status, data } = err.response;
          
          if (status === 400) {
            errorMessage = data.message || '请求参数错误';
          } else if (status === 404) {
            errorMessage = '预约记录不存在';
          } else if (status === 401) {
            errorMessage = '未授权操作，请重新登录';
          } else {
            errorMessage = data.message || `服务器错误 (${status})`;
          }
        }
        
        alert(`取消预约失败: ${errorMessage}`);
      }
    }
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active': return 'status-badge occupied';
      case 'pending': return 'status-badge pending';
      case 'rejected': return 'status-badge rejected';
      case 'scheduled': return 'status-badge scheduled';
      case 'approved': return 'status-badge scheduled';
      case 'completed': return 'status-badge completed';
      default: return 'status-badge';
    }
  };

  // Get status label
  const getStatusLabel = (status) => {
    switch (status) {
      case 'active': return '使用中';
      case 'pending': return '待审批';
      case 'rejected': return '不通过';
      case 'scheduled': return '已预约';
      case 'approved': return '已批准';
      case 'completed': return '已完成';
      default: return status;
    }
  };

  // Filter reservations by server
  const filteredReservations = activeServer === 'all'
    ? reservations
    : reservations.filter(res => res.server === activeServer);

  // Get unique servers from reservations
  const servers = ['all', ...new Set(reservations.map(res => res.server))];

  // Group reservations by server for 'all' view
  const groupedReservations = reservations.reduce((groups, reservation) => {
    const server = reservation.server;
    if (!groups[server]) {
      groups[server] = [];
    }
    groups[server].push(reservation);
    return groups;
  }, {});

  // 在表格中显示显卡列的内容
  const renderGpuTags = (gpuNames) => {
    // 如果有超过4张显卡，显示折叠布局
    if (Array.isArray(gpuNames) && gpuNames.length > 4) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '250px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {gpuNames.slice(0, 3).map((gpu, index) => (
              <span key={index} style={{
                backgroundColor: '#EBF8FF',
                color: '#3182CE',
                borderRadius: '4px',
                padding: '3px 8px',
                fontSize: '12px',
                fontWeight: '500',
                display: 'inline-block',
                border: '1px solid #BEE3F8'
              }}>
                {gpu}
              </span>
            ))}
            <span style={{
              backgroundColor: '#E2E8F0',
              color: '#4A5568',
              borderRadius: '4px',
              padding: '3px 8px',
              fontSize: '12px',
              fontWeight: '500',
              display: 'inline-block',
              cursor: 'pointer',
              position: 'relative'
            }} title={gpuNames.slice(3).join(', ')}>
              +{gpuNames.length - 3}张
            </span>
          </div>
          <div style={{ 
            fontSize: '12px', 
            color: '#718096',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <svg 
              width="12" 
              height="12" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M13 16H12V12H11M12 8H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
            总计 {gpuNames.length} 张显卡
          </div>
        </div>
      );
    }
    
    // 少于等于4张显卡，直接全部显示
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '250px' }}>
        {Array.isArray(gpuNames) 
          ? gpuNames.map((gpu, index) => (
            <span key={index} style={{
              backgroundColor: '#EBF8FF',
              color: '#3182CE',
              borderRadius: '4px',
              padding: '3px 8px',
              fontSize: '12px',
              fontWeight: '500',
              display: 'inline-block',
              border: '1px solid #BEE3F8'
            }}>
              {gpu}
            </span>
          ))
          : <span style={{
              backgroundColor: '#EBF8FF',
              color: '#3182CE',
              borderRadius: '4px',
              padding: '3px 8px',
              fontSize: '12px',
              fontWeight: '500',
              display: 'inline-block',
              border: '1px solid #BEE3F8'
            }}>
              {gpuNames}
            </span>
        }
      </div>
    );
  };

  return (
    <div className="content-section">
      <div className="page-header" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px',
        backgroundColor: 'white',
        padding: '20px 24px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
      }}>
        <div>
          <h1 style={{
            fontSize: '24px',
            fontWeight: '600',
            margin: '0',
            color: '#2D3748',
            display: 'flex',
            alignItems: 'center'
          }}>
            <svg 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg" 
              width="28" 
              height="28" 
              style={{ marginRight: '12px', color: '#4299E1' }}
            >
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" stroke="currentColor" strokeWidth="2"/>
            </svg>
            我的显卡预约
          </h1>
        </div>
      </div>
      
      {isLoading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>加载预约数据中...</p>
        </div>
      ) : error ? (
        <div className="error-container" style={{ 
          padding: '24px',
          margin: '20px 0',
          backgroundColor: '#FFF5F5',
          borderRadius: '12px',
          color: '#9B2C2C',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          border: '1px solid #FED7D7'
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#E53E3E" strokeWidth="2"/>
            <path d="M12 8V12" stroke="#E53E3E" strokeWidth="2" strokeLinecap="round"/>
            <path d="M12 16V16.5" stroke="#E53E3E" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <h3 style={{ marginTop: '16px', color: '#822727', fontWeight: '600' }}>获取预约数据失败</h3>
          <p style={{ textAlign: 'center', maxWidth: '500px', marginTop: '8px' }}>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: '16px',
              padding: '8px 16px',
              backgroundColor: '#FEB2B2',
              color: '#9B2C2C',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            重新加载
          </button>
        </div>
      ) : (
        <div className="reservation-container">
          {/* 服务器选择标签 */}
          <div className="server-selection-container" style={{
            display: 'flex',
            backgroundColor: 'white',
            borderRadius: '10px',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)',
            padding: '5px',
            overflow: 'visible',
            width: 'fit-content',
            border: '1px solid #EDF2F7',
            marginBottom: '32px',
            marginTop: '16px'
          }}>
            {servers.map(server => (
              <button
                key={server}
                className="server-tab-button"
                onClick={() => setActiveServer(server)}
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  background: activeServer === server ? '#4299E1' : 'transparent',
                  fontSize: '14px',
                  fontWeight: activeServer === server ? '600' : '500',
                  color: activeServer === server ? 'white' : '#718096',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  position: 'relative',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  minHeight: '40px',
                  whiteSpace: 'nowrap'
                }}
                onMouseOver={(e) => {
                  if (activeServer !== server) {
                    e.currentTarget.style.backgroundColor = '#F7FAFC';
                    e.currentTarget.style.color = '#4A5568';
                  }
                }}
                onMouseOut={(e) => {
                  if (activeServer !== server) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#718096';
                  }
                }}
              >
                {server === 'all' ? (
                  <>
                    <svg 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="16" 
                      height="16" 
                      style={{ marginRight: '8px' }}
                    >
                      <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    全部服务器
                  </>
                ) : (
                  <>
                    <svg 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="16" 
                      height="16" 
                      style={{ marginRight: '8px' }}
                    >
                      <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
                      <path d="M8 8H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M8 16H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    {getServerName(server)}
                  </>
                )}
              </button>
            ))}
          </div>

          {reservations.length === 0 ? (
            <div className="empty-state-container" style={{ 
              textAlign: 'center', 
              padding: '60px 30px', 
              backgroundColor: 'white', 
              borderRadius: '12px',
              margin: '20px 0',
              color: '#4a5568',
              boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
              border: '1px dashed #E2E8F0'
            }}>
              <div style={{ 
                width: '100px', 
                height: '100px', 
                margin: '0 auto 24px', 
                backgroundColor: '#EBF8FF', 
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '4px solid #BEE3F8'
              }}>
                <svg width="50" height="50" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 7V3M16 7V3M7 11H17M5 21H19C20.1046 21 21 20.1046 21 19V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V19C3 20.1046 3.89543 21 5 21Z" stroke="#3182CE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 style={{ 
                fontSize: '24px', 
                fontWeight: '600', 
                marginBottom: '16px', 
                color: '#2D3748' 
              }}>
                暂无预约
              </h2>
              <p style={{ 
                fontSize: '16px', 
                color: '#718096', 
                maxWidth: '450px', 
                margin: '0 auto 28px',
                lineHeight: '1.6'
              }}>
                您当前没有任何显卡预约。可以前往服务器页面预约显卡资源，预约成功后将在此处显示。
              </p>
            </div>
          ) : (
            <>
              {activeServer === 'all' ? (
                // 按服务器分组显示预约
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {Object.keys(groupedReservations).map(server => (
                    <div key={server} className="reservation-server-group">
                                          <div className="reservation-server-header">
                        <h2>
                          <svg 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            xmlns="http://www.w3.org/2000/svg" 
                            width="20" 
                            height="20" 
                            style={{ marginRight: '8px', color: '#4299E1' }}
                          >
                            <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
                            <path d="M8 8H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            <path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            <path d="M8 16H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                          {getServerName(server)}
                        </h2>
                        <span className="reservation-count">
                          {groupedReservations[server].length} 个预约
                        </span>
                      </div>
                    {groupedReservations[server].length === 0 ? (
                      <div className="empty-state-container" style={{ 
                        textAlign: 'center', 
                        padding: '40px 20px', 
                        backgroundColor: 'white', 
                        borderRadius: '12px',
                        margin: '10px 0',
                        color: '#4a5568',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
                        border: '1px dashed #E2E8F0'
                      }}>
                        <div style={{ 
                          width: '80px', 
                          height: '80px', 
                          margin: '0 auto 20px', 
                          backgroundColor: '#EBF8FF', 
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '4px solid #BEE3F8'
                        }}>
                          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8 7V3M16 7V3M7 11H17M5 21H19C20.1046 21 21 20.1046 21 19V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V19C3 20.1046 3.89543 21 5 21Z" stroke="#3182CE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <p style={{ 
                          fontSize: '18px', 
                          fontWeight: '600', 
                          marginBottom: '10px', 
                          color: '#2D3748' 
                        }}>
                          {getServerName(server)} 暂无预约
                        </p>
                        <p style={{ 
                          fontSize: '14px', 
                          color: '#718096', 
                          maxWidth: '400px', 
                          margin: '0 auto 20px',
                          lineHeight: '1.5'
                        }}>
                          该服务器上没有任何预约记录，您可以前往服务器页面预约显卡资源。
                        </p>
                      </div>
                    ) : (
                    <div className="reservation-table-container">
                      <table className="reservation-table">
                        <thead>
                          <tr>
                            <th>显卡</th>
                            <th>容器ID</th>
                            <th>开始日期</th>
                            <th>结束日期</th>
                            <th>状态</th>
                            <th>操作</th>
                          </tr>
                        </thead>
                        <tbody>
                          {groupedReservations[server].map(reservation => (
                            <tr key={reservation.id}>
                              <td>
                                {renderGpuTags(reservation.gpuName)}
                              </td>
                              <td>{reservation.container}</td>
                              <td>{formatDate(reservation.startDate)}</td>
                              <td>{formatDate(reservation.endDate)}</td>
                              <td>
                                <span className={getStatusBadgeClass(reservation.status)}>
                                  {getStatusLabel(reservation.status)}
                                </span>
                              </td>
                              <td>
                                <div className="reservation-actions">
                                  {(reservation.status === 'active' || reservation.status === 'pending' || reservation.status === 'approved' || reservation.status === 'rejected') && (
                                    <button
                                      className="table-action-button"
                                      onClick={() => handleCancelReservation(reservation.id)}
                                    >
                                      取消预约
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    )}
                    </div>
                  ))}
                </div>
              ) : (
                // 显示单个服务器的预约
                <div className="reservation-table-container">
                  {filteredReservations.length === 0 ? (
                    <div className="empty-state-container" style={{ 
                      textAlign: 'center', 
                      padding: '50px 20px', 
                      backgroundColor: 'white', 
                      borderRadius: '12px',
                      margin: '20px 0',
                      color: '#4a5568',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
                      border: '1px dashed #E2E8F0'
                    }}>
                      <div style={{ 
                        width: '80px', 
                        height: '80px', 
                        margin: '0 auto 20px', 
                        backgroundColor: '#EBF8FF', 
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '4px solid #BEE3F8'
                      }}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M8 7V3M16 7V3M7 11H17M5 21H19C20.1046 21 21 20.1046 21 19V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V19C3 20.1046 3.89543 21 5 21Z" stroke="#3182CE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <h2 style={{ 
                        fontSize: '20px', 
                        fontWeight: '600', 
                        marginBottom: '12px', 
                        color: '#2D3748' 
                      }}>
                        {getServerName(activeServer)} 暂无预约
                      </h2>
                      <p style={{ 
                        fontSize: '15px', 
                        color: '#718096', 
                        maxWidth: '450px', 
                        margin: '0 auto 20px',
                        lineHeight: '1.5'
                      }}>
                        该服务器上没有任何预约记录，您可以前往服务器页面预约显卡资源。
                      </p>
                      <button 
                        onClick={() => window.location.href = `/servers/${activeServer}`}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#4299E1',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          boxShadow: '0 2px 6px rgba(66, 153, 225, 0.4)',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = '#3182CE';
                          e.currentTarget.style.boxShadow = '0 4px 8px rgba(66, 153, 225, 0.5)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = '#4299E1';
                          e.currentTarget.style.boxShadow = '0 2px 6px rgba(66, 153, 225, 0.4)';
                        }}
                      >
                        前往预约
                      </button>
                    </div>
                  ) : (
                  <table className="reservation-table">
                    <thead>
                      <tr>
                        <th>显卡</th>
                        <th>容器ID</th>
                        <th>开始日期</th>
                        <th>结束日期</th>
                        <th>状态</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReservations.map(reservation => (
                        <tr key={reservation.id}>
                          <td>
                            {renderGpuTags(reservation.gpuName)}
                          </td>
                          <td>{reservation.container}</td>
                          <td>{formatDate(reservation.startDate)}</td>
                          <td>{formatDate(reservation.endDate)}</td>
                          <td>
                            <span className={getStatusBadgeClass(reservation.status)}>
                              {getStatusLabel(reservation.status)}
                            </span>
                          </td>
                          <td>
                            <div className="reservation-actions">
                              {(reservation.status === 'active' || reservation.status === 'pending' || reservation.status === 'approved' || reservation.status === 'rejected') && (
                                <button
                                  className="table-action-button"
                                  onClick={() => handleCancelReservation(reservation.id)}
                                >
                                  取消预约
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default MyReservations; 