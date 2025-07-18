// Authentication module with security features
(function() {
    'use strict';
    
    // Configuration
    const AUTH_KEY = 'dashboardAuth';
    const USER_KEY = 'dashboardUser';
    const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes
    
    // Default admin credentials (should be changed on first login)
    const DEFAULT_CREDENTIALS = {
        username: 'admin',
        passwordHash: hashPassword('admin')
    };
    
    // Simple hash function (in production, use bcrypt or similar)
    function hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(16);
    }
    
    // Generate session token
    function generateToken() {
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
    }
    
    // Check if user is authenticated
    function isAuthenticated() {
        const auth = localStorage.getItem(AUTH_KEY);
        if (!auth) return false;
        
        try {
            const authData = JSON.parse(auth);
            if (Date.now() > authData.expires) {
                localStorage.removeItem(AUTH_KEY);
                return false;
            }
            return true;
        } catch (e) {
            return false;
        }
    }
    
    // Get current user
    function getCurrentUser() {
        const auth = localStorage.getItem(AUTH_KEY);
        if (!auth) return null;
        
        try {
            const authData = JSON.parse(auth);
            return authData.user;
        } catch (e) {
            return null;
        }
    }
    
    // Login function
    function login(username, password) {
        // Get stored user data or use default
        const storedUser = localStorage.getItem(USER_KEY);
        let userData = storedUser ? JSON.parse(storedUser) : DEFAULT_CREDENTIALS;
        
        // Check credentials
        if (username !== userData.username || hashPassword(password) !== userData.passwordHash) {
            return { success: false, message: 'Invalid username or password' };
        }
        
        // Create session
        const authData = {
            token: generateToken(),
            user: username,
            expires: Date.now() + SESSION_DURATION,
            isDefaultPassword: userData.passwordHash === DEFAULT_CREDENTIALS.passwordHash
        };
        
        localStorage.setItem(AUTH_KEY, JSON.stringify(authData));
        return { success: true, isDefaultPassword: authData.isDefaultPassword };
    }
    
    // Logout function
    function logout() {
        localStorage.removeItem(AUTH_KEY);
        window.location.href = 'login.html';
    }
    
    // Change password function
    function changePassword(currentPassword, newPassword) {
        const storedUser = localStorage.getItem(USER_KEY);
        let userData = storedUser ? JSON.parse(storedUser) : DEFAULT_CREDENTIALS;
        
        // Verify current password
        if (hashPassword(currentPassword) !== userData.passwordHash) {
            return { success: false, message: 'Current password is incorrect' };
        }
        
        // Password strength validation
        if (newPassword.length < 8) {
            return { success: false, message: 'Password must be at least 8 characters long' };
        }
        
        if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
            return { success: false, message: 'Password must contain uppercase, lowercase, and numbers' };
        }
        
        // Update password
        userData.passwordHash = hashPassword(newPassword);
        localStorage.setItem(USER_KEY, JSON.stringify(userData));
        
        // Update current session to remove default password flag
        const auth = JSON.parse(localStorage.getItem(AUTH_KEY));
        auth.isDefaultPassword = false;
        localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
        
        return { success: true, message: 'Password changed successfully' };
    }
    
    // Password visibility toggle
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            togglePassword.querySelector('i').classList.toggle('fa-eye');
            togglePassword.querySelector('i').classList.toggle('fa-eye-slash');
        });
    }
    
    // Show setup notice if first time
    if (!localStorage.getItem(USER_KEY)) {
        const setupNotice = document.getElementById('setupNotice');
        if (setupNotice) {
            setupNotice.classList.remove('hidden');
        }
    }
    
    // Handle login form submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const remember = document.getElementById('remember').checked;
            
            const result = login(username, password);
            
            if (result.success) {
                // If remember me is checked, set longer session
                if (remember) {
                    const auth = JSON.parse(localStorage.getItem(AUTH_KEY));
                    auth.expires = Date.now() + (2 * 60 * 60 * 1000); // 2 hours with remember me
                    localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
                }
                // Otherwise, default is 30 minutes
                
                // Redirect to dashboard
                window.location.href = 'index.html';
            } else {
                // Show error message
                const errorMessage = document.getElementById('errorMessage');
                const errorText = document.getElementById('errorText');
                errorText.textContent = result.message;
                errorMessage.classList.remove('hidden');
                
                // Hide error after 5 seconds
                setTimeout(() => {
                    errorMessage.classList.add('hidden');
                }, 5000);
            }
        });
    }
    
    // Export functions for use in other scripts
    window.auth = {
        isAuthenticated,
        getCurrentUser,
        logout,
        changePassword,
        checkSession: function() {
            if (!isAuthenticated()) {
                window.location.href = 'login.html';
                return false;
            }
            return true;
        }
    };
})();
