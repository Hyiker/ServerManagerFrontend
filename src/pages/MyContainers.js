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
    Form,
    Input,
    Select,
    Checkbox,
    Popconfirm
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

// --- 组件：创建容器的模态框 (与上一版相同，保持UI的灵活性) ---
const CreateContainerModal = ({ visible, onCancel, servers, onSubmit }) => {
    const [form] = Form.useForm();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const enableUserMapping = Form.useWatch('enableUserMapping', form);

    const handleFinish = async (values) => {
        setIsSubmitting(true);
        try {
            await onSubmit(values);
            form.resetFields();
            onCancel();
        } catch (error) {
            // 错误已在 onSubmit 中处理
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        form.resetFields();
        onCancel();
    };

    return (
        <Modal
            title="创建新容器"
            open={visible}
            onCancel={handleCancel}
            footer={[
                <Button key="back" onClick={handleCancel}>取消</Button>,
                <Button key="submit" type="primary" loading={isSubmitting} onClick={() => form.submit()}>
                    创建容器
                </Button>,
            ]}
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleFinish}
                initialValues={{ server_id: servers[0]?.id, enableUserMapping: false, mapHomeDirectory: false }}
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

                <Form.Item name="enableUserMapping" valuePropName="checked">
                    <Checkbox>启用用户映射</Checkbox>
                </Form.Item>

                {enableUserMapping && (
                    <>
                        <Form.Item
                            name="user_name"
                            label="用户名"
                            rules={[{ required: true, message: '启用用户映射后，必须输入用户名' }]}
                            help="请输入您在服务器上的Linux用户名"
                        >
                            <Input placeholder="例如：john.doe" />
                        </Form.Item>

                        <Form.Item name="mapHomeDirectory" valuePropName="checked">
                            <Checkbox>映射用户主目录</Checkbox>
                        </Form.Item>
                    </>
                )}
            </Form>
        </Modal>
    );
};


// --- 主组件：我的容器页面 (handleCreateContainer 已更新) ---
const MyContainers = () => {
    const { token } = theme.useToken();

    // --- 状态管理 ---
    const [containers, setContainers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeServer, setActiveServer] = useState('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [availableServers, setAvailableServers] = useState([]);
    const [processingState, setProcessingState] = useState({});

    // --- 数据处理与获取 ---

    const serverMapping = serverConfig.servers.reduce((map, s) => ({ ...map, [s.serverIp]: s }), {});
    const getServerName = (serverIp) => serverMapping[serverIp]?.name || serverIp;
    const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleString('zh-CN') : 'N/A';
    const formatContainerName = (name) => name?.split('-').slice(1).join('-') || name;

    const apiCall = async (endpoint, payload, action, containerId) => {
        setProcessingState(prev => ({ ...prev, [containerId]: action }));
        const loadingKey = `${action}-${containerId}`;
        message.loading({ content: `${action}...`, key: loadingKey });

        try {
            const response = await axios.post(`${API_URL}${endpoint}`, payload, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            // 在通用函数中也使用后端返回的消息
            const successMsg = response.data?.message || `${action}成功！`;
            message.success({ content: successMsg, key: loadingKey });
            await refreshContainers();
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

    // ===================== 【核心修改点】 =====================
    // handleCreateContainer 函数现在会显示后端返回的消息
    // ========================================================
    const handleCreateContainer = async (formData) => {
        const loadingKey = 'create_container';
        message.loading({ content: '正在创建容器...', key: loadingKey });

        const { enableUserMapping, user_name, mapHomeDirectory, ...rest } = formData;
        const payload = { ...rest };

        // 如果您确实想隐藏UI并总是发送这些值，可以这样修改：
        // const payload = { ...rest, map_id: true, map_home: true, user_name: "一个固定的或从别处获取的用户名" };
        payload.map_id = enableUserMapping;
        payload.user_name = user_name;
        payload.map_home = mapHomeDirectory;

        if (enableUserMapping) {
            payload.map_id = true;
            payload.user_name = user_name;
            if (mapHomeDirectory) {
                payload.map_home = true;
            } else {
                payload.map_home = false;
            }
        } else {
            payload.map_home = false;
            payload.user_name = "";
        }

        try {
            // 捕获请求的响应
            const response = await axios.post(`${API_URL}/server/container/create`, payload, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            // 从响应中获取 message 字段，如果不存在则提供一个默认值
            const successMessage = response.data?.message || '容器创建成功！';

            // 使用后端返回的消息显示成功提示
            message.success({ content: successMessage, key: loadingKey });

            alert(successMessage);
            await refreshContainers();
        } catch (err) {
            // 错误提示也优先使用后端返回的消息
            const errorMessage = err.response?.data?.message || '创建容器失败';
            message.error({ content: errorMessage, key: loadingKey });
            alert(errorMessage);
            throw new Error(errorMessage); // 抛出错误以防止模态框关闭
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

    // --- UI 渲染辅助函数 (无变化) ---
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

    // --- 主要渲染逻辑 (无变化) ---
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
