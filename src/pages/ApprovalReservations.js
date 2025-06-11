import React, { useState, useEffect } from 'react';
import { Typography, Table, Button, Tag, message, Space, Popconfirm, Modal, Alert, Spin } from 'antd';
import axios from 'axios';
import '../assets/Dashboard.css';
import serverConfig from '../assets/server.json';

const { Title } = Typography;

// 创建 axios 实例
const api = axios.create({
  baseURL: serverConfig.apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 自定义CSS样式
const approvalStyles = `
  .reservation-table {
    width: 100%;
    border-collapse: collapse;
    background: white;
  }
  
  .reservation-table thead th {
    padding: 14px 16px;
    text-align: left;
    font-weight: 600;
    color: #4A5568;
    background-color: #F7FAFC;
    border-bottom: 1px solid #E2E8F0;
    font-size: 14px;
  }
  
  .reservation-table tbody td {
    padding: 14px 16px;
    border-bottom: 1px solid #E2E8F0;
    color: #4A5568;
    font-size: 14px;
  }
  
  .status-badge {
    display: inline-flex;
    align-items: center;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
  }
  
  .status-badge.occupied {
    background-color: #E6FFFA;
    color: #2C7A7B;
  }
  
  .status-badge.pending {
    background-color: #FFFBEB;
    color: #975A16;
  }
  
  .status-badge.rejected {
    background-color: #FFF5F5;
    color: #9B2C2C;
  }
  
  .status-badge.scheduled {
    background-color: #EBF8FF;
    color: #2C5282;
  }
  
  .status-badge.completed {
    background-color: #F0FFF4;
    color: #276749;
  }
  
  .table-action-button {
    padding: 6px 12px;
    background-color: #E2E8F0;
    color: #4A5568;
    border: none;
    border-radius: 4px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    margin-right: 6px;
  }
  
  .table-action-button:hover {
    background-color: #CBD5E0;
  }
  
  .table-action-button.approve-button {
    background-color: #48BB78;
    color: white;
  }
  
  .table-action-button.approve-button:hover {
    background-color: #38A169;
  }
  
  .table-action-button.details-button {
    background-color: #4299E1;
    color: white;
  }
  
  .table-action-button.details-button:hover {
    background-color: #3182CE;
  }
  
  .table-action-button.reject-button {
    background-color: #F56565;
    color: white;
  }
  
  .table-action-button.reject-button:hover {
    background-color: #E53E3E;
  }
  
  .reservation-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  
  .ant-table-wrapper .ant-table-thead > tr > th {
    padding: 14px 16px;
    text-align: left;
    font-weight: 600;
    color: #4A5568;
    background-color: #F7FAFC;
    border-bottom: 1px solid #E2E8F0;
    font-size: 14px;
  }
  
  .ant-table-wrapper .ant-table-tbody > tr > td {
    padding: 14px 16px;
    border-bottom: 1px solid #E2E8F0;
    color: #4A5568;
    font-size: 14px;
  }
`;

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  
  // 后端传来的是UTC时间，自动转换为浏览器本地时区显示
  const date = new Date(dateStr);
  
  // 检查日期是否有效
  if (isNaN(date.getTime())) {
    return dateStr;
  }
  
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
    // 移除timeZone设置，使用浏览器本地时区
  });
};

// 工具函数：将UTC时间字符串转换为本地时间显示
const convertUtcToLocal = (utcTimeString) => {
  if (!utcTimeString) return null;
  // JavaScript的Date构造函数会自动将UTC时间转换为本地时区
  return new Date(utcTimeString);
};

// 工具函数：将本地时间转换为UTC时间字符串（如果需要向后端发送时间）
const convertLocalToUtc = (localTime) => {
  if (!localTime) return null;
  const date = new Date(localTime);
  return date.toISOString();
};

// 服务器ID映射
const getServerName = (serverId) => {
  if (serverId === 'server_1' || serverId === 'server1') return '之江144';
  if (serverId === 'server_2' || serverId === 'server2') return '之江56';
  return serverId;
};

// 分配状态映射
const getAllocationStatus = (status) => {
  const statusMap = {
    'pending': '待审批',
    'approved': '已批准',
    'active': '使用中',
    'terminated': '已结束',
    'rejected': '已拒绝'
  };
  return statusMap[status] || status;
};

// 获取状态标签的CSS类
const getStatusBadgeClass = (status) => {
  const statusMap = {
    'pending': 'status-badge pending',
    'approved': 'status-badge scheduled',
    'active': 'status-badge occupied',
    'terminated': 'status-badge completed',
    'rejected': 'status-badge rejected'
  };
  return statusMap[status] || 'status-badge';
};

const ApprovalReservations = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [currentReservation, setCurrentReservation] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  // 获取待审批的预约列表
  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      setError(null);
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        message.error('请先登录');
        return;
      }
      
      // 获取待审批的预约
      const response = await api.get('/reserve/reservations/pending', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.status === 200) {
        // 格式化响应数据
        const formattedData = (response.data || []).map(item => ({
          id: item._id,
          username: item.user_id,
          server: item.server_id,
          gpuName: item.gpu_list,
          startDate: item.allocation_start_time,
          endDate: item.allocation_end_time,
          createdAt: item.created_at || new Date().toISOString(),
          status: item.allocation_status,
          containerId: item.container_id,
          allocationType: item.allocation_type,
          description: item.description || ''
        }));
        setReservations(formattedData);
      }
    } catch (error) {
      console.error('获取预约列表失败:', error);
      setError('获取预约列表失败，请稍后再试');
      message.error('获取预约列表失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  // 处理审批通过
  const handleApprove = async (id) => {
    try {
      setProcessingId(id);
      const token = localStorage.getItem('token');
      
      if (!token) {
        message.error('请先登录');
        return;
      }
      
      const response = await api.post('/reserve/reservations/approve', {
        allocation_id: id
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.status === 200) {
        message.success('预约已审批通过');
        // 刷新列表
        fetchReservations();
      }
    } catch (error) {
      console.error('审批失败:', error);
      message.error('审批失败，请稍后再试');
    } finally {
      setProcessingId(null);
    }
  };

  // 处理审批拒绝
  const handleReject = async (id) => {
    try {
      setProcessingId(id);
      const token = localStorage.getItem('token');
      
      if (!token) {
        message.error('请先登录');
        return;
      }
      
      const response = await api.post('/reserve/reservations/reject', {
        allocation_id: id
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.status === 200) {
        message.success('已拒绝该预约');
        // 刷新列表
        fetchReservations();
      }
    } catch (error) {
      console.error('操作失败:', error);
      message.error('操作失败，请稍后再试');
    } finally {
      setProcessingId(null);
    }
  };

  // 查看预约详情
  const showDetails = (record) => {
    setCurrentReservation(record);
    setDetailModalVisible(true);
  };

  // 渲染GPU标签
  const renderGpuTags = (gpuList) => {
    if (!gpuList || !Array.isArray(gpuList) || gpuList.length === 0) return <span>无选择</span>;
    
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
        {gpuList.map((gpuId, index) => (
          <span 
            key={index} 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '2px 8px',
              backgroundColor: '#EBF8FF',
              color: '#2C5282',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: '500',
              border: '1px solid #BEE3F8'
            }}
          >
            GPU {gpuId}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="content-section">
      <style>{approvalStyles}</style>
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
              <path d="M9 12H15M9 16H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L18.7071 8.70711C18.8946 8.89464 19 9.149 19 9.41421V19C19 20.1046 18.1046 21 17 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M13 3V7C13 8.10457 13.8954 9 15 9H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            预约审批
          </h1>
        </div>
        <button 
          onClick={fetchReservations}
          style={{
            backgroundColor: '#4299E1',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 20px',
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            boxShadow: '0 2px 6px rgba(66, 153, 225, 0.3)',
            transition: 'all 0.2s ease',
            cursor: 'pointer'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#3182CE'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4299E1'}
          disabled={loading}
        >
          {loading ? (
            <>
              <svg 
                width="18" 
                height="18" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                style={{ marginRight: '8px', animation: 'spin 1s linear infinite' }}
              >
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeDasharray="30 30" strokeDashoffset="0">
                  <animateTransform
                    attributeName="transform"
                    attributeType="XML"
                    type="rotate"
                    from="0 12 12"
                    to="360 12 12"
                    dur="1s"
                    repeatCount="indefinite"
                  />
                </circle>
              </svg>
              正在刷新...
            </>
          ) : (
            <>
              <svg 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg" 
                width="18" 
                height="18" 
                style={{ marginRight: '8px' }}
              >
                <path d="M4 4V9H4.58152M19.9381 11C19.446 7.05369 16.0796 4 12 4C8.64262 4 5.76829 6.06817 4.58152 9M4.58152 9H9M20 20V15H19.4185M19.4185 15C18.2317 17.9318 15.3574 20 12 20C7.92038 20 4.55399 16.9463 4.06189 13M19.4185 15H15" 
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              刷新
            </>
          )}
        </button>
      </div>
      
      {error && (
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
            onClick={fetchReservations}
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
      )}
      
      {loading ? (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          padding: '100px 0' 
        }}>
          <Spin size="large" tip="正在加载预约数据..." />
        </div>
      ) : (
        <>
          {!loading && reservations.length === 0 ? (
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
                  <path d="M9 12H15M9 16H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L18.7071 8.70711C18.8946 8.89464 19 9.149 19 9.41421V19C19 20.1046 18.1046 21 17 21Z" stroke="#3182CE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M13 3V7C13 8.10457 13.8954 9 15 9H19" stroke="#3182CE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 style={{ 
                fontSize: '24px', 
                fontWeight: '600', 
                marginBottom: '16px', 
                color: '#2D3748' 
              }}>
                暂无待审批预约
              </h2>
              <p style={{ 
                fontSize: '16px', 
                color: '#718096', 
                maxWidth: '450px', 
                margin: '0 auto 28px',
                lineHeight: '1.6'
              }}>
                当前没有需要审批的显卡预约申请。用户提交的预约申请将在此处显示，等待您的审批。
              </p>
            </div>
          ) : (
            <div className="reservation-table-container" style={{
              backgroundColor: 'white',
              borderRadius: '10px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              overflowX: 'auto'
            }}>
              <table className="reservation-table">
                <thead>
                  <tr>
                    <th>用户</th>
                    <th>服务器</th>
                    <th>GPU</th>
                    <th>开始日期</th>
                    <th>结束日期</th>
                    <th>申请时间</th>
                    <th>状态</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map(record => (
                    <tr key={record.id}>
                      <td>{record.username}</td>
                      <td>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '3px 10px',
                            backgroundColor: record.server === 'server_1' || record.server === 'server1' ? '#F0FFF4' : '#FAF5FF',
                            color: record.server === 'server_1' || record.server === 'server1' ? '#276749' : '#553C9A',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '500',
                            border: record.server === 'server_1' || record.server === 'server1' ? '1px solid #C6F6D5' : '1px solid #E9D8FD'
                          }}
                        >
                          {getServerName(record.server)}
                        </span>
                      </td>
                      <td>{renderGpuTags(record.gpuName)}</td>
                      <td>{formatDate(record.startDate)}</td>
                      <td>{formatDate(record.endDate)}</td>
                      <td>{formatDate(record.createdAt)}</td>
                      <td>
                        <span className={getStatusBadgeClass(record.status)}>
                          {getAllocationStatus(record.status)}
                        </span>
                      </td>
                      <td>
                        <div className="reservation-actions">
                          <button 
                            className="table-action-button details-button"
                            onClick={() => showDetails(record)}
                          >
                            详情
                          </button>
                          <Popconfirm
                            title="确认通过该预约申请？"
                            onConfirm={() => handleApprove(record.id)}
                            okText="确认"
                            cancelText="取消"
                          >
                            <button 
                              className="table-action-button approve-button"
                              disabled={processingId === record.id}
                            >
                              {processingId === record.id ? '处理中...' : '通过'}
                            </button>
                          </Popconfirm>
                          <Popconfirm
                            title="确认拒绝该预约申请？"
                            onConfirm={() => handleReject(record.id)}
                            okText="确认"
                            cancelText="取消"
                          >
                            <button 
                              className="table-action-button reject-button"
                              disabled={processingId === record.id}
                            >
                              {processingId === record.id ? '处理中...' : '拒绝'}
                            </button>
                          </Popconfirm>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      
      {/* 预约详情模态框 */}
      <Modal
        title="预约详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <button
            key="approve"
            className="table-action-button approve-button"
            style={{ marginRight: '8px' }}
            onClick={() => {
              handleApprove(currentReservation?.id);
              setDetailModalVisible(false);
            }}
          >
            通过
          </button>,
          <button
            key="reject"
            className="table-action-button reject-button"
            style={{ marginRight: '8px' }}
            onClick={() => {
              handleReject(currentReservation?.id);
              setDetailModalVisible(false);
            }}
          >
            拒绝
          </button>,
          <button
            key="back"
            className="table-action-button"
            onClick={() => setDetailModalVisible(false)}
          >
            关闭
          </button>,
        ]}
        width={700}
      >
        {currentReservation && (
          <div className="reservation-detail" style={{ 
            fontSize: '14px',
            lineHeight: '1.6'
          }}>
            <p><strong>用户:</strong> {currentReservation.username}</p>
            <p><strong>服务器:</strong> {getServerName(currentReservation.server)}</p>
            <p><strong>GPU:</strong> {renderGpuTags(currentReservation.gpuName)}</p>
            <p><strong>分配类型:</strong> {currentReservation.allocationType === 'multiple' ? '多GPU' : '单GPU'}</p>
            <p><strong>容器ID:</strong> <span style={{ fontFamily: 'monospace', fontSize: '14px' }}>{currentReservation.containerId}</span></p>
            <p><strong>状态:</strong> <span className={getStatusBadgeClass(currentReservation.status)}>{getAllocationStatus(currentReservation.status)}</span></p>
            <p><strong>开始日期:</strong> {formatDate(currentReservation.startDate)}</p>
            <p><strong>结束日期:</strong> {formatDate(currentReservation.endDate)}</p>
            <p><strong>申请时间:</strong> {formatDate(currentReservation.createdAt)}</p>
            {currentReservation.description && (
              <p><strong>申请理由:</strong> {currentReservation.description}</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ApprovalReservations; 