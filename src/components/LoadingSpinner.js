// 添加通用加载动画组件
export const LoadingSpinner = ({ size = 'medium', color = '#4299E1', text = '' }) => {
    // 根据尺寸设置spinner大小
    let spinnerSize, borderSize, textSize;
    
    switch(size) {
      case 'small':
        spinnerSize = '16px';
        borderSize = '2px';
        textSize = '12px';
        break;
      case 'large':
        spinnerSize = '50px';
        borderSize = '5px';
        textSize = '16px';
        break;
      case 'medium':
      default:
        spinnerSize = '24px';
        borderSize = '3px';
        textSize = '14px';
    }
    
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center'
      }}>
        <div style={{
          width: spinnerSize,
          height: spinnerSize,
          border: `${borderSize} solid rgba(0, 0, 0, 0.1)`,
          borderTop: `${borderSize} solid ${color}`,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        {text && <p style={{ 
          marginTop: '8px', 
          fontSize: textSize, 
          color: '#718096',
          textAlign: 'center'
        }}>{text}</p>}
      </div>
    );
  };