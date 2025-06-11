import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Typography, Avatar, theme } from 'antd';
import axios from 'axios';
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
  DropboxSquareFilled,
  InboxOutlined,
  HeartOutlined
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import '../assets/Layout.css';
// 动态导入服务器配置
import serverConfig from '../assets/server.json';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;
const { SubMenu } = Menu;

// 创建 axios 实例
const api = axios.create({
  baseURL: serverConfig.apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const username = localStorage.getItem('username') || 'User';
  const isRoot = localStorage.getItem('isRoot') === 'true';

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const handleMenuClick = (key) => {
    navigate(key);
  };

  // 简化登出处理函数
  const handleLogout = () => {
    console.log("登出按钮被点击");

    // 清除本地存储的认证信息
    localStorage.removeItem('token');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('username');
    localStorage.removeItem('isRoot');

    // 立即重定向到登录页
    window.location.href = '/login';
  };

  // 处理侧边栏折叠状态
  const toggleSider = () => {
    setCollapsed(!collapsed);
  };

  // 获取第一个服务器作为默认路径（使用索引0）
  const firstServerIndex = serverConfig.servers.length > 0 ? 0 : 0;

  // Determine which menu item is selected based on the current path
  const selectedKey = location.pathname === '/'
    ? `/server/${firstServerIndex}`
    : location.pathname;

  // 构建菜单项
  const buildMenuItems = () => {
    // 基本菜单项
    const menuItems = [];

    // 如果用户是管理员，添加预约审批和用户管理菜单项
    if (isRoot) {
      menuItems.push({
        key: '/approval',
        icon: <AuditOutlined />,
        label: '预约审批',
        onClick: () => handleMenuClick('/approval')
      });

      menuItems.push({
        key: '/users',
        icon: <TeamOutlined />,
        label: '用户管理',
        onClick: () => handleMenuClick('/users')
      });
    }

    // 动态生成显卡预约子菜单（使用数组索引作为路由参数）
    const gpuReservationItems = serverConfig.servers.map((server, index) => ({
      key: `/server/${index}`,
      label: server.name,
      onClick: () => handleMenuClick(`/server/${index}`)
    }));

    menuItems.push({
      key: 'gpu-reservation',
      icon: <DesktopOutlined />,
      label: '显卡预约',
      children: gpuReservationItems
    });

    // 添加其他菜单项
    const otherMenuItems = [
      {
        key: '/reservations',
        icon: <CalendarOutlined />,
        label: '我的预约',
        onClick: () => handleMenuClick('/reservations')
      },
      {
        key: '/luck',
        icon: <HeartOutlined />,
        label: '今日运势',
        onClick: () => handleMenuClick('/luck')
      },
      {
        key: '/games',
        icon: <InboxOutlined />,
        label: '小游戏',
        onClick: () => handleMenuClick('/games')
      },
      {
        key: '/containers',
        icon: <ContainerOutlined />,
        label: '我的容器',
        onClick: () => handleMenuClick('/containers')
      },
      {
        key: '/settings',
        icon: <SettingOutlined />,
        label: '设置',
        onClick: () => handleMenuClick('/settings')
      }
    ];

    return [...menuItems, ...otherMenuItems];
  };

  return (
    <Layout className="main-layout">
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={230}
        className="fixed-sidebar"
      >
        <div className="logo">
          <CloudServerOutlined className="logo-icon" />
          {!collapsed && <span className="logo-text">GPU Manager</span>}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          defaultOpenKeys={['gpu-reservation']}
          items={buildMenuItems()}
        />
      </Sider>
      <Layout className={collapsed ? 'site-layout-collapsed' : 'site-layout'}>
        <Header className="main-header" style={{ background: colorBgContainer }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={toggleSider}
            className="trigger-button"
          />
          <div className="header-right">
            <div className="user-info">
              <Avatar icon={<UserOutlined />} />
              <span className="username">{username}</span>
            </div>
            <div className="logout-button-wrapper">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleLogout();
                }}
                className="logout-link"
              >
                <LogoutOutlined /> 退出
              </a>
            </div>
          </div>
        </Header>
        <Content
          className="main-content"
          style={{
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout; 