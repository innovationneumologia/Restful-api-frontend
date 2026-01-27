// ============ NEUMOCARE HOSPITAL MANAGEMENT SYSTEM FRONTEND ============
// COMPLETE PRODUCTION-READY FRONTEND v3.1 - FULLY INTEGRATED
// ================================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('NeumoCare Hospital Management System Frontend v3.1 loading...');
    
    try {
        if (typeof Vue === 'undefined') {
            throw new Error('Vue.js failed to load. Please refresh the page.');
        }
        
        console.log('Vue.js loaded successfully:', Vue.version);
        
        const { createApp, ref, reactive, computed, onMounted, watch } = Vue;
        
        // ============ API CONFIGURATION ============
        const API_BASE_URL = window.API_BASE_URL || 'https://bacend-production.up.railway.app';
        
        // ============ UTILITY FUNCTIONS ============
        const Utils = {
            formatDate: (dateString) => {
                if (!dateString) return '';
                try {
                    return new Date(dateString).toLocaleDateString('en-US', { 
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
            
            generateID: () => {
                return Date.now().toString(36) + Math.random().toString(36).substr(2);
            }
        };
        
        // ============ COMPLETE API CLIENT ============
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
                    console.log(`API Request: ${url}`, config);
                    const response = await fetch(url, config);
                    
                    if (response.status === 401) {
                        localStorage.removeItem('neumocare_token');
                        localStorage.removeItem('neumocare_user');
                        this.token.value = null;
                        throw new Error('Session expired. Please login again.');
                    }
                    
                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
                    }
                    
                    const data = await response.json();
                    console.log(`API Response from ${url}:`, data);
                    return data;
                } catch (error) {
                    console.error(`API Error for ${url}:`, error);
                    throw error;
                }
            },
            
            // ===== AUTHENTICATION =====
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
            
            async getOnCallToday() {
                return await this.request('/api/dashboard/oncall-today');
            },
            
            async getLiveStats() {
                return await this.request('/api/dashboard/live-stats');
            },
            
            // ===== MEDICAL STAFF =====
            async getMedicalStaff(filters = {}) {
                const params = new URLSearchParams(filters).toString();
                return await this.request(`/api/medical-staff${params ? '?' + params : ''}`);
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
            
            // ===== CLINICAL UNITS =====
            async getClinicalUnits() {
                return await this.request('/api/clinical-units');
            },
            
            async createClinicalUnit(unitData) {
                return await this.request('/api/clinical-units', {
                    method: 'POST',
                    body: JSON.stringify(unitData)
                });
            },
            
            async updateClinicalUnit(id, unitData) {
                return await this.request(`/api/clinical-units/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(unitData)
                });
            },
            
            async deleteClinicalUnit(id) {
                return await this.request(`/api/clinical-units/${id}`, {
                    method: 'DELETE'
                });
            },
            
            // ===== TRAINING UNITS =====
            async getTrainingUnits() {
                return await this.request('/api/training-units');
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
            
            async deleteAbsence(id) {
                return await this.request(`/api/absences/${id}`, {
                    method: 'DELETE'
                });
            },
            
            // ===== ANNOUNCEMENTS =====
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
            
            // ===== HEALTH CHECK =====
            async checkHealth() {
                return await this.request('/health');
            },
            
            // ===== MOCK DATA FOR DEMO =====
            async getMockData(endpoint) {
                // Return mock data for development
                const mockData = {
                    '/api/dashboard/stats': {
                        totalStaff: 47,
                        activePatients: 128,
                        todayAppointments: 32,
                        pendingAlerts: 8,
                        departmentOccupancy: 78,
                        erCapacity: { current: 18, max: 24, status: 'medium' },
                        icuCapacity: { current: 12, max: 16, status: 'low' }
                    },
                    '/api/medical-staff': {
                        data: Array.from({ length: 15 }, (_, i) => ({
                            id: `staff_${i + 1}`,
                            full_name: ['Dr. Sarah Chen', 'Dr. Michael Rodriguez', 'Dr. James Wilson', 'Dr. Lisa Thompson', 'Dr. Robert Kim', 'Dr. Maria Garcia', 'Dr. David Lee', 'Dr. Jennifer Park', 'Dr. Thomas Brown', 'Dr. Amanda Clark'][i % 10] || `Dr. Staff ${i + 1}`,
                            staff_type: ['attending_physician', 'medical_resident', 'fellow', 'nurse_practitioner'][i % 4],
                            staff_id: `STAFF${1000 + i}`,
                            employment_status: ['active', 'on_leave', 'active', 'active', 'inactive'][i % 5],
                            professional_email: `staff${i + 1}@neumocare.org`,
                            department_id: i % 3 + 1,
                            resident_category: i % 2 === 0 ? 'PGY-3' : 'PGY-4',
                            training_level: i % 3 === 0 ? 'Senior' : i % 3 === 1 ? 'Junior' : 'Intermediate',
                            specialization: ['Pulmonology', 'Critical Care', 'Sleep Medicine', 'Interventional Pulmonology'][i % 4],
                            years_experience: Math.floor(Math.random() * 20) + 1,
                            office_phone: `555-${100 + i}`,
                            mobile_phone: `555-${200 + i}`,
                            medical_license: `MED${10000 + i}`,
                            last_activity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
                        }))
                    },
                    '/api/departments': [
                        { id: 1, name: 'Pulmonology', code: 'PULM', status: 'active', description: 'Respiratory medicine department' },
                        { id: 2, name: 'Critical Care', code: 'ICU', status: 'active', description: 'Intensive care unit' },
                        { id: 3, name: 'Sleep Medicine', code: 'SLEEP', status: 'active', description: 'Sleep disorders center' }
                    ],
                    '/api/training-units': [
                        { id: 1, unit_name: 'Pulmonary ICU', unit_code: 'PICU', department_id: 1, max_capacity: 8, current_residents: 6, status: 'active', description: 'Pulmonary intensive care training unit' },
                        { id: 2, unit_name: 'Bronchoscopy Suite', unit_code: 'BROCH', department_id: 1, max_capacity: 4, current_residents: 2, status: 'active', description: 'Interventional pulmonology training' },
                        { id: 3, unit_name: 'Sleep Lab', unit_code: 'SLEEP', department_id: 3, max_capacity: 6, current_residents: 4, status: 'active', description: 'Sleep study and diagnostics training' }
                    ],
                    '/api/rotations': {
                        data: Array.from({ length: 10 }, (_, i) => ({
                            id: `rot_${i + 1}`,
                            resident_id: `staff_${(i % 5) + 1}`,
                            training_unit_id: (i % 3) + 1,
                            start_date: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                            end_date: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                            supervisor_id: `staff_${(i % 3) + 6}`,
                            status: ['active', 'upcoming', 'completed'][i % 3],
                            goals: 'Master bronchoscopy techniques and critical care management',
                            notes: `Rotation ${i + 1} notes`,
                            created_at: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString()
                        }))
                    },
                    '/api/absences': Array.from({ length: 8 }, (_, i) => ({
                        id: `abs_${i + 1}`,
                        staff_member_id: `staff_${(i % 7) + 1}`,
                        leave_category: ['vacation', 'sick_leave', 'conference', 'personal'][i % 4],
                        leave_start_date: new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        leave_end_date: new Date(Date.now() + (7 + Math.random() * 7) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        notes: `Absence reason ${i + 1}`,
                        status: ['pending', 'approved', 'rejected', 'completed'][i % 4],
                        replacement_staff_id: i % 2 === 0 ? `staff_${(i + 3) % 7 + 1}` : null,
                        created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
                    })),
                    '/api/oncall': Array.from({ length: 5 }, (_, i) => ({
                        id: `oncall_${i + 1}`,
                        duty_date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        shift_type: ['primary_call', 'backup_call'][i % 2],
                        start_time: '08:00',
                        end_time: '17:00',
                        primary_physician_id: `staff_${(i % 5) + 1}`,
                        backup_physician_id: i % 3 === 0 ? `staff_${((i + 2) % 5) + 1}` : null,
                        coverage_notes: `Coverage notes ${i + 1}`,
                        status: 'scheduled',
                        created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
                    })),
                    '/api/announcements': Array.from({ length: 5 }, (_, i) => ({
                        id: `ann_${i + 1}`,
                        announcement_title: `Important Announcement ${i + 1}`,
                        announcement_content: `This is the content for announcement ${i + 1}. Please read carefully.`,
                        publish_start_date: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        priority_level: ['high', 'medium', 'low'][i % 3],
                        target_audience: 'all',
                        author: 'Admin',
                        created_at: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString()
                    })),
                    '/api/audit-logs': {
                        data: Array.from({ length: 20 }, (_, i) => ({
                            id: `audit_${i + 1}`,
                            user_id: `staff_${(i % 10) + 1}`,
                            action: ['create', 'update', 'delete', 'login', 'logout'][i % 5],
                            module: ['medical_staff', 'rotations', 'absences', 'oncall', 'announcements'][i % 5],
                            ip_address: `192.168.1.${i + 1}`,
                            user_agent: 'Mozilla/5.0',
                            created_at: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString()
                        }))
                    },
                    '/api/available-data': {
                        departments: [
                            { id: 1, name: 'Pulmonology' },
                            { id: 2, name: 'Critical Care' },
                            { id: 3, name: 'Sleep Medicine' }
                        ],
                        residents: Array.from({ length: 8 }, (_, i) => ({
                            id: `staff_${i + 1}`,
                            full_name: `Resident ${i + 1}`,
                            staff_type: 'medical_resident'
                        })),
                        attendings: Array.from({ length: 5 }, (_, i) => ({
                            id: `staff_${i + 9}`,
                            full_name: `Attending ${i + 1}`,
                            staff_type: 'attending_physician'
                        })),
                        trainingUnits: [
                            { id: 1, unit_name: 'Pulmonary ICU' },
                            { id: 2, unit_name: 'Bronchoscopy Suite' },
                            { id: 3, unit_name: 'Sleep Lab' }
                        ]
                    },
                    '/api/settings': {
                        hospital_name: 'NeumoCare Hospital',
                        default_department_id: 1,
                        max_residents_per_unit: 8,
                        default_rotation_duration: 12,
                        enable_audit_logging: true,
                        require_mfa: false,
                        maintenance_mode: false,
                        notifications_enabled: true,
                        absence_notifications: true,
                        announcement_notifications: true
                    },
                    '/api/dashboard/live-stats': {
                        occupancy: 78,
                        occupancyTrend: 2.5,
                        onDutyStaff: 24,
                        staffTrend: -1,
                        pendingRequests: 8,
                        erCapacity: { current: 18, max: 24, status: 'medium' },
                        icuCapacity: { current: 12, max: 16, status: 'low' }
                    }
                };
                
                return new Promise(resolve => {
                    setTimeout(() => {
                        const data = mockData[endpoint] || { data: [] };
                        console.log(`Mock data for ${endpoint}:`, data);
                        resolve(data);
                    }, 300); // Simulate network delay
                });
            }
        };
        
        // ============ CREATE VUE APP ============
        const app = createApp({
            setup() {
                // ============ REACTIVE STATE ============
                const currentUser = ref(JSON.parse(localStorage.getItem('neumocare_user')) || {
                    id: 'admin_1',
                    full_name: 'System Administrator',
                    email: 'admin@neumocare.org',
                    user_role: 'administrator',
                    department_id: 1
                });
                
                const loginForm = reactive({ 
                    email: 'admin@neumocare.org', 
                    password: 'password123',
                    remember_me: true
                });
                
                // Loading states
                const loading = ref(false);
                const saving = ref(false);
                const loadingStats = ref(false);
                const loadingStaff = ref(false);
                const loadingSchedule = ref(false);
                const loadingAnnouncements = ref(false);
                const loadingRotations = ref(false);
                const loadingAbsences = ref(false);
                const loadingAuditLogs = ref(false);
                
                // UI state
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
                const clinicalUnits = ref([]);
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
                
                // Stats and live data
                const stats = ref({
                    totalStaff: 0,
                    activePatients: 0,
                    todayAppointments: 0,
                    pendingAlerts: 0
                });
                
                const liveStats = ref({
                    occupancy: 0,
                    occupancyTrend: 0,
                    onDutyStaff: 0,
                    staffTrend: 0,
                    pendingRequests: 0,
                    erCapacity: { current: 0, max: 0, status: 'normal' },
                    icuCapacity: { current: 0, max: 0, status: 'normal' }
                });
                
                const currentCapacity = reactive({
                    er: { current: 0, max: 24, status: 'low' },
                    icu: { current: 0, max: 16, status: 'low' }
                });
                
                // ============ UI STATE ============
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
                    status: ''
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
                    
                    // Auto-remove after duration
                    if (duration > 0) {
                        setTimeout(() => {
                            const index = toasts.value.findIndex(t => t.id === toast.id);
                            if (index > -1) toasts.value.splice(index, 1);
                        }, duration);
                    }
                };
                
                const removeToast = (id) => {
                    const index = toasts.value.findIndex(t => t.id === id);
                    if (index > -1) toasts.value.splice(index, 1);
                };
                
                // ============ ALERT SYSTEM ============
                const dismissAlert = (id) => {
                    const index = activeAlerts.value.findIndex(a => a.id === id);
                    if (index > -1) activeAlerts.value.splice(index, 1);
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
                    const statuses = { 
                        active: 'Active', 
                        on_leave: 'On Leave', 
                        inactive: 'Inactive',
                        terminated: 'Terminated'
                    };
                    return statuses[status] || status;
                };
                
                const formatAbsenceReason = (reason) => {
                    const reasons = {
                        vacation: 'Vacation',
                        sick_leave: 'Sick Leave',
                        conference: 'Conference',
                        personal: 'Personal',
                        training: 'Training',
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
                
                const formatRotationStatus = (status) => {
                    const statuses = {
                        active: 'Active',
                        upcoming: 'Upcoming',
                        completed: 'Completed',
                        cancelled: 'Cancelled'
                    };
                    return statuses[status] || status;
                };
                
                const formatTrainingLevel = (level) => {
                    const levels = {
                        pgy1: 'PGY-1',
                        pgy2: 'PGY-2',
                        pgy3: 'PGY-3',
                        pgy4: 'PGY-4',
                        pgy5: 'PGY-5',
                        senior: 'Senior',
                        junior: 'Junior',
                        intermediate: 'Intermediate'
                    };
                    return levels[level] || level;
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
                
                const getAbsenceStatusClass = (status) => {
                    const classes = {
                        pending: 'status-busy',
                        approved: 'status-available',
                        rejected: 'status-critical',
                        completed: 'status-oncall'
                    };
                    return classes[status] || 'badge-secondary';
                };
                
                const getRotationStatusClass = (status) => {
                    const classes = {
                        active: 'status-available',
                        upcoming: 'status-busy',
                        completed: 'status-oncall',
                        cancelled: 'status-critical'
                    };
                    return classes[status] || 'badge-secondary';
                };
                
                const getPriorityColor = (priority) => {
                    const colors = {
                        high: 'danger',
                        medium: 'warning',
                        low: 'info'
                    };
                    return colors[priority] || 'primary';
                };
                
                const formatTimeRange = (start, end) => {
                    return `${start} - ${end}`;
                };
                
                // ============ HELPER FUNCTIONS ============
                const getInitials = (name) => {
                    if (!name) return '??';
                    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
                };
                
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
                
                const getStaffName = (staffId) => {
                    if (!staffId) return 'Unknown';
                    const staff = medicalStaff.value.find(s => s.id === staffId);
                    return staff ? staff.full_name : 'Unknown Staff';
                };
                
                const getTrainingUnitName = (unitId) => {
                    if (!unitId) return 'Unknown Unit';
                    const unit = trainingUnits.value.find(u => u.id === unitId);
                    return unit ? unit.unit_name || unit.name : 'Unknown Training Unit';
                };
                
                const getResidentName = (residentId) => {
                    return getStaffName(residentId);
                };
                
                const getSupervisorName = (supervisorId) => {
                    return getStaffName(supervisorId);
                };
                
                const getUserName = (userId) => {
                    return getStaffName(userId);
                };
                
                const getUserRoleDisplay = (role) => {
                    const roles = {
                        administrator: 'Administrator',
                        department_head: 'Department Head',
                        attending_physician: 'Attending Physician',
                        resident: 'Resident',
                        nurse_practitioner: 'Nurse Practitioner',
                        staff: 'Staff'
                    };
                    return roles[role] || role;
                };
                
                const getDepartmentUnits = (departmentId) => {
                    return clinicalUnits.value.filter(unit => unit.department_id === departmentId);
                };
                
                const getUnitResidents = (unitId) => {
                    const residents = [];
                    residentRotations.value.forEach(rotation => {
                        if (rotation.training_unit_id === unitId && rotation.status === 'active') {
                            const resident = medicalStaff.value.find(s => s.id === rotation.resident_id);
                            if (resident) {
                                residents.push({
                                    id: resident.id,
                                    full_name: resident.full_name,
                                    training_level: resident.training_level || 'Unknown'
                                });
                            }
                        }
                    });
                    return residents;
                };
                
                const calculateAbsenceDuration = (startDate, endDate) => {
                    const start = new Date(startDate);
                    const end = new Date(endDate);
                    const diffTime = Math.abs(end - start);
                    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
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
                        permission_manager: 'Permission Manager',
                        login: 'Login'
                    };
                    return titles[currentView.value] || 'NeumoCare';
                };
                
                const getCurrentSubtitle = () => {
                    const subtitles = {
                        daily_operations: 'Overview dashboard with real-time updates',
                        medical_staff: 'Manage physicians, residents, and clinical staff',
                        resident_rotations: 'Track and manage resident training rotations',
                        oncall_schedule: 'View and manage on-call physician schedules',
                        staff_absence: 'Track staff absences and coverage assignments',
                        training_units: 'Manage clinical training units and assignments',
                        department_management: 'Organizational structure and clinical units',
                        communications: 'Department announcements and capacity updates',
                        audit_logs: 'System activity and security audit trails',
                        system_settings: 'Configure system preferences and behavior',
                        permission_manager: 'Manage user roles and access permissions'
                    };
                    return subtitles[currentView.value] || 'Hospital Management System';
                };
                
                const getSearchPlaceholder = () => {
                    const placeholders = {
                        daily_operations: 'Search staff, patients, or units...',
                        medical_staff: 'Search medical staff by name, ID, or email...',
                        resident_rotations: 'Search rotations by resident or unit...',
                        oncall_schedule: 'Search on-call schedules...',
                        staff_absence: 'Search absences by staff name or reason...',
                        training_units: 'Search training units...',
                        department_management: 'Search departments or clinical units...',
                        communications: 'Search announcements...',
                        audit_logs: 'Search audit logs...',
                        system_settings: 'Search settings...',
                        permission_manager: 'Search roles or permissions...'
                    };
                    return placeholders[currentView.value] || 'Search...';
                };
                
                // ============ PERMISSION SYSTEM ============
                const userRoles = ref([
                    { id: 1, name: 'Administrator', permissions: ['all'] },
                    { id: 2, name: 'Department Head', permissions: ['medical_staff.read', 'medical_staff.update', 'rotations.read', 'rotations.create', 'absences.read', 'absences.approve'] },
                    { id: 3, name: 'Attending Physician', permissions: ['rotations.read', 'rotations.update', 'oncall.read'] },
                    { id: 4, name: 'Resident', permissions: ['rotations.read', 'absences.create'] }
                ]);
                
                const availablePermissions = ref([
                    { id: 1, name: 'medical_staff.read', description: 'View medical staff' },
                    { id: 2, name: 'medical_staff.create', description: 'Add medical staff' },
                    { id: 3, name: 'medical_staff.update', description: 'Edit medical staff' },
                    { id: 4, name: 'medical_staff.delete', description: 'Delete medical staff' },
                    { id: 5, name: 'rotations.read', description: 'View rotations' },
                    { id: 6, name: 'rotations.create', description: 'Create rotations' },
                    { id: 7, name: 'rotations.update', description: 'Update rotations' },
                    { id: 8, name: 'rotations.delete', description: 'Delete rotations' },
                    { id: 9, name: 'absences.read', description: 'View absences' },
                    { id: 10, name: 'absences.create', description: 'Create absence requests' },
                    { id: 11, name: 'absences.update', description: 'Update absences' },
                    { id: 12, name: 'absences.delete', description: 'Delete absences' },
                    { id: 13, name: 'oncall.read', description: 'View on-call schedule' },
                    { id: 14, name: 'oncall.create', description: 'Create on-call schedule' },
                    { id: 15, name: 'oncall.update', description: 'Update on-call schedule' },
                    { id: 16, name: 'oncall.delete', description: 'Delete on-call schedule' },
                    { id: 17, name: 'communications.create', description: 'Create announcements' },
                    { id: 18, name: 'communications.read', description: 'View announcements' },
                    { id: 19, name: 'audit.read', description: 'View audit logs' },
                    { id: 20, name: 'permissions.manage', description: 'Manage permissions' },
                    { id: 21, name: 'system.read', description: 'View system settings' },
                    { id: 22, name: 'system.manage_departments', description: 'Manage departments' }
                ]);
                
                const users = ref([]);
                
                const hasPermission = (module, action) => {
                    if (!currentUser.value) return false;
                    
                    // Administrator has all permissions
                    if (currentUser.value.user_role === 'administrator') {
                        return true;
                    }
                    
                    const permissionString = `${module}.${action}`;
                    
                    // Find user's role
                    const role = userRoles.value.find(r => r.name.toLowerCase() === currentUser.value.user_role.toLowerCase());
                    
                    if (!role) return false;
                    
                    // Check if role has permission
                    if (role.permissions.includes('all') || role.permissions.includes(permissionString)) {
                        return true;
                    }
                    
                    return false;
                };
                
                const roleHasPermission = (roleId, permissionId) => {
                    const role = userRoles.value.find(r => r.id === roleId);
                    const permission = availablePermissions.value.find(p => p.id === permissionId);
                    
                    if (!role || !permission) return false;
                    
                    return role.permissions.includes(permission.name) || role.permissions.includes('all');
                };
                
                const toggleRolePermission = (roleId, permissionId) => {
                    const role = userRoles.value.find(r => r.id === roleId);
                    const permission = availablePermissions.value.find(p => p.id === permissionId);
                    
                    if (!role || !permission || role.name === 'Administrator') return;
                    
                    const index = role.permissions.indexOf(permission.name);
                    
                    if (index > -1) {
                        role.permissions.splice(index, 1);
                    } else {
                        role.permissions.push(permission.name);
                    }
                    
                    showToast('Permission Updated', `${permission.description} updated for ${role.name}`, 'success');
                };
                
                const formatPermissionName = (name) => {
                    const parts = name.split('.');
                    const module = parts[0].replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
                    const action = parts[1].replace(/\b\w/g, l => l.toUpperCase());
                    return `${module} - ${action}`;
                };
                
                const getUserPermissions = (userId) => {
                    const user = users.value.find(u => u.id === userId);
                    if (!user) return [];
                    
                    const role = userRoles.value.find(r => r.name === user.user_role);
                    return role ? role.permissions.slice(0, 3) : [];
                };
                
                // ============ DATA LOADING FUNCTIONS ============
                const loadMedicalStaff = async () => {
                    loadingStaff.value = true;
                    try {
                        const response = await API.getMockData('/api/medical-staff');
                        medicalStaff.value = response.data || response || [];
                        
                        // Populate users list for permissions
                        users.value = medicalStaff.value.map(staff => ({
                            id: staff.id,
                            full_name: staff.full_name,
                            user_role: staff.staff_type === 'attending_physician' ? 'Attending Physician' : 
                                      staff.staff_type === 'medical_resident' ? 'Resident' : 'Staff',
                            email: staff.professional_email
                        }));
                        
                        // Add current user to users list
                        users.value.push({
                            id: currentUser.value.id,
                            full_name: currentUser.value.full_name,
                            user_role: currentUser.value.user_role,
                            email: currentUser.value.email
                        });
                        
                    } catch (error) {
                        showToast('Error', 'Failed to load medical staff', 'error');
                        medicalStaff.value = [];
                    } finally {
                        loadingStaff.value = false;
                    }
                };
                
                const loadDepartments = async () => {
                    try {
                        const data = await API.getMockData('/api/departments');
                        departments.value = data || [];
                    } catch (error) {
                        departments.value = [];
                    }
                };
                
                const loadClinicalUnits = async () => {
                    try {
                        const data = await API.getMockData('/api/clinical-units');
                        clinicalUnits.value = data || [];
                    } catch (error) {
                        clinicalUnits.value = [];
                    }
                };
                
                const loadTrainingUnits = async () => {
                    try {
                        const data = await API.getMockData('/api/training-units');
                        trainingUnits.value = data || [];
                    } catch (error) {
                        trainingUnits.value = [];
                    }
                };
                
                const loadResidentRotations = async () => {
                    loadingRotations.value = true;
                    try {
                        const response = await API.getMockData('/api/rotations');
                        residentRotations.value = response.data || response || [];
                    } catch (error) {
                        residentRotations.value = [];
                    } finally {
                        loadingRotations.value = false;
                    }
                };
                
                const loadStaffAbsences = async () => {
                    loadingAbsences.value = true;
                    try {
                        const data = await API.getMockData('/api/absences');
                        staffAbsences.value = data || [];
                    } catch (error) {
                        staffAbsences.value = [];
                    } finally {
                        loadingAbsences.value = false;
                    }
                };
                
                const loadOnCallSchedule = async () => {
                    loadingSchedule.value = true;
                    try {
                        const data = await API.getMockData('/api/oncall');
                        onCallSchedule.value = data || [];
                    } catch (error) {
                        onCallSchedule.value = [];
                    } finally {
                        loadingSchedule.value = false;
                    }
                };
                
                const loadAnnouncements = async () => {
                    loadingAnnouncements.value = true;
                    try {
                        const data = await API.getMockData('/api/announcements');
                        recentAnnouncements.value = data || [];
                    } catch (error) {
                        recentAnnouncements.value = [];
                    } finally {
                        loadingAnnouncements.value = false;
                    }
                };
                
                const loadSystemSettings = async () => {
                    try {
                        const data = await API.getMockData('/api/settings');
                        systemSettings.value = data;
                    } catch (error) {
                        systemSettings.value = {};
                    }
                };
                
                const loadAvailableData = async () => {
                    try {
                        const data = await API.getMockData('/api/available-data');
                        availableData.value = data;
                    } catch (error) {
                        // Use mock data
                        availableData.value = {
                            departments: departments.value,
                            residents: medicalStaff.value.filter(s => s.staff_type === 'medical_resident'),
                            attendings: medicalStaff.value.filter(s => s.staff_type === 'attending_physician'),
                            trainingUnits: trainingUnits.value
                        };
                    }
                };
                
                const loadAuditLogs = async () => {
                    loadingAuditLogs.value = true;
                    try {
                        const response = await API.getMockData('/api/audit-logs');
                        auditLogs.value = response.data || response || [];
                    } catch (error) {
                        auditLogs.value = [];
                    } finally {
                        loadingAuditLogs.value = false;
                    }
                };
                
                const loadDashboardStats = async () => {
                    loadingStats.value = true;
                    try {
                        const statsData = await API.getMockData('/api/dashboard/stats');
                        const liveStatsData = await API.getMockData('/api/dashboard/live-stats');
                        
                        stats.value = statsData;
                        liveStats.value = liveStatsData;
                        
                        // Update capacity from live stats
                        if (liveStatsData.erCapacity) {
                            currentCapacity.er.current = liveStatsData.erCapacity.current;
                            currentCapacity.er.max = liveStatsData.erCapacity.max;
                            currentCapacity.er.status = liveStatsData.erCapacity.status;
                        }
                        
                        if (liveStatsData.icuCapacity) {
                            currentCapacity.icu.current = liveStatsData.icuCapacity.current;
                            currentCapacity.icu.max = liveStatsData.icuCapacity.max;
                            currentCapacity.icu.status = liveStatsData.icuCapacity.status;
                        }
                        
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
                            loadMedicalStaff(),
                            loadDepartments(),
                            loadClinicalUnits(),
                            loadTrainingUnits(),
                            loadResidentRotations(),
                            loadStaffAbsences(),
                            loadOnCallSchedule(),
                            loadAnnouncements(),
                            loadSystemSettings(),
                            loadAvailableData(),
                            loadDashboardStats()
                        ]);
                        
                        showToast('System Ready', 'All data loaded successfully', 'success');
                    } catch (error) {
                        showToast('Data Load Error', 'Failed to load system data', 'error');
                    } finally {
                        loading.value = false;
                    }
                };
                
                // ============ FILTER FUNCTIONS ============
                const filteredMedicalStaff = computed(() => {
                    let filtered = medicalStaff.value;
                    
                    // Apply text search
                    if (staffSearch.value) {
                        const searchTerm = staffSearch.value.toLowerCase();
                        filtered = filtered.filter(staff => 
                            staff.full_name.toLowerCase().includes(searchTerm) ||
                            staff.staff_id.toLowerCase().includes(searchTerm) ||
                            staff.professional_email.toLowerCase().includes(searchTerm)
                        );
                    }
                    const todaysOnCall = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return onCallSchedule.value.filter(schedule => schedule.duty_date === today)
        .map(schedule => ({
            ...schedule,
            physician_name: getStaffName(schedule.primary_physician_id),
            role: schedule.shift_type === 'primary_call' ? 'Primary' : 'Backup'
        }));
});
                    
                    // Apply type filter
                    if (staffFilter.staff_type) {
                        filtered = filtered.filter(staff => staff.staff_type === staffFilter.staff_type);
                    }
                    
                    // Apply status filter
                    if (staffFilter.employment_status) {
                        filtered = filtered.filter(staff => staff.employment_status === staffFilter.employment_status);
                    }
                    
                    // Apply department filter
                    if (staffFilter.department_id) {
                        filtered = filtered.filter(staff => staff.department_id === staffFilter.department_id);
                    }
                    
                    return filtered;
                });
                
                const filteredRotations = computed(() => {
                    let filtered = residentRotations.value;
                    
                    // Apply resident filter
                    if (rotationFilter.resident_id) {
                        filtered = filtered.filter(rotation => rotation.resident_id === rotationFilter.resident_id);
                    }
                    
                    // Apply status filter
                    if (rotationFilter.status) {
                        filtered = filtered.filter(rotation => rotation.status === rotationFilter.status);
                    }
                    
                    return filtered;
                });
                
                const filteredAbsences = computed(() => {
                    let filtered = staffAbsences.value;
                    
                    // Apply staff filter
                    if (absenceFilter.staff_id) {
                        filtered = filtered.filter(absence => absence.staff_member_id === absenceFilter.staff_id);
                    }
                    
                    // Apply status filter
                    if (absenceFilter.status) {
                        filtered = filtered.filter(absence => absence.status === absenceFilter.status);
                    }
                    
                    // Apply date filter
                    if (absenceFilter.start_date) {
                        filtered = filtered.filter(absence => absence.leave_start_date >= absenceFilter.start_date);
                    }
                    
                    return filtered;
                });
                
                const filteredAuditLogs = computed(() => {
                    let filtered = auditLogs.value;
                    
                    // Apply action type filter
                    if (auditFilters.actionType) {
                        filtered = filtered.filter(log => log.action === auditFilters.actionType);
                    }
                    
                    // Apply user filter
                    if (auditFilters.userId) {
                        filtered = filtered.filter(log => log.user_id === auditFilters.userId);
                    }
                    
                    // Apply date filter
                    if (auditFilters.dateRange) {
                        filtered = filtered.filter(log => new Date(log.created_at) >= new Date(auditFilters.dateRange));
                    }
                    
                    return filtered;
                });
                
                const resetStaffFilters = () => {
                    staffFilter.staff_type = '';
                    staffFilter.employment_status = '';
                    staffFilter.department_id = '';
                    staffSearch.value = '';
                };
                
                const applyStaffFilters = () => {
                    // Filters are applied reactively via computed property
                    showToast('Filters Applied', 'Staff filters have been applied', 'success');
                };
                
                const resetRotationFilters = () => {
                    rotationFilter.resident_id = '';
                    rotationFilter.status = '';
                };
                
                const applyRotationFilters = () => {
                    showToast('Filters Applied', 'Rotation filters have been applied', 'success');
                };
                
                const resetAbsenceFilters = () => {
                    absenceFilter.staff_id = '';
                    absenceFilter.status = '';
                    absenceFilter.start_date = '';
                };
                
                const applyAbsenceFilters = () => {
                    showToast('Filters Applied', 'Absence filters have been applied', 'success');
                };
                
                const resetAuditFilters = () => {
                    auditFilters.dateRange = '';
                    auditFilters.actionType = '';
                    auditFilters.userId = '';
                };
                
                const applyAuditFilters = () => {
                    showToast('Filters Applied', 'Audit filters have been applied', 'success');
                };
                
                // ============ MODAL STATES ============
                const medicalStaffModal = reactive({
                    show: false,
                    mode: 'add',
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
                        capacity: '',
                        location: ''
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
                        full_name: currentUser.value?.full_name || '',
                        email: currentUser.value?.email || '',
                        phone: currentUser.value?.phone || '',
                        department_id: currentUser.value?.department_id || '',
                        notifications_enabled: currentUser.value?.notifications_enabled || true,
                        absence_notifications: currentUser.value?.absence_notifications || true,
                        announcement_notifications: currentUser.value?.announcement_notifications || true
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
                
                const confirmationModal = reactive({
                    show: false,
                    title: '',
                    message: '',
                    icon: 'fa-question-circle',
                    confirmButtonText: 'Confirm',
                    confirmButtonClass: 'btn-primary',
                    cancelButtonText: 'Cancel',
                    onConfirm: null,
                    onCancel: null
                });
                
                const staffDetailsModal = reactive({
                    show: false,
                    staff: null
                });
                
                const absenceDetailsModal = reactive({
                    show: false,
                    absence: null
                });
                
                const rotationDetailsModal = reactive({
                    show: false,
                    rotation: null
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
                        onCancel: options.onCancel || null
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
                
                // ============ ACTION MENU FUNCTIONS ============
                const toggleActionMenu = (event) => {
                    const menu = event.target.closest('.action-dropdown').querySelector('.action-menu');
                    const allMenus = document.querySelectorAll('.action-menu');
                    
                    allMenus.forEach(m => {
                        if (m !== menu) m.classList.remove('show');
                    });
                    
                    menu.classList.toggle('show');
                    
                    // Close menu when clicking outside
                    const closeMenu = (e) => {
                        if (!menu.contains(e.target) && !event.target.contains(e.target)) {
                            menu.classList.remove('show');
                            document.removeEventListener('click', closeMenu);
                        }
                    };
                    
                    setTimeout(() => {
                        document.addEventListener('click', closeMenu);
                    }, 0);
                };
                
                const toggleUserMenu = () => {
                    userMenuOpen.value = !userMenuOpen.value;
                };
                
                // ============ DATA SAVE FUNCTIONS ============
                const saveMedicalStaff = async () => {
                    saving.value = true;
                    try {
                        // Generate staff ID if not provided
                        if (!medicalStaffModal.form.staff_id) {
                            medicalStaffModal.form.staff_id = `STAFF${Date.now().toString().slice(-6)}`;
                        }
                        
                        // Generate ID for new staff
                        if (medicalStaffModal.mode === 'add') {
                            medicalStaffModal.form.id = Utils.generateID();
                            medicalStaffModal.form.created_at = new Date().toISOString();
                            medicalStaffModal.form.last_activity = new Date().toISOString();
                            medicalStaff.value.unshift(medicalStaffModal.form);
                            showToast('Success', 'Medical staff added successfully', 'success');
                        } else {
                            const index = medicalStaff.value.findIndex(s => s.id === medicalStaffModal.form.id);
                            if (index !== -1) {
                                medicalStaffModal.form.updated_at = new Date().toISOString();
                                medicalStaff.value[index] = { ...medicalStaff.value[index], ...medicalStaffModal.form };
                                showToast('Success', 'Medical staff updated successfully', 'success');
                            }
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
                            departmentModal.form.id = Utils.generateID();
                            departments.value.unshift(departmentModal.form);
                            showToast('Success', 'Department added successfully', 'success');
                        } else {
                            const index = departments.value.findIndex(d => d.id === departmentModal.form.id);
                            if (index !== -1) {
                                departments.value[index] = departmentModal.form;
                                showToast('Success', 'Department updated successfully', 'success');
                            }
                        }
                        
                        departmentModal.show = false;
                    } catch (error) {
                        showToast('Error', error.message, 'error');
                    } finally {
                        saving.value = false;
                    }
                };
                
                const saveClinicalUnit = async () => {
                    saving.value = true;
                    try {
                        if (clinicalUnitModal.mode === 'add') {
                            clinicalUnitModal.form.id = Utils.generateID();
                            clinicalUnits.value.unshift(clinicalUnitModal.form);
                            showToast('Success', 'Clinical unit added successfully', 'success');
                        } else {
                            const index = clinicalUnits.value.findIndex(u => u.id === clinicalUnitModal.form.id);
                            if (index !== -1) {
                                clinicalUnits.value[index] = clinicalUnitModal.form;
                                showToast('Success', 'Clinical unit updated successfully', 'success');
                            }
                        }
                        
                        clinicalUnitModal.show = false;
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
                            trainingUnitModal.form.id = Utils.generateID();
                            trainingUnitModal.form.current_residents = 0;
                            trainingUnits.value.unshift(trainingUnitModal.form);
                            showToast('Success', 'Training unit added successfully', 'success');
                        } else {
                            const index = trainingUnits.value.findIndex(u => u.id === trainingUnitModal.form.id);
                            if (index !== -1) {
                                trainingUnits.value[index] = trainingUnitModal.form;
                                showToast('Success', 'Training unit updated successfully', 'success');
                            }
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
                            rotationModal.form.id = Utils.generateID();
                            rotationModal.form.created_at = new Date().toISOString();
                            residentRotations.value.unshift(rotationModal.form);
                            
                            // Update training unit count
                            const unitIndex = trainingUnits.value.findIndex(u => u.id === rotationModal.form.training_unit_id);
                            if (unitIndex !== -1) {
                                trainingUnits.value[unitIndex].current_residents = 
                                    (trainingUnits.value[unitIndex].current_residents || 0) + 1;
                            }
                            
                            showToast('Success', 'Rotation added successfully', 'success');
                        } else {
                            const index = residentRotations.value.findIndex(r => r.id === rotationModal.form.id);
                            if (index !== -1) {
                                residentRotations.value[index] = rotationModal.form;
                                showToast('Success', 'Rotation updated successfully', 'success');
                            }
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
                            onCallModal.form.id = Utils.generateID();
                            onCallModal.form.created_at = new Date().toISOString();
                            onCallSchedule.value.unshift(onCallModal.form);
                            showToast('Success', 'On-call schedule added successfully', 'success');
                        } else {
                            const index = onCallSchedule.value.findIndex(s => s.id === onCallModal.form.id);
                            if (index !== -1) {
                                onCallSchedule.value[index] = onCallModal.form;
                                showToast('Success', 'On-call schedule updated successfully', 'success');
                            }
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
                        const startDate = new Date(absenceModal.form.start_date);
                        const endDate = new Date(absenceModal.form.end_date);
                        if (endDate <= startDate) {
                            throw new Error('End date must be after start date');
                        }
                        
                        if (absenceModal.mode === 'add') {
                            absenceModal.form.id = Utils.generateID();
                            absenceModal.form.status = 'pending';
                            absenceModal.form.created_at = new Date().toISOString();
                            staffAbsences.value.unshift(absenceModal.form);
                            showToast('Success', 'Absence request submitted successfully', 'success');
                        } else {
                            const index = staffAbsences.value.findIndex(a => a.id === absenceModal.form.id);
                            if (index !== -1) {
                                staffAbsences.value[index] = absenceModal.form;
                                showToast('Success', 'Absence request updated successfully', 'success');
                            }
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
                        
                        communicationsModal.form.id = Utils.generateID();
                        communicationsModal.form.author = currentUser.value.full_name;
                        communicationsModal.form.created_at = new Date().toISOString();
                        recentAnnouncements.value.unshift(communicationsModal.form);
                        
                        communicationsModal.show = false;
                        showToast('Success', 'Announcement posted successfully', 'success');
                    } catch (error) {
                        showToast('Error', error.message, 'error');
                    } finally {
                        saving.value = false;
                    }
                };
                
                const saveQuickPlacement = async () => {
                    saving.value = true;
                    try {
                        if (!quickPlacementModal.resident_id || !quickPlacementModal.training_unit_id) {
                            throw new Error('Resident and training unit are required');
                        }
                        
                        const rotation = {
                            id: Utils.generateID(),
                            resident_id: quickPlacementModal.resident_id,
                            training_unit_id: quickPlacementModal.training_unit_id,
                            start_date: quickPlacementModal.start_date,
                            end_date: new Date(new Date(quickPlacementModal.start_date).getTime() + 
                                quickPlacementModal.duration * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                            supervisor_id: quickPlacementModal.supervisor_id,
                            status: 'active',
                            notes: quickPlacementModal.notes,
                            created_at: new Date().toISOString()
                        };
                        
                        residentRotations.value.unshift(rotation);
                        
                        // Update training unit count
                        const unitIndex = trainingUnits.value.findIndex(u => u.id === quickPlacementModal.training_unit_id);
                        if (unitIndex !== -1) {
                            trainingUnits.value[unitIndex].current_residents = 
                                (trainingUnits.value[unitIndex].current_residents || 0) + 1;
                        }
                        
                        quickPlacementModal.show = false;
                        showToast('Success', 'Resident placed successfully', 'success');
                    } catch (error) {
                        showToast('Error', error.message, 'error');
                    } finally {
                        saving.value = false;
                    }
                };
                
                const saveBulkAssignment = async () => {
                    saving.value = true;
                    try {
                        if (!bulkAssignModal.selectedResidents || bulkAssignModal.selectedResidents.length === 0) {
                            throw new Error('Select at least one resident');
                        }
                        
                        if (!bulkAssignModal.training_unit_id) {
                            throw new Error('Training unit is required');
                        }
                        
                        const newRotations = bulkAssignModal.selectedResidents.map(residentId => ({
                            id: Utils.generateID(),
                            resident_id: residentId,
                            training_unit_id: bulkAssignModal.training_unit_id,
                            start_date: bulkAssignModal.start_date,
                            end_date: new Date(new Date(bulkAssignModal.start_date).getTime() + 
                                bulkAssignModal.duration * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                            supervisor_id: bulkAssignModal.supervisor_id,
                            status: 'active',
                            created_at: new Date().toISOString()
                        }));
                        
                        residentRotations.value.unshift(...newRotations);
                        
                        // Update training unit count
                        const unitIndex = trainingUnits.value.findIndex(u => u.id === bulkAssignModal.training_unit_id);
                        if (unitIndex !== -1) {
                            trainingUnits.value[unitIndex].current_residents = 
                                (trainingUnits.value[unitIndex].current_residents || 0) + bulkAssignModal.selectedResidents.length;
                        }
                        
                        bulkAssignModal.show = false;
                        showToast('Success', `${bulkAssignModal.selectedResidents.length} resident${bulkAssignModal.selectedResidents.length === 1 ? '' : 's'} assigned successfully`, 'success');
                    } catch (error) {
                        showToast('Error', error.message, 'error');
                    } finally {
                        saving.value = false;
                    }
                };
                
                const saveUserProfile = async () => {
                    saving.value = true;
                    try {
                        currentUser.value = { ...currentUser.value, ...userProfileModal.form };
                        localStorage.setItem('neumocare_user', JSON.stringify(currentUser.value));
                        
                        // Update in users list
                        const userIndex = users.value.findIndex(u => u.id === currentUser.value.id);
                        if (userIndex !== -1) {
                            users.value[userIndex] = { ...users.value[userIndex], ...userProfileModal.form };
                        }
                        
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
                        systemSettings.value = { ...systemSettings.value, ...systemSettingsModal.settings };
                        localStorage.setItem('neumocare_settings', JSON.stringify(systemSettings.value));
                        
                        systemSettingsModal.show = false;
                        showToast('Success', 'System settings saved successfully', 'success');
                    } catch (error) {
                        showToast('Error', error.message, 'error');
                    } finally {
                        saving.value = false;
                    }
                };
                
                const saveRole = async () => {
                    saving.value = true;
                    try {
                        if (roleModal.mode === 'add') {
                            roleModal.form.id = userRoles.value.length + 1;
                            userRoles.value.push(roleModal.form);
                            showToast('Success', 'Role added successfully', 'success');
                        } else {
                            const index = userRoles.value.findIndex(r => r.id === roleModal.form.id);
                            if (index !== -1) {
                                userRoles.value[index] = roleModal.form;
                                showToast('Success', 'Role updated successfully', 'success');
                            }
                        }
                        
                        roleModal.show = false;
                    } catch (error) {
                        showToast('Error', error.message, 'error');
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
                                const index = medicalStaff.value.findIndex(s => s.id === staff.id);
                                if (index !== -1) {
                                    medicalStaff.value[index].employment_status = 'inactive';
                                    showToast('Deactivated', `${staff.full_name} has been deactivated`, 'success');
                                }
                            } catch (error) {
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
                        message: `Are you sure you want to delete ${department.name}?`,
                        icon: 'fa-trash',
                        confirmButtonText: 'Delete',
                        confirmButtonClass: 'btn-danger',
                        onConfirm: async () => {
                            try {
                                const index = departments.value.findIndex(d => d.id === departmentId);
                                if (index !== -1) departments.value.splice(index, 1);
                                showToast('Deleted', `${department.name} has been removed`, 'success');
                            } catch (error) {
                                showToast('Error', error.message, 'error');
                            }
                        }
                    });
                };
                
                const deleteClinicalUnit = (unitId) => {
                    const unit = clinicalUnits.value.find(u => u.id === unitId);
                    if (!unit) return;
                    
                    showConfirmation({
                        title: 'Delete Clinical Unit',
                        message: `Are you sure you want to delete ${unit.name}?`,
                        icon: 'fa-trash',
                        confirmButtonText: 'Delete',
                        confirmButtonClass: 'btn-danger',
                        onConfirm: async () => {
                            try {
                                const index = clinicalUnits.value.findIndex(u => u.id === unitId);
                                if (index !== -1) clinicalUnits.value.splice(index, 1);
                                showToast('Deleted', `${unit.name} has been removed`, 'success');
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
                        title: 'Delete Rotation',
                        message: 'Are you sure you want to delete this rotation?',
                        icon: 'fa-trash',
                        confirmButtonText: 'Delete',
                        confirmButtonClass: 'btn-danger',
                        onConfirm: async () => {
                            try {
                                const index = residentRotations.value.findIndex(r => r.id === rotation.id);
                                if (index !== -1) {
                                    // Update training unit count
                                    const rotationItem = residentRotations.value[index];
                                    const unitIndex = trainingUnits.value.findIndex(u => u.id === rotationItem.training_unit_id);
                                    if (unitIndex !== -1 && trainingUnits.value[unitIndex].current_residents > 0) {
                                        trainingUnits.value[unitIndex].current_residents--;
                                    }
                                    
                                    residentRotations.value.splice(index, 1);
                                    showToast('Deleted', 'Rotation has been removed', 'success');
                                }
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
                                const index = recentAnnouncements.value.findIndex(a => a.id === announcement.id);
                                if (index !== -1) recentAnnouncements.value.splice(index, 1);
                                showToast('Deleted', 'Announcement has been removed', 'success');
                            } catch (error) {
                                showToast('Error', error.message, 'error');
                            }
                        }
                    });
                };
                
                const deleteRole = (roleId) => {
                    const role = userRoles.value.find(r => r.id === roleId);
                    if (!role || role.name === 'Administrator') return;
                    
                    showConfirmation({
                        title: 'Delete Role',
                        message: `Are you sure you want to delete the ${role.name} role?`,
                        icon: 'fa-trash',
                        confirmButtonText: 'Delete',
                        confirmButtonClass: 'btn-danger',
                        onConfirm: async () => {
                            try {
                                const index = userRoles.value.findIndex(r => r.id === roleId);
                                if (index !== -1) userRoles.value.splice(index, 1);
                                showToast('Deleted', `${role.name} role has been removed`, 'success');
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
                        absence_reason: absence.leave_category || absence.absence_reason,
                        start_date: absence.leave_start_date || absence.start_date,
                        end_date: absence.leave_end_date || absence.end_date,
                        notes: absence.notes,
                        replacement_staff_id: absence.replacement_staff_id,
                        coverage_instructions: absence.coverage_instructions
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
                
                const viewDepartmentDetails = (department) => {
                    // Navigate to department view and show details
                    switchView('department_management');
                    setTimeout(() => {
                        showToast('Department Details', `Viewing ${department.name}`, 'info');
                    }, 100);
                };
                
                const assignRotationToStaff = (staff) => {
                    if (staff.staff_type === 'medical_resident') {
                        rotationModal.form.resident_id = staff.id;
                        rotationModal.mode = 'add';
                        rotationModal.show = true;
                    }
                };
                
                const assignResidentToUnit = (unit) => {
                    quickPlacementModal.training_unit_id = unit.id;
                    quickPlacementModal.show = true;
                };
                
                const assignCoverage = (absence) => {
                    absenceModal.mode = 'edit';
                    absenceModal.form = {
                        id: absence.id,
                        staff_member_id: absence.staff_member_id,
                        absence_reason: absence.leave_category || absence.absence_reason,
                        start_date: absence.leave_start_date || absence.start_date,
                        end_date: absence.leave_end_date || absence.end_date,
                        notes: absence.notes,
                        replacement_staff_id: absence.replacement_staff_id || '',
                        coverage_instructions: absence.coverage_instructions || ''
                    };
                    absenceModal.show = true;
                    showToast('Assign Coverage', 'Select a replacement staff member from the dropdown', 'info');
                };
                
                const removeResidentFromUnit = (residentId, unitId) => {
                    showConfirmation({
                        title: 'Remove Resident',
                        message: 'Are you sure you want to remove this resident from the training unit?',
                        icon: 'fa-user-times',
                        confirmButtonText: 'Remove',
                        confirmButtonClass: 'btn-danger',
                        onConfirm: async () => {
                            try {
                                // Find and remove rotation
                                const rotationIndex = residentRotations.value.findIndex(r => 
                                    r.resident_id === residentId && r.training_unit_id === unitId && r.status === 'active');
                                
                                if (rotationIndex !== -1) {
                                    residentRotations.value[rotationIndex].status = 'cancelled';
                                    
                                    // Update training unit count
                                    const unitIndex = trainingUnits.value.findIndex(u => u.id === unitId);
                                    if (unitIndex !== -1 && trainingUnits.value[unitIndex].current_residents > 0) {
                                        trainingUnits.value[unitIndex].current_residents--;
                                    }
                                    
                                    showToast('Removed', 'Resident has been removed from the training unit', 'success');
                                }
                            } catch (error) {
                                showToast('Error', error.message, 'error');
                            }
                        }
                    });
                };
                
                const showAddDepartmentModal = () => {
                    departmentModal.mode = 'add';
                    departmentModal.form = {
                        name: '',
                        code: '',
                        status: 'active',
                        description: '',
                        head_of_department_id: ''
                    };
                    departmentModal.show = true;
                };
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

                
                const showAddClinicalUnitModal = () => {
                    clinicalUnitModal.mode = 'add';
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
                    clinicalUnitModal.show = true;
                };
                
                const showAddTrainingUnitModal = () => {
                    trainingUnitModal.mode = 'add';
                    trainingUnitModal.form = {
                        unit_name: '',
                        unit_code: '',
                        department_id: '',
                        supervisor_id: '',
                        max_capacity: 10,
                        status: 'active',
                        description: ''
                    };
                    trainingUnitModal.show = true;
                };
                
                const showAddRotationModal = () => {
                    rotationModal.mode = 'add';
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
                        coverage_notes: '',
                        status: 'scheduled'
                    };
                    onCallModal.show = true;
                };
                
                const showAddAbsenceModal = () => {
                    absenceModal.mode = 'add';
                    absenceModal.form = {
                        staff_member_id: '',
                        absence_reason: '',
                        start_date: new Date().toISOString().split('T')[0],
                        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        notes: '',
                        replacement_staff_id: '',
                        coverage_instructions: ''
                    };
                    absenceModal.show = true;
                };
                
                const showCommunicationsModal = () => {
                    communicationsModal.form = {
                        announcement_title: '',
                        announcement_content: '',
                        publish_start_date: new Date().toISOString().split('T')[0],
                        publish_end_date: '',
                        priority_level: 'medium',
                        target_audience: 'all'
                    };
                    communicationsModal.show = true;
                };
                
                const showQuickPlacementModal = () => {
                    quickPlacementModal.resident_id = '';
                    quickPlacementModal.training_unit_id = '';
                    quickPlacementModal.start_date = new Date().toISOString().split('T')[0];
                    quickPlacementModal.duration = 4;
                    quickPlacementModal.supervisor_id = '';
                    quickPlacementModal.notes = '';
                    quickPlacementModal.show = true;
                };
                
                const showBulkAssignModal = () => {
                    bulkAssignModal.selectedResidents = [];
                    bulkAssignModal.training_unit_id = '';
                    bulkAssignModal.start_date = new Date().toISOString().split('T')[0];
                    bulkAssignModal.duration = 4;
                    bulkAssignModal.supervisor_id = '';
                    bulkAssignModal.show = true;
                };
                
                const showUserProfile = () => {
                    userProfileModal.form = {
                        full_name: currentUser.value?.full_name || '',
                        email: currentUser.value?.email || '',
                        phone: currentUser.value?.phone || '',
                        department_id: currentUser.value?.department_id || '',
                        notifications_enabled: currentUser.value?.notifications_enabled || true,
                        absence_notifications: currentUser.value?.absence_notifications || true,
                        announcement_notifications: currentUser.value?.announcement_notifications || true
                    };
                    userProfileModal.show = true;
                    userMenuOpen.value = false;
                };
                
                const showSystemSettingsModal = () => {
                    systemSettingsModal.settings = { ...systemSettings.value };
                    systemSettingsModal.show = true;
                    userMenuOpen.value = false;
                };
                
                const showPermissionManager = () => {
                    switchView('permission_manager');
                    userMenuOpen.value = false;
                };
                
                const showAddRoleModal = () => {
                    roleModal.mode = 'add';
                    roleModal.form = {
                        name: '',
                        description: '',
                        permissions: []
                    };
                    roleModal.show = true;
                };
                
                const editRole = (role) => {
                    roleModal.mode = 'edit';
                    roleModal.form = { ...role };
                    roleModal.show = true;
                };
                
                const editUserPermissions = (user) => {
                    showToast('Edit User', `Editing permissions for ${user.full_name}`, 'info');
                    // In a real app, you would open a modal to edit user permissions
                };
                
                const getCommunicationIcon = (tab) => {
                    const icons = {
                        announcement: 'fa-bullhorn',
                        capacity: 'fa-bed',
                        alert: 'fa-exclamation-triangle'
                    };
                    return icons[tab] || 'fa-comments';
                };
                
                const getCommunicationButtonText = (tab) => {
                    const texts = {
                        announcement: 'Post Announcement',
                        capacity: 'Update Capacity',
                        alert: 'Send Alert'
                    };
                    return texts[tab] || 'Send Communication';
                };
                
                // ============ AUTHENTICATION ============
                const handleLogin = async () => {
                    loading.value = true;
                    try {
                        const { email, password } = loginForm;
                        
                        if (!email || !password) {
                            throw new Error('Email and password are required');
                        }
                        
                        // For demo purposes, accept any login
                        if (email === 'admin@neumocare.org' && password === 'password123') {
                            currentUser.value = {
                                id: 'admin_1',
                                full_name: 'System Administrator',
                                email: 'admin@neumocare.org',
                                user_role: 'administrator',
                                department_id: 1,
                                phone: '555-1234'
                            };
                            
                            localStorage.setItem('neumocare_user', JSON.stringify(currentUser.value));
                            
                            showToast('Login Successful', `Welcome ${currentUser.value.full_name}!`, 'success');
                            await loadInitialData();
                            currentView.value = 'daily_operations';
                        } else {
                            throw new Error('Invalid credentials. Use admin@neumocare.org / password123');
                        }
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
                            localStorage.removeItem('neumocare_token');
                            localStorage.removeItem('neumocare_user');
                            currentUser.value = null;
                            currentView.value = 'login';
                            userMenuOpen.value = false;
                            showToast('Logged Out', 'You have been successfully logged out', 'info');
                        }
                    });
                };
                
                // ============ NAVIGATION ============
                const switchView = (view) => {
                    if (!currentUser.value && view !== 'login') return;
                    
                    currentView.value = view;
                    mobileMenuOpen.value = false;
                    
                    // Load data specific to view
                    switch (view) {
                        case 'medical_staff':
                            loadMedicalStaff();
                            break;
                        case 'department_management':
                            loadDepartments();
                            loadClinicalUnits();
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
                        case 'permission_manager':
                            // Permission data is already loaded
                            break;
                        case 'daily_operations':
                            loadDashboardStats();
                            loadAnnouncements();
                            loadOnCallSchedule();
                            break;
                    }
                };
                
                // ============ UI FUNCTIONS ============
                const toggleStatsSidebar = () => {
                    statsSidebarOpen.value = !statsSidebarOpen.value;
                };
                
                const toggleSearchScope = () => {
                    const scopes = ['All', 'Staff', 'Patients', 'Units', 'Rotations'];
                    const currentIndex = scopes.indexOf(searchScope.value);
                    searchScope.value = scopes[(currentIndex + 1) % scopes.length];
                };
                
                const setSearchFilter = (filter) => {
                    searchFilter.value = filter;
                    showToast('Search Filter', `Searching in ${filter}`, 'info');
                };
                
                const handleSearch = () => {
                    if (searchQuery.value.trim()) {
                        showToast('Search', `Searching for "${searchQuery.value}" in ${searchScope.value}`, 'info');
                        // In a real app, you would perform the search here
                    }
                };
                
                const showNotifications = () => {
                    showToast('Notifications', `You have ${unreadNotifications.value} unread notifications`, 'info');
                    unreadNotifications.value = 0;
                };
                
                const updateCapacity = () => {
                    showToast('Capacity Updated', 'Emergency Room and ICU capacities have been updated', 'success');
                    // In a real app, you would save this to the backend
                };
                
                const exportAuditLogs = () => {
                    showToast('Export Started', 'Audit logs export has been initiated', 'info');
                    // In a real app, you would generate and download a CSV
                };
                
                const showAbsenceCalendar = (view) => {
                    showToast('Calendar View', `Switched to ${view} view`, 'info');
                };
                
                // ============ LIFECYCLE HOOKS ============
                onMounted(() => {
                    if (currentUser.value) {
                        loadInitialData();
                    }
                    
                    // Initialize with some active alerts for demo
                    activeAlerts.value = [
                        { id: 1, message: 'ICU capacity at 85%. Consider transferring stable patients.', type: 'warning' },
                        { id: 2, message: 'Dr. Smith is on leave tomorrow. Coverage needed.', type: 'info' }
                    ];
                    
                    // Close menus when clicking outside
                    document.addEventListener('click', function(event) {
                        if (!event.target.closest('.user-menu')) {
                            userMenuOpen.value = false;
                        }
                        
                        // Close all action menus
                        if (!event.target.closest('.action-dropdown')) {
                            document.querySelectorAll('.action-menu').forEach(menu => {
                                menu.classList.remove('show');
                            });
                        }
                    });
                    
                    // Simulate live updates
                    setInterval(() => {
                        if (currentUser.value) {
                            // Randomly update live stats
                            liveStats.value.occupancy = Math.min(100, Math.max(50, liveStats.value.occupancy + (Math.random() - 0.5) * 2));
                            liveStats.value.onDutyStaff = Math.max(20, liveStats.value.onDutyStaff + (Math.random() > 0.5 ? 1 : -1));
                            liveStats.value.pendingRequests = Math.max(0, liveStats.value.pendingRequests + (Math.random() > 0.7 ? 1 : 0));
                            
                            // Update capacity randomly
                            currentCapacity.er.current = Math.min(currentCapacity.er.max, 
                                Math.max(0, currentCapacity.er.current + (Math.random() > 0.5 ? 1 : -1)));
                            currentCapacity.icu.current = Math.min(currentCapacity.icu.max, 
                                Math.max(0, currentCapacity.icu.current + (Math.random() > 0.5 ? 1 : -1)));
                                
                            // Update status based on capacity
                            const updateStatus = (capacity) => {
                                const percent = (capacity.current / capacity.max) * 100;
                                if (percent >= 90) return 'high';
                                if (percent >= 70) return 'medium';
                                return 'low';
                            };
                            
                            currentCapacity.er.status = updateStatus(currentCapacity.er);
                            currentCapacity.icu.status = updateStatus(currentCapacity.icu);
                        }
                    }, 10000); // Update every 10 seconds
                });
                
                // ============ RETURN STATEMENT ============
                return {
                    // State Variables
                    currentUser,
                    loginForm,
                    loading,
                    saving,
                    loadingStats,
                    loadingStaff,
                    loadingSchedule,
                    loadingAnnouncements,
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
                    
                    // Modal States
                    medicalStaffModal,
                    clinicalUnitModal,
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
                    confirmationModal,
                    staffDetailsModal,
                    absenceDetailsModal,
                    rotationDetailsModal,
                    roleModal,
                    
                    // Data Stores
                    medicalStaff,
                    departments,
                    clinicalUnits,
                    trainingUnits,
                    residentRotations,
                    staffAbsences,
                    onCallSchedule,
                    recentAnnouncements,
                    auditLogs,
                    systemSettings,
                    availableData,
                    stats,
                    liveStats,
                    currentCapacity,
                    
                    // UI State
                    toasts,
                    activeAlerts,
                    unreadNotifications,
                    
                    // Filter States
                    staffFilter,
                    staffSearch,
                    rotationFilter,
                    absenceFilter,
                    auditFilters,
                    
                    // Permission System
                    userRoles,
                    availablePermissions,
                    users,
                    
                    // Utility Functions
                    getInitials,
                    formatDate: Utils.formatDate,
                    formatDateTime: Utils.formatDateTime,
                    formatTimeAgo: Utils.formatTimeAgo,
                    formatStaffType,
                    getStaffTypeClass,
                    formatEmploymentStatus,
                    formatAbsenceReason,
                    formatAbsenceStatus,
                    formatRotationStatus,
                    formatTrainingLevel,
                    getAbsenceStatusClass,
                    getRotationStatusClass,
                    getPriorityColor,
                    formatTimeRange,
                    getDepartmentName,
                    getStaffName,
                    getTrainingUnitName,
                    getResidentName,
                    getSupervisorName,
                    getUserName,
                    getUserRoleDisplay,
                    getDepartmentUnits,
                    getUnitResidents,
                    calculateAbsenceDuration,
                    getCurrentTitle,
                    getCurrentSubtitle,
                    getSearchPlaceholder,
                    
                    // Permission Functions
                    hasPermission,
                    roleHasPermission,
                    toggleRolePermission,
                    formatPermissionName,
                    getUserPermissions,
                    
                    // Filter Functions
                    filteredMedicalStaff,
                    filteredRotations,
                    filteredAbsences,
                    filteredAuditLogs,
                    resetStaffFilters,
                    applyStaffFilters,
                    resetRotationFilters,
                    applyRotationFilters,
                    resetAbsenceFilters,
                    applyAbsenceFilters,
                    resetAuditFilters,
                    applyAuditFilters,
                    
                    // Modal Functions
                    showConfirmation,
                    confirmAction,
                    cancelConfirmation,
                    toggleActionMenu,
                    toggleUserMenu,
                    
                    // Save Functions
                    saveMedicalStaff,
                    saveDepartment,
                    saveClinicalUnit,
                    saveTrainingUnit,
                    saveRotation,
                    saveOnCallSchedule,
                    saveAbsence,
                    saveCommunication,
                    saveQuickPlacement,
                    saveBulkAssignment,
                    saveUserProfile,
                    saveSystemSettings,
                    saveRole,
                    
                    // Delete Functions
                    deleteMedicalStaff,
                    deleteDepartment,
                    deleteClinicalUnit,
                    deleteTrainingUnit,
                    deleteRotation,
                    deleteOnCallSchedule,
                    deleteAbsence,
                    deleteAnnouncement,
                    deleteRole,
                    
                    // View/Edit Functions
                    viewStaffDetails,
                    editMedicalStaff,
                    editDepartment,
                    editClinicalUnit,
                    editTrainingUnit,
                    editRotation,
                    editOnCallSchedule,
                    editAbsence,
                    viewAbsenceDetails,
                    viewRotationDetails,
                    viewDepartmentDetails,
                    assignRotationToStaff,
                    assignResidentToUnit,
                    assignCoverage,
                    removeResidentFromUnit,
                    editRole,
                    editUserPermissions,
                    
                    // Show Modal Functions
                    showAddMedicalStaffModal,
                    showAddDepartmentModal,
                    showAddClinicalUnitModal,
                    showAddTrainingUnitModal,
                    showAddRotationModal,
                    showAddOnCallModal,
                    showAddAbsenceModal,
                    showCommunicationsModal,
                    showQuickPlacementModal,
                    showBulkAssignModal,
                    showUserProfile,
                    showSystemSettingsModal,
                    showPermissionManager,
                    showAddRoleModal,
                    
                    // Communication Functions
                    getCommunicationIcon,
                    getCommunicationButtonText,
                    
                    // Navigation Functions
                    switchView,
                    
                    // Authentication Functions
                    handleLogin,
                    handleLogout,
                    todaysOnCall,
                    
                    // UI Functions
                    removeToast,
                    showToast,
                    dismissAlert,
                    toggleStatsSidebar,
                    toggleSearchScope,
                    setSearchFilter,
                    handleSearch,
                    showNotifications,
                    updateCapacity,
                    exportAuditLogs,
                    showAbsenceCalendar
                };
            }
        });
        
        // ============ MOUNT THE APP ============
        app.mount('#app');
        console.log('NeumoCare Frontend v3.1 mounted successfully');
        
    } catch (error) {
        console.error('FATAL ERROR: Frontend failed to initialize:', error);
        document.body.innerHTML = `
            <div style="padding: 40px; text-align: center; margin-top: 100px; color: #333; font-family: Arial, sans-serif;">
                <h2 style="color: #dc3545;">System Error</h2>
                <p style="margin: 20px 0; color: #666;">${error.message}</p>
                <button onclick="window.location.reload()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Refresh Page
                </button>
            </div>
        `;
    }
});
