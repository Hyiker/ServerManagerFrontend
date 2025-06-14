import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
// 引入 Ant Design 组件和主题 Hook
import { Button, Select, DatePicker, Alert, Spin, theme, Space } from 'antd';
import { CloseOutlined, CalendarOutlined, PlusCircleOutlined } from '@ant-design/icons';
// import { LoadingSpinner } from './LoadingSpinner'; // antd Spin 将替代此组件
import serverConfig from '../assets/server.json';
import dayjs from 'dayjs'; // antd v5 默认使用 dayjs

const { RangePicker } = DatePicker;

export const AdvancedReservationModal = ({ apiUrl, serverId, show, onClose, gpuData, username }) => {
  // 使用 Ant Design 的 theme token 作为所有样式的来源
  const { token } = theme.useToken();

  // --- 样式对象定义 (使用 antd token) ---
  const modalStyles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    content: {
      backgroundColor: token.colorBgContainer,
      borderRadius: token.borderRadiusLG,
      maxWidth: '1100px',
      width: '95%',
      maxHeight: '85vh',
      overflow: 'auto',
      padding: `${token.paddingLG}px ${token.paddingXL}px`,
      boxShadow: token.boxShadowSecondary,
    },
    header: {
      paddingBottom: token.marginMD,
      marginBottom: token.margin,
      borderBottom: `1px solid ${token.colorBorderSecondary}`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    title: {
      fontSize: token.fontSizeLG,
      fontWeight: '600',
      color: token.colorText,
      margin: 0,
    },
  };

  const scheduleTableStyles = {
    wrapper: {
        marginTop: token.margin,
        border: `1px solid ${token.colorBorder}`,
        borderRadius: token.borderRadiusLG,
        overflow: 'hidden',
        backgroundColor: token.colorBgContainer,
    },
    scrollContainer: {
        width: '100%',
        overflowX: 'auto',
        position: 'relative',
        maxHeight: '400px',
    },
    table: {
        width: 'auto',
        minWidth: '100%',
        borderCollapse: 'separate',
        borderSpacing: '2px',
    },
    th: {
        backgroundColor: token.colorPrimaryBg,
        padding: `${token.paddingXS}px ${token.paddingXXS}px`,
        fontSize: token.fontSizeSM,
        fontWeight: '600',
        color: token.colorPrimaryText,
        textAlign: 'center',
        borderBottom: `1px solid ${token.colorPrimaryBorder}`,
        width: '60px',
        minWidth: '60px',
    },
    thSticky: {
        position: 'sticky',
        left: 0,
        zIndex: 10,
        minWidth: '90px',
        boxShadow: `2px 0 5px -2px ${token.colorSplit}`,
    },
    tdSticky: {
        padding: `${token.paddingXXS}px ${token.paddingXS}px`,
        fontSize: token.fontSizeSM,
        fontWeight: '500',
        color: token.colorText,
        position: 'sticky',
        left: 0,
        backgroundColor: token.colorBgLayout,
        zIndex: 1,
        boxShadow: `2px 0 5px -2px ${token.colorSplit}`,
    },
    cellBase: {
        padding: 0,
        height: '28px',
        width: '60px',
        minWidth: '60px',
        transition: `all ${token.motionDurationSlow}`,
        cursor: 'default',
        borderRadius: token.borderRadiusSM,
    },
    cellAvailable: {
        backgroundColor: token.colorBgLayout,
    },
    cellCurrentUser: {
        backgroundColor: token.colorPrimary,
        cursor: 'pointer',
        border: `2px solid ${token.colorPrimaryBorder}`,
    },
    cellOtherUser: {
        backgroundColor: token.colorInfoBg,
        cursor: 'default',
        border: `1px solid ${token.colorInfoBorder}`,
    },
    cellPending: {
        border: `2px dashed ${token.colorWarning}`,
    },
  };

  const formStyles = {
    form: {
      backgroundColor: token.colorBgLayout,
      padding: token.paddingLG,
      borderRadius: token.borderRadiusLG,
      border: `1px solid ${token.colorBorder}`,
    },
    title: {
      fontSize: token.fontSizeLG,
      fontWeight: '600',
      margin: `0 0 ${token.margin}px 0`,
      color: token.colorText,
      display: 'flex',
      alignItems: 'center',
      gap: token.marginXS,
    },
    label: {
      marginBottom: token.marginXXS,
      fontSize: token.fontSize,
      display: 'block',
      color: token.colorTextSecondary,
    },
    gpuGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
      gap: token.marginXS,
      padding: token.paddingXS,
      backgroundColor: token.colorBgContainer,
      border: `1px solid ${token.colorBorder}`,
      borderRadius: token.borderRadius,
      maxHeight: '130px',
      overflowY: 'auto',
    },
    gpuItem: {
      base: {
        padding: `${token.paddingXS}px ${token.paddingSM}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: `1px solid ${token.colorBorder}`,
        borderRadius: token.borderRadius,
        cursor: 'pointer',
        transition: `all ${token.motionDurationMid}`,
        userSelect: 'none',
        position: 'relative',
        textAlign: 'center',
        backgroundColor: token.colorBgContainer,
        color: token.colorText,
      },
      selected: {
        backgroundColor: token.colorPrimaryBg,
        borderColor: token.colorPrimary,
        color: token.colorPrimaryTextActive,
        fontWeight: '500',
      },
    },
  };

  // --- 状态定义 (逻辑未改变) ---
  const [containers, setContainers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingContainers, setIsLoadingContainers] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [scheduleData, setScheduleData] = useState({
    dateLabels: [],
    gpuReservations: []
  });

  const today = dayjs();
  const formatDateForState = (date) => date.format('YYYY-MM-DD');

  const [reservationForm, setReservationForm] = useState({
    container: undefined, // antd Select 使用 undefined 作为 placeholder 的值
    gpuIds: [],
    startDate: formatDateForState(today),
    endDate: formatDateForState(today.add(1, 'day'))
  });

  // --- 所有业务逻辑 (useEffect, aioxs请求, 表单处理) 均保持不变, 仅对日期处理做微调 ---
  // ... (保留所有未修改的函数: utcToLocal, localToUtc, formatContainerName, getServerName, serverMapping)
    const utcToLocal = (utcTimeString) => new Date(utcTimeString);
    const localToUtc = (localDateString) => new Date(localDateString + 'T00:00:00').toISOString();
    const formatContainerName = (name) => {
        if (!name) return name;
        const dashIndex = name.indexOf('-');
        return dashIndex !== -1 ? name.substring(dashIndex + 1) : name;
    };
    const serverMapping = serverConfig.servers.reduce((mapping, server, index) => {
        mapping[server.serverIp] = { name: server.name, serverIp: server.serverIp, index: index };
        return mapping;
    }, {});
    const getServerName = (serverId) => serverMapping[serverId]?.name || serverId;


  useEffect(() => {
    if (show) {
        const fetchContainers = async () => {
          setIsLoadingContainers(true);
          try {
            const response = await axios.get(`${apiUrl}/server/container/user`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
            const runningContainers = response.data.filter(c => c.status.toLowerCase() === 'running' && c.server_id === serverId);
            setContainers(runningContainers);
            if (runningContainers.length > 0) {
              setReservationForm(prev => ({ ...prev, container: runningContainers[0].name }));
            } else {
              setReservationForm(prev => ({ ...prev, container: undefined }));
            }
          } catch (err) { console.error('获取容器列表失败:', err); setError('无法获取容器列表'); }
          finally { setIsLoadingContainers(false); }
        };
      fetchContainers();
    }
  }, [show, serverId]);

  useEffect(() => {
    if (show && gpuData.length > 0) {
      const generateDateLabels = () => Array.from({ length: 31 }, (_, i) => formatDateForState(today.add(i, 'day')));
      const gpuList = gpuData.map(gpu => gpu.index);
      const fetchReservations = async () => {
        setIsLoading(true);
        try {
          const response = await axios.post(`${apiUrl}/reserve/reservations/all`, { server_id: serverId, gpu_list: gpuList }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
          if (response.data) {
            const colors = ['#ffd6e7', '#d9f7be', '#fff1b8', '#bae0ff', '#ffccc7', '#efdbff', '#fffb8f', '#b5f5ec', '#ffc069', '#d4e1f7'];
            const userColorMap = {};
            Object.keys(response.data.reservations).forEach((userId, index) => { userColorMap[userId] = colors[index % colors.length]; });

            const formattedReservations = gpuData.map(gpu => ({
              ...gpu,
              reservations: Object.entries(response.data.reservations).flatMap(([userId, userReservations]) =>
                userReservations
                  .filter(res => res.gpu_list.includes(gpu.index))
                  .map(res => {
                    const isCurrentUser = userId === username || userId === localStorage.getItem('username');
                    return {
                      id: `res-${gpu.id}-${userId}-${res.start_time}`,
                      user: userId,
                      color: isCurrentUser ? null : userColorMap[userId] || token.colorInfoBg,
                      startDate: new Date(res.start_time + 'T00:00:00'),
                      endDate: new Date(res.end_time + 'T00:00:00'),
                      isCurrentUser,
                      allocationStatus: res.allocation_status || "active",
                    };
                  })
              )
            }));

            setScheduleData({ dateLabels: generateDateLabels(), gpuReservations: formattedReservations });
          }
        } catch (error) { console.error('获取预约数据失败:', error); setError('无法获取预约数据'); }
        finally { setIsLoading(false); }
      };
      fetchReservations();
    }
  }, [show, gpuData, serverId, username, token.colorInfoBg]);

  const hasReservationOnDate = (gpu, dateStr) => gpu.reservations.some(res => {
      const start = formatDateForState(dayjs(res.startDate));
      const end = formatDateForState(dayjs(res.endDate));
      return dateStr >= start && dateStr <= end;
  });

  const getReservationInfo = (gpu, dateStr) => {
    const reservation = gpu.reservations.find(res => {
        const start = formatDateForState(dayjs(res.startDate));
        const end = formatDateForState(dayjs(res.endDate));
        return dateStr >= start && dateStr <= end;
    });
    return reservation ? {
      user: reservation.isCurrentUser ? 'current' : reservation.user,
      color: reservation.color,
      isCurrentUser: reservation.isCurrentUser,
      allocationStatus: reservation.allocationStatus || "active"
    } : null;
  };

  const handleGpuSelect = (gpuId) => {
    setReservationForm(prev => ({
      ...prev,
      gpuIds: prev.gpuIds.includes(gpuId) ? prev.gpuIds.filter(id => id !== gpuId) : [...prev.gpuIds, gpuId]
    }));
  };

  const handleSubmit = async () => {
    if (!reservationForm.container) { setError('请选择容器'); return; }
    if (reservationForm.gpuIds.length === 0) { setError('请至少选择一张GPU'); return; }
    if (!reservationForm.startDate || !reservationForm.endDate) { setError('请选择开始和结束日期'); return; }
    if (dayjs(reservationForm.startDate).isAfter(dayjs(reservationForm.endDate))) { setError('结束日期必须晚于开始日期'); return; }

    setSubmitting(true);
    setError('');

    try {
      const selectedGpus = gpuData.filter(gpu => reservationForm.gpuIds.includes(gpu.id)).map(gpu => gpu.index);
      const formattedStartDate = localToUtc(reservationForm.startDate);
      const endDateLocal = dayjs(reservationForm.endDate).add(1, 'day').toDate();
      const formattedEndDate = localToUtc(formatDateForState(dayjs(endDateLocal)));

      await axios.post(`${apiUrl}/reserve/multiple`,
        { server_id: serverId, container_id: reservationForm.container, gpu_list: selectedGpus, start_date: formattedStartDate, end_date: formattedEndDate },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      alert('预约提交成功！');
      onClose();
    } catch (err) {
      console.error('预约提交失败:', err);
      setError(err.response?.data?.message || '预约提交失败，请检查GPU占用情况或联系管理员');
    } finally {
      setSubmitting(false);
    }
  };


  if (!show) return null;

  return ReactDOM.createPortal(
    <div style={modalStyles.overlay}>
      <div style={modalStyles.content}>
        <div style={modalStyles.header}>
          <h2 style={modalStyles.title}>高级GPU预约</h2>
          <Button type="text" shape="circle" icon={<CloseOutlined />} onClick={onClose} />
        </div>

        <Spin spinning={false} tip="正在加载预约数据..." size="large">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              {error && <Alert message={error} type="error" showIcon closable onClose={() => setError('')} />}

              {/* 预约时间表 */}
              <div>
                <h3 style={{...formStyles.title, justifyContent: 'space-between'}}>
                    <span /> {/*占位*/}
                    <Space> <CalendarOutlined /> 显卡预约时间表 </Space>
                    <Space size="large" style={{fontSize: token.fontSizeSM, color: token.colorTextSecondary}}>
                        <Space><div style={{width: 14, height: 14, background: token.colorPrimary, borderRadius: token.borderRadiusSM}}/><span>您的预约</span></Space>
                        <Space><div style={{width: 14, height: 14, background: token.colorInfoBg, borderRadius: token.borderRadiusSM}}/><span>他人预约</span></Space>
                        <Space><div style={{width: 14, height: 14, background: token.colorInfoBg, borderRadius: token.borderRadiusSM, border: `2px dashed ${token.colorWarning}`}}/><span>待审批</span></Space>
                    </Space>
                </h3>
                <div style={scheduleTableStyles.wrapper}>
                    <div style={scheduleTableStyles.scrollContainer}>
                         <table style={scheduleTableStyles.table}>
                            <thead>
                                <tr>
                                    <th style={{...scheduleTableStyles.th, ...scheduleTableStyles.thSticky}}>显卡/日期</th>
                                    {scheduleData.dateLabels.map((date, index) => (
                                        <th key={index} style={scheduleTableStyles.th}>
                                            <div>{dayjs(date).format('MM-DD')}</div>
                                            <div style={{fontSize: '11px', color: token.colorTextSecondary}}>{dayjs(date).format('ddd')}</div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {scheduleData.gpuReservations.map(gpu => (
                                <tr key={gpu.id}>
                                    <td style={scheduleTableStyles.tdSticky}>{gpu.name}</td>
                                    {scheduleData.dateLabels.map((dateStr, index) => {
                                    const reservationInfo = getReservationInfo(gpu, dateStr);
                                    let cellStyle = { ...scheduleTableStyles.cellBase };
                                    if(reservationInfo) {
                                        cellStyle = {...cellStyle, ...(reservationInfo.isCurrentUser ? scheduleTableStyles.cellCurrentUser : {...scheduleTableStyles.cellOtherUser, backgroundColor: reservationInfo.color})};
                                        if (reservationInfo.allocationStatus === "pending") {
                                            cellStyle = {...cellStyle, ...scheduleTableStyles.cellPending};
                                        }
                                    } else {
                                        cellStyle = {...cellStyle, ...scheduleTableStyles.cellAvailable};
                                    }
                                    return <td key={index} style={cellStyle} title={reservationInfo ? `预约人: ${reservationInfo.user === 'current' ? '您' : reservationInfo.user}` : '可用'} />;
                                    })}
                                </tr>
                                ))}
                            </tbody>
                         </table>
                    </div>
                </div>
              </div>

              {/* 预约表单 */}
              <div style={formStyles.form}>
                <h3 style={formStyles.title}><PlusCircleOutlined /> 创建新预约</h3>
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: token.margin}}>
                        <div>
                            <label style={formStyles.label}>选择容器</label>
                            <Select
                                style={{ width: '100%' }}
                                placeholder="请选择一个正在运行的容器"
                                value={reservationForm.container}
                                onChange={(value) => setReservationForm(p => ({...p, container: value}))}
                                loading={isLoadingContainers}
                                disabled={submitting}
                                options={containers.map(c => ({ label: `${formatContainerName(c.name)} (${getServerName(c.server_id)})`, value: c.name }))}
                            />
                        </div>
                         <div>
                            <label style={formStyles.label}>选择预约时间范围</label>
                            <RangePicker
                                style={{ width: '100%' }}
                                value={[dayjs(reservationForm.startDate), dayjs(reservationForm.endDate)]}
                                onChange={(dates) => {
                                    if(dates) {
                                        setReservationForm(p => ({...p, startDate: formatDateForState(dates[0]), endDate: formatDateForState(dates[1])}))
                                    }
                                }}
                                disabledDate={(current) => current && current < dayjs().startOf('day')}
                                disabled={submitting}
                            />
                        </div>
                    </div>
                    <div>
                        <label style={formStyles.label}>选择显卡 (可多选)</label>
                        <div style={formStyles.gpuGrid}>
                            {scheduleData.gpuReservations.map(gpu => {
                                const isSelected = reservationForm.gpuIds.includes(gpu.id);
                                return (
                                <div
                                    key={gpu.id}
                                    style={{ ...formStyles.gpuItem.base, ...(isSelected && formStyles.gpuItem.selected) }}
                                    onClick={() => !submitting && handleGpuSelect(gpu.id)}
                                >
                                    {gpu.name}
                                    {isSelected && <div style={{position: 'absolute', top: 2, right: 2, fontSize: '10px', color: token.colorPrimary}}><CloseOutlined /></div> }
                                </div>
                                );
                            })}
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            type="primary"
                            onClick={handleSubmit}
                            loading={submitting}
                            disabled={containers.length === 0}
                        >
                            提交预约申请
                        </Button>
                    </div>
                </Space>
              </div>
            </Space>
        </Spin>
      </div>
    </div>,
    document.body
  );
};
