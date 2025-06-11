import React, { useState } from 'react';
import { Typography, Form, Input, Button, Card, message } from 'antd';
import axios from 'axios';
import serverConfig from '../assets/server.json';

const { Title } = Typography;

// 创建 axios 实例
const api = axios.create({
  baseURL: serverConfig.apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

const Settings = () => {
  const [passwordForm] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // 处理密码更改
  const handlePasswordChange = async (values) => {
    setLoading(true);
    try {
      // 获取JWT令牌
      const token = localStorage.getItem('token');
      
      if (!token) {
        message.error('请先登录');
        return;
      }
      
      // 密码合规性检查
      if (values.newPassword.length < 8) {
        message.error('密码长度必须至少为8个字符');
        setLoading(false);
        return;
      }
      
      const hasLowercase = /[a-z]/.test(values.newPassword);
      const hasNumber = /[0-9]/.test(values.newPassword);
      
      if (!hasLowercase || !hasNumber) {
        message.error('密码必须包含至少一个小写字母和一个数字');
        setLoading(false);
        return;
      }
      
      // 确认两次密码输入是否一致
      if (values.newPassword !== values.confirmPassword) {
        message.error('两次密码输入不一致');
        setLoading(false);
        return;
      }
      
      // 调用更改密码API
      const response = await api.post('/auth/change_password', {
        password: values.newPassword
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.status === 200) {
        message.success('密码修改成功');
        passwordForm.resetFields();
      }
    } catch (error) {
      console.error('密码修改失败:', error);
      
      if (error.response) {
        const { status, data } = error.response;
        
        if (status === 400 && data.message) {
          message.error(data.message);
        } else if (status === 401) {
          message.error('认证失败，请重新登录');
        } else {
          message.error('密码修改失败，请稍后再试');
        }
      } else {
        message.error('网络错误，请检查服务器连接');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* 修改密码卡片 */}
      <Card style={{ marginTop: 24 }}>
        <Title level={4}>修改密码</Title>
        <p>设置新的账户密码</p>
        
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handlePasswordChange}
        >
          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[
              {
                required: true,
                message: '请输入新密码',
              },
              {
                min: 8,
                message: '密码长度至少8个字符',
              },
              {
                pattern: /^(?=.*[a-z])(?=.*\d).+$/,
                message: '密码必须包含至少一个小写字母和一个数字',
              },
            ]}
            hasFeedback
          >
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>
          
          <Form.Item
            name="confirmPassword"
            label="确认新密码"
            dependencies={['newPassword']}
            rules={[
              {
                required: true,
                message: '请确认新密码',
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
            hasFeedback
          >
            <Input.Password placeholder="请再次输入新密码" />
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              修改密码
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Settings; 