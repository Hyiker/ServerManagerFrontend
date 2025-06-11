import React, { useState, useEffect } from 'react';
import { Button, message, Modal, Form, Input, Spin } from 'antd';
import axios from 'axios';
import '../assets/Dashboard.css';
// 导入服务器配置
import serverConfig from '../assets/server.json';

// 创建 axios 实例
const api = axios.create({
  baseURL: serverConfig.apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 自定义CSS样式
const userManagementStyles = `
  .user-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    border: 1px solid #E2E8F0;
    margin-bottom: 16px;
    transition: all 0.2s;
  }
  
  .user-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
  
  .user-card-header {
    padding: 16px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .user-info {
    display: flex;
    align-items: center;
    gap: 24px;
    flex: 1;
  }
  
  .user-name {
    font-size: 16px;
    font-weight: 600;
    color: #2D3748;
    min-width: 120px;
  }
  
  .user-meta-item {
    font-size: 14px;
    color: #718096;
    min-width: 100px;
  }
  
  .user-meta-label {
    font-weight: 500;
    color: #4A5568;
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
  
  .status-badge.admin {
    background-color: #E6FFFA;
    color: #2C7A7B;
    border: 1px solid #B2F5EA;
  }
  
  .status-badge.user {
    background-color: #EBF8FF;
    color: #2C5282;
    border: 1px solid #BEE3F8;
  }
  
  .user-actions {
    display: flex;
    gap: 12px;
    align-items: center;
  }
  
  .container-info-button {
    background-color: #4299E1;
    color: white;
    border: none;
    padding: 6px 12px;
    font-size: 13px;
    font-weight: 500;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  
  .container-info-button:hover {
    background-color: #3182CE;
  }
  
  .container-info-button.active {
    background-color: #2B6CB0;
  }
  
  .containers-content {
    border-top: 1px solid #E2E8F0;
    background-color: #F7FAFC;
    overflow: hidden;
    transition: all 0.3s ease-in-out;
  }
  
  .containers-content.collapsed {
    max-height: 0;
    opacity: 0;
  }
  
  .containers-content.expanded {
    max-height: 500px;
    opacity: 1;
    padding: 16px 24px;
  }
  
  .container-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px 16px;
    background: white;
    border: 1px solid #E2E8F0;
    border-radius: 8px;
    margin-bottom: 8px;
    font-size: 13px;
    transition: all 0.2s;
  }
  
  .container-item:hover {
    border-color: #CBD5E0;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
  
  .container-item:last-child {
    margin-bottom: 0;
  }
  
  .container-name {
    font-weight: 600;
    color: #2D3748;
    font-family: monospace;
    min-width: 120px;
  }
  
  .container-field {
    display: flex;
    align-items: center;
    gap: 4px;
    min-width: 0;
  }
  
  .container-label {
    color: #718096;
    font-weight: 500;
    white-space: nowrap;
  }
  
  .container-value {
    color: #4A5568;
    font-family: monospace;
  }
  
  .container-status {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
    min-width: 60px;
    justify-content: center;
  }
  
  .container-status.running {
    background-color: #C6F6D5;
    color: #22543D;
    border: 1px solid #9AE6B4;
  }
  
  .container-status.stopped {
    background-color: #FED7D7;
    color: #742A2A;
    border: 1px solid #FEB2B2;
  }
  
  .container-status.paused {
    background-color: #FEEBC8;
    color: #7B341E;
    border: 1px solid #F6AD55;
  }
  
  .empty-containers {
    text-align: center;
    padding: 32px;
    color: #718096;
    font-style: italic;
  }
  
  .add-user-button {
    background-color: #48BB78;
    color: white;
    border: none;
    padding: 10px 20px;
    font-size: 14px;
    font-weight: 500;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 2px 4px rgba(72, 187, 120, 0.3);
  }
  
  .add-user-button:hover {
    background-color: #38A169;
    box-shadow: 0 4px 8px rgba(72, 187, 120, 0.4);
    transform: translateY(-1px);
  }
  
  .password-requirements {
    margin-top: 8px;
    padding: 12px;
    background-color: #F7FAFC;
    border-radius: 8px;
    border: 1px solid #E2E8F0;
  }
  
  .password-requirements p {
    font-weight: 500;
    margin-bottom: 8px;
    color: #4A5568;
  }
  
  .password-requirements ul {
    list-style: none;
    padding-left: 0;
    margin-bottom: 0;
  }
  
  .password-requirements li {
    display: flex;
    align-items: center;
    padding: 4px 0;
    font-size: 13px;
  }
  
  .password-requirements li.valid {
    color: #38A169;
  }
  
  .password-requirements li.invalid {
    color: #E53E3E;
  }
  
  .password-requirements li::before {
    content: "";
    display: inline-block;
    width: 14px;
    height: 14px;
    margin-right: 8px;
    background-size: contain;
    background-repeat: no-repeat;
  }
  
  .password-requirements li.valid::before {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2338A169'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M5 13l4 4L19 7'%3E%3C/path%3E%3C/svg%3E");
  }
  
  .password-requirements li.invalid::before {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23E53E3E'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 18L18 6M6 6l12 12'%3E%3C/path%3E%3C/svg%3E");
  }
`;

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [password, setPassword] = useState('');
  const [expandedContainers, setExpandedContainers] = useState({});

  // 获取用户列表
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setError(null);
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        message.error('请先登录');
        return;
      }
      
      const response = await api.get('server/users/all', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.status === 200) {
        setUsers(response.data || []);
      }
    } catch (error) {
      console.error('获取用户列表失败:', error);
      setError('获取用户列表失败，请稍后再试');
      message.error('获取用户列表失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  // 密码合规性检查
  const validatePassword = (password) => {
    if (password.length < 8) {
      return { valid: false, message: '密码长度必须至少为8个字符' };
    }
    
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    
    if (!hasLowercase || !hasNumber) {
      return { valid: false, message: '密码必须包含至少一个小写字母和一个数字' };
    }
    
    return { valid: true };
  };

  // 添加用户
  const handleAddUser = async (values) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        message.error('请先登录');
        return;
      }
      
      // 密码合规性检查
      const passwordCheck = validatePassword(values.password);
      if (!passwordCheck.valid) {
        message.error(passwordCheck.message);
        return;
      }
      
      // 密码确认验证
      if (values.password !== values.confirmPassword) {
        message.error('两次输入的密码不一致');
        return;
      }
      
      const response = await api.post('/auth/register', {
        username: values.username,
        password: values.password,
        root: values.root === 'true'
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.status === 201) {
        message.success('用户添加成功');
        setModalVisible(false);
        form.resetFields();
        setPassword('');
        fetchUsers();
      }
    } catch (error) {
      console.error('添加用户失败:', error);
      if (error.response && error.response.data && error.response.data.message) {
        message.error(`添加用户失败: ${error.response.data.message}`);
      } else {
        message.error('添加用户失败，请稍后再试');
      }
    }
  };

  // 格式化容器名称显示
  const formatContainerName = (name) => {
    if (!name) return '';
    const dashIndex = name.indexOf('-');
    return dashIndex !== -1 ? name.substring(dashIndex + 1) : name;
  };

  // 格式化日期显示
  const formatDate = (dateStr) => {
    if (!dateStr) return '从未登录';
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 获取容器状态显示
  const getContainerStatusClass = (status) => {
    switch (status) {
      case 'running': return 'container-status running';
      case 'stopped': return 'container-status stopped';
      case 'paused': return 'container-status paused';
      default: return 'container-status';
    }
  };

  const getContainerStatusText = (status) => {
    switch (status) {
      case 'running': return '运行中';
      case 'stopped': return '已停止';
      case 'paused': return '已暂停';
      default: return status || '未知';
    }
  };

  // 切换容器展开/折叠状态
  const toggleContainerExpansion = (userName) => {
    setExpandedContainers(prev => ({
      ...prev,
      [userName]: !prev[userName]
    }));
  };

  // 渲染容器信息
  const renderContainers = (containers) => {
    if (!containers || containers.length === 0) {
      return (
        <div className="empty-containers">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: '8px' }}>
            <rect x="3" y="4" width="18" height="16" rx="2" stroke="#CBD5E0" strokeWidth="2"/>
            <path d="M7 8h10M7 12h10M7 16h6" stroke="#CBD5E0" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <div>暂无容器</div>
        </div>
      );
    }

    return (
      <div>
        {containers.map((container, index) => (
          <div key={index} className="container-item">
            <div className="container-name">{formatContainerName(container.name)}</div>
            
            <div className="container-field">
              <span className="container-label">服务器:</span>
              <span className="container-value">{container.server_id}</span>
            </div>
            
            <div className="container-field">
              <span className="container-label">IP:</span>
              <span className="container-value">{container.ip_address}</span>
            </div>
            
            <div className="container-field">
              <span className="container-label">端口:</span>
              <span className="container-value">{container.port}</span>
            </div>
            
            <div className="container-field">
              <span className="container-label">创建:</span>
              <span className="container-value">{formatDate(container.created_at)}</span>
            </div>
            
            {container.allocated_gpus && container.allocated_gpus.length > 0 && (
              <div className="container-field">
                <span className="container-label">GPU:</span>
                <span className="container-value">{container.allocated_gpus.join(', ')}</span>
              </div>
            )}
            
            <div className={getContainerStatusClass(container.status)}>
              {getContainerStatusText(container.status)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // 对用户进行排序：管理员优先，然后按首字母排序
  const sortUsers = (users) => {
    return [...users].sort((a, b) => {
      // 首先按管理员权限排序（root: true 在前）
      if (a.root !== b.root) {
        return b.root ? 1 : -1;
      }
      // 然后按用户名首字母排序
      return a.name.localeCompare(b.name, 'zh-CN');
    });
  };

  return (
    <>
      <style>{userManagementStyles}</style>
      
      {error && (
        <div style={{ 
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
          <h3 style={{ marginTop: '16px', color: '#822727', fontWeight: '600' }}>获取用户数据失败</h3>
          <p style={{ textAlign: 'center', maxWidth: '500px', marginTop: '8px' }}>{error}</p>
          <button 
            onClick={fetchUsers}
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
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            用户管理
          </h1>
        </div>
        <div>
          <button className="add-user-button" onClick={() => setModalVisible(true)}>
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            添加用户
          </button>
        </div>
      </div>
      
      {loading ? (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          padding: '100px 0',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <Spin size="large" />
          <p style={{ color: '#718096', fontSize: '16px' }}>正在加载用户数据...</p>
        </div>
      ) : users.length === 0 ? (
        <div style={{ 
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
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="#3182CE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" stroke="#3182CE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: '600', 
            marginBottom: '16px', 
            color: '#2D3748' 
          }}>
            暂无用户
          </h2>
          <p style={{ 
            fontSize: '16px', 
            color: '#718096', 
            maxWidth: '450px', 
            margin: '0 auto 28px',
            lineHeight: '1.6'
          }}>
            系统中还没有用户数据。您可以点击上方的"添加用户"按钮来创建新用户。
          </p>
        </div>
      ) : (
        <div className="users-container">
          {sortUsers(users).map((user) => (
            <div key={user.name} className="user-card">
              <div className="user-card-header">
                <div className="user-info">
                  <div className="user-name">{user.name}</div>
                  
                  <div className="user-meta-item">
                    <span className="user-meta-label">最后登录: </span>
                    {formatDate(user.last_login)}
                  </div>
                  
                  <div className="user-meta-item">
                    <span className="user-meta-label">容器: </span>
                    {user.containers ? user.containers.length : 0} 个
                  </div>
                </div>
                
                <div className="user-actions">
                  <span className={`status-badge ${user.root ? 'admin' : 'user'}`}>
                    {user.root ? '管理员' : '普通用户'}
                  </span>
                  
                  <button 
                    className={`container-info-button ${expandedContainers[user.name] ? 'active' : ''}`}
                    onClick={() => toggleContainerExpansion(user.name)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
                      <path d="M7 8h10M7 12h10M7 16h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    容器信息
                  </button>
                </div>
              </div>
              
              <div className={`containers-content ${expandedContainers[user.name] ? 'expanded' : 'collapsed'}`}>
                {renderContainers(user.containers)}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* 添加用户模态框 */}
      <Modal
        title="添加用户"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setPassword('');
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddUser}
          initialValues={{ root: 'false' }}
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>
          
          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password 
              placeholder="请输入密码" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Form.Item>
          
          <div className="password-requirements">
            <p>密码要求：</p>
            <ul>
              <li className={password.length >= 8 ? 'valid' : 'invalid'}>
                至少8个字符
              </li>
              <li className={/[a-z]/.test(password) ? 'valid' : 'invalid'}>
                包含至少一个小写字母
              </li>
              <li className={/[0-9]/.test(password) ? 'valid' : 'invalid'}>
                包含至少一个数字
              </li>
            </ul>
          </div>
          
          <Form.Item
            name="confirmPassword"
            label="确认密码"
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致!'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="请再次输入密码" />
          </Form.Item>
          
          <Form.Item
            name="root"
            label="用户权限"
            rules={[{ required: true, message: '请选择用户权限' }]}
          >
            <select style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d9d9d9' }}>
              <option value="false">普通用户</option>
              <option value="true">管理员</option>
            </select>
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ width: '100%' }}>
              添加用户
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default UserManagement; 