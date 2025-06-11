import React from 'react';
import { Tabs, Typography, Alert } from 'antd';

const { TabPane } = Tabs;
const { Title, Paragraph } = Typography;

// 游戏配置对象
const games = {
    sandtris: {
        name: '俄罗斯沙块 (Sandtris)',
        src: '/sandtris/index.html',
        width: 1200,
        height: 900,
    },
    doom: {
        name: '毁灭战士 (Doom)',
        src: '/doom/index.html',
        width: 900,
        height: 600,
    },

    // 以后可以在这里添加更多游戏
    // quake: { name: '雷神之锤 (Quake)', src: '/quake/index.html', width: 1024, height: 768 }
};

const GamePage = () => {
    return (
        <div className="game-page" style={{ margin: '24px' }}>

            {/* 页面标题和说明 */}
            <div style={{ marginBottom: '20px' }}>
                <Title level={2}>游戏中心</Title>
                <Alert
                    message="游戏提示"
                    description="游戏开始后，您的鼠标和键盘将被捕获。游戏声音可能会比较大，请注意调节音量。"
                    type="info"
                    showIcon
                />
            </div>

            {/* Tabs 组件 */}
            {/* 关键点：通过 style 属性移除了 TabPane 的内边距 */}
            <Tabs defaultActiveKey="snadtris" type="card" style={{
                // 覆盖 Antd Tabs 内容区域的默认内边距
                '--antd-padding-lg': '0px',
            }}>

                {Object.keys(games).map(gameKey => {
                    const game = games[gameKey];
                    return (
                        <TabPane tab={game.name} key={gameKey}>
                            {/*
                关键点: 这个 div 是游戏的主要容器
                - maxWidth: 限制了容器的最大宽度，使其不超过游戏的原始宽度。
                - margin: 'auto' 使容器在可用空间内水平居中。
              */}
                            <div
                                className="game-container-wrapper"
                                style={{
                                    maxWidth: `${game.width}px`,
                                    margin: '16px auto', // 上下留出一些间距，左右自动居中
                                    backgroundColor: '#000',
                                    lineHeight: 0,
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.25)', // 添加一点阴影以增强立体感
                                    borderRadius: '8px', // 可选：给容器加一点圆角
                                    overflow: 'hidden',    // 确保 iframe 不会溢出圆角
                                }}
                            >
                                <iframe
                                    src={game.src}
                                    title={game.name}
                                    style={{
                                        width: '105%', // 宽度占满父容器 (最大800px)
                                        aspectRatio: `${game.width} / ${game.height}`, // 保持正确的宽高比
                                        border: 'none',
                                        display: 'block',
                                    }}
                                    allowFullScreen
                                />
                            </div>
                        </TabPane>
                    );
                })}

                {/* 禁用的标签页 */}
                {/* <TabPane tab="游戏二 (待开发)" key="game2" disabled />
        <TabPane tab="游戏三 (待开发)" key="game3" disabled /> */}

            </Tabs>
        </div>
    );
};

export default GamePage;
