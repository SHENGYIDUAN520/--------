document.addEventListener('DOMContentLoaded', function() {
    // 更新当前时间
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
    
    // 标签页切换
    initTabSwitching();
    
    // 表单处理
    initForms();
    
    // 模态窗口处理
    initModals();
    
    // 列表处理
    initListActions();
});

// 更新当前时间
function updateCurrentTime() {
    const now = new Date();
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };
    document.getElementById('current-time').textContent = now.toLocaleDateString('zh-CN', options);
}

// 初始化标签页切换
function initTabSwitching() {
    const menuItems = document.querySelectorAll('.settings-menu-item');
    
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            // 移除所有活动状态
            menuItems.forEach(mi => mi.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
            
            // 添加当前选中的活动状态
            this.classList.add('active');
            const tabId = this.getAttribute('data-tab');
            document.getElementById(`${tabId}-tab`).classList.add('active');
            
            // 更新URL hash
            window.location.hash = tabId;
        });
    });
    
    // 检查URL hash并切换到对应标签
    const checkHash = () => {
        const hash = window.location.hash.substring(1);
        if (hash) {
            const targetMenuItem = document.querySelector(`.settings-menu-item[data-tab="${hash}"]`);
            if (targetMenuItem) {
                targetMenuItem.click();
            }
        }
    };
    
    // 页面加载和hash变化时检查
    checkHash();
    window.addEventListener('hashchange', checkHash);
}

// 初始化表单处理
function initForms() {
    // 个人信息表单提交
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            showToast('个人信息已更新', 'success');
        });
    }
    
    // 密码修改表单提交
    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
        passwordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            if (newPassword !== confirmPassword) {
                showToast('两次输入的密码不一致', 'error');
                return;
            }
            
            // 模拟密码强度检查
            const passwordStrength = checkPasswordStrength(newPassword);
            if (passwordStrength < 2) {
                showToast('密码强度不足，请包含字母和数字', 'warning');
                return;
            }
            
            showToast('密码已成功更新', 'success');
            this.reset();
        });
    }
    
    // 报警参数表单提交
    const alarmForm = document.getElementById('alarmForm');
    if (alarmForm) {
        alarmForm.addEventListener('submit', function(e) {
            e.preventDefault();
            showToast('报警参数设置已保存', 'success');
        });
    }
    
    // 数据设置表单提交
    const dataForm = document.getElementById('dataForm');
    if (dataForm) {
        dataForm.addEventListener('submit', function(e) {
            e.preventDefault();
            showToast('数据设置已保存', 'success');
        });
    }
}

// 检查密码强度 (0-弱, 1-中, 2-强)
function checkPasswordStrength(password) {
    if (password.length < 6) return 0;
    
    let strength = 0;
    if (/[a-zA-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 1;
    
    return Math.min(2, strength);
}

// 初始化模态窗口
function initModals() {
    // 打开模态窗口的按钮
    const modalTriggers = document.querySelectorAll('[data-modal]');
    modalTriggers.forEach(trigger => {
        trigger.addEventListener('click', function() {
            const modalId = this.getAttribute('data-modal');
            const modal = document.getElementById(modalId);
            
            if (modal) {
                openModal(modal);
                
                // 如果是编辑按钮，填充数据
                if (this.classList.contains('btn-edit')) {
                    const listItem = this.closest('.list-item');
                    if (listItem) {
                        populateModalForm(modal, listItem);
                    }
                }
            }
        });
    });
    
    // 关闭模态窗口的按钮
    const closeBtns = document.querySelectorAll('.close-btn, .modal-footer .btn-danger');
    closeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                closeModal(modal);
            }
        });
    });
    
    // 模态窗口提交按钮
    const submitBtns = document.querySelectorAll('.modal-footer .btn-primary');
    submitBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            const form = modal.querySelector('form');
            
            if (form && form.checkValidity()) {
                // 模拟表单提交
                const formId = form.id;
                
                if (formId === 'elderlyForm') {
                    saveElderlyData(form);
                } else if (formId === 'contactForm') {
                    saveContactData(form);
                }
                
                closeModal(modal);
            } else {
                // 触发浏览器原生表单验证
                form.reportValidity();
            }
        });
    });
    
    // 点击模态窗口外部关闭
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal(this);
            }
        });
    });
}

// 打开模态窗口
function openModal(modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // 防止背景滚动
    
    // 重置表单
    const form = modal.querySelector('form');
    if (form) {
        form.reset();
    }
    
    // 更新标题
    const isEdit = document.activeElement && document.activeElement.classList.contains('btn-edit');
    const header = modal.querySelector('.modal-header h2');
    if (header) {
        const modalId = modal.id;
        if (modalId === 'elderly-modal') {
            header.textContent = isEdit ? '编辑老人信息' : '添加老人';
        } else if (modalId === 'contact-modal') {
            header.textContent = isEdit ? '编辑联系人' : '添加联系人';
        }
    }
}

// 关闭模态窗口
function closeModal(modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// 填充模态窗口表单数据
function populateModalForm(modal, listItem) {
    const modalId = modal.id;
    const itemId = listItem.getAttribute('data-id');
    
    if (modalId === 'elderly-modal') {
        const title = listItem.querySelector('.item-title').textContent;
        const description = listItem.querySelector('.item-description').textContent;
        
        // 解析数据
        document.getElementById('elderlyId').value = itemId;
        document.getElementById('elderlyName').value = title;
        
        const ageMatch = description.match(/年龄：(\d+)/);
        if (ageMatch) {
            document.getElementById('elderlyAge').value = ageMatch[1];
        }
        
        const roomMatch = description.match(/房间：(\d+)/);
        if (roomMatch) {
            document.getElementById('elderlyRoom').value = roomMatch[1];
        }
    } else if (modalId === 'contact-modal') {
        const title = listItem.querySelector('.item-title').textContent;
        const description = listItem.querySelector('.item-description').textContent;
        
        // 解析数据
        document.getElementById('contactId').value = itemId;
        document.getElementById('contactName').value = title;
        
        const relationMatch = description.match(/关系：([^|]+)/);
        if (relationMatch) {
            document.getElementById('contactRelation').value = relationMatch[1].trim();
        }
        
        const phoneMatch = description.match(/电话：([^|]+)/);
        if (phoneMatch) {
            // 示例中使用了隐藏的电话号码，这里假设我们有完整的号码
            document.getElementById('contactPhone').value = '13900000000';
        }
    }
}

// 保存老人数据
function saveElderlyData(form) {
    const id = document.getElementById('elderlyId').value;
    const name = document.getElementById('elderlyName').value;
    const age = document.getElementById('elderlyAge').value;
    const room = document.getElementById('elderlyRoom').value;
    
    // 如果是编辑现有数据
    if (id) {
        const listItem = document.querySelector(`.list-item[data-id="${id}"]`);
        if (listItem) {
            listItem.querySelector('.item-title').textContent = name;
            listItem.querySelector('.item-description').textContent = `年龄：${age} | 房间：${room}`;
            showToast('老人信息已更新', 'success');
        }
    } else {
        // 添加新数据
        const newId = Date.now().toString();
        const elderlyList = document.querySelector('#elderly-tab .list-container');
        
        const newItem = document.createElement('div');
        newItem.className = 'list-item';
        newItem.setAttribute('data-id', newId);
        newItem.innerHTML = `
            <div class="item-info">
                <h4 class="item-title">${name}</h4>
                <p class="item-description">年龄：${age} | 房间：${room}</p>
            </div>
            <div class="item-actions">
                <button class="btn btn-primary btn-edit" data-modal="elderly-modal">
                    <i class="bi bi-pencil-square"></i> 编辑
                </button>
                <button class="btn btn-danger btn-delete">
                    <i class="bi bi-trash"></i> 删除
                </button>
            </div>
        `;
        
        elderlyList.appendChild(newItem);
        
        // 为新添加的按钮绑定事件
        bindListItemEvents(newItem);
        
        showToast('新老人信息已添加', 'success');
    }
}

// 保存联系人数据
function saveContactData(form) {
    const id = document.getElementById('contactId').value;
    const name = document.getElementById('contactName').value;
    const relation = document.getElementById('contactRelation').value;
    const phone = document.getElementById('contactPhone').value;
    
    // 隐藏部分电话号码
    const maskedPhone = phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
    
    // 如果是编辑现有数据
    if (id) {
        const listItem = document.querySelector(`.list-item[data-id="${id}"]`);
        if (listItem) {
            listItem.querySelector('.item-title').textContent = name;
            listItem.querySelector('.item-description').textContent = `关系：${relation} | 电话：${maskedPhone}`;
            showToast('联系人信息已更新', 'success');
        }
    } else {
        // 添加新数据
        const newId = Date.now().toString();
        const contactList = document.querySelector('#contact-tab .list-container');
        
        const newItem = document.createElement('div');
        newItem.className = 'list-item';
        newItem.setAttribute('data-id', newId);
        newItem.innerHTML = `
            <div class="item-info">
                <h4 class="item-title">${name}</h4>
                <p class="item-description">关系：${relation} | 电话：${maskedPhone}</p>
            </div>
            <div class="item-actions">
                <button class="btn btn-primary btn-edit" data-modal="contact-modal">
                    <i class="bi bi-pencil-square"></i> 编辑
                </button>
                <button class="btn btn-danger btn-delete">
                    <i class="bi bi-trash"></i> 删除
                </button>
            </div>
        `;
        
        contactList.appendChild(newItem);
        
        // 为新添加的按钮绑定事件
        bindListItemEvents(newItem);
        
        showToast('新联系人已添加', 'success');
    }
}

// 初始化列表操作
function initListActions() {
    // 为所有列表项绑定事件
    document.querySelectorAll('.list-item').forEach(item => {
        bindListItemEvents(item);
    });
    
    // 设备列表的特殊按钮
    document.querySelectorAll('.device-settings').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const deviceName = this.closest('.list-item').querySelector('.item-title').textContent;
            showToast(`正在配置设备：${deviceName}`, 'info');
        });
    });
    
    document.querySelectorAll('.device-disconnect').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const listItem = this.closest('.list-item');
            const deviceName = listItem.querySelector('.item-title').textContent;
            
            if (confirm(`确定要断开设备 ${deviceName} 吗？`)) {
                listItem.style.opacity = '0.5';
                showToast(`设备已断开连接：${deviceName}`, 'warning');
            }
        });
    });
    
    // 刷新设备按钮
    const scanDevicesBtn = document.getElementById('scanDevices');
    if (scanDevicesBtn) {
        scanDevicesBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showToast('正在扫描设备...', 'info');
            
            // 模拟扫描过程
            setTimeout(() => {
                showToast('设备扫描完成', 'success');
            }, 2000);
        });
    }
}

// 为列表项元素绑定事件
function bindListItemEvents(item) {
    // 删除按钮
    const deleteBtn = item.querySelector('.btn-delete');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const listItem = this.closest('.list-item');
            const name = listItem.querySelector('.item-title').textContent;
            
            if (confirm(`确定要删除 ${name} 吗？`)) {
                listItem.style.height = '0';
                listItem.style.opacity = '0';
                listItem.style.padding = '0';
                listItem.style.margin = '0';
                listItem.style.overflow = 'hidden';
                
                setTimeout(() => {
                    listItem.remove();
                }, 300);
                
                showToast(`${name} 已删除`, 'warning');
            }
        });
    }
    
    // 编辑按钮事件已在模态窗口初始化函数中处理
}

// 显示提示消息
function showToast(message, type = 'info') {
    // 创建toast容器（如果不存在）
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    // 创建toast元素
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    // 添加到容器
    toastContainer.appendChild(toast);
    
    // 显示动画
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // 自动关闭
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// 添加CSS样式
const toastCSS = `
.toast-container {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 9999;
}

.toast {
    padding: 12px 20px;
    margin-top: 10px;
    border-radius: 4px;
    color: white;
    transform: translateY(100px);
    opacity: 0;
    transition: all 0.3s;
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
    font-weight: 500;
}

.toast.show {
    transform: translateY(0);
    opacity: 1;
}

.toast.success {
    background-color: var(--success-color);
}

.toast.error {
    background-color: var(--danger-color);
}

.toast.warning {
    background-color: var(--warning-color);
    color: #333;
}

.toast.info {
    background-color: var(--primary-color);
}

.modal {
    display: none;
    position: fixed;
    z-index: 1000;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(3px);
}

.modal.active {
    display: flex;
    justify-content: center;
    align-items: center;
    animation: modalBackdropFadeIn 0.3s;
}

@keyframes modalBackdropFadeIn {
    from {
        background-color: rgba(0, 0, 0, 0);
        backdrop-filter: blur(0);
    }
    to {
        background-color: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(3px);
    }
}

.modal-content {
    background-color: white;
    width: 100%;
    max-width: 500px;
    border-radius: 8px;
    box-shadow: 0 5px 25px rgba(0, 0, 0, 0.25);
    animation: modalFadeIn 0.3s;
    overflow: hidden;
}

@keyframes modalFadeIn {
    from {
        opacity: 0;
        transform: translateY(-50px) scale(0.95);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

.modal-header {
    padding: 20px 25px;
    border-bottom: 1px solid #e8e8e8;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.modal-header h2 {
    margin: 0;
    font-size: 1.4rem;
    color: #333;
}

.close-btn {
    background: none;
    border: none;
    font-size: 1.8rem;
    cursor: pointer;
    color: #666;
    transition: all 0.2s;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 36px;
    height: 36px;
    border-radius: 50%;
}

.close-btn:hover {
    background-color: rgba(0, 0, 0, 0.1);
    color: #333;
}

.modal-body {
    padding: 25px;
}

.modal-footer {
    padding: 15px 25px;
    border-top: 1px solid #e8e8e8;
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}
`;

// 添加样式到页面
const styleElement = document.createElement('style');
styleElement.textContent = toastCSS;
document.head.appendChild(styleElement); 