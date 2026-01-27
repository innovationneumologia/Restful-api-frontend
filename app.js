// ============ NEUMOCARE HOSPITAL MANAGEMENT SYSTEM FRONTEND ============
// COMPLETE PRODUCTION-READY FRONTEND
// VERSION 2.0 - USES REST API BACKEND
// ================================================================

// Wait for page to fully load
window.addEventListener('load', async function() {
    console.log('NeumoCare Hospital Management System Frontend v2.0 loading...');
    
    try {
        // ============ ERROR BOUNDARY: CHECK VUE AVAILABILITY ============
        if (typeof Vue === 'undefined') {
            throw new Error('Vue.js failed to load. Please refresh the page.');
        }
        
        console.log('Vue.js loaded successfully:', Vue.version);
        
        // Get Vue functions
        const { createApp, ref, reactive, computed, onMounted, watch } = Vue;
        
        // ============ API CONFIGURATION ============
        // This will be your Railway backend URL
        const API_BASE_URL = window.API_BASE_URL || 'https://your-neumocare-api.railway.app';
        console.log('API Base URL:', API_BASE_URL);
        
        // ============ UTILITY FUNCTIONS ============
        const Utils = {
            formatDate: (dateString) => {
                if (!dateString) return '';
                try {
                    const date = new Date(dateString);
                    return date.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                    });
                } catch {
                    return '';
                }
            },
            
            formatDateTime: (dateString) => {
                if (!dateString) return '';
                try {
                    const date = new Date(dateString);
                    return date.toLocaleString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                    });
                } catch {
                    return '';
                }
            },
            
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
                    return '';
                }
            },
            
            getInitials: (name) => {
                if (!name) return '??';
                return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
            },
            
            generateId: (prefix = 'ID') => {
                return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
            }
        };
        
        // ============ API CLIENT ============
        const API = {
            token: ref(localStorage.getItem('neumocare_token')),
            
            headers() {
                const headers = {
                    'Content-Type': 'application/json'
                };
                
                if (this.token.value) {
                    headers['Authorization'] = `Bearer ${this.token.value}`;
                }
                
                return headers;
            },
            
            async request(endpoint, options = {}) {
                const url = `${API_BASE_URL}${endpoint}`;
                
                const config = {
                    ...options,
                    headers: {
                        ...this.headers(),
                        ...options.headers
                    }
                };
                
                try {
                    const response = await fetch(url, config);
                    
                    if (response.status === 401) {
                        // Token expired or invalid
                        localStorage.removeItem('neumocare_token');
                        localStorage.removeItem('neumocare_user');
                        this.token.value = null;
                        throw new Error('Session expired. Please login again.');
                    }
                    
                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
                    }
                    
                    return await response.json();
                } catch (error) {
                    console.error(`API Request failed (${endpoint}):`, error);
                    throw error;
                }
            },
            
            // Authentication
            async login(email, password) {
                const data = await this.request('/api/auth/login', {
                    method: 'POST',
                    body: JSON.stringify({ email, password })
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
                } catch (error) {
                    // Logout even if API call fails
                } finally {
                    this.token.value = null;
                    localStorage.removeItem('neumocare_token');
                    localStorage.removeItem('neumocare_user');
                }
            },
            
            // Dashboard
            async getDashboardStats() {
                return await this.request('/api/dashboard/stats');
            },
            
            async getOnCallToday() {
                return await this.request('/api/dashboard/oncall-today');
            },
            
            async getCalendarEvents(start, end) {
                return await this.request(`/api/dashboard/calendar?start=${start}&end=${end}`);
            },
            
            // Medical Staff
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
            
            // Departments
            async getDepartments() {
                return await this.request('/api/departments');
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
            
            async deleteDepartment(id) {
                return await this.request(`/api/departments/${id}`, {
                    method: 'DELETE'
                });
            },
            
            // Training Units
            async getTrainingUnits(filters = {}) {
                const params = new URLSearchParams(filters).toString();
                return await this.request(`/api/training-units${params ? '?' + params : ''}`);
            },
            
            async getTrainingUnitResidents(unitId) {
                return await this.request(`/api/training-units/${unitId}/residents`);
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
            
            // Rotations
            async getRotations(filters = {}) {
                const params = new URLSearchParams(filters).toString();
                return await this.request(`/api/rotations${params ? '?' + params : ''}`);
            },
            
            async createRotation(rotationData) {
                return await this.request('/api/rotations', {
                    method: 'POST',
                    body: JSON.stringify(rotationData)
                });
            },
            
            async quickPlacement(data) {
                return await this.request('/api/rotations/quick-placement', {
                    method: 'POST',
                    body: JSON.stringify(data)
                });
            },
            
            async bulkAssign(data) {
                return await this.request('/api/rotations/bulk-assign', {
                    method: 'POST',
                    body: JSON.stringify(data)
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
            
            // On-Call Schedule
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
            
            // Absences
            async getAbsences(filters = {}) {
                const params = new URLSearchParams(filters).toString();
                return await this.request(`/api/absences${params ? '?' + params : ''}`);
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
            
            async updateAbsenceCoverage(id, coverageData) {
                return await this.request(`/api/absences/${id}/coverage`, {
                    method: 'PUT',
                    body: JSON.stringify(coverageData)
                });
            },
            
            async approveAbsence(id, approved, reason = '') {
                return await this.request(`/api/absences/${id}/approve`, {
                    method: 'PUT',
                    body: JSON.stringify({ approved, rejection_reason: reason })
                });
            },
            
            async deleteAbsence(id) {
                return await this.request(`/api/absences/${id}`, {
                    method: 'DELETE'
                });
            },
            
            // Announcements
            async getAnnouncements() {
                return await this.request('/api/announcements');
            },
            
            async createAnnouncement(announcementData) {
                return await this.request('/api/announcements', {
                    method: 'POST',
                    body: JSON.stringify(announcementData)
                });
            },
            
            async deleteAnnouncement(id) {
                return await this.request(`/api/announcements/${id}`, {
                    method: 'DELETE'
                });
            },
            
            // User Profile
            async getUserProfile() {
                return await this.request('/api/users/profile');
            },
            
            async updateUserProfile(profileData) {
                return await this.request('/api/users/profile', {
                    method: 'PUT',
                    body: JSON.stringify(profileData)
                });
            },
            
            // System Settings
            async getSystemSettings() {
                return await this.request('/api/settings');
            },
            
            async updateSystemSettings(settingsData) {
                return await this.request('/api/settings', {
                    method: 'PUT',
                    body: JSON.stringify(settingsData)
                });
            },
            
            // Audit Logs
            async getAuditLogs(filters = {}) {
                const params = new URLSearchParams(filters).toString();
                return await this.request(`/api/audit-logs${params ? '?' + params : ''}`);
            },
            
            // Available Data (for dropdowns)
            async getAvailableData() {
                return await this.request('/api/available-data');
            },
            
            // Live Stats
            async getLiveStats() {
                return await this.request('/api/live-stats');
            },
            
            // Health Check
            async checkHealth() {
                return await this.request('/health');
            }
        };
        
        // ============ CREATE VUE APP ============
        const app = createApp({
            setup() {
                // ============ REACTIVE STATE ============
                const currentUser = ref(JSON.parse(localStorage.getItem('neumocare_user')) || null);
                const loginForm = reactive({ 
                    email: 'admin@neumocare.org', 
                    password: 'password123', 
                    remember_me: false 
                });
                
                // Loading states
                const loading = ref(false);
                const saving = ref(false);
                
                // UI state
                const currentView = ref(currentUser.value ? 'daily_operations' : 'login');
                const sidebarCollapsed = ref(false);
                const mobileMenuOpen = ref(false);
                const userMenuOpen = ref(false);
                const statsSidebarOpen = ref(false);
                const searchQuery = ref('');
                const searchScope = ref('All');
                const searchFilter = ref('all');
                
                // ============ FILTER STATES ============
                const staffFilter = reactive({
                    staff_type: '',
                    employment_status: '',
                    department_id: '',
                    search: ''
                });
                
                const rotationFilter = reactive({
                    resident_id: '',
                    status: '',
                    training_unit_id: ''
                });
                
                const absenceFilter = reactive({
                    staff_id: '',
                    status: '',
                    start_date: ''
                });
                
                const auditFilters = reactive({
                    dateRange: '',
                    actionType: '',
                    userId: ''
                });
                
                // ============ MODAL STATES ============
                const confirmationModal = reactive({
                    show: false,
                    title: '',
                    message: '',
                    icon: 'fa-question-circle',
                    confirmButtonText: 'Confirm',
                    confirmButtonClass: 'btn-primary',
                    onConfirm: null,
                    onCancel: null
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
                        resident_category: '',
                        training_level: '',
                        specialization: '',
                        years_experience: '',
                        biography: '',
                        office_phone: '',
                        mobile_phone: '',
                        medical_license: '',
                        date_of_birth: ''
                    }
                });
                
                const departmentModal = reactive({
                    show: false,
                    mode: 'add',
                    form: {
                        name: '',
                        code: '',
                        status: 'active',
                        description: '',
                        head_of_department_id: ''
                    }
                });
                
                const trainingUnitModal = reactive({
                    show: false,
                    mode: 'add',
                    form: {
                        unit_name: '',
                        unit_code: '',
                        department_id: '',
                        supervisor_id: '',
                        max_capacity: 10,
                        status: 'active',
                        description: ''
                    }
                });
                
                const rotationModal = reactive({
                    show: false,
                    mode: 'add',
                    form: {
                        resident_id: '',
                        training_unit_id: '',
                        start_date: new Date().toISOString().split('T')[0],
                        end_date: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        supervisor_id: '',
                        status: 'active',
                        goals: '',
                        notes: ''
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
                        coverage_notes: '',
                        status: 'scheduled'
                    }
                });
                
                const absenceModal = reactive({
                    show: false,
                    mode: 'add',
                    form: {
                        staff_member_id: '',
                        absence_reason: '',
                        start_date: new Date().toISOString().split('T')[0],
                        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        notes: '',
                        replacement_staff_id: '',
                        coverage_instructions: ''
                    }
                });
                
                const communicationsModal = reactive({
                    show: false,
                    activeTab: 'announcement',
                    form: {
                        announcement_title: '',
                        announcement_content: '',
                        publish_start_date: new Date().toISOString().split('T')[0],
                        publish_end_date: '',
                        priority_level: 'medium',
                        target_audience: 'all'
                    }
                });
                
                const quickPlacementModal = reactive({
                    show: false,
                    resident_id: '',
                    training_unit_id: '',
                    start_date: new Date().toISOString().split('T')[0],
                    duration: 4,
                    supervisor_id: '',
                    notes: ''
                });
                
                const bulkAssignModal = reactive({
                    show: false,
                    selectedResidents: [],
                    training_unit_id: '',
                    start_date: new Date().toISOString().split('T')[0],
                    duration: 4,
                    supervisor_id: ''
                });
                
                const userProfileModal = reactive({
                    show: false,
                    form: {
                        full_name: '',
                        email: '',
                        phone: '',
                        department_id: '',
                        notifications_enabled: true,
                        absence_notifications: true,
                        announcement_notifications: true
                    }
                });
                
                const systemSettingsModal = reactive({
                    show: false,
                    settings: {
                        hospital_name: 'NeumoCare Hospital',
                        default_department_id: '',
                        max_residents_per_unit: 10,
                        default_rotation_duration: 12,
                        enable_audit_logging: true,
                        require_mfa: false,
                        maintenance_mode: false,
                        notifications_enabled: true,
                        absence_notifications: true,
                        announcement_notifications: true
                    }
                });
                
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
                const availableData = ref({
                    departments: [],
                    residents: [],
                    attendings: [],
                    trainingUnits: []
                });
                
                // ============ UI STATE ============
                const toasts = ref([]);
                const activeAlerts = ref([]);
                const unreadNotifications = ref(0);
                
                // ============ LOADING STATES ============
                const loadingStats = ref(false);
                const loadingStaff = ref(false);
                const loadingDepartments = ref(false);
                const loadingTrainingUnits = ref(false);
                const loadingRotations = ref(false);
                const loadingAbsences = ref(false);
                const loadingSchedule = ref(false);
                const loadingAnnouncements = ref(false);
                const loadingAuditLogs = ref(false);
                const loadingAvailableData = ref(false);
                
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
                    setTimeout(() => removeToast(toast.id), duration);
                };
                
                const removeToast = (id) => {
                    const index = toasts.value.findIndex(t => t.id === id);
                    if (index > -1) toasts.value.splice(index, 1);
                };
                
                // ============ ALERT SYSTEM ============
                const dismissAlert = (alertId) => {
                    const index = activeAlerts.value.findIndex(alert => alert.id === alertId);
                    if (index > -1) activeAlerts.value.splice(index, 1);
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
                        onConfirm: options.onConfirm || null,
                        onCancel: options.onCancel || null
                    });
                };
                
                const confirmAction = async () => {
                    try {
                        if (confirmationModal.onConfirm) {
                            await confirmationModal.onConfirm();
                        }
                        confirmationModal.show = false;
                    } catch (error) {
                        console.error('Confirmation action error:', error);
                        showToast('Error', error.message, 'error');
                    }
                };
                
                const cancelConfirmation = () => {
                    try {
                        if (confirmationModal.onCancel) {
                            confirmationModal.onCancel();
                        }
                        confirmationModal.show = false;
                    } catch (error) {
                        console.error('Cancel confirmation error:', error);
                    }
                };
                
                // ============ FORMATTING FUNCTIONS ============
                const formatStaffType = (type) => {
                    const types = { 
                        medical_resident: 'Medical Resident', 
                        attending_physician: 'Attending Physician',
                        fellow: 'Fellow', 
                        nurse_practitioner: 'Nurse Practitioner' 
                    }; 
                    return types[type] || type;
                };
                
                const formatEmploymentStatus = (status) => {
                    const statuses = { active: 'Active', on_leave: 'On Leave', inactive: 'Inactive' };
                    return statuses[status] || status;
                };
                
                const formatTrainingLevel = (level) => {
                    const levels = {
                        pgy1: 'PGY-1',
                        pgy2: 'PGY-2',
                        pgy3: 'PGY-3',
                        pgy4: 'PGY-4',
                        other: 'Other'
                    };
                    return levels[level] || level;
                };
                
                const formatResidentCategory = (category) => {
                    const categories = {
                        department_internal: 'Department Internal',
                        rotating_other_dept: 'Rotating Other Dept',
                        external_institution: 'External Institution'
                    };
                    return categories[category] || category;
                };
                
                const formatRotationStatus = (status) => {
                    const statuses = {
                        active: 'Active',
                        upcoming: 'Upcoming',
                        completed: 'Completed',
                        cancelled: 'Cancelled'
                    };
                    return statuses[status] || status;
                };
                
                const formatAbsenceReason = (reason) => {
                    const reasons = {
                        vacation: 'Vacation',
                        sick_leave: 'Sick Leave',
                        conference: 'Conference/Education',
                        personal: 'Personal',
                        maternity_paternity: 'Maternity/Paternity',
                        administrative: 'Administrative Duty',
                        other: 'Other'
                    };
                    return reasons[reason] || reason;
                };
                
                const formatAbsenceStatus = (status) => {
                    const statuses = {
                        pending: 'Pending',
                        approved: 'Approved',
                        rejected: 'Rejected',
                        completed: 'Completed'
                    };
                    return statuses[status] || status;
                };
                
                const getStaffTypeClass = (type) => {
                    const classes = {
                        medical_resident: 'badge-primary',
                        attending_physician: 'badge-success',
                        fellow: 'badge-info',
                        nurse_practitioner: 'badge-warning'
                    };
                    return classes[type] || 'badge-secondary';
                };
                
                const getRotationStatusClass = (status) => {
                    const classes = {
                        active: 'status-available',
                        upcoming: 'status-oncall',
                        completed: 'status-busy',
                        cancelled: 'status-critical'
                    };
                    return classes[status] || 'badge-secondary';
                };
                
                const getAbsenceStatusClass = (status) => {
                    const classes = {
                        pending: 'status-busy',
                        approved: 'status-available',
                        rejected: 'status-critical',
                        completed: 'status-oncall'
                    };
                    return classes[status] || 'badge-secondary';
                };
                
                const calculateAbsenceDuration = (startDate, endDate) => {
                    try {
                        const start = new Date(startDate);
                        const end = new Date(endDate);
                        const diffTime = Math.abs(end - start);
                        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                    } catch {
                        return 0;
                    }
                };
                
                const formatTimeRange = (startTime, endTime) => {
                    if (!startTime || !endTime) return '';
                    return `${startTime.substring(0, 5)} - ${endTime.substring(0, 5)}`;
                };
                
                const formatAuditAction = (action) => {
                    const actions = {
                        create: 'Created',
                        update: 'Updated',
                        delete: 'Deleted',
                        login: 'Logged in',
                        logout: 'Logged out',
                        approve: 'Approved',
                        reject: 'Rejected'
                    };
                    return actions[action] || action;
                };
                
                // ============ PERMISSION FUNCTIONS ============
                const hasPermission = (resource, action) => {
                    if (!currentUser.value) return false;
                    if (currentUser.value.user_role === 'system_admin') return true;
                    
                    // Simple permission check - you can expand this based on your needs
                    const userRole = currentUser.value.user_role;
                    
                    // Define permissions for each role (simplified)
                    const permissions = {
                        department_head: ['medical_staff', 'training_units', 'resident_rotations', 'oncall_schedule', 'staff_absence', 'communications'],
                        resident_manager: ['medical_staff', 'training_units', 'resident_rotations', 'staff_absence'],
                        attending_physician: ['medical_staff', 'staff_absence'],
                        viewing_doctor: ['medical_staff']
                    };
                    
                    const allowedResources = permissions[userRole] || [];
                    return allowedResources.includes(resource);
                };
                
                // ============ DATA RELATIONSHIP FUNCTIONS ============
                const getDepartmentName = (departmentId) => {
                    if (!departmentId) return 'Unassigned';
                    const department = departments.value.find(d => d.id === departmentId);
                    return department ? department.name : `Department ${departmentId?.substring(0, 8) || 'Unknown'}`;
                };
                
                const getStaffName = (staffId) => {
                    if (!staffId) return 'Unknown';
                    const staff = medicalStaff.value.find(s => s.id === staffId);
                    return staff ? staff.full_name : `Staff ${staffId?.substring(0, 8) || 'Unknown'}`;
                };
                
                const getTrainingUnitName = (unitId) => {
                    if (!unitId) return 'Unknown Unit';
                    const unit = trainingUnits.value.find(u => u.id === unitId);
                    return unit ? unit.unit_name : `Unit ${unitId?.substring(0, 8) || 'Unknown'}`;
                };
                
                const getSupervisorName = (supervisorId) => {
                    if (!supervisorId) return 'Not assigned';
                    return getStaffName(supervisorId);
                };
                
                // ============ DATA LOADING FUNCTIONS ============
                const loadAvailableData = async () => {
                    loadingAvailableData.value = true;
                    try {
                        const data = await API.getAvailableData();
                        availableData.value = data;
                    } catch (error) {
                        console.error('Error loading available data:', error);
                        showToast('Error', 'Failed to load dropdown data', 'error');
                    } finally {
                        loadingAvailableData.value = false;
                    }
                };
                
                const loadMedicalStaff = async () => {
                    loadingStaff.value = true;
                    try {
                        const filters = {};
                        if (staffFilter.staff_type) filters.staff_type = staffFilter.staff_type;
                        if (staffFilter.employment_status) filters.employment_status = staffFilter.employment_status;
                        if (staffFilter.department_id) filters.department_id = staffFilter.department_id;
                        if (staffFilter.search) filters.search = staffFilter.search;
                        
                        const response = await API.getMedicalStaff(filters);
                        medicalStaff.value = response.data || [];
                    } catch (error) {
                        console.error('Error loading medical staff:', error);
                        showToast('Error', 'Failed to load medical staff', 'error');
                        medicalStaff.value = [];
                    } finally {
                        loadingStaff.value = false;
                    }
                };
                
                const loadDepartments = async () => {
                    loadingDepartments.value = true;
                    try {
                        const data = await API.getDepartments();
                        departments.value = data || [];
                    } catch (error) {
                        console.error('Error loading departments:', error);
                        departments.value = [];
                    } finally {
                        loadingDepartments.value = false;
                    }
                };
                
                const loadTrainingUnits = async () => {
                    loadingTrainingUnits.value = true;
                    try {
                        const data = await API.getTrainingUnits();
                        trainingUnits.value = data || [];
                    } catch (error) {
                        console.error('Error loading training units:', error);
                        trainingUnits.value = [];
                    } finally {
                        loadingTrainingUnits.value = false;
                    }
                };
                
                const loadResidentRotations = async () => {
                    loadingRotations.value = true;
                    try {
                        const filters = {};
                        if (rotationFilter.resident_id) filters.resident_id = rotationFilter.resident_id;
                        if (rotationFilter.status) filters.status = rotationFilter.status;
                        if (rotationFilter.training_unit_id) filters.training_unit_id = rotationFilter.training_unit_id;
                        
                        const response = await API.getRotations(filters);
                        residentRotations.value = response.data || [];
                    } catch (error) {
                        console.error('Error loading resident rotations:', error);
                        residentRotations.value = [];
                    } finally {
                        loadingRotations.value = false;
                    }
                };
                
                const loadStaffAbsences = async () => {
                    loadingAbsences.value = true;
                    try {
                        const filters = {};
                        if (absenceFilter.staff_id) filters.staff_id = absenceFilter.staff_id;
                        if (absenceFilter.status) filters.status = absenceFilter.status;
                        if (absenceFilter.start_date) filters.start_date = absenceFilter.start_date;
                        
                        const data = await API.getAbsences(filters);
                        staffAbsences.value = data || [];
                    } catch (error) {
                        console.error('Error loading staff absences:', error);
                        staffAbsences.value = [];
                    } finally {
                        loadingAbsences.value = false;
                    }
                };
                
                const loadOnCallSchedule = async () => {
                    loadingSchedule.value = true;
                    try {
                        // Load next 7 days by default
                        const today = new Date().toISOString().split('T')[0];
                        const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                        
                        const data = await API.getOnCallSchedule({
                            start_date: today,
                            end_date: nextWeek
                        });
                        onCallSchedule.value = data || [];
                    } catch (error) {
                        console.error('Error loading on-call schedule:', error);
                        onCallSchedule.value = [];
                    } finally {
                        loadingSchedule.value = false;
                    }
                };
                
                const loadAnnouncements = async () => {
                    loadingAnnouncements.value = true;
                    try {
                        const data = await API.getAnnouncements();
                        recentAnnouncements.value = data || [];
                    } catch (error) {
                        console.error('Error loading announcements:', error);
                        recentAnnouncements.value = [];
                    } finally {
                        loadingAnnouncements.value = false;
                    }
                };
                
                const loadAuditLogs = async () => {
                    loadingAuditLogs.value = true;
                    try {
                        const filters = {};
                        if (auditFilters.dateRange) filters.dateRange = auditFilters.dateRange;
                        if (auditFilters.actionType) filters.actionType = auditFilters.actionType;
                        if (auditFilters.userId) filters.userId = auditFilters.userId;
                        
                        const response = await API.getAuditLogs(filters);
                        auditLogs.value = response.data || [];
                    } catch (error) {
                        console.error('Error loading audit logs:', error);
                        auditLogs.value = [];
                    } finally {
                        loadingAuditLogs.value = false;
                    }
                };
                
                const loadSystemSettings = async () => {
                    try {
                        const data = await API.getSystemSettings();
                        systemSettings.value = data;
                    } catch (error) {
                        console.error('Error loading system settings:', error);
                        systemSettings.value = {};
                    }
                };
                
                const loadDashboardStats = async () => {
                    loadingStats.value = true;
                    try {
                        const stats = await API.getDashboardStats();
                        const onCall = await API.getOnCallToday();
                        const announcements = await API.getAnnouncements();
                        
                        // Update relevant data stores
                        recentAnnouncements.value = announcements || [];
                        // Stats can be used in computed properties
                        return { stats, onCall };
                    } catch (error) {
                        console.error('Error loading dashboard data:', error);
                        showToast('Error', 'Failed to load dashboard data', 'error');
                        return { stats: {}, onCall: [] };
                    } finally {
                        loadingStats.value = false;
                    }
                };
                
                const loadInitialData = async () => {
                    loading.value = true;
                    try {
                        await Promise.all([
                            loadMedicalStaff(),
                            loadDepartments(),
                            loadTrainingUnits(),
                            loadResidentRotations(),
                            loadStaffAbsences(),
                            loadOnCallSchedule(),
                            loadAnnouncements(),
                            loadSystemSettings(),
                            loadAvailableData()
                        ]);
                        
                        showToast('System Ready', 'All data loaded successfully', 'success');
                    } catch (error) {
                        console.error('Error loading initial data:', error);
                        showToast('Data Load Error', 'Failed to load system data', 'error');
                    } finally {
                        loading.value = false;
                    }
                };
                
                // ============ DATA SAVE FUNCTIONS ============
                const saveMedicalStaff = async () => {
                    saving.value = true;
                    try {
                        if (!hasPermission('medical_staff', medicalStaffModal.mode === 'add' ? 'create' : 'update')) {
                            throw new Error('Insufficient permissions');
                        }
                        
                        let result;
                        if (medicalStaffModal.mode === 'add') {
                            result = await API.createMedicalStaff(medicalStaffModal.form);
                            medicalStaff.value.unshift(result);
                            showToast('Success', 'Medical staff added successfully', 'success');
                        } else {
                            result = await API.updateMedicalStaff(medicalStaffModal.form.id, medicalStaffModal.form);
                            const index = medicalStaff.value.findIndex(s => s.id === result.id);
                            if (index !== -1) medicalStaff.value[index] = result;
                            showToast('Success', 'Medical staff updated successfully', 'success');
                        }
                        
                        medicalStaffModal.show = false;
                        resetMedicalStaffModal();
                        return result;
                    } catch (error) {
                        console.error('Error saving medical staff:', error);
                        showToast('Error', error.message, 'error');
                        throw error;
                    } finally {
                        saving.value = false;
                    }
                };
                
                const saveDepartment = async () => {
                    saving.value = true;
                    try {
                        if (!hasPermission('system', 'update')) {
                            throw new Error('Insufficient permissions');
                        }
                        
                        let result;
                        if (departmentModal.mode === 'add') {
                            result = await API.createDepartment(departmentModal.form);
                            departments.value.unshift(result);
                            showToast('Success', 'Department added successfully', 'success');
                        } else {
                            result = await API.updateDepartment(departmentModal.form.id, departmentModal.form);
                            const index = departments.value.findIndex(d => d.id === result.id);
                            if (index !== -1) departments.value[index] = result;
                            showToast('Success', 'Department updated successfully', 'success');
                        }
                        
                        departmentModal.show = false;
                        resetDepartmentModal();
                        return result;
                    } catch (error) {
                        console.error('Error saving department:', error);
                        showToast('Error', error.message, 'error');
                        throw error;
                    } finally {
                        saving.value = false;
                    }
                };
                
                const saveTrainingUnit = async () => {
                    saving.value = true;
                    try {
                        if (!hasPermission('training_units', trainingUnitModal.mode === 'add' ? 'create' : 'update')) {
                            throw new Error('Insufficient permissions');
                        }
                        
                        let result;
                        if (trainingUnitModal.mode === 'add') {
                            result = await API.createTrainingUnit(trainingUnitModal.form);
                            trainingUnits.value.unshift(result);
                            showToast('Success', 'Training unit added successfully', 'success');
                        } else {
                            result = await API.updateTrainingUnit(trainingUnitModal.form.id, trainingUnitModal.form);
                            const index = trainingUnits.value.findIndex(u => u.id === result.id);
                            if (index !== -1) trainingUnits.value[index] = result;
                            showToast('Success', 'Training unit updated successfully', 'success');
                        }
                        
                        trainingUnitModal.show = false;
                        resetTrainingUnitModal();
                        return result;
                    } catch (error) {
                        console.error('Error saving training unit:', error);
                        showToast('Error', error.message, 'error');
                        throw error;
                    } finally {
                        saving.value = false;
                    }
                };
                
                const saveRotation = async () => {
                    saving.value = true;
                    try {
                        if (!hasPermission('resident_rotations', rotationModal.mode === 'add' ? 'create' : 'update')) {
                            throw new Error('Insufficient permissions');
                        }
                        
                        // Validate dates
                        const startDate = new Date(rotationModal.form.start_date);
                        const endDate = new Date(rotationModal.form.end_date);
                        if (endDate <= startDate) {
                            throw new Error('End date must be after start date');
                        }
                        
                        let result;
                        if (rotationModal.mode === 'add') {
                            result = await API.createRotation(rotationModal.form);
                            residentRotations.value.unshift(result);
                            showToast('Success', 'Rotation added successfully', 'success');
                        } else {
                            result = await API.updateRotation(rotationModal.form.id, rotationModal.form);
                            const index = residentRotations.value.findIndex(r => r.id === result.id);
                            if (index !== -1) residentRotations.value[index] = result;
                            showToast('Success', 'Rotation updated successfully', 'success');
                        }
                        
                        rotationModal.show = false;
                        resetRotationModal();
                        return result;
                    } catch (error) {
                        console.error('Error saving rotation:', error);
                        showToast('Error', error.message, 'error');
                        throw error;
                    } finally {
                        saving.value = false;
                    }
                };
                
                const saveOnCall = async () => {
                    saving.value = true;
                    try {
                        if (!hasPermission('oncall_schedule', onCallModal.mode === 'add' ? 'create' : 'update')) {
                            throw new Error('Insufficient permissions');
                        }
                        
                        if (!onCallModal.form.duty_date) {
                            throw new Error('Duty date is required');
                        }
                        if (!onCallModal.form.primary_physician_id) {
                            throw new Error('Primary physician is required');
                        }
                        
                        let result;
                        if (onCallModal.mode === 'add') {
                            result = await API.createOnCall(onCallModal.form);
                            onCallSchedule.value.unshift(result);
                            showToast('Success', 'On-call schedule added successfully', 'success');
                        } else {
                            result = await API.updateOnCall(onCallModal.form.id, onCallModal.form);
                            const index = onCallSchedule.value.findIndex(s => s.id === result.id);
                            if (index !== -1) onCallSchedule.value[index] = result;
                            showToast('Success', 'On-call schedule updated successfully', 'success');
                        }
                        
                        onCallModal.show = false;
                        resetOnCallModal();
                        await loadOnCallSchedule(); // Refresh the list
                        return result;
                    } catch (error) {
                        console.error('Error saving on-call schedule:', error);
                        showToast('Error', error.message, 'error');
                        throw error;
                    } finally {
                        saving.value = false;
                    }
                };
                
                const saveAbsence = async () => {
                    saving.value = true;
                    try {
                        if (!hasPermission('staff_absence', absenceModal.mode === 'add' ? 'create' : 'update')) {
                            throw new Error('Insufficient permissions');
                        }
                        
                        // Validate dates
                        const startDate = new Date(absenceModal.form.start_date);
                        const endDate = new Date(absenceModal.form.end_date);
                        if (endDate <= startDate) {
                            throw new Error('End date must be after start date');
                        }
                        
                        let result;
                        if (absenceModal.mode === 'add') {
                            result = await API.createAbsence(absenceModal.form);
                            staffAbsences.value.unshift(result);
                            showToast('Success', 'Absence request submitted successfully', 'success');
                        } else {
                            result = await API.updateAbsence(absenceModal.form.id, absenceModal.form);
                            const index = staffAbsences.value.findIndex(a => a.id === result.id);
                            if (index !== -1) staffAbsences.value[index] = result;
                            showToast('Success', 'Absence request updated successfully', 'success');
                        }
                        
                        absenceModal.show = false;
                        resetAbsenceModal();
                        return result;
                    } catch (error) {
                        console.error('Error saving absence:', error);
                        showToast('Error', error.message, 'error');
                        throw error;
                    } finally {
                        saving.value = false;
                    }
                };
                
                const saveCommunication = async () => {
                    saving.value = true;
                    try {
                        if (!hasPermission('communications', 'create')) {
                            throw new Error('Insufficient permissions');
                        }
                        
                        if (!communicationsModal.form.announcement_title || !communicationsModal.form.announcement_content) {
                            throw new Error('Title and content are required');
                        }
                        
                        const result = await API.createAnnouncement(communicationsModal.form);
                        recentAnnouncements.value.unshift(result);
                        communicationsModal.show = false;
                        showToast('Success', 'Announcement posted successfully', 'success');
                        return result;
                    } catch (error) {
                        console.error('Error saving communication:', error);
                        showToast('Error', error.message, 'error');
                        throw error;
                    } finally {
                        saving.value = false;
                    }
                };
                
                const saveQuickPlacement = async () => {
                    saving.value = true;
                    try {
                        if (!hasPermission('placements', 'create')) {
                            throw new Error('Insufficient permissions');
                        }
                        
                        if (!quickPlacementModal.resident_id || !quickPlacementModal.training_unit_id) {
                            throw new Error('Resident and training unit are required');
                        }
                        
                        const result = await API.quickPlacement(quickPlacementModal);
                        residentRotations.value.unshift(result);
                        quickPlacementModal.show = false;
                        showToast('Success', 'Resident placed successfully', 'success');
                        return result;
                    } catch (error) {
                        console.error('Error saving quick placement:', error);
                        showToast('Error', error.message, 'error');
                        throw error;
                    } finally {
                        saving.value = false;
                    }
                };
                
                const saveBulkAssignment = async () => {
                    saving.value = true;
                    try {
                        if (!hasPermission('training_units', 'assign')) {
                            throw new Error('Insufficient permissions');
                        }
                        
                        if (!bulkAssignModal.selectedResidents || bulkAssignModal.selectedResidents.length === 0) {
                            throw new Error('Select at least one resident');
                        }
                        
                        if (!bulkAssignModal.training_unit_id) {
                            throw new Error('Training unit is required');
                        }
                        
                        const result = await API.bulkAssign(bulkAssignModal);
                        await loadResidentRotations(); // Refresh rotations
                        bulkAssignModal.show = false;
                        showToast('Success', `${bulkAssignModal.selectedResidents.length} resident${bulkAssignModal.selectedResidents.length === 1 ? '' : 's'} assigned successfully`, 'success');
                        return result;
                    } catch (error) {
                        console.error('Error saving bulk assignment:', error);
                        showToast('Error', error.message, 'error');
                        throw error;
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
                        return result;
                    } catch (error) {
                        console.error('Error saving user profile:', error);
                        showToast('Error', error.message, 'error');
                        throw error;
                    } finally {
                        saving.value = false;
                    }
                };
                
                const saveSystemSettings = async () => {
                    saving.value = true;
                    try {
                        if (!hasPermission('system', 'update')) {
                            throw new Error('Insufficient permissions');
                        }
                        
                        const result = await API.updateSystemSettings(systemSettingsModal.settings);
                        systemSettings.value = result;
                        systemSettingsModal.show = false;
                        showToast('Success', 'System settings saved successfully', 'success');
                        return result;
                    } catch (error) {
                        console.error('Error saving system settings:', error);
                        showToast('Error', error.message, 'error');
                        throw error;
                    } finally {
                        saving.value = false;
                    }
                };
                
                // ============ DELETE FUNCTIONS ============
                const deleteMedicalStaff = (staff) => {
                    showConfirmation({
                        title: 'Delete Medical Staff',
                        message: `Are you sure you want to deactivate ${staff.full_name}?`,
                        icon: 'fa-trash',
                        confirmButtonText: 'Deactivate',
                        confirmButtonClass: 'btn-danger',
                        onConfirm: async () => {
                            try {
                                if (!hasPermission('medical_staff', 'delete')) {
                                    throw new Error('Insufficient permissions');
                                }
                                
                                await API.deleteMedicalStaff(staff.id);
                                const index = medicalStaff.value.findIndex(s => s.id === staff.id);
                                if (index !== -1) medicalStaff.value.splice(index, 1);
                                showToast('Deleted', `${staff.full_name} has been deactivated`, 'success');
                            } catch (error) {
                                console.error('Error deleting medical staff:', error);
                                showToast('Error', error.message, 'error');
                            }
                        }
                    });
                };
                
                const deleteDepartment = (departmentId) => {
                    const department = departments.value.find(d => d.id === departmentId);
                    if (!department) return;
                    
                    showConfirmation({
                        title: 'Delete Department',
                        message: `Are you sure you want to delete ${department.name}? This action cannot be undone.`,
                        icon: 'fa-trash',
                        confirmButtonText: 'Delete',
                        confirmButtonClass: 'btn-danger',
                        onConfirm: async () => {
                            try {
                                if (!hasPermission('system', 'update')) {
                                    throw new Error('Insufficient permissions');
                                }
                                
                                await API.deleteDepartment(departmentId);
                                const index = departments.value.findIndex(d => d.id === departmentId);
                                if (index !== -1) departments.value.splice(index, 1);
                                showToast('Deleted', `${department.name} has been removed`, 'success');
                            } catch (error) {
                                console.error('Error deleting department:', error);
                                showToast('Error', error.message, 'error');
                            }
                        }
                    });
                };
                
                const deleteOnCallSchedule = (scheduleId) => {
                    showConfirmation({
                        title: 'Delete On-call Schedule',
                        message: 'Are you sure you want to delete this on-call schedule?',
                        icon: 'fa-trash',
                        confirmButtonText: 'Delete',
                        confirmButtonClass: 'btn-danger',
                        onConfirm: async () => {
                            try {
                                if (!hasPermission('oncall_schedule', 'delete')) {
                                    throw new Error('Insufficient permissions');
                                }
                                
                                await API.deleteOnCall(scheduleId);
                                const index = onCallSchedule.value.findIndex(s => s.id === scheduleId);
                                if (index !== -1) onCallSchedule.value.splice(index, 1);
                                showToast('Deleted', 'On-call schedule has been removed', 'success');
                            } catch (error) {
                                console.error('Error deleting on-call schedule:', error);
                                showToast('Error', error.message, 'error');
                            }
                        }
                    });
                };
                
                const deleteAbsence = (absenceId) => {
                    showConfirmation({
                        title: 'Delete Absence Record',
                        message: 'Are you sure you want to delete this absence record?',
                        icon: 'fa-trash',
                        confirmButtonText: 'Delete',
                        confirmButtonClass: 'btn-danger',
                        onConfirm: async () => {
                            try {
                                if (!hasPermission('staff_absence', 'delete')) {
                                    throw new Error('Insufficient permissions');
                                }
                                
                                await API.deleteAbsence(absenceId);
                                const index = staffAbsences.value.findIndex(a => a.id === absenceId);
                                if (index !== -1) staffAbsences.value.splice(index, 1);
                                showToast('Deleted', 'Absence record has been removed', 'success');
                            } catch (error) {
                                console.error('Error deleting absence record:', error);
                                showToast('Error', error.message, 'error');
                            }
                        }
                    });
                };
                
                const deleteAnnouncement = (announcementId) => {
                    showConfirmation({
                        title: 'Delete Announcement',
                        message: 'Are you sure you want to delete this announcement?',
                        icon: 'fa-trash',
                        confirmButtonText: 'Delete',
                        confirmButtonClass: 'btn-danger',
                        onConfirm: async () => {
                            try {
                                if (!hasPermission('communications', 'delete')) {
                                    throw new Error('Insufficient permissions');
                                }
                                
                                await API.deleteAnnouncement(announcementId);
                                const index = recentAnnouncements.value.findIndex(a => a.id === announcementId);
                                if (index !== -1) recentAnnouncements.value.splice(index, 1);
                                showToast('Deleted', 'Announcement has been removed', 'success');
                            } catch (error) {
                                console.error('Error deleting announcement:', error);
                                showToast('Error', error.message, 'error');
                            }
                        }
                    });
                };
                
                // ============ HELPER FUNCTIONS ============
                const resetMedicalStaffModal = () => {
                    medicalStaffModal.form = {
                        full_name: '',
                        staff_type: 'medical_resident',
                        staff_id: '',
                        employment_status: 'active',
                        professional_email: '',
                        department_id: '',
                        resident_category: '',
                        training_level: '',
                        specialization: '',
                        years_experience: '',
                        biography: '',
                        office_phone: '',
                        mobile_phone: '',
                        medical_license: '',
                        date_of_birth: ''
                    };
                };
                
                const resetDepartmentModal = () => {
                    departmentModal.form = {
                        name: '',
                        code: '',
                        status: 'active',
                        description: '',
                        head_of_department_id: ''
                    };
                };
                
                const resetTrainingUnitModal = () => {
                    trainingUnitModal.form = {
                        unit_name: '',
                        unit_code: '',
                        department_id: '',
                        supervisor_id: '',
                        max_capacity: 10,
                        status: 'active',
                        description: ''
                    };
                };
                
                const resetRotationModal = () => {
                    rotationModal.form = {
                        resident_id: '',
                        training_unit_id: '',
                        start_date: new Date().toISOString().split('T')[0],
                        end_date: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        supervisor_id: '',
                        status: 'active',
                        goals: '',
                        notes: ''
                    };
                };
                
                const resetOnCallModal = () => {
                    onCallModal.form = {
                        duty_date: new Date().toISOString().split('T')[0],
                        shift_type: 'primary_call',
                        start_time: '08:00',
                        end_time: '17:00',
                        primary_physician_id: '',
                        backup_physician_id: '',
                        coverage_notes: '',
                        status: 'scheduled'
                    };
                };
                
                const resetAbsenceModal = () => {
                    absenceModal.form = {
                        staff_member_id: '',
                        absence_reason: '',
                        start_date: new Date().toISOString().split('T')[0],
                        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        notes: '',
                        replacement_staff_id: '',
                        coverage_instructions: ''
                    };
                };
                
                // ============ UI FUNCTIONS ============
                const switchView = (view) => {
                    if (!currentUser.value && view !== 'login') return;
                    
                    currentView.value = view;
                    mobileMenuOpen.value = false;
                    
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
                
                const getCurrentTitle = () => {
                    const titles = {
                        daily_operations: 'Daily Operations',
                        medical_staff: 'Medical Staff',
                        resident_rotations: 'Resident Rotations',
                        oncall_schedule: 'On-call Schedule',
                        staff_absence: 'Staff Absence',
                        training_units: 'Training Units',
                        department_management: 'Department Management',
                        communications: 'Communications',
                        audit_logs: 'Audit Logs',
                        system_settings: 'System Settings',
                        login: 'Login'
                    };
                    return titles[currentView.value] || 'NeumoCare';
                };
                
                const getCurrentSubtitle = () => {
                    const subtitles = {
                        daily_operations: 'Dashboard Overview',
                        medical_staff: 'Manage Medical Staff',
                        resident_rotations: 'Resident Rotation Management',
                        oncall_schedule: 'On-call Scheduling',
                        staff_absence: 'Staff Absence Tracking',
                        training_units: 'Training Units Management',
                        department_management: 'Department Structure',
                        communications: 'Department Communications',
                        audit_logs: 'System Audit Trail',
                        system_settings: 'System Configuration',
                        login: 'Hospital Management System'
                    };
                    return subtitles[currentView.value] || '';
                };
                
                // ============ MODAL FUNCTIONS ============
                const showAddMedicalStaffModal = () => {
                    if (!hasPermission('medical_staff', 'create')) {
                        showToast('Permission Denied', 'You need create permission to add medical staff', 'error');
                        return;
                    }
                    medicalStaffModal.mode = 'add';
                    medicalStaffModal.show = true;
                    medicalStaffModal.activeTab = 'basic';
                    resetMedicalStaffModal();
                };
                
                const editMedicalStaff = (staff) => {
                    if (!hasPermission('medical_staff', 'update')) {
                        showToast('Permission Denied', 'You need update permission to edit medical staff', 'error');
                        return;
                    }
                    medicalStaffModal.mode = 'edit';
                    medicalStaffModal.show = true;
                    medicalStaffModal.activeTab = 'basic';
                    medicalStaffModal.form = { ...staff };
                };
                
                const showAddDepartmentModal = () => {
                    if (!hasPermission('system', 'update')) {
                        showToast('Permission Denied', 'You need permission to manage departments', 'error');
                        return;
                    }
                    departmentModal.mode = 'add';
                    departmentModal.show = true;
                    resetDepartmentModal();
                };
                
                const editDepartment = (department) => {
                    if (!hasPermission('system', 'update')) {
                        showToast('Permission Denied', 'You need permission to edit departments', 'error');
                        return;
                    }
                    departmentModal.mode = 'edit';
                    departmentModal.show = true;
                    departmentModal.form = { ...department };
                };
                
                const showAddTrainingUnitModal = () => {
                    if (!hasPermission('training_units', 'create')) {
                        showToast('Permission Denied', 'You need create permission', 'error');
                        return;
                    }
                    trainingUnitModal.mode = 'add';
                    trainingUnitModal.show = true;
                    resetTrainingUnitModal();
                };
                
                const editTrainingUnit = (unit) => {
                    if (!hasPermission('training_units', 'update')) {
                        showToast('Permission Denied', 'You need update permission', 'error');
                        return;
                    }
                    trainingUnitModal.mode = 'edit';
                    trainingUnitModal.show = true;
                    trainingUnitModal.form = { ...unit };
                };
                
                const showAddRotationModal = () => {
                    if (!hasPermission('resident_rotations', 'create')) {
                        showToast('Permission Denied', 'You need create permission', 'error');
                        return;
                    }
                    rotationModal.mode = 'add';
                    rotationModal.show = true;
                    resetRotationModal();
                };
                
                const editRotation = (rotation) => {
                    if (!hasPermission('resident_rotations', 'update')) {
                        showToast('Permission Denied', 'You need update permission', 'error');
                        return;
                    }
                    rotationModal.mode = 'edit';
                    rotationModal.show = true;
                    rotationModal.form = { ...rotation };
                };
                
                const showAddOnCallModal = () => {
                    if (!hasPermission('oncall_schedule', 'create')) {
                        showToast('Permission Denied', 'You need create permission', 'error');
                        return;
                    }
                    onCallModal.mode = 'add';
                    onCallModal.show = true;
                    resetOnCallModal();
                };
                
                const editOnCallSchedule = (schedule) => {
                    if (!hasPermission('oncall_schedule', 'update')) {
                        showToast('Permission Denied', 'You need update permission', 'error');
                        return;
                    }
                    onCallModal.mode = 'edit';
                    onCallModal.show = true;
                    onCallModal.form = { ...schedule };
                };
                
                const showAddAbsenceModal = () => {
                    if (!hasPermission('staff_absence', 'create')) {
                        showToast('Permission Denied', 'You need create permission', 'error');
                        return;
                    }
                    absenceModal.mode = 'add';
                    absenceModal.show = true;
                    resetAbsenceModal();
                };
                
                const editAbsence = (absence) => {
                    if (!hasPermission('staff_absence', 'update')) {
                        showToast('Permission Denied', 'You need update permission', 'error');
                        return;
                    }
                    absenceModal.mode = 'edit';
                    absenceModal.show = true;
                    absenceModal.form = {
                        ...absence,
                        absence_reason: absence.leave_category,
                        start_date: absence.leave_start_date,
                        end_date: absence.leave_end_date,
                        replacement_staff_id: absence.replacement_staff_id || ''
                    };
                };
                
                const showCommunicationsModal = () => {
                    if (!hasPermission('communications', 'create')) {
                        showToast('Permission Denied', 'You need create permission', 'error');
                        return;
                    }
                    communicationsModal.show = true;
                    communicationsModal.activeTab = 'announcement';
                    communicationsModal.form.publish_start_date = new Date().toISOString().split('T')[0];
                };
                
                const showQuickPlacementModal = () => {
                    if (!hasPermission('placements', 'create')) {
                        showToast('Permission Denied', 'You need create permission', 'error');
                        return;
                    }
                    quickPlacementModal.show = true;
                    quickPlacementModal.start_date = new Date().toISOString().split('T')[0];
                };
                
                const showBulkAssignModal = () => {
                    if (!hasPermission('training_units', 'assign')) {
                        showToast('Permission Denied', 'You need assign permission', 'error');
                        return;
                    }
                    bulkAssignModal.show = true;
                    bulkAssignModal.start_date = new Date().toISOString().split('T')[0];
                };
                
                const showUserProfile = () => {
                    userProfileModal.show = true;
                    userProfileModal.form = {
                        full_name: currentUser.value?.full_name || '',
                        email: currentUser.value?.email || '',
                        phone: currentUser.value?.phone_number || '',
                        department_id: currentUser.value?.department_id || '',
                        notifications_enabled: currentUser.value?.notifications_enabled ?? true,
                        absence_notifications: currentUser.value?.absence_notifications ?? true,
                        announcement_notifications: currentUser.value?.announcement_notifications ?? true
                    };
                };
                
                const showSystemSettingsModal = () => {
                    if (!hasPermission('system', 'read')) {
                        showToast('Permission Denied', 'You need read permission', 'error');
                        return;
                    }
                    systemSettingsModal.show = true;
                    systemSettingsModal.settings = { ...systemSettings.value };
                };
                
                // ============ VIEW FUNCTIONS ============
                const viewStaffDetails = async (staff) => {
                    try {
                        const details = await API.getMedicalStaffById(staff.id);
                        staffDetailsModal.staff = details;
                        staffDetailsModal.show = true;
                        staffDetailsModal.activeTab = 'personal';
                        
                        // Calculate stats
                        const rotations = residentRotations.value.filter(r => r.resident_id === staff.id);
                        const oncallShifts = onCallSchedule.value.filter(s => s.primary_physician_id === staff.id).length;
                        const absences = staffAbsences.value.filter(a => a.staff_member_id === staff.id);
                        const supervisionCount = residentRotations.value.filter(r => r.supervisor_id === staff.id).length;
                        
                        staffDetailsModal.stats = {
                            completedRotations: rotations.filter(r => r.status === 'completed').length,
                            oncallShifts: oncallShifts,
                            absenceDays: absences.reduce((total, absence) => {
                                return total + calculateAbsenceDuration(absence.leave_start_date, absence.leave_end_date);
                            }, 0),
                            supervisionCount: supervisionCount
                        };
                        
                        const currentRotation = rotations.find(r => r.status === 'active');
                        staffDetailsModal.currentRotation = currentRotation ? 
                            `${getTrainingUnitName(currentRotation.training_unit_id)} (${Utils.formatDate(currentRotation.start_date)} - ${Utils.formatDate(currentRotation.end_date)})` :
                            'No active rotation';
                        
                        const today = new Date().toISOString().split('T')[0];
                        const nextOncall = onCallSchedule.value
                            .filter(s => s.primary_physician_id === staff.id && s.duty_date >= today)
                            .sort((a, b) => new Date(a.duty_date) - new Date(b.duty_date))[0];
                        
                        staffDetailsModal.nextOncall = nextOncall ? 
                            `${Utils.formatDate(nextOncall.duty_date)} (${nextOncall.shift_type})` :
                            'No upcoming on-call';
                    } catch (error) {
                        console.error('Error loading staff details:', error);
                        showToast('Error', 'Failed to load staff details', 'error');
                    }
                };
                
                const assignRotationToStaff = (staff) => {
                    if (!hasPermission('resident_rotations', 'create')) {
                        showToast('Permission Denied', 'You need create permission', 'error');
                        return;
                    }
                    
                    if (staff.staff_type !== 'medical_resident') {
                        showToast('Error', 'Only residents can be assigned rotations', 'error');
                        return;
                    }
                    
                    rotationModal.mode = 'add';
                    rotationModal.show = true;
                    rotationModal.form.resident_id = staff.id;
                    rotationModal.form.start_date = new Date().toISOString().split('T')[0];
                    const endDate = new Date();
                    endDate.setDate(endDate.getDate() + 28);
                    rotationModal.form.end_date = endDate.toISOString().split('T')[0];
                };
                
                const assignResidentToUnit = (unit) => {
                    if (!hasPermission('training_units', 'assign')) {
                        showToast('Permission Denied', 'You need assign permission', 'error');
                        return;
                    }
                    quickPlacementModal.show = true;
                    quickPlacementModal.training_unit_id = unit.id;
                    quickPlacementModal.start_date = new Date().toISOString().split('T')[0];
                };
                
                const assignCoverage = (absence) => {
                    if (!hasPermission('staff_absence', 'update')) {
                        showToast('Permission Denied', 'You need update permission', 'error');
                        return;
                    }
                    absenceModal.mode = 'edit';
                    absenceModal.show = true;
                    absenceModal.form = {
                        ...absence,
                        absence_reason: absence.leave_category,
                        start_date: absence.leave_start_date,
                        end_date: absence.leave_end_date
                    };
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
                        await loadInitialData();
                        currentView.value = 'daily_operations';
                    } catch (error) {
                        console.error('Login error:', error);
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
                            await API.logout();
                            currentUser.value = null;
                            currentView.value = 'login';
                            userMenuOpen.value = false;
                            showToast('Logged Out', 'You have been successfully logged out', 'info');
                        }
                    });
                };
                
                // ============ COMPUTED PROPERTIES ============
                const filteredMedicalStaff = computed(() => {
                    let filtered = medicalStaff.value;
                    
                    if (staffFilter.search) {
                        const search = staffFilter.search.toLowerCase();
                        filtered = filtered.filter(s => 
                            s.full_name.toLowerCase().includes(search) ||
                            (s.staff_id && s.staff_id.toLowerCase().includes(search)) ||
                            (s.professional_email && s.professional_email.toLowerCase().includes(search))
                        );
                    }
                    
                    if (staffFilter.staff_type) {
                        filtered = filtered.filter(s => s.staff_type === staffFilter.staff_type);
                    }
                    
                    if (staffFilter.employment_status) {
                        filtered = filtered.filter(s => s.employment_status === staffFilter.employment_status);
                    }
                    
                    if (staffFilter.department_id) {
                        filtered = filtered.filter(s => s.department_id === staffFilter.department_id);
                    }
                    
                    return filtered;
                });
                
                const filteredRotations = computed(() => {
                    let filtered = residentRotations.value;
                    
                    if (rotationFilter.resident_id) {
                        filtered = filtered.filter(r => r.resident_id === rotationFilter.resident_id);
                    }
                    
                    if (rotationFilter.status) {
                        filtered = filtered.filter(r => r.status === rotationFilter.status);
                    }
                    
                    if (rotationFilter.training_unit_id) {
                        filtered = filtered.filter(r => r.training_unit_id === rotationFilter.training_unit_id);
                    }
                    
                    return filtered;
                });
                
                const filteredAbsences = computed(() => {
                    let filtered = staffAbsences.value;
                    
                    if (absenceFilter.staff_id) {
                        filtered = filtered.filter(a => a.staff_member_id === absenceFilter.staff_id);
                    }
                    
                    if (absenceFilter.status) {
                        filtered = filtered.filter(a => a.approval_status === absenceFilter.status);
                    }
                    
                    if (absenceFilter.start_date) {
                        filtered = filtered.filter(a => a.leave_start_date >= absenceFilter.start_date);
                    }
                    
                    return filtered;
                });
                
                const residents = computed(() => {
                    return medicalStaff.value.filter(staff => staff.staff_type === 'medical_resident');
                });
                
                const attendings = computed(() => {
                    return medicalStaff.value.filter(staff => staff.staff_type === 'attending_physician');
                });
                
                const liveStats = computed(() => {
                    const today = new Date().toISOString().split('T')[0];
                    
                    const activeStaff = medicalStaff.value.filter(s => s.employment_status === 'active').length;
                    const activeResidents = residents.value.length;
                    const todayOnCall = onCallSchedule.value.filter(s => s.duty_date === today).length;
                    const pendingAbsences = staffAbsences.value.filter(a => a.approval_status === 'pending').length;
                    
                    return {
                        onDutyStaff: activeStaff,
                        activeResidents: activeResidents,
                        todayOnCall: todayOnCall,
                        pendingAbsences: pendingAbsences,
                        activeAlerts: activeAlerts.value.length
                    };
                });
                
                const todaysOnCall = computed(() => {
                    const today = new Date().toISOString().split('T')[0];
                    return onCallSchedule.value.filter(schedule => schedule.duty_date === today)
                        .map(schedule => ({
                            ...schedule,
                            physician_name: getStaffName(schedule.primary_physician_id),
                            role: schedule.shift_type === 'primary_call' ? 'Primary' : 'Backup',
                            contact_number: 'Ext. 5555'
                        }));
                });
                
                // ============ FILTER FUNCTIONS ============
                const applyStaffFilters = () => {
                    loadMedicalStaff();
                    showToast('Filters Applied', 'Medical staff filters have been applied', 'info');
                };
                
                const resetStaffFilters = () => {
                    staffFilter.staff_type = '';
                    staffFilter.employment_status = '';
                    staffFilter.department_id = '';
                    staffFilter.search = '';
                    loadMedicalStaff();
                    showToast('Filters Reset', 'All filters have been reset', 'info');
                };
                
                const applyRotationFilters = () => {
                    loadResidentRotations();
                    showToast('Filters Applied', 'Rotation filters have been applied', 'info');
                };
                
                const resetRotationFilters = () => {
                    rotationFilter.resident_id = '';
                    rotationFilter.status = '';
                    rotationFilter.training_unit_id = '';
                    loadResidentRotations();
                    showToast('Filters Reset', 'Rotation filters have been reset', 'info');
                };
                
                const applyAbsenceFilters = () => {
                    loadStaffAbsences();
                    showToast('Filters Applied', 'Absence filters have been applied', 'info');
                };
                
                const resetAbsenceFilters = () => {
                    absenceFilter.staff_id = '';
                    absenceFilter.status = '';
                    absenceFilter.start_date = '';
                    loadStaffAbsences();
                    showToast('Filters Reset', 'Absence filters have been reset', 'info');
                };
                
                const applyAuditFilters = () => {
                    loadAuditLogs();
                    showToast('Filters Applied', 'Audit filters have been applied', 'info');
                };
                
                const resetAuditFilters = () => {
                    auditFilters.dateRange = '';
                    auditFilters.actionType = '';
                    auditFilters.userId = '';
                    loadAuditLogs();
                    showToast('Filters Reset', 'Audit filters have been reset', 'info');
                };
                
                // ============ SEARCH FUNCTIONS ============
                const handleSearch = () => {
                    if (!searchQuery.value.trim()) {
                        showToast('Search', 'Please enter a search term', 'warning');
                        return;
                    }
                    
                    const scope = searchScope.value.toLowerCase();
                    const query = searchQuery.value.toLowerCase();
                    
                    let results = [];
                    
                    switch (scope) {
                        case 'all':
                            results.push(...medicalStaff.value.filter(s => 
                                s.full_name.toLowerCase().includes(query) ||
                                s.professional_email?.toLowerCase().includes(query) ||
                                s.staff_id?.toLowerCase().includes(query)
                            ));
                            results.push(...departments.value.filter(d => 
                                d.name.toLowerCase().includes(query) ||
                                d.code.toLowerCase().includes(query)
                            ));
                            results.push(...trainingUnits.value.filter(u => 
                                u.unit_name.toLowerCase().includes(query) ||
                                u.unit_code.toLowerCase().includes(query)
                            ));
                            break;
                        case 'staff':
                            results = medicalStaff.value.filter(s => 
                                s.full_name.toLowerCase().includes(query) ||
                                s.professional_email?.toLowerCase().includes(query) ||
                                s.staff_id?.toLowerCase().includes(query)
                            );
                            break;
                        case 'units':
                            results = trainingUnits.value.filter(u => 
                                u.unit_name.toLowerCase().includes(query) ||
                                u.unit_code.toLowerCase().includes(query)
                            );
                            break;
                    }
                    
                    if (results.length > 0) {
                        showToast('Search Results', `Found ${results.length} result${results.length === 1 ? '' : 's'}`, 'info');
                    } else {
                        showToast('Search', 'No results found', 'warning');
                    }
                };
                
                const toggleSearchScope = () => {
                    const scopes = ['All', 'Staff', 'Units'];
                    const currentIndex = scopes.indexOf(searchScope.value);
                    searchScope.value = scopes[(currentIndex + 1) % scopes.length];
                };
                
                // ============ UI FUNCTIONS ============
                const toggleStatsSidebar = () => {
                    statsSidebarOpen.value = !statsSidebarOpen.value;
                };
                
                const toggleUserMenu = () => {
                    userMenuOpen.value = !userMenuOpen.value;
                };
                
                const toggleActionMenu = (event) => {
                    event.stopPropagation();
                    const dropdown = event.target.closest('.action-dropdown');
                    if (dropdown) {
                        const menu = dropdown.querySelector('.action-menu');
                        if (menu) {
                            menu.classList.toggle('show');
                        }
                    }
                };
                
                // ============ LIFECYCLE HOOKS ============
                onMounted(() => {
                    console.log('Frontend app mounted successfully');
                    
                    // Check for existing session
                    if (currentUser.value) {
                        loadInitialData();
                    }
                    
                    // Close dropdowns when clicking outside
                    document.addEventListener('click', function(event) {
                        if (!event.target.closest('.action-dropdown')) {
                            document.querySelectorAll('.action-menu.show').forEach(menu => {
                                menu.classList.remove('show');
                            });
                        }
                        
                        if (!event.target.closest('.user-menu')) {
                            userMenuOpen.value = false;
                        }
                    });
                });
                
                // ============ RETURN STATEMENT ============
                return {
                    // State Variables
                    currentUser,
                    loginForm,
                    loading,
                    saving,
                    currentView,
                    sidebarCollapsed,
                    mobileMenuOpen,
                    userMenuOpen,
                    statsSidebarOpen,
                    searchQuery,
                    searchScope,
                    searchFilter,
                    
                    // Modal States
                    confirmationModal,
                    staffDetailsModal,
                    medicalStaffModal,
                    departmentModal,
                    trainingUnitModal,
                    rotationModal,
                    onCallModal,
                    absenceModal,
                    communicationsModal,
                    quickPlacementModal,
                    bulkAssignModal,
                    userProfileModal,
                    systemSettingsModal,
                    
                    // Data Stores
                    medicalStaff,
                    departments,
                    trainingUnits,
                    residentRotations,
                    staffAbsences,
                    onCallSchedule,
                    recentAnnouncements,
                    auditLogs,
                    systemSettings,
                    availableData,
                    
                    // UI State
                    toasts,
                    activeAlerts,
                    unreadNotifications,
                    
                    // Filters
                    staffFilter,
                    rotationFilter,
                    absenceFilter,
                    auditFilters,
                    
                    // Loading States
                    loadingStats,
                    loadingStaff,
                    loadingDepartments,
                    loadingTrainingUnits,
                    loadingRotations,
                    loadingAbsences,
                    loadingSchedule,
                    loadingAnnouncements,
                    loadingAuditLogs,
                    loadingAvailableData,
                    
                    // Computed Properties
                    liveStats,
                    filteredMedicalStaff,
                    filteredRotations,
                    filteredAbsences,
                    todaysOnCall,
                    residents,
                    attendings,
                    
                    // Utility Functions
                    getInitials: Utils.getInitials,
                    formatDate: Utils.formatDate,
                    formatDateTime: Utils.formatDateTime,
                    formatTimeAgo: Utils.formatTimeAgo,
                    formatStaffType,
                    getStaffTypeClass,
                    formatEmploymentStatus,
                    formatTrainingLevel,
                    formatResidentCategory,
                    formatRotationStatus,
                    getRotationStatusClass,
                    formatAbsenceReason,
                    formatAbsenceStatus,
                    getAbsenceStatusClass,
                    calculateAbsenceDuration,
                    formatTimeRange,
                    formatAuditAction,
                    getDepartmentName,
                    getStaffName,
                    getTrainingUnitName,
                    getSupervisorName,
                    
                    // Permission Functions
                    hasPermission,
                    
                    // Navigation Functions
                    switchView,
                    getCurrentTitle,
                    getCurrentSubtitle,
                    
                    // Modal Functions
                    showConfirmation,
                    confirmAction,
                    cancelConfirmation,
                    showAddMedicalStaffModal,
                    editMedicalStaff,
                    saveMedicalStaff,
                    deleteMedicalStaff,
                    showAddDepartmentModal,
                    editDepartment,
                    saveDepartment,
                    deleteDepartment,
                    showAddTrainingUnitModal,
                    editTrainingUnit,
                    saveTrainingUnit,
                    showAddRotationModal,
                    editRotation,
                    saveRotation,
                    showAddOnCallModal,
                    editOnCallSchedule,
                    saveOnCall,
                    deleteOnCallSchedule,
                    showAddAbsenceModal,
                    editAbsence,
                    assignCoverage,
                    deleteAbsence,
                    saveAbsence,
                    showCommunicationsModal,
                    saveCommunication,
                    deleteAnnouncement,
                    showQuickPlacementModal,
                    saveQuickPlacement,
                    showBulkAssignModal,
                    saveBulkAssignment,
                    showUserProfile,
                    saveUserProfile,
                    showSystemSettingsModal,
                    saveSystemSettings,
                    
                    // View Functions
                    viewStaffDetails,
                    assignRotationToStaff,
                    assignResidentToUnit,
                    
                    // Filter Functions
                    applyStaffFilters,
                    resetStaffFilters,
                    applyRotationFilters,
                    resetRotationFilters,
                    applyAbsenceFilters,
                    resetAbsenceFilters,
                    applyAuditFilters,
                    resetAuditFilters,
                    
                    // Search Functions
                    handleSearch,
                    toggleSearchScope,
                    
                    // Authentication Functions
                    handleLogin,
                    handleLogout,
                    
                    // UI Functions
                    removeToast,
                    showToast,
                    dismissAlert,
                    toggleStatsSidebar,
                    toggleUserMenu,
                    toggleActionMenu,
                    
                    // Data Loading Functions
                    loadMedicalStaff,
                    loadDepartments,
                    loadTrainingUnits,
                    loadResidentRotations,
                    loadStaffAbsences,
                    loadOnCallSchedule,
                    loadAnnouncements,
                    loadAuditLogs,
                    loadDashboardStats
                };
            },
            
            // Error boundary
            errorCaptured(err, instance, info) {
                console.error('Vue error captured:', err, info);
                this.showToast?.('System Error', 'An error occurred. Please refresh the page.', 'error');
                return false;
            }
        });
        
        // ============ MOUNT THE APP ============
        app.mount('#app');
        console.log('Frontend Vue app mounted successfully');
        
    } catch (error) {
        console.error('FATAL ERROR: Frontend failed to initialize:', error);
        // Display fatal error UI
        document.body.innerHTML = `
            <div style="padding: 40px; text-align: center; margin-top: 100px; color: #333; font-family: Arial, sans-serif;">
                <h2 style="color: #dc3545;">System Error</h2>
                <p style="margin: 20px 0; color: #666;">${error.message}</p>
                <p style="margin: 20px 0; color: #666;">Please check your browser console for details.</p>
                <button onclick="window.location.reload()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Refresh Page
                </button>
            </div>
        `;
    }
});
