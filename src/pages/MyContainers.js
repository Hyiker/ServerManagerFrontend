import React, { useState, useEffect } from 'react';
import '../assets/Dashboard.css';
import axios from 'axios';
import ReactDOM from 'react-dom';
import serverConfig from '../assets/server.json';

// API配置
const API_URL = serverConfig.apiUrl;

// 自定义CSS样式
const containerStyles = `
  .reservation-table {
    width: 100%;
    border-collapse: collapse;
    background: white;
    table-layout: fixed;
  }
  
  .reservation-table thead th {
    padding: 14px 16px;
    text-align: left;
    font-weight: 600;
    color: #4A5568;
    background-color: #F7FAFC;
    border-bottom: 1px solid #E2E8F0;
    font-size: 14px;
    white-space: nowrap;
  }
  
  .reservation-table th:nth-child(1) { width: 18%; } /* 容器名称 */
  .reservation-table th:nth-child(2) { width: 20%; } /* GPU索引 */
  .reservation-table th:nth-child(3) { width: 10%; } /* 端口 */
  .reservation-table th:nth-child(4) { width: 17%; } /* 创建时间 */
  .reservation-table th:nth-child(5) { width: 10%; } /* 状态 */
  .reservation-table th:nth-child(6) { width: 25%; } /* 操作 */
  
  .reservation-table tbody td {
    padding: 14px 16px;
    border-bottom: 1px solid #E2E8F0;
    color: #4A5568;
    font-size: 14px;
    vertical-align: top;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .reservation-table td:nth-child(1) { width: 18%; } /* 容器名称 */
  .reservation-table td:nth-child(2) { 
    width: 20%; 
    white-space: normal; 
    padding-left: 8px;
    vertical-align: middle;
  } /* GPU索引 - 允许换行显示标签，向左对齐 */
  .reservation-table td:nth-child(3) { width: 10%; } /* 端口 */
  .reservation-table td:nth-child(4) { width: 17%; } /* 创建时间 */
  .reservation-table td:nth-child(5) { width: 10%; } /* 状态 */
  .reservation-table td:nth-child(6) { width: 25%; white-space: normal; } /* 操作按钮允许换行 */
  
  .reservation-server-group {
    margin-bottom: 32px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    overflow: visible;
  }
  
  .reservation-server-header {
    padding: 20px 24px;
    border-bottom: 1px solid #E2E8F0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #F8FAFC;
    border-top-left-radius: 12px;
    border-top-right-radius: 12px;
  }
  
  .reservation-server-header h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #2D3748;
    display: flex;
    align-items: center;
  }
  
  .reservation-count {
    font-size: 14px;
    color: #718096;
    background-color: #EDF2F7;
    padding: 4px 12px;
    border-radius: 20px;
    font-weight: 500;
  }
  
  .reservation-table-container {
    background: white;
    border-radius: 0 0 12px 12px;
    overflow: visible;
    width: 100%;
  }
  
  .server-selection-container {
    position: relative;
    z-index: 15;
    background: transparent;
    margin: 16px 0 32px 0;
    padding: 0;
  }
  
  .server-tab-button {
    position: relative;
    z-index: 16;
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
  
  .table-action-button.extend-button {
    background-color: #48BB78;
    color: white;
  }
  
  .table-action-button.extend-button:hover {
    background-color: #38A169;
  }
  
  .table-action-button.connect-button {
    background-color: #4299E1;
    color: white;
    text-decoration: none;
    display: inline-block;
  }
  
  .table-action-button.connect-button:hover {
    background-color: #3182CE;
  }
  
  .table-action-button.restart-button {
    background-color: #ECC94B;
    color: white;
  }
  
  .table-action-button.restart-button:hover {
    background-color: #D69E2E;
  }
  
  .reservation-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
    justify-content: flex-start;
  }
`;

// 创建容器模态弹窗组件
const CreateContainerModal = ({ show, onClose, servers, onSubmit }) => {
  const [containerForm, setContainerForm] = useState({
    server_id: servers[0]?.id || '',
    name: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 当servers改变时，重置server_id
  useEffect(() => {
    if (servers.length > 0 && !containerForm.server_id) {
      setContainerForm(prev => ({
        ...prev,
        server_id: servers[0].id
      }));
    }
  }, [servers, containerForm.server_id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setContainerForm(prev => ({
      ...prev,
      [name]: value
    }));
    // 当用户开始输入时，清除错误信息
    if (error) setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 验证表单
    if (!containerForm.server_id || !containerForm.name) {
      setError('请填写完整信息');
      return;
    }

    // 容器名称验证 - 只允许字母、数字、下划线、连字符
    const nameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!nameRegex.test(containerForm.name)) {
      setError('容器名称只能包含字母、数字、下划线和连字符');
      return;
    }
    
    // 设置提交状态
    setIsSubmitting(true);
    
    // 添加注释提示，说明下划线会被转换为连字符
    const warningMsg = containerForm.name.includes('_') 
      ? '注意：名称中的下划线将被转换为连字符(-)用于创建容器'
      : '';
    
    // 调用父组件的提交方法
    onSubmit(containerForm, warningMsg)
      .catch(err => {
        setError(err.message || '创建容器失败，请稍后重试');
        setIsSubmitting(false);
      });
  };

  // 关闭模态窗时重置表单
  const handleClose = () => {
    setContainerForm({
      server_id: servers[0]?.id || '',
      name: ''
    });
    setError('');
    setIsSubmitting(false);
    onClose();
  };

  if (!show) return null;

  return ReactDOM.createPortal(
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div className="modal-content" style={{ 
        maxWidth: '450px',
        width: '95%',
        height: 'fit-content',
        minHeight: 'fit-content',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        animation: 'fadeIn 0.3s ease'
      }}>
        <div className="modal-header" style={{
          padding: '14px 20px',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#F7FAFC',
          borderTopLeftRadius: '8px',
          borderTopRightRadius: '8px'
        }}>
          <h2 style={{ 
            margin: 0, 
            fontSize: '16px', 
            fontWeight: '600',
            color: '#2D3748'
          }}>创建新容器</h2>
          <button 
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#A0AEC0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '24px',
              height: '24px',
              borderRadius: '4px',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#EDF2F7';
              e.currentTarget.style.color = '#4A5568';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#A0AEC0';
            }}
          >
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ padding: '20px' }}>
          {error && (
            <div style={{ 
                backgroundColor: '#FFF5F5',
                color: '#C53030',
                padding: '12px 16px',
              borderRadius: '6px', 
                marginBottom: '16px',
              fontSize: '14px',
              display: 'flex',
                alignItems: 'center',
                gap: '10px',
                border: '1px solid #FED7D7'
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 8V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="12" cy="16" r="1" fill="currentColor"/>
              </svg>
              {error}
            </div>
          )}
            <div style={{ marginBottom: '16px' }}>
              <label 
                htmlFor="server_id" 
                style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#4A5568'
                }}
              >
                选择服务器
              </label>
                <select 
                  id="server_id" 
                  name="server_id" 
                  value={containerForm.server_id} 
                  onChange={handleChange}
                  style={{
                    width: '100%',
                  padding: '10px 12px',
                    border: '1px solid #E2E8F0',
                  borderRadius: '6px',
                  fontSize: '14px',
                  color: '#4A5568',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
              >
                {servers.map(server => (
                  <option key={server.id} value={server.id}>{server.name}</option>
                  ))}
                </select>
                </div>
            <div style={{ marginBottom: '16px' }}>
              <label 
                htmlFor="container_name" 
                style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#4A5568'
                }}
              >
                容器名称
              </label>
              <input 
                type="text" 
                id="container_name"
                name="name" 
                placeholder="输入容器名称 (字母、数字、下划线、连字符)"
                value={containerForm.name} 
                onChange={handleChange} 
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #E2E8F0',
                  borderRadius: '6px',
                  fontSize: '14px',
                  color: '#4A5568',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
              />
              {containerForm.name.includes('_') && (
                <div style={{ 
                  marginTop: '6px', 
                  fontSize: '12px', 
                  color: '#DD6B20' 
                }}>
                  注意：名称中的下划线将被自动转换为连字符(-)用于创建容器
                </div>
              )}
            </div>
          </div>
          <div className="modal-footer" style={{
            padding: '14px 20px',
            borderTop: '1px solid #E2E8F0',
              display: 'flex', 
              justifyContent: 'flex-end', 
            gap: '10px'
            }}>
              <button 
                type="button" 
                onClick={handleClose}
                style={{
                padding: '8px 16px',
                  backgroundColor: '#EDF2F7',
                  color: '#4A5568',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#E2E8F0';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#EDF2F7';
              }}
              >
                取消
              </button>
              <button 
                type="submit"
              disabled={isSubmitting}
                style={{
                padding: '8px 16px',
                  backgroundColor: '#4299E1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '500',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.7 : 1,
                  transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onMouseOver={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.backgroundColor = '#3182CE';
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#4299E1';
              }}
            >
              {isSubmitting && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="loading-spinner">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeDasharray="32" strokeDashoffset="10">
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
              )}
              {isSubmitting ? '创建中...' : '创建容器'}
              </button>
            </div>
          </form>
      </div>
    </div>,
    document.body
  );
};

const MyContainers = ({ username }) => {
  const [containers, setContainers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeServer, setActiveServer] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [processingContainers, setProcessingContainers] = useState({});
  const [servers, setServers] = useState(['all']);
  const [availableServers, setAvailableServers] = useState([]);

  // 从server.json构建服务器映射（serverIp -> server信息）
  const serverMapping = serverConfig.servers.reduce((mapping, server, index) => {
    mapping[server.serverIp] = {
      name: server.name,
      serverIp: server.serverIp,
      index: index
    };
    return mapping;
  }, {});

  // 初始化可用服务器列表
  useEffect(() => {
    const servers = serverConfig.servers.map(server => ({
      id: server.serverIp,
      name: server.name,
      serverIp: server.serverIp
    }));
    setAvailableServers(servers);
  }, []);

  // 获取用户容器列表
  useEffect(() => {
    const fetchContainers = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // 只调用一次API获取所有容器
        const response = await axios.get(`${API_URL}/server/container/user`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          });
        
        // 处理API返回的数据
        if (response.data) {
          // 转换API数据，为每个容器添加所属服务器标识符
          const formattedContainers = response.data.map(container => {
            // 根据server_id从serverMapping中获取服务器信息
            const serverInfo = serverMapping[container.server_id];
            
            return {
              ...container,
              server: serverInfo ? serverInfo.serverIp : 'unknown',
              serverName: serverInfo ? serverInfo.name : container.server_id
            };
          });
          
          setContainers(formattedContainers);
          
          // 提取容器中的所有服务器，用于服务器选择列表
          const uniqueServerIds = [...new Set(formattedContainers.map(c => c.server))];
          const serverList = ['all', ...uniqueServerIds.filter(id => id !== 'unknown')];
          setServers(serverList);
        } else {
          setContainers([]);
        }
      } catch (err) {
        console.error('获取容器列表失败:', err);
        setError('获取容器列表失败，请稍后重试');
        
        // 如果是401错误，可能是token过期
        if (err.response && err.response.status === 401) {
          setError('登录已过期，请重新登录');
          // 可以添加重定向到登录页面或其他处理
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchContainers();
  }, []);

  // 刷新容器列表通用函数
  const refreshContainers = async () => {
    try {
      const response = await axios.get(`${API_URL}/server/container/user`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data) {
        // 转换API数据，为每个容器添加所属服务器标识符
        const formattedContainers = response.data.map(container => {
          // 根据server_id从serverMapping中获取服务器信息
          const serverInfo = serverMapping[container.server_id];
          
          return {
            ...container,
            server: serverInfo ? serverInfo.serverIp : 'unknown',
            serverName: serverInfo ? serverInfo.name : container.server_id
          };
        });
        
        setContainers(formattedContainers);
        
        // 提取容器中的所有服务器，用于服务器选择列表
        const uniqueServerIds = [...new Set(formattedContainers.map(c => c.server))];
        const serverList = ['all', ...uniqueServerIds.filter(id => id !== 'unknown')];
        setServers(serverList);
      } else {
        setContainers([]);
        setServers(['all']);
      }
      
      return true;
      } catch (err) {
      console.error('刷新容器列表失败:', err);
      return false;
      }
    };

  // 处理创建容器表单提交
  const handleCreateContainer = async (formData, warningMsg) => {
    setIsCreating(true);
    setCreateError('');
    
    try {
      // 如果有警告消息，先显示给用户
      if (warningMsg) {
        console.log(warningMsg);
        // 也可以使用一个通知或toast组件显示这个消息
      }
      
      const response = await axios.post(`${API_URL}/server/container/create`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // 创建成功
      alert('容器创建成功');
      // 关闭创建模态窗
      setShowCreateModal(false);
      
      // 刷新容器列表
      await refreshContainers();
      
      // 返回成功结果
      return response;
    } catch (err) {
      console.error('创建容器失败:', err);
      setCreateError(err.response?.data?.message || '创建容器失败，请稍后重试');
      
      // 重新抛出错误以便表单组件可以捕获
      throw err;
    } finally {
      setIsCreating(false);
    }
  };

  // 处理启动容器
  const handleStartContainer = async (serverId, containerName) => {
    // 设置操作状态
    setProcessingContainers(prev => ({
      ...prev,
      [`${serverId}-${containerName}-start`]: '启动中'
    }));
    
    try {
      await axios.post(`${API_URL}/server/container/start`, {
        server_id: serverId,
        name: containerName
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // 刷新容器列表
      await refreshContainers();
      
      // 显示成功消息
      alert('容器已启动');
    } catch (err) {
      console.error('启动容器失败:', err);
      alert(err.response?.data?.message || '启动容器失败，请稍后重试');
    } finally {
      // 清除操作状态
      setProcessingContainers(prev => {
        const newState = {...prev};
        delete newState[`${serverId}-${containerName}-start`];
        return newState;
      });
    }
  };

  // 处理停止容器
  const handleStopContainer = async (serverId, containerName) => {
    // 设置操作状态
    setProcessingContainers(prev => ({
      ...prev,
      [`${serverId}-${containerName}-stop`]: '停止中'
    }));
    
    try {
      await axios.post(`${API_URL}/server/container/stop`, {
        server_id: serverId,
        name: containerName
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // 刷新容器列表
      await refreshContainers();
      
      // 显示成功消息
      alert('容器已停止');
    } catch (err) {
      console.error('停止容器失败:', err);
      alert(err.response?.data?.message || '停止容器失败，请稍后重试');
    } finally {
      // 清除操作状态
      setProcessingContainers(prev => {
        const newState = {...prev};
        delete newState[`${serverId}-${containerName}-stop`];
        return newState;
      });
    }
  };

  // 处理重启容器
  const handleRestartContainer = async (serverId, containerName) => {
    // 设置操作状态
    setProcessingContainers(prev => ({
      ...prev,
      [`${serverId}-${containerName}-restart`]: '重启中'
    }));
    
    try {
      await axios.post(`${API_URL}/server/container/restart`, {
        server_id: serverId,
        name: containerName
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // 刷新容器列表
      await refreshContainers();
      
      // 显示成功消息
      alert('容器已重启');
    } catch (err) {
      console.error('重启容器失败:', err);
      alert(err.response?.data?.message || '重启容器失败，请稍后重试');
    } finally {
      // 清除操作状态
      setProcessingContainers(prev => {
        const newState = {...prev};
        delete newState[`${serverId}-${containerName}-restart`];
        return newState;
      });
    }
  };

  // 处理删除容器
  const handleDeleteContainer = async (serverId, containerName) => {
    // 确认删除
    if (!window.confirm(`确定要删除容器 "${containerName}" 吗？此操作不可撤销。`)) {
      return;
    }
    
    // 设置操作状态
    setProcessingContainers(prev => ({
      ...prev,
      [`${serverId}-${containerName}-delete`]: '删除中'
    }));
    
    try {
      await axios.post(`${API_URL}/server/container/delete`, {
        server_id: serverId,
        name: containerName
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // 刷新容器列表
      await refreshContainers();
      
      // 显示成功消息
      alert('容器已删除');
    } catch (err) {
      console.error('删除容器失败:', err);
      alert(err.response?.data?.message || '删除容器失败，请稍后重试');
    } finally {
      // 清除操作状态
      setProcessingContainers(prev => {
        const newState = {...prev};
        delete newState[`${serverId}-${containerName}-delete`];
        return newState;
      });
    }
  };

  // 格式化日期
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    
    try {
      const date = new Date(dateString);
      // 检查日期是否有效
      if (isNaN(date.getTime())) {
        return dateString; // 如果无法解析为日期，则原样返回
      }
      
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('日期格式化错误:', error);
      return dateString; // 发生错误时原样返回
    }
  };

  // 获取容器状态对应的图标
  const getContainerIcon = (status) => {
    const statusLower = status.toLowerCase();
    
    if (statusLower === 'running') {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 12H19" stroke="#48BB78" strokeWidth="2" strokeLinecap="round"/>
          <path d="M5 5H19" stroke="#48BB78" strokeWidth="2" strokeLinecap="round"/>
          <path d="M5 19H19" stroke="#48BB78" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      );
    } else if (statusLower === 'stopped') {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="6" y="6" width="12" height="12" rx="1" stroke="#F56565" strokeWidth="2"/>
        </svg>
      );
    } else if (statusLower === 'restarting') {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 11C20 15.418 16.418 19 12 19C7.582 19 4 15.418 4 11C4 6.582 7.582 3 12 3C14.76 3 17.2 4.334 18.64 6.4" stroke="#ECC94B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M22 3L18 7L14 3" stroke="#ECC94B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    } else {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="9" stroke="#A0AEC0" strokeWidth="2"/>
          <path d="M9 9L15 15" stroke="#A0AEC0" strokeWidth="2" strokeLinecap="round"/>
          <path d="M15 9L9 15" stroke="#A0AEC0" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      );
    }
  };
  
  // 获取容器状态的样式类名
  const getStatusBadgeClass = (status) => {
    const statusLower = status.toLowerCase();
    
    if (statusLower === 'running') {
      return 'status-badge occupied';
    } else if (statusLower === 'stopped') {
      return 'status-badge rejected';
    } else if (statusLower === 'restarting') {
      return 'status-badge pending';
    } else {
      return 'status-badge';
    }
  };

  // 获取容器状态标签
  const getStatusLabel = (status) => {
    switch (status.toLowerCase()) {
      case 'running':
        return '运行中';
      case 'stopped':
        return '已停止';
      case 'restarting':
        return '重启中';
      default:
        return status;
    }
  };

  // 格式化容器名称显示 - 只显示连字符后面的部分
  const formatContainerName = (name) => {
    if (!name) return name;
    const dashIndex = name.indexOf('-');
    return dashIndex !== -1 ? name.substring(dashIndex + 1) : name;
  };

  // 在表格中显示显卡列的内容 - 使用标签样式
  const renderGpuTags = (gpuIndices) => {
    // 如果没有GPU，显示占位符
    if (!gpuIndices || (Array.isArray(gpuIndices) && gpuIndices.length === 0)) {
      return (
        <span style={{
          backgroundColor: '#F7FAFC',
          color: '#A0AEC0',
          borderRadius: '4px',
          padding: '3px 8px',
          fontSize: '12px',
          fontWeight: '500',
          display: 'inline-block',
          border: '1px solid #E2E8F0'
        }}>
          未分配
        </span>
      );
    }

    // 转换GPU索引为标准格式
    const gpuNames = Array.isArray(gpuIndices) 
      ? gpuIndices.map(gpu => `GPU ${gpu}`)
      : [`GPU ${gpuIndices}`];

    // 如果有超过4张显卡，显示折叠布局
    if (gpuNames.length > 4) {
      return (
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '4px', 
          maxWidth: '300px',
          justifyContent: 'flex-start',
          alignItems: 'center'
        }}>
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
      );
    }
    
    // 少于等于4张显卡，直接全部显示
    return (
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: '4px', 
        maxWidth: '200px',
        justifyContent: 'flex-start',
        alignItems: 'center'
      }}>
        {gpuNames.map((gpu, index) => (
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
      </div>
    );
  };

  // Filter containers by server
  const filteredContainers = activeServer === 'all'
    ? containers
    : containers.filter(c => c.server === activeServer);

  // Group containers by server for 'all' view
  const groupedContainers = containers.reduce((groups, container) => {
    const server = container.server;
    if (!groups[server]) {
      groups[server] = [];
    }
    groups[server].push(container);
    return groups;
  }, {});

  // 获取服务器名称的辅助函数
  const getServerName = (serverKey) => {
    if (serverKey === 'all') return '全部服务器';
    
    // 从serverMapping中查找对应的服务器信息
    const serverInfo = serverMapping[serverKey];
    return serverInfo ? serverInfo.name : serverKey;
  };

  return (
    <div className="content-section" style={{ position: 'relative', minHeight: '100vh' }}>
      <style>{containerStyles}</style>
      <div className="page-header" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '0px',
        backgroundColor: 'white',
        padding: '20px 24px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
        position: 'relative',
        zIndex: 5
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
              <path d="M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z" stroke="currentColor" strokeWidth="2"/>
              <path d="M16 21V5C16 3.89543 15.1046 3 14 3H10C8.89543 3 8 3.89543 8 5V21" stroke="currentColor" strokeWidth="2"/>
            </svg>
            我的容器
          </h1>
        </div>
        <button 
          className="create-container-btn" 
          onClick={() => setShowCreateModal(true)}
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
            width: '140px',
            justifyContent: 'center'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#3182CE'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4299E1'}
        >
          <svg 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg" 
            width="18" 
            height="18" 
            style={{ marginRight: '10px' }}
          >
            <path d="M12 5V19" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <path d="M5 12H19" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          创建容器
        </button>
      </div>

      {/* 服务器选择标签 */}
      <div className="server-selection-container" style={{
        display: 'flex',
        backgroundColor: 'white',
        borderRadius: '10px',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)',
        padding: '5px',
        overflow: 'visible',
        width: 'fit-content',
        border: '1px solid #EDF2F7'
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

      {isLoading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>加载容器数据中...</p>
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
          <h3 style={{ marginTop: '16px', color: '#822727', fontWeight: '600' }}>获取容器数据失败</h3>
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
      ) : containers.length === 0 ? (
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
              <path d="M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z" stroke="#3182CE" strokeWidth="2"/>
              <path d="M16 21V5C16 3.89543 15.1046 3 14 3H10C8.89543 3 8 3.89543 8 5V21" stroke="#3182CE" strokeWidth="2"/>
            </svg>
          </div>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: '600', 
            marginBottom: '16px', 
            color: '#2D3748' 
          }}>
            暂无容器
          </h2>
          <p style={{ 
            fontSize: '16px', 
            color: '#718096', 
            maxWidth: '450px', 
            margin: '0 auto 28px',
            lineHeight: '1.6'
          }}>
            当前服务器上没有容器，或者您尚未创建任何容器。创建容器后，您可以在这里管理它们。
          </p>
        </div>
      ) : (
        <>
          {activeServer === 'all' ? (
            // 按服务器分组显示容器
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {Object.keys(groupedContainers).map(server => (
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
                      {groupedContainers[server].filter(c => !c.deleted).length} 个容器
                    </span>
                  </div>
                  {groupedContainers[server].filter(c => !c.deleted).length === 0 ? (
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
                      <path d="M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z" stroke="#3182CE" strokeWidth="2"/>
                      <path d="M16 21V5C16 3.89543 15.1046 3 14 3H10C8.89543 3 8 3.89543 8 5V21" stroke="#3182CE" strokeWidth="2"/>
                    </svg>
                  </div>
                    <p style={{ 
                      fontSize: '18px', 
                      fontWeight: '600', 
                      marginBottom: '10px', 
                      color: '#2D3748' 
                    }}>
                      {getServerName(server)} 暂无容器
                    </p>
                    <p style={{ 
                      fontSize: '14px',
                      color: '#718096', 
                      maxWidth: '400px', 
                      margin: '0 auto 20px',
                      lineHeight: '1.5'
                    }}>
                      该服务器上没有任何容器，您可以点击"创建容器"按钮在该服务器上创建容器。
                    </p>
                  </div>
                ) : (
                <div className="reservation-table-container">
                  <table className="reservation-table">
                    <thead>
                      <tr>
                        <th>容器名称</th>
                        <th>GPU</th>
                        <th>端口</th>
                        <th>创建时间</th>
                        <th>状态</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupedContainers[server].filter(c => !c.deleted).map(container => (
                        <tr key={`${container.server_id}-${container.name}`}>
                          <td 
                            style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: '600' }}
                            title={formatContainerName(container.name)}
                          >
                            {formatContainerName(container.name)}
                          </td>
                          <td>
                            {renderGpuTags(container.allocated_gpus)}
                          </td>
                          <td style={{ fontFamily: 'monospace', fontSize: '14px' }}>{container.port || '-'}</td>
                          <td>{formatDate(container.created_at)}</td>
                          <td>
                            <span className={getStatusBadgeClass(container.status)}>
                              {getStatusLabel(container.status)}
                            </span>
                          </td>
                          <td>
                            <div className="reservation-actions">
                              {container.status.toLowerCase() === 'running' ? (
                                <>
                                  {/* 暂时禁用停止按钮 */}
                                  {/* <button
                                    className="table-action-button"
                                    onClick={() => handleStopContainer(container.server_id, container.name)}
                                    disabled={!!processingContainers[`${container.server_id}-${container.name}-stop`]}
                                  >
                                    {processingContainers[`${container.server_id}-${container.name}-stop`] || '停止'}
                                  </button> */}
                                  {/* 暂时禁用重启按钮 */}
                                  {/* <button
                                    className="table-action-button restart-button"
                                    onClick={() => handleRestartContainer(container.server_id, container.name)}
                                    disabled={!!processingContainers[`${container.server_id}-${container.name}-restart`]}
                                  >
                                    {processingContainers[`${container.server_id}-${container.name}-restart`] || '重启'}
                                  </button> */}
                                  <span style={{ color: '#718096', fontSize: '14px', fontStyle: 'italic' }}>暂时禁用操作</span>
                                </>
                              ) : (
                                <button
                                  className="table-action-button extend-button"
                                  onClick={() => handleStartContainer(container.server_id, container.name)}
                                  disabled={!!processingContainers[`${container.server_id}-${container.name}-start`]}
                                >
                                  {processingContainers[`${container.server_id}-${container.name}-start`] || '启动'}
                                </button>
                              )}
                              {/* 暂时禁用删除按钮 */}
                              {/* <button
                                className="table-action-button"
                                onClick={() => handleDeleteContainer(container.server_id, container.name)}
                                disabled={!!processingContainers[`${container.server_id}-${container.name}-delete`]}
                              >
                                {processingContainers[`${container.server_id}-${container.name}-delete`] || '删除'}
                              </button> */}
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
            <div className="reservation-table-container" style={{
              backgroundColor: 'white',
              borderRadius: '10px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              overflowX: 'auto',
              width: '100%'
            }}>
              {filteredContainers.filter(c => !c.deleted).length === 0 ? (
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
                      <path d="M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z" stroke="#3182CE" strokeWidth="2"/>
                      <path d="M16 21V5C16 3.89543 15.1046 3 14 3H10C8.89543 3 8 3.89543 8 5V21" stroke="#3182CE" strokeWidth="2"/>
                    </svg>
                  </div>
                  <h2 style={{ 
                    fontSize: '20px', 
                    fontWeight: '600', 
                    marginBottom: '12px', 
                    color: '#2D3748' 
                  }}>
                    {getServerName(activeServer)} 暂无容器
                  </h2>
                  <p style={{ 
                    fontSize: '15px', 
                    color: '#718096', 
                    maxWidth: '450px', 
                    margin: '0 auto 20px',
                    lineHeight: '1.5'
                  }}>
                    当前服务器上没有容器，您可以点击上方的"创建容器"按钮创建新容器。
                  </p>
                </div>
              ) : (
              <table className="reservation-table">
                <thead>
                  <tr>
                    <th>容器名称</th>
                    <th>GPU索引</th>
                    <th>端口</th>
                    <th>创建时间</th>
                    <th>状态</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContainers.filter(c => !c.deleted).map(container => (
                    <tr key={`${container.server_id}-${container.name}`}>
                      <td 
                        style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: '600' }}
                        title={formatContainerName(container.name)}
                      >
                        {formatContainerName(container.name)}
                      </td>
                      <td>
                        {renderGpuTags(container.allocated_gpus)}
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '14px' }}>
                        {container.port || '-'}
                      </td>
                      <td>
                        {formatDate(container.created_at)}
                      </td>
                      <td>
                        <span className={getStatusBadgeClass(container.status)}>
                          {getStatusLabel(container.status)}
                        </span>
                      </td>
                      <td>
                        <div className="reservation-actions">
                          {container.status.toLowerCase() === 'running' ? (
                            <>
                              {/* 暂时禁用停止按钮 */}
                              {/* <button
                                className="table-action-button"
                                onClick={() => handleStopContainer(container.server_id, container.name)}
                                disabled={!!processingContainers[`${container.server_id}-${container.name}-stop`]}
                              >
                                {processingContainers[`${container.server_id}-${container.name}-stop`] || '停止'}
                              </button> */}
                              {/* 暂时禁用重启按钮 */}
                              {/* <button
                                className="table-action-button restart-button"
                                onClick={() => handleRestartContainer(container.server_id, container.name)}
                                disabled={!!processingContainers[`${container.server_id}-${container.name}-restart`]}
                              >
                                {processingContainers[`${container.server_id}-${container.name}-restart`] || '重启'}
                              </button> */}
                              <span style={{ color: '#718096', fontSize: '14px', fontStyle: 'italic' }}>运行中</span>
                            </>
                          ) : (
                            <button
                              className="table-action-button extend-button"
                              onClick={() => handleStartContainer(container.server_id, container.name)}
                              disabled={!!processingContainers[`${container.server_id}-${container.name}-start`]}
                            >
                              {processingContainers[`${container.server_id}-${container.name}-start`] || '启动'}
                            </button>
                          )}
                          {/* 暂时禁用删除按钮 */}
                          {/* <button
                            className="table-action-button"
                            onClick={() => handleDeleteContainer(container.server_id, container.name)}
                            disabled={!!processingContainers[`${container.server_id}-${container.name}-delete`]}
                          >
                            {processingContainers[`${container.server_id}-${container.name}-delete`] || '删除'}
                          </button> */}
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

      {/* CreateContainerModal 组件 */}
      <CreateContainerModal 
        show={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        servers={availableServers}
        onSubmit={handleCreateContainer}
      />
    </div>
  );
};

export default MyContainers; 