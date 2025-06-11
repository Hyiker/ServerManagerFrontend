import React from 'react';
import { Typography, Collapse, Divider, Row, Col } from 'antd';
import { 
  BookOutlined, 
  QuestionCircleOutlined,
  DesktopOutlined,
  CalendarOutlined,
  ToolOutlined
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;
const { Panel } = Collapse;

const Dashboard = () => {
  return (
    <div className="dashboard-page">
      <div className="documentation-section">
        <Row>
          <Col span={24}>
            <Title level={3}>
              <BookOutlined /> 使用文档
            </Title>
          </Col>
        </Row>
        
        <Collapse 
          defaultActiveKey={['1']} 
          className="doc-collapse"
          style={{ marginTop: '20px', marginBottom: '40px' }}
        >
          <Panel 
            header={<><QuestionCircleOutlined /> TL;DR</>} 
            key="1"
          >
            <Paragraph>
              本系统提供了GPU服务器资源的管理、监控和预约功能。您可以通过系统：
            </Paragraph>
            <ul>
              <li>查看服务器及GPU资源的实时状态</li>
              <li>预约可用的GPU资源</li>
              <li>管理您的预约和容器</li>
              <li>延长已有预约的时间</li>
            </ul>
            <Paragraph>
              系统中的两台服务器共有16张GPU卡，可供科研和开发使用。
            </Paragraph>
          </Panel>

          <Panel 
            header={<><QuestionCircleOutlined /> 容器使用指南</>} 
            key="2"
          >
            <Paragraph>
              本系统提供了GPU服务器资源的管理、监控和预约功能。您可以通过系统：
            </Paragraph>
            <ul>
              <li>查看服务器及GPU资源的实时状态</li>
              <li>预约可用的GPU资源</li>
              <li>管理您的预约和容器</li>
              <li>延长已有预约的时间</li>
            </ul>
            <Paragraph>
              系统中的两台服务器共有16张GPU卡，可供科研和开发使用。
            </Paragraph>
          </Panel>

        </Collapse>
      </div>
    </div>
  );
};

export default Dashboard; 