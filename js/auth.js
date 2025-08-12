// 认证相关功能

document.addEventListener('DOMContentLoaded', function() {
    // 登录表单提交
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            const users = getAllUsers();
            const user = users.find(u => u.username === username && u.password === password);
            
            if (user) {
                localStorage.setItem('currentUser', JSON.stringify(user));
                showNotification('登录成功', 'success');
                setTimeout(() => {
                    window.location.href = 'forum.html';
                }, 1000);
            } else {
                showNotification('用户名或密码错误', 'error');
            }
        });
    }
    
    // 注册表单提交
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const username = document.getElementById('regUsername').value;
            const password = document.getElementById('regPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            if (password !== confirmPassword) {
                showNotification('两次输入的密码不一致', 'error');
                return;
            }
            
            const users = getAllUsers();
            if (users.some(u => u.username === username)) {
                showNotification('用户名已存在', 'error');
                return;
            }
            
            const newUser = {
                username,
                password,
                joinedDate: new Date().toISOString(),
                storageUsed: 0,
                files: [],
                posts: []
            };
            
            users.push(newUser);
            localStorage.setItem('users', JSON.stringify(users));
            localStorage.setItem('currentUser', JSON.stringify(newUser));
            
            showNotification('注册成功', 'success');
            setTimeout(() => {
                window.location.href = 'forum.html';
            }, 1000);
        });
    }
    
    // 退出登录
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('currentUser');
            showNotification('已退出登录', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        });
    }
    
    // 更改密码
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmNewPassword = document.getElementById('confirmNewPassword').value;
            
            if (newPassword !== confirmNewPassword) {
                showNotification('两次输入的新密码不一致', 'error');
                return;
            }
            
            const currentUser = getCurrentUser();
            if (!currentUser) {
                showNotification('请先登录', 'error');
                return;
            }
            
            if (currentUser.password !== currentPassword) {
                showNotification('当前密码错误', 'error');
                return;
            }
            
            const users = getAllUsers();
            const userIndex = users.findIndex(u => u.username === currentUser.username);
            
            if (userIndex !== -1) {
                users[userIndex].password = newPassword;
                localStorage.setItem('users', JSON.stringify(users));
                
                // 更新当前用户信息
                currentUser.password = newPassword;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                
                showNotification('密码修改成功', 'success');
                changePasswordForm.reset();
            }
        });
    }
});