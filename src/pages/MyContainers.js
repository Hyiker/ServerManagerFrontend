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
  Modal,
  message,
  Form,    // 导入 Form 组件
  Input,   // 导入 Input 组件
  Select,  // 导入 Select 组件
  Popconfirm // 用于更轻量的确认
} from 'antd';
import {
  AppstoreAddOutlined,
  CaretRightOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  DesktopOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  PoweroffOutlined,
  ReloadOutlined,
  StopOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import serverConfig from '../assets/server.json';

const { Title, Text } = Typography;
const { Option } = Select;
const API_URL = serverConfig.apiUrl;

// --- 组件：创建容器的模态框 ---
const CreateContainerModal = ({ visible, onCancel, servers, onSubmit }) => {
  const [form] = Form.useForm(); // antd Form hook
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 监听 server_id 变化，显示提示
  const serverIdValue = Form.useWatch('server_id', form);

  const handleFinish = async (values) => {
    setIsSubmitting(true);
    try {
      await onSubmit(values);
      form.resetFields(); // 成功后清空表单
      onCancel(); // 关闭模态框
    } catch (error) {
      // 错误已在 onSubmit 中处理，这里不需要额外操作
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      title="创建新容器"
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="back" onClick={onCancel}>取消</Button>,
        <Button key="submit" type="primary" loading={isSubmitting} onClick={() => form.submit()}>
          创建容器
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{ server_id: servers[0]?.id }}
      >
        <Form.Item
          name="server_id"
          label="选择服务器"
          rules={[{ required: true, message: '请选择一个服务器' }]}
        >
          <Select placeholder="请选择服务器">
            {servers.map(server => (
              <Option key={server.id} value={server.id}>{server.name}</Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          name="name"
          label="容器名称"
          rules={[
            { required: true, message: '请输入容器名称' },
            { pattern: /^[a-zA-Z0-9_-]+$/, message: '名称只能包含字母、数字、下划线和连字符' },
          ]}
          help={form.getFieldValue('name')?.includes('_') ? "注意：名称中的下划线将被转换为连字符(-)" : null}
        >
          <Input placeholder="例如：my-pytorch-env" />
        </Form.Item>
      </Form>
    </Modal>
  );
};


// --- 主组件：我的容器页面 ---
const MyContainers = () => {
  const { token } = theme.useToken();

  // --- 状态管理 ---
  const [containers, setContainers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeServer, setActiveServer] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [availableServers, setAvailableServers] = useState([]);
  const [processingState, setProcessingState] = useState({}); // 管理所有操作的加载状态

  // --- 数据处理与获取 ---

  const serverMapping = serverConfig.servers.reduce((map, s) => ({ ...map, [s.serverIp]: s }), {});
  const getServerName = (serverIp) => serverMapping[serverIp]?.name || serverIp;
  const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleString('zh-CN') : 'N/A';
  const formatContainerName = (name) => name?.split('-').slice(1).join('-') || name; // 截取用户名前缀

  // 通用 API 调用函数
  const apiCall = async (endpoint, payload, action, containerId) => {
    setProcessingState(prev => ({ ...prev, [containerId]: action }));
    const loadingKey = `${action}-${containerId}`;
    message.loading({ content: `${action}...`, key: loadingKey });

    try {
      await axios.post(`${API_URL}${endpoint}`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      message.success({ content: `${action}成功！`, key: loadingKey });
      await refreshContainers(); // 成功后刷新列表
    } catch (err) {
      const errorMessage = err.response?.data?.message || `${action}失败`;
      message.error({ content: errorMessage, key: loadingKey });
    } finally {
      setProcessingState(prev => {
        const newState = { ...prev };
        delete newState[containerId];
        return newState;
      });
    }
  };

  const handleStartContainer = (serverId, name) => apiCall('/server/container/start', { server_id: serverId, name }, '启动', name);
  const handleStopContainer = (serverId, name) => apiCall('/server/container/stop', { server_id: serverId, name }, '停止', name);
  const handleRestartContainer = (serverId, name) => apiCall('/server/container/restart', { server_id: serverId, name }, '重启', name);
  const handleDeleteContainer = (serverId, name) => apiCall('/server/container/delete', { server_id: serverId, name }, '删除', name);

  const handleCreateContainer = async (formData) => {
    // 异步操作抛出错误，以便Modal可以捕获并保持打开状态
    const loadingKey = 'create_container';
    message.loading({ content: '正在创建容器...', key: loadingKey });
    try {
      await axios.post(`${API_URL}/server/container/create`, formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      message.success({ content: '容器创建成功！', key: loadingKey });
      await refreshContainers();
    } catch (err) {
      const errorMessage = err.response?.data?.message || '创建容器失败';
      message.error({ content: errorMessage, key: loadingKey });
      throw new Error(errorMessage); // 抛出错误
    }
  };

  const refreshContainers = async () => {
    try {
      const response = await axios.get(`${API_URL}/server/container/user`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const formatted = response.data.map(c => ({ ...c, serverName: getServerName(c.server_id) }));
      setContainers(formatted);
    } catch (err) {
      // 刷新失败时静默处理或只给一个轻量提示
      console.error('刷新容器列表失败', err);
    }
  };

  useEffect(() => {
    const initialLoad = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const serversRes = serverConfig.servers.map(s => ({ id: s.serverIp, name: s.name }));
        setAvailableServers(serversRes);

        const containersRes = await axios.get(`${API_URL}/server/container/user`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        const formatted = containersRes.data.map(c => ({ ...c, serverName: getServerName(c.server_id) }));
        setContainers(formatted);

      } catch (err) {
        let msg = "获取数据失败，请稍后重试";
        if (err.response?.status === 401) msg = "登录已过期，请重新登录。";
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    };
    initialLoad();
  }, []);

  // --- UI 渲染辅助函数 ---
  const renderGpuTags = (gpuIndices) => {
    if (!gpuIndices?.length) return <Tag>未分配</Tag>;
    const tags = gpuIndices.map(gpu => <Tag key={gpu} color="blue">{`GPU ${gpu}`}</Tag>);
    if (tags.length > 3) {
      return (
        <Space wrap size={[0, 4]}>
          {tags.slice(0, 2)}
          <Tooltip title={gpuIndices.slice(2).map(g => `GPU ${g}`).join(', ')}>
            <Tag>+{tags.length - 2}</Tag>
          </Tooltip>
        </Space>
      );
    }
    return <Space wrap size={[0, 4]}>{tags}</Space>;
  };

  const getStatusTag = (status) => {
    switch (status?.toLowerCase()) {
      case 'running': return <Tag icon={<CaretRightOutlined />} color="success">运行中</Tag>;
      case 'stopped': return <Tag icon={<StopOutlined />} color="error">已停止</Tag>;
      case 'restarting': return <Tag icon={<ReloadOutlined />} color="processing">重启中</Tag>;
      default: return <Tag icon={<ClockCircleOutlined />} color="default">{status || '未知'}</Tag>;
    }
  };

  const columns = [
    { title: '容器名称', dataIndex: 'name', key: 'name', render: (name) => <Text strong>{formatContainerName(name)}</Text>, width: '18%' },
    { title: 'GPU', dataIndex: 'allocated_gpus', key: 'allocated_gpus', render: renderGpuTags, width: '20%' },
    { title: '端口', dataIndex: 'port', key: 'port', render: (port) => <Text copyable>{port || '-'}</Text>, width: '10%' },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', render: formatDate, width: '17%' },
    { title: '状态', dataIndex: 'status', key: 'status', render: getStatusTag, width: '10%' },
    {
      title: '操作',
      key: 'action',
      width: '25%',
      render: (_, record) => {
        const isLoading = !!processingState[record.name];
        const isRunning = record.status?.toLowerCase() === 'running';

        return (
          <Space wrap>
            {isRunning ? (
                <>
                <Button type="primary" ghost danger onClick={() => handleStopContainer(record.server_id, record.name)} loading={isLoading} icon={<PoweroffOutlined />}>停止</Button>
                <Button onClick={() => handleRestartContainer(record.server_id, record.name)} loading={isLoading} icon={<ReloadOutlined />}>重启</Button>
                </>
            ) : (
                <Button type="primary" onClick={() => handleStartContainer(record.server_id, record.name)} loading={isLoading} icon={<CaretRightOutlined />}>启动</Button>
            )}
            <Popconfirm title="确定删除此容器？" okText="删除" cancelText="取消" onConfirm={() => handleDeleteContainer(record.server_id, record.name)}>
              <Button danger loading={isLoading} icon={<DeleteOutlined />}>删除</Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  // --- 主要渲染逻辑 ---
  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}><Spin size="large" tip="加载容器数据中..." /></div>;
  }

  if (error) {
    return <Card><Alert message="加载失败" description={error} type="error" showIcon action={<Button onClick={() => window.location.reload()}>重试</Button>} /></Card>;
  }

  const serverTabs = ['all', ...new Set(containers.map(c => c.server_id))].map(id => ({
    key: id,
    label: <Space>{id === 'all' ? <UnorderedListOutlined /> : <DesktopOutlined />}{id === 'all' ? '全部服务器' : getServerName(id)}</Space>,
  }));

  const renderContent = () => {
    if (containers.length === 0) {
      return <Card><Empty description="您还没有任何容器。"><Button type="primary" icon={<PlusOutlined />} onClick={() => setShowCreateModal(true)}>立即创建</Button></Empty></Card>;
    }

    if (activeServer === 'all') {
      const groupedContainers = containers.reduce((acc, c) => ({ ...acc, [c.server_id]: [...(acc[c.server_id] || []), c] }), {});
      return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {Object.keys(groupedContainers).map(serverIp => (
            <Card key={serverIp} title={<Space><DesktopOutlined /><Text strong>{getServerName(serverIp)}</Text></Space>} extra={<Tag>{groupedContainers[serverIp].length} 个容器</Tag>}>
              <Table columns={columns} dataSource={groupedContainers[serverIp]} rowKey="name" pagination={false} size="middle" />
            </Card>
          ))}
        </Space>
      );
    }

    const filteredContainers = containers.filter(c => c.server_id === activeServer);
    if (filteredContainers.length === 0) {
      return <Empty description={`在 ${getServerName(activeServer)} 上没有容器。`} />;
    }
    return <Table columns={columns} dataSource={filteredContainers} rowKey="name" size="middle" />;
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <CreateContainerModal visible={showCreateModal} onCancel={() => setShowCreateModal(false)} servers={availableServers} onSubmit={handleCreateContainer} />

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={2} style={{ marginTop: 0 }}>
              <AppstoreAddOutlined style={{ color: token.colorPrimary, marginRight: '12px' }} />
              我的容器
            </Title>
            <Text type="secondary">在这里管理、创建和操作您的 Docker 容器。</Text>
          </div>
          <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => setShowCreateModal(true)}>创建新容器</Button>
        </div>
      </Card>

      <Card>
        <Tabs activeKey={activeServer} onChange={setActiveServer} items={serverTabs} />
        <div style={{ marginTop: '24px' }}>{renderContent()}</div>
      </Card>
    </Space>
  );
};

export default MyContainers;
