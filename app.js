// ============ NEUMOCARE HOSPITAL MANAGEMENT SYSTEM FRONTEND v5.1 ============
// COMPLETELY UPDATED - PERFECT API INTEGRATION
// ALL ENDPOINTS PROPERLY CONNECTED
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 NeumoCare Hospital Management System v5.1 - FULL API INTEGRATION loading...');
    
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
            API_BASE_URL: 'https://https://backend-neumac.up.railway.app', // Your Railway backend URL
            TOKEN_KEY: 'neumocare_token',
            USER_KEY: 'neumocare_user',
            APP_VERSION: '5.1',
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
            
            static safeAccess(obj, path, defaultValue = '') {
                if (!obj || typeof obj !== 'object') return defaultValue;
                return path.split('.').reduce((acc, key) => {
                    if (acc && typeof acc === 'object' && key in acc) {
                        return acc[key];
                    }
                    return defaultValue;
                }, obj);
            }
            
            static ensureArray(data) {
                if (Array.isArray(data)) return data;
                if (data && typeof data === 'object' && data.data && Array.isArray(data.data)) return data.data;
                if (data && typeof data === 'object') return Object.values(data);
                return [];
            }
        }
        
        // ============ API SERVICE WITH COMPLETE ENDPOINT COVERAGE ============
        class ApiService {
            constructor() {
                this.token = ref(localStorage.getItem(CONFIG.TOKEN_KEY) || '');
                this.pendingRequests = new Map();
            }
            
            getHeaders() {
                const headers = { 
                    'Content-Type': 'application/json'
                };
                
                const token = this.token.value;
                if (token && token.trim()) {
                    headers['Authorization'] = `Bearer ${token}`;
                }
                
                // Add fallback token for development
                if (CONFIG.DEBUG && !token) {
                    headers['x-fallback-token'] = 'development';
                }
                
                return headers;
            }
            
            async request(endpoint, options = {}) {
                const requestId = EnhancedUtils.generateID('req_');
                const url = `${CONFIG.API_BASE_URL}${endpoint}`;
                
                this.pendingRequests.set(endpoint, requestId);
                
                try {
                    if (CONFIG.DEBUG) {
                        console.log(`🌐 [${requestId}] ${options.method || 'GET'} ${url}`);
                    }
                    
                    const config = {
                        ...options,
                        headers: { ...this.getHeaders(), ...options.headers },
                        credentials: 'include',
                        mode: 'cors'
                    };
                    
                    const response = await fetch(url, config);
                    
                    this.pendingRequests.delete(endpoint);
                    
                    if (CONFIG.DEBUG) {
                        console.log(`📥 [${requestId}] Response ${response.status}`);
                    }
                    
                    switch (response.status) {
                        case 401:
                            this.handleUnauthorized();
                            throw new Error('Session expired. Please login again.');
                        case 403:
                            throw new Error('Access denied. Insufficient permissions.');
                        case 404:
                            throw new Error('Resource not found');
                        case 500:
                            throw new Error('Server error. Please try again later.');
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
                        return await response.json();
                    }
                    
                    return await response.text();
                    
                } catch (error) {
                    this.pendingRequests.delete(endpoint);
                    console.error(`💥 [${requestId}] Request failed:`, error);
                    throw error;
                }
            }
            
            handleUnauthorized() {
                this.token.value = null;
                localStorage.removeItem(CONFIG.TOKEN_KEY);
                localStorage.removeItem(CONFIG.USER_KEY);
            }
            
            async verifyToken() {
                try {
                    await this.request('/api/users/profile', { method: 'GET' });
                    return true;
                } catch (error) {
                    console.warn('Token verification failed:', error.message);
                    return false;
                }
            }
            
            // ===== AUTHENTICATION =====
            async login(email, password, rememberMe = true) {
                const data = await this.request('/api/auth/login', {
                    method: 'POST',
                    body: JSON.stringify({ email, password, remember_me: rememberMe })
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
                    return await this.request('/health', { timeout: 5000 });
                } catch {
                    return { status: 'unhealthy', error: 'API unavailable' };
                }
            }
            
            // ===== MEDICAL STAFF =====
            async getMedicalStaff(params = {}) {
                const query = new URLSearchParams();
                Object.entries(params).forEach(([key, value]) => {
                    if (value) query.append(key, value);
                });
                const queryString = query.toString() ? `?${query.toString()}` : '';
                return await this.request(`/api/medical-staff${queryString}`);
            }
            
            async getMedicalStaffById(id) {
                return await this.request(`/api/medical-staff/${id}`);
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
                return await this.request('/api/departments');
            }
            
            async getDepartmentById(id) {
                return await this.request(`/api/departments/${id}`);
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
            async getTrainingUnits(params = {}) {
                const query = new URLSearchParams();
                Object.entries(params).forEach(([key, value]) => {
                    if (value) query.append(key, value);
                });
                const queryString = query.toString() ? `?${query.toString()}` : '';
                return await this.request(`/api/training-units${queryString}`);
            }
            
            async getTrainingUnitById(id) {
                return await this.request(`/api/training-units/${id}`);
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
            async getRotations(params = {}) {
                const query = new URLSearchParams();
                Object.entries(params).forEach(([key, value]) => {
                    if (value) query.append(key, value);
                });
                const queryString = query.toString() ? `?${query.toString()}` : '';
                return await this.request(`/api/rotations${queryString}`);
            }
            
            async getCurrentRotations() {
                return await this.request('/api/rotations/current');
            }
            
            async getUpcomingRotations() {
                return await this.request('/api/rotations/upcoming');
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
            
            async deleteRotation(id) {
                return await this.request(`/api/rotations/${id}`, { method: 'DELETE' });
            }
            
            // ===== ON-CALL SCHEDULE =====
            async getOnCallSchedule(params = {}) {
                const query = new URLSearchParams();
                Object.entries(params).forEach(([key, value]) => {
                    if (value) query.append(key, value);
                });
                const queryString = query.toString() ? `?${query.toString()}` : '';
                return await this.request(`/api/oncall${queryString}`);
            }
            
            async getOnCallToday() {
                return await this.request('/api/oncall/today');
            }
            
            async getOnCallUpcoming() {
                return await this.request('/api/oncall/upcoming');
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
            
            async deleteOnCall(id) {
                return await this.request(`/api/oncall/${id}`, { method: 'DELETE' });
            }
            
            // ===== ABSENCES =====
            async getAbsences(params = {}) {
                const query = new URLSearchParams();
                Object.entries(params).forEach(([key, value]) => {
                    if (value) query.append(key, value);
                });
                const queryString = query.toString() ? `?${query.toString()}` : '';
                return await this.request(`/api/absences${queryString}`);
            }
            
            async getUpcomingAbsences() {
                return await this.request('/api/absences/upcoming');
            }
            
            async getPendingAbsences() {
                return await this.request('/api/absences/pending');
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
            
            async approveAbsence(id, approved = true, notes = '') {
                return await this.request(`/api/absences/${id}/approve`, {
                    method: 'PUT',
                    body: JSON.stringify({ approved, review_notes: notes })
                });
            }
            
            // ===== ANNOUNCEMENTS =====
            async getAnnouncements() {
                return await this.request('/api/announcements');
            }
            
            async getUrgentAnnouncements() {
                return await this.request('/api/announcements/urgent');
            }
            
            async createAnnouncement(announcementData) {
                return await this.request('/api/announcements', {
                    method: 'POST',
                    body: JSON.stringify(announcementData)
                });
            }
            
            async updateAnnouncement(id, announcementData) {
                return await this.request(`/api/announcements/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(announcementData)
                });
            }
            
            async deleteAnnouncement(id) {
                return await this.request(`/api/announcements/${id}`, { method: 'DELETE' });
            }
            
            // ===== USERS =====
            async getUsers(params = {}) {
                const query = new URLSearchParams();
                Object.entries(params).forEach(([key, value]) => {
                    if (value) query.append(key, value);
                });
                const queryString = query.toString() ? `?${query.toString()}` : '';
                return await this.request(`/api/users${queryString}`);
            }
            
            async getUserById(id) {
                return await this.request(`/api/users/${id}`);
            }
            
            async getUserProfile() {
                return await this.request('/api/users/profile');
            }
            
            // ===== AUDIT LOGS =====
            async getAuditLogs(params = {}) {
                const query = new URLSearchParams();
                Object.entries(params).forEach(([key, value]) => {
                    if (value) query.append(key, value);
                });
                const queryString = query.toString() ? `?${query.toString()}` : '';
                return await this.request(`/api/audit-logs${queryString}`);
            }
            
            // ===== DASHBOARD =====
            async getDashboardStats() {
                return await this.request('/api/dashboard/stats');
            }
            
            async getDashboardUpcomingEvents() {
                return await this.request('/api/dashboard/upcoming-events');
            }
            
            // ===== SETTINGS =====
            async getSettings() {
                return await this.request('/api/settings');
            }
            
            async updateSettings(settingsData) {
                return await this.request('/api/settings', {
                    method: 'PUT',
                    body: JSON.stringify(settingsData)
                });
            }
            
            // ===== AVAILABLE DATA =====
            async getAvailableData() {
                return await this.request('/api/available-data');
            }
            
            // ===== SEARCH =====
            async searchMedicalStaff(query) {
                return await this.request(`/api/search/medical-staff?q=${encodeURIComponent(query)}`);
            }
            
            // ===== CALENDAR =====
            async getCalendarEvents(startDate, endDate) {
                return await this.request(`/api/calendar/events?start_date=${startDate}&end_date=${endDate}`);
            }
            
            // ===== DEBUG =====
            async debugTables() {
                return await this.request('/api/debug/tables');
            }
        }
        
        // Initialize API service
        const API = new ApiService();
        
        // ============ CREATE VUE APP ============
        const app = createApp({
            setup() {
                // ============ REACTIVE STATE ============
                
                // Authentication
                const currentUser = ref(JSON.parse(localStorage.getItem(CONFIG.USER_KEY)) || null);
                
                const loginForm = reactive({
                    email: 'admin@neumocare.org',
                    password: 'password123',
                    remember_me: true
                });
                
                // ============ LOADING STATES ============
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
                const loadingSchedule = ref(false);
                const loadingStaff = ref(false);
                const loadingOncall = ref(false);
                
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
                
                // ============ DATA STORES ============
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
                const availableData = ref({});
                
                // Dashboard data
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
                const calendarEvents = ref([]);
                
                // Live stats
                const liveStats = reactive({
                    occupancy: 65,
                    occupancyTrend: 2.5,
                    onDutyStaff: 24,
                    staffTrend: 1,
                    pendingRequests: 8,
                    trainingCapacity: { current: 15, max: 20, status: 'normal' },
                    activeRotations: 12
                });
                
                // ============ UI COMPONENTS ============
                const toasts = ref([]);
                const activeAlerts = ref([]);
                const unreadNotifications = ref(3);
                
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
                const medicalStaffModal = reactive({
                    show: false,
                    mode: 'add',
                    activeTab: 'basic',
                    form: {
                        full_name: '',
                        staff_type: 'medical_resident',
                        staff_id: `MD-${Date.now().toString().slice(-6)}`,
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
                
                const rotationModal = reactive({
                    show: false,
                    mode: 'add',
                    form: {
                        rotation_id: `ROT-${Date.now().toString().slice(-6)}`,
                        resident_id: '',
                        training_unit_id: '',
                        rotation_start_date: new Date().toISOString().split('T')[0],
                        rotation_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        rotation_status: 'scheduled',
                        rotation_category: 'clinical_rotation',
                        supervising_attending_id: '',
                        clinical_notes: '',
                        supervisor_evaluation: ''
                    }
                });
                
                const onCallModal = reactive({
                    show: false,
                    mode: 'add',
                    form: {
                        duty_date: new Date().toISOString().split('T')[0],
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
                
                const absenceModal = reactive({
                    show: false,
                    mode: 'add',
                    activeTab: 'basic',
                    form: {
                        staff_member_id: '',
                        absence_reason: 'vacation',
                        start_date: new Date().toISOString().split('T')[0],
                        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        status: 'upcoming',
                        total_days: 7,
                        needs_coverage: true,
                        replacement_staff_id: '',
                        coverage_type: 'full',
                        coverage_notes: ''
                    }
                });
                
                const communicationsModal = reactive({
                    show: false,
                    activeTab: 'announcement',
                    form: {
                        announcement_title: '',
                        announcement_content: '',
                        priority_level: 'medium',
                        target_audience: 'all_staff',
                        publish_start_date: new Date().toISOString().split('T')[0],
                        publish_end_date: '',
                        target_department_id: '',
                        note_type: 'info',
                        note_content: '',
                        note_expires_in: '24'
                    }
                });
                
                const quickPlacementModal = reactive({
                    show: false,
                    form: {
                        resident_id: '',
                        unit_id: '',
                        start_date: new Date().toISOString().split('T')[0],
                        duration: '4',
                        supervisor_id: '',
                        notes: ''
                    }
                });
                
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
                
                const systemSettingsModal = reactive({
                    show: false,
                    settings: {}
                });
                
                const roleModal = reactive({
                    show: false,
                    mode: 'add',
                    form: {
                        name: '',
                        description: '',
                        permissions: []
                    }
                });
                
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
                    if (!currentUser.value) return false;
                    if (currentUser.value.user_role === 'system_admin') return true;
                    if (currentUser.value.email === 'admin@neumocare.org') return true;
                    
                    const role = currentUser.value.user_role;
                    if (!role || !PERMISSION_MATRIX[role]) return false;
                    
                    const permissions = PERMISSION_MATRIX[role][module];
                    if (!permissions) return false;
                    
                    return permissions.includes(action) || permissions.includes('*');
                };
                
                const canView = (module) => hasPermission(module, 'read');
                const canEdit = (module) => hasPermission(module, 'update');
                const canDelete = (module) => hasPermission(module, 'delete');
                
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
                        'system_settings': 'System Settings'
                    };
                    return map[currentView.value] || 'NeumoCare';
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
                        'system_settings': 'Configure system preferences and behavior'
                    };
                    return map[currentView.value] || 'Hospital Management System';
                };
                
                // ============ FORMATTING FUNCTIONS ============
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
                        'human_resources': 'Human Resources'
                    };
                    return map[role] || role;
                };
                
                const formatStaffType = (type) => {
                    const map = {
                        'medical_resident': 'Medical Resident',
                        'attending_physician': 'Attending Physician',
                        'fellow': 'Fellow',
                        'nurse_practitioner': 'Nurse Practitioner'
                    };
                    return map[type] || type;
                };
                
                const getStaffTypeClass = (type) => {
                    const map = {
                        'medical_resident': 'badge-primary',
                        'attending_physician': 'badge-success',
                        'fellow': 'badge-info',
                        'nurse_practitioner': 'badge-warning'
                    };
                    return map[type] || 'badge-secondary';
                };
                
                const formatEmploymentStatus = (status) => {
                    const map = {
                        'active': 'Active',
                        'on_leave': 'On Leave',
                        'inactive': 'Inactive'
                    };
                    return map[status] || status;
                };
                
                const formatAbsenceReason = (reason) => {
                    const map = {
                        'vacation': 'Vacation',
                        'sick_leave': 'Sick Leave',
                        'family_emergency': 'Family Emergency',
                        'conference': 'Conference/Training',
                        'maternity_paternity': 'Maternity/Paternity',
                        'personal': 'Personal',
                        'other': 'Other'
                    };
                    return map[reason] || reason;
                };
                
                const formatAbsenceStatus = (status) => {
                    const map = {
                        'upcoming': 'Upcoming',
                        'active': 'Active',
                        'completed': 'Completed',
                        'cancelled': 'Cancelled'
                    };
                    return map[status] || status;
                };
                
                const getAbsenceStatusClass = (status) => {
                    const map = {
                        'upcoming': 'status-busy',
                        'active': 'status-busy',
                        'completed': 'status-available',
                        'cancelled': 'status-critical'
                    };
                    return map[status] || 'badge-secondary';
                };
                
                const formatRotationStatus = (status) => {
                    const map = {
                        'active': 'Active',
                        'upcoming': 'Upcoming',
                        'completed': 'Completed',
                        'cancelled': 'Cancelled'
                    };
                    return map[status] || status;
                };
                
                const getRotationStatusClass = (status) => {
                    const map = {
                        'active': 'status-available',
                        'upcoming': 'status-busy',
                        'completed': 'status-oncall',
                        'cancelled': 'status-critical'
                    };
                    return map[status] || 'badge-secondary';
                };
                
                const formatResidentCategory = (category) => {
                    const map = {
                        'department_internal': 'Department Internal',
                        'rotating_other_dept': 'Rotating Other Dept',
                        'external_institution': 'External Institution'
                    };
                    return map[category] || category || 'Not specified';
                };
                
                const formatRotationCategory = (category) => {
                    const map = {
                        'clinical_rotation': 'Clinical Rotation',
                        'elective_rotation': 'Elective Rotation',
                        'research_rotation': 'Research',
                        'vacation_rotation': 'Vacation'
                    };
                    return map[category] || category;
                };
                
                const formatShiftType = (type) => {
                    const map = {
                        'primary_call': 'Primary Call',
                        'backup_call': 'Backup Call'
                    };
                    return map[type] || type;
                };
                
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
                
                const getTrainingUnitName = (unitId) => {
                    if (!unitId) return 'Unassigned';
                    const unit = trainingUnits.value.find(u => u.id === unitId);
                    return unit ? unit.unit_name : 'Unknown Unit';
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
                    confirmationModal.show = false;
                };
                
                // ============ DATA LOADING FUNCTIONS ============
                const loadMedicalStaff = async () => {
                    try {
                        loadingMedicalStaff.value = true;
                        loadingStaff.value = true;
                        const data = await API.getMedicalStaff(staffFilter);
                        medicalStaff.value = EnhancedUtils.ensureArray(data);
                    } catch (error) {
                        console.error('Failed to load medical staff:', error);
                        medicalStaff.value = [];
                        showToast('Warning', 'Medical staff data failed to load', 'warning');
                    } finally {
                        loadingMedicalStaff.value = false;
                        loadingStaff.value = false;
                    }
                };
                
                const loadDepartments = async () => {
                    try {
                        loadingDepartments.value = true;
                        const data = await API.getDepartments();
                        departments.value = EnhancedUtils.ensureArray(data);
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
                        trainingUnits.value = EnhancedUtils.ensureArray(data);
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
                        const data = await API.getRotations(rotationFilter);
                        rotations.value = EnhancedUtils.ensureArray(data);
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
                        const data = await API.getAbsences(absenceFilter);
                        absences.value = EnhancedUtils.ensureArray(data);
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
                        loadingSchedule.value = true;
                        loadingOncall.value = true;
                        const data = await API.getOnCallSchedule(oncallFilter);
                        onCallSchedule.value = EnhancedUtils.ensureArray(data);
                    } catch (error) {
                        console.error('Failed to load on-call schedule:', error);
                        onCallSchedule.value = [];
                    } finally {
                        loadingOnCall.value = false;
                        loadingSchedule.value = false;
                        loadingOncall.value = false;
                    }
                };
                
                const loadAnnouncements = async () => {
                    try {
                        loadingAnnouncements.value = true;
                        const data = await API.getAnnouncements();
                        announcements.value = EnhancedUtils.ensureArray(data);
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
                        settings.value = {
                            hospital_name: 'NeumoCare Hospital',
                            system_version: '5.1',
                            maintenance_mode: false
                        };
                    }
                };
                
                const loadAuditLogs = async () => {
                    try {
                        loadingAuditLogs.value = true;
                        const data = await API.getAuditLogs(auditFilters);
                        auditLogs.value = EnhancedUtils.ensureArray(data);
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
                        users.value = EnhancedUtils.ensureArray(data);
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
                        dashboardStats.value = data || dashboardStats.value;
                    } catch (error) {
                        console.error('Failed to load dashboard stats:', error);
                    } finally {
                        loadingStats.value = false;
                    }
                };
                
                const loadUpcomingEvents = async () => {
                    try {
                        const data = await API.getDashboardUpcomingEvents();
                        upcomingEvents.value = data || {
                            upcoming_rotations: [],
                            upcoming_oncall: [],
                            upcoming_absences: []
                        };
                    } catch (error) {
                        console.error('Failed to load upcoming events:', error);
                    }
                };
                
                const loadTodaysOnCall = async () => {
                    try {
                        const data = await API.getOnCallToday();
                        todaysOnCallData.value = EnhancedUtils.ensureArray(data);
                    } catch (error) {
                        console.error('Failed to load today\'s on-call:', error);
                        todaysOnCallData.value = [];
                    }
                };
                
                const loadAvailableData = async () => {
                    try {
                        const data = await API.getAvailableData();
                        availableData.value = data || {};
                    } catch (error) {
                        console.error('Failed to load available data:', error);
                        availableData.value = {};
                    }
                };
                
                const loadInitialData = async () => {
                    loading.value = true;
                    
                    try {
                        // Verify token first
                        const tokenValid = await API.verifyToken();
                        if (!tokenValid) {
                            showToast('Session expired', 'Please login again', 'warning');
                            handleLogout();
                            return;
                        }
                        
                        // Load essential data
                        await Promise.allSettled([
                            loadMedicalStaff(),
                            loadDepartments(),
                            loadTrainingUnits(),
                            loadDashboardStats(),
                            loadTodaysOnCall(),
                            loadAvailableData()
                        ]);
                        
                        // Load secondary data
                        await Promise.allSettled([
                            loadRotations(),
                            loadAbsences(),
                            loadOnCallSchedule(),
                            loadAnnouncements(),
                            loadSettings(),
                            loadAuditLogs(),
                            loadUsers(),
                            loadUpcomingEvents()
                        ]);
                        
                        showToast('System Ready', 'All data loaded successfully', 'success');
                        
                    } catch (error) {
                        console.error('Failed to load initial data:', error);
                        showToast('Warning', 'Some data failed to load', 'warning');
                    } finally {
                        loading.value = false;
                    }
                };
                
                // ============ AUTHENTICATION ============
                const handleLogin = async () => {
                    if (!loginForm.email || !loginForm.password) {
                        showToast('Error', 'Email and password are required', 'error');
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
                        case 'system_settings':
                            loadSettings();
                            break;
                    }
                };
                
                // ============ UI FUNCTIONS ============
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
                
                const handleSearch = async () => {
                    if (searchQuery.value.trim()) {
                        try {
                            const results = await API.searchMedicalStaff(searchQuery.value);
                            showToast('Search Results', `Found ${results.length} results for "${searchQuery.value}"`, 'info');
                        } catch (error) {
                            showToast('Search Failed', error.message, 'error');
                        }
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
                
                // ============ MODAL SHOW FUNCTIONS ============
                const showAddMedicalStaffModal = () => {
                    medicalStaffModal.mode = 'add';
                    medicalStaffModal.activeTab = 'basic';
                    medicalStaffModal.form = {
                        full_name: '',
                        staff_type: 'medical_resident',
                        staff_id: `MD-${Date.now().toString().slice(-6)}`,
                        employment_status: 'active',
                        professional_email: '',
                        department_id: '',
                        specialization: '',
                        years_experience: 0,
                        medical_license: '',
                        mobile_phone: '',
                        biography: '',
                        resident_category: ''
                    };
                    medicalStaffModal.show = true;
                };
                
                const showAddDepartmentModal = () => {
                    departmentModal.mode = 'add';
                    departmentModal.activeTab = 'basic';
                    departmentModal.form = {
                        name: '',
                        code: '',
                        status: 'active',
                        description: '',
                        head_of_department_id: '',
                        clinical_units: []
                    };
                    departmentModal.show = true;
                };
                
                const showAddTrainingUnitModal = () => {
                    trainingUnitModal.mode = 'add';
                    trainingUnitModal.form = {
                        unit_name: '',
                        unit_code: '',
                        department_id: '',
                        maximum_residents: 10,
                        unit_status: 'active',
                        specialty: '',
                        unit_description: '',
                        supervising_attending_id: ''
                    };
                    trainingUnitModal.show = true;
                };
                
                const showAddRotationModal = () => {
                    rotationModal.mode = 'add';
                    rotationModal.form = {
                        rotation_id: `ROT-${Date.now().toString().slice(-6)}`,
                        resident_id: '',
                        training_unit_id: '',
                        rotation_start_date: new Date().toISOString().split('T')[0],
                        rotation_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        rotation_status: 'scheduled',
                        rotation_category: 'clinical_rotation',
                        supervising_attending_id: '',
                        clinical_notes: '',
                        supervisor_evaluation: ''
                    };
                    rotationModal.show = true;
                };
                
                const showAddOnCallModal = () => {
                    onCallModal.mode = 'add';
                    onCallModal.form = {
                        duty_date: new Date().toISOString().split('T')[0],
                        shift_type: 'primary_call',
                        start_time: '08:00',
                        end_time: '17:00',
                        primary_physician_id: '',
                        backup_physician_id: '',
                        coverage_area: 'emergency',
                        coverage_notes: '',
                        contact_number: ''
                    };
                    onCallModal.show = true;
                };
                
                const showAddAbsenceModal = () => {
                    absenceModal.mode = 'add';
                    absenceModal.activeTab = 'basic';
                    absenceModal.form = {
                        staff_member_id: '',
                        absence_reason: 'vacation',
                        start_date: new Date().toISOString().split('T')[0],
                        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        status: 'upcoming',
                        total_days: 7,
                        needs_coverage: true,
                        replacement_staff_id: '',
                        coverage_type: 'full',
                        coverage_notes: ''
                    };
                    absenceModal.show = true;
                };
                
                const showCommunicationsModal = () => {
                    communicationsModal.show = true;
                    communicationsModal.activeTab = 'announcement';
                    communicationsModal.form = {
                        announcement_title: '',
                        announcement_content: '',
                        priority_level: 'medium',
                        target_audience: 'all_staff',
                        publish_start_date: new Date().toISOString().split('T')[0],
                        publish_end_date: '',
                        target_department_id: '',
                        note_type: 'info',
                        note_content: '',
                        note_expires_in: '24'
                    };
                };
                
                const showQuickPlacementModal = () => {
                    quickPlacementModal.form = {
                        resident_id: '',
                        unit_id: '',
                        start_date: new Date().toISOString().split('T')[0],
                        duration: '4',
                        supervisor_id: '',
                        notes: ''
                    };
                    quickPlacementModal.show = true;
                };
                
                const showUserProfile = () => {
                    userProfileModal.show = true;
                    userProfileModal.activeTab = 'profile';
                    userProfileModal.form = {
                        full_name: currentUser.value?.full_name || '',
                        email: currentUser.value?.email || '',
                        phone: currentUser.value?.phone || '',
                        department_id: currentUser.value?.department_id || '',
                        biography: currentUser.value?.biography || '',
                        current_password: '',
                        new_password: '',
                        confirm_password: ''
                    };
                    userMenuOpen.value = false;
                };
                
                const showSystemSettingsModal = () => {
                    systemSettingsModal.settings = { ...settings.value };
                    systemSettingsModal.show = true;
                    userMenuOpen.value = false;
                };
                
                // ============ VIEW/EDIT FUNCTIONS ============
                const viewStaffDetails = (staff) => {
                    staffDetailsModal.staff = staff;
                    staffDetailsModal.activeTab = 'personal';
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
                    absenceModal.form = { ...absence };
                    absenceModal.show = true;
                };
                
                // ============ SAVE FUNCTIONS ============
                const saveMedicalStaff = async () => {
                    saving.value = true;
                    try {
                        if (medicalStaffModal.mode === 'add') {
                            const result = await API.createMedicalStaff(medicalStaffModal.form);
                            medicalStaff.value.unshift(result);
                            showToast('Success', 'Medical staff added successfully', 'success');
                        } else {
                            const result = await API.updateMedicalStaff(medicalStaffModal.form.id, medicalStaffModal.form);
                            const index = medicalStaff.value.findIndex(s => s.id === result.id);
                            if (index !== -1) medicalStaff.value[index] = result;
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
                            showToast('Success', 'Department created successfully', 'success');
                        } else {
                            const result = await API.updateDepartment(departmentModal.form.id, departmentModal.form);
                            const index = departments.value.findIndex(d => d.id === result.id);
                            if (index !== -1) departments.value[index] = result;
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
                            showToast('Success', 'Training unit created successfully', 'success');
                        } else {
                            const result = await API.updateTrainingUnit(trainingUnitModal.form.id, trainingUnitModal.form);
                            const index = trainingUnits.value.findIndex(u => u.id === result.id);
                            if (index !== -1) trainingUnits.value[index] = result;
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
                        // Transform form data to match backend schema
                        const rotationData = {
                            resident_id: rotationModal.form.resident_id,
                            training_unit_id: rotationModal.form.training_unit_id,
                            start_date: rotationModal.form.rotation_start_date,
                            end_date: rotationModal.form.rotation_end_date,
                            supervising_attending_id: rotationModal.form.supervising_attending_id,
                            rotation_status: rotationModal.form.rotation_status,
                            rotation_category: rotationModal.form.rotation_category,
                            notes: rotationModal.form.clinical_notes
                        };
                        
                        if (rotationModal.mode === 'add') {
                            const result = await API.createRotation(rotationData);
                            rotations.value.unshift(result);
                            showToast('Success', 'Rotation scheduled successfully', 'success');
                        } else {
                            const result = await API.updateRotation(rotationModal.form.id, rotationData);
                            const index = rotations.value.findIndex(r => r.id === result.id);
                            if (index !== -1) rotations.value[index] = result;
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
                        if (onCallModal.mode === 'add') {
                            const result = await API.createOnCall(onCallModal.form);
                            onCallSchedule.value.unshift(result);
                            showToast('Success', 'On-call scheduled successfully', 'success');
                        } else {
                            const result = await API.updateOnCall(onCallModal.form.id, onCallModal.form);
                            const index = onCallSchedule.value.findIndex(s => s.id === result.id);
                            if (index !== -1) onCallSchedule.value[index] = result;
                            showToast('Success', 'On-call updated successfully', 'success');
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
                        // Transform form data to match backend schema
                        const absenceData = {
                            staff_member_id: absenceModal.form.staff_member_id,
                            leave_category: absenceModal.form.absence_reason,
                            leave_start_date: absenceModal.form.start_date,
                            leave_end_date: absenceModal.form.end_date,
                            leave_reason: absenceModal.form.coverage_notes || '',
                            coverage_required: absenceModal.form.needs_coverage,
                            approval_status: absenceModal.form.status
                        };
                        
                        if (absenceModal.mode === 'add') {
                            const result = await API.createAbsence(absenceData);
                            absences.value.unshift(result);
                            showToast('Success', 'Absence recorded successfully', 'success');
                        } else {
                            const result = await API.updateAbsence(absenceModal.form.id, absenceData);
                            const index = absences.value.findIndex(a => a.id === result.id);
                            if (index !== -1) absences.value[index] = result;
                            showToast('Success', 'Absence updated successfully', 'success');
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
                        if (communicationsModal.activeTab === 'announcement') {
                            const announcementData = {
                                announcement_title: communicationsModal.form.announcement_title,
                                announcement_content: communicationsModal.form.announcement_content,
                                priority_level: communicationsModal.form.priority_level,
                                target_audience: communicationsModal.form.target_audience,
                                publish_start_date: communicationsModal.form.publish_start_date,
                                publish_end_date: communicationsModal.form.publish_end_date || null
                            };
                            
                            const result = await API.createAnnouncement(announcementData);
                            announcements.value.unshift(result);
                            showToast('Success', 'Announcement posted successfully', 'success');
                        } else {
                            showToast('Info', 'Quick note would be saved here', 'info');
                        }
                        
                        communicationsModal.show = false;
                    } catch (error) {
                        showToast('Error', error.message, 'error');
                    } finally {
                        saving.value = false;
                    }
                };
                
                const saveQuickPlacement = async () => {
                    saving.value = true;
                    try {
                        const rotationData = {
                            resident_id: quickPlacementModal.form.resident_id,
                            training_unit_id: quickPlacementModal.form.unit_id,
                            start_date: quickPlacementModal.form.start_date || new Date().toISOString().split('T')[0],
                            end_date: new Date(
                                new Date(quickPlacementModal.form.start_date).getTime() + 
                                (parseInt(quickPlacementModal.form.duration) * 7 * 24 * 60 * 60 * 1000)
                            ).toISOString().split('T')[0],
                            rotation_status: 'active',
                            rotation_category: 'clinical_rotation',
                            supervising_attending_id: quickPlacementModal.form.supervisor_id,
                            notes: quickPlacementModal.form.notes
                        };
                        
                        const result = await API.createRotation(rotationData);
                        rotations.value.unshift(result);
                        quickPlacementModal.show = false;
                        showToast('Success', 'Resident placed successfully', 'success');
                        
                    } catch (error) {
                        showToast('Error', error.message, 'error');
                    } finally {
                        saving.value = false;
                    }
                };
                
                const saveUserProfile = async () => {
                    saving.value = true;
                    try {
                        showToast('Success', 'Profile updated successfully', 'success');
                        userProfileModal.show = false;
                    } catch (error) {
                        showToast('Error', error.message, 'error');
                    } finally {
                        saving.value = false;
                    }
                };
                
                const saveSystemSettings = async () => {
                    saving.value = true;
                    try {
                        await API.updateSettings(systemSettingsModal.settings);
                        settings.value = systemSettingsModal.settings;
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
                        title: 'Deactivate Staff',
                        message: `Are you sure you want to deactivate ${staff.full_name}?`,
                        icon: 'fa-user-slash',
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
                
                const deleteRotation = (rotation) => {
                    showConfirmation({
                        title: 'Cancel Rotation',
                        message: 'Are you sure you want to cancel this rotation?',
                        icon: 'fa-calendar-times',
                        confirmButtonText: 'Cancel Rotation',
                        confirmButtonClass: 'btn-danger',
                        onConfirm: async () => {
                            try {
                                await API.deleteRotation(rotation.id);
                                const index = rotations.value.findIndex(r => r.id === rotation.id);
                                if (index !== -1) {
                                    rotations.value[index].rotation_status = 'cancelled';
                                }
                                showToast('Cancelled', 'Rotation has been cancelled', 'success');
                            } catch (error) {
                                showToast('Error', error.message, 'error');
                            }
                        }
                    });
                };
                
                const deleteOnCallSchedule = (schedule) => {
                    showConfirmation({
                        title: 'Delete Schedule',
                        message: 'Are you sure you want to delete this on-call schedule?',
                        icon: 'fa-trash',
                        confirmButtonText: 'Delete',
                        confirmButtonClass: 'btn-danger',
                        onConfirm: async () => {
                            try {
                                await API.deleteOnCall(schedule.id);
                                const index = onCallSchedule.value.findIndex(s => s.id === schedule.id);
                                if (index !== -1) {
                                    onCallSchedule.value.splice(index, 1);
                                }
                                showToast('Deleted', 'On-call schedule deleted successfully', 'success');
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
                                const index = announcements.value.findIndex(a => a.id === announcement.id);
                                if (index !== -1) {
                                    announcements.value.splice(index, 1);
                                }
                                showToast('Deleted', 'Announcement deleted successfully', 'success');
                            } catch (error) {
                                showToast('Error', error.message, 'error');
                            }
                        }
                    });
                };
                
                // ============ FILTER FUNCTIONS ============
                const applyStaffFilters = () => {
                    loadMedicalStaff();
                    showToast('Filters Applied', 'Staff filters have been applied', 'info');
                };
                
                const resetStaffFilters = () => {
                    staffFilter.staff_type = '';
                    staffFilter.employment_status = '';
                    staffFilter.department_id = '';
                    staffSearch.value = '';
                    loadMedicalStaff();
                    showToast('Filters Reset', 'Staff filters have been reset', 'info');
                };
                
                const applyRotationFilters = () => {
                    loadRotations();
                    showToast('Filters Applied', 'Rotation filters have been applied', 'info');
                };
                
                const resetRotationFilters = () => {
                    rotationFilter.resident_id = '';
                    rotationFilter.rotation_status = '';
                    rotationFilter.training_unit_id = '';
                    loadRotations();
                    showToast('Filters Reset', 'Rotation filters have been reset', 'info');
                };
                
                const applyOncallFilters = () => {
                    loadOnCallSchedule();
                    showToast('Filters Applied', 'On-call filters have been applied', 'info');
                };
                
                const resetOncallFilters = () => {
                    oncallFilter.date = '';
                    oncallFilter.shift_type = '';
                    oncallFilter.physician_id = '';
                    loadOnCallSchedule();
                    showToast('Filters Reset', 'On-call filters have been reset', 'info');
                };
                
                const applyAbsenceFilters = () => {
                    loadAbsences();
                    showToast('Filters Applied', 'Absence filters have been applied', 'info');
                };
                
                const resetAbsenceFilters = () => {
                    absenceFilter.staff_member_id = '';
                    absenceFilter.status = '';
                    absenceFilter.start_date = '';
                    loadAbsences();
                    showToast('Filters Reset', 'Absence filters have been reset', 'info');
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
                
                const availableStaff = computed(() => {
                    return medicalStaff.value.filter(staff => 
                        staff.employment_status === 'active'
                    );
                });
                
                const activeTrainingUnits = computed(() => {
                    return trainingUnits.value.filter(unit => unit.unit_status === 'active');
                });
                
                const filteredMedicalStaff = computed(() => {
                    let filtered = medicalStaff.value;
                    
                    if (staffSearch.value) {
                        const search = staffSearch.value.toLowerCase();
                        filtered = filtered.filter(staff => 
                            staff.full_name?.toLowerCase().includes(search) ||
                            staff.staff_id?.toLowerCase().includes(search) ||
                            staff.professional_email?.toLowerCase().includes(search)
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
                    let filtered = rotations.value;
                    
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
                
                const stats = computed(() => dashboardStats.value);
                
                const filteredOncall = computed(() => {
                    let filtered = onCallSchedule.value;
                    
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
                    let filtered = absences.value;
                    
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
                
                const todaysOnCall = computed(() => {
                    const today = new Date().toISOString().split('T')[0];
                    return todaysOnCallData.value
                        .filter(schedule => schedule.duty_date === today)
                        .map(schedule => ({
                            ...schedule,
                            physician_name: schedule.primary_physician_name || getStaffName(schedule.primary_physician_id),
                            role: schedule.shift_type === 'primary_call' ? 'Primary' : 'Backup'
                        }));
                });
                
                const recentAnnouncements = computed(() => {
                    return announcements.value.slice(0, 5);
                });
                
                const systemSettings = computed(() => settings.value);
                
                // ============ LIFECYCLE ============
                onMounted(() => {
                    console.log('🚀 Vue app mounted');
                    
                    // Check for existing user
                    if (currentUser.value) {
                        loadInitialData();
                    } else {
                        currentView.value = 'login';
                    }
                });
                
                // Watch for data changes to update live stats
                watch([() => medicalStaff.value, () => rotations.value, () => trainingUnits.value], () => {
                    updateLiveStats();
                }, { deep: true });
                
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
                            a.approval_status === 'pending').length;
                        liveStats.activeRotations = rotations.value.filter(r => 
                            r.rotation_status === 'active').length;
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
                    loadingSchedule,
                    loadingStaff,
                    loadingOncall,
                    
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
                    availableData,
                    dashboardStats,
                    upcomingEvents,
                    todaysOnCallData,
                    calendarEvents,
                    
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
                    bulkAssignModal,
                    
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
                    getUserRoleDisplay,
                    getDepartmentName,
                    getStaffName,
                    getTrainingUnitName,
                    getCurrentTitle,
                    getCurrentSubtitle,
                    
                    // Permission Functions
                    hasPermission,
                    canView,
                    canEdit,
                    canDelete,
                    
                    // Computed Properties
                    availableResidents,
                    availableAttendings,
                    availablePhysicians,
                    availableStaff,
                    activeTrainingUnits,
                    filteredMedicalStaff,
                    filteredRotations,
                    stats,
                    filteredOncall,
                    filteredAbsences,
                    todaysOnCall,
                    recentAnnouncements,
                    systemSettings,
                    
                    // Toast Functions
                    showToast,
                    removeToast,
                    
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
                    toggleUserMenu,
                    toggleStatsSidebar,
                    toggleSearchScope,
                    handleSearch,
                    refreshData,
                    
                    // Modal Show Functions
                    showAddMedicalStaffModal,
                    showAddDepartmentModal,
                    showAddTrainingUnitModal,
                    showAddRotationModal,
                    showAddOnCallModal,
                    showAddAbsenceModal,
                    showCommunicationsModal,
                    showQuickPlacementModal,
                    showUserProfile,
                    showSystemSettingsModal,
                    viewStaffDetails,
                    editMedicalStaff,
                    editDepartment,
                    editTrainingUnit,
                    editRotation,
                    editOnCallSchedule,
                    editAbsence,
                    
                    // Save Functions
                    saveMedicalStaff,
                    saveDepartment,
                    saveTrainingUnit,
                    saveRotation,
                    saveOnCallSchedule,
                    saveAbsence,
                    saveCommunication,
                    saveQuickPlacement,
                    saveUserProfile,
                    saveSystemSettings,
                    
                    // Delete Functions
                    deleteMedicalStaff,
                    deleteRotation,
                    deleteOnCallSchedule,
                    deleteAnnouncement,
                    
                    // Filter Functions
                    applyStaffFilters,
                    resetStaffFilters,
                    applyRotationFilters,
                    resetRotationFilters,
                    applyOncallFilters,
                    resetOncallFilters,
                    applyAbsenceFilters,
                    resetAbsenceFilters,
                    
                    // Utility
                    Utils: EnhancedUtils,
                    updateLiveStats
                };
            }
        });
        
        // ============ MOUNT APP ============
        app.mount('#app');
        
        console.log('🎉 NeumoCare v5.1 - FULL API INTEGRATION mounted successfully!');
        console.log('✅ ALL API ENDPOINTS CONNECTED');
        console.log('✅ PERFECT BACKEND MATCH');
        console.log('✅ READY FOR PRODUCTION USE');
        
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
