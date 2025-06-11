import React, { useState, useEffect} from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import { LoadingSpinner } from './LoadingSpinner';
import serverConfig from '../assets/server.json';

export const AdvancedReservationModal = ({ apiUrl, serverId, show, onClose, gpuData, username }) => {
    // 当前日期和未来15天日期
    const today = new Date();
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
  
    // 将UTC时间字符串转换为本地时间的Date对象
    const utcToLocal = (utcTimeString) => {
      // 创建UTC时间的Date对象
      const utcDate = new Date(utcTimeString);
      // 直接返回，JavaScript会自动处理时区转换
      return utcDate;
    };
  
    // 将本地日期转换为UTC时间字符串
    const localToUtc = (localDateString) => {
      // 创建本地日期对象（当作本地时间的午夜）
      const localDate = new Date(localDateString + 'T00:00:00');
      // 转换为UTC时间
      return localDate.toISOString();
    };
  
    // 生成未来30天的日期标签
    const generateDateLabels = () => {
      return Array.from({ length: 31 }, (_, i) => {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        return formatDate(date);
      });
    };
  
    // 格式化容器名称显示 - 只显示连字符后面的部分
    const formatContainerName = (name) => {
      if (!name) return name;
      const dashIndex = name.indexOf('-');
      return dashIndex !== -1 ? name.substring(dashIndex + 1) : name;
    };

    // 从server.json构建服务器映射（serverIp -> server信息）
    const serverMapping = serverConfig.servers.reduce((mapping, server, index) => {
      mapping[server.serverIp] = {
        name: server.name,
        serverIp: server.serverIp,
        index: index
      };
      return mapping;
    }, {});

    // 获取服务器名称
    const getServerName = (serverId) => {
      const serverInfo = serverMapping[serverId];
      return serverInfo ? serverInfo.name : serverId;
    };

    // 状态定义
    const [containers, setContainers] = useState([]);
    const [selectedContainer, setSelectedContainer] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingContainers, setIsLoadingContainers] = useState(true);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [scheduleData, setScheduleData] = useState({
      dateLabels: generateDateLabels(),
      gpuReservations: []
    });
    const [reservationForm, setReservationForm] = useState({
      container: '',
      gpuIds: [],
      startDate: formatDate(today),
      endDate: formatDate(new Date(today.getTime() + 24 * 60 * 60 * 1000)) // 默认明天
    });
  
    // 获取用户的容器列表
    useEffect(() => {
      if (show) {
        const fetchContainers = async () => {
          setIsLoadingContainers(true);
          try {
            const response = await axios.get(`${apiUrl}/server/container/user`, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
              }
            });
            
            // 筛选出运行中且在当前服务器上的容器
            const runningContainers = response.data.filter(container => 
              container.status.toLowerCase() === 'running' && 
              container.server_id === serverId);
            
            setContainers(runningContainers);
            // 如果有可用容器，默认选中第一个
            if (runningContainers.length > 0) {
              setSelectedContainer(runningContainers[0].name);
              setReservationForm(prev => ({
                ...prev,
                container: runningContainers[0].name
              }));
            }
          } catch (err) {
            console.error('获取容器列表失败:', err);
            setError('无法获取容器列表，请稍后重试');
          } finally {
            setIsLoadingContainers(false);
          }
        };
        
        fetchContainers();
        setIsLoading(false);
      }
    }, [show, username]);
    
    // 当服务器切换时，重置表单状态
    useEffect(() => {
      if (show) {
        setReservationForm({
          container: '',
          gpuIds: [],
          startDate: formatDate(today),
          endDate: formatDate(new Date(today.getTime() + 24 * 60 * 60 * 1000))
        });
        setSelectedContainer('');
        setError('');
      }
    }, [serverId, show]);
    
    // 单独处理GPU预约数据
    useEffect(() => {
      if (show && gpuData.length > 0) {
        // 当服务器切换时，清除之前的预约数据
        setScheduleData(prev => ({
          ...prev,
          gpuReservations: []
        }));
        
        // 获取当前服务器的GPU数量和ID列表 - 由于gpuData已经是当前服务器的数据，直接使用
        const currentGpuCount = gpuData.length;
        
        // 获取GPU列表，用于请求预约数据
        const gpuList = gpuData.map(gpu => gpu.index);
        
        // 每次服务器切换或弹窗显示时重新获取数据
        const fetchReservations = async () => {
            setIsLoading(true);
            try {
              // 调用后端API获取预约数据
              const response = await axios.post(`${apiUrl}/reserve/reservations/all`, {
                server_id: serverId,
                gpu_list: gpuList
              }, {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem('token')}`
                }
              });
              
              if (response.data) {
                // 创建颜色映射
                const colors = [
                  '#FFB6C1', '#AAE6C0', '#FFD8B0', '#ADD8E6', '#F5B195',
                  '#D8BFD8', '#F7E6A7', '#A0C4E2', '#E8B4B8', '#A7DBD8',
                  '#F8C4B4', '#C9BAE2', '#B2DFDB', '#F8B9B2', '#F2D785',
                  '#BEA9DE', '#92CFC5', '#EDBE9C', '#87CEEB', '#F4B3C2',
                  '#BCE29E', '#B5C7E9', '#F8C291', '#BDE0C0', '#DDB0DD',
                  '#F4E285', '#A2CFFE', '#FFC1A1', '#AAD5E8', '#B5CCAA'
                ];
                
                // 为用户分配固定颜色
                const userColorMap = {};
                const userIds = Object.keys(response.data.reservations);
                
                userIds.forEach((userId, index) => {
                  const colorIndex = index % colors.length;
                  userColorMap[userId] = colors[colorIndex];
                });
                
                // 将API返回的数据转换为应用所需的格式
                const formattedReservations = gpuData.map(gpu => {
                  // 为当前GPU收集所有预约信息
                  const reservations = [];
                  
                  // 遍历所有用户
                  console.log(response.data.reservations);
                  for (const [userId, userReservations] of Object.entries(response.data.reservations)) {
                    // 检查每个预约是否包含当前GPU
                    for (const reservation of userReservations) {
                      if (reservation.gpu_list.includes(gpu.index)) {
                        // 后端返回的是上海时间的日期字符串，直接创建本地日期对象
                        const startDate = new Date(reservation.start_time + 'T00:00:00');
                        // 后端的end_time表示结束日期，比如"2025-06-16"表示6月16日24点结束
                        // 所以不需要加一天，直接使用该日期即可
                        const endDate = new Date(reservation.end_time + 'T00:00:00');
                        // 判断是否为当前用户的预约
                        const isCurrentUser = userId === username || userId === localStorage.getItem('username');
                        
                        reservations.push({
                          id: `res-${gpu.id}-${userId}-${reservation.start_time}`,
                          user: userId,
                          // 如果是当前用户，不分配颜色，由预约表格样式处理
                          color: isCurrentUser ? null : userColorMap[userId],
                          startDate,
                          endDate,
                          isCurrentUser,
                          // 添加分配状态，默认为"active"，以便兼容旧数据
                          allocationStatus: reservation.allocation_status || "active"
                        });
                      }
                    }
                  }
                  
                  return {
                    ...gpu,
                    reservations
                  };
                });
                
                // 更新预约数据状态
                setScheduleData(prev => ({
                  ...prev,
                  dateLabels: generateDateLabels(), // 更新日期标签
                  gpuReservations: formattedReservations
                }));
              }
            } catch (error) {
              console.error('获取预约数据失败:', error);
  
            } finally {
              setIsLoading(false);
            }
          };
          
          fetchReservations();
      }
    }, [show, gpuData.length, username, serverId]);
  
    // 检查日期是否有预约
    const hasReservationOnDate = (gpu, date) => {
      const dateStr = formatDate(date);
      return gpu.reservations.some(res => {
        const start = formatDate(new Date(res.startDate));
        const end = formatDate(new Date(res.endDate));
        
        // 检查日期是否在预约范围内，包含开始和结束日期当天
        return dateStr >= start && dateStr <= end;
      });
    };
  
    // 获取日期预约信息
    const getReservationInfo = (gpu, date) => {
      const dateStr = formatDate(date);
      const reservation = gpu.reservations.find(res => {
        const start = formatDate(new Date(res.startDate));
        const end = formatDate(new Date(res.endDate));
        
        // 检查日期是否在预约范围内，包含开始和结束日期当天
        return dateStr >= start && dateStr <= end;
      });
      
      if (!reservation) return { user: null, color: null, isCurrentUser: false, allocationStatus: null };
      
      return {
        user: reservation.isCurrentUser ? 'current' : reservation.user,
        color: reservation.color,
        isCurrentUser: reservation.isCurrentUser,
        allocationStatus: reservation.allocationStatus || "active" // 添加分配状态
      };
    };
  
    // 处理表单字段变更
    const handleFormChange = (e) => {
      const { name, value } = e.target;
      setReservationForm(prev => ({
        ...prev,
        [name]: value
      }));
    };
  
    // 处理GPU选择
    const handleGpuSelect = (gpuId) => {
      // 使用函数式更新来避免状态不同步问题
      setReservationForm(prevForm => {
        // 创建当前选择列表的副本
        const currentSelected = [...prevForm.gpuIds];
        
        // 查找gpuId在数组中的索引
        const index = currentSelected.indexOf(gpuId);
        
        // 如果已经存在于选择列表中，则移除
        if (index !== -1) {
          currentSelected.splice(index, 1);
        } 
        // 否则添加到选择列表
        else {
          currentSelected.push(gpuId);
        }
        
        // 返回更新后的状态
        return {
          ...prevForm,
          gpuIds: currentSelected
        };
      });
    };
  
    // 提交预约
    const handleSubmit = async (e) => {
      e.preventDefault();
      
      // 表单验证
      if (!reservationForm.container) {
        setError('请选择容器');
        return;
      }
      
      if (reservationForm.gpuIds.length === 0) {
        setError('请至少选择一张GPU');
        return;
      }
      
      if (!reservationForm.startDate || !reservationForm.endDate) {
        setError('请选择开始和结束日期');
        return;
      }
      
      const startDate = new Date(reservationForm.startDate);
      const endDate = new Date(reservationForm.endDate);
      
      if (startDate > endDate) {
        setError('结束日期必须晚于开始日期');
        return;
      }
      
      setSubmitting(true);
      
      try {
        // 获取选中的GPU的索引列表
        const selectedGpus = gpuData
          .filter(gpu => reservationForm.gpuIds.includes(gpu.id))
          .map(gpu => gpu.index);
        
        // 将本地日期转换为UTC时间发送给后端
        // 开始日期：本地日期的午夜转换为UTC
        const formattedStartDate = localToUtc(reservationForm.startDate);
        
        // 结束日期：本地日期加一天的午夜转换为UTC（保持原有的业务逻辑）
        const endDateLocal = new Date(reservationForm.endDate);
        endDateLocal.setDate(endDateLocal.getDate() + 1);
        const formattedEndDate = localToUtc(formatDate(endDateLocal));
        
        // 调用后端API进行预约
        const response = await axios.post(`${apiUrl}/reserve/multiple`, {
          server_id: serverId,
          container_id: reservationForm.container,
          gpu_list: selectedGpus,
          start_date: formattedStartDate,
          end_date: formattedEndDate
        }, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        // 成功后重新获取预约数据
        try {
          const gpuList = gpuData.map(gpu => gpu.index);
            
          const reservationsResponse = await axios.post(`${apiUrl}/reserve/reservations/all`, {
            server_id: serverId,
            gpu_list: gpuList
          }, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          if (reservationsResponse.data) {
            // 更新预约数据（使用之前相同的逻辑处理数据）
            // 这里可以复用上面的数据处理逻辑，但为了简化代码，直接触发useEffect重新获取
            setScheduleData(prev => ({
              ...prev,
              gpuReservations: [] // 清空数据，触发重新获取
            }));
          }
        } catch (fetchError) {
          console.error('更新预约数据失败:', fetchError);
        }
        
        // 重置表单
        setReservationForm({
          container: containers.length > 0 ? containers[0].name : '',
          gpuIds: [],
          startDate: formatDate(today),
          endDate: formatDate(new Date(today.getTime() + 24 * 60 * 60 * 1000))
        });
        
        // 成功消息
        alert(response.data.message || '预约提交成功！');
        onClose();
      } catch (err) {
        console.error('预约提交失败:', err);
        
        let errorMessage = '预约提交失败，请稍后重试';
        
        // 处理不同类型的错误响应
        if (err.response) {
          const { status, data } = err.response;
          
          if (status === 400) {
            errorMessage = data.message || '参数错误';
            
            // 针对不同错误类型提供更友好的中文错误信息
            if (data.message.includes("Server ID, container ID")) {
              errorMessage = '提交信息不完整，请确保服务器ID、容器ID、GPU列表和预约时间都已填写';
            } else if (data.message.includes("Start date must be before end date")) {
              errorMessage = '开始时间必须早于结束时间';
            } else if (data.message.includes("GPU not found")) {
              errorMessage = '请求的GPU不存在';
            } else if (data.message.includes("Reservation failed") || data.message.includes("already reserved")) {
              errorMessage = '该时间段内GPU已被预约，请选择其他时间段或其他GPU';
            }
          } else if (status === 401) {
            errorMessage = '未授权，请重新登录';
          } else if (status === 409) {
            errorMessage = '所选GPU在预约时间段内已被占用，请选择其他时间或GPU';
          } else {
            errorMessage = data.message || `服务器错误 (${status})`;
          }
        }
        
        setError(errorMessage);
      } finally {
        setSubmitting(false);
      }
    };
  
    if (!show) return null;
  
    return ReactDOM.createPortal(
      <div className="modal-overlay">
        <div className="modal-content" style={{ 
          maxWidth: '1100px',
          maxHeight: '85vh',
          overflow: 'auto',
          padding: '16px 24px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 5px 10px -5px rgba(0, 0, 0, 0.05)'
        }}>
          <div className="modal-header" style={{ 
            padding: '8px 16px',
            marginBottom: '12px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h2 style={{ fontSize: '20px', margin: 0 }}>高级GPU预约</h2>
            <button 
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                color: '#A0AEC0',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {e.currentTarget.style.backgroundColor = '#EDF2F7'; e.currentTarget.style.color = '#4A5568';}}
              onMouseOut={(e) => {e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#A0AEC0';}}
              title="关闭"
            >&times;</button>
          </div>
          
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <LoadingSpinner size="large" text="正在加载预约数据..." />
            </div>
          ) : (
            <>
              <div className="reservation-content" style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '6px', // 进一步减小间距 从10px改为6px
                margin: '5px 0'
              }}>
                {error && (
                  <div style={{ 
                    backgroundColor: '#FED7D7', 
                    color: '#9B2C2C', 
                    padding: '6px 10px',
                    borderRadius: '6px', 
                    fontSize: '14px'
                  }}>
                    {error}
                  </div>
                )}
                
                <div className="reservation-schedule">
                  <h3 style={{ 
                    fontSize: '16px', 
                    fontWeight: '600', 
                    margin: '0 0 16px 0',
                    color: '#2D3748',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between', // 保持space-between以便左右两端对齐
                    textAlign: 'center'
                  }}>
                    {/* 左侧留空以便平衡中间标题 */}
                    <div style={{ width: '180px' }}></div>
                    
                    {/* 中间标题 */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      position: 'absolute',
                      left: '50%',
                      transform: 'translateX(-50%)'
                    }}>
                      <svg 
                        viewBox="0 0 24 24" 
                        fill="none"
                        width="16"
                        height="16" 
                        style={{ marginRight: '6px' }}
                      >
                        <path d="M8 7V3M16 7V3M7 11H17M5 21H19C20.1046 21 21 20.1046 21 19V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V19C3 20.1046 3.89543 21 5 21Z" 
                              stroke="#4299E1" 
                              strokeWidth="2" 
                              strokeLinecap="round" 
                              strokeLinejoin="round"/>
                      </svg>
                      显卡预约时间表
                    </div>
                    
                    {/* 右侧预约状态图例 */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      alignItems: 'center',
                      gap: '16px',
                      color: '#4A5568',
                      fontSize: '12px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <div style={{ 
                          width: '14px', 
                          height: '14px', 
                          backgroundColor: '#4299E1', 
                          borderRadius: '3px' 
                        }}></div>
                        <span>您的预约</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <div style={{ 
                          width: '14px', 
                          height: '14px', 
                          backgroundColor: '#D1D5DB', 
                          borderRadius: '3px' 
                        }}></div>
                        <span>他人预约</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <div style={{ 
                          width: '14px', 
                          height: '14px', 
                          backgroundColor: '#D1D5DB', 
                          borderRadius: '3px',
                          border: '2px dashed rgba(0,0,0,0.2)'
                        }}></div>
                        <span>待审批</span>
                      </div>
                    </div>
                  </h3>
                  
                  <div className="schedule-table-wrapper" style={{ 
                    marginTop: '12px',
                    marginBottom: '8px',
                    border: '1px solid #CBD5E0',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    backgroundColor: 'white',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                  }}>
                    <div style={{
                      width: '100%',
                      overflowX: 'auto',
                      overflowY: 'hidden',
                      position: 'relative',
                      paddingBottom: '10px', /* 确保滚动条有足够空间显示 */
                      maxHeight: '450px', /* 设置最大高度，避免表格过长 */
                      scrollbarWidth: 'thin', /* Firefox */
                      scrollbarColor: '#CBD5E0 #F7FAFC', /* Firefox */
                      msOverflowStyle: 'none' /* IE and Edge */
                    }}>
                      {/* 自定义滚动条样式 */}
                      <style>
                        {`
                          .schedule-table-wrapper > div::-webkit-scrollbar {
                            height: 6px;
                            background-color: #F7FAFC;
                          }
                          .schedule-table-wrapper > div::-webkit-scrollbar-thumb {
                            background-color: #CBD5E0;
                            border-radius: 3px;
                          }
                          .schedule-table-wrapper > div::-webkit-scrollbar-thumb:hover {
                            background-color: #A0AEC0;
                          }
                        `}
                      </style>
                      <table className="schedule-table" style={{
                        width: 'auto',
                        minWidth: '100%',
                        borderCollapse: 'separate',
                        borderSpacing: '2px'
                      }}>
                        <thead>
                          <tr>
                            <th className="gpu-name-column" style={{
                              backgroundColor: '#EBF8FF',
                              padding: '8px 6px',
                              fontSize: '13px',
                              fontWeight: '600',
                              color: '#2C5282',
                              textAlign: 'center',
                              borderBottom: '1px solid #BEE3F8',
                              position: 'sticky',
                              left: 0,
                              zIndex: 10,
                              minWidth: '90px',
                              boxShadow: '2px 0 4px rgba(0,0,0,0.05)'
                            }}>显卡/日期</th>
                            {scheduleData.dateLabels.map((date, index) => (
                              <th key={index} className="date-column" style={{ 
                                padding: '8px 6px',
                                backgroundColor: '#EBF8FF',
                                fontSize: '13.5px',
                                fontWeight: '600',
                                color: '#2C5282',
                                textAlign: 'center',
                                borderBottom: '1px solid #BEE3F8',
                                width: '60px',
                                minWidth: '60px'
                              }}>
                                <div style={{whiteSpace: 'nowrap'}}>{date.substring(5)}</div> {/* 只显示月和日 */}
                                <div className="day-name" style={{ 
                                  fontSize: '11px',
                                  color: '#718096',
                                  marginTop: '2px' 
                                }}>
                                  {new Date(date).toLocaleDateString('zh-CN', { weekday: 'short' })}
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {scheduleData.gpuReservations.map(gpu => (
                            <tr key={gpu.id} style={{
                              borderBottom: '1px solid #EDF2F7'
                            }}>
                              <td className="gpu-name" style={{ 
                                padding: '6px 8px',
                                fontSize: '13px',
                                fontWeight: '500',
                                color: '#2D3748',
                                position: 'sticky',
                                left: 0,
                                backgroundColor: '#f8fafc',
                                zIndex: 1,
                                boxShadow: '2px 0 4px rgba(0,0,0,0.05)'
                              }}>{gpu.name}</td>
                              {scheduleData.dateLabels.map((dateStr, index) => {
                                const date = new Date(dateStr);
                                const hasReservation = hasReservationOnDate(gpu, date);
                                const reservationInfo = getReservationInfo(gpu, date);
                                
                                // 确定单元格的样式类和额外样式
                                let cellClass = hasReservation ? 'occupied' : 'available';
                                let cellStyle = {};
                                
                                if (hasReservation) {
                                  // 基础样式
                                  cellStyle = { 
                                    backgroundColor: reservationInfo.color || '#E2E8F0',
                                    opacity: 0.85,
                                    borderRadius: '3px',
                                    border: '1px solid rgba(0,0,0,0.05)',
                                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
                                  };
                                  
                                  // 特殊标记当前用户的预约 - 使用与提交预约申请按钮相同的颜色
                                  if (reservationInfo.user === 'current' || reservationInfo.isCurrentUser) {
                                    cellStyle = { 
                                      backgroundColor: '#4299E1', // 与提交预约申请按钮相同的颜色
                                      opacity: 1,
                                      borderRadius: '3px',
                                      border: '2px solid #3182CE', // 稍微深一点的边框
                                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                                    };
                                  } else {
                                    cellStyle = { 
                                      backgroundColor: reservationInfo.color || '#D1D5DB',
                                      opacity: 0.95, // 略微提高不透明度
                                      borderRadius: '3px',
                                      border: '1px solid rgba(0,0,0,0.1)', // 稍微深一点的边框
                                      boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
                                    };
                                  }
                                  
                                  // 根据分配状态添加额外样式
                                  if (reservationInfo.allocationStatus === "pending") {
                                    // 待审批状态 - 添加虚线边框
                                    cellStyle.border = '2px dashed rgba(0,0,0,0.2)';
                                    cellStyle.boxShadow = 'inset 0 0 4px rgba(0,0,0,0.1)';
                                  }
                                } else {
                                  // 未预约状态样式
                                  cellStyle = {
                                    backgroundColor: '#EDF2F7',
                                    border: '1px solid #E2E8F0',
                                    borderRadius: '2px'
                                  };
                                }
                                
                                return (
                                  <td 
                                    key={index} 
                                    className={`schedule-cell ${cellClass} ${hasReservation ? `status-${reservationInfo.allocationStatus}` : ''}`}
                                    title={hasReservation ? 
                                      `预约人: ${reservationInfo.user === 'current' ? '您' : reservationInfo.user}${reservationInfo.allocationStatus === "pending" ? " (待审批)" : reservationInfo.allocationStatus === "approval" ? " (审批待执行)" : ""}` : 
                                      '可用'}
                                    style={{
                                      ...cellStyle, 
                                      padding: '0', 
                                      height: '26px',
                                      width: '60px',
                                      minWidth: '60px',
                                      transition: 'all 0.2s ease',
                                      cursor: hasReservation ? 'pointer' : 'default'
                                    }}
                                    onMouseOver={(e) => {
                                      if (hasReservation) {
                                        if (reservationInfo.user === 'current' || reservationInfo.isCurrentUser) {
                                          e.currentTarget.style.backgroundColor = '#3182CE'; // 鼠标悬停时变深
                                          e.currentTarget.style.boxShadow = '0 0 0 2px #2C5282';
                                        } else {
                                          e.currentTarget.style.opacity = '1';
                                          e.currentTarget.style.filter = 'brightness(0.95)'; // 使颜色稍微变暗
                                          e.currentTarget.style.boxShadow = '0 0 0 1px rgba(0,0,0,0.15)';
                                        }
                                      }
                                    }}
                                    onMouseOut={(e) => {
                                      if (hasReservation) {
                                        if (reservationInfo.user === 'current' || reservationInfo.isCurrentUser) {
                                          e.currentTarget.style.backgroundColor = '#4299E1'; // 恢复原色
                                          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)';
                                        } else {
                                          e.currentTarget.style.opacity = '0.95';
                                          e.currentTarget.style.filter = 'brightness(1)';
                                          e.currentTarget.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.05)';
                                        }
                                      }
                                    }}
                                  >
                                    {hasReservation && (
                                      <div style={{
                                        width: '100%',
                                        height: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                      }}>
                                        {/* 为待审批状态添加一个图标 */}
                                        {reservationInfo.allocationStatus === "pending" && (
                                          <svg viewBox="0 0 24 24" width="12" height="12" fill={reservationInfo.isCurrentUser ? "white" : "rgba(0,0,0,0.6)"} style={{opacity: 0.9}}>
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-14h2v7h-2zm0 8h2v2h-2z"/>
                                          </svg>
                                        )}
                                      </div>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'center', 
                      marginTop: '8px', 
                      marginBottom: '4px',
                      color: '#718096',
                      fontSize: '13px'
                    }}>
                      <span>← 左右滑动查看更多日期 →</span>
                    </div>
                    
                    {/* 删除这里的图例，因为已经移动到标题右侧 */}
                  </div>
                </div>
                
                <form onSubmit={handleSubmit} className="simplified-reservation-form" style={{ 
                  marginTop: '0px', // 完全移除上边距 从1px改为0px
                  backgroundColor: '#FAFAFA',
                  padding: '14px 16px', // 减小顶部内边距 从16px改为14px
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0'
                }}>
                  <h3 style={{ 
                    fontSize: '16px', 
                    fontWeight: '600', 
                    margin: '0 0 8px 0', // 减小下边距 从10px改为8px
                    color: '#2D3748',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start' // 确保标题左对齐
                  }}>
                    <svg 
                      viewBox="0 0 24 24" 
                      fill="none"
                      width="16" // 减小尺寸
                      height="16" // 减小尺寸
                      style={{ marginRight: '6px' }}
                    >
                      <path d="M9 11H15M12 8V14M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z" 
                            stroke="#4299E1" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"/>
                    </svg>
                    创建新预约
                  </h3>
                  
                  {/* 使用网格布局，平铺满空白区域 */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(2, 1fr)', 
                    gridTemplateRows: 'auto auto',
                    gap: '10px', // 减小网格间距 从12px改为10px
                    width: '100%'
                  }}>
                    {/* 容器选择区域 - 占据第一行的第一列 */}
                    <div className="form-group container-selection-group" style={{ 
                      margin: 0,
                      gridColumn: '1 / 2',
                      gridRow: '1 / 2'
                    }}>
                      <label htmlFor="container" style={{ 
                        marginBottom: '3px', // 减小下边距 从4px改为3px
                        fontSize: '14px', 
                        display: 'block' 
                      }}>选择容器</label>
                      {isLoadingContainers ? (
                        <div style={{ display: 'flex', alignItems: 'center', fontSize: '13px', color: '#718096' }}>
                          <LoadingSpinner size="small" />
                          <span style={{ marginLeft: '6px' }}>正在加载容器...</span>
                        </div>
                      ) : containers.length === 0 ? (
                        <div style={{ 
                          padding: '6px', // 减小内边距 从8px改为6px
                          backgroundColor: '#F7FAFC', 
                          borderRadius: '6px',
                          fontSize: '13px',
                          color: '#4A5568'
                        }}>
                          没有可用的容器，请先创建并启动一个容器。
                        </div>
                      ) : (
                        <select 
                          id="container"
                          name="container"
                          className="container-select"
                          value={reservationForm.container}
                          onChange={handleFormChange}
                          disabled={submitting}
                          style={{ 
                            padding: '6px 10px', // 减小内边距 从8px改为6px
                            height: '36px', // 减小高度 从38px改为36px
                            width: '100%' 
                          }}
                        >
                          {containers.map(container => (
                            <option key={`${container.server_id}-${container.name}`} value={container.name}>
                              {formatContainerName(container.name)} ({getServerName(container.server_id)})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                    
                    {/* 日期范围选择 - 占据第一行的第二列 */}
                    <div className="form-group date-range-group" style={{ 
                      margin: 0,
                      gridColumn: '2 / 3',
                      gridRow: '1 / 2'
                    }}>
                      <label htmlFor="dateRange" style={{ 
                        marginBottom: '3px',
                        fontSize: '14px',
                        display: 'block'
                      }}>选择预约时间范围</label>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        padding: '0 8px',
                        height: '36px',
                        width: '100%'
                      }}>
                        <input
                          type="date"
                          id="startDate"
                          name="startDate"
                          value={reservationForm.startDate}
                          onChange={handleFormChange}
                          min={formatDate(today)}
                          max={(() => {
                            const maxDate = new Date(today);
                            maxDate.setDate(today.getDate() + 30);
                            return formatDate(maxDate);
                          })()}
                          disabled={submitting}
                          required
                          style={{ 
                            border: 'none',
                            padding: '5px 5px',
                            width: '50%',
                            fontSize: '13px',
                            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                            fontWeight: '500',
                            color: '#2D3748'
                          }}
                        />
                        <span style={{ 
                          margin: '0 6px',
                          color: '#718096', 
                          fontSize: '14px'
                        }}>至</span>
                        <input
                          type="date"
                          id="endDate"
                          name="endDate"
                          value={reservationForm.endDate}
                          onChange={handleFormChange}
                          min={reservationForm.startDate}
                          max={(() => {
                            const maxDate = new Date(today);
                            maxDate.setDate(today.getDate() + 30);
                            return formatDate(maxDate);
                          })()}
                          disabled={submitting}
                          required
                          style={{ 
                            border: 'none',
                            padding: '5px 5px',
                            width: '50%',
                            fontSize: '13px',
                            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                            fontWeight: '500',
                            color: '#2D3748'
                          }}
                        />
                      </div>
                    </div>
                    
                    {/* GPU多选表格 - 占据第二行的所有列 */}
                    <div className="form-group gpu-selection-group" style={{ 
                      margin: 0,
                      gridColumn: '1 / 3', // 修改为跨越两列
                      gridRow: '2 / 3'
                    }}>
                      <label style={{ 
                        marginBottom: '3px', // 减小下边距 从4px改为3px
                        fontSize: '14px',
                        display: 'block'
                      }}>选择显卡 (可多选)</label>
                      <div className="gpu-checkbox-grid" style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(5, 1fr)', 
                        gap: '6px', // 减小网格间距 从8px改为6px
                        padding: '8px', // 减小内边距 从10px改为8px
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        minHeight: '110px', // 减小最小高度 从120px改为110px
                        maxHeight: '120px', // 减小最大高度 从130px改为120px
                        overflowY: 'auto'
                      }}>
                        {/* 使用React.memo避免不必要的重渲染 */}
                        {scheduleData.gpuReservations.map(gpu => {
                          const gpuId = gpu.id;
                          const isSelected = reservationForm.gpuIds.includes(gpuId);
                          
                          // 统一使用一种选择样式
                          const backgroundColor = isSelected ? '#ebf8ff' : '#f8fafc';
                          const borderColor = isSelected ? '#90cdf4' : '#e2e8f0';
                          const textColor = isSelected ? '#2b6cb0' : '#4A5568';
                          const fontWeight = isSelected ? '600' : '500';
                          
                          return (
                            <div 
                              key={`gpu-item-${gpuId}`}
                              className={`gpu-selector-item ${isSelected ? 'selected' : ''}`}
                              onClick={() => {
                                if (!submitting) {
                                  handleGpuSelect(gpuId);
                                }
                              }}
                              style={{ 
                                padding: '8px 12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: backgroundColor,
                                border: `1px solid ${borderColor}`,
                                borderRadius: '6px',
                                cursor: submitting ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s',
                                userSelect: 'none',
                                position: 'relative'
                              }}
                              onMouseOver={(e) => {
                                if (!submitting) {
                                  e.currentTarget.style.background = isSelected ? '#bee3f8' : '#edf2f7';
                                  e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
                                }
                              }}
                              onMouseOut={(e) => {
                                if (!submitting) {
                                  e.currentTarget.style.background = backgroundColor;
                                  e.currentTarget.style.boxShadow = 'none';
                                }
                              }}
                            >
                              <span 
                                style={{ 
                                  fontSize: '14px',
                                  fontWeight: fontWeight,
                                  color: textColor,
                                  textAlign: 'center',
                                  width: '100%'
                                }}
                              >
                                {gpu.name}
                              </span>
                              
                              {/* 选中标记只在选中状态时显示 */}
                              {isSelected && (
                                <div 
                                  className="checkmark"
                                  style={{
                                    position: 'absolute',
                                    top: '4px',
                                    right: '4px',
                                    width: '14px',
                                    height: '14px',
                                    borderRadius: '50%',
                                    backgroundColor: '#4299E1',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    pointerEvents: 'none' // 防止对勾图标接收事件
                                  }}
                                >
                                  <svg viewBox="0 0 24 24" width="10" height="10" fill="white">
                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                  </svg>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  
                  {/* 提交按钮 */}
                  <div className="form-actions" style={{ 
                    marginTop: '12px', 
                    display: 'flex',
                    justifyContent: 'flex-end'
                  }}>
                    <button
                      type="submit"
                      className="reservation-submit-button"
                      disabled={submitting || containers.length === 0}
                      style={{ 
                        padding: '7px 18px',
                        height: '36px',
                        minWidth: '120px',
                        backgroundColor: '#4299E1',
                        color: 'white',
                        fontWeight: '600',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: submitting || containers.length === 0 ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                        opacity: submitting || containers.length === 0 ? 0.7 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {submitting ? (
                        <>
                          <LoadingSpinner size="small" color="white" />
                          <span style={{marginLeft: '8px'}}>提交中...</span>
                        </>
                      ) : '提交预约申请'}
                    </button>
                  </div>
                </form>
              </div>
            </>
          )}
        </div>
      </div>,
      document.body
    );
  };