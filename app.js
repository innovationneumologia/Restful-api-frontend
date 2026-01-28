// ============ NEUMOCARE HOSPITAL MANAGEMENT SYSTEM FRONTEND ============
// COMPLETE PRODUCTION-READY FRONTEND v3.5 - FULLY INTEGRATED
// ================================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('NeumoCare Hospital Management System Frontend v3.5 loading...');
    
    try {
        if (typeof Vue === 'undefined') throw new Error('Vue.js failed to load. Please refresh.');
        
        console.log('Vue.js loaded successfully:', Vue.version);
        const { createApp, ref, reactive, computed, onMounted } = Vue;
        const API_BASE_URL = window.API_BASE_URL || 'https://bacend-production.up.railway.app';
        
        // ============ UTILITIES ============
        const Utils = {
            formatDate: (dateString) => dateString ? new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
            formatDateTime: (dateString) => dateString ? new Date(dateString).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '',
            formatTimeAgo: (dateString) => {
                if (!dateString) return '';
                const date = new Date(dateString), now = new Date(), diffMs = now - date;
                const diffMins = Math.floor(diffMs / 60000), diffHours = Math.floor(diffMs / 3600000), diffDays = Math.floor(diffMs / 86400000);
                if (diffMins < 1) return 'Just now';
                if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
                if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
                if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
                return Utils.formatDate(dateString);
            },
            getInitials: (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : '??',
            generateID: () => Date.now().toString(36) + Math.random().toString(36).substr(2),
            downloadCSV: (data, filename) => {
                const blob = new Blob([data], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            },
            downloadJSON: (data, filename) => {
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            },
            calculateDays: (start, end) => {
                try {
                    const startDate = new Date(start);
                    const endDate = new Date(end);
                    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return 0;
                    const diffTime = Math.abs(endDate - startDate);
                    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                } catch (error) {
                    return 0;
                }
            }
        };
        
        // ============ API CLIENT ============
        const API = {
            token: ref(localStorage.getItem('neumocare_token')),
            headers() {
                const headers = { 'Content-Type': 'application/json' };
                if (this.token.value) headers['Authorization'] = `Bearer ${this.token.value}`;
                return headers;
            },
            async request(endpoint, options = {}) {
                const url = `${API_BASE_URL}${endpoint}`;
                try {
                    console.log(`API Request: ${options.method || 'GET'} ${url}`);
                    const config = { 
                        ...options, 
                        headers: { ...this.headers(), ...options.headers },
                        credentials: 'include'
                    };
                    const response = await fetch(url, config);
                    
                    if (response.status === 401) {
                        localStorage.removeItem('neumocare_token');
                        localStorage.removeItem('neumocare_user');
                        this.token.value = null;
                        throw new Error('Session expired. Please login again.');
                    }
                    
                    if (response.status === 403) {
                        throw new Error('You do not have permission to perform this action.');
                    }
                    
                    if (response.status === 404) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.message || 'Resource not found');
                    }
                    
                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error(`API Error ${response.status}:`, errorText);
                        let errorData;
                        try {
                            errorData = JSON.parse(errorText);
                        } catch {
                            errorData = { message: errorText || `HTTP ${response.status}: ${response.statusText}` };
                        }
                        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
                    }
                    
                    const contentType = response.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        const data = await response.json();
                        console.log(`API Response from ${url}:`, data);
                        return data;
                    } else if (contentType && contentType.includes('text/csv')) {
                        return await response.text();
                    } else {
                        return await response.text();
                    }
                } catch (error) {
                    console.error(`API Error for ${url}:`, error);
                    throw error;
                }
            },
            
            // ===== AUTHENTICATION =====
            async login(email, password) {
                const data = await this.request('/api/auth/login', {
                    method: 'POST',
                    body: JSON.stringify({ email, password, remember_me: true })
                });
                
                if (data.token) {
                    this.token.value = data.token;
                    localStorage.setItem('neumocare_token', data.token);
                    localStorage.setItem('neumocare_user', JSON.stringify(data.user));
                }
                
                return data;
            },
            
            async logout() {
                try {
                    await this.request('/api/auth/logout', { method: 'POST' });
                } finally {
                    this.token.value = null;
                    localStorage.removeItem('neumocare_token');
                    localStorage.removeItem('neumocare_user');
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
            
            // ===== CALENDAR =====
            async getCalendarEvents(start, end) {
                return await this.request(`/api/calendar/events?start_date=${start}&end_date=${end}`);
            },
            
            // ===== MEDICAL STAFF =====
            async getMedicalStaff(filters = {}) {
                const params = new URLSearchParams(filters).toString();
                return await this.request(`/api/medical-staff${params ? '?' + params : ''}`);
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
                return await this.request(`/api/rotations${params ? '?' + params : ''}`);
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
                    body: JSON.stringify({ approved, review_notes: reviewNotes })
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
            
            // ===== AVAILABLE DATA =====
            async getAvailableData() {
                return await this.request('/api/available-data');
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
                return await this.request(`/api/audit-logs${params ? '?' + params : ''}`);
            },
            
            async getAuditLogsByUser(userId) {
                return await this.request(`/api/audit-logs/user/${userId}`);
            },
            
            // ===== NOTIFICATIONS =====
            async getNotifications() {
                return await this.request('/api/notifications');
            },
            
            async getUnreadNotificationCount() {
                const result = await this.request('/api/notifications/unread');
                return result.unread_count || 0;
            },
            
            async markNotificationRead(id) {
                return await this.request(`/api/notifications/${id}/read`, {
                    method: 'PUT'
                });
            },
            
            async markAllNotificationsRead() {
                return await this.request('/api/notifications/mark-all-read', {
                    method: 'PUT'
                });
            },
            
            async deleteNotification(id) {
                return await this.request(`/api/notifications/${id}`, {
                    method: 'DELETE'
                });
            },
            
            async createNotification(notificationData) {
                return await this.request('/api/notifications', {
                    method: 'POST',
                    body: JSON.stringify(notificationData)
                });
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
            
            async changePassword(passwordData) {
                return await this.request('/api/users/change-password', {
                    method: 'PUT',
                    body: JSON.stringify(passwordData)
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
            
            // ===== HEALTH CHECK =====
            async checkHealth() {
                return await this.request('/health');
            },
            
            // ===== DEBUG =====
            async debugTables() {
                return await this.request('/api/debug/tables');
            }
        };
        
        // ============ CREATE VUE APP ============
        const app = createApp({
            setup() {
                // ============ REACTIVE STATE ============
                // User & Auth
                const currentUser = ref(JSON.parse(localStorage.getItem('neumocare_user')) || null);
                const loginForm = reactive({ email: '', password: '', remember_me: true });
                
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
                const availableData = ref({ departments: [], residents: [], attendings: [], trainingUnits: [] });
                
                // Dashboard data
                const stats = ref({ totalStaff: 0, activeStaff: 0, activeResidents: 0, todayOnCall: 0, pendingAbsences: 0, activeAlerts: 0 });
                const upcomingEvents = ref({ upcoming_rotations: [], upcoming_oncall: [], upcoming_absences: [] });
                const todaysOnCallData = ref([]);
                
                // ============ UI STATE ============
                const toasts = ref([]);
                const activeAlerts = ref([]);
                const unreadNotifications = ref(0);
                
                // ============ FILTER STATES ============
                const staffFilter = reactive({ staff_type: '', employment_status: '', department_id: '' });
                const staffSearch = ref('');
                const rotationFilter = reactive({ resident_id: '', rotation_status: '' });
                const absenceFilter = reactive({ staff_member_id: '', approval_status: '', leave_start_date: '' });
                const auditFilters = reactive({ dateRange: '', actionType: '', userId: '' });
                
                // ============ MODAL STATES - ALL INCLUDED ============
                // Existing modals
                const medicalStaffModal = reactive({ show: false, mode: 'add', form: {} });
                const departmentModal = reactive({ show: false, mode: 'add', form: {} });
                const trainingUnitModal = reactive({ show: false, mode: 'add', form: {} });
                const rotationModal = reactive({ show: false, mode: 'add', form: {} });
                const onCallModal = reactive({ show: false, mode: 'add', form: {} });
                const communicationsModal = reactive({ show: false, activeTab: 'announcement', form: {} });
                const userProfileModal = reactive({ show: false, form: {} });
                const systemSettingsModal = reactive({ show: false, settings: {} });
                const confirmationModal = reactive({ show: false, title: '', message: '', icon: 'fa-question-circle', confirmButtonText: 'Confirm', confirmButtonClass: 'btn-primary', cancelButtonText: 'Cancel', onConfirm: null, onCancel: null, details: '', confirmButtonIcon: 'fa-check' });
                const staffDetailsModal = reactive({ show: false, staff: null });
                const absenceDetailsModal = reactive({ show: false, absence: null });
                const rotationDetailsModal = reactive({ show: false, rotation: null });
                const importExportModal = reactive({ 
                    show: false, 
                    mode: 'export', 
                    selectedTable: '', 
                    selectedFile: null, 
                    exportFormat: 'csv', 
                    importOptions: { updateExisting: false, createNew: true },
                    dateRange: { start: null, end: null }
                });
                
                // NEW MODALS - Added to fix missing references
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
                
                const clinicalUnits = ref([]);
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
                
                const absenceModal = reactive({ 
                    show: false, 
                    mode: 'add', 
                    activeTab: 'basic',
                    form: {
                        staff_member_id: '',
                        absence_reason: '',
                        start_date: '',
                        end_date: '',
                        status: 'upcoming',
                        total_days: 0,
                        needs_coverage: false,
                        replacement_staff_id: '',
                        coverage_type: '',
                        coverage_notes: '',
                        documentation: '',
                        contact_during_absence: '',
                        approval_status: 'pending',
                        approved_by: ''
                    }
                });
                
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
                // ============ PERMISSION FUNCTIONS ============
const hasPermission = (permission) => {
    if (!currentUser.value) return false;
    
    // If user is admin, they have all permissions
    if (currentUser.value.user_role === 'administrator') {
        return true;
    }
    
    // Check specific permissions (simplified for now)
    const userPermissions = currentUser.value.permissions || [];
    
    // Wildcard permission
    if (userPermissions.includes('*') || userPermissions.includes('all')) {
        return true;
    }
    
    // Check for specific permission
    return userPermissions.includes(permission);
};

const canView = (module) => {
    // Map modules to permissions
    const permissionMap = {
        'medical_staff': 'view_medical_staff',
        'resident_rotations': 'view_rotations',
        'staff_absence': 'view_absences',
        'oncall_schedule': 'view_oncall',
        'training_units': 'view_training_units',
        'department_management': 'view_departments',
        'communications': 'view_communications',
        'audit_logs': 'view_audit_logs',
        'system_settings': 'manage_settings'
    };
    
    return hasPermission(permissionMap[module] || `view_${module}`);
};

const canEdit = (module) => {
    // Map modules to edit permissions
    const permissionMap = {
        'medical_staff': 'edit_medical_staff',
        'resident_rotations': 'edit_rotations',
        'staff_absence': 'edit_absences',
        'oncall_schedule': 'edit_oncall',
        'training_units': 'edit_training_units',
        'department_management': 'edit_departments',
        'communications': 'edit_communications',
        'audit_logs': 'edit_audit_logs',
        'system_settings': 'manage_settings'
    };
    
    return hasPermission(permissionMap[module] || `edit_${module}`);
};

const canDelete = (module) => {
    // Map modules to delete permissions
    const permissionMap = {
        'medical_staff': 'delete_medical_staff',
        'resident_rotations': 'delete_rotations',
        'staff_absence': 'delete_absences',
        'oncall_schedule': 'delete_oncall',
        'training_units': 'delete_training_units',
        'department_management': 'delete_departments',
        'communications': 'delete_communications',
        'audit_logs': 'delete_audit_logs',
        'system_settings': 'manage_settings'
    };
    
    return hasPermission(permissionMap[module] || `delete_${module}`);
};

// Helper function for checking multiple permissions
const hasAnyPermission = (permissions) => {
    return permissions.some(permission => hasPermission(permission));
};

const hasAllPermissions = (permissions) => {
    return permissions.every(permission => hasPermission(permission));
};
                
                const roleModal = reactive({
                    show: false,
                    mode: 'add',
                    form: {
                        name: '',
                        description: '',
                        permissions: []
                    }
                });
                
                const userRoles = ref([]);
                const availablePermissions = ref([]);
                const users = ref([]);
                
                const exportImportOptions = {
                    tables: [
                        { value: 'medical_staff', label: 'Medical Staff' },
                        { value: 'resident_rotations', label: 'Resident Rotations' },
                        { value: 'leave_requests', label: 'Staff Absences' },
                        { value: 'oncall_schedule', label: 'On-Call Schedule' },
                        { value: 'department_announcements', label: 'Announcements' },
                        { value: 'audit_logs', label: 'Audit Logs' }
                    ],
                    formats: [
                        { value: 'json', label: 'JSON' },
                        { value: 'csv', label: 'CSV' }
                    ]
                };
                
                // ============ TOAST SYSTEM ============
                const showToast = (title, message, type = 'info', duration = 5000) => {
                    const icons = { info: 'fas fa-info-circle', success: 'fas fa-check-circle', error: 'fas fa-exclamation-circle', warning: 'fas fa-exclamation-triangle' };
                    const toast = { id: Date.now(), title, message, type, icon: icons[type], duration };
                    toasts.value.push(toast);
                    if (duration > 0) setTimeout(() => removeToast(toast.id), duration);
                };
                
                const removeToast = (id) => {
                    const index = toasts.value.findIndex(t => t.id === id);
                    if (index > -1) toasts.value.splice(index, 1);
                };
                
                const dismissAlert = (id) => {
                    const index = activeAlerts.value.findIndex(a => a.id === id);
                    if (index > -1) activeAlerts.value.splice(index, 1);
                };
                
                // ============ FORMATTING FUNCTIONS ============
                const formatStaffType = (type) => ({ medical_resident: 'Medical Resident', attending_physician: 'Attending Physician', fellow: 'Fellow', nurse_practitioner: 'Nurse Practitioner' }[type] || type);
                const formatEmploymentStatus = (status) => ({ active: 'Active', on_leave: 'On Leave', inactive: 'Inactive' }[status] || status);
                const formatAbsenceReason = (reason) => ({ vacation: 'Vacation', sick_leave: 'Sick Leave', conference: 'Conference', personal: 'Personal', maternity_paternity: 'Maternity/Paternity', administrative: 'Administrative', other: 'Other' }[reason] || reason);
                const formatAbsenceStatus = (status) => ({ pending: 'Pending', approved: 'Approved', rejected: 'Rejected' }[status] || status);
                const formatRotationStatus = (status) => ({ active: 'Active', upcoming: 'Upcoming', completed: 'Completed', cancelled: 'Cancelled' }[status] || status);
                const getStaffTypeClass = (type) => ({ medical_resident: 'badge-primary', attending_physician: 'badge-success', fellow: 'badge-info', nurse_practitioner: 'badge-warning' }[type] || 'badge-secondary');
                const getAbsenceStatusClass = (status) => ({ pending: 'status-busy', approved: 'status-available', rejected: 'status-critical' }[status] || 'badge-secondary');
                const getRotationStatusClass = (status) => ({ active: 'status-available', upcoming: 'status-busy', completed: 'status-oncall', cancelled: 'status-critical' }[status] || 'badge-secondary');
                const getPriorityColor = (priority) => ({ high: 'danger', medium: 'warning', low: 'info', urgent: 'danger' }[priority] || 'primary');
                const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : '??';
                
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
                            if (resident) residents.push({ id: resident.id, full_name: resident.full_name });
                        }
                    });
                    return residents;
                };
                
                const getCurrentTitle = () => ({ daily_operations: 'Daily Operations', medical_staff: 'Medical Staff', resident_rotations: 'Resident Rotations', oncall_schedule: 'On-call Schedule', staff_absence: 'Staff Absence', training_units: 'Training Units', department_management: 'Department Management', communications: 'Communications', audit_logs: 'Audit Logs', system_settings: 'System Settings', login: 'Login' }[currentView.value] || 'NeumoCare');
                
                const getCurrentSubtitle = () => ({ daily_operations: 'Overview dashboard with real-time updates', medical_staff: 'Manage physicians, residents, and clinical staff', resident_rotations: 'Track and manage resident training rotations', oncall_schedule: 'View and manage on-call physician schedules', staff_absence: 'Track staff absences and coverage assignments', training_units: 'Manage clinical training units and assignments', department_management: 'Organizational structure and clinical units', communications: 'Department announcements and capacity updates', audit_logs: 'System activity and security audit trails', system_settings: 'Configure system preferences and behavior' }[currentView.value] || 'Hospital Management System');
                
                // ============ COMPUTED PROPERTIES ============
                const residents = computed(() => medicalStaff.value.filter(staff => staff.staff_type === 'medical_resident'));
                const attendings = computed(() => medicalStaff.value.filter(staff => staff.staff_type === 'attending_physician'));
                const todaysOnCall = computed(() => {
                    const today = new Date().toISOString().split('T')[0];
                    return todaysOnCallData.value.filter(schedule => schedule.duty_date === today)
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
                        filtered = filtered.filter(staff => staff.full_name.toLowerCase().includes(searchTerm) || staff.staff_id.toLowerCase().includes(searchTerm) || staff.professional_email.toLowerCase().includes(searchTerm));
                    }
                    if (staffFilter.staff_type) filtered = filtered.filter(staff => staff.staff_type === staffFilter.staff_type);
                    if (staffFilter.employment_status) filtered = filtered.filter(staff => staff.employment_status === staffFilter.employment_status);
                    if (staffFilter.department_id) filtered = filtered.filter(staff => staff.department_id === staffFilter.department_id);
                    return filtered;
                });
                
                const filteredRotations = computed(() => {
                    let filtered = residentRotations.value;
                    if (rotationFilter.resident_id) filtered = filtered.filter(rotation => rotation.resident_id === rotationFilter.resident_id);
                    if (rotationFilter.rotation_status) filtered = filtered.filter(rotation => rotation.rotation_status === rotationFilter.rotation_status);
                    return filtered;
                });
                
                const filteredAbsences = computed(() => {
                    let filtered = staffAbsences.value;
                    if (absenceFilter.staff_member_id) filtered = filtered.filter(absence => absence.staff_member_id === absenceFilter.staff_member_id);
                    if (absenceFilter.approval_status) filtered = filtered.filter(absence => absence.approval_status === absenceFilter.approval_status);
                    if (absenceFilter.leave_start_date) filtered = filtered.filter(absence => absence.leave_start_date >= absenceFilter.leave_start_date);
                    return filtered;
                });
                
                const filteredAuditLogs = computed(() => {
                    let filtered = auditLogs.value;
                    if (auditFilters.actionType) filtered = filtered.filter(log => log.action === auditFilters.actionType);
                    if (auditFilters.userId) filtered = filtered.filter(log => log.user_id === auditFilters.userId);
                    if (auditFilters.dateRange) filtered = filtered.filter(log => new Date(log.created_at) >= new Date(auditFilters.dateRange));
                    return filtered;
                });
                
                // NEW COMPUTED PROPERTIES - For missing references
                const availableResidents = computed(() => {
                    return medicalStaff.value.filter(staff => staff.staff_type === 'medical_resident');
                });
                
                const availableTrainingUnits = computed(() => {
                    return trainingUnits.value.filter(unit => unit.unit_status === 'active');
                });
                
                const availableTrainingUnitsWithCapacity = computed(() => {
                    return trainingUnits.value.filter(unit => 
                        unit.unit_status === 'active' && 
                        unit.current_residents < unit.maximum_residents
                    );
                });
                
                const availableUnassignedResidents = computed(() => {
                    const assignedResidentIds = new Set(residentRotations.value
                        .filter(r => r.rotation_status === 'active')
                        .map(r => r.resident_id));
                    
                    return medicalStaff.value.filter(staff => 
                        staff.staff_type === 'medical_resident' && 
                        !assignedResidentIds.has(staff.id)
                    );
                });
                
                const availableStaff = computed(() => {
                    return medicalStaff.value.filter(staff => staff.employment_status === 'active');
                });
                
                const availableCoverageStaff = computed(() => {
                    return medicalStaff.value.filter(staff => 
                        staff.employment_status === 'active' && 
                        staff.staff_type !== 'medical_resident'
                    );
                });
                
                const availableSupervisors = computed(() => {
                    return medicalStaff.value.filter(staff => 
                        staff.employment_status === 'active' && 
                        (staff.staff_type === 'attending_physician' || staff.staff_type === 'fellow')
                    );
                });
                
                // ============ DATA LOADING FUNCTIONS ============
                const loadMedicalStaff = async () => {
                    try {
                        loadingStaff.value = true;
                        const response = await API.getMedicalStaff();
                        medicalStaff.value = response.data || response || [];
                    } catch (error) {
                        showToast('Error', 'Failed to load medical staff', 'error');
                        medicalStaff.value = [];
                    } finally {
                        loadingStaff.value = false;
                    }
                };
                
                const loadDepartments = async () => {
                    try { 
                        loading.value = true;
                        departments.value = await API.getDepartments(); 
                    } catch { 
                        departments.value = []; 
                    } finally {
                        loading.value = false;
                    }
                };
                
                const loadTrainingUnits = async () => {
                    try { 
                        trainingUnits.value = await API.getTrainingUnits(); 
                    } catch { 
                        trainingUnits.value = []; 
                    }
                };
                
                const loadResidentRotations = async () => {
                    try {
                        loadingRotations.value = true;
                        const response = await API.getRotations();
                        residentRotations.value = response.data || response || [];
                    } catch { 
                        residentRotations.value = []; 
                    } finally {
                        loadingRotations.value = false;
                    }
                };
                
                const loadStaffAbsences = async () => {
                    try { 
                        loadingAbsences.value = true;
                        staffAbsences.value = await API.getAbsences(); 
                    } catch { 
                        staffAbsences.value = []; 
                    } finally {
                        loadingAbsences.value = false;
                    }
                };
                
                const loadOnCallSchedule = async () => {
                    try { 
                        loadingSchedule.value = true;
                        onCallSchedule.value = await API.getOnCallSchedule(); 
                    } catch { 
                        onCallSchedule.value = []; 
                    } finally {
                        loadingSchedule.value = false;
                    }
                };
                
                const loadAnnouncements = async () => {
                    try { 
                        loadingAnnouncements.value = true;
                        recentAnnouncements.value = await API.getAnnouncements(); 
                    } catch { 
                        recentAnnouncements.value = []; 
                    } finally {
                        loadingAnnouncements.value = false;
                    }
                };
                
                const loadSystemSettings = async () => {
                    try { systemSettings.value = await API.getSystemSettings(); } catch { systemSettings.value = {}; }
                };
                
                const loadAvailableData = async () => {
                    try {
                        availableData.value = await API.getAvailableData();
                    } catch {
                        availableData.value = {
                            departments: departments.value,
                            residents: medicalStaff.value.filter(s => s.staff_type === 'medical_resident'),
                            attendings: medicalStaff.value.filter(s => s.staff_type === 'attending_physician'),
                            trainingUnits: trainingUnits.value
                        };
                    }
                };
                
                const loadAuditLogs = async () => {
                    try {
                        loadingAuditLogs.value = true;
                        const response = await API.getAuditLogs();
                        auditLogs.value = response.data || response || [];
                    } catch { 
                        auditLogs.value = []; 
                    } finally {
                        loadingAuditLogs.value = false;
                    }
                };
                
                const loadNotifications = async () => {
                    try {
                        unreadNotifications.value = await API.getUnreadNotificationCount();
                    } catch { unreadNotifications.value = 0; }
                };
                
                const loadClinicalUnits = async () => {
                    try {
                        clinicalUnits.value = []; // Placeholder - no API endpoint
                    } catch {
                        clinicalUnits.value = [];
                    }
                };
                
                const loadUserRoles = async () => {
                    try {
                        userRoles.value = []; // Placeholder - no API endpoint
                    } catch {
                        userRoles.value = [];
                    }
                };
                
                const loadAvailablePermissions = async () => {
                    try {
                        availablePermissions.value = []; // Placeholder - no API endpoint
                    } catch {
                        availablePermissions.value = [];
                    }
                };
                
                const loadUsers = async () => {
                    try {
                        users.value = await API.getUsers(); // Load if needed
                    } catch { }
                };
                
                const loadDashboardStats = async () => {
                    try {
                        loadingStats.value = true;
                        const [statsData, upcomingEventsData, todayOnCall] = await Promise.all([
                            API.getDashboardStats(),
                            API.getDashboardUpcomingEvents(),
                            API.getOnCallToday()
                        ]);
                        stats.value = statsData;
                        upcomingEvents.value = upcomingEventsData;
                        todaysOnCallData.value = todayOnCall || [];
                        showToast('Dashboard Updated', 'Dashboard data refreshed', 'success');
                    } catch (error) { 
                        showToast('Error', 'Failed to load dashboard data', 'error'); 
                    } finally {
                        loadingStats.value = false;
                    }
                };
                
                const loadInitialData = async () => {
                    loading.value = true;
                    try {
                        await Promise.all([
                            loadMedicalStaff(), loadDepartments(), loadTrainingUnits(),
                            loadResidentRotations(), loadStaffAbsences(), loadOnCallSchedule(),
                            loadAnnouncements(), loadSystemSettings(), loadAvailableData(),
                            loadDashboardStats(), loadAuditLogs(), loadNotifications(),
                            loadUsers(), loadClinicalUnits(), loadUserRoles(), loadAvailablePermissions()
                        ]);
                        showToast('System Ready', 'All data loaded successfully', 'success');
                    } catch (error) {
                        showToast('Data Load Error', 'Failed to load system data: ' + error.message, 'error');
                    } finally {
                        loading.value = false;
                    }
                };
                
                // ============ NEW FUNCTIONS - For missing modal functionality ============
                const showBulkAssignModal = () => {
                    bulkAssignModal.show = true;
                    bulkAssignModal.form.start_date = new Date().toISOString().split('T')[0];
                };
                
                const toggleSelectAllResidents = () => {
                    bulkAssignModal.allSelected = !bulkAssignModal.allSelected;
                    if (bulkAssignModal.allSelected) {
                        bulkAssignModal.selectedResidents = availableResidents.value.map(r => r.id);
                    } else {
                        bulkAssignModal.selectedResidents = [];
                    }
                };
                
                const toggleResidentSelection = (residentId) => {
                    const index = bulkAssignModal.selectedResidents.indexOf(residentId);
                    if (index > -1) {
                        bulkAssignModal.selectedResidents.splice(index, 1);
                    } else {
                        bulkAssignModal.selectedResidents.push(residentId);
                    }
                };
                
                const isResidentSelected = (residentId) => {
                    return bulkAssignModal.selectedResidents.includes(residentId);
                };
                
                const saveBulkAssignment = async () => {
                    if (bulkAssignModal.selectedResidents.length === 0) {
                        showToast('Error', 'Please select at least one resident', 'error');
                        return;
                    }
                
                    saving.value = true;
                    try {
                        const promises = bulkAssignModal.selectedResidents.map(residentId => {
                            const rotationData = {
                                resident_id: residentId,
                                training_unit_id: bulkAssignModal.form.training_unit_id,
                                start_date: bulkAssignModal.form.start_date,
                                end_date: new Date(new Date(bulkAssignModal.form.start_date).getTime() + 
                                    parseInt(bulkAssignModal.form.duration_weeks) * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                                supervising_attending_id: bulkAssignModal.form.supervisor_id,
                                rotation_status: 'active'
                            };
                            return API.createRotation(rotationData);
                        });
                
                        await Promise.all(promises);
                        showToast('Success', `${bulkAssignModal.selectedResidents.length} residents assigned successfully`, 'success');
                        bulkAssignModal.show = false;
                        loadResidentRotations();
                    } catch (error) {
                        showToast('Error', error.message, 'error');
                    } finally {
                        saving.value = false;
                    }
                };
                
                const showAdvancedSearchModal = () => {
                    advancedSearchModal.show = true;
                };
                
                const clearAdvancedSearch = () => {
                    Object.keys(advancedSearchModal.filters).forEach(category => {
                        Object.keys(advancedSearchModal.filters[category]).forEach(field => {
                            advancedSearchModal.filters[category][field] = '';
                        });
                    });
                };
                
                const performAdvancedSearch = async () => {
                    saving.value = true;
                    try {
                        let results = [];
                        const filters = advancedSearchModal.filters[advancedSearchModal.activeTab];
                        
                        switch(advancedSearchModal.activeTab) {
                            case 'staff':
                                results = await API.getMedicalStaff(filters);
                                break;
                            case 'rotations':
                                results = await API.getRotations(filters);
                                break;
                            case 'schedule':
                                results = await API.getOnCallSchedule(filters);
                                break;
                        }
                        
                        showToast('Search Complete', `Found ${results.length} results`, 'success');
                        advancedSearchModal.show = false;
                        return results;
                    } catch (error) {
                        showToast('Error', error.message, 'error');
                        return [];
                    } finally {
                        saving.value = false;
                    }
                };
                
                const showDashboardCustomizeModal = () => {
                    dashboardCustomizeModal.show = true;
                };
                
                const resetDashboardLayout = () => {
                    dashboardCustomizeModal.widgets = [
                        { id: 'stats', label: 'Statistics', enabled: true },
                        { id: 'oncall', label: 'Today\'s On-Call', enabled: true },
                        { id: 'announcements', label: 'Announcements', enabled: true },
                        { id: 'capacity', label: 'Capacity Overview', enabled: true },
                        { id: 'alerts', label: 'Alerts', enabled: true },
                        { id: 'calendar', label: 'Calendar', enabled: true }
                    ];
                    showToast('Dashboard Reset', 'Dashboard layout has been reset to default', 'success');
                };
                
                const saveDashboardCustomization = async () => {
                    saving.value = true;
                    try {
                        localStorage.setItem('dashboard_customization', JSON.stringify(dashboardCustomizeModal.widgets));
                        showToast('Success', 'Dashboard customization saved', 'success');
                        dashboardCustomizeModal.show = false;
                    } catch (error) {
                        showToast('Error', error.message, 'error');
                    } finally {
                        saving.value = false;
                    }
                };
                
                const showPermissionManager = () => {
                    currentView.value = 'permission_manager';
                };
                
                const showAddRoleModal = () => {
                    roleModal.mode = 'add';
                    roleModal.form = { name: '', description: '', permissions: [] };
                    roleModal.show = true;
                };
                
                const editRole = (role) => {
                    roleModal.mode = 'edit';
                    roleModal.form = { ...role };
                    roleModal.show = true;
                };
                
                const saveRole = async () => {
                    saving.value = true;
                    try {
                        showToast('Success', 'Role saved successfully', 'success');
                        roleModal.show = false;
                    } catch (error) {
                        showToast('Error', error.message, 'error');
                    } finally {
                        saving.value = false;
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
                        if (confirmationModal.onConfirm) await confirmationModal.onConfirm(); 
                        confirmationModal.show = false; 
                    } catch (error) { 
                        showToast('Error', error.message, 'error'); 
                    } finally { 
                        saving.value = false; 
                    }
                };
                
                const cancelConfirmation = () => { 
                    if (confirmationModal.onCancel) confirmationModal.onCancel(); 
                    confirmationModal.show = false; 
                };
                
                // ============ ACTION MENU FUNCTIONS ============
                const toggleActionMenu = (event) => {
                    const menu = event.target.closest('.action-dropdown').querySelector('.action-menu');
                    const allMenus = document.querySelectorAll('.action-menu');
                    allMenus.forEach(m => { if (m !== menu) m.classList.remove('show'); });
                    menu.classList.toggle('show');
                    const closeMenu = (e) => { 
                        if (!menu.contains(e.target) && !event.target.contains(e.target)) { 
                            menu.classList.remove('show'); 
                            document.removeEventListener('click', closeMenu); 
                        } 
                    };
                    setTimeout(() => { document.addEventListener('click', closeMenu); }, 0);
                };
                
                const toggleUserMenu = () => { userMenuOpen.value = !userMenuOpen.value; };
                
                // ============ MODAL SHOW FUNCTIONS ============
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
                
                const showAddClinicalUnitModal = () => {
                    clinicalUnitModal.mode = 'add';
                    clinicalUnitModal.show = true;
                    clinicalUnitModal.form = { 
                        name: '', 
                        code: '', 
                        department_id: '', 
                        unit_type: 'clinical', 
                        status: 'active', 
                        description: '', 
                        capacity: '', 
                        location: '' 
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
                        department_name: '', 
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
                
                const showQuickPlacementModal = () => {
                    quickPlacementModal.show = true;
                    quickPlacementModal.form.start_date = new Date().toISOString().split('T')[0];
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
                
                const showImportExportModal = (mode = 'export') => {
                    importExportModal.mode = mode;
                    importExportModal.selectedTable = '';
                    importExportModal.selectedFile = null;
                    importExportModal.show = true;
                };
                
                // ============ DATA SAVE FUNCTIONS ============
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
                
                const saveClinicalUnit = async () => {
                    saving.value = true;
                    try {
                        showToast('Info', 'Clinical units functionality is not available', 'info');
                        clinicalUnitModal.show = false;
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
                            showToast('Success', 'Training unit added successfully', 'success');
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
                        if (rotationModal.mode === 'add') {
                            const result = await API.createRotation(rotationModal.form);
                            residentRotations.value.unshift(result);
                            showToast('Success', 'Rotation added successfully', 'success');
                        } else {
                            const result = await API.updateRotation(rotationModal.form.id, rotationModal.form);
                            const index = residentRotations.value.findIndex(r => r.id === result.id);
                            if (index !== -1) residentRotations.value[index] = result;
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
                        if (!onCallModal.form.duty_date) throw new Error('Duty date is required');
                        if (!onCallModal.form.primary_physician_id) throw new Error('Primary physician is required');
                        if (onCallModal.mode === 'add') {
                            const result = await API.createOnCall(onCallModal.form);
                            onCallSchedule.value.unshift(result);
                            showToast('Success', 'On-call schedule added successfully', 'success');
                        } else {
                            const result = await API.updateOnCall(onCallModal.form.id, onCallModal.form);
                            const index = onCallSchedule.value.findIndex(s => s.id === result.id);
                            if (index !== -1) onCallSchedule.value[index] = result;
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
                        if (endDate <= startDate) throw new Error('End date must be after start date');
                        
                        if (absenceModal.mode === 'add') {
                            const result = await API.createAbsence(absenceModal.form);
                            staffAbsences.value.unshift(result);
                            showToast('Success', 'Absence request submitted successfully', 'success');
                        } else {
                            const result = await API.updateAbsence(absenceModal.form.id, absenceModal.form);
                            const index = staffAbsences.value.findIndex(a => a.id === result.id);
                            if (index !== -1) staffAbsences.value[index] = result;
                            showToast('Success', 'Absence request updated successfully', 'success');
                        }
                        absenceModal.show = false;
                    } catch (error) {
                        showToast('Error', error.message, 'error');
                    } finally { 
                        saving.value = false; 
                    }
                };
                
                const approveAbsence = async (absenceId, approved, reviewNotes = '') => {
                    saving.value = true;
                    try {
                        const result = await API.approveAbsence(absenceId, approved, reviewNotes);
                        const index = staffAbsences.value.findIndex(a => a.id === absenceId);
                        if (index !== -1) staffAbsences.value[index] = { ...staffAbsences.value[index], ...result };
                        showToast('Success', `Absence request ${approved ? 'approved' : 'rejected'} successfully`, 'success');
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
                
                const saveQuickPlacement = async () => {
                    saving.value = true;
                    try {
                        const rotationData = {
                            resident_id: quickPlacementModal.form.resident_id,
                            training_unit_id: quickPlacementModal.form.training_unit_id,
                            start_date: quickPlacementModal.form.start_date,
                            end_date: new Date(new Date(quickPlacementModal.form.start_date).getTime() + 
                                (quickPlacementModal.form.custom_duration || quickPlacementModal.form.duration_weeks) * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                            supervising_attending_id: quickPlacementModal.form.supervisor_id,
                            rotation_status: 'active',
                            notes: quickPlacementModal.form.notes
                        };
                        
                        const result = await API.createRotation(rotationData);
                        residentRotations.value.unshift(result);
                        quickPlacementModal.show = false;
                        showToast('Success', 'Resident placed successfully', 'success');
                    } catch (error) {
                        showToast('Error', error.message, 'error');
                    } finally {
                        saving.value = false;
                    }
                };
                
                // ============ EXPORT/IMPORT FUNCTIONS ============
                const exportData = async () => {
                    if (!importExportModal.selectedTable) {
                        showToast('Error', 'Please select a table to export', 'error');
                        return;
                    }
                    
                    saving.value = true;
                    try {
                        showToast('Export Started', `Exporting ${importExportModal.selectedTable} data...`, 'info');
                        
                        let startDate = null, endDate = null;
                        if (importExportModal.dateRange.start && importExportModal.dateRange.end) {
                            startDate = importExportModal.dateRange.start;
                            endDate = importExportModal.dateRange.end;
                        }
                        
                        const data = await API.exportData(importExportModal.selectedTable, importExportModal.exportFormat, startDate, endDate);
                        
                        if (importExportModal.exportFormat === 'csv') {
                            const filename = `${importExportModal.selectedTable}_export_${Date.now()}.csv`;
                            Utils.downloadCSV(data, filename);
                            showToast('Export Complete', `Data exported to ${filename}`, 'success');
                        } else {
                            const filename = `${importExportModal.selectedTable}_export_${Date.now()}.json`;
                            Utils.downloadJSON(data, filename);
                            showToast('Export Complete', `Data exported successfully`, 'success');
                        }
                        
                        importExportModal.show = false;
                    } catch (error) {
                        showToast('Export Failed', error.message, 'error');
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
                                if (index !== -1) trainingUnits.value.splice(index, 1);
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
                                if (index !== -1) residentRotations.value[index].rotation_status = 'cancelled';
                                showToast('Cancelled', 'Rotation has been cancelled', 'success');
                            } catch (error) { 
                                showToast('Error', error.message, 'error'); 
                            }
                        }
                    });
                };
                
                const deleteOnCallSchedule = (schedule) => {
                    showConfirmation({
                        title: 'Delete On-call Schedule', 
                        message: 'Are you sure you want to delete this on-call schedule?', 
                        icon: 'fa-trash', 
                        confirmButtonText: 'Delete', 
                        confirmButtonClass: 'btn-danger',
                        onConfirm: async () => {
                            try {
                                await API.deleteOnCall(schedule.id);
                                const index = onCallSchedule.value.findIndex(s => s.id === schedule.id);
                                if (index !== -1) onCallSchedule.value.splice(index, 1);
                                showToast('Deleted', 'On-call schedule has been removed', 'success');
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
                                if (index !== -1) staffAbsences.value.splice(index, 1);
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
                                if (index !== -1) recentAnnouncements.value.splice(index, 1);
                                showToast('Deleted', 'Announcement has been removed', 'success');
                            } catch (error) { 
                                showToast('Error', error.message, 'error'); 
                            }
                        }
                    });
                };
                
                // ============ OTHER FUNCTIONS ============
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
                
                const editClinicalUnit = (unit) => { 
                    clinicalUnitModal.mode = 'edit'; 
                    clinicalUnitModal.form = { ...unit }; 
                    clinicalUnitModal.show = true; 
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
                
                const assignResidentToUnit = (unit) => { 
                    quickPlacementModal.form.training_unit_id = unit.id; 
                    quickPlacementModal.show = true; 
                };
                
                // ============ AUTHENTICATION ============
                const handleLogin = async () => {
                    loading.value = true;
                    try {
                        const { email, password } = loginForm;
                        if (!email || !password) throw new Error('Email and password are required');
                        const response = await API.login(email, password);
                        currentUser.value = response.user;
                        localStorage.setItem('neumocare_user', JSON.stringify(response.user));
                        showToast('Login Successful', `Welcome ${response.user.full_name}!`, 'success');
                        await loadInitialData();
                        currentView.value = 'daily_operations';
                    } catch (error) {
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
                    if (!currentUser.value && view !== 'login') return;
                    currentView.value = view;
                    mobileMenuOpen.value = false;
                    switch (view) {
                        case 'medical_staff': loadMedicalStaff(); break;
                        case 'department_management': loadDepartments(); break;
                        case 'training_units': loadTrainingUnits(); loadResidentRotations(); break;
                        case 'resident_rotations': loadResidentRotations(); break;
                        case 'staff_absence': loadStaffAbsences(); break;
                        case 'oncall_schedule': loadOnCallSchedule(); break;
                        case 'communications': loadAnnouncements(); break;
                        case 'audit_logs': loadAuditLogs(); break;
                        case 'system_settings': loadSystemSettings(); break;
                        case 'daily_operations': loadDashboardStats(); loadAnnouncements(); loadOnCallSchedule(); break;
                    }
                };
                
                // ============ UI FUNCTIONS ============
                const toggleStatsSidebar = () => { statsSidebarOpen.value = !statsSidebarOpen.value; };
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
                const showNotifications = async () => { 
                    const count = await API.getUnreadNotificationCount();
                    showToast('Notifications', `You have ${count} unread notifications`, 'info'); 
                    unreadNotifications.value = 0; 
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
                
                // ============ LIFECYCLE HOOKS ============
                onMounted(() => {
                    if (currentUser.value) {
                        loadInitialData();
                        // Load dashboard customization from localStorage
                        const savedCustomization = localStorage.getItem('dashboard_customization');
                        if (savedCustomization) {
                            dashboardCustomizeModal.widgets = JSON.parse(savedCustomization);
                        }
                    }
                    document.addEventListener('click', function(event) {
                        if (!event.target.closest('.user-menu')) userMenuOpen.value = false;
                        if (!event.target.closest('.action-dropdown')) {
                            document.querySelectorAll('.action-menu').forEach(menu => menu.classList.remove('show'));
                        }
                    });
                });
                
                // ============ RETURN STATEMENT - COMPLETE WITH ALL PROPERTIES ============
                return {
                    // State
                    currentUser, loginForm, loading, saving, loadingStats, loadingAnnouncements, loadingSchedule, 
                    loadingStaff, loadingRotations, loadingAbsences, loadingAuditLogs,
                    currentView, sidebarCollapsed, mobileMenuOpen, userMenuOpen, statsSidebarOpen, 
                    searchQuery, searchScope, searchFilter,
                    
                    // All Modals
                    medicalStaffModal, departmentModal, trainingUnitModal, rotationModal, 
                    onCallModal, absenceModal, communicationsModal, quickPlacementModal,
                    userProfileModal, systemSettingsModal, confirmationModal, staffDetailsModal, absenceDetailsModal, 
                    rotationDetailsModal, importExportModal, dashboardCustomizeModal,
                    bulkAssignModal, advancedSearchModal, clinicalUnitModal, roleModal,
                    
                    // Data
                    medicalStaff, departments, clinicalUnits, trainingUnits, residentRotations, staffAbsences, 
                    onCallSchedule, recentAnnouncements, auditLogs, systemSettings, availableData, stats, 
                    upcomingEvents, todaysOnCallData, userRoles, availablePermissions, users,
                    
                    // UI State
                    toasts, activeAlerts, unreadNotifications,
                    
                    // Filters
                    staffFilter, staffSearch, rotationFilter, absenceFilter, auditFilters,
                    
                    // Formatting Functions
                    formatDate: Utils.formatDate, formatDateTime: Utils.formatDateTime, formatTimeAgo: Utils.formatTimeAgo, getInitials,
                    formatStaffType, getStaffTypeClass, formatEmploymentStatus, formatAbsenceReason, formatAbsenceStatus, formatRotationStatus, 
                    getAbsenceStatusClass, getRotationStatusClass, getPriorityColor, getDepartmentName, getStaffName, getTrainingUnitName,
                    getUnitResidents, getCurrentTitle, getCurrentSubtitle,
                    
                    // Computed Properties
                    residents, attendings, todaysOnCall, filteredMedicalStaff, filteredRotations, filteredAbsences, filteredAuditLogs,
                    availableResidents, availableTrainingUnits, availableTrainingUnitsWithCapacity, availableUnassignedResidents,
                    availableStaff, availableCoverageStaff, availableSupervisors,
                    
                    // Modal Functions
                    showConfirmation, confirmAction, cancelConfirmation, toggleActionMenu, toggleUserMenu,
                    
                    // Save Functions
                    saveMedicalStaff, saveClinicalUnit, saveDepartment, saveTrainingUnit, saveRotation, saveOnCallSchedule, saveAbsence, saveCommunication, 
                    saveUserProfile, saveSystemSettings, approveAbsence, saveQuickPlacement, saveBulkAssignment, saveRole,
                    
                    // Delete Functions
                    deleteMedicalStaff, deleteTrainingUnit, deleteRotation, deleteOnCallSchedule, deleteAbsence, deleteAnnouncement,
                    
                    // View/Edit Functions
                    viewStaffDetails, editMedicalStaff, editDepartment, editClinicalUnit, editTrainingUnit, editRotation, editOnCallSchedule, 
                    editAbsence, viewAbsenceDetails, viewRotationDetails, assignResidentToUnit, editRole,
                    
                    // Modal Show Functions
                    showAddMedicalStaffModal, showAddClinicalUnitModal, showAddDepartmentModal, showAddTrainingUnitModal, showAddRotationModal, 
                    showAddOnCallModal, showAddAbsenceModal, showCommunicationsModal, showQuickPlacementModal,
                    showUserProfile, showSystemSettingsModal, showImportExportModal, showDashboardCustomizeModal,
                    showBulkAssignModal, showAdvancedSearchModal, showAddRoleModal, showPermissionManager,
                    
                    // Export/Import Functions
                    exportData,
                    
                    // Navigation & Auth
                    switchView, handleLogin, handleLogout,
                      hasPermission,
    canView,
    canEdit,
    canDelete,
    hasAnyPermission,
    hasAllPermissions,
                    
                    // UI Functions
                    removeToast, showToast, dismissAlert, toggleStatsSidebar, toggleSearchScope, handleSearch, 
                    showNotifications, refreshData,
                    
                    // Utility Functions
                    Utils,
                    
                    // Bulk Assign Functions
                    toggleSelectAllResidents, toggleResidentSelection, isResidentSelected,
                    
                    // Advanced Search Functions
                    clearAdvancedSearch, performAdvancedSearch,
                    
                    // Dashboard Customization Functions
                    resetDashboardLayout, saveDashboardCustomization
                };
            }
        });
        
        // ============ MOUNT THE APP ============
        app.mount('#app');
        console.log('NeumoCare Frontend v3.5 mounted successfully - ALL MODALS AND FUNCTIONS INTEGRATED!');
        
    } catch (error) {
        console.error('FATAL ERROR: Frontend failed to initialize:', error);
        document.body.innerHTML = `
            <div style="padding: 40px; text-align: center; margin-top: 100px; color: #333; font-family: Arial, sans-serif;">
                <h2 style="color: #dc3545;">System Error</h2>
                <p style="margin: 20px 0; color: #666;">${error.message}</p>
                <button onclick="window.location.reload()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">Refresh Page</button>
            </div>
        `;
    }
});
