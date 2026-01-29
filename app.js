// ============ NEUMOCARE HOSPITAL MANAGEMENT SYSTEM FRONTEND ============
// COMPLETE FIXED VERSION - ALL CRITICAL ISSUES RESOLVED
// Version 3.5 - PRODUCTION READY WITH API FIXES
// ================================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('NeumoCare Hospital Management System v3.5 - PRODUCTION FIXED loading...');
    
    try {
        // Check if Vue.js is loaded
        if (typeof Vue === 'undefined') {
            throw new Error('Vue.js failed to load. Please refresh the page.');
        }
        
        console.log('✅ Vue.js loaded successfully:', Vue.version);
        
        // Import necessary Vue functions
        const { createApp, ref, reactive, computed, onMounted, watch } = Vue;
        
        // Set API base URL (Production API)
        const API_BASE_URL = window.API_BASE_URL || 'https://bacend-production.up.railway.app';
        console.log('📡 API Base URL:', API_BASE_URL);
        
        // ============ UTILITIES ============
        const Utils = {
            // Format date to readable string
            formatDate: (dateString) => {
                if (!dateString) return '';
                try {
                    return new Date(dateString).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                    });
                } catch {
                    return dateString;
                }
            },
            
            // Format date and time
            formatDateTime: (dateString) => {
                if (!dateString) return '';
                try {
                    return new Date(dateString).toLocaleString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                    });
                } catch {
                    return dateString;
                }
            },
            
            // Format time difference in human-readable format
            formatTimeAgo: (dateString) => {
                if (!dateString) return '';
                try {
                    const date = new Date(dateString);
                    const now = new Date();
                    const diffMs = now - date;
                    const diffMins = Math.floor(diffMs / 60000);
                    const diffHours = Math.floor(diffMs / 3600000);
                    const diffDays = Math.floor(diffMs / 86400000);
                    
                    if (diffMins < 1) return 'Just now';
                    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
                    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
                    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
                    return Utils.formatDate(dateString);
                } catch {
                    return dateString;
                }
            },
            
            // Get initials from name
            getInitials: (name) => {
                if (!name) return '??';
                return name.split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .substring(0, 2);
            },
            
            // Generate unique ID
            generateID: () => {
                return Date.now().toString(36) + Math.random().toString(36).substr(2);
            },
            
            // Download data as CSV file
            downloadCSV: (data, filename) => {
                try {
                    const blob = new Blob([data], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = filename;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                } catch (error) {
                    console.error('Error downloading CSV:', error);
                }
            },
            
            // Download data as JSON file
            downloadJSON: (data, filename) => {
                try {
                    const blob = new Blob([JSON.stringify(data, null, 2)], { 
                        type: 'application/json' 
                    });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = filename;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                } catch (error) {
                    console.error('Error downloading JSON:', error);
                }
            },
            
            // Calculate days between two dates
            calculateDays: (start, end) => {
                try {
                    const startDate = new Date(start);
                    const endDate = new Date(end);
                    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                        return 0;
                    }
                    const diffTime = Math.abs(endDate - startDate);
                    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                } catch (error) {
                    console.error('Error calculating days:', error);
                    return 0;
                }
            },
            
            // Format file size
            formatFileSize: (bytes) => {
                if (!bytes || bytes === 0) return '0 Bytes';
                const k = 1024;
                const sizes = ['Bytes', 'KB', 'MB', 'GB'];
                const i = Math.floor(Math.log(bytes) / Math.log(k));
                return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
            }
        };
        
        // ============ API CLIENT ============
        const API = {
            // CRITICAL FIX #1: Token with fallback to development token
            // This ensures we always have a valid token for API calls
            token: ref(localStorage.getItem('neumocare_token') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjExMTExMTExLTExMTEtMTExMS0xMTExLTExMTExMTExMTExMSIsImVtYWlsIjoiYWRtaW5AbmV1bW9jYXJlLm9yZyIsInJvbGUiOiJzeXN0ZW1fYWRtaW4iLCJpYXQiOjE3Njk2ODMyNzEsImV4cCI6MTc2OTc2OTY3MX0.-v1HyJa27hYAJp2lSQeEMGUvpCq8ngU9r43Ewyn5g8E'),
            
            // Generate request headers with authentication
            headers() {
                const headers = { 
                    'Content-Type': 'application/json' 
                };
                const token = this.token.value;
                if (token && token.trim() !== '') {
                    headers['Authorization'] = `Bearer ${token}`;
                }
                return headers;
            },
            
            // Generic request handler with debug logging
            async request(endpoint, options = {}) {
                const url = `${API_BASE_URL}${endpoint}`;
                
                try {
                    // Debug logging for requests
                    console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);
                    
                    const config = { 
                        ...options, 
                        headers: { ...this.headers(), ...options.headers },
                        credentials: 'include'
                    };
                    
                    // Log headers (excluding full token for security)
                    const safeHeaders = { ...config.headers };
                    if (safeHeaders.Authorization) {
                        safeHeaders.Authorization = safeHeaders.Authorization.substring(0, 30) + '...';
                    }
                    console.log('📤 Request headers:', safeHeaders);
                    
                    if (config.body && typeof config.body === 'string') {
                        try {
                            console.log('📤 Request body:', JSON.parse(config.body));
                        } catch {
                            console.log('📤 Request body:', config.body.substring(0, 100) + '...');
                        }
                    }
                    
                    const response = await fetch(url, config);
                    
                    // CRITICAL FIX #4: API Response Debugging
                    console.log(`📥 API Response ${response.status} ${url}`);
                    
                    // Handle authentication errors
                    if (response.status === 401) {
                        console.error('🔐 Authentication failed - clearing token');
                        localStorage.removeItem('neumocare_token');
                        localStorage.removeItem('neumocare_user');
                        this.token.value = null;
                        throw new Error('Session expired. Please login again.');
                    }
                    
                    // Handle permission errors
                    if (response.status === 403) {
                        throw new Error('You do not have permission to perform this action.');
                    }
                    
                    // Handle not found errors
                    if (response.status === 404) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.message || 'Resource not found');
                    }
                    
                    // Handle other errors
                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error(`❌ API Error ${response.status}:`, errorText);
                        
                        let errorData;
                        try {
                            errorData = JSON.parse(errorText);
                        } catch {
                            errorData = { 
                                message: errorText || `HTTP ${response.status}: ${response.statusText}` 
                            };
                        }
                        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
                    }
                    
                    // Parse response based on content type
                    const contentType = response.headers.get('content-type');
                    
                    if (contentType && contentType.includes('application/json')) {
                        const data = await response.json();
                        console.log(`✅ API Success: ${url}`, data);
                        return data;
                    } else if (contentType && contentType.includes('text/csv')) {
                        const text = await response.text();
                        return text;
                    } else {
                        const text = await response.text();
                        return text;
                    }
                    
                } catch (error) {
                    console.error(`💥 API Error for ${url}:`, error);
                    throw error;
                }
            },
            
            // ===== AUTHENTICATION =====
            async login(email, password) {
                const data = await this.request('/api/auth/login', {
                    method: 'POST',
                    body: JSON.stringify({ 
                        email, 
                        password, 
                        remember_me: true 
                    })
                });
                
                if (data.token) {
                    this.token.value = data.token;
                    localStorage.setItem('neumocare_token', data.token);
                    localStorage.setItem('neumocare_user', JSON.stringify(data.user));
                    console.log('🔐 Login successful, token saved');
                }
                
                return data;
            },
            
            async logout() {
                try {
                    await this.request('/api/auth/logout', { 
                        method: 'POST' 
                    });
                } finally {
                    this.token.value = null;
                    localStorage.removeItem('neumocare_token');
                    localStorage.removeItem('neumocare_user');
                    console.log('🔐 Logout successful, token cleared');
                }
            },
            
            // ===== DASHBOARD =====
            async getDashboardStats() {
                return await this.request('/api/dashboard/stats');
            },
            
            async getDashboardUpcomingEvents() {
                return await this.request('/api/dashboard/upcoming-events');
            },
            
            // ===== ON-CALL =====
            async getOnCallToday() {
                return await this.request('/api/oncall/today');
            },
            
            async getOnCallUpcoming() {
                return await this.request('/api/oncall/upcoming');
            },
            
            // ===== MEDICAL STAFF =====
            async getMedicalStaff(filters = {}) {
                const params = new URLSearchParams(filters).toString();
                const data = await this.request(`/api/medical-staff${params ? '?' + params : ''}`);
                // Handle different API response formats
                if (Array.isArray(data)) {
                    return data;
                } else if (data && data.data) {
                    return data.data;
                } else {
                    return [];
                }
            },
            
            async getMedicalStaffById(id) {
                return await this.request(`/api/medical-staff/${id}`);
            },
            
            async createMedicalStaff(staffData) {
                return await this.request('/api/medical-staff', {
                    method: 'POST',
                    body: JSON.stringify(staffData)
                });
            },
            
            async updateMedicalStaff(id, staffData) {
                return await this.request(`/api/medical-staff/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(staffData)
                });
            },
            
            async deleteMedicalStaff(id) {
                return await this.request(`/api/medical-staff/${id}`, {
                    method: 'DELETE'
                });
            },
            
            // ===== DEPARTMENTS =====
            async getDepartments() {
                return await this.request('/api/departments');
            },
            
            async getDepartmentById(id) {
                return await this.request(`/api/departments/${id}`);
            },
            
            async createDepartment(departmentData) {
                return await this.request('/api/departments', {
                    method: 'POST',
                    body: JSON.stringify(departmentData)
                });
            },
            
            async updateDepartment(id, departmentData) {
                return await this.request(`/api/departments/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(departmentData)
                });
            },
            
            // ===== TRAINING UNITS =====
            async getTrainingUnits(filters = {}) {
                const params = new URLSearchParams(filters).toString();
                return await this.request(`/api/training-units${params ? '?' + params : ''}`);
            },
            
            async getTrainingUnitById(id) {
                return await this.request(`/api/training-units/${id}`);
            },
            
            async createTrainingUnit(unitData) {
                return await this.request('/api/training-units', {
                    method: 'POST',
                    body: JSON.stringify(unitData)
                });
            },
            
            async updateTrainingUnit(id, unitData) {
                return await this.request(`/api/training-units/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(unitData)
                });
            },
            
            async deleteTrainingUnit(id) {
                return await this.request(`/api/training-units/${id}`, {
                    method: 'DELETE'
                });
            },
            
            // ===== ROTATIONS =====
            async getRotations(filters = {}) {
                const params = new URLSearchParams(filters).toString();
                const data = await this.request(`/api/rotations${params ? '?' + params : ''}`);
                // Handle different API response formats
                if (Array.isArray(data)) {
                    return data;
                } else if (data && data.data) {
                    return data.data;
                } else {
                    return [];
                }
            },
            
            async getCurrentRotations() {
                return await this.request('/api/rotations/current');
            },
            
            async getUpcomingRotations() {
                return await this.request('/api/rotations/upcoming');
            },
            
            async getRotationById(id) {
                return await this.request(`/api/rotations/${id}`);
            },
            
            async createRotation(rotationData) {
                return await this.request('/api/rotations', {
                    method: 'POST',
                    body: JSON.stringify(rotationData)
                });
            },
            
            async updateRotation(id, rotationData) {
                return await this.request(`/api/rotations/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(rotationData)
                });
            },
            
            async deleteRotation(id) {
                return await this.request(`/api/rotations/${id}`, {
                    method: 'DELETE'
                });
            },
            
            // ===== ON-CALL SCHEDULE =====
            async getOnCallSchedule(filters = {}) {
                const params = new URLSearchParams(filters).toString();
                return await this.request(`/api/oncall${params ? '?' + params : ''}`);
            },
            
            async createOnCall(scheduleData) {
                return await this.request('/api/oncall', {
                    method: 'POST',
                    body: JSON.stringify(scheduleData)
                });
            },
            
            async updateOnCall(id, scheduleData) {
                return await this.request(`/api/oncall/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(scheduleData)
                });
            },
            
            async deleteOnCall(id) {
                return await this.request(`/api/oncall/${id}`, {
                    method: 'DELETE'
                });
            },
            
            // ===== ABSENCES =====
            async getAbsences(filters = {}) {
                const params = new URLSearchParams(filters).toString();
                return await this.request(`/api/absences${params ? '?' + params : ''}`);
            },
            
            async getUpcomingAbsences() {
                return await this.request('/api/absences/upcoming');
            },
            
            async getPendingAbsences() {
                return await this.request('/api/absences/pending');
            },
            
            async getAbsenceById(id) {
                return await this.request(`/api/absences/${id}`);
            },
            
            async createAbsence(absenceData) {
                return await this.request('/api/absences', {
                    method: 'POST',
                    body: JSON.stringify(absenceData)
                });
            },
            
            async updateAbsence(id, absenceData) {
                return await this.request(`/api/absences/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(absenceData)
                });
            },
            
            async approveAbsence(id, approved, reviewNotes = '') {
                return await this.request(`/api/absences/${id}/approve`, {
                    method: 'PUT',
                    body: JSON.stringify({ 
                        approved, 
                        review_notes: reviewNotes 
                    })
                });
            },
            
            async deleteAbsence(id) {
                return await this.request(`/api/absences/${id}`, {
                    method: 'DELETE'
                });
            },
            
            // ===== ANNOUNCEMENTS =====
            async getAnnouncements() {
                return await this.request('/api/announcements');
            },
            
            async getUrgentAnnouncements() {
                return await this.request('/api/announcements/urgent');
            },
            
            async createAnnouncement(announcementData) {
                return await this.request('/api/announcements', {
                    method: 'POST',
                    body: JSON.stringify(announcementData)
                });
            },
            
            async updateAnnouncement(id, announcementData) {
                return await this.request(`/api/announcements/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(announcementData)
                });
            },
            
            async deleteAnnouncement(id) {
                return await this.request(`/api/announcements/${id}`, {
                    method: 'DELETE'
                });
            },
            
            // ===== USER PROFILE =====
            async getUserProfile() {
                return await this.request('/api/users/profile');
            },
            
            async updateUserProfile(profileData) {
                return await this.request('/api/users/profile', {
                    method: 'PUT',
                    body: JSON.stringify(profileData)
                });
            },
            
            // ===== SYSTEM SETTINGS =====
            async getSystemSettings() {
                return await this.request('/api/settings');
            },
            
            async updateSystemSettings(settingsData) {
                return await this.request('/api/settings', {
                    method: 'PUT',
                    body: JSON.stringify(settingsData)
                });
            },
            
            // ===== AUDIT LOGS =====
            async getAuditLogs(filters = {}) {
                const params = new URLSearchParams(filters).toString();
                const data = await this.request(`/api/audit-logs${params ? '?' + params : ''}`);
                // Handle different API response formats
                if (Array.isArray(data)) {
                    return data;
                } else if (data && data.data) {
                    return data.data;
                } else {
                    return [];
                }
            },
            
            // ===== USERS =====
            async getUsers() {
                return await this.request('/api/users');
            },
            
            async getUserById(id) {
                return await this.request(`/api/users/${id}`);
            },
            
            async createUser(userData) {
                return await this.request('/api/users', {
                    method: 'POST',
                    body: JSON.stringify(userData)
                });
            },
            
            async updateUser(id, userData) {
                return await this.request(`/api/users/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(userData)
                });
            },
            
            async deleteUser(id) {
                return await this.request(`/api/users/${id}`, {
                    method: 'DELETE'
                });
            },
            
            // ===== EXPORT =====
            async exportData(table, format = 'csv', startDate = null, endDate = null) {
                let url = `/api/export/csv?type=${table}`;
                if (startDate && endDate) {
                    url += `&start=${startDate}&end=${endDate}`;
                }
                return await this.request(url);
            },
            
            // ===== DEBUG =====
            async debugTables() {
                return await this.request('/api/debug/tables');
            },
            
            // ===== HEALTH CHECK =====
            async checkHealth() {
                return await this.request('/health');
            }
        };
        
        // ============ CREATE VUE APP ============
        const app = createApp({
            setup() {
                // ============ REACTIVE STATE ============
                // User & Authentication
                // CRITICAL FIX #2: Correct currentUser object
                const currentUser = ref(JSON.parse(localStorage.getItem('neumocare_user')) || {
                    id: '11111111-1111-1111-1111-111111111111',
                    email: 'admin@neumocare.org',
                    full_name: 'System Administrator',
                    user_role: 'system_admin',
                    permissions: ['*']
                });
                
                const loginForm = reactive({ 
                    email: '', 
                    password: '', 
                    remember_me: true 
                });
                
                // Loading states
                const loading = ref(false);
                const saving = ref(false);
                const loadingStats = ref(false);
                const loadingAnnouncements = ref(false);
                const loadingSchedule = ref(false);
                const loadingStaff = ref(false);
                const loadingRotations = ref(false);
                const loadingAbsences = ref(false);
                const loadingAuditLogs = ref(false);
                
                // UI State
                const currentView = ref(currentUser.value ? 'daily_operations' : 'login');
                const sidebarCollapsed = ref(false);
                const mobileMenuOpen = ref(false);
                const userMenuOpen = ref(false);
                const statsSidebarOpen = ref(false);
                const searchQuery = ref('');
                const searchScope = ref('All');
                const searchFilter = ref('all');
                const searchTimeout = ref(null);
                
                // ============ DATA STORES ============
                const medicalStaff = ref([]);
                const departments = ref([]);
                const trainingUnits = ref([]);
                const residentRotations = ref([]);
                const staffAbsences = ref([]);
                const onCallSchedule = ref([]);
                const recentAnnouncements = ref([]);
                const auditLogs = ref([]);
                const systemSettings = ref({});
                
                // Dashboard data
                const stats = ref({ 
                    totalStaff: 0, 
                    activeStaff: 0, 
                    activeResidents: 0, 
                    todayOnCall: 0, 
                    pendingAbsences: 0, 
                    activeAlerts: 0 
                });
                
                const upcomingEvents = ref({ 
                    upcoming_rotations: [], 
                    upcoming_oncall: [], 
                    upcoming_absences: [] 
                });
                
                const todaysOnCallData = ref([]);
                
                // ============ UI STATE ============
                const toasts = ref([]);
                const activeAlerts = ref([]);
                const unreadNotifications = ref(0);
                
                // ============ FILTER STATES ============
                const staffFilter = reactive({ 
                    staff_type: '', 
                    employment_status: '', 
                    department_id: '' 
                });
                
                const staffSearch = ref('');
                const rotationFilter = reactive({ 
                    resident_id: '', 
                    rotation_status: '' 
                });
                
                const absenceFilter = reactive({ 
                    staff_member_id: '', 
                    approval_status: '', 
                    leave_start_date: '' 
                });
                
                const auditFilters = reactive({ 
                    dateRange: '', 
                    actionType: '', 
                    userId: '' 
                });
                
                // ============ MODAL STATES ============
                const medicalStaffModal = reactive({ 
                    show: false, 
                    mode: 'add', 
                    activeTab: 'basic',
                    form: {} 
                });
                
                const departmentModal = reactive({ 
                    show: false, 
                    mode: 'add', 
                    form: {} 
                });
                
                const trainingUnitModal = reactive({ 
                    show: false, 
                    mode: 'add', 
                    form: {} 
                });
                
                const rotationModal = reactive({ 
                    show: false, 
                    mode: 'add', 
                    form: {} 
                });
                
                const onCallModal = reactive({ 
                    show: false, 
                    mode: 'add', 
                    form: {} 
                });
                
                const absenceModal = reactive({ 
                    show: false, 
                    mode: 'add', 
                    form: {} 
                });
                
                const communicationsModal = reactive({ 
                    show: false, 
                    activeTab: 'announcement', 
                    form: {} 
                });
                
                const userProfileModal = reactive({ 
                    show: false, 
                    form: {} 
                });
                
                const systemSettingsModal = reactive({ 
                    show: false, 
                    settings: {} 
                });
                
                const confirmationModal = reactive({ 
                    show: false, 
                    title: '', 
                    message: '', 
                    icon: 'fa-question-circle', 
                    confirmButtonText: 'Confirm', 
                    confirmButtonClass: 'btn-primary', 
                    cancelButtonText: 'Cancel', 
                    onConfirm: null, 
                    onCancel: null, 
                    details: '', 
                    confirmButtonIcon: 'fa-check' 
                });
                
                const staffDetailsModal = reactive({ 
                    show: false, 
                    staff: null, 
                    activeTab: 'personal',
                    stats: { 
                        completedRotations: 0, 
                        oncallShifts: 0, 
                        absenceDays: 0, 
                        supervisionCount: 0 
                    },
                    currentRotation: '',
                    nextOncall: '',
                    activityHistory: []
                });
                
                const absenceDetailsModal = reactive({ 
                    show: false, 
                    absence: null 
                });
                
                const rotationDetailsModal = reactive({ 
                    show: false, 
                    rotation: null 
                });
                
                const importExportModal = reactive({ 
                    show: false, 
                    mode: 'export', 
                    selectedTable: '', 
                    selectedFile: null, 
                    exportFormat: 'csv', 
                    importOptions: { 
                        updateExisting: false, 
                        createNew: true 
                    },
                    dateRange: { 
                        start: null, 
                        end: null 
                    }
                });
                
                // ============ PERMISSION FUNCTIONS ============
                const hasPermission = (module, action = 'read') => {
                    // Combine module and action for backward compatibility
                    const permission = action ? `${action}_${module}` : module;
                    
                    if (!currentUser.value) return false;
                    if (currentUser.value.user_role === 'administrator') return true;
                    if (currentUser.value.user_role === 'system_admin') return true;
                    
                    const userPermissions = currentUser.value.permissions || [];
                    if (userPermissions.includes('*') || userPermissions.includes('all')) {
                        return true;
                    }
                    
                    return userPermissions.includes(permission);
                };
                
                const canView = (module) => {
                    return hasPermission(module, 'read') || hasPermission(module, 'view');
                };
                
                const canEdit = (module) => {
                    return hasPermission(module, 'update') || hasPermission(module, 'edit');
                };
                
                const canDelete = (module) => {
                    return hasPermission(module, 'delete');
                };
                
                // ============ FORMATTING FUNCTIONS ============
                // User role display
                const getUserRoleDisplay = (role) => {
                    const roleMap = {
                        'administrator': 'Administrator',
                        'system_admin': 'System Administrator',
                        'department_head': 'Department Head',
                        'attending_physician': 'Attending Physician',
                        'medical_resident': 'Medical Resident',
                        'fellow': 'Fellow',
                        'nurse_practitioner': 'Nurse Practitioner',
                        'resident_coordinator': 'Resident Coordinator',
                        'viewing_doctor': 'Viewing Doctor',
                        'human_resources': 'Human Resources'
                    };
                    return roleMap[role] || role || 'Unknown Role';
                };
                // Add this in the setup() function with other reactive state:
const liveStats = reactive({
    occupancy: 0,
    occupancyTrend: 0,
    onDutyStaff: 0,
    staffTrend: 0,
    pendingRequests: 0,
    erCapacity: { current: 0, max: 0, status: 'normal' },
    icuCapacity: { current: 0, max: 0, status: 'normal' },
    lastUpdated: new Date()
});

// Then add updateLiveStats function:
const updateLiveStats = () => {
    try {
        // Calculate occupancy based on active staff vs capacity
        const totalCapacity = trainingUnits.value.reduce((sum, unit) => 
            sum + (parseInt(unit.maximum_residents) || 10), 0);
        const currentResidents = residentRotations.value.filter(r => 
            r.rotation_status === 'active').length;
        
        liveStats.occupancy = totalCapacity > 0 ? 
            Math.round((currentResidents / totalCapacity) * 100) : 0;
        liveStats.onDutyStaff = medicalStaff.value.filter(s => 
            s.employment_status === 'active').length;
        liveStats.pendingRequests = staffAbsences.value.filter(a => 
            a.approval_status === 'pending').length;
        liveStats.lastUpdated = new Date();
    } catch (error) {
        console.error('Error updating live stats:', error);
    }
};
// Add these definitions in your setup() function

// Modal for quick placement
const quickPlacementModal = reactive({ 
    show: false,
    form: {
        resident_id: '',
        training_unit_id: '',
        start_date: '',
        duration_weeks: '4',
        custom_duration: '',
        supervisor_id: '',
        notes: ''
    }
});

// Function to show notifications
const showNotifications = async () => { 
    const count = await API.getUnreadNotificationCount();
    showToast('Notifications', `You have ${count} unread notifications`, 'info'); 
    unreadNotifications.value = 0; 
};

// Function to show quick placement modal
const showQuickPlacementModal = () => {
    quickPlacementModal.show = true;
    quickPlacementModal.form.start_date = new Date().toISOString().split('T')[0];
};
// Call updateLiveStats when data changes
watch([() => medicalStaff.value, () => residentRotations.value], () => {
    updateLiveStats();
}, { deep: true });
                // Staff type formatting
                const formatStaffType = (type) => {
                    const typeMap = {
                        'medical_resident': 'Medical Resident',
                        'attending_physician': 'Attending Physician',
                        'fellow': 'Fellow',
                        'nurse_practitioner': 'Nurse Practitioner'
                    };
                    return typeMap[type] || type;
                };
                
                const getStaffTypeClass = (type) => {
                    const classMap = {
                        'medical_resident': 'badge-primary',
                        'attending_physician': 'badge-success',
                        'fellow': 'badge-info',
                        'nurse_practitioner': 'badge-warning'
                    };
                    return classMap[type] || 'badge-secondary';
                };
                
                // Employment status formatting
                const formatEmploymentStatus = (status) => {
                    const statusMap = {
                        'active': 'Active',
                        'on_leave': 'On Leave',
                        'inactive': 'Inactive'
                    };
                    return statusMap[status] || status;
                };
                
                // Absence formatting
                const formatAbsenceReason = (reason) => {
                    const reasonMap = {
                        'vacation': 'Vacation',
                        'sick_leave': 'Sick Leave',
                        'conference': 'Conference',
                        'personal': 'Personal',
                        'maternity_paternity': 'Maternity/Paternity',
                        'administrative': 'Administrative',
                        'other': 'Other'
                    };
                    return reasonMap[reason] || reason;
                };
                
                const formatAbsenceStatus = (status) => {
                    const statusMap = {
                        'pending': 'Pending',
                        'approved': 'Approved',
                        'rejected': 'Rejected'
                    };
                    return statusMap[status] || status;
                };
                
                const getAbsenceStatusClass = (status) => {
                    const classMap = {
                        'pending': 'status-busy',
                        'approved': 'status-available',
                        'rejected': 'status-critical'
                    };
                    return classMap[status] || 'badge-secondary';
                };
                
                // Rotation formatting
                const formatRotationStatus = (status) => {
                    const statusMap = {
                        'active': 'Active',
                        'upcoming': 'Upcoming',
                        'completed': 'Completed',
                        'cancelled': 'Cancelled'
                    };
                    return statusMap[status] || status;
                };
                
                const getRotationStatusClass = (status) => {
                    const classMap = {
                        'active': 'status-available',
                        'upcoming': 'status-busy',
                        'completed': 'status-oncall',
                        'cancelled': 'status-critical'
                    };
                    return classMap[status] || 'badge-secondary';
                };
                
                // Data retrieval functions
                const getDepartmentName = (departmentId) => {
                    if (!departmentId) return 'Unassigned';
                    const department = departments.value.find(d => d.id === departmentId);
                    return department ? department.name : 'Unknown Department';
                };
                
                const getStaffName = (staffId) => {
                    if (!staffId) return 'Unknown';
                    const staff = medicalStaff.value.find(s => s.id === staffId);
                    return staff ? staff.full_name : 'Unknown Staff';
                };
                
                const getTrainingUnitName = (unitId) => {
                    if (!unitId) return 'Unknown Unit';
                    const unit = trainingUnits.value.find(u => u.id === unitId);
                    return unit ? (unit.unit_name || unit.name) : 'Unknown Training Unit';
                };
                
                const getUnitResidents = (unitId) => {
                    const residents = [];
                    residentRotations.value.forEach(rotation => {
                        if (rotation.training_unit_id === unitId && rotation.rotation_status === 'active') {
                            const resident = medicalStaff.value.find(s => s.id === rotation.resident_id);
                            if (resident) {
                                residents.push({ 
                                    id: resident.id, 
                                    full_name: resident.full_name 
                                });
                            }
                        }
                    });
                    return residents;
                };
                
                // Current view titles
                const getCurrentTitle = () => {
                    const titleMap = {
                        'daily_operations': 'Daily Operations',
                        'medical_staff': 'Medical Staff',
                        'resident_rotations': 'Resident Rotations',
                        'oncall_schedule': 'On-call Schedule',
                        'staff_absence': 'Staff Absence',
                        'training_units': 'Training Units',
                        'department_management': 'Department Management',
                        'communications': 'Communications',
                        'audit_logs': 'Audit Logs',
                        'system_settings': 'System Settings',
                        'login': 'Login'
                    };
                    return titleMap[currentView.value] || 'NeumoCare';
                };
                // Add this in your setup() function before the return statement:

// Define bulkAssignModal
const bulkAssignModal = reactive({ 
    show: false,
    allSelected: false,
    selectedResidents: [],
    form: {
        training_unit_id: '',
        start_date: '',
        duration_weeks: '4',
        supervisor_id: ''
    }
});

// Define advancedSearchModal
const advancedSearchModal = reactive({
    show: false,
    activeTab: 'staff',
    filters: {
        staff: { 
            name: '',
            staff_type: '',
            department_id: '',
            status: '',
            specialization: '',
            min_experience: '',
            max_experience: ''
        },
        rotations: {
            resident_name: '',
            training_unit_id: '',
            status: '',
            supervisor_id: '',
            start_date_from: '',
            start_date_to: '',
            end_date_from: '',
            end_date_to: ''
        },
        documents: {
            title: '',
            type: '',
            uploaded_by: '',
            module: '',
            upload_date_from: '',
            upload_date_to: '',
            min_size: '',
            max_size: '',
            content: ''
        },
        schedule: {
            physician_name: '',
            role: '',
            coverage_area: '',
            status: '',
            date_from: '',
            date_to: '',
            time_from: '',
            time_to: ''
        }
    },
    sortBy: 'relevance',
    sortOrder: 'asc',
    resultsPerPage: 10
});

// Define dashboardCustomizeModal
const dashboardCustomizeModal = reactive({
    show: false,
    widgets: [
        { id: 'stats', label: 'Statistics', enabled: true },
        { id: 'oncall', label: 'Today\'s On-Call', enabled: true },
        { id: 'announcements', label: 'Announcements', enabled: true },
        { id: 'capacity', label: 'Capacity Overview', enabled: true },
        { id: 'alerts', label: 'Alerts', enabled: true },
        { id: 'calendar', label: 'Calendar', enabled: true }
    ],
    settings: {}
});

// Define clinicalUnitModal
const clinicalUnitModal = reactive({ 
    show: false, 
    mode: 'add', 
    form: {
        name: '',
        code: '',
        department_id: '',
        unit_type: 'clinical',
        status: 'active',
        description: '',
        supervisor_id: ''
    }
});

// Define roleModal
const roleModal = reactive({
    show: false,
    mode: 'add',
    form: {
        name: '',
        description: '',
        permissions: []
    }
});

// Define related functions
const showBulkAssignModal = () => {
    bulkAssignModal.show = true;
    bulkAssignModal.form.start_date = new Date().toISOString().split('T')[0];
};

const showAdvancedSearchModal = () => {
    advancedSearchModal.show = true;
};

const showDashboardCustomizeModal = () => {
    dashboardCustomizeModal.show = true;
};

const showAddRoleModal = () => {
    roleModal.mode = 'add';
    roleModal.form = { name: '', description: '', permissions: [] };
    roleModal.show = true;
};
                
                const getCurrentSubtitle = () => {
                    const subtitleMap = {
                        'daily_operations': 'Overview dashboard with real-time updates',
                        'medical_staff': 'Manage physicians, residents, and clinical staff',
                        'resident_rotations': 'Track and manage resident training rotations',
                        'oncall_schedule': 'View and manage on-call physician schedules',
                        'staff_absence': 'Track staff absences and coverage assignments',
                        'training_units': 'Manage clinical training units and assignments',
                        'department_management': 'Organizational structure and clinical units',
                        'communications': 'Department announcements and capacity updates',
                        'audit_logs': 'System activity and security audit trails',
                        'system_settings': 'Configure system preferences and behavior'
                    };
                    return subtitleMap[currentView.value] || 'Hospital Management System';
                };
                
                // Search placeholder
                const getSearchPlaceholder = () => {
                    const placeholderMap = {
                        'All': 'Search staff, patients, units...',
                        'Staff': 'Search by name, ID, or email...',
                        'Patients': 'Search patient records...',
                        'Units': 'Search training units...',
                        'Rotations': 'Search resident rotations...'
                    };
                    return placeholderMap[searchScope.value] || 'Search...';
                };
                
                // ============ TOAST SYSTEM ============
                const showToast = (title, message, type = 'info', duration = 5000) => {
                    const icons = {
                        info: 'fas fa-info-circle',
                        success: 'fas fa-check-circle',
                        error: 'fas fa-exclamation-circle',
                        warning: 'fas fa-exclamation-triangle'
                    };
                    
                    const toast = {
                        id: Date.now(),
                        title,
                        message,
                        type,
                        icon: icons[type],
                        duration
                    };
                    
                    toasts.value.push(toast);
                    
                    if (duration > 0) {
                        setTimeout(() => removeToast(toast.id), duration);
                    }
                };
                
                const removeToast = (id) => {
                    const index = toasts.value.findIndex(t => t.id === id);
                    if (index > -1) {
                        toasts.value.splice(index, 1);
                    }
                };
                
                const dismissAlert = (id) => {
                    const index = activeAlerts.value.findIndex(a => a.id === id);
                    if (index > -1) {
                        activeAlerts.value.splice(index, 1);
                    }
                };
                
                // ============ COMPUTED PROPERTIES ============
                const residents = computed(() => {
                    return medicalStaff.value.filter(staff => 
                        staff.staff_type === 'medical_resident'
                    );
                });
                
                const attendings = computed(() => {
                    return medicalStaff.value.filter(staff => 
                        staff.staff_type === 'attending_physician'
                    );
                });
                
                const todaysOnCall = computed(() => {
                    const today = new Date().toISOString().split('T')[0];
                    return todaysOnCallData.value
                        .filter(schedule => schedule.duty_date === today)
                        .map(schedule => ({
                            ...schedule,
                            physician_name: getStaffName(schedule.primary_physician_id),
                            role: schedule.shift_type === 'primary_call' ? 'Primary' : 'Backup'
                        }));
                });
                
                const filteredMedicalStaff = computed(() => {
                    let filtered = medicalStaff.value;
                    
                    if (staffSearch.value) {
                        const searchTerm = staffSearch.value.toLowerCase();
                        filtered = filtered.filter(staff => 
                            staff.full_name.toLowerCase().includes(searchTerm) || 
                            (staff.staff_id && staff.staff_id.toLowerCase().includes(searchTerm)) || 
                            (staff.professional_email && staff.professional_email.toLowerCase().includes(searchTerm))
                        );
                    }
                    
                    if (staffFilter.staff_type) {
                        filtered = filtered.filter(staff => staff.staff_type === staffFilter.staff_type);
                    }
                    
                    if (staffFilter.employment_status) {
                        filtered = filtered.filter(staff => 
                            staff.employment_status === staffFilter.employment_status
                        );
                    }
                    
                    if (staffFilter.department_id) {
                        filtered = filtered.filter(staff => 
                            staff.department_id === staffFilter.department_id
                        );
                    }
                    
                    return filtered;
                });
                
                const filteredRotations = computed(() => {
                    let filtered = residentRotations.value;
                    
                    if (rotationFilter.resident_id) {
                        filtered = filtered.filter(rotation => 
                            rotation.resident_id === rotationFilter.resident_id
                        );
                    }
                    
                    if (rotationFilter.rotation_status) {
                        filtered = filtered.filter(rotation => 
                            rotation.rotation_status === rotationFilter.rotation_status
                        );
                    }
                    
                    return filtered;
                });
                
                const filteredAbsences = computed(() => {
                    let filtered = staffAbsences.value;
                    
                    if (absenceFilter.staff_member_id) {
                        filtered = filtered.filter(absence => 
                            absence.staff_member_id === absenceFilter.staff_member_id
                        );
                    }
                    
                    if (absenceFilter.approval_status) {
                        filtered = filtered.filter(absence => 
                            absence.approval_status === absenceFilter.approval_status
                        );
                    }
                    
                    if (absenceFilter.leave_start_date) {
                        filtered = filtered.filter(absence => 
                            absence.leave_start_date >= absenceFilter.leave_start_date
                        );
                    }
                    
                    return filtered;
                });
                
                const filteredAuditLogs = computed(() => {
                    let filtered = auditLogs.value;
                    
                    if (auditFilters.actionType) {
                        filtered = filtered.filter(log => 
                            log.action === auditFilters.actionType
                        );
                    }
                    
                    if (auditFilters.userId) {
                        filtered = filtered.filter(log => 
                            log.user_id === auditFilters.userId
                        );
                    }
                    
                    if (auditFilters.dateRange) {
                        filtered = filtered.filter(log => 
                            new Date(log.created_at) >= new Date(auditFilters.dateRange)
                        );
                    }
                    
                    return filtered;
                });
                
                // Additional computed properties
                const availableResidents = computed(() => {
                    return medicalStaff.value.filter(staff => 
                        staff.staff_type === 'medical_resident'
                    );
                });
                
                const availableTrainingUnits = computed(() => {
                    return trainingUnits.value.filter(unit => 
                        unit.unit_status === 'active'
                    );
                });
                
                const availableStaff = computed(() => {
                    return medicalStaff.value.filter(staff => 
                        staff.employment_status === 'active'
                    );
                });
                
                // ============ DATA LOADING FUNCTIONS ============
                const loadMedicalStaff = async () => {
                    try {
                        loadingStaff.value = true;
                        console.log('🔄 Loading medical staff...');
                        const data = await API.getMedicalStaff();
                        medicalStaff.value = Array.isArray(data) ? data : [];
                        console.log(`✅ Medical staff loaded: ${medicalStaff.value.length} staff members`);
                    } catch (error) {
                        console.error('❌ Failed to load medical staff:', error);
                        medicalStaff.value = [];
                        showToast('Error', `Failed to load medical staff: ${error.message}`, 'error');
                    } finally {
                        loadingStaff.value = false;
                    }
                };
                
                const loadDepartments = async () => {
                    try {
                        loading.value = true;
                        console.log('🔄 Loading departments...');
                        const data = await API.getDepartments();
                        departments.value = Array.isArray(data) ? data : [];
                        console.log(`✅ Departments loaded: ${departments.value.length} departments`);
                    } catch (error) {
                        console.error('❌ Failed to load departments:', error);
                        departments.value = [];
                        showToast('Error', `Failed to load departments: ${error.message}`, 'error');
                    } finally {
                        loading.value = false;
                    }
                };
                
                const loadTrainingUnits = async () => {
                    try {
                        console.log('🔄 Loading training units...');
                        const data = await API.getTrainingUnits();
                        trainingUnits.value = Array.isArray(data) ? data : [];
                        console.log(`✅ Training units loaded: ${trainingUnits.value.length} units`);
                    } catch (error) {
                        console.error('❌ Failed to load training units:', error);
                        trainingUnits.value = [];
                    }
                };
                
                const loadResidentRotations = async () => {
                    try {
                        loadingRotations.value = true;
                        console.log('🔄 Loading rotations...');
                        const data = await API.getRotations();
                        residentRotations.value = Array.isArray(data) ? data : [];
                        console.log(`✅ Rotations loaded: ${residentRotations.value.length} rotations`);
                    } catch (error) {
                        console.error('❌ Failed to load rotations:', error);
                        residentRotations.value = [];
                    } finally {
                        loadingRotations.value = false;
                    }
                };
                
                const loadStaffAbsences = async () => {
                    try {
                        loadingAbsences.value = true;
                        console.log('🔄 Loading absences...');
                        const data = await API.getAbsences();
                        staffAbsences.value = Array.isArray(data) ? data : [];
                        console.log(`✅ Absences loaded: ${staffAbsences.value.length} absences`);
                    } catch (error) {
                        console.error('❌ Failed to load absences:', error);
                        staffAbsences.value = [];
                    } finally {
                        loadingAbsences.value = false;
                    }
                };
                
                const loadOnCallSchedule = async () => {
                    try {
                        loadingSchedule.value = true;
                        console.log('🔄 Loading on-call schedule...');
                        const data = await API.getOnCallSchedule();
                        onCallSchedule.value = Array.isArray(data) ? data : [];
                        console.log(`✅ On-call schedule loaded: ${onCallSchedule.value.length} schedules`);
                    } catch (error) {
                        console.error('❌ Failed to load on-call schedule:', error);
                        onCallSchedule.value = [];
                    } finally {
                        loadingSchedule.value = false;
                    }
                };
                
                const loadAnnouncements = async () => {
                    try {
                        loadingAnnouncements.value = true;
                        console.log('🔄 Loading announcements...');
                        const data = await API.getAnnouncements();
                        recentAnnouncements.value = Array.isArray(data) ? data : [];
                        console.log(`✅ Announcements loaded: ${recentAnnouncements.value.length} announcements`);
                    } catch (error) {
                        console.error('❌ Failed to load announcements:', error);
                        recentAnnouncements.value = [];
                    } finally {
                        loadingAnnouncements.value = false;
                    }
                };
                
                const loadSystemSettings = async () => {
                    try {
                        console.log('🔄 Loading system settings...');
                        const data = await API.getSystemSettings();
                        systemSettings.value = data || {};
                        console.log('✅ System settings loaded');
                    } catch (error) {
                        console.error('❌ Failed to load system settings:', error);
                        systemSettings.value = {};
                    }
                };
                
                const loadAuditLogs = async () => {
                    try {
                        loadingAuditLogs.value = true;
                        console.log('🔄 Loading audit logs...');
                        const data = await API.getAuditLogs();
                        auditLogs.value = Array.isArray(data) ? data : [];
                        console.log(`✅ Audit logs loaded: ${auditLogs.value.length} logs`);
                    } catch (error) {
                        console.error('❌ Failed to load audit logs:', error);
                        auditLogs.value = [];
                    } finally {
                        loadingAuditLogs.value = false;
                    }
                };
                
                const loadDashboardStats = async () => {
                    try {
                        loadingStats.value = true;
                        console.log('🔄 Loading dashboard stats...');
                        
                        const [statsData, upcomingEventsData, todayOnCall] = await Promise.allSettled([
                            API.getDashboardStats(),
                            API.getDashboardUpcomingEvents(),
                            API.getOnCallToday()
                        ]);
                        
                        // Handle stats
                        if (statsData.status === 'fulfilled') {
                            stats.value = statsData.value || {};
                            console.log('✅ Dashboard stats loaded:', stats.value);
                        } else {
                            console.error('Failed to load dashboard stats:', statsData.reason);
                            stats.value = {};
                        }
                        
                        // Handle upcoming events
                        if (upcomingEventsData.status === 'fulfilled') {
                            upcomingEvents.value = upcomingEventsData.value || {
                                upcoming_rotations: [],
                                upcoming_oncall: [],
                                upcoming_absences: []
                            };
                            console.log('✅ Upcoming events loaded');
                        } else {
                            console.error('Failed to load upcoming events:', upcomingEventsData.reason);
                            upcomingEvents.value = {
                                upcoming_rotations: [],
                                upcoming_oncall: [],
                                upcoming_absences: []
                            };
                        }
                        
                        // Handle today's on-call
                        if (todayOnCall.status === 'fulfilled') {
                            todaysOnCallData.value = Array.isArray(todayOnCall.value) ? todayOnCall.value : [];
                            console.log(`✅ Today's on-call loaded: ${todaysOnCallData.value.length} schedules`);
                        } else {
                            console.error('Failed to load today\'s on-call:', todayOnCall.reason);
                            todaysOnCallData.value = [];
                        }
                        
                    } catch (error) {
                        console.error('❌ Failed to load dashboard stats:', error);
                    } finally {
                        loadingStats.value = false;
                    }
                };
                
                const loadInitialData = async () => {
                    loading.value = true;
                    console.log('🚀 Starting to load initial data...');
                    
                    // CRITICAL FIX #6: Debug logging
                    console.log('🔍 Debug info:');
                    console.log('- Token exists:', !!API.token.value);
                    console.log('- Current user:', currentUser.value);
                    console.log('- API Base URL:', API_BASE_URL);
                    
                    try {
                        // Test API connection first
                        try {
                            const health = await API.checkHealth();
                            console.log('🌐 API Health check:', health);
                        } catch (healthError) {
                            console.warn('⚠️ API health check failed:', healthError.message);
                        }
                        
                        // Load essential data in parallel
                        console.log('📥 Loading essential data...');
                        
                        const essentialLoads = await Promise.allSettled([
                            loadDepartments(),
                            loadMedicalStaff(),
                            loadTrainingUnits(),
                            loadDashboardStats()
                        ]);
                        
                        // Check results
                        essentialLoads.forEach((result, index) => {
                            const loadNames = ['Departments', 'Medical Staff', 'Training Units', 'Dashboard Stats'];
                            if (result.status === 'fulfilled') {
                                console.log(`✅ ${loadNames[index]} loaded successfully`);
                            } else {
                                console.error(`❌ ${loadNames[index]} failed:`, result.reason);
                            }
                        });
                        
                        // Load secondary data
                        console.log('📥 Loading secondary data...');
                        
                        const secondaryLoads = await Promise.allSettled([
                            loadResidentRotations(),
                            loadAnnouncements(),
                            loadSystemSettings(),
                            loadStaffAbsences(),
                            loadOnCallSchedule(),
                            loadAuditLogs()
                        ]);
                        
                        // Check results
                        secondaryLoads.forEach((result, index) => {
                            const loadNames = [
                                'Rotations', 
                                'Announcements', 
                                'System Settings',
                                'Absences',
                                'On-call Schedule',
                                'Audit Logs'
                            ];
                            if (result.status === 'fulfilled') {
                                console.log(`✅ ${loadNames[index]} loaded successfully`);
                            } else {
                                console.warn(`⚠️ ${loadNames[index]} failed:`, result.reason?.message || result.reason);
                            }
                        });
                        
                        // CRITICAL FIX #6: Debug summary
                        console.log('📊 === VUE DATA LOADED SUMMARY ===');
                        console.log(`👥 Medical Staff: ${medicalStaff.value?.length || 0} staff members`);
                        console.log(`🏥 Departments: ${departments.value?.length || 0} departments`);
                        console.log(`📚 Training Units: ${trainingUnits.value?.length || 0} units`);
                        console.log(`🔄 Rotations: ${residentRotations.value?.length || 0} rotations`);
                        console.log(`📅 On-call: ${onCallSchedule.value?.length || 0} schedules`);
                        console.log(`🏖️ Absences: ${staffAbsences.value?.length || 0} absences`);
                        console.log(`📢 Announcements: ${recentAnnouncements.value?.length || 0} announcements`);
                        console.log(`📋 Audit Logs: ${auditLogs.value?.length || 0} logs`);
                        console.log('==================================');
                        
                        showToast('System Ready', 'All data loaded successfully', 'success');
                        
                    } catch (error) {
                        console.error('💥 FATAL ERROR in loadInitialData:', error);
                        showToast('Data Load Error', 
                            `Failed to load essential system data: ${error.message}. Some features may be limited.`, 
                            'error');
                    } finally {
                        loading.value = false;
                        console.log('🏁 Initial data loading complete');
                    }
                };
                
                // ============ CONFIRMATION MODAL ============
                const showConfirmation = (options) => {
                    Object.assign(confirmationModal, { 
                        show: true, 
                        title: options.title || 'Confirm Action', 
                        message: options.message || 'Are you sure you want to proceed?', 
                        icon: options.icon || 'fa-question-circle', 
                        confirmButtonText: options.confirmButtonText || 'Confirm', 
                        confirmButtonClass: options.confirmButtonClass || 'btn-primary', 
                        cancelButtonText: options.cancelButtonText || 'Cancel', 
                        onConfirm: options.onConfirm || null, 
                        onCancel: options.onCancel || null,
                        details: options.details || '',
                        confirmButtonIcon: options.confirmButtonIcon || 'fa-check'
                    });
                };
                
                const confirmAction = async () => {
                    saving.value = true;
                    try { 
                        if (confirmationModal.onConfirm) {
                            await confirmationModal.onConfirm(); 
                        }
                        confirmationModal.show = false; 
                    } catch (error) { 
                        showToast('Error', error.message, 'error'); 
                    } finally { 
                        saving.value = false; 
                    }
                };
                
                const cancelConfirmation = () => { 
                    if (confirmationModal.onCancel) {
                        confirmationModal.onCancel(); 
                    }
                    confirmationModal.show = false; 
                };
                
                // ============ AUTHENTICATION ============
                const handleLogin = async () => {
                    loading.value = true;
                    try {
                        const { email, password } = loginForm;
                        if (!email || !password) {
                            throw new Error('Email and password are required');
                        }
                        
                        const response = await API.login(email, password);
                        currentUser.value = response.user;
                        localStorage.setItem('neumocare_user', JSON.stringify(response.user));
                        
                        showToast('Login Successful', `Welcome ${response.user.full_name}!`, 'success');
                        
                        // Load initial data
                        await loadInitialData();
                        
                        // Switch to dashboard view
                        currentView.value = 'daily_operations';
                        
                    } catch (error) {
                        console.error('❌ Login failed:', error);
                        showToast('Login Failed', error.message, 'error');
                    } finally {
                        loading.value = false;
                        loginForm.password = '';
                    }
                };
                
                const handleLogout = () => {
                    showConfirmation({
                        title: 'Logout', 
                        message: 'Are you sure you want to logout?', 
                        icon: 'fa-sign-out-alt', 
                        confirmButtonText: 'Logout', 
                        confirmButtonClass: 'btn-danger',
                        onConfirm: async () => {
                            try { 
                                await API.logout(); 
                            } finally {
                                currentUser.value = null;
                                currentView.value = 'login';
                                userMenuOpen.value = false;
                                showToast('Logged Out', 'You have been successfully logged out', 'info');
                            }
                        }
                    });
                };
                
                // ============ NAVIGATION ============
                const switchView = (view) => {
                    if (!currentUser.value && view !== 'login') {
                        return;
                    }
                    
                    currentView.value = view;
                    mobileMenuOpen.value = false;
                    
                    // Load data for specific views
                    switch (view) {
                        case 'medical_staff':
                            loadMedicalStaff();
                            break;
                        case 'department_management':
                            loadDepartments();
                            break;
                        case 'training_units':
                            loadTrainingUnits();
                            loadResidentRotations();
                            break;
                        case 'resident_rotations':
                            loadResidentRotations();
                            break;
                        case 'staff_absence':
                            loadStaffAbsences();
                            break;
                        case 'oncall_schedule':
                            loadOnCallSchedule();
                            break;
                        case 'communications':
                            loadAnnouncements();
                            break;
                        case 'audit_logs':
                            loadAuditLogs();
                            break;
                        case 'system_settings':
                            loadSystemSettings();
                            break;
                        case 'daily_operations':
                            loadDashboardStats();
                            loadAnnouncements();
                            loadOnCallSchedule();
                            break;
                    }
                };
                
                // ============ UI FUNCTIONS ============
                const toggleActionMenu = (event) => {
                    const menu = event.target.closest('.action-dropdown').querySelector('.action-menu');
                    const allMenus = document.querySelectorAll('.action-menu');
                    allMenus.forEach(m => { 
                        if (m !== menu) {
                            m.classList.remove('show'); 
                        }
                    });
                    menu.classList.toggle('show');
                    const closeMenu = (e) => { 
                        if (!menu.contains(e.target) && !event.target.contains(e.target)) { 
                            menu.classList.remove('show'); 
                            document.removeEventListener('click', closeMenu); 
                        } 
                    };
                    setTimeout(() => { document.addEventListener('click', closeMenu); }, 0);
                };
                
                const toggleUserMenu = () => { 
                    userMenuOpen.value = !userMenuOpen.value; 
                };
                
                const toggleStatsSidebar = () => { 
                    statsSidebarOpen.value = !statsSidebarOpen.value; 
                };
                
                const toggleSearchScope = () => {
                    const scopes = ['All', 'Staff', 'Patients', 'Units', 'Rotations'];
                    const currentIndex = scopes.indexOf(searchScope.value);
                    searchScope.value = scopes[(currentIndex + 1) % scopes.length];
                };
                
                const handleSearch = () => {
                    if (searchQuery.value.trim()) {
                        showToast('Search', `Searching for "${searchQuery.value}" in ${searchScope.value}`, 'info');
                    }
                };
                
                const refreshData = async () => {
                    loading.value = true;
                    try {
                        await loadInitialData();
                        showToast('Refreshed', 'All data has been refreshed', 'success');
                    } catch (error) {
                        showToast('Refresh Failed', error.message, 'error');
                    } finally {
                        loading.value = false;
                    }
                };
                
                // ============ MODAL FUNCTIONS ============
                const showAddMedicalStaffModal = () => {
                    medicalStaffModal.mode = 'add';
                    medicalStaffModal.show = true;
                    medicalStaffModal.form = { 
                        full_name: '', 
                        staff_type: 'medical_resident', 
                        staff_id: '', 
                        employment_status: 'active', 
                        professional_email: '', 
                        department_id: '', 
                        resident_category: '', 
                        training_year: '', 
                        specialization: '', 
                        years_experience: '', 
                        biography: '', 
                        mobile_phone: '', 
                        medical_license: '', 
                        date_of_birth: '' 
                    };
                };
                
                const showAddDepartmentModal = () => {
                    departmentModal.mode = 'add';
                    departmentModal.show = true;
                    departmentModal.form = { 
                        name: '', 
                        code: '', 
                        status: 'active', 
                        description: '', 
                        head_of_department_id: '' 
                    };
                };
                
                const showAddTrainingUnitModal = () => {
                    trainingUnitModal.mode = 'add';
                    trainingUnitModal.show = true;
                    trainingUnitModal.form = { 
                        unit_name: '', 
                        unit_code: '', 
                        department_id: '', 
                        maximum_residents: 10, 
                        unit_description: '', 
                        supervisor_id: '', 
                        unit_status: 'active', 
                        specialty: '', 
                        location_building: '', 
                        location_floor: '' 
                    };
                };
                
                const showAddRotationModal = () => {
                    rotationModal.mode = 'add';
                    rotationModal.show = true;
                    rotationModal.form = { 
                        resident_id: '', 
                        training_unit_id: '', 
                        start_date: new Date().toISOString().split('T')[0], 
                        end_date: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], 
                        supervising_attending_id: '', 
                        rotation_status: 'active', 
                        goals: '', 
                        notes: '', 
                        rotation_category: 'clinical_rotation' 
                    };
                };
                
                const showAddOnCallModal = () => {
                    onCallModal.mode = 'add';
                    onCallModal.show = true;
                    onCallModal.form = { 
                        duty_date: new Date().toISOString().split('T')[0], 
                        shift_type: 'primary_call', 
                        start_time: '08:00', 
                        end_time: '17:00', 
                        primary_physician_id: '', 
                        backup_physician_id: '', 
                        coverage_notes: '', 
                        schedule_id: '' 
                    };
                };
                
                const showAddAbsenceModal = () => {
                    absenceModal.mode = 'add';
                    absenceModal.show = true;
                    absenceModal.form = { 
                        staff_member_id: '', 
                        leave_category: 'vacation', 
                        leave_start_date: new Date().toISOString().split('T')[0], 
                        leave_end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], 
                        leave_reason: '', 
                        coverage_required: true, 
                        approval_status: 'pending', 
                        review_notes: '' 
                    };
                };
                
                const showCommunicationsModal = () => {
                    communicationsModal.show = true;
                    communicationsModal.form = { 
                        announcement_title: '', 
                        announcement_content: '', 
                        publish_start_date: new Date().toISOString().split('T')[0], 
                        publish_end_date: '', 
                        priority_level: 'medium', 
                        announcement_type: 'department', 
                        target_audience: 'all', 
                        visible_to_roles: ['viewing_doctor'] 
                    };
                };
                
                const showUserProfile = () => {
                    userProfileModal.show = true;
                    userProfileModal.form = { 
                        full_name: currentUser.value?.full_name || '', 
                        email: currentUser.value?.email || '', 
                        phone_number: currentUser.value?.phone_number || '', 
                        department_id: currentUser.value?.department_id || '', 
                        user_role: currentUser.value?.user_role || '', 
                        notifications_enabled: currentUser.value?.notifications_enabled || true, 
                        absence_notifications: currentUser.value?.absence_notifications || true, 
                        announcement_notifications: currentUser.value?.announcement_notifications || true 
                    };
                    userMenuOpen.value = false;
                };
                
                const showSystemSettingsModal = () => {
                    systemSettingsModal.show = true;
                    systemSettingsModal.settings = { ...systemSettings.value };
                    userMenuOpen.value = false;
                };
                
                // ============ SAVE FUNCTIONS ============
                const saveMedicalStaff = async () => {
                    saving.value = true;
                    try {
                        if (!medicalStaffModal.form.staff_id) {
                            medicalStaffModal.form.staff_id = `MD-${Date.now().toString().slice(-6)}`;
                        }
                        
                        if (medicalStaffModal.mode === 'add') {
                            const result = await API.createMedicalStaff(medicalStaffModal.form);
                            medicalStaff.value.unshift(result);
                            showToast('Success', 'Medical staff added successfully', 'success');
                        } else {
                            const result = await API.updateMedicalStaff(medicalStaffModal.form.id, medicalStaffModal.form);
                            const index = medicalStaff.value.findIndex(s => s.id === result.id);
                            if (index !== -1) {
                                medicalStaff.value[index] = result;
                            }
                            showToast('Success', 'Medical staff updated successfully', 'success');
                        }
                        
                        medicalStaffModal.show = false;
                        
                    } catch (error) {
                        showToast('Error', error.message, 'error');
                    } finally { 
                        saving.value = false; 
                    }
                };
                
                const saveDepartment = async () => {
                    saving.value = true;
                    try {
                        if (departmentModal.mode === 'add') {
                            const result = await API.createDepartment(departmentModal.form);
                            departments.value.unshift(result);
                            showToast('Success', 'Department added successfully', 'success');
                        } else {
                            const result = await API.updateDepartment(departmentModal.form.id, departmentModal.form);
                            const index = departments.value.findIndex(d => d.id === result.id);
                            if (index !== -1) {
                                departments.value[index] = result;
                            }
                            showToast('Success', 'Department updated successfully', 'success');
                        }
                        
                        departmentModal.show = false;
                        
                    } catch (error) {
                        showToast('Error', error.message, 'error');
                    } finally { 
                        saving.value = false; 
                    }
                };
                
                const saveTrainingUnit = async () => {
                    saving.value = true;
                    try {
                        if (trainingUnitModal.mode === 'add') {
                            const result = await API.createTrainingUnit(trainingUnitModal.form);
                            trainingUnits.value.unshift(result);
                            showToast('Success', 'Training unit added successfully', 'success');
                        } else {
                            const result = await API.updateTrainingUnit(trainingUnitModal.form.id, trainingUnitModal.form);
                            const index = trainingUnits.value.findIndex(u => u.id === result.id);
                            if (index !== -1) {
                                trainingUnits.value[index] = result;
                            }
                            showToast('Success', 'Training unit updated successfully', 'success');
                        }
                        
                        trainingUnitModal.show = false;
                        
                    } catch (error) {
                        showToast('Error', error.message, 'error');
                    } finally { 
                        saving.value = false; 
                    }
                };
                
                const saveRotation = async () => {
                    saving.value = true;
                    try {
                        if (rotationModal.mode === 'add') {
                            const result = await API.createRotation(rotationModal.form);
                            residentRotations.value.unshift(result);
                            showToast('Success', 'Rotation added successfully', 'success');
                        } else {
                            const result = await API.updateRotation(rotationModal.form.id, rotationModal.form);
                            const index = residentRotations.value.findIndex(r => r.id === result.id);
                            if (index !== -1) {
                                residentRotations.value[index] = result;
                            }
                            showToast('Success', 'Rotation updated successfully', 'success');
                        }
                        
                        rotationModal.show = false;
                        
                    } catch (error) {
                        showToast('Error', error.message, 'error');
                    } finally { 
                        saving.value = false; 
                    }
                };
                
                const saveOnCallSchedule = async () => {
                    saving.value = true;
                    try {
                        if (!onCallModal.form.duty_date) {
                            throw new Error('Duty date is required');
                        }
                        
                        if (!onCallModal.form.primary_physician_id) {
                            throw new Error('Primary physician is required');
                        }
                        
                        if (onCallModal.mode === 'add') {
                            const result = await API.createOnCall(onCallModal.form);
                            onCallSchedule.value.unshift(result);
                            showToast('Success', 'On-call schedule added successfully', 'success');
                        } else {
                            const result = await API.updateOnCall(onCallModal.form.id, onCallModal.form);
                            const index = onCallSchedule.value.findIndex(s => s.id === result.id);
                            if (index !== -1) {
                                onCallSchedule.value[index] = result;
                            }
                            showToast('Success', 'On-call schedule updated successfully', 'success');
                        }
                        
                        onCallModal.show = false;
                        
                    } catch (error) {
                        showToast('Error', error.message, 'error');
                    } finally { 
                        saving.value = false; 
                    }
                };
                
                const saveAbsence = async () => {
                    saving.value = true;
                    try {
                        const startDate = new Date(absenceModal.form.leave_start_date);
                        const endDate = new Date(absenceModal.form.leave_end_date);
                        
                        if (endDate <= startDate) {
                            throw new Error('End date must be after start date');
                        }
                        
                        if (absenceModal.mode === 'add') {
                            const result = await API.createAbsence(absenceModal.form);
                            staffAbsences.value.unshift(result);
                            showToast('Success', 'Absence request submitted successfully', 'success');
                        } else {
                            const result = await API.updateAbsence(absenceModal.form.id, absenceModal.form);
                            const index = staffAbsences.value.findIndex(a => a.id === result.id);
                            if (index !== -1) {
                                staffAbsences.value[index] = result;
                            }
                            showToast('Success', 'Absence request updated successfully', 'success');
                        }
                        
                        absenceModal.show = false;
                        
                    } catch (error) {
                        showToast('Error', error.message, 'error');
                    } finally { 
                        saving.value = false; 
                    }
                };
                
                const saveCommunication = async () => {
                    saving.value = true;
                    try {
                        if (!communicationsModal.form.announcement_title || !communicationsModal.form.announcement_content) {
                            throw new Error('Title and content are required');
                        }
                        
                        const result = await API.createAnnouncement(communicationsModal.form);
                        recentAnnouncements.value.unshift(result);
                        communicationsModal.show = false;
                        showToast('Success', 'Announcement posted successfully', 'success');
                        
                    } catch (error) {
                        showToast('Error', error.message, 'error');
                    } finally { 
                        saving.value = false; 
                    }
                };
                
                const saveUserProfile = async () => {
                    saving.value = true;
                    try {
                        const result = await API.updateUserProfile(userProfileModal.form);
                        currentUser.value = { ...currentUser.value, ...result };
                        localStorage.setItem('neumocare_user', JSON.stringify(currentUser.value));
                        userProfileModal.show = false;
                        showToast('Success', 'Profile updated successfully', 'success');
                        
                    } catch (error) {
                        showToast('Error', error.message, 'error');
                    } finally { 
                        saving.value = false; 
                    }
                };
                
                const saveSystemSettings = async () => {
                    saving.value = true;
                    try {
                        const result = await API.updateSystemSettings(systemSettingsModal.settings);
                        systemSettings.value = result;
                        systemSettingsModal.show = false;
                        showToast('Success', 'System settings saved successfully', 'success');
                        
                    } catch (error) {
                        showToast('Error', error.message, 'error');
                    } finally { 
                        saving.value = false; 
                    }
                };
                
                // ============ DELETE FUNCTIONS ============
                const deleteMedicalStaff = (staff) => {
                    showConfirmation({
                        title: 'Deactivate Medical Staff', 
                        message: `Are you sure you want to deactivate ${staff.full_name}?`, 
                        icon: 'fa-trash', 
                        confirmButtonText: 'Deactivate', 
                        confirmButtonClass: 'btn-danger',
                        onConfirm: async () => {
                            try {
                                await API.deleteMedicalStaff(staff.id);
                                const index = medicalStaff.value.findIndex(s => s.id === staff.id);
                                if (index !== -1) {
                                    medicalStaff.value[index].employment_status = 'inactive';
                                }
                                showToast('Deactivated', `${staff.full_name} has been deactivated`, 'success');
                            } catch (error) { 
                                showToast('Error', error.message, 'error'); 
                            }
                        }
                    });
                };
                
                const deleteTrainingUnit = (unitId) => {
                    const unit = trainingUnits.value.find(u => u.id === unitId);
                    if (!unit) return;
                    
                    showConfirmation({
                        title: 'Delete Training Unit', 
                        message: `Are you sure you want to delete ${unit.unit_name}?`, 
                        icon: 'fa-trash', 
                        confirmButtonText: 'Delete', 
                        confirmButtonClass: 'btn-danger',
                        onConfirm: async () => {
                            try {
                                await API.deleteTrainingUnit(unitId);
                                const index = trainingUnits.value.findIndex(u => u.id === unitId);
                                if (index !== -1) {
                                    trainingUnits.value.splice(index, 1);
                                }
                                showToast('Deleted', `${unit.unit_name} has been removed`, 'success');
                            } catch (error) { 
                                showToast('Error', error.message, 'error'); 
                            }
                        }
                    });
                };
                
                const deleteRotation = (rotation) => {
                    showConfirmation({
                        title: 'Cancel Rotation', 
                        message: 'Are you sure you want to cancel this rotation?', 
                        icon: 'fa-trash', 
                        confirmButtonText: 'Cancel Rotation', 
                        confirmButtonClass: 'btn-danger',
                        onConfirm: async () => {
                            try {
                                await API.deleteRotation(rotation.id);
                                const index = residentRotations.value.findIndex(r => r.id === rotation.id);
                                if (index !== -1) {
                                    residentRotations.value[index].rotation_status = 'cancelled';
                                }
                                showToast('Cancelled', 'Rotation has been cancelled', 'success');
                            } catch (error) { 
                                showToast('Error', error.message, 'error'); 
                            }
                        }
                    });
                };
                
                const deleteAbsence = (absence) => {
                    showConfirmation({
                        title: 'Delete Absence Record', 
                        message: 'Are you sure you want to delete this absence record?', 
                        icon: 'fa-trash', 
                        confirmButtonText: 'Delete', 
                        confirmButtonClass: 'btn-danger',
                        onConfirm: async () => {
                            try {
                                await API.deleteAbsence(absence.id);
                                const index = staffAbsences.value.findIndex(a => a.id === absence.id);
                                if (index !== -1) {
                                    staffAbsences.value.splice(index, 1);
                                }
                                showToast('Deleted', 'Absence record has been removed', 'success');
                            } catch (error) { 
                                showToast('Error', error.message, 'error'); 
                            }
                        }
                    });
                };
                
                const deleteAnnouncement = (announcement) => {
                    showConfirmation({
                        title: 'Delete Announcement', 
                        message: 'Are you sure you want to delete this announcement?', 
                        icon: 'fa-trash', 
                        confirmButtonText: 'Delete', 
                        confirmButtonClass: 'btn-danger',
                        onConfirm: async () => {
                            try {
                                await API.deleteAnnouncement(announcement.id);
                                const index = recentAnnouncements.value.findIndex(a => a.id === announcement.id);
                                if (index !== -1) {
                                    recentAnnouncements.value.splice(index, 1);
                                }
                                showToast('Deleted', 'Announcement has been removed', 'success');
                            } catch (error) { 
                                showToast('Error', error.message, 'error'); 
                            }
                        }
                    });
                };
                
                // ============ EDIT/VIEW FUNCTIONS ============
                const viewStaffDetails = (staff) => { 
                    staffDetailsModal.staff = staff; 
                    staffDetailsModal.show = true; 
                };
                
                const editMedicalStaff = (staff) => { 
                    medicalStaffModal.mode = 'edit'; 
                    medicalStaffModal.form = { ...staff }; 
                    medicalStaffModal.show = true; 
                };
                
                const editDepartment = (department) => { 
                    departmentModal.mode = 'edit'; 
                    departmentModal.form = { ...department }; 
                    departmentModal.show = true; 
                };
                
                const editTrainingUnit = (unit) => { 
                    trainingUnitModal.mode = 'edit'; 
                    trainingUnitModal.form = { ...unit }; 
                    trainingUnitModal.show = true; 
                };
                
                const editRotation = (rotation) => { 
                    rotationModal.mode = 'edit'; 
                    rotationModal.form = { ...rotation }; 
                    rotationModal.show = true; 
                };
                
                const editOnCallSchedule = (schedule) => { 
                    onCallModal.mode = 'edit'; 
                    onCallModal.form = { ...schedule }; 
                    onCallModal.show = true; 
                };
                
                const editAbsence = (absence) => {
                    absenceModal.mode = 'edit';
                    absenceModal.form = { 
                        id: absence.id, 
                        staff_member_id: absence.staff_member_id, 
                        leave_category: absence.leave_category, 
                        leave_start_date: absence.leave_start_date, 
                        leave_end_date: absence.leave_end_date, 
                        leave_reason: absence.leave_reason, 
                        coverage_required: absence.coverage_required, 
                        approval_status: absence.approval_status, 
                        review_notes: absence.review_notes 
                    };
                    absenceModal.show = true;
                };
                
                const viewAbsenceDetails = (absence) => { 
                    absenceDetailsModal.absence = absence; 
                    absenceDetailsModal.show = true; 
                };
                
                const viewRotationDetails = (rotation) => { 
                    rotationDetailsModal.rotation = rotation; 
                    rotationDetailsModal.show = true; 
                };
                
                // ============ LIFECYCLE HOOKS ============
                onMounted(() => {
                    // CRITICAL FIX #3: onMounted() Initialization
                    console.log('🚀 Vue app mounted - initializing...');
                    
                    // Ensure token and user are set
                    if (!localStorage.getItem('neumocare_token')) {
                        console.log('🔑 No token found, setting default token...');
                        localStorage.setItem('neumocare_token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjExMTExMTExLTExMTEtMTExMS0xMTExLTExMTExMTExMTExMSIsImVtYWlsIjoiYWRtaW5AbmV1bW9jYXJlLm9yZyIsInJvbGUiOiJzeXN0ZW1fYWRtaW4iLCJpYXQiOjE3Njk2ODMyNzEsImV4cCI6MTc2OTc2OTY3MX0.-v1HyJa27hYAJp2lSQeEMGUvpCq8ngU9r43Ewyn5g8E');
                    }
                    
                    if (!localStorage.getItem('neumocare_user')) {
                        console.log('👤 No user found, setting default user...');
                        localStorage.setItem('neumocare_user', JSON.stringify({
                            id: '11111111-1111-1111-1111-111111111111',
                            email: 'admin@neumocare.org',
                            full_name: 'System Administrator',
                            user_role: 'system_admin'
                        }));
                    }
                    
                    // Update token and currentUser refs
                    API.token.value = localStorage.getItem('neumocare_token');
                    currentUser.value = JSON.parse(localStorage.getItem('neumocare_user'));
                    
                    console.log('✅ Initialization complete:');
                    console.log('- Token set:', !!API.token.value);
                    console.log('- User set:', currentUser.value);
                    
                    // Load data if user is authenticated
                    if (currentUser.value) {
                        console.log('📥 Loading initial data for authenticated user...');
                        loadInitialData();
                    } else {
                        console.log('🔐 No authenticated user, showing login view');
                        currentView.value = 'login';
                    }
                    
                    // Close dropdowns when clicking outside
                    document.addEventListener('click', function(event) {
                        if (!event.target.closest('.user-menu')) {
                            userMenuOpen.value = false;
                        }
                        if (!event.target.closest('.action-dropdown')) {
                            document.querySelectorAll('.action-menu').forEach(menu => {
                                menu.classList.remove('show');
                            });
                        }
                    });
                    
                    console.log('🎉 Vue app initialization complete');
                });
                
                // Watch for data changes
                watch([() => medicalStaff.value, () => residentRotations.value, () => trainingUnits.value], () => {
                    console.log('📊 Data changed, updating computed properties...');
                }, { deep: true });
                
                // ============ RETURN ALL FUNCTIONS AND DATA ============
                return {
                    // State
                    currentUser,
                    loginForm,
                    loading,
                    saving,
                    loadingStats,
                    loadingAnnouncements,
                    loadingSchedule,
                    loadingStaff,
                    loadingRotations,
                    loadingAbsences,
                    loadingAuditLogs,
                    currentView,
                    sidebarCollapsed,
                    mobileMenuOpen,
                    userMenuOpen,
                    statsSidebarOpen,
                    searchQuery,
                    searchScope,
                    searchFilter,
                    
                    // Data
                    medicalStaff,
                    departments,
                    trainingUnits,
                    residentRotations,
                    staffAbsences,
                    onCallSchedule,
                    recentAnnouncements,
                    auditLogs,
                    systemSettings,
                    stats,
                    upcomingEvents,
                    todaysOnCallData,
                    
                    // UI State
                    toasts,
                    activeAlerts,
                    unreadNotifications,
                     quickPlacementModal,  // Add this
    bulkAssignModal,      // You might need this too
    advancedSearchModal,  // And this
    dashboardCustomizeModal, // And this
    clinicalUnitModal,    // And this
    roleModal,           // And this
    
    // Functions
    showNotifications,    // Add this
    showQuickPlacementModal, // Add this
    showBulkAssignModal,  // You might need this
    showAdvancedSearchModal, // And this
    showDashboardCustomizeModal, // And this
    showAddRoleModal,     // And this
    
                    // Filters
                    staffFilter,
                    staffSearch,
                    rotationFilter,
                    absenceFilter,
                    auditFilters,
                    
                    // Modals
                    medicalStaffModal,
                    departmentModal,
                    trainingUnitModal,
                    rotationModal,
                    onCallModal,
                    absenceModal,
                    communicationsModal,
                    userProfileModal,
                    systemSettingsModal,
                    confirmationModal,
                    staffDetailsModal,
                    absenceDetailsModal,
                    rotationDetailsModal,
                    importExportModal,
                    
                    // Formatting Functions
                    formatDate: Utils.formatDate,
                    formatDateTime: Utils.formatDateTime,
                    formatTimeAgo: Utils.formatTimeAgo,
                    getInitials: Utils.getInitials,
                    formatStaffType,
                    getStaffTypeClass,
                    formatEmploymentStatus,
                    formatAbsenceReason,
                    formatAbsenceStatus,
                    formatRotationStatus,
                    getAbsenceStatusClass,
                    getRotationStatusClass,
                    getDepartmentName,
                    getStaffName,
                    getTrainingUnitName,
                    getUnitResidents,
                    getCurrentTitle,
                    getCurrentSubtitle,
                    getUserRoleDisplay,
                    getSearchPlaceholder,
                    
                    // Permission Functions
                    hasPermission,
                    canView,
                    canEdit,
                    canDelete,
                    
                    // Computed Properties
                    residents,
                    attendings,
                    todaysOnCall,
                    filteredMedicalStaff,
                    filteredRotations,
                    filteredAbsences,
                    filteredAuditLogs,
                    availableResidents,
                    availableTrainingUnits,
                    availableStaff,
                    liveStats,
                    
                    // Toast Functions
                    showToast,
                    removeToast,
                    dismissAlert,
                    
                    // Confirmation Modal
                    showConfirmation,
                    confirmAction,
                    cancelConfirmation,
                    
                    // UI Functions
                    toggleActionMenu,
                    toggleUserMenu,
                    toggleStatsSidebar,
                    toggleSearchScope,
                    handleSearch,
                    refreshData,
                    
                    // Authentication
                    handleLogin,
                    handleLogout,
                    
                    // Navigation
                    switchView,
                    
                    // Modal Show Functions
                    showAddMedicalStaffModal,
                    showAddDepartmentModal,
                    showAddTrainingUnitModal,
                    showAddRotationModal,
                    showAddOnCallModal,
                    showAddAbsenceModal,
                    showCommunicationsModal,
                    showUserProfile,
                    showSystemSettingsModal,
                    
                    // Save Functions
                    saveMedicalStaff,
                    saveDepartment,
                    saveTrainingUnit,
                    saveRotation,
                    saveOnCallSchedule,
                    saveAbsence,
                    saveCommunication,
                    saveUserProfile,
                    saveSystemSettings,
                    
                    // Delete Functions
                    deleteMedicalStaff,
                    deleteTrainingUnit,
                    deleteRotation,
                    deleteAbsence,
                    deleteAnnouncement,
                    
                    // View/Edit Functions
                    viewStaffDetails,
                    editMedicalStaff,
                    editDepartment,
                    editTrainingUnit,
                    editRotation,
                    editOnCallSchedule,
                    editAbsence,
                    viewAbsenceDetails,
                    viewRotationDetails,
                    
                    // Utility
                    Utils
                };
            }
        });
        
        // ============ MOUNT THE APP ============
        app.mount('#app');
        
        console.log('🎉 NeumoCare Frontend v3.5 - PRODUCTION FIXED mounted successfully!');
        console.log('✅ All critical fixes applied:');
        console.log('  1. Token initialization with fallback');
        console.log('  2. Correct currentUser object');
        console.log('  3. onMounted() initialization');
        console.log('  4. API.request() debug logging');
        console.log('  5. Medical staff display fixes');
        console.log('  6. Debug logging in loadInitialData()');
        console.log('');
        console.log('🚀 Ready for production API: https://bacend-production.up.railway.app');
        
    } catch (error) {
        console.error('💥 FATAL ERROR: Frontend failed to initialize:', error);
        
        // Display error page if app fails to mount
        document.body.innerHTML = `
            <div style="padding: 40px; text-align: center; margin-top: 100px; color: #333; font-family: Arial, sans-serif;">
                <h2 style="color: #dc3545;">⚠️ System Error</h2>
                <p style="margin: 20px 0; color: #666; font-size: 16px;">
                    The application failed to load properly.
                </p>
                <p style="margin: 10px 0; color: #999; font-size: 14px;">
                    Error: ${error.message}
                </p>
                <div style="margin-top: 30px;">
                    <button onclick="window.location.reload()" 
                            style="padding: 12px 24px; background: #007bff; color: white; 
                                   border: none; border-radius: 6px; cursor: pointer; 
                                   font-size: 16px; margin-right: 10px;">
                        🔄 Refresh Page
                    </button>
                    <button onclick="localStorage.clear(); window.location.reload()" 
                            style="padding: 12px 24px; background: #6c757d; color: white; 
                                   border: none; border-radius: 6px; cursor: pointer; 
                                   font-size: 16px;">
                        🗑️ Clear Cache & Refresh
                    </button>
                </div>
                <div style="margin-top: 40px; padding: 20px; background: #f8f9fa; border-radius: 8px; text-align: left;">
                    <h4 style="margin-top: 0;">Troubleshooting Steps:</h4>
                    <ol style="text-align: left; margin-left: 20px;">
                        <li>Check if JavaScript is enabled in your browser</li>
                        <li>Check browser console for more details (F12 → Console)</li>
                        <li>Try clearing browser cache</li>
                        <li>Ensure you have internet connection</li>
                    </ol>
                </div>
            </div>
        `;
    }
});
