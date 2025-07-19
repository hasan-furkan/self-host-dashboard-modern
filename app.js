document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    if (!auth.checkSession()) {
        return; // Will redirect to login
    }
    
    // Show username
    const usernameElement = document.getElementById('username');
    if (usernameElement) {
        usernameElement.textContent = auth.getCurrentUser() || 'User';
    }
    
    // Check for default password warning
    const authData = JSON.parse(localStorage.getItem('dashboardAuth') || '{}');
    if (authData.isDefaultPassword) {
        const warning = document.getElementById('defaultPasswordWarning');
        if (warning) {
            warning.classList.remove('hidden');
        }
    }
    
    // Session timer functionality
    let sessionTimerInterval;
    function updateSessionTimer() {
        const auth = JSON.parse(localStorage.getItem('dashboardAuth') || '{}');
        if (!auth.expires) return;
        
        const remainingTime = auth.expires - Date.now();
        if (remainingTime <= 0) {
            auth.logout();
            return;
        }
        
        const minutes = Math.floor(remainingTime / 60000);
        const seconds = Math.floor((remainingTime % 60000) / 1000);
        const timerElement = document.getElementById('sessionTimer');
        if (timerElement) {
            timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            // Change color based on time remaining
            if (minutes < 5) {
                timerElement.className = 'text-sm font-medium text-red-400';
            } else if (minutes < 10) {
                timerElement.className = 'text-sm font-medium text-yellow-400';
            } else {
                timerElement.className = 'text-sm font-medium text-green-400';
            }
        }
    }
    
    // Start session timer
    updateSessionTimer();
    sessionTimerInterval = setInterval(updateSessionTimer, 1000);
    const servicesGrid = document.getElementById('servicesGrid');
    const searchBar = document.getElementById('searchBar');
    const searchBtn = document.getElementById('searchBtn');
    const settingsModal = document.getElementById('settingsModal');
    const settingsBtn = document.getElementById('settingsBtn');
    const cancelSettings = document.getElementById('cancelSettings');
    const saveSettings = document.getElementById('saveSettings');
    const jsonFile = document.getElementById('jsonFile');
    const searchInput = document.getElementById('searchInput');

    // Default services data
    const defaultServices = [
        {
            "name": "Nextcloud",
            "icon": "fa-solid fa-cloud",
            "link": "https://nextcloud.example.com",
            "color": "from-blue-500 to-blue-600",
            "description": "File hosting & collaboration"
        },
        {
            "name": "Gitea",
            "icon": "fab fa-git-alt",
            "link": "https://gitea.example.com",
            "color": "from-green-500 to-green-600",
            "description": "Git repository hosting"
        },
        {
            "name": "Portainer",
            "icon": "fab fa-docker",
            "link": "https://portainer.example.com",
            "color": "from-cyan-500 to-cyan-600",
            "description": "Container management"
        },
    ];

    // Load services from localStorage or use default
    const savedServices = localStorage.getItem('dashboardServices');
    let services = savedServices ? JSON.parse(savedServices) : [...defaultServices];

    let filteredServices = [...services];

    // Function to save services to localStorage
    function saveServices() {
        localStorage.setItem('dashboardServices', JSON.stringify(services));
    }

    // Function to export services as JSON
    function exportServices() {
        const dataStr = JSON.stringify(services, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'dashboard-services.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // Function to reset to default services
    function resetToDefault() {
        if (confirm('Are you sure you want to reset all services to default? This will remove all your custom services.')) {
            services = [...defaultServices];
            saveServices();
            filteredServices = [...services];
            renderServices(services);
            settingsModal.classList.add('hidden');
        }
    }

    // Function to create card elements
    function createCard(service, index) {
        const cardWrapper = document.createElement('div');
        cardWrapper.className = 'service-card relative group';
        
        const card = document.createElement('a');
        card.href = service.link;
        card.target = '_blank';
        card.className = 'block bg-dark-surface hover:bg-dark-hover border border-gray-800 rounded-xl p-6 flex flex-col items-center transition-all duration-300 transform hover:scale-105 hover:border-gray-700';

        // Check if it's a touch device
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        // Edit button (left side)
        const editBtn = document.createElement('button');
        editBtn.className = 'absolute top-2 left-2 p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-white shadow-lg z-10';
        editBtn.innerHTML = '<i class="fas fa-edit text-sm"></i>';
        editBtn.title = 'Edit service';
        if (!isTouchDevice) {
            editBtn.style.opacity = '0';
            editBtn.style.transition = 'opacity 0.2s';
        }
        editBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            editService(index);
        };
        
        // Delete button (right side)
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-white shadow-lg z-10';
        deleteBtn.innerHTML = '<i class="fas fa-trash text-sm"></i>';
        deleteBtn.title = 'Delete service';
        if (!isTouchDevice) {
            deleteBtn.style.opacity = '0';
            deleteBtn.style.transition = 'opacity 0.2s';
        }
        deleteBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            deleteService(index);
        };
        
        // Add buttons to card wrapper
        cardWrapper.appendChild(editBtn);
        cardWrapper.appendChild(deleteBtn);
        
        // Only add hover listeners for non-touch devices
        if (!isTouchDevice) {
            cardWrapper.addEventListener('mouseenter', () => {
                editBtn.style.opacity = '1';
                deleteBtn.style.opacity = '1';
            });
            
            cardWrapper.addEventListener('mouseleave', () => {
                editBtn.style.opacity = '0';
                deleteBtn.style.opacity = '0';
            });
        }

        // Icon container with gradient background
        const iconContainer = document.createElement('div');
        iconContainer.className = `w-16 h-16 rounded-xl bg-gradient-to-br ${service.color || 'from-purple-500 to-blue-500'} flex items-center justify-center mb-4 group-hover:shadow-lg transition-shadow duration-300`;
        
        const icon = document.createElement('i');
        icon.className = service.icon + ' text-2xl text-white';
        iconContainer.appendChild(icon);
        card.appendChild(iconContainer);

        const name = document.createElement('h3');
        name.className = 'text-lg font-semibold mb-1';
        name.textContent = service.name;
        card.appendChild(name);

        if (service.description) {
            const description = document.createElement('p');
            description.className = 'text-sm text-gray-400';
            description.textContent = service.description;
            card.appendChild(description);
        }

        cardWrapper.appendChild(card);
        return cardWrapper;
    }

    // Function to render services
    function renderServices(servicesToRender) {
        servicesGrid.innerHTML = '';
        servicesToRender.forEach((service, index) => {
            // Find the actual index in the main services array
            const actualIndex = services.findIndex(s => s.name === service.name && s.link === service.link);
            const card = createCard(service, actualIndex);
            // Reset animation delay for filtered results
            card.style.animationDelay = `${index * 0.1}s`;
            servicesGrid.appendChild(card);
        });
    }

    // Initial render
    renderServices(services);

    // Search functionality
    function filterServices(searchTerm) {
        const term = searchTerm.toLowerCase();
        filteredServices = services.filter(service => 
            service.name.toLowerCase().includes(term) ||
            (service.description && service.description.toLowerCase().includes(term))
        );
        renderServices(filteredServices);
    }

    // Load JSON
    function loadJSON() {
        const fileReader = new FileReader();
        fileReader.onload = function(event) {
            try {
                services = JSON.parse(event.target.result);
                saveServices(); // Save imported services to localStorage
                filteredServices = [...services];
                renderServices(services);
                searchInput.value = '';
            } catch (error) {
                alert('Failed to load JSON. Please ensure the file is valid JSON format.');
            }
        };
        if (jsonFile.files.length > 0) {
            fileReader.readAsText(jsonFile.files[0]);
        }
    }

    // Function to open service modal
    function openServiceModal(service = null, index = null) {
        if (service && index !== null) {
            // Edit mode
            modalTitle.textContent = 'Edit Service';
            serviceName.value = service.name || '';
            serviceUrl.value = service.link || '';
            serviceDescription.value = service.description || '';
            serviceIcon.value = service.icon || 'fas fa-server';
            serviceColor.value = service.color || 'from-purple-500 to-blue-500';
            editIndex = index;
        } else {
            // Add mode
            modalTitle.textContent = 'Add Service';
            serviceName.value = '';
            serviceUrl.value = '';
            serviceDescription.value = '';
            serviceIcon.value = 'fas fa-server';
            serviceColor.value = 'from-purple-500 to-blue-500';
            editIndex = null;
        }
        serviceModal.classList.remove('hidden');
        serviceName.focus();
        updatePreview();
    }

    // Function to edit service
    function editService(index) {
        if (index >= 0 && index < services.length) {
            openServiceModal(services[index], index);
        }
    }

    // Function to delete service
    function deleteService(index) {
        deleteIndex = index;
        deleteModal.classList.remove('hidden');
    }

    // Function to update preview card
    function updatePreview() {
        const previewName = document.getElementById('previewName');
        const previewDescription = document.getElementById('previewDescription');
        const previewIcon = document.getElementById('previewIcon');
        const previewIconElement = document.getElementById('previewIconElement');
        
        // Update name
        previewName.textContent = serviceName.value || 'Service Name';
        
        // Update description
        previewDescription.textContent = serviceDescription.value || 'Brief description';
        
        // Update icon
        previewIconElement.className = (serviceIcon.value || 'fas fa-server') + ' text-2xl text-white';
        
        // Update color
        previewIcon.className = `w-16 h-16 rounded-xl bg-gradient-to-br ${serviceColor.value || 'from-purple-500 to-blue-500'} flex items-center justify-center mb-4`;
    }

    // Event listeners
    const addBtn = document.getElementById('addBtn');
    const serviceModal = document.getElementById('serviceModal');
    const cancelService = document.getElementById('cancelService');
    const serviceForm = document.getElementById('serviceForm');
    const modalTitle = document.getElementById('modalTitle');
    const serviceName = document.getElementById('serviceName');
    const serviceUrl = document.getElementById('serviceUrl');
    const serviceDescription = document.getElementById('serviceDescription');
    const serviceIcon = document.getElementById('serviceIcon');
    const serviceColor = document.getElementById('serviceColor');
    const deleteModal = document.getElementById('deleteModal');
    const cancelDelete = document.getElementById('cancelDelete');
    const confirmDelete = document.getElementById('confirmDelete');
    const exportBtn = document.getElementById('exportBtn');
    const resetBtn = document.getElementById('resetBtn');

    let editIndex = null;
    let deleteIndex = null;

    searchBtn.addEventListener('click', () => {
        searchBar.classList.toggle('hidden');
        if (!searchBar.classList.contains('hidden')) {
            searchInput.focus();
        }
    });

    searchInput.addEventListener('input', (e) => {
        filterServices(e.target.value);
    });

    settingsBtn.addEventListener('click', () => {
        settingsModal.classList.remove('hidden');
    });

    addBtn.addEventListener('click', () => {
        openServiceModal();
    });

    cancelService.addEventListener('click', () => {
        serviceModal.classList.add('hidden');
    });

    cancelDelete.addEventListener('click', () => {
        deleteModal.classList.add('hidden');
    });

    confirmDelete.addEventListener('click', () => {
        if (deleteIndex !== null) {
            services.splice(deleteIndex, 1);
            saveServices(); // Save to localStorage
            filteredServices = [...services];
            renderServices(filteredServices);
            deleteModal.classList.add('hidden');
        }
    });

    serviceForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newService = {
            name: serviceName.value.trim(),
            link: serviceUrl.value.trim(),
            description: serviceDescription.value.trim(),
            icon: serviceIcon.value.trim(),
            color: serviceColor.value
        };

        if (editIndex !== null) {
            // Update existing service
            services[editIndex] = newService;
            editIndex = null;
        } else {
            // Add new service
            services.push(newService);
        }

        saveServices(); // Save to localStorage
        filteredServices = [...services];
        renderServices(filteredServices);
        serviceModal.classList.add('hidden');
    });

    cancelSettings.addEventListener('click', () => {
        settingsModal.classList.add('hidden');
    });

    saveSettings.addEventListener('click', () => {
        loadJSON();
        settingsModal.classList.add('hidden');
    });

    // Add input event listeners for real-time preview
    serviceName.addEventListener('input', updatePreview);
    serviceDescription.addEventListener('input', updatePreview);
    serviceIcon.addEventListener('input', updatePreview);
    serviceColor.addEventListener('change', updatePreview);

    // Export and reset button listeners
    exportBtn.addEventListener('click', exportServices);
    resetBtn.addEventListener('click', resetToDefault);

    // Close modal on outside click
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.classList.add('hidden');
        }
    });

    serviceModal.addEventListener('click', (e) => {
        if (e.target === serviceModal) {
            serviceModal.classList.add('hidden');
        }
    });

    deleteModal.addEventListener('click', (e) => {
        if (e.target === deleteModal) {
            deleteModal.classList.add('hidden');
        }
    });

    // User menu functionality
    const userBtn = document.getElementById('userBtn');
    const userMenu = document.getElementById('userMenu');
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const passwordModal = document.getElementById('passwordModal');
    const passwordForm = document.getElementById('passwordForm');
    const cancelPassword = document.getElementById('cancelPassword');
    const changePasswordNow = document.getElementById('changePasswordNow');
    const logoutBtnMain = document.getElementById('logoutBtnMain');
    
    // Toggle user menu
    userBtn.addEventListener('click', () => {
        userMenu.classList.toggle('hidden');
    });
    
    // Close user menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!userBtn.contains(e.target) && !userMenu.contains(e.target)) {
            userMenu.classList.add('hidden');
        }
    });
    
    // Change password button
    changePasswordBtn.addEventListener('click', () => {
        userMenu.classList.add('hidden');
        passwordModal.classList.remove('hidden');
    });
    
    // Change password now button (from warning)
    if (changePasswordNow) {
        changePasswordNow.addEventListener('click', () => {
            passwordModal.classList.remove('hidden');
        });
    }
    
    // Logout buttons (both menu and main)
    logoutBtn.addEventListener('click', () => {
        if (sessionTimerInterval) clearInterval(sessionTimerInterval);
        auth.logout();
    });
    
    logoutBtnMain.addEventListener('click', () => {
        if (sessionTimerInterval) clearInterval(sessionTimerInterval);
        auth.logout();
    });
    
    // Cancel password change
    cancelPassword.addEventListener('click', () => {
        passwordModal.classList.add('hidden');
        passwordForm.reset();
        document.getElementById('passwordError').classList.add('hidden');
        document.getElementById('passwordSuccess').classList.add('hidden');
    });
    
    // Handle password form submission
    passwordForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        const errorDiv = document.getElementById('passwordError');
        const errorText = document.getElementById('passwordErrorText');
        const successDiv = document.getElementById('passwordSuccess');
        
        // Hide previous messages
        errorDiv.classList.add('hidden');
        successDiv.classList.add('hidden');
        
        // Validate passwords match
        if (newPassword !== confirmPassword) {
            errorText.textContent = 'New passwords do not match';
            errorDiv.classList.remove('hidden');
            return;
        }
        
        // Try to change password
        const result = auth.changePassword(currentPassword, newPassword);
        
        if (result.success) {
            successDiv.classList.remove('hidden');
            passwordForm.reset();
            
            // Hide default password warning if it exists
            const warning = document.getElementById('defaultPasswordWarning');
            if (warning) {
                warning.classList.add('hidden');
            }
            
            // Close modal after 2 seconds
            setTimeout(() => {
                passwordModal.classList.add('hidden');
                successDiv.classList.add('hidden');
            }, 2000);
        } else {
            errorText.textContent = result.message;
            errorDiv.classList.remove('hidden');
        }
    });
    
    // Password visibility toggles
    document.querySelectorAll('.togglePasswordBtn').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const input = document.getElementById(targetId);
            const icon = btn.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });
    
    // Close password modal on outside click
    passwordModal.addEventListener('click', (e) => {
        if (e.target === passwordModal) {
            passwordModal.classList.add('hidden');
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K for search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchBar.classList.toggle('hidden');
        if (!searchBar.classList.contains('hidden')) {
            searchInput.focus();
        }
    }
    // Escape to close search or modal
    if (e.key === 'Escape') {
        if (!settingsModal.classList.contains('hidden')) {
            settingsModal.classList.add('hidden');
        } else if (!passwordModal.classList.contains('hidden')) {
            passwordModal.classList.add('hidden');
        } else if (!searchBar.classList.contains('hidden')) {
            searchBar.classList.add('hidden');
            searchInput.value = '';
            renderServices(services);
        }
    }
});
});

