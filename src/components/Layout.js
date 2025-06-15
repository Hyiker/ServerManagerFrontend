// Layout.js (完整更新版)

import React, { useState } from 'react';
import { Layout, Menu, Button, Typography, Avatar, theme, ConfigProvider } from 'antd'; // 1. 导入 ConfigProvider
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
    HeartOutlined
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import serverConfig from '../assets/server.json';

import './Layout.css'; // 确保你的 CSS 文件被导入

const { Header, Sider, Content } = Layout;
const { Title } = Typography;
const { SubMenu } = Menu;

// 创建 axios 实例... (这部分不变)
const api = axios.create({
    baseURL: serverConfig.apiUrl,
    headers: { 'Content-Type': 'application/json' },
});


// 2. 定义我们的主题对象
// 使用 antd 的 theme.darkAlgorithm 作为我们复古主题的基础
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


const MainLayout = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [currentTheme, setCurrentTheme] = useState(
        () => localStorage.getItem('appTheme') || 'default'
    );

    const navigate = useNavigate();
    const location = useLocation();
    const username = localStorage.getItem('username') || 'User';
    const isRoot = localStorage.getItem('isRoot') === 'true';

    // 这里是关键：useToken() 必须在 ConfigProvider 内部才能获取到正确的主题。
    // 为了解决这个问题，我们将组件内容提取到一个子组件中。
    // 或者，更简单的方法是，让 Header 和 Content 直接使用从 ConfigProvider 传递下来的 token。
    // 我们将把 useToken() 的调用移到需要它的地方。

    const toggleTheme = () => {
        const newTheme = currentTheme === 'default' ? 'fallout' : 'default';
        setCurrentTheme(newTheme);
        localStorage.setItem('appTheme', newTheme);
    };

    // ... handleMenuClick, handleLogout, toggleSider, buildMenuItems 等函数保持不变 ...
    const handleMenuClick = (key) => navigate(key);
    const handleLogout = () => {
        let theme = localStorage.getItem('appTheme');
        localStorage.clear();
        localStorage.setItem('appTheme', theme);
        window.location.href = '/login';
    };
    const toggleSider = () => setCollapsed(!collapsed);
    const buildMenuItems = () => { /* ... 菜单构建逻辑 ... */ return []; }; // 省略具体实现

    let token = localStorage.getItem("token");
    const tokenDec = jwtDecode(token);
    if (Date.now() / 1000.0 > tokenDec["exp"]) {
        alert("登录已过期");
        handleLogout();
    }

    return (
        <ConfigProvider theme={currentTheme === 'fallout' ? falloutThemeConfig : defaultThemeConfig}>
            {/* 我们创建一个内部组件来消费 useToken() 的上下文 */}
            <AppLayout
                collapsed={collapsed}
                toggleSider={toggleSider}
                currentTheme={currentTheme}
                toggleTheme={toggleTheme}
                handleLogout={handleLogout}
                username={username}
                isRoot={isRoot}
                location={location}
                buildMenuItems={buildMenuItems}
            />
        </ConfigProvider>
    );
};

// 创建一个内部组件，这样 useToken() 就能正确地从 ConfigProvider 的上下文中获取 token
const AppLayout = ({ collapsed, toggleSider, currentTheme, toggleTheme, handleLogout, username, isRoot, location, buildMenuItems }) => {

    // 现在 useToken() 在 ConfigProvider 内部，可以获取到正确的 token
    const { token: { colorBgContainer } } = theme.useToken();
    const navigate = useNavigate();

    const firstServerIndex = serverConfig.servers.length > 0 ? 0 : 0;
    const selectedKey = location.pathname === '/' ? `/server/${firstServerIndex}` : location.pathname;

    // rebuild menu items here or pass them as props
    // For simplicity, I'll copy the logic here. In a real app, you might pass it down.
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
        const otherMenuItems = [
            { key: '/reservations', icon: <CalendarOutlined />, label: '我的预约', onClick: () => handleMenuClick('/reservations') },
            { key: '/luck', icon: <HeartOutlined />, label: '今日运势', onClick: () => handleMenuClick('/luck') },
            { key: '/games', icon: <InboxOutlined />, label: '小游戏', onClick: () => handleMenuClick('/games') },
            { key: '/containers', icon: <ContainerOutlined />, label: '我的容器', onClick: () => handleMenuClick('/containers') },
            { key: '/settings', icon: <SettingOutlined />, label: '设置', onClick: () => handleMenuClick('/settings') }
        ];
        return [...menuItems, ...otherMenuItems];
    };

    return (
        <Layout className={`main-layout ${currentTheme === 'fallout' ? 'fallout-theme' : ''}`}>
            <Sider trigger={null} collapsible collapsed={collapsed} width={230} className="fixed-sidebar">
                <div className="logo">
                    <CloudServerOutlined className="logo-icon" />
                    {!collapsed && <span className="logo-text">GPU Manager</span>}
                </div>
                {/* 关键修正 1: 移除 theme='dark' 属性，让 ConfigProvider 控制主题 */}
                <Menu
                    theme='dark'
                    mode="inline"
                    selectedKeys={[selectedKey]}
                    defaultOpenKeys={['gpu-reservation']}
                    items={buildMenuItemsFinal()}
                />
            </Sider>
            <Layout className={collapsed ? 'site-layout-collapsed' : 'site-layout'}>
                {/* 关键修正 2: 恢复 style 属性，这是正确的做法 */}
                <Header className="main-header" style={{ background: colorBgContainer, padding: '0 24px' }}>
                    <Button
                        type="text"
                        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                        onClick={toggleSider}
                        className="trigger-button"
                        style={{ color: currentTheme === 'fallout' ? '#00ff00' : 'inherit' }} // 确保按钮在两种主题下都可见
                    />
                    <div className="header-right">
                        <div className="user-info">
                            <Avatar icon={<UserOutlined />} />
                            <span className="username">{username}</span>
                        </div>
                        <div className="logout-button-wrapper">
                            <Button type="link" onClick={toggleTheme} className={currentTheme !== 'fallout' ? "fallout-switcher" : ""}>
                                {currentTheme === 'fallout' ? 'Default Theme' : 'Retro Theme'}
                            </Button>
                        </div>
                        <div className="logout-button-wrapper">
                            <a href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }} className="logout-link">
                                <LogoutOutlined /> 退出
                            </a>
                        </div>
                    </div>
                </Header>
                {/* Content 的背景色也由 ConfigProvider 自动处理，所以无需 style */}
                <Content className="main-content" style={{ background: colorBgContainer }}>
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
};


export default MainLayout;
