// DOM 元素加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 更新时间
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
    
    // 初始化所有图表
    initStatusChart();
    initSedentaryChart();
    initSleepChart();
    initGlobe();
    
    // 加载真实数据
    loadRealTimeData();
    
    // 设置模拟数据定时更新
    setInterval(updateChartsWithRandomData, 5000);
    
    // 模拟紧急报警（5秒后触发一次）
    setTimeout(showAlertModal, 5000);
    
    // 检查登录状态已由common.js处理，此处不再重复检查
    // checkLoginStatus();
});

// 检查登录状态 - 保留但不再调用此函数
function checkLoginStatus() {
    // 使用与common.js一致的令牌检查逻辑
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    
    // 只要有token就认为已登录
    if (!token) {
        console.log('main.js: 未检测到token，跳转到登录页');
        window.location.href = 'login.html';
    } else {
        console.log('main.js: 检测到token，用户已登录');
        // 设置isLoggedIn标志，便于其他代码检查
        localStorage.setItem('isLoggedIn', 'true');
    }
}

// 更新当前时间
function updateCurrentTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    
    const timeString = `${year}年${month}月${day}日 ${hours}:${minutes}:${seconds}`;
    document.getElementById('current-time').textContent = timeString;
}

// 加载真实数据的函数
function loadRealTimeData() {
    // 显示加载提示
    document.getElementById('status-loading').style.display = 'block';
    document.getElementById('center-loading').style.display = 'block';
    document.getElementById('sedentary-loading').style.display = 'block';
    document.getElementById('sleep-loading').style.display = 'block';
    document.getElementById('emergency-loading').style.display = 'block';
    
    // 0. 先主动调用一次紧急联系人更新，确保显示默认数据
    updateEmergencyContacts(null);
    
    // 1. 获取老人状态数据
    getRequest('/api/seniors/status', function(data) {
        if (data && data.success) {
            updateStatusPanel(data.data);
        } else {
            console.warn('获取老人状态数据返回格式不正确，使用默认数据');
            // 保留默认UI状态
        }
        document.getElementById('status-loading').style.display = 'none';
    }, function(error) {
        console.error('获取老人状态数据失败:', error);
        document.getElementById('status-loading').style.display = 'none';
        // 错误时保留默认UI状态，不需要额外处理
    }, 'status-loading');
    
    // 2. 获取中央数据
    getRequest('/api/dashboard/summary', function(data) {
        if (data && data.success) {
            updateCenterPanel(data.data);
        } else {
            console.warn('获取中央数据返回格式不正确，使用默认数据');
            // 保留默认UI状态
        }
        document.getElementById('center-loading').style.display = 'none';
    }, function(error) {
        console.error('获取中央数据失败:', error);
        document.getElementById('center-loading').style.display = 'none';
        // 错误时保留默认UI状态，不需要额外处理
    }, 'center-loading');
    
    // 3. 获取静坐时间数据
    getRequest('/api/seniors/sedentary', function(data) {
        if (data && data.success) {
            updateSedentaryPanel(data.data);
        } else {
            console.warn('获取静坐时间数据返回格式不正确，使用默认数据');
            // 保留默认UI状态
        }
        document.getElementById('sedentary-loading').style.display = 'none';
    }, function(error) {
        console.error('获取静坐时间数据失败:', error);
        document.getElementById('sedentary-loading').style.display = 'none';
        // 错误时保留默认UI状态，不需要额外处理
    }, 'sedentary-loading');
    
    // 4. 获取睡眠数据
    getRequest('/api/seniors/sleep', function(data) {
        if (data && data.success) {
            updateSleepPanel(data.data);
        } else {
            console.warn('获取睡眠数据返回格式不正确，使用默认数据');
            // 保留默认UI状态
        }
        document.getElementById('sleep-loading').style.display = 'none';
    }, function(error) {
        console.error('获取睡眠数据失败:', error);
        document.getElementById('sleep-loading').style.display = 'none';
        // 错误时保留默认UI状态，不需要额外处理
    }, 'sleep-loading');
    
    // 5. 获取紧急联系人
    getRequest('/api/contacts', function(data) {
        if (data && data.success) {
            updateEmergencyContacts(data.data);
        } else {
            console.warn('获取紧急联系人返回格式不正确，使用默认数据');
            // 保留默认UI状态
        }
        document.getElementById('emergency-loading').style.display = 'none';
    }, function(error) {
        console.error('获取紧急联系人失败:', error);
        document.getElementById('emergency-loading').style.display = 'none';
        // 错误时保留默认UI状态，不需要额外处理
    }, 'emergency-loading');
}

// 更新状态面板
function updateStatusPanel(data) {
    if (!data) {
        console.warn('状态面板更新：数据为空，跳过更新');
        return;
    }
    
    try {
        // 更新状态图表
        if (window.statusChart) {
            const normalPercent = data.normalPercent || 70;
            window.statusChart.setOption({
                series: [{
                    data: [{
                        value: normalPercent,
                        name: normalPercent > 80 ? '正常' : normalPercent > 50 ? '警告' : '异常'
                    }],
                    progress: {
                        itemStyle: {
                            color: normalPercent > 80 ? '#4CAF50' : normalPercent > 50 ? '#FF9800' : '#F44336'
                        }
                    },
                    axisLine: {
                        lineStyle: {
                            color: [
                                [normalPercent/100, normalPercent > 80 ? '#4CAF50' : normalPercent > 50 ? '#FF9800' : '#F44336'],
                                [1, 'rgba(255, 255, 255, 0.1)']
                            ]
                        }
                    }
                }]
            });
        }
        
        // 状态指示器已从UI中移除，改为仅显示百分比图表
    } catch (error) {
        console.error('更新状态面板时出错:', error);
    }
}

// 更新中央面板
function updateCenterPanel(data) {
    if (!data) {
        console.warn('中央面板更新：数据为空，跳过更新');
        return;
    }
    
    try {
        // 更新中央数据
        if (data.seniorsOnline !== undefined) {
            document.getElementById('seniors-online').textContent = data.seniorsOnline;
        }
        if (data.devicesConnected !== undefined) {
            document.getElementById('devices-connected').textContent = data.devicesConnected;
        }
        if (data.abnormalEvents !== undefined) {
            document.getElementById('abnormal-events').textContent = data.abnormalEvents;
        }
        
        // 如果有系统状态信息，更新连接状态指示器
        if (data.systemStatus) {
            const connectionStatusEl = document.querySelector('.connection-status');
            if (connectionStatusEl) {
                let statusIcon = 'bi-wifi';
                let statusText = '系统运行中';
                
                if (data.systemStatus === 'error') {
                    statusIcon = 'bi-wifi-off';
                    statusText = '系统异常';
                } else if (data.systemStatus === 'warning') {
                    statusIcon = 'bi-exclamation-triangle';
                    statusText = '系统警告';
                }
                
                connectionStatusEl.innerHTML = `<i class="bi ${statusIcon}"></i> ${statusText}`;
            }
        }
    } catch (error) {
        console.error('更新中央面板时出错:', error);
    }
}

// 更新静坐时间面板
function updateSedentaryPanel(data) {
    if (!data) {
        console.warn('静坐时间面板更新：数据为空，跳过更新');
        return;
    }
    
    try {
        // 更新静坐时间图表
        if (window.sedentaryChart) {
            // 优先使用API返回的数据，如果没有则使用默认值
            const activityTime = data.activityTime || 30;
            const sedentaryTime = data.sedentaryTime || 70;
            
            window.sedentaryChart.setOption({
                series: [{
                    data: [
                        // 修改颜色以匹配UI
                        { value: activityTime, name: '活动', itemStyle: { color: '#4CAF50' } },
                        { value: sedentaryTime, name: '静坐', itemStyle: { color: '#FF6B6B' } }
                    ]
                }]
            });
        }
        
        // 更新今日静坐时间文本
        if (data.todaySedentaryTime) {
            document.getElementById('today-sedentary-time').textContent = data.todaySedentaryTime;
        }
    } catch (error) {
        console.error('更新静坐时间面板时出错:', error);
    }
}

// 更新睡眠面板
function updateSleepPanel(data) {
    if (!data) {
        console.warn('睡眠面板更新：数据为空，跳过更新');
        return;
    }
    
    try {
        // 更新睡眠图表
        if (window.sleepChart && data.weekData) {
            window.sleepChart.setOption({
                xAxis: {
                    data: data.weekData.days || ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
                },
                series: [
                    {
                        name: '深度睡眠',
                        data: data.weekData.deep || [3, 2.5, 3.5, 3, 2.5, 3, 3.5]
                    },
                    {
                        name: '浅度睡眠',
                        data: data.weekData.light || [4, 4, 4.5, 4, 3.5, 4.5, 4.5]
                    },
                    {
                        name: '清醒',
                        data: data.weekData.awake || [0.5, 1, 0.5, 0.5, 1, 0.5, 0.5]
                    }
                ]
            });
        }
        
        // 更新昨晚睡眠时长
        if (data.lastNightSleep) {
            document.getElementById('last-night-sleep').textContent = data.lastNightSleep;
        }
    } catch (error) {
        console.error('更新睡眠面板时出错:', error);
    }
}

// 更新紧急联系人
function updateEmergencyContacts(data) {
    if (!data || !Array.isArray(data) || data.length === 0) {
        console.warn('紧急联系人更新：数据为空或格式不正确，使用默认数据');
        // 使用默认数据
        data = [
            {
                id: '1',
                name: '张医生',
                relation: '社区医生',
                type: 'normal'
            },
            {
                id: '2',
                name: '李护士',
                relation: '值班护士',
                type: 'normal'
            },
            {
                id: '3',
                name: '急救中心',
                relation: '紧急情况',
                type: 'emergency'
            },
            {
                id: '4',
                name: '王阿姨',
                relation: '邻居',
                type: 'normal'
            },
            {
                id: '5',
                name: '刘叔叔',
                relation: '邻居',
                type: 'normal'
            }
        ];
    }
    
    try {
        const contactsListEl = document.getElementById('contacts-list');
        if (contactsListEl) {
            // 判断是否需要重新渲染
            // 如果从API获取到了数据，才进行全量替换
            if (data.length > 0 && data[0].id) {
                // 清空现有联系人，但保留加载指示器
                const loadingEl = document.getElementById('emergency-loading');
                contactsListEl.innerHTML = '';
                if (loadingEl) {
                    contactsListEl.appendChild(loadingEl);
                }
                
                // 添加新的联系人
                data.forEach(contact => {
                    const contactItem = document.createElement('div');
                    contactItem.className = 'contact-item';
                    
                    // 设置紧急按钮类型
                    const isEmergency = contact.isEmergency || contact.type === 'emergency';
                    const buttonClass = isEmergency ? 'btn-emergency' : 'btn-call';
                    const iconClass = isEmergency ? 'bi-telephone-fill' : 'bi-telephone';
                    
                    contactItem.innerHTML = `
                        <div class="contact-avatar">
                            <i class="bi bi-person-circle"></i>
                        </div>
                        <div class="contact-info">
                            <div class="contact-name">${contact.name}</div>
                            <div class="contact-relation">${contact.relation || contact.title || ''}</div>
                        </div>
                        <div class="contact-action">
                            <button class="btn ${buttonClass}" onclick="emergencyCall('${contact.id || ''}', '${contact.name}')">
                                <i class="bi ${iconClass}"></i>
                            </button>
                        </div>
                    `;
                    
                    contactsListEl.appendChild(contactItem);
                });
            } else {
                console.log('没有收到有效的联系人数据，保留现有联系人列表');
            }
        }
    } catch (error) {
        console.error('更新紧急联系人时出错:', error);
    }
}

// 初始化状况检测图表
function initStatusChart() {
    const chartDom = document.getElementById('status-chart');
    const myChart = echarts.init(chartDom);
    
    const option = {
        series: [{
            type: 'gauge',
            startAngle: 90,
            endAngle: -270,
            pointer: {
                show: false
            },
            progress: {
                show: true,
                overlap: false,
                roundCap: true,
                clip: false,
                itemStyle: {
                    color: '#2196F3'
                }
            },
            axisLine: {
                lineStyle: {
                    width: 20,
                    color: [
                        [0.3, '#F44336'],
                        [1, 'rgba(255, 255, 255, 0.1)']
                    ]
                }
            },
            splitLine: {
                show: false,
            },
            axisTick: {
                show: false
            },
            axisLabel: {
                show: false
            },
            title: {
                fontSize: 14,
                color: '#FFFFFF',
                offsetCenter: [0, '70%']
            },
            data: [{
                value: 70,
                name: '正常'
            }],
            detail: {
                width: 50,
                height: 14,
                fontSize: 24,
                color: '#FFFFFF',
                formatter: '{value}%',
                offsetCenter: [0, 0]
            }
        }]
    };
    
    myChart.setOption(option);
    
    // 保存图表实例以便后续更新
    window.statusChart = myChart;
    
    // 窗口大小变化时，重新调整图表尺寸
    window.addEventListener('resize', function() {
        myChart.resize();
    });
}

// 初始化静坐时间管控图表
function initSedentaryChart() {
    const chartDom = document.getElementById('sedentary-chart');
    const myChart = echarts.init(chartDom);
    
    const option = {
        tooltip: {
            trigger: 'item',
            formatter: '{b}: {c} ({d}%)'
        },
        series: [{
            name: '静坐时间',
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '50%'],
            avoidLabelOverlap: false,
            itemStyle: {
                borderRadius: 10,
                borderColor: 'rgba(0, 0, 0, 0.1)',
                borderWidth: 2
            },
            label: {
                show: false
            },
            labelLine: {
                show: false
            },
            data: [
                // 修改颜色以匹配UI
                { value: 30, name: '活动', itemStyle: { color: '#4CAF50' } },
                { value: 70, name: '静坐', itemStyle: { color: '#FF6B6B' } }
            ]
        }]
    };
    
    myChart.setOption(option);
    
    // 保存图表实例以便后续更新
    window.sedentaryChart = myChart;
    
    // 窗口大小变化时，重新调整图表尺寸
    window.addEventListener('resize', function() {
        myChart.resize();
    });
}

// 初始化睡眠时长检测图表
function initSleepChart() {
    const chartDom = document.getElementById('sleep-chart');
    const myChart = echarts.init(chartDom);
    
    const option = {
        tooltip: {
            trigger: 'axis',
            formatter: function(params) {
                let result = params[0].name + '<br/>';
                params.forEach(param => {
                    result += param.marker + ' ' + param.seriesName + ': ' + param.value + '小时<br/>';
                });
                return result;
            }
        },
        legend: {
            show: false
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '5%',
            top: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
            axisLine: {
                lineStyle: {
                    color: 'rgba(255, 255, 255, 0.3)'
                }
            },
            axisLabel: {
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: 10
            }
        },
        yAxis: {
            type: 'value',
            min: 0,
            max: 10,
            interval: 2,
            axisLine: {
                show: true,
                lineStyle: {
                    color: 'rgba(255, 255, 255, 0.3)'
                }
            },
            splitLine: {
                lineStyle: {
                    color: 'rgba(255, 255, 255, 0.1)'
                }
            },
            axisLabel: {
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: 10,
                formatter: '{value}h'
            }
        },
        series: [{
            name: '男主人',
            type: 'line',
            smooth: true,
            lineStyle: {
                width: 2,
                color: '#2196F3'
            },
            areaStyle: {
                opacity: 0.2,
                color: {
                    type: 'linear',
                    x: 0,
                    y: 0,
                    x2: 0,
                    y2: 1,
                    colorStops: [{
                        offset: 0,
                        color: 'rgba(33, 150, 243, 0.5)'
                    }, {
                        offset: 1,
                        color: 'rgba(33, 150, 243, 0.1)'
                    }]
                }
            },
            emphasis: {
                focus: 'series'
            },
            data: [7.0, 6.5, 7.2, 7.5, 6.8, 8.1, 7.6]
        }, {
            name: '女主人',
            type: 'line',
            smooth: true,
            lineStyle: {
                width: 2,
                color: '#9C27B0'
            },
            areaStyle: {
                opacity: 0.2,
                color: {
                    type: 'linear',
                    x: 0,
                    y: 0,
                    x2: 0,
                    y2: 1,
                    colorStops: [{
                        offset: 0,
                        color: 'rgba(156, 39, 176, 0.5)'
                    }, {
                        offset: 1,
                        color: 'rgba(156, 39, 176, 0.1)'
                    }]
                }
            },
            emphasis: {
                focus: 'series'
            },
            data: [8.2, 7.8, 7.5, 8.0, 7.2, 8.5, 8.1]
        }]
    };
    
    myChart.setOption(option);
    
    // 保存图表实例以便后续更新
    window.sleepChart = myChart;
    
    // 窗口大小变化时，重新调整图表尺寸
    window.addEventListener('resize', function() {
        myChart.resize();
    });
}

// 初始化中央地球/网络节点动画
function initGlobe() {
    const chartDom = document.getElementById('globe-container');
    const myChart = echarts.init(chartDom);
    
    // 生成一些随机网络节点和连接
    const nodes = [];
    const edges = [];
    const categories = ['设备', '老人', '医护', '家属'];
    
    // 生成节点数据
    for (let i = 0; i < 20; i++) {
        const category = Math.floor(Math.random() * categories.length);
        nodes.push({
            name: categories[category] + '_' + i,
            category: category,
            value: Math.random() * 20 + 20
        });
    }
    
    // 生成边数据
    for (let i = 0; i < nodes.length; i++) {
        const target = Math.floor(Math.random() * nodes.length);
        if (i !== target) {
            edges.push({
                source: i,
                target: target,
                value: Math.random()
            });
        }
    }
    
    const option = {
        tooltip: {},
        animationDurationUpdate: 1500,
        animationEasingUpdate: 'quinticInOut',
        series: [{
            type: 'graph',
            layout: 'force',
            force: {
                repulsion: 200,
                edgeLength: 80
            },
            roam: true,
            label: {
                show: false
            },
            emphasis: {
                lineStyle: {
                    width: 5
                }
            },
            data: nodes,
            links: edges,
            categories: categories.map(name => ({ name })),
            lineStyle: {
                opacity: 0.3,
                width: 1,
                curveness: 0.3,
                color: '#2196F3'
            },
            itemStyle: {
                borderColor: '#fff',
                borderWidth: 1,
                shadowBlur: 8,
                shadowColor: 'rgba(0, 0, 0, 0.3)'
            }
        }]
    };
    
    myChart.setOption(option);
    
    // 保存图表实例以便后续更新
    window.globeChart = myChart;
    
    // 窗口大小变化时，重新调整图表尺寸
    window.addEventListener('resize', function() {
        myChart.resize();
    });
}

// 使用随机数据更新图表
function updateChartsWithRandomData() {
    // 更新状况检测图表
    if (window.statusChart) {
        const normalValue = Math.floor(Math.random() * 30) + 70; // 70-100 之间的随机数
        window.statusChart.setOption({
            series: [{
                data: [{
                    value: normalValue,
                }]
            }]
        });
    }
    
    // 更新静坐时间管控图表
    if (window.sedentaryChart) {
        const abnormalValue = Math.floor(Math.random() * 40) + 10; // 10-50 之间的随机数
        const normalValue = 100 - abnormalValue;
        window.sedentaryChart.setOption({
            series: [{
                data: [
                    { value: abnormalValue, name: '异常' },
                    { value: normalValue, name: '正常' }
                ]
            }]
        });
    }
    
    // 更新睡眠时长检测图表
    if (window.sleepChart) {
        const maleData = Array(7).fill().map(() => (Math.random() * 2 + 6).toFixed(1)); // 6-8小时
        const femaleData = Array(7).fill().map(() => (Math.random() * 2 + 7).toFixed(1)); // 7-9小时
        window.sleepChart.setOption({
            series: [{
                data: maleData
            }, {
                data: femaleData
            }]
        });
    }
}

// 显示报警弹窗
function showAlertModal() {
    const alertModal = document.getElementById('alert-modal');
    if (alertModal) {
        // 更新报警时间为当前时间
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        
        const timeString = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        document.getElementById('alert-time').textContent = timeString;
        
        // 显示弹窗
        alertModal.style.display = 'flex';
        
        // 添加警报声音效果（实际项目中可添加）
        // playAlertSound();
    }
}

// 关闭报警弹窗
function dismissAlert() {
    const alertModal = document.getElementById('alert-modal');
    if (alertModal) {
        alertModal.style.display = 'none';
    }
}

// 确认并通知
function confirmAlert() {
    alert('已确认事件并通知紧急联系人');
    dismissAlert();
}

// 紧急呼叫
function emergencyCall() {
    alert('正在连接紧急呼叫...');
    // 实际项目中这里应该有呼叫功能的代码
    dismissAlert();
}