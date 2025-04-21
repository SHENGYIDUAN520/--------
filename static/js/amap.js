// 全局变量
let map = null;
let geolocation = null;
let placeSearch = null;
let nearbyHospitals = [];

// 初始化高德地图的回调函数
function initAMap() {
    console.log('开始初始化高德地图');
    mapLoaded = true; // 设置地图已加载标志
    clearTimeout(mapLoadTimeout); // 清除超时定时器
    
    try {
        // 创建地图实例，使用2D模式提高兼容性和加载速度
        map = new AMap.Map('amap-container', {
            zoom: 15,
            resizeEnable: true,
            viewMode: '2D', // 改为2D模式增强兼容性
            jogEnable: false // 禁用地图拖拽时的缓动效果，提高性能
        });
        
        // 添加工具条和比例尺
        map.plugin(['AMap.ToolBar', 'AMap.Scale'], function() {
            map.addControl(new AMap.ToolBar({
                position: 'RB'
            }));
            map.addControl(new AMap.Scale());
        });
        
        // 添加定位插件
        map.plugin('AMap.Geolocation', function() {
            geolocation = new AMap.Geolocation({
                enableHighAccuracy: true, // 使用高精度定位
                timeout: 10000, // 超时时间
                buttonPosition: 'RB', // 定位按钮位置
                buttonOffset: new AMap.Pixel(10, 20), // 定位按钮偏移
                zoomToAccuracy: true // 定位成功后是否自动调整地图视野
            });
            map.addControl(geolocation);
            
            try {
                // 开始定位
                geolocation.getCurrentPosition(function(status, result) {
                    if (status === 'complete') {
                        onLocationSuccess(result);
                    } else {
                        console.error('定位失败:', result);
                        // 定位失败通常原因：
                        // 1. 非HTTPS环境
                        // 2. 用户拒绝授权
                        // 3. 浏览器不支持定位功能
                        onLocationError(result);
                    }
                });
            } catch (locationError) {
                console.error('定位过程发生错误:', locationError);
                onLocationError({message: '定位过程发生错误'});
            }
        });
        
        // 添加POI搜索插件
        map.plugin('AMap.PlaceSearch', function() {
            placeSearch = new AMap.PlaceSearch({
                pageSize: 5,
                pageIndex: 1,
                extensions: 'all'
            });
        });
        
        console.log('高德地图初始化成功');
    } catch (error) {
        console.error('地图初始化失败:', error);
        handleMapLoadError();
    }
}

// 定位成功回调
function onLocationSuccess(result) {
    console.log('定位成功:', result);
    
    const position = result.position;
    // 在地图上添加当前位置标记
    addUserMarker(position);
    
    // 搜索附近医疗设施
    searchNearbyHospitals(position);
}

// 定位失败回调
function onLocationError(result) {
    console.error('定位失败:', result);
    
    // 使用默认位置（昆明理工大学）
    const defaultPosition = [102.853568, 24.823734]; // 昆明理工大学坐标
    
    try {
        map.setCenter(defaultPosition);
        
        // 在地图上添加默认位置标记
        addUserMarker(defaultPosition);
        
        // 搜索附近医疗设施
        searchNearbyHospitals(defaultPosition);
    } catch (error) {
        console.error('设置默认位置时出错:', error);
        updateDefaultHospitalInfo();
    }
}

// 添加用户位置标记
function addUserMarker(position) {
    try {
        new AMap.Marker({
            position: position,
            map: map,
            icon: new AMap.Icon({
                size: new AMap.Size(32, 32),
                image: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png'
            }),
            title: '当前位置'
        });
    } catch (error) {
        console.error('添加位置标记失败:', error);
    }
}

// 搜索附近医疗设施
function searchNearbyHospitals(position) {
    if (!placeSearch) {
        console.error('搜索插件未初始化');
        updateDefaultHospitalInfo();
        return;
    }
    
    try {
        placeSearch.searchNearBy('医院', position, 3000, function(status, result) {
            if (status === 'complete' && result.info === 'OK') {
                handleSearchResult(result);
            } else {
                console.error('搜索医疗设施失败:', result);
                // 安全码错误或网络问题，使用默认医院信息
                updateDefaultHospitalInfo();
            }
        });
    } catch (error) {
        console.error('搜索医疗设施时发生错误:', error);
        updateDefaultHospitalInfo();
    }
}

// 处理搜索结果
function handleSearchResult(result) {
    try {
        const pois = result.poiList.pois;
        nearbyHospitals = pois;
        
        if (pois && pois.length > 0) {
            // 更新最近医疗设施信息
            updateNearestHospitalInfo(pois[0]);
            
            // 在地图上添加医院标记
            addHospitalMarkers(pois);
        } else {
            updateDefaultHospitalInfo();
        }
    } catch (error) {
        console.error('处理搜索结果时出错:', error);
        updateDefaultHospitalInfo();
    }
}

// 添加医院标记到地图
function addHospitalMarkers(hospitals) {
    try {
        hospitals.forEach(hospital => {
            new AMap.Marker({
                position: [hospital.location.lng, hospital.location.lat],
                map: map,
                icon: new AMap.Icon({
                    size: new AMap.Size(32, 32),
                    image: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_r.png'
                }),
                title: hospital.name
            });
        });
    } catch (error) {
        console.error('添加医院标记时出错:', error);
    }
}

// 更新最近医疗设施信息
function updateNearestHospitalInfo(hospital) {
    const nearestHospitalElement = document.querySelector('.nearest-hospital');
    if (nearestHospitalElement) {
        nearestHospitalElement.innerHTML = `
            <h4>最近医疗设施</h4>
            <div class="nearest-info">
                <div class="hospital-name">
                    <i class="bi bi-hospital"></i>${hospital.name}
                </div>
                <div class="hospital-address">
                    <i class="bi bi-geo-alt"></i>${hospital.address}
                </div>
                <div class="hospital-distance">
                    <i class="bi bi-signpost-2"></i>${hospital.distance}米
                </div>
            </div>
        `;
    }
}

// 更新默认医院信息
function updateDefaultHospitalInfo() {
    const nearestHospitalElement = document.querySelector('.nearest-hospital');
    if (nearestHospitalElement) {
        nearestHospitalElement.innerHTML = `
            <h4>最近医疗设施</h4>
            <div class="nearest-info">
                <div class="hospital-name">
                    <i class="bi bi-hospital"></i>昆明医科大学第一附属医院
                </div>
                <div class="hospital-address">
                    <i class="bi bi-geo-alt"></i>云南省昆明市西昌路295号
                </div>
                <div class="hospital-distance">
                    <i class="bi bi-signpost-2"></i>2000米
                </div>
            </div>
        `;
    }
}

// 销毁地图资源的函数
window.destroyMap = function() {
    if (map) {
        map.destroy();
        map = null;
    }
    geolocation = null;
    placeSearch = null;
    nearbyHospitals = [];
    console.log('地图资源已清理');
}; 