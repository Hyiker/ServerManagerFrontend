import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Table,
  Tag,
  Spin,
  Alert,
  Card,
  Typography,
  Button,
  theme,
  Empty,
  Tabs,
  Space,
  Tooltip,
  Modal, // 用于确认对话框
  message // 用于提示信息
} from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  DesktopOutlined,
  InfoCircleOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import serverConfig from '../assets/server.json';

const { Title, Text } = Typography;
const API_URL = serverConfig.apiUrl;

const MyReservations = () => {
  // 核心：在组件顶部获取 antd theme token
  const { token } = theme.useToken();

  // --- 状态管理 ---
  const [reservations, setReservations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeServer, setActiveServer] = useState('all');

  // --- 数据处理与获取 ---

  // 从 server.json 构建服务器 IP 到信息的映射，便于查找
  const serverMapping = serverConfig.servers.reduce((mapping, server) => {
    mapping[server.serverIp] = { name: server.name, id: server.id };
    return mapping;
  }, {});

  // 获取服务器名称
  const getServerName = (serverIp) => serverMapping[serverIp]?.name || serverIp;

  // 格式化日期
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // API 调用：获取预约记录
  useEffect(() => {
    const fetchReservations = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${API_URL}/reserve/reservations/user`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        // 将 API 返回数据转换为前端需要的格式
        const formattedReservations = response.data.map(res => ({
          id: res._id,
          server: res.server_id,
          gpuName: res.gpu_list.map(gpuIndex => `GPU ${gpuIndex}`),
          container: res.container_id,
          startDate: res.allocation_start_time,
          endDate: res.allocation_end_time,
          status: res.allocation_status, // 保持 API 的原始状态
        }));
        setReservations(formattedReservations);

      } catch (err) {
        console.error('获取预约记录失败:', err);
        let errorMessage = '获取预约记录失败，请稍后重试。';
        if (err.response?.status === 401) {
          errorMessage = '登录已过期，请重新登录。';
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        }
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReservations();
  }, []);

  // API 调用：取消预约
  const handleCancelReservation = (reservationId) => {
    Modal.confirm({
      title: '确定要取消这个预约吗？',
      icon: <ExclamationCircleOutlined />,
      content: '此操作不可撤销。',
      okText: '确认取消',
      okType: 'danger',
      cancelText: '再想想',
      onOk: async () => {
        try {
          message.loading({ content: '正在取消预约...', key: 'cancel_reservation' });
          await axios.post(`${API_URL}/reserve/terminate`,
            { allocation_id: reservationId },
            { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
          );
          setReservations(prev => prev.filter(res => res.id !== reservationId));
          message.success({ content: '预约已成功取消！', key: 'cancel_reservation' });
        } catch (err) {
          console.error('取消预约失败:', err);
          let errorMessage = '操作失败，请稍后重试。';
          if (err.response?.data?.message) {
            errorMessage = err.response.data.message;
          }
          message.error({ content: `取消预约失败: ${errorMessage}`, key: 'cancel_reservation' });
        }
      },
    });
  };

  // --- UI 渲染辅助函数 ---

  // 渲染 GPU 标签
  const renderGpuTags = (gpuNames) => {
    if (!Array.isArray(gpuNames) || gpuNames.length === 0) return <Tag>N/A</Tag>;
    const tags = gpuNames.map((gpu, index) => <Tag key={index} color="geekblue">{gpu}</Tag>);
    if (gpuNames.length > 4) {
      return (
        <Space direction="vertical" size="small">
          <Space wrap size={[0, 4]}>{tags.slice(0, 3)}<Tooltip title={gpuNames.slice(3).join(', ')}><Tag>+{gpuNames.length - 3}</Tag></Tooltip></Space>
          <Text type="secondary" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
            <InfoCircleOutlined />总计 {gpuNames.length} 张显卡
          </Text>
        </Space>
      );
    }
    return <Space wrap size={[0, 4]}>{tags}</Space>;
  };

  // 渲染状态标签
  const getStatusTag = (status) => {
    switch (status) {
      case 'active': return <Tag icon={<CheckCircleOutlined />} color="success">使用中</Tag>;
      case 'approved': return <Tag icon={<CheckCircleOutlined />} color="cyan">已批准</Tag>;
      case 'pending': return <Tag icon={<ClockCircleOutlined />} color="processing">待审批</Tag>;
      case 'rejected': return <Tag icon={<CloseCircleOutlined />} color="error">不通过</Tag>;
      default: return <Tag color="default">{status || '未知'}</Tag>;
    }
  };

  // 定义 Table 的列
  const columns = [
    { title: '显卡', dataIndex: 'gpuName', key: 'gpuName', render: renderGpuTags, width: '25%' },
    { title: '容器ID', dataIndex: 'container', key: 'container', width: '20%', render: (text) => <Text copyable style={{fontFamily: 'monospace'}}>{text}</Text> },
    { title: '开始时间', dataIndex: 'startDate', key: 'startDate', render: formatDate, width: '17%' },
    { title: '结束时间', dataIndex: 'endDate', key: 'endDate', render: formatDate, width: '17%' },
    { title: '状态', dataIndex: 'status', key: 'status', render: getStatusTag, width: '10%' },
    {
      title: '操作',
      key: 'action',
      width: '11%',
      render: (_, record) => (
        <Button
          type="link"
          danger
          onClick={() => handleCancelReservation(record.id)}
          disabled={!['active', 'pending', 'approved', 'rejected'].includes(record.status)}
        >
          取消预约
        </Button>
      ),
    },
  ];

  // --- 主要渲染逻辑 ---

  // 加载状态
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Spin size="large" tip="正在加载您的预约数据..." />
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <Card>
        <Alert
          message="加载失败"
          description={error}
          type="error"
          showIcon
          action={<Button type="primary" onClick={() => window.location.reload()}>重试</Button>}
        />
      </Card>
    );
  }

  // 准备 Tabs 数据
  const serverTabItems = ['all', ...new Set(reservations.map(res => res.server))].map(serverIp => ({
    key: serverIp,
    label: (
      <Space>
        {serverIp === 'all' ? <UnorderedListOutlined /> : <DesktopOutlined />}
        {serverIp === 'all' ? '全部服务器' : getServerName(serverIp)}
      </Space>
    ),
  }));

  // 主要内容渲染
  const renderContent = () => {
    // 整体无数据
    if (reservations.length === 0) {
      return (
        <Card><Empty description="您还没有任何预约记录。"><Button type="primary" onClick={() => window.location.href = '/server/0'}>前往预约</Button></Empty></Card>
      );
    }

    // 按服务器分组数据
    const groupedReservations = reservations.reduce((groups, res) => {
      const server = res.server;
      if (!groups[server]) groups[server] = [];
      groups[server].push(res);
      return groups;
    }, {});

    // 如果选择“全部服务器”
    if (activeServer === 'all') {
      return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {Object.keys(groupedReservations).map(serverIp => (
            <Card key={serverIp} title={<Space><DesktopOutlined /><Text strong>{getServerName(serverIp)}</Text></Space>} extra={<Tag>{groupedReservations[serverIp].length} 个预约</Tag>}>
              <Table columns={columns} dataSource={groupedReservations[serverIp]} rowKey="id" pagination={false} size="middle" />
            </Card>
          ))}
        </Space>
      );
    }

    // 如果选择单个服务器
    const filteredReservations = reservations.filter(res => res.server === activeServer);
    if (filteredReservations.length === 0) {
      return <Empty description={`在 ${getServerName(activeServer)} 上没有预约记录。`} />;
    }
    return <Table columns={columns} dataSource={filteredReservations} rowKey="id" size="middle" />;
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card>
        <Title level={2} style={{ marginTop: 0 }}>
          <CheckCircleOutlined style={{ color: token.colorPrimary, marginRight: '12px' }} />
          我的显卡预约
        </Title>
        <Text type="secondary">这里汇总了您在所有服务器上的显卡预约记录。</Text>
      </Card>

      <Card>
        <Tabs activeKey={activeServer} onChange={setActiveServer} items={serverTabItems} />
        <div style={{ marginTop: '24px' }}>{renderContent()}</div>
      </Card>
    </Space>
  );
};

export default MyReservations;
