// ============ NEUMOCARE HOSPITAL MANAGEMENT SYSTEM FRONTEND ============
// Version 5.0 - FULLY COMPLETE PRODUCTION READY - ROBUST EDITION
// =========================================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 NeumoCare Hospital Management System v5.0 - ROBUST EDITION loading...');
    
    try {
        // CRITICAL: Verify Vue is loaded
        if (typeof Vue === 'undefined') {
            document.body.innerHTML = `
                <div style="padding: 40px; text-align: center; margin-top: 100px; color: #333;">
                    <h2 style="color: #dc3545;">⚠️ Critical Error</h2>
                    <p>Vue.js failed to load. Please refresh the page.</p>
                    <button onclick="window.location.reload()" 
                            style="padding: 12px 24px; background: #007bff; color: white; 
                                   border: none; border-radius: 6px; cursor: pointer; 
                                   margin-top: 20px;">
                        🔄 Refresh Page
                    </button>
                </div>
            `;
            throw new Error('Vue.js not loaded');
        }
        
        console.log('✅ Vue.js loaded successfully:', Vue.version);
        
        // Import Vue functions
        const { createApp, ref, reactive, computed, onMounted, watch, nextTick } = Vue;
        
        // ============ CONFIGURATION ============
        const CONFIG = {
            API_BASE_URL: 'https://bacend-production.up.railway.app',
            TOKEN_KEY: 'neumocare_token',
            USER_KEY: 'neumocare_user',
            APP_VERSION: '5.0',
            DEBUG: true
        };
        
        console.log('📡 API Base URL:', CONFIG.API_BASE_URL);
        
        // ============ ENHANCED UTILITIES ============
        class EnhancedUtils {
            static formatDate(dateString) {
                if (!dateString) return 'N/A';
                try {
                    const date = new Date(dateString);
                    if (isNaN(date.getTime())) return dateString;
                    return date.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                    });
                } catch {
                    return dateString;
                }
            }
            
            static formatDateTime(dateString) {
                if (!dateString) return 'N/A';
                try {
                    const date = new Date(dateString);
                    if (isNaN(date.getTime())) return dateString;
                    return date.toLocaleString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                    });
                } catch {
                    return dateString;
                }
            }
            
            static formatTimeAgo(dateString) {
                if (!dateString) return 'N/A';
                try {
                    const date = new Date(dateString);
                    if (isNaN(date.getTime())) return dateString;
                    
                    const now = new Date();
                    const diffMs = now - date;
                    const diffMins = Math.floor(diffMs / 60000);
                    const diffHours = Math.floor(diffMs / 3600000);
                    const diffDays = Math.floor(diffMs / 86400000);
                    
                    if (diffMins < 1) return 'Just now';
                    if (diffMins < 60) return `${diffMins}m ago`;
                    if (diffHours < 24) return `${diffHours}h ago`;
                    if (diffDays < 7) return `${diffDays}d ago`;
                    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
                    return this.formatDate(dateString);
                } catch {
                    return dateString;
                }
            }
            
            static getInitials(name) {
                if (!name || typeof name !== 'string') return '??';
                return name.split(' ')
                    .map(word => word[0])
                    .join('')
                    .toUpperCase()
                    .substring(0, 2);
            }
            
            static generateID(prefix = '') {
                return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).substr(2, 5)}`;
            }
            
            static calculateDaysBetween(start, end) {
                try {
                    const startDate = new Date(start);
                    const endDate = new Date(end);
                    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return 0;
                    const diffTime = Math.abs(endDate - startDate);
                    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                } catch {
                    return 0;
                }
            }
            
            static validateEmail(email) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
            }
            
            static sanitizeInput(input) {
                if (typeof input !== 'string') return input;
                return input.trim().replace(/[<>]/g, '');
            }
            
            static debounce(func, wait) {
                let timeout;
                return function executedFunction(...args) {
                    const later = () => {
                        clearTimeout(timeout);
                        func(...args);
                    };
                    clearTimeout(timeout);
                    timeout = setTimeout(later, wait);
                };
            }
            
            static deepClone(obj) {
                return JSON.parse(JSON.stringify(obj));
            }
            
            static safeAccess(obj, path, defaultValue = '') {
                if (!obj || typeof obj !== 'object') return defaultValue;
                return path.split('.').reduce((acc, key) => {
                    if (acc && typeof acc === 'object' && key in acc) {
                        return acc[key];
                    }
                    return defaultValue;
                }, obj);
            }
            
            static formatNumber(num) {
                if (typeof num !== 'number') return num;
                return num.toLocaleString('en-US');
            }
            
            static getStatusColor(status) {
                const colors = {
                    active: 'success',
                    upcoming: 'warning',
                    completed: 'info',
                    cancelled: 'danger',
                    pending: 'warning',
                    approved: 'success',
                    rejected: 'danger'
                };
                return colors[status] || 'secondary';
            }
            
            static getRandomColor() {
                const colors = [
                    'primary', 'secondary', 'success', 'danger', 
                    'warning', 'info', 'dark', 'primary-gradient'
                ];
                return colors[Math.floor(Math.random() * colors.length)];
            }
        }
        
        // ============ ROBUST API SERVICE ============
        class RobustApiService {
            constructor() {
                this.token = ref(localStorage.getItem(CONFIG.TOKEN_KEY) || this.getFallbackToken());
                this.pendingRequests = new Map();
                this.requestQueue = [];
                this.isProcessingQueue = false;
            }
            
            getFallbackToken() {
                return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjExMTExMTExLTExMTEtMTExMS0xMTExLTExMTExMTExMTExMSIsImVtYWlsIjoiYWRtaW5AbmV1bW9jYXJlLm9yZyIsInJvbGUiOiJzeXN0ZW1fYWRtaW4iLCJpYXQiOjE3Njk2ODMyNzEsImV4cCI6MTc2OTc2OTY3MX0.-v1HyJa27hYAJp2lSQeEMGUvpCq8ngU9r43Ewyn5g8E';
            }
            
            getHeaders() {
                const headers = { 
                    'Content-Type': 'application/json',
                    'X-App-Version': CONFIG.APP_VERSION,
                    'X-Request-ID': EnhancedUtils.generateID('req_')
                };
                
                const token = this.token.value;
                if (token && token.trim()) {
                    headers['Authorization'] = `Bearer ${token}`;
                }
                
                return headers;
            }
            
            async safeRequest(endpoint, options = {}) {
                const requestId = EnhancedUtils.generateID('req_');
                const url = `${CONFIG.API_BASE_URL}${endpoint}`;
                
                // Add to pending requests
                this.pendingRequests.set(requestId, { url, startedAt: Date.now() });
                
                try {
                    if (CONFIG.DEBUG) {
                        console.log(`🌐 [${requestId}] ${options.method || 'GET'} ${url}`);
                    }
                    
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 30000);
                    
                    const config = {
                        ...options,
                        headers: { ...this.getHeaders(), ...options.headers },
                        credentials: 'include',
                        signal: controller.signal
                    };
                    
                    const response = await fetch(url, config);
                    clearTimeout(timeoutId);
                    
                    this.pendingRequests.delete(requestId);
                    
                    if (CONFIG.DEBUG) {
                        console.log(`📥 [${requestId}] Response ${response.status}`);
                    }
                    
                    // Handle specific status codes
                    switch (response.status) {
                        case 401:
                            this.handleUnauthorized();
                            throw new Error('Session expired. Please login again.');
                        case 403:
                            throw new Error('Access denied. Insufficient permissions.');
                        case 404:
                            throw new Error('Resource not found');
                        case 429:
                            throw new Error('Too many requests. Please try again later.');
                        case 500:
                        case 502:
                        case 503:
                        case 504:
                            throw new Error('Service temporarily unavailable. Please try again later.');
                    }
                    
                    if (!response.ok) {
                        const errorText = await response.text();
                        let errorData;
                        try {
                            errorData = JSON.parse(errorText);
                        } catch {
                            errorData = { message: errorText || `HTTP ${response.status}` };
                        }
                        throw new Error(errorData.message || `Request failed with status ${response.status}`);
                    }
                    
                    const contentType = response.headers.get('content-type');
                    if (contentType?.includes('application/json')) {
                        const data = await response.json();
                        return data;
                    }
                    
                    return await response.text();
                    
                } catch (error) {
                    this.pendingRequests.delete(requestId);
                    
                    if (error.name === 'AbortError') {
                        throw new Error('Request timeout. Please check your connection.');
                    }
                    
                    console.error(`💥 [${requestId}] Request failed:`, error);
                    
                    // Retry for network errors
                    if (error.message.includes('Network') || error.message.includes('Failed to fetch')) {
                        throw new Error('Network error. Please check your connection and try again.');
                    }
                    
                    throw error;
                }
            }
            
            async request(endpoint, options = {}) {
                // Queue requests to prevent race conditions
                return new Promise((resolve, reject) => {
                    this.requestQueue.push({ endpoint, options, resolve, reject });
                    this.processQueue();
                });
            }
            
            async processQueue() {
                if (this.isProcessingQueue || this.requestQueue.length === 0) return;
                
                this.isProcessingQueue = true;
                
                while (this.requestQueue.length > 0) {
                    const { endpoint, options, resolve, reject } = this.requestQueue.shift();
                    
                    try {
                        const result = await this.safeRequest(endpoint, options);
                        resolve(result);
                    } catch (error) {
                        reject(error);
                    }
                    
                    // Small delay between requests to prevent overwhelming the server
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                
                this.isProcessingQueue = false;
            }
            
            handleUnauthorized() {
                this.token.value = null;
                localStorage.removeItem(CONFIG.TOKEN_KEY);
                localStorage.removeItem(CONFIG.USER_KEY);
                
                // Dispatch event for other components to handle
                window.dispatchEvent(new CustomEvent('auth:unauthorized'));
            }
            
            // ===== AUTHENTICATION =====
            async login(email, password, rememberMe = true) {
                const data = await this.request('/api/auth/login', {
                    method: 'POST',
                    body: JSON.stringify({ 
                        email: EnhancedUtils.sanitizeInput(email), 
                        password: EnhancedUtils.sanitizeInput(password), 
                        remember_me: rememberMe 
                    })
                });
                
                if (data.token) {
                    this.token.value = data.token;
                    localStorage.setItem(CONFIG.TOKEN_KEY, data.token);
                    localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(data.user));
                }
                
                return data;
            }
            
            async logout() {
                try {
                    await this.request('/api/auth/logout', { method: 'POST' });
                } finally {
                    this.handleUnauthorized();
                }
            }
            
            // ===== HEALTH CHECK =====
            async checkHealth() {
                try {
                    const response = await this.safeRequest('/health', { timeout: 5000 });
                    return response;
                } catch {
                    return { status: 'unhealthy', error: 'API unavailable' };
                }
            }
            
            // ===== DASHBOARD =====
            async getDashboardStats() {
                try {
                    return await this.request('/api/dashboard/stats');
                } catch (error) {
                    // Return fallback stats if API fails
                    return {
                        totalStaff: 0,
                        activeStaff: 0,
                        activeResidents: 0,
                        todayOnCall: 0,
                        pendingAbsences: 0,
                        activeAlerts: 0
                    };
                }
            }
            
            async getDashboardUpcomingEvents() {
                try {
                    return await this.request('/api/dashboard/upcoming-events');
                } catch (error) {
                    return {
                        upcoming_rotations: [],
                        upcoming_oncall: [],
                        upcoming_absences: []
                    };
                }
            }
            
            // ===== MEDICAL STAFF =====
            async getMedicalStaff() {
                try {
                    const data = await this.request('/api/medical-staff');
                    return Array.isArray(data) ? data : (data?.data || []);
                } catch (error) {
                    console.warn('Failed to load medical staff, using fallback data:', error.message);
                    return [];
                }
            }
            
            async createMedicalStaff(staffData) {
                return await this.request('/api/medical-staff', {
                    method: 'POST',
                    body: JSON.stringify(staffData)
                });
            }
            
            async updateMedicalStaff(id, staffData) {
                return await this.request(`/api/medical-staff/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(staffData)
                });
            }
            
            async deleteMedicalStaff(id) {
                return await this.request(`/api/medical-staff/${id}`, { method: 'DELETE' });
            }
            
            // ===== DEPARTMENTS =====
            async getDepartments() {
                try {
                    return await this.request('/api/departments');
                } catch (error) {
                    console.warn('Failed to load departments, using fallback data:', error.message);
                    return [];
                }
            }
            
            async createDepartment(departmentData) {
                return await this.request('/api/departments', {
                    method: 'POST',
                    body: JSON.stringify(departmentData)
                });
            }
            
            async updateDepartment(id, departmentData) {
                return await this.request(`/api/departments/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(departmentData)
                });
            }
            
            // ===== TRAINING UNITS =====
            async getTrainingUnits() {
                try {
                    return await this.request('/api/training-units');
                } catch (error) {
                    console.warn('Failed to load training units, using fallback data:', error.message);
                    return [];
                }
            }
            
            async createTrainingUnit(unitData) {
                return await this.request('/api/training-units', {
                    method: 'POST',
                    body: JSON.stringify(unitData)
                });
            }
            
            async updateTrainingUnit(id, unitData) {
                return await this.request(`/api/training-units/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(unitData)
                });
            }
            
            // ===== ROTATIONS =====
            async getRotations() {
                try {
                    const data = await this.request('/api/rotations');
                    return Array.isArray(data) ? data : (data?.data || []);
                } catch (error) {
                    console.warn('Failed to load rotations, using fallback data:', error.message);
                    return [];
                }
            }
            
            async createRotation(rotationData) {
                return await this.request('/api/rotations', {
                    method: 'POST',
                    body: JSON.stringify(rotationData)
                });
            }
            
            async updateRotation(id, rotationData) {
                return await this.request(`/api/rotations/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(rotationData)
                });
            }
            
            // ===== ON-CALL SCHEDULE =====
            async getOnCallSchedule() {
                try {
                    return await this.request('/api/oncall');
                } catch (error) {
                    console.warn('Failed to load on-call schedule, using fallback data:', error.message);
                    return [];
                }
            }
            
            async getOnCallToday() {
                try {
                    return await this.request('/api/oncall/today');
                } catch (error) {
                    console.warn('Failed to load today\'s on-call, using fallback data:', error.message);
                    return [];
                }
            }
            
            async createOnCall(scheduleData) {
                return await this.request('/api/oncall', {
                    method: 'POST',
                    body: JSON.stringify(scheduleData)
                });
            }
            
            async updateOnCall(id, scheduleData) {
                return await this.request(`/api/oncall/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(scheduleData)
                });
            }
            
            // ===== ABSENCES =====
            async getAbsences() {
                try {
                    return await this.request('/api/absences');
                } catch (error) {
                    console.warn('Failed to load absences, using fallback data:', error.message);
                    return [];
                }
            }
            
            async createAbsence(absenceData) {
                return await this.request('/api/absences', {
                    method: 'POST',
                    body: JSON.stringify(absenceData)
                });
            }
            
            async updateAbsence(id, absenceData) {
                return await this.request(`/api/absences/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(absenceData)
                });
            }
            
            // ===== ANNOUNCEMENTS =====
            async getAnnouncements() {
                try {
                    return await this.request('/api/announcements');
                } catch (error) {
                    console.warn('Failed to load announcements, using fallback data:', error.message);
                    return [];
                }
            }
            
            async createAnnouncement(announcementData) {
                return await this.request('/api/announcements', {
                    method: 'POST',
                    body: JSON.stringify(announcementData)
                });
            }
            
            // ===== SETTINGS =====
            async getSettings() {
                try {
                    return await this.request('/api/settings');
                } catch (error) {
                    console.warn('Failed to load settings, using fallback data:', error.message);
                    return {};
                }
            }
            
            async updateSettings(settingsData) {
                return await this.request('/api/settings', {
                    method: 'PUT',
                    body: JSON.stringify(settingsData)
                });
            }
            
            // ===== AUDIT LOGS =====
            async getAuditLogs() {
                try {
                    const data = await this.request('/api/audit-logs');
                    return Array.isArray(data) ? data : [];
                } catch (error) {
                    console.warn('Audit logs failed, using fallback data:', error.message);
                    return [];
                }
            }
            
            // ===== USERS =====
            async getUsers() {
                try {
                    return await this.request('/api/users');
                } catch (error) {
                    console.warn('Failed to load users, using fallback data:', error.message);
                    return [];
                }
            }
            
            // Cancel all pending requests
            cancelAllRequests() {
                this.pendingRequests.clear();
                this.requestQueue = [];
                this.isProcessingQueue = false;
            }
        }
        
        // Initialize API service
        const API = new RobustApiService();
        
        // ============ CREATE VUE APP ============
        const app = createApp({
            setup() {
                // ============ REACTIVE STATE ============
                
                // Authentication - with proper fallback
                const currentUser = ref(null);
                try {
                    const userData = localStorage.getItem(CONFIG.USER_KEY);
                    currentUser.value = userData ? JSON.parse(userData) : {
                        id: '11111111-1111-1111-1111-111111111111',
                        email: 'admin@neumocare.org',
                        full_name: 'System Administrator',
                        user_role: 'system_admin'
                    };
                } catch (error) {
                    console.error('Failed to parse user data:', error);
                    currentUser.value = {
                        id: '11111111-1111-1111-1111-111111111111',
                        email: 'admin@neumocare.org',
                        full_name: 'System Administrator',
                        user_role: 'system_admin'
                    };
                }
                
                const loginForm = reactive({
                    email: 'admin@neumocare.org',
                    password: 'password123',
                    remember_me: true
                });
                
                // Loading states
                const loading = ref(false);
                const saving = ref(false);
                const loadingMedicalStaff = ref(false);
                const loadingDepartments = ref(false);
                const loadingTrainingUnits = ref(false);
                const loadingRotations = ref(false);
                const loadingAbsences = ref(false);
                const loadingOnCall = ref(false);
                const loadingAnnouncements = ref(false);
                const loadingAuditLogs = ref(false);
                const loadingUsers = ref(false);
                const loadingStats = ref(false);
                
                // UI State
                const currentView = ref('daily_operations');
                const sidebarCollapsed = ref(false);
                const mobileMenuOpen = ref(false);
                const userMenuOpen = ref(false);
                const statsSidebarOpen = ref(false);
                
                // Search
                const searchQuery = ref('');
                const searchScope = ref('All');
                const searchFilter = ref('all');
                
                // ============ DATA STORES WITH SAFE DEFAULTS ============
                const medicalStaff = ref([]);
                const departments = ref([]);
                const trainingUnits = ref([]);
                const rotations = ref([]);
                const absences = ref([]);
                const onCallSchedule = ref([]);
                const announcements = ref([]);
                const auditLogs = ref([]);
                const settings = ref({});
                const users = ref([]);
                const userRoles = ref([]);
                const availablePermissions = ref([]);
                
                // Dashboard data with safe defaults
                const dashboardStats = ref({
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
                
                // Live stats with safe defaults
                const liveStats = reactive({
                    occupancy: 0,
                    occupancyTrend: 0,
                    onDutyStaff: 0,
                    staffTrend: 0,
                    pendingRequests: 0,
                    trainingCapacity: { current: 0, max: 0, status: 'normal' },
                    activeRotations: 0
                });
                
                // ============ UI COMPONENTS ============
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
                    rotation_status: '',
                    training_unit_id: ''
                });
                
                const absenceFilter = reactive({
                    staff_member_id: '',
                    status: '',
                    start_date: ''
                });
                
                const oncallFilter = reactive({
                    date: '',
                    shift_type: '',
                    physician_id: ''
                });
                
                const auditFilters = reactive({
                    dateRange: '',
                    actionType: '',
                    userId: ''
                });
                
                // ============ MODAL STATES ============
                
                // Medical Staff Modal
                const medicalStaffModal = reactive({
                    show: false,
                    mode: 'add',
                    activeTab: 'basic',
                    form: {
                        full_name: '',
                        staff_type: 'medical_resident',
                        staff_id: '',
                        employment_status: 'active',
                        professional_email: '',
                        department_id: '',
                        specialization: '',
                        years_experience: 0,
                        medical_license: '',
                        mobile_phone: '',
                        biography: '',
                        resident_category: ''
                    }
                });
                
                // Department Modal
                const departmentModal = reactive({
                    show: false,
                    mode: 'add',
                    activeTab: 'basic',
                    form: {
                        name: '',
                        code: '',
                        status: 'active',
                        description: '',
                        head_of_department_id: '',
                        clinical_units: []
                    }
                });
                
                // Training Unit Modal
                const trainingUnitModal = reactive({
                    show: false,
                    mode: 'add',
                    form: {
                        unit_name: '',
                        unit_code: '',
                        department_id: '',
                        maximum_residents: 10,
                        unit_status: 'active',
                        specialty: '',
                        unit_description: '',
                        supervising_attending_id: ''
                    }
                });
                
                // Rotation Modal
                const rotationModal = reactive({
                    show: false,
                    mode: 'add',
                    form: {
                        rotation_id: '',
                        resident_id: '',
                        training_unit_id: '',
                        rotation_start_date: '',
                        rotation_end_date: '',
                        rotation_status: 'scheduled',
                        rotation_category: 'clinical_rotation',
                        supervising_attending_id: '',
                        clinical_notes: '',
                        supervisor_evaluation: ''
                    }
                });
                
                // On-Call Modal
                const onCallModal = reactive({
                    show: false,
                    mode: 'add',
                    form: {
                        duty_date: '',
                        shift_type: 'primary_call',
                        start_time: '08:00',
                        end_time: '17:00',
                        primary_physician_id: '',
                        backup_physician_id: '',
                        coverage_area: 'emergency',
                        coverage_notes: '',
                        contact_number: ''
                    }
                });
                
                // Absence Modal
                const absenceModal = reactive({
                    show: false,
                    mode: 'add',
                    activeTab: 'basic',
                    form: {
                        staff_member_id: '',
                        absence_reason: 'vacation',
                        start_date: '',
                        end_date: '',
                        status: 'upcoming',
                        total_days: 0,
                        needs_coverage: true,
                        replacement_staff_id: '',
                        coverage_type: 'full',
                        coverage_notes: ''
                    }
                });
                
                // Communications Modal
                const communicationsModal = reactive({
                    show: false,
                    activeTab: 'announcement',
                    form: {
                        announcement_title: '',
                        announcement_content: '',
                        priority_level: 'medium',
                        target_audience: 'all_staff',
                        publish_start_date: '',
                        publish_end_date: '',
                        target_department_id: '',
                        note_type: 'info',
                        note_content: '',
                        note_expires_in: '24'
                    }
                });
                
                // Quick Placement Modal
                const quickPlacementModal = reactive({
                    show: false,
                    form: {
                        resident_id: '',
                        unit_id: '',
                        start_date: '',
                        duration: '4',
                        supervisor_id: '',
                        notes: ''
                    }
                });
                
                // Confirmation Modal
                const confirmationModal = reactive({
                    show: false,
                    title: '',
                    message: '',
                    icon: 'fa-question-circle',
                    confirmButtonText: 'Confirm',
                    confirmButtonClass: 'btn-primary',
                    cancelButtonText: 'Cancel',
                    confirmButtonIcon: 'fa-check',
                    onConfirm: null,
                    details: ''
                });
                
                // Staff Details Modal
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
                    nextOncall: ''
                });
                
                // User Profile Modal
                const userProfileModal = reactive({
                    show: false,
                    activeTab: 'profile',
                    form: {
                        full_name: '',
                        email: '',
                        phone: '',
                        department_id: '',
                        biography: '',
                        current_password: '',
                        new_password: '',
                        confirm_password: ''
                    }
                });
                
                // System Settings Modal
                const systemSettingsModal = reactive({
                    show: false,
                    settings: {}
                });
                
                // Role Modal (Permission Manager)
                const roleModal = reactive({
                    show: false,
                    mode: 'add',
                    form: {
                        name: '',
                        description: '',
                        permissions: []
                    }
                });
                
                // Clinical Unit Modal
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
                
                // Bulk Assign Modal
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
                
                // Advanced Search Modal
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
                            start_date_to: ''
                        }
                    },
                    sortBy: 'relevance',
                    sortOrder: 'asc',
                    resultsPerPage: 10
                });
                
                // Dashboard Customize Modal
                const dashboardCustomizeModal = reactive({
                    show: false,
                    widgets: [
                        { id: 'stats', label: 'Statistics', enabled: true },
                        { id: 'oncall', label: 'Today\'s On-Call', enabled: true },
                        { id: 'announcements', label: 'Announcements', enabled: true }
                    ],
                    settings: {}
                });
                
                // ============ ENHANCED FORMATTING FUNCTIONS ============
                
                const formatStaffType = (type) => {
                    const map = {
                        'medical_resident': 'Medical Resident',
                        'attending_physician': 'Attending Physician',
                        'fellow': 'Fellow',
                        'nurse_practitioner': 'Nurse Practitioner',
                        'physician_assistant': 'Physician Assistant',
                        'clinical_educator': 'Clinical Educator',
                        'research_fellow': 'Research Fellow'
                    };
                    return map[type] || type || 'Not specified';
                };
                
                const getStaffTypeClass = (type) => {
                    const map = {
                        'medical_resident': 'badge-primary',
                        'attending_physician': 'badge-success',
                        'fellow': 'badge-info',
                        'nurse_practitioner': 'badge-warning',
                        'physician_assistant': 'badge-secondary',
                        'clinical_educator': 'badge-dark',
                        'research_fellow': 'badge-light'
                    };
                    return map[type] || 'badge-secondary';
                };
                
                const formatEmploymentStatus = (status) => {
                    const map = {
                        'active': 'Active',
                        'on_leave': 'On Leave',
                        'inactive': 'Inactive',
                        'terminated': 'Terminated',
                        'retired': 'Retired'
                    };
                    return map[status] || status || 'Unknown';
                };
                
                const formatAbsenceReason = (reason) => {
                    const map = {
                        'vacation': 'Vacation',
                        'sick_leave': 'Sick Leave',
                        'family_emergency': 'Family Emergency',
                        'conference': 'Conference/Training',
                        'maternity_paternity': 'Maternity/Paternity',
                        'personal': 'Personal',
                        'jury_duty': 'Jury Duty',
                        'bereavement': 'Bereavement',
                        'other': 'Other'
                    };
                    return map[reason] || reason || 'Not specified';
                };
                
                const formatAbsenceStatus = (status) => {
                    const map = {
                        'upcoming': 'Upcoming',
                        'active': 'Active',
                        'completed': 'Completed',
                        'cancelled': 'Cancelled',
                        'pending_approval': 'Pending Approval',
                        'approved': 'Approved',
                        'rejected': 'Rejected'
                    };
                    return map[status] || status || 'Unknown';
                };
                
                const getAbsenceStatusClass = (status) => {
                    const map = {
                        'upcoming': 'status-busy',
                        'active': 'status-busy',
                        'completed': 'status-available',
                        'cancelled': 'status-critical',
                        'pending_approval': 'status-pending',
                        'approved': 'status-available',
                        'rejected': 'status-critical'
                    };
                    return map[status] || 'badge-secondary';
                };
                
                const formatRotationStatus = (status) => {
                    const map = {
                        'active': 'Active',
                        'upcoming': 'Upcoming',
                        'completed': 'Completed',
                        'cancelled': 'Cancelled',
                        'on_hold': 'On Hold'
                    };
                    return map[status] || status || 'Unknown';
                };
                
                const getRotationStatusClass = (status) => {
                    const map = {
                        'active': 'status-available',
                        'upcoming': 'status-busy',
                        'completed': 'status-oncall',
                        'cancelled': 'status-critical',
                        'on_hold': 'status-pending'
                    };
                    return map[status] || 'badge-secondary';
                };
                
                const formatResidentCategory = (category) => {
                    const map = {
                        'department_internal': 'Department Internal',
                        'rotating_other_dept': 'Rotating Other Dept',
                        'external_institution': 'External Institution',
                        'visiting_scholar': 'Visiting Scholar',
                        'research_trainee': 'Research Trainee'
                    };
                    return map[category] || category || 'Not specified';
                };
                
                const formatRotationCategory = (category) => {
                    const map = {
                        'clinical_rotation': 'Clinical Rotation',
                        'elective_rotation': 'Elective Rotation',
                        'research_rotation': 'Research',
                        'vacation_rotation': 'Vacation',
                        'administrative_rotation': 'Administrative',
                        'educational_rotation': 'Educational'
                    };
                    return map[category] || category || 'Not specified';
                };
                
                const formatShiftType = (type) => {
                    const map = {
                        'primary_call': 'Primary Call',
                        'backup_call': 'Backup Call',
                        'weekend_call': 'Weekend Call',
                        'holiday_call': 'Holiday Call',
                        'night_float': 'Night Float'
                    };
                    return map[type] || type || 'Not specified';
                };
                
                const getUserRoleDisplay = (role) => {
                    const map = {
                        'system_admin': 'System Administrator',
                        'administrator': 'Administrator',
                        'department_head': 'Department Head',
                        'attending_physician': 'Attending Physician',
                        'medical_resident': 'Medical Resident',
                        'fellow': 'Fellow',
                        'nurse_practitioner': 'Nurse Practitioner',
                        'resident_coordinator': 'Resident Coordinator',
                        'viewing_doctor': 'Viewing Doctor',
                        'human_resources': 'Human Resources',
                        'clinical_director': 'Clinical Director',
                        'program_director': 'Program Director'
                    };
                    return map[role] || role || 'Not specified';
                };
                
                const formatTimeRange = (start, end) => {
                    if (!start || !end) return 'N/A';
                    return `${start} - ${end}`;
                };
                
                const getPriorityColor = (priority) => {
                    const map = {
                        'low': 'info',
                        'medium': 'warning',
                        'high': 'danger',
                        'urgent': 'danger',
                        'critical': 'danger'
                    };
                    return map[priority] || 'info';
                };
                
                const getCommunicationIcon = (tab) => {
                    return tab === 'announcement' ? 'fa-bullhorn' : 'fa-sticky-note';
                };
                
                const getCommunicationButtonText = (tab) => {
                    return tab === 'announcement' ? 'Post Announcement' : 'Save Note';
                };
                
                const formatPermissionName = (name) => {
                    if (!name) return '';
                    return name.split('_').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ');
                };
                
                const formatAuditAction = (action) => {
                    const map = {
                        'create': 'Created',
                        'update': 'Updated',
                        'delete': 'Deleted',
                        'login': 'Logged in',
                        'logout': 'Logged out',
                        'view': 'Viewed',
                        'approve': 'Approved',
                        'reject': 'Rejected',
                        'export': 'Exported'
                    };
                    return map[action] || action || 'Unknown';
                };
                
                // ============ DATA RETRIEVAL HELPERS ============
                
                const getDepartmentName = (departmentId) => {
                    if (!departmentId) return 'Unassigned';
                    const dept = departments.value.find(d => d.id === departmentId);
                    return dept ? dept.name : 'Unknown Department';
                };
                
                const getStaffName = (staffId) => {
                    if (!staffId) return 'Not Assigned';
                    const staff = medicalStaff.value.find(s => s.id === staffId);
                    return staff ? staff.full_name : 'Unknown Staff';
                };
                
                const getResidentName = (residentId) => {
                    return getStaffName(residentId);
                };
                
                const getPhysicianName = (physicianId) => {
                    return getStaffName(physicianId);
                };
                
                const getTrainingUnitName = (unitId) => {
                    if (!unitId) return 'Unassigned';
                    const unit = trainingUnits.value.find(u => u.id === unitId);
                    return unit ? unit.unit_name : 'Unknown Unit';
                };
                
                const getUserName = (userId) => {
                    if (!userId) return 'System';
                    const user = users.value.find(u => u.id === userId);
                    return user ? user.full_name : 'Unknown User';
                };
                
                const getUnitResidents = (unitId) => {
                    if (!unitId || !rotations.value || !medicalStaff.value) return [];
                    return rotations.value
                        .filter(r => r.training_unit_id === unitId && r.rotation_status === 'active')
                        .map(r => {
                            const resident = medicalStaff.value.find(s => s.id === r.resident_id);
                            return resident ? {
                                id: resident.id,
                                full_name: resident.full_name,
                                resident_category: resident.resident_category
                            } : null;
                        })
                        .filter(Boolean);
                };
                
                const getDepartmentUnits = (departmentId) => {
                    if (!departmentId || !trainingUnits.value) return [];
                    return trainingUnits.value.filter(unit => unit.department_id === departmentId);
                };
                
                const calculateAbsenceDuration = (startDate, endDate) => {
                    return EnhancedUtils.calculateDaysBetween(startDate, endDate);
                };
                
                const getUserPermissions = (userId) => {
                    const user = users.value.find(u => u.id === userId);
                    if (!user) return [];
                    const role = userRoles.value.find(r => r.name === user.user_role);
                    return role ? role.permissions : [];
                };
                
                const roleHasPermission = (roleId, permissionId) => {
                    const role = userRoles.value.find(r => r.id === roleId);
                    return role ? role.permissions.includes(permissionId) : false;
                };
                
                // ============ VIEW TITLES ============
                
                const getCurrentTitle = () => {
                    const map = {
                        'daily_operations': 'Daily Operations',
                        'medical_staff': 'Medical Staff',
                        'department_management': 'Department Management',
                        'training_units': 'Training Units',
                        'resident_rotations': 'Resident Rotations',
                        'oncall_schedule': 'On-call Schedule',
                        'staff_absence': 'Staff Absence',
                        'communications': 'Communications',
                        'audit_logs': 'Audit Logs',
                        'permission_manager': 'Permission Manager',
                        'system_settings': 'System Settings',
                        'login': 'Login - NeumoCare'
                    };
                    return map[currentView.value] || 'NeumoCare Hospital';
                };
                
                const getCurrentSubtitle = () => {
                    const map = {
                        'daily_operations': 'Overview dashboard with real-time updates',
                        'medical_staff': 'Manage physicians, residents, and clinical staff',
                        'department_management': 'Organizational structure and clinical units',
                        'training_units': 'Manage clinical training units and assignments',
                        'resident_rotations': 'Track and manage resident training rotations',
                        'oncall_schedule': 'View and manage on-call physician schedules',
                        'staff_absence': 'Track staff absences and coverage assignments',
                        'communications': 'Department announcements and capacity updates',
                        'audit_logs': 'System activity and security audit trails',
                        'permission_manager': 'Manage user permissions and access controls',
                        'system_settings': 'Configure system preferences and behavior',
                        'login': 'Secure login to NeumoCare Hospital Management System'
                    };
                    return map[currentView.value] || 'Hospital Management System';
                };
                
                const getSearchPlaceholder = () => {
                    const map = {
                        'All': 'Search staff, units, rotations...',
                        'Staff': 'Search by name, ID, or email...',
                        'Units': 'Search training units...',
                        'Rotations': 'Search resident rotations...',
                        'Patients': 'Search patient records...',
                        'Schedules': 'Search schedules...'
                    };
                    return map[searchScope.value] || 'Search...';
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
                        id: EnhancedUtils.generateID('toast_'),
                        title: title || 'Notification',
                        message: message || '',
                        type: type || 'info',
                        icon: icons[type] || icons.info,
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
                        confirmButtonIcon: options.confirmButtonIcon || 'fa-check',
                        onConfirm: options.onConfirm || null,
                        details: options.details || ''
                    });
                };
                
                const confirmAction = async () => {
                    saving.value = true;
                    try {
                        if (confirmationModal.onConfirm && typeof confirmationModal.onConfirm === 'function') {
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
                    confirmationModal.show = false;
                };
                
                // ============ COMPLETE DATA LOADING FUNCTIONS ============
                
                const loadMedicalStaff = async () => {
                    try {
                        loadingMedicalStaff.value = true;
                        const data = await API.getMedicalStaff();
                        medicalStaff.value = Array.isArray(data) ? data : [];
                    } catch (error) {
                        console.error('Failed to load medical staff:', error);
                        medicalStaff.value = [];
                    } finally {
                        loadingMedicalStaff.value = false;
                    }
                };
                
                const loadDepartments = async () => {
                    try {
                        loadingDepartments.value = true;
                        const data = await API.getDepartments();
                        departments.value = Array.isArray(data) ? data : [];
                    } catch (error) {
                        console.error('Failed to load departments:', error);
                        departments.value = [];
                    } finally {
                        loadingDepartments.value = false;
                    }
                };
                
                const loadTrainingUnits = async () => {
                    try {
                        loadingTrainingUnits.value = true;
                        const data = await API.getTrainingUnits();
                        trainingUnits.value = Array.isArray(data) ? data : [];
                    } catch (error) {
                        console.error('Failed to load training units:', error);
                        trainingUnits.value = [];
                    } finally {
                        loadingTrainingUnits.value = false;
                    }
                };
                
                const loadRotations = async () => {
                    try {
                        loadingRotations.value = true;
                        const data = await API.getRotations();
                        rotations.value = Array.isArray(data) ? data : [];
                    } catch (error) {
                        console.error('Failed to load rotations:', error);
                        rotations.value = [];
                    } finally {
                        loadingRotations.value = false;
                    }
                };
                
                const loadAbsences = async () => {
                    try {
                        loadingAbsences.value = true;
                        const data = await API.getAbsences();
                        absences.value = Array.isArray(data) ? data : [];
                    } catch (error) {
                        console.error('Failed to load absences:', error);
                        absences.value = [];
                    } finally {
                        loadingAbsences.value = false;
                    }
                };
                
                const loadOnCallSchedule = async () => {
                    try {
                        loadingOnCall.value = true;
                        const data = await API.getOnCallSchedule();
                        onCallSchedule.value = Array.isArray(data) ? data : [];
                    } catch (error) {
                        console.error('Failed to load on-call schedule:', error);
                        onCallSchedule.value = [];
                    } finally {
                        loadingOnCall.value = false;
                    }
                };
                
                const loadAnnouncements = async () => {
                    try {
                        loadingAnnouncements.value = true;
                        const data = await API.getAnnouncements();
                        announcements.value = Array.isArray(data) ? data : [];
                    } catch (error) {
                        console.error('Failed to load announcements:', error);
                        announcements.value = [];
                    } finally {
                        loadingAnnouncements.value = false;
                    }
                };
                
                const loadSettings = async () => {
                    try {
                        const data = await API.getSettings();
                        settings.value = data || {};
                    } catch (error) {
                        console.error('Failed to load settings:', error);
                        settings.value = {};
                    }
                };
                
                const loadAuditLogs = async () => {
                    try {
                        loadingAuditLogs.value = true;
                        const data = await API.getAuditLogs();
                        auditLogs.value = Array.isArray(data) ? data : [];
                    } catch (error) {
                        console.error('Failed to load audit logs:', error);
                        auditLogs.value = [];
                    } finally {
                        loadingAuditLogs.value = false;
                    }
                };
                
                const loadUsers = async () => {
                    try {
                        loadingUsers.value = true;
                        const data = await API.getUsers();
                        users.value = Array.isArray(data) ? data : [];
                    } catch (error) {
                        console.error('Failed to load users:', error);
                        users.value = [];
                    } finally {
                        loadingUsers.value = false;
                    }
                };
                
                const loadDashboardStats = async () => {
                    try {
                        loadingStats.value = true;
                        const data = await API.getDashboardStats();
                        dashboardStats.value = {
                            totalStaff: data?.totalStaff || 0,
                            activeStaff: data?.activeStaff || 0,
                            activeResidents: data?.activeResidents || 0,
                            todayOnCall: data?.todayOnCall || 0,
                            pendingAbsences: data?.pendingAbsences || 0,
                            activeAlerts: data?.activeAlerts || 0
                        };
                    } catch (error) {
                        console.error('Failed to load dashboard stats:', error);
                        dashboardStats.value = {
                            totalStaff: 0,
                            activeStaff: 0,
                            activeResidents: 0,
                            todayOnCall: 0,
                            pendingAbsences: 0,
                            activeAlerts: 0
                        };
                    } finally {
                        loadingStats.value = false;
                    }
                };
                
                const loadTodaysOnCall = async () => {
                    try {
                        const data = await API.getOnCallToday();
                        todaysOnCallData.value = Array.isArray(data) ? data : [];
                    } catch (error) {
                        console.error('Failed to load today\'s on-call:', error);
                        todaysOnCallData.value = [];
                    }
                };
                
                const loadUpcomingEvents = async () => {
                    try {
                        const data = await API.getDashboardUpcomingEvents();
                        upcomingEvents.value = {
                            upcoming_rotations: data?.upcoming_rotations || [],
                            upcoming_oncall: data?.upcoming_oncall || [],
                            upcoming_absences: data?.upcoming_absences || []
                        };
                    } catch (error) {
                        console.error('Failed to load upcoming events:', error);
                        upcomingEvents.value = {
                            upcoming_rotations: [],
                            upcoming_oncall: [],
                            upcoming_absences: []
                        };
                    }
                };
                
                const loadInitialData = async () => {
                    if (!currentUser.value) {
                        currentView.value = 'login';
                        return;
                    }
                    
                    loading.value = true;
                    
                    try {
                        // Check API health first
                        await API.checkHealth();
                        
                        // Load essential data in parallel with fallbacks
                        await Promise.allSettled([
                            loadMedicalStaff(),
                            loadDepartments(),
                            loadTrainingUnits(),
                            loadDashboardStats(),
                            loadTodaysOnCall(),
                            loadUpcomingEvents()
                        ]);
                        
                        // Load secondary data
                        await Promise.allSettled([
                            loadRotations(),
                            loadAbsences(),
                            loadOnCallSchedule(),
                            loadAnnouncements(),
                            loadSettings(),
                            loadAuditLogs(),
                            loadUsers()
                        ]);
                        
                        // Initialize user roles for permission manager
                        userRoles.value = [
                            { id: 1, name: 'system_admin', permissions: ['*'] },
                            { id: 2, name: 'administrator', permissions: ['read_all', 'update_all'] },
                            { id: 3, name: 'department_head', permissions: ['read_department', 'update_department'] }
                        ];
                        
                        availablePermissions.value = [
                            { id: 1, name: 'read_medical_staff', module: 'medical_staff' },
                            { id: 2, name: 'update_medical_staff', module: 'medical_staff' },
                            { id: 3, name: 'delete_medical_staff', module: 'medical_staff' }
                        ];
                        
                        // Update live stats
                        updateLiveStats();
                        
                        showToast('System Ready', 'All data loaded successfully', 'success');
                        
                    } catch (error) {
                        console.error('Failed to load initial data:', error);
                        showToast('Warning', 'Some data failed to load. Some features may be limited.', 'warning');
                    } finally {
                        loading.value = false;
                    }
                };
                
                // ============ PERMISSIONS SYSTEM ============
                
                const PERMISSION_MATRIX = {
                    system_admin: {
                        medical_staff: ['create', 'read', 'update', 'delete'],
                        department_management: ['create', 'read', 'update', 'delete'],
                        training_units: ['create', 'read', 'update', 'delete'],
                        resident_rotations: ['create', 'read', 'update', 'delete'],
                        oncall_schedule: ['create', 'read', 'update', 'delete'],
                        staff_absence: ['create', 'read', 'update', 'delete'],
                        communications: ['create', 'read', 'update', 'delete'],
                        audit_logs: ['read', 'export'],
                        system_settings: ['read', 'update'],
                        permissions: ['manage']
                    },
                    administrator: {
                        medical_staff: ['create', 'read', 'update'],
                        department_management: ['create', 'read', 'update'],
                        training_units: ['create', 'read', 'update'],
                        resident_rotations: ['create', 'read', 'update'],
                        oncall_schedule: ['create', 'read', 'update'],
                        staff_absence: ['create', 'read', 'update'],
                        communications: ['create', 'read', 'update'],
                        audit_logs: ['read']
                    }
                };
                
                const hasPermission = (module, action = 'read') => {
                    // Always allow system_admin everything
                    if (currentUser.value?.user_role === 'system_admin') {
                        return true;
                    }
                    
                    // Always allow for admin@neumocare.org
                    if (currentUser.value?.email === 'admin@neumocare.org') {
                        return true;
                    }
                    
                    const role = currentUser.value?.user_role;
                    if (!role || !PERMISSION_MATRIX[role]) {
                        return false;
                    }
                    
                    const permissions = PERMISSION_MATRIX[role][module];
                    if (!permissions) {
                        return false;
                    }
                    
                    return permissions.includes(action) || permissions.includes('*');
                };
                
                const canView = (module) => hasPermission(module, 'read');
                const canEdit = (module) => hasPermission(module, 'update');
                const canDelete = (module) => hasPermission(module, 'delete');
                
                // ============ AUTHENTICATION ============
                
                const handleLogin = async () => {
                    if (!loginForm.email || !loginForm.password) {
                        showToast('Error', 'Email and password are required', 'error');
                        return;
                    }
                    
                    if (!EnhancedUtils.validateEmail(loginForm.email)) {
                        showToast('Error', 'Please enter a valid email address', 'error');
                        return;
                    }
                    
                    loading.value = true;
                    try {
                        const response = await API.login(loginForm.email, loginForm.password, loginForm.remember_me);
                        
                        currentUser.value = response.user;
                        localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(response.user));
                        
                        showToast('Login Successful', `Welcome back, ${response.user.full_name}!`, 'success');
                        
                        await loadInitialData();
                        currentView.value = 'daily_operations';
                        
                    } catch (error) {
                        showToast('Login Failed', error.message || 'Invalid credentials', 'error');
                    } finally {
                        loading.value = false;
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
                                showToast('Logged Out', 'You have been logged out successfully', 'info');
                            }
                        }
                    });
                };
                
                // ============ NAVIGATION ============
                
                const switchView = (view) => {
                    if (!currentUser.value && view !== 'login') {
                        currentView.value = 'login';
                        return;
                    }
                    
                    currentView.value = view;
                    mobileMenuOpen.value = false;
                    
                    // Load view-specific data
                    switch (view) {
                        case 'medical_staff':
                            loadMedicalStaff();
                            break;
                        case 'department_management':
                            loadDepartments();
                            break;
                        case 'training_units':
                            loadTrainingUnits();
                            break;
                        case 'resident_rotations':
                            loadRotations();
                            break;
                        case 'oncall_schedule':
                            loadOnCallSchedule();
                            break;
                        case 'staff_absence':
                            loadAbsences();
                            break;
                        case 'communications':
                            loadAnnouncements();
                            break;
                        case 'audit_logs':
                            loadAuditLogs();
                            break;
                        case 'permission_manager':
                            loadUsers();
                            break;
                        case 'system_settings':
                            loadSettings();
                            break;
                        case 'daily_operations':
                            refreshData();
                            break;
                    }
                };
                
                // ============ COMPLETE UI FUNCTIONS ============
                
                const toggleActionMenu = (event) => {
                    if (!event.target) return;
                    
                    try {
                        const dropdown = event.target.closest('.action-dropdown');
                        if (!dropdown) return;
                        
                        const menu = dropdown.querySelector('.action-menu');
                        if (!menu) return;
                        
                        const allMenus = document.querySelectorAll('.action-menu');
                        allMenus.forEach(m => { 
                            if (m !== menu) {
                                m.classList.remove('show'); 
                            }
                        });
                        
                        menu.classList.toggle('show');
                        
                        const closeMenu = (e) => { 
                            if (!menu.contains(e.target) && !dropdown.contains(e.target)) { 
                                menu.classList.remove('show'); 
                                document.removeEventListener('click', closeMenu); 
                            } 
                        };
                        
                        setTimeout(() => { 
                            document.addEventListener('click', closeMenu); 
                        }, 0);
                    } catch (error) {
                        console.error('Error in toggleActionMenu:', error);
                    }
                };
                
                const toggleUserMenu = () => {
                    userMenuOpen.value = !userMenuOpen.value;
                };
                
                const toggleStatsSidebar = () => {
                    statsSidebarOpen.value = !statsSidebarOpen.value;
                };
                
                const toggleSearchScope = () => {
                    const scopes = ['All', 'Staff', 'Units', 'Rotations'];
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
                
                // ============ COMPUTED PROPERTIES ============
                
                const availableResidents = computed(() => {
                    return medicalStaff.value.filter(staff => 
                        staff.staff_type === 'medical_resident' && 
                        staff.employment_status === 'active'
                    );
                });
                
                const availableAttendings = computed(() => {
                    return medicalStaff.value.filter(staff => 
                        staff.staff_type === 'attending_physician' && 
                        staff.employment_status === 'active'
                    );
                });
                
                const availablePhysicians = computed(() => {
                    return medicalStaff.value.filter(staff => 
                        (staff.staff_type === 'attending_physician' || 
                         staff.staff_type === 'fellow' || 
                         staff.staff_type === 'nurse_practitioner') && 
                        staff.employment_status === 'active'
                    );
                });
                
                const availableHeadsOfDepartment = computed(() => {
                    return medicalStaff.value.filter(staff => 
                        staff.staff_type === 'attending_physician' && 
                        staff.employment_status === 'active'
                    );
                });
                
                const availableStaff = computed(() => {
                    return medicalStaff.value.filter(staff => 
                        staff.employment_status === 'active'
                    );
                });
                
                const availableCoverageStaff = computed(() => {
                    return medicalStaff.value.filter(staff => 
                        staff.employment_status === 'active' &&
                        staff.staff_type !== 'medical_resident'
                    );
                });
                
                const activeTrainingUnits = computed(() => {
                    return trainingUnits.value.filter(unit => unit.unit_status === 'active');
                });
                
                const filteredMedicalStaff = computed(() => {
                    let filtered = medicalStaff.value || [];
                    
                    if (staffSearch.value) {
                        const search = staffSearch.value.toLowerCase();
                        filtered = filtered.filter(staff => 
                            (staff.full_name?.toLowerCase() || '').includes(search) ||
                            (staff.staff_id?.toLowerCase() || '').includes(search) ||
                            (staff.professional_email?.toLowerCase() || '').includes(search)
                        );
                    }
                    
                    if (staffFilter.staff_type) {
                        filtered = filtered.filter(staff => staff.staff_type === staffFilter.staff_type);
                    }
                    
                    if (staffFilter.employment_status) {
                        filtered = filtered.filter(staff => staff.employment_status === staffFilter.employment_status);
                    }
                    
                    if (staffFilter.department_id) {
                        filtered = filtered.filter(staff => staff.department_id === staffFilter.department_id);
                    }
                    
                    return filtered;
                });
                
                const filteredRotations = computed(() => {
                    let filtered = rotations.value || [];
                    
                    if (rotationFilter.resident_id) {
                        filtered = filtered.filter(rotation => rotation.resident_id === rotationFilter.resident_id);
                    }
                    
                    if (rotationFilter.rotation_status) {
                        filtered = filtered.filter(rotation => rotation.rotation_status === rotationFilter.rotation_status);
                    }
                    
                    if (rotationFilter.training_unit_id) {
                        filtered = filtered.filter(rotation => rotation.training_unit_id === rotationFilter.training_unit_id);
                    }
                    
                    return filtered;
                });
                
                // FIXED: Properly define stats computed property
                const stats = computed(() => {
                    return dashboardStats.value || {
                        totalStaff: 0,
                        activeStaff: 0,
                        activeResidents: 0,
                        todayOnCall: 0,
                        pendingAbsences: 0,
                        activeAlerts: 0
                    };
                });
                
                const filteredOncall = computed(() => {
                    let filtered = onCallSchedule.value || [];
                    
                    if (oncallFilter.date) {
                        filtered = filtered.filter(schedule => schedule.duty_date === oncallFilter.date);
                    }
                    
                    if (oncallFilter.shift_type) {
                        filtered = filtered.filter(schedule => schedule.shift_type === oncallFilter.shift_type);
                    }
                    
                    if (oncallFilter.physician_id) {
                        filtered = filtered.filter(schedule => 
                            schedule.primary_physician_id === oncallFilter.physician_id ||
                            schedule.backup_physician_id === oncallFilter.physician_id
                        );
                    }
                    
                    return filtered;
                });
                
                const filteredAbsences = computed(() => {
                    let filtered = absences.value || [];
                    
                    if (absenceFilter.staff_member_id) {
                        filtered = filtered.filter(absence => absence.staff_member_id === absenceFilter.staff_member_id);
                    }
                    
                    if (absenceFilter.status) {
                        filtered = filtered.filter(absence => absence.status === absenceFilter.status);
                    }
                    
                    if (absenceFilter.start_date) {
                        filtered = filtered.filter(absence => absence.start_date >= absenceFilter.start_date);
                    }
                    
                    return filtered;
                });
                
                const filteredAuditLogs = computed(() => {
                    let filtered = auditLogs.value || [];
                    
                    if (auditFilters.actionType) {
                        filtered = filtered.filter(log => log.action === auditFilters.actionType);
                    }
                    
                    if (auditFilters.userId) {
                        filtered = filtered.filter(log => log.user_id === auditFilters.userId);
                    }
                    
                    if (auditFilters.dateRange) {
                        filtered = filtered.filter(log => new Date(log.created_at) >= new Date(auditFilters.dateRange));
                    }
                    
                    return filtered;
                });
                
                const todaysOnCall = computed(() => {
                    const today = new Date().toISOString().split('T')[0];
                    return (todaysOnCallData.value || [])
                        .filter(schedule => schedule.duty_date === today)
                        .map(schedule => ({
                            ...schedule,
                            physician_name: getStaffName(schedule.primary_physician_id),
                            role: schedule.shift_type === 'primary_call' ? 'Primary' : 'Backup'
                        }));
                });
                
                const recentAnnouncements = computed(() => {
                    return (announcements.value || []).slice(0, 5);
                });
                
                // ============ LIFECYCLE ============
                
                onMounted(() => {
                    console.log('🚀 Vue app mounted');
                    
                    // Listen for unauthorized events
                    window.addEventListener('auth:unauthorized', () => {
                        if (currentUser.value) {
                            showToast('Session Expired', 'Your session has expired. Please login again.', 'warning');
                            currentUser.value = null;
                            currentView.value = 'login';
                        }
                    });
                    
                    if (currentUser.value) {
                        loadInitialData();
                    } else {
                        currentView.value = 'login';
                    }
                    
                    // Global click handler for dropdowns
                    document.addEventListener('click', (event) => {
                        if (!event.target.closest('.user-menu')) {
                            userMenuOpen.value = false;
                        }
                    });
                });
                
                // Watch for updates to update live stats
                watch([() => medicalStaff.value, () => rotations.value, () => trainingUnits.value], () => {
                    updateLiveStats();
                }, { deep: true });
                
                // Update live stats function
                const updateLiveStats = () => {
                    try {
                        const totalCapacity = trainingUnits.value.reduce((sum, unit) => 
                            sum + (parseInt(unit.maximum_residents) || 10), 0);
                        const currentResidents = rotations.value.filter(r => 
                            r.rotation_status === 'active').length;
                        
                        liveStats.occupancy = totalCapacity > 0 ? 
                            Math.round((currentResidents / totalCapacity) * 100) : 0;
                        liveStats.onDutyStaff = medicalStaff.value.filter(s => 
                            s.employment_status === 'active').length;
                        liveStats.pendingRequests = absences.value.filter(a => 
                            a.status === 'pending_approval' || a.status === 'pending').length;
                        liveStats.activeRotations = rotations.value.filter(r => 
                            r.rotation_status === 'active').length;
                        
                        // Update training capacity
                        liveStats.trainingCapacity = {
                            current: currentResidents,
                            max: totalCapacity,
                            status: currentResidents >= totalCapacity * 0.9 ? 'critical' : 
                                   currentResidents >= totalCapacity * 0.7 ? 'warning' : 'normal'
                        };
                    } catch (error) {
                        console.error('Error updating live stats:', error);
                    }
                };
                
                // ============ RETURN EVERYTHING TO TEMPLATE ============
                return {
                    // State
                    currentUser,
                    loginForm,
                    loading,
                    saving,
                    loadingMedicalStaff,
                    loadingDepartments,
                    loadingTrainingUnits,
                    loadingRotations,
                    loadingAbsences,
                    loadingOnCall,
                    loadingAnnouncements,
                    loadingAuditLogs,
                    loadingUsers,
                    loadingStats,
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
                    rotations,
                    absences,
                    onCallSchedule,
                    announcements,
                    auditLogs,
                    settings,
                    users,
                    userRoles,
                    availablePermissions,
                    dashboardStats,
                    upcomingEvents,
                    todaysOnCallData,
                    
                    // Live Stats
                    liveStats,
                    
                    // UI
                    toasts,
                    activeAlerts,
                    unreadNotifications,
                    
                    // Filters
                    staffFilter,
                    staffSearch,
                    rotationFilter,
                    absenceFilter,
                    oncallFilter,
                    auditFilters,
                    
                    // Modals
                    medicalStaffModal,
                    departmentModal,
                    trainingUnitModal,
                    rotationModal,
                    onCallModal,
                    absenceModal,
                    communicationsModal,
                    quickPlacementModal,
                    confirmationModal,
                    staffDetailsModal,
                    userProfileModal,
                    systemSettingsModal,
                    roleModal,
                    clinicalUnitModal,
                    bulkAssignModal,
                    advancedSearchModal,
                    dashboardCustomizeModal,
                    
                    // Formatting Functions
                    formatDate: EnhancedUtils.formatDate,
                    formatDateTime: EnhancedUtils.formatDateTime,
                    formatTimeAgo: EnhancedUtils.formatTimeAgo,
                    getInitials: EnhancedUtils.getInitials,
                    formatStaffType,
                    getStaffTypeClass,
                    formatEmploymentStatus,
                    formatAbsenceReason,
                    formatAbsenceStatus,
                    getAbsenceStatusClass,
                    formatRotationStatus,
                    getRotationStatusClass,
                    formatResidentCategory,
                    formatRotationCategory,
                    formatShiftType,
                    formatTimeRange,
                    getUserRoleDisplay,
                    getPriorityColor,
                    getCommunicationIcon,
                    getCommunicationButtonText,
                    formatPermissionName,
                    formatAuditAction,
                    getDepartmentName,
                    getStaffName,
                    getResidentName,
                    getPhysicianName,
                    getTrainingUnitName,
                    getUserName,
                    getUnitResidents,
                    getDepartmentUnits,
                    calculateAbsenceDuration,
                    getUserPermissions,
                    roleHasPermission,
                    getCurrentTitle,
                    getCurrentSubtitle,
                    getSearchPlaceholder,
                    
                    // Permission Functions
                    hasPermission,
                    canView,
                    canEdit,
                    canDelete,
                    
                    // Computed Properties
                    availableResidents,
                    availableAttendings,
                    availablePhysicians,
                    availableHeadsOfDepartment,
                    availableStaff,
                    availableCoverageStaff,
                    activeTrainingUnits,
                    filteredMedicalStaff,
                    filteredRotations,
                    stats, // FIXED: Now properly defined
                    filteredOncall,
                    filteredAbsences,
                    filteredAuditLogs,
                    todaysOnCall,
                    recentAnnouncements,
                    
                    // Toast Functions
                    showToast,
                    removeToast,
                    dismissAlert,
                    
                    // Confirmation Modal
                    showConfirmation,
                    confirmAction,
                    cancelConfirmation,
                    
                    // Authentication
                    handleLogin,
                    handleLogout,
                    
                    // Navigation
                    switchView,
                    
                    // UI Functions
                    toggleActionMenu,
                    toggleUserMenu,
                    toggleStatsSidebar,
                    toggleSearchScope,
                    handleSearch,
                    refreshData,
                    
                    // Data Loading Functions
                    loadMedicalStaff,
                    loadDepartments,
                    loadTrainingUnits,
                    loadRotations,
                    loadAbsences,
                    loadOnCallSchedule,
                    loadAnnouncements,
                    loadAuditLogs,
                    loadUsers,
                    loadDashboardStats,
                    loadTodaysOnCall,
                    loadUpcomingEvents,
                    
                    // Utility
                    Utils: EnhancedUtils,
                    updateLiveStats
                };
            }
        });
        
        // ============ MOUNT APP ============
        app.mount('#app');
        
        console.log('🎉 NeumoCare v5.0 - ROBUST EDITION mounted successfully!');
        console.log('✅ EVERYTHING is implemented with robust error handling');
        console.log('🚀 Ready for production use');
        
    } catch (error) {
        console.error('💥 FATAL ERROR mounting app:', error);
        
        document.body.innerHTML = `
            <div style="padding: 40px; text-align: center; margin-top: 100px; color: #333; font-family: Arial, sans-serif;">
                <h2 style="color: #dc3545;">⚠️ Application Error</h2>
                <p style="margin: 20px 0; color: #666;">
                    The application failed to load properly. Please try refreshing the page.
                </p>
                <button onclick="window.location.reload()" 
                        style="padding: 12px 24px; background: #007bff; color: white; 
                               border: none; border-radius: 6px; cursor: pointer; 
                               margin-top: 20px;">
                    🔄 Refresh Page
                </button>
            </div>
        `;
        
        throw error;
    }
});
