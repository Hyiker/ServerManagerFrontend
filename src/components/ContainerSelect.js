import React, { useState, useEffect} from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import { LoadingSpinner } from './LoadingSpinner';
import serverConfig from '../assets/server.json';
// 添加容器选择弹窗组件
export const ContainerSelectionModal = ({ apiUrl, serverId, show, onClose, gpuId, gpuName, onConfirm }) => {
    const [containers, setContainers] = useState([]);
    const [selectedContainer, setSelectedContainer] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // 格式化容器名称显示 - 只显示连字符后面的部分
    const formatContainerName = (name) => {
      if (!name) return name;
      const dashIndex = name.indexOf('-');
      return dashIndex !== -1 ? name.substring(dashIndex + 1) : name;
    };

    // 从server.json构建服务器映射（serverIp -> server信息）
    const serverMapping = serverConfig.servers.reduce((mapping, server, index) => {
      mapping[server.serverIp] = {
        name: server.name,
        serverIp: server.serverIp,
        index: index
      };
      return mapping;
    }, {});

    // 获取服务器名称
    const getServerName = (serverId) => {
      const serverInfo = serverMapping[serverId];
      return serverInfo ? serverInfo.name : serverId;
    };
  
    // 获取用户的容器列表
    useEffect(() => {
      if (show) {
        const fetchContainers = async () => {
          setIsLoading(true);
          try {
            const response = await axios.get(`${apiUrl}/server/container/user`, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
              }
            });
            
            // 筛选出运行中且在当前服务器上的容器
            const runningContainers = response.data.filter(container => 
              container.status.toLowerCase() === 'running' && 
              container.server_id === serverId
            );
            
            setContainers(runningContainers);
            // 如果有可用容器，默认选中第一个
            if (runningContainers.length > 0) {
              setSelectedContainer(runningContainers[0].name);
            }
          } catch (err) {
            console.error('获取容器列表失败:', err);
            setError('无法获取容器列表，请稍后重试');
          } finally {
            setIsLoading(false);
          }
        };
        
        fetchContainers();
      }
    }, [show, serverId]);
    
    // 处理确认分配
    const handleConfirm = () => {
      if (!selectedContainer) {
        setError('请选择一个容器');
        return;
      }
      
      onConfirm(selectedContainer);
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
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          width: '380px',
          maxWidth: '95%',
          height: 'fit-content',
          minHeight: 'fit-content',
          animation: 'fadeIn 0.3s ease',
          overflow: 'hidden'
        }}>
          <div className="modal-header" style={{
            padding: '12px 16px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#F7FAFC'
          }}>
            <h2 style={{ 
              margin: 0, 
              fontSize: '16px', 
              fontWeight: '600',
              color: '#2D3748'
            }}>选择要分配GPU的容器</h2>
            <button 
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                color: '#A0AEC0',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {e.currentTarget.style.backgroundColor = '#EDF2F7'; e.currentTarget.style.color = '#4A5568';}}
              onMouseOut={(e) => {e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#A0AEC0';}}
              title="关闭"
            >&times;</button>
          </div>
          
          <div style={{ padding: '16px' }}>
            <p style={{ 
              fontSize: '14px', 
              color: '#4A5568', 
              marginTop: 0,
              marginBottom: '16px' 
            }}>
              您正在为 <span style={{ fontWeight: '600', color: '#3182CE' }}>{gpuName}</span> 选择容器
            </p>
            
            {error && (
              <div style={{ 
                backgroundColor: '#FED7D7', 
                color: '#9B2C2C', 
                padding: '8px 10px', 
                borderRadius: '6px', 
                marginBottom: '12px', 
                fontSize: '13px'
              }}>
                {error}
              </div>
            )}
            
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <LoadingSpinner text="正在加载容器列表..." />
              </div>
            ) : containers.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '10px 0', 
                color: '#718096',
                backgroundColor: '#F7FAFC',
                borderRadius: '6px',
                width: '100%',
                boxSizing: 'border-box'
              }}>
                <p style={{ margin: '0', fontSize: '13px' }}>
                  没有可用的容器，请先创建并启动一个容器
                </p>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <label 
                    htmlFor="container-select" 
                    style={{ 
                      display: 'block', 
                      marginBottom: '4px', 
                      fontSize: '13px',
                      fontWeight: '500',
                      color: '#4A5568'
                    }}
                  >
                    选择容器:
                  </label>
                  <div style={{ position: 'relative' }}>
                    <select 
                      id="container-select"
                      value={selectedContainer}
                      onChange={(e) => setSelectedContainer(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: '1px solid #E2E8F0',
                        fontSize: '13px',
                        appearance: 'none',
                        background: 'white',
                        color: '#2D3748',
                        paddingRight: '35px'
                      }}
                    >
                      {containers.map(container => (
                        <option key={`${container.server_id}-${container.name}`} value={container.name}>
                          {formatContainerName(container.name)} ({getServerName(container.server_id)})
                        </option>
                      ))}
                    </select>
                    <div style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      pointerEvents: 'none'
                    }}>
                      <svg 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="14" 
                        height="14"
                      >
                        <path d="M6 9L12 15L18 9" stroke="#4A5568" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div style={{
                  borderTop: '1px solid #EDF2F7',
                  paddingTop: '12px',
                  display: 'flex',
                  justifyContent: 'flex-end'
                }}>
                  <button
                    type="button"
                    onClick={onClose}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: '#EDF2F7',
                      color: '#4A5568',
                      fontSize: '13px',
                      fontWeight: '500',
                      marginRight: '10px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {e.currentTarget.style.backgroundColor = '#E2E8F0';}}
                    onMouseOut={(e) => {e.currentTarget.style.backgroundColor = '#EDF2F7';}}
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: '#4299E1',
                      color: 'white',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {e.currentTarget.style.backgroundColor = '#3182CE';}}
                    onMouseOut={(e) => {e.currentTarget.style.backgroundColor = '#4299E1';}}
                  >
                    确认分配
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>,
      document.body
    );
  };