// 智能陪护监控平台 - 视频页面脚本

// 全局变量
let isConnected = false;
let isRecording = false;
let imageRefreshInterval = null;
let serverUrl = ''; // 将从设置中获取

// DOM元素
const videoElement = document.getElementById('video-stream');
const btnConnect = document.getElementById('btn-connect');
const btnDisconnect = document.getElementById('btn-disconnect');
const btnStartRecording = document.getElementById('btn-start-recording');
const btnStopRecording = document.getElementById('btn-stop-recording');
const btnSnapshot = document.getElementById('btn-snapshot');
const btnFullscreen = document.getElementById('btn-fullscreen');
const statusBadge = document.querySelector('.status-badge');

// 初始化函数
function initVideoPage() {
    // 从localStorage获取服务器地址
    serverUrl = localStorage.getItem('serverUrl') || 'http://47.97.160.91:5000';
    
    // 设置事件监听器
    btnConnect.addEventListener('click', connectToStream);
    btnDisconnect.addEventListener('click', disconnectFromStream);
    btnStartRecording.addEventListener('click', startRecording);
    btnStopRecording.addEventListener('click', stopRecording);
    btnSnapshot.addEventListener('click', takeSnapshot);
    btnFullscreen.addEventListener('click', toggleFullscreen);
    
    // 检查录制状态
    checkRecordingStatus();
    
    // 每5秒检查一次录制状态
    setInterval(checkRecordingStatus, 5000);
}

// 连接到视频流
function connectToStream() {
    if (isConnected) return;
    
    // 更新UI状态
    btnConnect.disabled = true;
    videoElement.innerHTML = '<div class="connecting-indicator">正在连接...</div>';
    
    // 开始刷新图像
    imageRefreshInterval = setInterval(refreshLatestImage, 1000);
    
    // 更新状态
    isConnected = true;
    btnConnect.disabled = true;
    btnDisconnect.disabled = false;
    statusBadge.innerHTML = '<i class="bi bi-reception-4"></i> 在线';
    statusBadge.className = 'status-badge online';
}

// 断开视频流
function disconnectFromStream() {
    if (!isConnected) return;
    
    // 停止刷新图像
    if (imageRefreshInterval) {
        clearInterval(imageRefreshInterval);
        imageRefreshInterval = null;
    }
    
    // 恢复占位符
    videoElement.innerHTML = `
        <div class="video-placeholder">
            <i class="bi bi-camera-video-fill"></i>
            <p>已断开连接，点击连接按钮重新连接</p>
        </div>
    `;
    
    // 更新状态
    isConnected = false;
    btnConnect.disabled = false;
    btnDisconnect.disabled = true;
    statusBadge.innerHTML = '<i class="bi bi-reception-0"></i> 离线';
    statusBadge.className = 'status-badge offline';
}

// 刷新最新图像
function refreshLatestImage() {
    if (!isConnected) return;
    
    fetch(`${serverUrl}/api/image-info`)
        .then(response => {
            if (!response.ok) {
                throw new Error('获取图像信息失败');
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                console.error('获取图像信息错误:', data.error);
                return;
            }
            
            // 构建图像URL，添加时间戳防止缓存
            const imageUrl = `${serverUrl}${data.path}?t=${Date.now()}`;
            
            // 检查是否已经有图像元素
            let imgElement = videoElement.querySelector('img');
            
            if (!imgElement) {
                // 创建新的图像元素
                videoElement.innerHTML = '';
                imgElement = document.createElement('img');
                imgElement.classList.add('video-feed');
                videoElement.appendChild(imgElement);
            }
            
            // 更新图像
            imgElement.src = imageUrl;
            
            // 更新时间戳显示
            const timestampElement = document.querySelector('.video-timestamp') || document.createElement('div');
            timestampElement.className = 'video-timestamp';
            timestampElement.textContent = data.formatted_time;
            
            if (!document.querySelector('.video-timestamp')) {
                videoElement.appendChild(timestampElement);
            }
        })
        .catch(error => {
            console.error('获取最新图像失败:', error);
            
            // 如果多次失败，断开连接
            if (isConnected && error.toString().includes('获取图像信息失败')) {
                disconnectFromStream();
            }
        });
}

// 开始录制
function startRecording() {
    if (!isConnected) {
        alert('请先连接到视频流');
        return;
    }
    
    if (isRecording) return;
    
    fetch(`${serverUrl}/api/start-recording`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            isRecording = true;
            btnStartRecording.disabled = true;
            btnStopRecording.disabled = false;
            
            // 添加录制指示器
            const recordingIndicator = document.createElement('div');
            recordingIndicator.className = 'recording-indicator';
            recordingIndicator.innerHTML = '<i class="bi bi-record-fill"></i> 录制中';
            videoElement.appendChild(recordingIndicator);
        } else {
            alert('开始录制失败: ' + data.message);
        }
    })
    .catch(error => {
        console.error('开始录制错误:', error);
        alert('开始录制时发生错误');
    });
}

// 停止录制
function stopRecording() {
    if (!isRecording) return;
    
    fetch(`${serverUrl}/api/stop-recording`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            isRecording = false;
            btnStartRecording.disabled = false;
            btnStopRecording.disabled = true;
            
            // 移除录制指示器
            const recordingIndicator = document.querySelector('.recording-indicator');
            if (recordingIndicator) {
                recordingIndicator.remove();
            }
            
            // 刷新录像列表
            updateRecordingsList();
        } else {
            alert('停止录制失败: ' + data.message);
        }
    })
    .catch(error => {
        console.error('停止录制错误:', error);
        alert('停止录制时发生错误');
    });
}

// 拍照
function takeSnapshot() {
    if (!isConnected) {
        alert('请先连接到视频流');
        return;
    }
    
    // 创建全屏遮罩
    const overlay = document.createElement('div');
    overlay.className = 'snapshot-overlay';
    document.body.appendChild(overlay);
    
    // 添加闪光效果
    overlay.style.opacity = '1';
    setTimeout(() => {
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.remove();
        }, 300);
    }, 100);
    
    // 显示成功消息
    const msgContainer = document.createElement('div');
    msgContainer.className = 'snapshot-message';
    msgContainer.textContent = '已保存截图';
    document.body.appendChild(msgContainer);
    
    setTimeout(() => {
        msgContainer.style.opacity = '0';
        setTimeout(() => {
            msgContainer.remove();
        }, 300);
    }, 2000);
}

// 全屏显示
function toggleFullscreen() {
    const videoContainer = document.querySelector('.video-player');
    
    if (!document.fullscreenElement) {
        if (videoContainer.requestFullscreen) {
            videoContainer.requestFullscreen();
        } else if (videoContainer.webkitRequestFullscreen) {
            videoContainer.webkitRequestFullscreen();
        } else if (videoContainer.msRequestFullscreen) {
            videoContainer.msRequestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }
}

// 检查录制状态
function checkRecordingStatus() {
    fetch(`${serverUrl}/api/recording-status`)
        .then(response => response.json())
        .then(data => {
            isRecording = data.is_recording;
            
            if (isRecording) {
                btnStartRecording.disabled = true;
                btnStopRecording.disabled = false;
                
                // 添加录制指示器如果不存在
                if (!document.querySelector('.recording-indicator')) {
                    const recordingIndicator = document.createElement('div');
                    recordingIndicator.className = 'recording-indicator';
                    recordingIndicator.innerHTML = '<i class="bi bi-record-fill"></i> 录制中';
                    videoElement.appendChild(recordingIndicator);
                }
            } else {
                btnStartRecording.disabled = false;
                btnStopRecording.disabled = true;
                
                // 移除录制指示器如果存在
                const recordingIndicator = document.querySelector('.recording-indicator');
                if (recordingIndicator) {
                    recordingIndicator.remove();
                }
            }
        })
        .catch(error => {
            console.error('检查录制状态错误:', error);
        });
}

// 更新录像列表
function updateRecordingsList() {
    const recordingList = document.querySelector('.recording-list');
    
    fetch(`${serverUrl}/api/recordings`)
        .then(response => response.json())
        .then(recordings => {
            // 清空列表
            recordingList.innerHTML = '';
            
            // 添加录像
            recordings.slice(0, 5).forEach(recording => {
                const recordingItem = document.createElement('div');
                recordingItem.className = 'recording-item';
                recordingItem.innerHTML = `
                    <div class="recording-info">
                        <i class="bi bi-file-earmark-play"></i>
                        <span class="recording-title">${recording.created}</span>
                    </div>
                    <div class="recording-actions">
                        <button class="btn-small" data-path="${recording.path}"><i class="bi bi-play-fill"></i></button>
                        <button class="btn-small" data-download="${recording.path}"><i class="bi bi-download"></i></button>
                    </div>
                `;
                recordingList.appendChild(recordingItem);
                
                // 添加点击事件
                const playButton = recordingItem.querySelector('[data-path]');
                playButton.addEventListener('click', () => {
                    window.open(`${serverUrl}${recording.path}`, '_blank');
                });
                
                const downloadButton = recordingItem.querySelector('[data-download]');
                downloadButton.addEventListener('click', () => {
                    const a = document.createElement('a');
                    a.href = `${serverUrl}${recording.path}`;
                    a.download = recording.filename;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                });
            });
            
            // 如果没有录像
            if (recordings.length === 0) {
                recordingList.innerHTML = '<div class="no-recordings">暂无录像</div>';
            }
        })
        .catch(error => {
            console.error('获取录像列表错误:', error);
            recordingList.innerHTML = '<div class="no-recordings">获取录像失败</div>';
        });
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
    initVideoPage();
    updateRecordingsList();
}); 