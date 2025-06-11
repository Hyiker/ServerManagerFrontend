import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LoadingSpinner } from './LoadingSpinner';
import { ContainerSelectionModal } from './ContainerSelect';
import { AdvancedReservationModal } from './AdvancedReservation';

import '../assets/Dashboard.css';

function ServerDashboard({ serverConfig, username, onLogout }) {
  // 从serverConfig获取配置信息
  const API_URL = serverConfig.apiUrl;
  const SERVER_IP = serverConfig.serverIp;
  const DISPLAY_NAME = serverConfig.name;
  const SERVER_INDEX = serverConfig.index;

  // 预约相关状态，保留但不使用
  const [reservingGpu, setReservingGpu] = useState(null);
  const [showReservationPanel] = useState(false);
  
  // 容器选择弹窗状态
  const [showContainerModal, setShowContainerModal] = useState(false);
  const [selectedGpu, setSelectedGpu] = useState(null);
  
  // 添加GPU数据加载状态
  const [loadingGpuData, setLoadingGpuData] = useState(true);
  
  // 添加高级预约面板状态
  const [showAdvancedReservation, setShowAdvancedReservation] = useState(false);
  
  // 清理显卡型号名称，去掉常见前缀
  const cleanGpuModel = (model) => {
    if (!model) return '';
    
    // 去掉常见的前缀词汇
    return model
      .replace(/^NVIDIA\s*/i, '')
      .replace(/^RTX\s*/i, '')
      .replace(/^GeForce\s*/i, '')
      .replace(/^GTX\s*/i, '')
      .replace(/^Quadro\s*/i, '')
      .replace(/^Tesla\s*/i, '')
      .replace(/^Titan\s*/i, '')
      .trim();
  };
  
  // 格式化日期为YYYY-MM-DD
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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

  // 格式化显示时间（将UTC时间转换为本地时间显示）
  const formatDisplayTime = (utcTimeString) => {
    if (!utcTimeString) return null;
    const localDate = utcToLocal(utcTimeString);
    return localDate.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 显卡数据状态 - 由于API已经过滤了服务器，这里只存储当前服务器的GPU数据
  const [gpuData, setGpuData] = useState([]);
  // 添加GPU使用率和显存数据状态
  const [gpuUtilData, setGpuUtilData] = useState({});
  
  // 从后端获取GPU信息
  useEffect(() => {
    // 当服务器配置变化时，清除之前的数据和状态
    setGpuData([]);
    setGpuUtilData({});
    setReservingGpu(null);
    setSelectedGpu(null);
    setShowContainerModal(false);
    setShowAdvancedReservation(false);
    
    const fetchGpuData = async () => {
      setLoadingGpuData(true);
      try {
        const response = await axios.get(`${API_URL}/server/gpus?server_id=${SERVER_IP}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.data) {
          // 处理从API获取的数据，转换为应用所需的格式
          const formattedGpuData = response.data.map((gpu, index) => {
            // 初始使用率和显存为0，不依赖旧数据
            const usage = 0;
            // 计算显存使用量（以GB为单位）并四舍五入到一位小数
            const memoryTotal = parseFloat((gpu.memory / 1024).toFixed(1)); // 转换为GB并四舍五入到一位小数
            const memoryUsed = 0;
            
            // 初始化空的历史数据数组
            const usageHistory = Array(60).fill(0);
            const memoryHistory = Array(60).fill(0);
          
          return {
              id: index + 1,
              name: `GPU ${gpu.index}`,
              usage: usage,
            memory: {
                used: parseFloat(memoryUsed.toFixed(1)), 
                total: memoryTotal 
              },
              temperature: 40 + Math.floor(Math.random() * 40), // 随机温度 40-80
              status: gpu.allocated_to ? 'occupied' : 'available',
              user: gpu.allocated_to || null,
              reservationTime: gpu.allocated_to ? new Date().toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              }) : null,
              usageHistory: usageHistory,
              memoryHistory: memoryHistory,
              server: DISPLAY_NAME,
              model: cleanGpuModel(gpu.model),
              originalModel: gpu.model, // 保存原始型号用于悬停显示
              pci_id: gpu.pci_id,
              index: gpu.index
            };
          });
          
          // 直接设置GPU数据，因为API已经按服务器过滤了
          setGpuData(formattedGpuData);
          
          // 获取GPU使用率和显存数据
          fetchGpuUtilData();
        }
      } catch (error) {
        console.error('获取GPU数据失败:', error);
      } finally {
        setLoadingGpuData(false);
      }
    };
    
    // 获取GPU使用率和显存数据的函数
    const fetchGpuUtilData = async () => {
      try {
        console.log(API_URL);
        console.log(SERVER_IP)
        const response = await axios.get(`${API_URL}/server/data?server_id=${SERVER_IP}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (response.data) {
          setGpuUtilData(response.data);
          
          // 更新GPU数据中的使用率和显存
          setGpuData(prev => {
            return prev.map(gpu => {
              if (response.data[gpu.index] !== undefined) {
                const utilData = response.data[gpu.index];
                const memoryTotal = gpu.memory.total;
                const memoryUsed = utilData.memory_util ? parseFloat((utilData.memory_util * memoryTotal / 100).toFixed(1)) : 0;
                
                // 更新历史数据
                const newUsageHistory = [...gpu.usageHistory, utilData.gpu_util].slice(-60);
                const newMemoryHistory = [...gpu.memoryHistory, memoryUsed].slice(-60);
                
                return {
                  ...gpu,
                  usage: utilData.gpu_util,
                  memory: {
                    ...gpu.memory,
                    used: parseFloat(memoryUsed.toFixed(1)),
                    total: parseFloat(memoryTotal.toFixed(1))
                  },
                  usageHistory: newUsageHistory,
                  memoryHistory: newMemoryHistory
                };
              }
              return gpu;
            });
          });
        }
      } catch (error) {
        console.error('获取GPU使用率和显存数据失败:', error);
      }
    };
    
    // 组件挂载时获取数据
    fetchGpuData();
    
    // 设置定时器每2秒更新GPU使用率和显存数据
    const gpuUtilIntervalId = setInterval(fetchGpuUtilData, 2000);
    
    // 组件卸载时清除定时器
    return () => {
      clearInterval(gpuUtilIntervalId);
    };
  }, [API_URL, SERVER_IP, DISPLAY_NAME]); // 添加依赖项，当服务器配置变化时重新获取数据

  // 监听预约面板状态变化
  useEffect(() => {
    console.log("预约面板状态变化:", showReservationPanel);
  }, [showReservationPanel]);

  // 修改处理显卡预约函数
  const handleReserveGpu = (gpuId) => {
    // 保存所选GPU信息并显示容器选择弹窗
    const gpu = gpuData.find(g => g.id === gpuId);
    if (gpu) {
      setSelectedGpu(gpu);
      setShowContainerModal(true);
    }
  };
  
  // 处理GPU分配到容器
  const handleAssignGpuToContainer = async (containerName) => {
    if (!selectedGpu) return;
    
    // 设置正在预约中的状态
    setReservingGpu(selectedGpu.id);
    setShowContainerModal(false);
    
    try {
      // 调用后端API进行GPU分配
      const response = await axios.post(`${API_URL}/reserve/single`, {
        server_id: SERVER_IP,
        container_id: containerName,
        gpu_id: parseInt(selectedGpu.index)
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // 更新显卡状态
      setGpuData(prevData => 
        prevData.map(gpu => 
          gpu.id === selectedGpu.id ? 
          { 
            ...gpu, 
            status: 'occupied', 
            user: containerName,
            reservationTime: new Date().toLocaleString('zh-CN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            })
          } : 
          gpu
        )
      );
      
      // 提示分配成功
      alert(`已成功将 ${selectedGpu.name} 分配给容器: ${containerName}`);
    } catch (error) {
      console.error('分配GPU失败:', error);
      let errorMessage = '未知错误';
      
      // 处理不同类型的错误响应
      if (error.response) {
        // 服务器返回了错误响应
        const { status, data } = error.response;
        
        if (status === 400) {
          errorMessage = data.message || '参数错误';
        } else if (status === 401) {
          errorMessage = '未授权，请重新登录';
          // 可能需要重定向到登录页面
          // window.location.href = '/login';
        } else {
          errorMessage = data.message || `服务器错误 (${status})`;
        }
      } else if (error.request) {
        // 请求已发送但没有收到响应
        errorMessage = '服务器无响应，请检查网络连接';
      } else {
        // 请求设置时出现问题
        errorMessage = error.message;
      }
      
      alert(`分配GPU失败: ${errorMessage}`);
    } finally {
      // 重置状态
      setReservingGpu(null);
      setSelectedGpu(null);
    }
  };

  // 修改toggleReservationPanel函数，不再显示面板
  const toggleReservationPanel = () => {
    // 不执行任何操作，仅保留函数以避免错误
    console.log('预约功能暂未启用');
    setShowAdvancedReservation(true); // 打开高级预约面板
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
                <path d="M9.75 17L9 20L8 21H16L15 20L14.25 17M3 13H21M5 17H19C20.1046 17 21 16.1046 21 15V5C21 3.89543 20.1046 3 19 3H5C3.89543 3 3 5.89543 3 5V15C3 16.1046 3.89543 17 5 17Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {DISPLAY_NAME}资源监控
            </h1>
          </div>
          <button 
            className="view-reservation-button"
            onClick={toggleReservationPanel}
            style={{
              backgroundColor: '#4299E1',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: loadingGpuData || gpuData.length === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              boxShadow: '0 2px 6px rgba(66, 153, 225, 0.3)',
              transition: 'all 0.2s ease',
              opacity: loadingGpuData || gpuData.length === 0 ? 0.7 : 1,
              width: '140px',
              justifyContent: 'center'
            }}
            disabled={loadingGpuData || gpuData.length === 0}
            onMouseOver={(e) => {
              if (!(loadingGpuData || gpuData.length === 0)) {
                e.currentTarget.style.backgroundColor = '#3182CE';
              }
            }}
            onMouseOut={(e) => {
              if (!(loadingGpuData || gpuData.length === 0)) {
                e.currentTarget.style.backgroundColor = '#4299E1';
              }
            }}
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
            高级预约
          </button>
        </div>
        
        {loadingGpuData ? (
          <div className="loading-container" style={{ textAlign: 'center', padding: '50px 0' }}>
            <LoadingSpinner size="large" text="正在加载GPU数据..." />
          </div>
        ) : (
          <>
        {gpuData.length === 0 ? (
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
                <path d="M9.75 17L9 20L8 21H16L15 20L14.25 17M3 13H21M5 17H19C20.1046 17 21 16.1046 21 15V5C21 3.89543 20.1046 3 19 3H5C3.89543 3 3 5.89543 3 5V15C3 16.1046 3.89543 17 5 17Z" stroke="#3182CE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 style={{ 
              fontSize: '24px', 
              fontWeight: '600', 
              marginBottom: '16px', 
              color: '#2D3748' 
            }}>
              无法连接服务器
            </h2>
            <p style={{ 
              fontSize: '16px', 
              color: '#718096', 
              maxWidth: '450px', 
              margin: '0 auto 28px',
              lineHeight: '1.6'
            }}>
              无法获取{DISPLAY_NAME}-{SERVER_IP}服务器的GPU数据，请检查网络连接或服务器状态，稍后再试。
            </p>
            <button 
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 20px',
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
              重新加载
            </button>
          </div>
        ) : (
        <div className="gpu-container">
        {gpuData.map(gpu => (
            <div key={gpu.id} className="gpu-card">
            <div className="gpu-header">
                <div className="gpu-header-left">
                  <h2>{gpu.name}</h2>
                  {gpu.model && (
                    <div className="gpu-model" title={gpu.originalModel || gpu.model}>{gpu.model}</div>
                  )}
                </div>
                <div className={`gpu-status ${gpu.status === 'available' ? 'available' : 'occupied'}`} 
                     style={{ 
                       cursor: gpu.status === 'available' ? 'pointer' : 'default',
                       display: 'flex',
                       alignItems: 'center',
                       justifyContent: 'center',
                       padding: gpu.status === 'available' ? '6px 12px' : '6px 10px',
                       transition: 'all 0.2s ease',
                       boxShadow: gpu.status === 'available' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                       border: gpu.status === 'available' ? '1px solid #38a169' : 'none',
                       fontWeight: gpu.status === 'available' ? '500' : '400'
                     }}
                     onClick={() => gpu.status === 'available' && !reservingGpu && handleReserveGpu(gpu.id)}
                     onMouseOver={(e) => {
                       if (gpu.status === 'available' && !reservingGpu) {
                         e.currentTarget.style.backgroundColor = '#34D399';
                         e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.15)';
                       }
                     }}
                     onMouseOut={(e) => {
                       if (gpu.status === 'available') {
                         e.currentTarget.style.backgroundColor = '';
                         e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                       }
                     }}
                >
                {gpu.status === 'available' ? (
                  reservingGpu === gpu.id ? (
                    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                      <LoadingSpinner size="small" color="white" />
                      <span style={{marginLeft: '6px'}}>预约中...</span>
                    </div>
                  ) : (
                    <><svg 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="14" 
                      height="14" 
                      style={{ marginRight: '5px' }}
                    >
                      <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 5L19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>快速使用</>
                  )
                ) : (
                  <>使用人: <span>{gpu.user ? gpu.user.split('-')[0] : ''}</span></>
                )}
                </div>
            </div>
            
            <div className="gpu-stats">
                {/* GPU利用率历史图表 */}
                <div className="gpu-stat">
                <div className="graph-title">
                    <span>GPU利用率</span>
                    <span>{gpu.usage}%</span>
                </div>
                <div className="gpu-usage-graph">
                    <div className="graph-line-container">
                    <div className="graph-grid-line"></div>
                    <div className="graph-grid-line"></div>
                    <div className="graph-grid-line"></div>
                    <div className="graph-grid-line"></div>
                    </div>
                    <div className="graph-line">
                    {gpu.usageHistory.slice(-30).map((value, index) => {
                        // 根据使用率值决定颜色
                        let barColor;
                        if (value > 80) {
                            barColor = '#e53e3e'; // 红色
                        } else if (value > 60) {
                            barColor = '#dd6b20'; // 橙色
                        } else if (value > 40) {
                            barColor = '#d69e2e'; // 黄色
                        } else if (value > 20) {
                            barColor = '#38a169'; // 绿色
                        } else {
                            barColor = '#3182ce'; // 蓝色
                        }
                        
                        return (
                            <div 
                            key={index} 
                            className="graph-bar" 
                            style={{
                                height: `${value}%`,
                                opacity: value > 5 ? 1 : 0.5,
                                flexBasis: `${100/30}%`,
                                background: barColor
                            }}
                            data-value={`${value}%`}
                            ></div>
                        );
                    })}
                    </div>
                </div>
                </div>
                
                {/* 显存使用历史图表 */}
                <div className="gpu-stat">
                <div className="graph-title">
                    <span>显存</span>
                    <span>{gpu.memory.used}/{gpu.memory.total}GB</span>
                </div>
                <div className="gpu-memory-graph">
                    <div className="graph-line-container">
                    <div className="graph-grid-line"></div>
                    <div className="graph-grid-line"></div>
                    <div className="graph-grid-line"></div>
                    <div className="graph-grid-line"></div>
                    </div>
                    <div className="graph-line">
                    {gpu.memoryHistory.slice(-30).map((value, index) => {
                        // 计算内存使用率百分比
                        const memoryPercent = (value / gpu.memory.total) * 100;
                        // 根据内存使用率决定颜色
                        let barColor;
                        if (memoryPercent > 80) {
                            barColor = '#6b46c1'; // 紫色（高）
                        } else if (memoryPercent > 60) {
                            barColor = '#805ad5'; // 紫色（中高）
                        } else if (memoryPercent > 40) {
                            barColor = '#9f7aea'; // 紫色（中）
                        } else if (memoryPercent > 20) {
                            barColor = '#b794f4'; // 紫色（中低）
                        } else {
                            barColor = '#d6bcfa'; // 紫色（低）
                        }
                        
                        return (
                            <div 
                            key={index} 
                            className="graph-bar graph-bar-memory" 
                            style={{
                                height: `${memoryPercent}%`,
                                opacity: memoryPercent > 5 ? 1 : 0.5,
                                flexBasis: `${100/30}%`,
                                background: barColor
                            }}
                            data-value={`${value.toFixed(1)}GB`}
                            ></div>
                        );
                    })}
                    </div>
                </div>
                </div>
            </div>
            </div>
        ))}
        </div>
            )}
          </>
        )}

        {/* 添加容器选择弹窗 */}
        <ContainerSelectionModal
          apiUrl={API_URL}
          serverId={SERVER_IP}
          show={showContainerModal}
          onClose={() => {
            setShowContainerModal(false);
            setSelectedGpu(null);
          }}
          gpuId={selectedGpu?.id}
          gpuName={selectedGpu?.name}
          onConfirm={handleAssignGpuToContainer}
        />

        {/* 添加高级预约面板 */}
        <AdvancedReservationModal
          apiUrl={API_URL}
          serverId={SERVER_IP}
          show={showAdvancedReservation}
          onClose={() => setShowAdvancedReservation(false)}
          gpuData={gpuData}
          username={username}
        />

        {/* 添加必要的样式 */}
        <style jsx="true">{`
          .gpu-status.available {
            background-color: #38a169;
            color: white;
          }
          
          .gpu-status.available:hover {
            background-color: #34D399;
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          .spinner-small {
            animation: spin 1s linear infinite;
          }
        `}</style>
    </div>
  );
}

export default ServerDashboard; 