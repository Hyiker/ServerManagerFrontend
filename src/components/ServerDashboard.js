// 引入必要的antd组件和图标
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button, Card, Typography, Flex, Spin, Empty, Tag, theme } from 'antd';
import { DesktopOutlined, PlusOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { LoadingSpinner } from './LoadingSpinner'; // 保留您自定义的组件
import { ContainerSelectionModal } from './ContainerSelect';
import { AdvancedReservationModal } from './AdvancedReservation';

// 移除 Dashboard.css 的引入，因为样式将由AntD主题系统管理
// 如果 Dashboard.css 中还有其他必要的全局样式，请保留或迁移
// import '../assets/Dashboard.css';

const { Title, Text } = Typography;

function ServerDashboard({ serverConfig, username, onLogout }) {
  // 使用 antd 的 theme token
  const { token } = theme.useToken();

  // 从serverConfig获取配置信息 (逻辑不变)
  const API_URL = serverConfig.apiUrl;
  const SERVER_IP = serverConfig.serverIp;
  const DISPLAY_NAME = serverConfig.name;
  const SERVER_INDEX = serverConfig.index;

  // 状态定义 (逻辑不变)
  const [reservingGpu, setReservingGpu] = useState(null);
  const [showContainerModal, setShowContainerModal] = useState(false);
  const [selectedGpu, setSelectedGpu] = useState(null);
  const [loadingGpuData, setLoadingGpuData] = useState(true);
  const [showAdvancedReservation, setShowAdvancedReservation] = useState(false);
  const [gpuData, setGpuData] = useState([]);
  const [gpuUtilData, setGpuUtilData] = useState({});

  // 所有工具函数 (逻辑不变)
  const cleanGpuModel = (model) => {
    if (!model) return '';
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
  // ... 其他 formatDate, utcToLocal, localToUtc, formatDisplayTime 函数保持不变

  // 数据获取 (useEffect 逻辑不变)
  useEffect(() => {
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
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          if (response.data) {
            const formattedGpuData = response.data.map((gpu, index) => ({
              id: index + 1,
              name: `GPU ${gpu.index}`,
              usage: 0,
              memory: {
                used: 0,
                total: parseFloat((gpu.memory / 1024).toFixed(1)),
              },
              temperature: 40 + Math.floor(Math.random() * 40),
              status: gpu.allocated_to ? 'occupied' : 'available',
              user: gpu.allocated_to || null,
              reservationTime: gpu.allocated_to ? new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : null,
              usageHistory: Array(60).fill(0),
              memoryHistory: Array(60).fill(0),
              server: DISPLAY_NAME,
              model: cleanGpuModel(gpu.model),
              originalModel: gpu.model,
              pci_id: gpu.pci_id,
              index: gpu.index,
            }));
            setGpuData(formattedGpuData);
            fetchGpuUtilData();
          }
        } catch (error) {
          console.error('获取GPU数据失败:', error);
        } finally {
          setLoadingGpuData(false);
        }
    };

    const fetchGpuUtilData = async () => {
        try {
          const response = await axios.get(`${API_URL}/server/data?server_id=${SERVER_IP}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          if (response.data) {
            setGpuUtilData(response.data);
            setGpuData(prev => prev.map(gpu => {
              if (response.data[gpu.index] !== undefined) {
                const utilData = response.data[gpu.index];
                const memoryTotal = gpu.memory.total;
                const memoryUsed = utilData.memory_util ? parseFloat((utilData.memory_util * memoryTotal / 100).toFixed(1)) : 0;
                const newUsageHistory = [...gpu.usageHistory, utilData.gpu_util].slice(-60);
                const newMemoryHistory = [...gpu.memoryHistory, memoryUsed].slice(-60);
                return {
                  ...gpu,
                  usage: utilData.gpu_util,
                  memory: { ...gpu.memory, used: parseFloat(memoryUsed.toFixed(1)), total: parseFloat(memoryTotal.toFixed(1)) },
                  usageHistory: newUsageHistory,
                  memoryHistory: newMemoryHistory,
                };
              }
              return gpu;
            }));
          }
        } catch (error) {
          console.error('获取GPU使用率和显存数据失败:', error);
        }
    };

    fetchGpuData();
    const gpuUtilIntervalId = setInterval(fetchGpuUtilData, 2000);
    return () => clearInterval(gpuUtilIntervalId);
  }, [API_URL, SERVER_IP, DISPLAY_NAME]);

  // 事件处理函数 (逻辑不变)
  const handleReserveGpu = (gpuId) => {
    const gpu = gpuData.find(g => g.id === gpuId);
    if (gpu) {
      setSelectedGpu(gpu);
      setShowContainerModal(true);
    }
  };

  const handleAssignGpuToContainer = async (containerName) => {
    if (!selectedGpu) return;
    setReservingGpu(selectedGpu.id);
    setShowContainerModal(false);
    try {
      await axios.post(`${API_URL}/reserve/single`, {
        server_id: SERVER_IP,
        container_id: containerName,
        gpu_id: parseInt(selectedGpu.index),
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setGpuData(prevData =>
        prevData.map(gpu =>
          gpu.id === selectedGpu.id ? {
            ...gpu,
            status: 'occupied',
            user: containerName,
            reservationTime: new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
          } : gpu
        )
      );
      alert(`已成功将 ${selectedGpu.name} 分配给容器: ${containerName}`);
    } catch (error) {
      console.error('分配GPU失败:', error);
      let errorMessage = '未知错误';
      if (error.response) {
        const { status, data } = error.response;
        if (status === 400) errorMessage = data.message || '参数错误';
        else if (status === 401) errorMessage = '未授权，请重新登录';
        else errorMessage = data.message || `服务器错误 (${status})`;
      } else if (error.request) {
        errorMessage = '服务器无响应，请检查网络连接';
      } else {
        errorMessage = error.message;
      }
      alert(`分配GPU失败: ${errorMessage}`);
    } finally {
      setReservingGpu(null);
      setSelectedGpu(null);
    }
  };

  const toggleAdvancedReservationPanel = () => {
    setShowAdvancedReservation(true);
  };

  // =================================================================
  // 以下是重构后的渲染部分
  // =================================================================

  const renderGpuStatus = (gpu) => {
    if (gpu.status === 'available') {
      return (
        <Button
          type="primary"
          ghost // 使用幽灵按钮，样式更清爽
          icon={<ArrowRightOutlined />}
          loading={reservingGpu === gpu.id}
          onClick={() => handleReserveGpu(gpu.id)}
        >
          {reservingGpu === gpu.id ? '预约中' : '快速使用'}
        </Button>
      );
    }
    return (
      <Tag color="orange">
        使用人: {gpu.user ? gpu.user.split('-')[0] : '未知'}
      </Tag>
    );
  };

  // 动态图表颜色现在从主题中获取
  const getUsageBarColor = (value) => {
    if (value > 80) return token.colorError;
    if (value > 60) return token.colorWarning;
    if (value > 40) return token.colorInfo;
    if (value > 20) return token.colorSuccess;
    return token.colorPrimary;
  };

  const getMemoryBarColor = (percent) => {
    // 使用一种紫色系的渐变，或者直接用主题色
    if (percent > 80) return '#6b46c1'; // 可以自定义或也关联到token
    if (percent > 60) return '#805ad5';
    if (percent > 40) return '#9f7aea';
    if (percent > 20) return '#b794f4';
    return '#d6bcfa';
  };

  return (
    // 使用 Flex 布局代替 div.content-section
    <Flex vertical gap="large" style={{ padding: '24px' }}>
      {/* 1. 页面头部重构 */}
      <Card>
        <Flex justify="space-between" align="center">
          <Title level={2} style={{ margin: 0 }}>
            <DesktopOutlined style={{ color: token.colorPrimary, marginRight: '12px' }} />
            {DISPLAY_NAME}资源监控
          </Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={toggleAdvancedReservationPanel}
            disabled={loadingGpuData || gpuData.length === 0}
          >
            高级预约
          </Button>
        </Flex>
      </Card>

      {/* 2. 加载状态重构 */}
      {loadingGpuData ? (
        <Flex justify="center" align="center" style={{ minHeight: '400px' }}>
          <Spin size="large" tip="正在加载GPU数据..." />
        </Flex>
      ) : (
        <>
          {/* 3. 空状态重构 */}
          {gpuData.length === 0 ? (
            <Card>
                <Empty
                    image={<DesktopOutlined style={{ fontSize: 64, color: token.colorTextDisabled }} />}
                    imageStyle={{ height: 100 }}
                    description={
                        <>
                            <Title level={4}>无法连接服务器</Title>
                            <Text type="secondary">
                                无法获取 {DISPLAY_NAME}-{SERVER_IP} 服务器的GPU数据，请检查网络连接或服务器状态，稍后再试。
                            </Text>
                        </>
                    }
                >
                    <Button type="primary" onClick={() => window.location.reload()}>
                        重新加载
                    </Button>
                </Empty>
            </Card>
          ) : (
            // 4. GPU卡片列表重构
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
                gap: token.marginLG, // 使用主题的间距
              }}
            >
              {gpuData.map(gpu => (
                <Card
                  key={gpu.id}
                  title={
                    <Flex justify="space-between" align="center">
                      <Title level={4} style={{ margin: 0 }}>{gpu.name}</Title>
                      <Tag color="yellow" title={gpu.originalModel || gpu.model}>{gpu.model}</Tag>
                    </Flex>
                  }
                  extra={renderGpuStatus(gpu)}
                  hoverable
                >
                  <Flex gap="large">
                    {/* GPU 利用率图表 */}
                    <div className="gpu-stat" style={{ flex: 1 }}>
                      <Flex justify="space-between">
                        <Text>GPU利用率</Text>
                        <Text strong>{gpu.usage}%</Text>
                      </Flex>
                      <div className="gpu-usage-graph">
                        <div className="graph-line">
                          {gpu.usageHistory.slice(-30).map((value, index) => (
                            <div
                              key={index}
                              className="graph-bar"
                              style={{
                                height: `${value}%`,
                                background: getUsageBarColor(value), // 使用函数获取主题色
                              }}
                              data-value={`${value}%`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    {/* 显存使用图表 */}
                    <div className="gpu-stat" style={{ flex: 1 }}>
                        <Flex justify="space-between">
                            <Text>显存</Text>
                            <Text strong>{gpu.memory.used}/{gpu.memory.total}GB</Text>
                        </Flex>
                        <div className="gpu-memory-graph">
                            <div className="graph-line">
                            {gpu.memoryHistory.slice(-30).map((value, index) => {
                                const memoryPercent = (value / gpu.memory.total) * 100;
                                return (
                                    <div
                                        key={index}
                                        className="graph-bar"
                                        style={{
                                            height: `${memoryPercent}%`,
                                            background: getMemoryBarColor(memoryPercent), // 使用函数获取主题色
                                        }}
                                        data-value={`${value.toFixed(1)}GB`}
                                    />
                                );
                            })}
                            </div>
                        </div>
                    </div>
                  </Flex>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* 弹窗部分保持不变，因为它们已经是独立的组件 */}
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
      <AdvancedReservationModal
        apiUrl={API_URL}
        serverId={SERVER_IP}
        show={showAdvancedReservation}
        onClose={() => setShowAdvancedReservation(false)}
        gpuData={gpuData}
        username={username}
      />
    </Flex>
  );
}

export default ServerDashboard;
