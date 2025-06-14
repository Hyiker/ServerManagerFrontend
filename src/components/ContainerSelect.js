// 引入必要的antd组件
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, Button, Select, Spin, Alert, Empty, Typography, Flex, theme } from 'antd';
import serverConfig from '../assets/server.json';

const { Text } = Typography;

// 不再需要 LoadingSpinner，因为我们使用 antd 的 Spin
// import { LoadingSpinner } from './LoadingSpinner';

export const ContainerSelectionModal = ({ apiUrl, serverId, show, onClose, gpuId, gpuName, onConfirm }) => {
    // 使用 antd 的 theme token 来获取主题颜色等
    const { token } = theme.useToken();

    // 状态定义 (逻辑不变)
    const [containers, setContainers] = useState([]);
    const [selectedContainer, setSelectedContainer] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // 工具函数 (逻辑不变)
    const formatContainerName = (name) => {
        if (!name) return name;
        const dashIndex = name.indexOf('-');
        return dashIndex !== -1 ? name.substring(dashIndex + 1) : name;
    };

    const serverMapping = serverConfig.servers.reduce((mapping, server, index) => {
        mapping[server.serverIp] = {
            name: server.name,
            serverIp: server.serverIp,
            index: index
        };
        return mapping;
    }, {});

    const getServerName = (serverId) => {
        const serverInfo = serverMapping[serverId];
        return serverInfo ? serverInfo.name : serverId;
    };

    // 数据获取 (useEffect 逻辑不变)
    useEffect(() => {
        // 当模态框显示时，重置状态并获取数据
        if (show) {
            setIsLoading(true);
            setError('');
            setContainers([]);
            setSelectedContainer('');

            const fetchContainers = async () => {
                try {
                    const response = await axios.get(`${apiUrl}/server/container/user`, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    });

                    const runningContainers = response.data.filter(container =>
                        container.status.toLowerCase() === 'running' &&
                        container.server_id === serverId
                    );

                    setContainers(runningContainers);

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
    }, [show, serverId, apiUrl]); // apiUrl 也应作为依赖

    // 事件处理函数 (逻辑不变)
    const handleConfirm = () => {
        if (!selectedContainer) {
            setError('请选择一个容器');
            return;
        }
        onConfirm(selectedContainer);
    };

    // 将容器数据转换为 antd Select 组件需要的格式
    const selectOptions = containers.map(container => ({
        value: container.name,
        label: `${formatContainerName(container.name)} (${getServerName(container.server_id)})`
    }));

    // =================================================================
    // 以下是重构后的渲染部分
    // =================================================================

    return (
        <Modal
            title="选择要分配GPU的容器"
            open={show}
            onCancel={onClose}
            onOk={handleConfirm}
            destroyOnClose // 关闭时销毁内部组件，确保每次打开状态都是新的
            confirmLoading={isLoading} // 将OK按钮置为加载状态
            okText="确认分配"
            cancelText="取消"
            okButtonProps={{ disabled: !selectedContainer || containers.length === 0 }} // 当没有可选容器或未选择时，禁用确认按钮
        >
            <Spin spinning={isLoading} tip="正在加载容器列表...">
                <Flex vertical gap="middle">
                    <Text>
                        您正在为 <Text strong style={{ color: token.colorPrimary }}>{gpuName}</Text> 选择容器
                    </Text>

                    {error && (
                        <Alert message={error} type="error" showIcon />
                    )}

                    {/* 在加载完成且没有数据时显示 Empty 状态 */}
                    {!isLoading && containers.length === 0 && !error && (
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description="没有可用的容器，请先创建并启动一个容器。"
                        />
                    )}

                    {/* 仅在有容器时显示选择框 */}
                    {containers.length > 0 && (
                        <Select
                            value={selectedContainer}
                            onChange={(value) => setSelectedContainer(value)}
                            options={selectOptions}
                            style={{ width: '100%' }}
                            placeholder="请选择一个运行中的容器"
                        />
                    )}
                </Flex>
            </Spin>
        </Modal>
    );
};
