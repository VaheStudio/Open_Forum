// 通用工具函数 - 优化版

// 显示通知
function showNotification(message, type = 'success') {
    // 检查是否已有通知，避免重复
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    notification.style.display = 'flex';
    notification.style.alignItems = 'center';
    notification.style.gap = '10px';
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// 格式化日期 - 更友好的显示方式
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    
    // 超过一周则显示完整日期
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 获取文件图标类名
function getFileIcon(filename) {
    const extension = filename.split('.').pop().toLowerCase();
    switch(extension) {
        case 'pdf': return 'fa-file-pdf text-red-500';
        case 'doc':
        case 'docx': return 'fa-file-word text-blue-500';
        case 'xls':
        case 'xlsx': return 'fa-file-excel text-green-500';
        case 'ppt':
        case 'pptx': return 'fa-file-powerpoint text-orange-500';
        case 'txt': return 'fa-file-alt text-gray-400';
        case 'zip':
        case 'rar':
        case '7z': return 'fa-file-archive text-yellow-500';
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif': return 'fa-file-image text-purple-500';
        default: return 'fa-file';
    }
}

// 检查用户是否登录
function checkLogin() {
    return localStorage.getItem('currentUser') !== null;
}

// 重定向到登录页
function redirectToLogin() {
    // 如果已经在登录页，则不重定向
    if (window.location.pathname.includes('index.html') || 
        window.location.pathname.includes('register.html')) {
        return;
    }
    
    window.location.href = 'index.html';
}

// 获取当前用户
function getCurrentUser() {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
}

// 获取所有用户
function getAllUsers() {
    const usersData = localStorage.getItem('users') || '[]';
    return JSON.parse(usersData);
}

// 获取所有帖子
function getAllPosts() {
    const postsData = localStorage.getItem('messages') || '[]';
    return JSON.parse(postsData);
}

// 保存所有帖子
function saveAllPosts(posts) {
    localStorage.setItem('messages', JSON.stringify(posts));
}

// 初始化本地存储
function initLocalStorage() {
    if (!localStorage.getItem('users')) {
        // 添加默认管理员用户
        const defaultUsers = [{
            username: 'admin',
            password: 'admin123',
            joinedDate: new Date().toISOString(),
            storageUsed: 0,
            files: [],
            posts: []
        }];
        localStorage.setItem('users', JSON.stringify(defaultUsers));
    }
    if (!localStorage.getItem('messages')) {
        localStorage.setItem('messages', JSON.stringify([]));
    }
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    initLocalStorage();
    
    // 如果是需要登录的页面，检查登录状态
    const protectedPages = ['forum.html', 'profile.html'];
    const currentPage = window.location.pathname.split('/').pop();
    
    if (protectedPages.includes(currentPage)) {
        if (!checkLogin()) {
            showNotification('请先登录', 'error');
            setTimeout(redirectToLogin, 1000);
        }
    }
    
    // 添加页面加载动画
    document.body.style.opacity = "0";
    document.body.style.transition = "opacity 0.5s ease";
    
    window.addEventListener('load', function() {
        document.body.style.opacity = "1";
    });
});