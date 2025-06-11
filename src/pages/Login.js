import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../assets/Login.css';
import serverConfig from '../assets/server.json';

// 创建 axios 实例
const api = axios.create({
  baseURL: serverConfig.apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 时间处理工具函数
const timeUtils = {
  // 将UTC时间字符串转换为本地Date对象
  utcToLocal: (utcTimeString) => {
    if (!utcTimeString) return null;
    // 确保时间字符串有UTC标识符
    const timeStr = utcTimeString.endsWith('Z') ? utcTimeString : utcTimeString + 'Z';
    return new Date(timeStr);
  },
  
  // 将本地时间转换为UTC时间字符串（用于发送给后端）
  localToUtc: (localDate) => {
    if (!localDate) return null;
    return localDate.toISOString();
  }
};

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [remainingAttempts, setRemainingAttempts] = useState(null);
  const [accountLocked, setAccountLocked] = useState(false);
  const [unlockTime, setUnlockTime] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const navigate = useNavigate();

  // 处理账户锁定倒计时
  useEffect(() => {
    let timer;
    if (accountLocked && unlockTime) {
      const updateCountdown = () => {
        const now = new Date();
        // 将后端传来的UTC时间转换为本地时间进行比较
        const unlockDate = timeUtils.utcToLocal(unlockTime);
        
        if (!unlockDate) {
          setAccountLocked(false);
          setUnlockTime(null);
          setCountdown(null);
          clearInterval(timer);
          return;
        }
        
        const diff = Math.max(0, Math.floor((unlockDate - now) / 1000));
        
        if (diff <= 0) {
          setAccountLocked(false);
          setUnlockTime(null);
          setCountdown(null);
          clearInterval(timer);
        } else {
          const minutes = Math.floor(diff / 60);
          const seconds = diff % 60;
          setCountdown(`${minutes}分${seconds}秒`);
        }
      };
      
      updateCountdown();
      timer = setInterval(updateCountdown, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [accountLocked, unlockTime]);

  // 密码合规性检查
  const validatePassword = (password) => {
    if (password.length < 8) {
      return { valid: false, message: '密码长度必须至少为8个字符' };
    }
    
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    
    if (!hasLowercase || !hasNumber) {
      return { valid: false, message: '密码必须包含至少一个小写字母和一个数字' };
    }
    
    return { valid: true };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    // 登录表单验证
    if (!username || !password) {
      setErrorMsg('用户名和密码不能为空');
      return;
    }
    
    // 如果账户被锁定，阻止提交
    if (accountLocked) {
      setErrorMsg(`账户已锁定，请在 ${countdown} 后重试`);
      return;
    }
    
    setIsLoading(true);
    
    try {
      // 登录逻辑
      try {
        const response = await api.post('/auth/login', {
          username,
          password
        });
        
        if (response.status === 200 && response.data.access_token) {
          // 登录成功，保存token和用户信息
          localStorage.setItem('token', response.data.access_token);
          localStorage.setItem('isAuthenticated', 'true');
          localStorage.setItem('username', username);
          // 保存root权限信息
          localStorage.setItem('isRoot', response.data.root ? 'true' : 'false');
          
          // 重置错误状态
          setRemainingAttempts(null);
          setAccountLocked(false);
          setUnlockTime(null);
          
          // 跳转到首页
          navigate('/dashboard');
        }
      } catch (error) {
        if (error.response) {
          const { status, data } = error.response;
          
          if (status === 401) {
            // 处理认证错误
            if (data.message === 'User not found') {
              setErrorMsg('用户不存在');
            } else if (data.message === 'Invalid password') {
              // 设置错误消息并记录剩余尝试次数
              setErrorMsg(`密码错误，剩余尝试次数: ${data.remaining_attempts}`);
              setRemainingAttempts(data.remaining_attempts);
            } else if (data.message.includes('account is locked')) {
              // 账户锁定
              setAccountLocked(true);
              // 后端传来的是UTC时间，确保正确处理时区
              const utcTime = data.unlocked_at;
              setUnlockTime(utcTime);
              setErrorMsg('账户已被锁定，请稍后再试');
            }
          } else if (status === 400 && data.message) {
            setErrorMsg(data.message);
          } else {
            setErrorMsg('登录失败，请稍后再试');
          }
        } else {
          setErrorMsg('网络错误，请检查服务器连接');
          console.error('登录请求失败:', error);
        }
      }
    } catch (error) {
      console.error('操作失败:', error);
      
      if (error.response) {
        const { status, data } = error.response;
        
        if (status === 400 && data.message) {
          // 处理错误
          setErrorMsg(data.message);
        } else if (status === 401 && data.message) {
          setErrorMsg(data.message);
        } else {
          setErrorMsg('操作失败，请稍后再试');
        }
      } else {
        setErrorMsg('网络错误，请检查服务器连接');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    const token = localStorage.getItem('token');
    
    if (token) {
      try {
        await api.post('/auth/logout', {}, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        // 清除本地存储的认证信息
        localStorage.removeItem('token');
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('username');
        
      } catch (error) {
        console.error('登出失败:', error);
      }
    }
    
    // 无论请求成功与否，都重定向到登录页
    navigate('/login');
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // 密码眼睛图标
  const EyeIcon = ({ show }) => (
    <svg 
      width="20" 
      height="20" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      {show ? (
        <>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </>
      ) : (
        <>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </>
      )}
    </svg>
  );

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>欢迎登录</h2>
        {errorMsg && <div className="error-message">{errorMsg}</div>}
        {accountLocked && countdown && (
          <div className="locked-message">
            账户已锁定，将在 {countdown} 后解锁
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="username">用户名</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              required
              autoComplete="username"
              disabled={accountLocked}
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">密码</label>
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                required
                autoComplete="current-password"
                disabled={accountLocked}
              />
              <button 
                type="button" 
                className="password-toggle" 
                onClick={togglePasswordVisibility}
                tabIndex="-1"
                disabled={accountLocked}
              >
                <EyeIcon show={showPassword} />
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="login-button"
            disabled={isLoading || accountLocked}
          >
            {isLoading ? '处理中...' : '登录'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login; 