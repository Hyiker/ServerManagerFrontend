// Layout.js (完整更新版 - 加入键盘指令监听)

import React, { useState, useEffect, useRef } from 'react'; // 1. 导入 useEffect 和 useRef
import { Layout, Menu, Button, Typography, Avatar, theme, ConfigProvider, Dropdown } from 'antd';
import axios from 'axios';
import { jwtDecode } from "jwt-decode";

import {
    HomeOutlined,
    DesktopOutlined,
    SettingOutlined,
    LogoutOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    UserOutlined,
    CalendarOutlined,
    ContainerOutlined,
    CloudServerOutlined,
    AuditOutlined,
    TeamOutlined,
    BookOutlined,
    DropboxOutlined,
    InboxOutlined,
    HeartOutlined,
    DownOutlined
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import serverConfig from '../assets/server.json';

import './Layout.css';

// ... 其他代码 (Header, Sider, api, theme configs, etc.) 保持不变 ...
const { Header, Sider, Content } = Layout;
const { Title } = Typography;
const { SubMenu } = Menu;

const api = axios.create({
    baseURL: serverConfig.apiUrl,
    headers: { 'Content-Type': 'application/json' },
});

const { darkAlgorithm, defaultAlgorithm } = theme;

const falloutThemeConfig = {
    algorithm: darkAlgorithm,
    token: {
        colorPrimary: '#00ff00',
        colorSuccess: '#00ff00',
        colorWarning: '#ffff00',
        colorError: '#ff4d4f',
        colorInfo: '#00ff00',
        colorTextBase: '#00ff00',
        colorBgBase: '#1a1a1a',
        colorBgContainer: '#222222',
        colorBorder: 'rgba(0, 255, 0, 0.5)',
        fontFamily: "'chinese-retro', 'VT323', monospace",
        borderRadius: 1,
    },
    components: {
        Menu: {
            itemSelectedBg: 'rgba(0, 255, 0, 0.25)',
            itemSelectedColor: '#ffffff',
        },
        Button: {
            defaultGhostColor: '#00ff00',
            defaultGhostBorderColor: '#00ff00'
        }
    }
};
const defaultThemeConfig = {
    algorithm: defaultAlgorithm,
};

const availableThemes = [
    { key: 'default', label: '默认主题' },
    { key: 'fallout', label: '复古主题' },
];


const MainLayout = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [currentTheme, setCurrentTheme] = useState(
        () => localStorage.getItem('appTheme') || 'default'
    );

    const navigate = useNavigate();
    const location = useLocation();
    const username = localStorage.getItem('username') || 'User';
    const isRoot = localStorage.getItem('isRoot') === 'true';

    const konamiCode = [
        'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
        'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
        'b', 'a'
    ];
    // 使用 useRef 来追踪用户输入的序列位置，它不会在组件重渲染时重置
    const konamiCodePosition = useRef(0);

    useEffect(() => {
        const handleKeyDown = (e) => {
            // 获取按键的 key，e.key 对于特殊按键（如箭头）有标准名称
            const requiredKey = konamiCode[konamiCodePosition.current];

            // 检查按下的键是否是序列中的下一个键
            if (e.key === requiredKey) {
                // 如果是，则将序列位置向前移动
                konamiCodePosition.current++;

                // 如果序列已经完成
                if (konamiCodePosition.current === konamiCode.length) {
                    // 执行你的操作
                    if (localStorage.getItem("gameOn") === "true") {
                        alert("Game Off~");
                        localStorage.removeItem('gameOn');
                    } else {
                        alert('Game On!');
                        localStorage.setItem('gameOn', 'true');
                    }

                    // 重置序列位置，以便可以再次输入
                    konamiCodePosition.current = 0;
                    window.location.reload();
                }
            } else {
                // 如果按下了错误的键，重置序列
                konamiCodePosition.current = 0;
            }
        };

        // 在 document 上添加事件监听器
        document.addEventListener('keydown', handleKeyDown);

        // 组件卸载时，清理事件监听器，防止内存泄漏
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []); // 空依赖数组意味着这个 effect 只在组件挂载时运行一次

    // ================================================================
    // 键盘指令监听逻辑结束
    // ================================================================


    const handleThemeChange = (themeKey) => {
        setCurrentTheme(themeKey);
        localStorage.setItem('appTheme', themeKey);
    };

    const handleMenuClick = (key) => navigate(key);
    const handleLogout = () => {
        let theme = localStorage.getItem('appTheme');
        localStorage.clear();
        localStorage.setItem('appTheme', theme);
        window.location.href = '/login';
    };
    const toggleSider = () => setCollapsed(!collapsed);
    const buildMenuItems = () => { /* ... */ return []; };

    let token = localStorage.getItem("token");
    if (!token) {
        handleLogout();
        return null;
    }
    const tokenDec = jwtDecode(token);
    if (Date.now() / 1000.0 > tokenDec["exp"]) {
        alert("登录已过期");
        handleLogout();
    }

    return (
        <ConfigProvider theme={currentTheme === 'fallout' ? falloutThemeConfig : defaultThemeConfig}>
            <AppLayout
                collapsed={collapsed}
                toggleSider={toggleSider}
                currentTheme={currentTheme}
                handleThemeChange={handleThemeChange}
                handleLogout={handleLogout}
                username={username}
                isRoot={isRoot}
                location={location}
                buildMenuItems={buildMenuItems}
            />
        </ConfigProvider>
    );
};

// AppLayout 组件保持不变
const AppLayout = ({ collapsed, toggleSider, currentTheme, handleThemeChange, handleLogout, username, isRoot, location, buildMenuItems }) => {

    const { token: { colorBgContainer } } = theme.useToken();
    const navigate = useNavigate();

    const firstServerIndex = serverConfig.servers.length > 0 ? 0 : 0;
    const selectedKey = location.pathname === '/' ? `/server/${firstServerIndex}` : location.pathname;

    const buildMenuItemsFinal = () => {
        const handleMenuClick = (key) => navigate(key);
        const menuItems = [];
        if (isRoot) {
            menuItems.push({ key: '/approval', icon: <AuditOutlined />, label: '预约审批', onClick: () => handleMenuClick('/approval') });
            menuItems.push({ key: '/users', icon: <TeamOutlined />, label: '用户管理', onClick: () => handleMenuClick('/users') });
        }
        const gpuReservationItems = serverConfig.servers.map((server, index) => ({
            key: `/server/${index}`, label: server.name, onClick: () => handleMenuClick(`/server/${index}`)
        }));
        menuItems.push({ key: 'gpu-reservation', icon: <DesktopOutlined />, label: '显卡预约', children: gpuReservationItems });
        const additionItems = [
            { key: '/luck', icon: <HeartOutlined />, label: '今日运势', onClick: () => handleMenuClick('/luck') },
            { key: '/games', icon: <InboxOutlined />, label: '小游戏', onClick: () => handleMenuClick('/games') },];
        const otherMenuItems = [
            { key: '/reservations', icon: <CalendarOutlined />, label: '我的预约', onClick: () => handleMenuClick('/reservations') },
            { key: '/containers', icon: <ContainerOutlined />, label: '我的容器', onClick: () => handleMenuClick('/containers') },
            ...(localStorage.getItem("gameOn") === "true" ? additionItems : []),
            { key: '/settings', icon: <SettingOutlined />, label: '设置', onClick: () => handleMenuClick('/settings') }
        ];



        return [...menuItems, ...otherMenuItems];
    };

    const themeMenuProps = {
        items: availableThemes,
        selectable: true,
        selectedKeys: [currentTheme],
        onClick: ({ key }) => handleThemeChange(key),
    };

    const currentThemeLabel = availableThemes.find(theme => theme.key === currentTheme)?.label || '选择主题';
    const isGameOn = localStorage.getItem("gameOn") === "true";

    return (
        <Layout className={`main-layout ${currentTheme === 'fallout' ? 'fallout-theme' : ''}`}>
            <Sider trigger={null} collapsible collapsed={collapsed} width={230} className="fixed-sidebar">
                <div className="logo">
                    <CloudServerOutlined className="logo-icon" />
                    {!collapsed && <span className="logo-text">GPU Manager</span>}
                </div>
                <Menu
                    theme='dark'
                    mode="inline"
                    selectedKeys={[selectedKey]}
                    defaultOpenKeys={['gpu-reservation']}
                    items={buildMenuItemsFinal()}
                />
            </Sider>
            <Layout className={collapsed ? 'site-layout-collapsed' : 'site-layout'}>
                <Header className="main-header" style={{ background: colorBgContainer, padding: '0 24px' }}>
                    <Button
                        type="text"
                        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                        onClick={toggleSider}
                        className="trigger-button"
                        style={{ color: currentTheme === 'fallout' ? '#00ff00' : 'inherit' }}
                    />
                    <div className="header-right">
                        <div className="user-info">
                            <Avatar icon={<UserOutlined />} />
                            <span className="username">{username}</span>
                        </div>

                        {isGameOn && <Dropdown menu={themeMenuProps} trigger={['click']}>
                            <a href="#" onClick={(e) => e.preventDefault()} className="logout-link">
                                {currentThemeLabel} <DownOutlined style={{ fontSize: '12px' }} />
                            </a>
                        </Dropdown>}

                        <div className="logout-button-wrapper">
                            <a href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }} className="logout-link">
                                <LogoutOutlined /> 退出
                            </a>
                        </div>
                    </div>
                </Header>
                <Content className="main-content" style={{ background: colorBgContainer }}>
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
};


export default MainLayout;
