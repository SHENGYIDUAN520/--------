// DOM 元素加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 更新时间
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
    
    // 初始化图表
    initActivityChart();
    initSleepChart();
    initAnomalyChart();
    
    // 设置事件监听
    setupEventListeners();
    
    // 检查登录状态
    checkLoginStatus();
});

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

// 检查登录状态
function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (isLoggedIn !== 'true') {
        // 未登录，跳转到登录页
        window.location.href = 'login.html';
    }
}

// 设置事件监听器
function setupEventListeners() {
    // 查询按钮点击事件
    document.getElementById('btn-search').addEventListener('click', function() {
        searchData();
    });
    
    // 导出数据按钮点击事件
    document.getElementById('btn-export').addEventListener('click', function() {
        exportData();
    });
    
    // 生成报告按钮点击事件
    document.getElementById('btn-report').addEventListener('click', function() {
        generateReport();
    });
    
    // 分页按钮点击事件
    document.querySelectorAll('.pagination-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            handlePagination(this.getAttribute('data-page'));
        });
    });
    
    // 筛选条件变化时的事件
    document.getElementById('elderly-select').addEventListener('change', function() {
        // 老人变化时可以自动刷新数据
        // searchData();
    });
    
    document.getElementById('data-type').addEventListener('change', function() {
        // 数据类型变化时可以自动刷新数据
        // searchData();
    });
}

// 查询数据
function searchData() {
    const elderly = document.getElementById('elderly-select').value;
    const dateFrom = document.getElementById('date-from').value;
    const dateTo = document.getElementById('date-to').value;
    const dataType = document.getElementById('data-type').value;
    
    // 在实际项目中，这里应该向后端API发送请求获取数据
    // 这里使用模拟数据演示
    console.log('查询条件:', {
        elderly,
        dateFrom,
        dateTo,
        dataType
    });
    
    // 显示加载中状态
    document.getElementById('data-table-body').innerHTML = `
        <tr>
            <td colspan="6" class="text-center">数据加载中...</td>
        </tr>
    `;
    
    // 模拟API请求延迟
    setTimeout(() => {
        // 模拟数据加载完成
        populateTableWithMockData();
        
        // 更新图表数据
        updateChartsWithFilteredData();
    }, 500);
}

// 填充表格模拟数据
function populateTableWithMockData() {
    const mockData = [];
    
    // 生成随机数据
    for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        
        mockData.push({
            date: `${year}-${month}-${day}`,
            activity: (Math.random() * 1.5 + 2).toFixed(1),
            sleep: (Math.random() * 2 + 6).toFixed(1),
            sedentary: (Math.random() * 3 + 7).toFixed(1),
            alert: Math.floor(Math.random() * 2),
            score: Math.floor(Math.random() * 20 + 75)
        });
    }
    
    // 清空表格内容
    const tableBody = document.getElementById('data-table-body');
    tableBody.innerHTML = '';
    
    // 填充表格
    mockData.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.date}</td>
            <td>${item.activity}小时</td>
            <td>${item.sleep}小时</td>
            <td>${item.sedentary}小时</td>
            <td>${item.alert}</td>
            <td>${item.score}</td>
        `;
        tableBody.appendChild(row);
    });
}

// 导出数据
function exportData() {
    const elderly = document.getElementById('elderly-select').options[document.getElementById('elderly-select').selectedIndex].text;
    const dateFrom = document.getElementById('date-from').value;
    const dateTo = document.getElementById('date-to').value;
    
    alert(`正在导出${elderly}从${dateFrom}到${dateTo}的数据...`);
    // 实际项目中应该通过后端API导出数据为CSV或Excel文件
}

// 生成报告
function generateReport() {
    const elderly = document.getElementById('elderly-select').options[document.getElementById('elderly-select').selectedIndex].text;
    const dateFrom = document.getElementById('date-from').value;
    const dateTo = document.getElementById('date-to').value;
    
    alert(`正在为${elderly}生成从${dateFrom}到${dateTo}的健康报告...`);
    // 实际项目中应该通过后端API生成PDF报告
}

// 处理分页
function handlePagination(action) {
    const currentPageEl = document.getElementById('current-page');
    const totalPagesEl = document.getElementById('total-pages');
    
    let currentPage = parseInt(currentPageEl.textContent);
    const totalPages = parseInt(totalPagesEl.textContent);
    
    if (action === 'prev' && currentPage > 1) {
        currentPageEl.textContent = --currentPage;
    } else if (action === 'next' && currentPage < totalPages) {
        currentPageEl.textContent = ++currentPage;
    }
    
    // 在实际项目中，这里应该重新请求后端API加载对应页码的数据
    // 这里仅更新页码和重新生成模拟数据
    populateTableWithMockData();
}

// 初始化活动时长对比图表
function initActivityChart() {
    const chartDom = document.querySelector('#activity-chart .chart-box');
    const myChart = echarts.init(chartDom);
    
    const option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            }
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: ['4-12', '4-13', '4-14', '4-15', '4-16', '4-17', '4-18'],
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
            name: '小时',
            axisLine: {
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
                fontSize: 10
            }
        },
        series: [
            {
                name: '活动时长',
                type: 'bar',
                barWidth: '60%',
                data: [2.4, 2.6, 3.1, 2.2, 2.8, 3.0, 2.5],
                itemStyle: {
                    color: '#2196F3'
                }
            }
        ]
    };
    
    myChart.setOption(option);
    
    // 保存图表实例以便后续更新
    window.activityChart = myChart;
    
    // 窗口大小变化时，重新调整图表尺寸
    window.addEventListener('resize', function() {
        myChart.resize();
    });
}

// 初始化睡眠质量趋势图表
function initSleepChart() {
    const chartDom = document.querySelector('#sleep-chart .chart-box');
    const myChart = echarts.init(chartDom);
    
    const option = {
        tooltip: {
            trigger: 'axis'
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: ['4-12', '4-13', '4-14', '4-15', '4-16', '4-17', '4-18'],
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
            name: '小时',
            axisLine: {
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
                fontSize: 10
            }
        },
        series: [
            {
                name: '睡眠时长',
                type: 'line',
                data: [7.1, 8.0, 7.7, 6.5, 7.5, 6.8, 7.2],
                smooth: true,
                itemStyle: {
                    color: '#9C27B0'
                },
                areaStyle: {
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
                            color: 'rgba(156, 39, 176, 0)'
                        }]
                    }
                }
            }
        ]
    };
    
    myChart.setOption(option);
    
    // 保存图表实例以便后续更新
    window.sleepChart = myChart;
    
    // 窗口大小变化时，重新调整图表尺寸
    window.addEventListener('resize', function() {
        myChart.resize();
    });
}

// 初始化异常事件分布图表
function initAnomalyChart() {
    const chartDom = document.querySelector('#anomaly-chart .chart-box');
    const myChart = echarts.init(chartDom);
    
    // 生成模拟热力图数据
    const hours = ['0时', '1时', '2时', '3时', '4时', '5时', '6时', '7时', '8时', '9时', '10时', '11时', '12时', '13时', '14时', '15时', '16时', '17时', '18时', '19时', '20时', '21时', '22时', '23时'];
    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    
    const data = [];
    for (let i = 0; i < days.length; i++) {
        for (let j = 0; j < hours.length; j++) {
            // 大多数时间没有异常，所以生成较多的0
            const value = Math.random() > 0.85 ? Math.floor(Math.random() * 3) + 1 : 0;
            data.push([j, i, value]);
        }
    }
    
    const option = {
        tooltip: {
            position: 'top',
            formatter: function(params) {
                return `${days[params.value[1]]} ${hours[params.value[0]]}<br/>异常事件数: ${params.value[2]}`;
            }
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '12%',
            top: '10%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: hours,
            splitArea: {
                show: true
            },
            axisLine: {
                lineStyle: {
                    color: 'rgba(255, 255, 255, 0.3)'
                }
            },
            axisLabel: {
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: 10,
                interval: 3
            }
        },
        yAxis: {
            type: 'category',
            data: days,
            splitArea: {
                show: true
            },
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
        visualMap: {
            min: 0,
            max: 3,
            calculable: true,
            orient: 'horizontal',
            left: 'center',
            bottom: '0%',
            textStyle: {
                color: 'rgba(255, 255, 255, 0.7)'
            },
            inRange: {
                color: ['#313695', '#4575b4', '#74add1', '#f46d43', '#d73027', '#a50026']
            }
        },
        series: [{
            name: '异常事件',
            type: 'heatmap',
            data: data,
            label: {
                show: false
            },
            emphasis: {
                itemStyle: {
                    shadowBlur: 10,
                    shadowColor: 'rgba(0, 0, 0, 0.5)'
                }
            }
        }]
    };
    
    myChart.setOption(option);
    
    // 保存图表实例以便后续更新
    window.anomalyChart = myChart;
    
    // 窗口大小变化时，重新调整图表尺寸
    window.addEventListener('resize', function() {
        myChart.resize();
    });
}

// 使用筛选后的数据更新图表
function updateChartsWithFilteredData() {
    // 在实际项目中，这里应该根据筛选条件获取的数据更新各个图表
    // 这里使用随机数据演示
    
    // 更新活动时长图表
    if (window.activityChart) {
        const activityData = Array(7).fill().map(() => (Math.random() * 1.5 + 2).toFixed(1));
        window.activityChart.setOption({
            series: [{
                data: activityData
            }]
        });
    }
    
    // 更新睡眠质量图表
    if (window.sleepChart) {
        const sleepData = Array(7).fill().map(() => (Math.random() * 2 + 6).toFixed(1));
        window.sleepChart.setOption({
            series: [{
                data: sleepData
            }]
        });
    }
    
    // 更新异常事件热力图
    if (window.anomalyChart) {
        const hours = ['0时', '1时', '2时', '3时', '4时', '5时', '6时', '7时', '8时', '9时', '10时', '11时', '12时', '13时', '14时', '15时', '16时', '17时', '18时', '19时', '20时', '21时', '22时', '23时'];
        const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
        
        const newData = [];
        for (let i = 0; i < days.length; i++) {
            for (let j = 0; j < hours.length; j++) {
                const value = Math.random() > 0.85 ? Math.floor(Math.random() * 3) + 1 : 0;
                newData.push([j, i, value]);
            }
        }
        
        window.anomalyChart.setOption({
            series: [{
                data: newData
            }]
        });
    }
} 