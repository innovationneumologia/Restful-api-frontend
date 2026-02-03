// ============================================================================
// NEUMOCARE HOSPITAL MANAGEMENT SYSTEM - Complete Vue.js Frontend v8.0
// ============================================================================
// COMPLETE REWRITE - ALL MODULES - BACKEND COMPATIBLE
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 NeumoCare HMS v8.0 Complete loading...');

    try {
        // ============ 1. VUE VALIDATION ============
        if (typeof Vue === 'undefined') {
            showCriticalError('Vue.js failed to load. Please refresh the page.');
            throw new Error('Vue.js not loaded');
        }

        const { createApp, ref, reactive, computed, onMounted, watch, nextTick } = Vue;

        // ============ 2. CONFIGURATION ============
        const CONFIG = {
            API_BASE_URL: 'https://neumac.up.railway.app',
            TOKEN_KEY: 'neumocare_token',
            USER_KEY: 'neumocare_user',
            VERSION: '8.0',
            DEBUG: window.location.hostname.includes('localhost'),
            
            // Live status expiry options (hours)
            STATUS_EXPIRY_OPTIONS: [
                { value: 1, label: '1 hour' },
                { value: 2, label: '2 hours' },
                { value: 4, label: '4 hours' },
                { value: 8, label: '8 hours' },
                { value: 12, label: '12 hours' },
                { value: 24, label: '24 hours' },
                { value: 48, label: '48 hours' }
            ]
        };

        // ============ 3. UTILITIES ============
        class Utils {
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
                } catch { return dateString; }
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
                } catch { return dateString; }
            }

            static formatTime(dateString) {
                if (!dateString) return '';
                try {
                    const date = new Date(dateString);
                    if (isNaN(date.getTime())) return dateString;
                    return date.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                    });
                } catch { return dateString; }
            }

            static getInitials(name) {
                if (!name || typeof name !== 'string') return '??';
                return name.split(' ')
                    .map(word => word[0])
                    .join('')
                    .toUpperCase()
                    .substring(0, 2);
            }

            static generateId(prefix) {
                return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
            }

            static truncateText(text, maxLength = 100) {
                if (!text) return '';
                if (text.length <= maxLength) return text;
                return text.substring(0, maxLength) + '...';
            }

            static calculateDaysBetween(start, end) {
                try {
                    const startDate = new Date(start);
                    const endDate = new Date(end);
                    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return 0;
                    const diffTime = Math.abs(endDate - startDate);
                    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                } catch { return 0; }
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

            static getRelativeTime(dateString) {
                if (!dateString) return 'Just now';
                try {
                    const date = new Date(dateString);
                    const now = new Date();
                    const diffMs = now - date;
                    const diffMins = Math.floor(diffMs / 60000);
                    
                    if (diffMins < 1) return 'Just now';
                    if (diffMins < 60) return `${diffMins}m ago`;
                    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
                    return `${Math.floor(diffMins / 1440)}d ago`;
                } catch { return 'Just now'; }
            }

            static isDateInRange(dateString, startDate, endDate) {
                try {
                    const date = new Date(dateString);
                    const start = new Date(startDate);
                    const end = new Date(endDate);
                    return date >= start && date <= end;
                } catch { return false; }
            }

            static getStatusBadgeClass(status) {
                if (!status) return 'badge-secondary';
                if (status.expires_at) {
                    const expires = new Date(status.expires_at);
                    const now = new Date();
                    if (now > expires) return 'badge-warning';
                }
                return 'badge-success';
            }

            static getStaffTypeIcon(type) {
                const icons = {
                    'attending_physician': 'fa-user-md',
                    'medical_resident': 'fa-user-graduate',
                    'fellow': 'fa-user-tie',
                    'nurse_practitioner': 'fa-user-nurse'
                };
                return icons[type] || 'fa-user';
            }
        }

        // ============ 4. COMPLETE API SERVICE ============
        class ApiService {
            constructor() {
                this.baseUrl = CONFIG.API_BASE_URL;
                this.token = localStorage.getItem(CONFIG.TOKEN_KEY);
            }

            getHeaders() {
                const headers = {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                };
                
                const token = localStorage.getItem(CONFIG.TOKEN_KEY);
                if (token && token.trim()) {
                    headers['Authorization'] = `Bearer ${token}`;
                }
                
                return headers;
            }

            async request(endpoint, options = {}) {
                const url = `${this.baseUrl}${endpoint}`;
                
                try {
                    const config = {
                        method: options.method || 'GET',
                        headers: this.getHeaders(),
                        mode: 'cors',
                        cache: 'no-cache'
                    };
                    
                    if (options.body) {
                        config.body = JSON.stringify(options.body);
                    }
                    
                    const response = await fetch(url, config);
                    
                    if (response.status === 204) return null;
                    
                    if (!response.ok) {
                        if (response.status === 401) {
                            this.token = null;
                            localStorage.removeItem(CONFIG.TOKEN_KEY);
                            localStorage.removeItem(CONFIG.USER_KEY);
                            throw new Error('Session expired. Please login again.');
                        }
                        
                        let errorText;
                        try {
                            errorText = await response.text();
                        } catch {
                            errorText = `HTTP ${response.status}: ${response.statusText}`;
                        }
                        
                        throw new Error(errorText);
                    }
                    
                    const contentType = response.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        return await response.json();
                    }
                    
                    return await response.text();
                    
                } catch (error) {
                    if (CONFIG.DEBUG) console.error(`API ${endpoint} failed:`, error);
                    throw error;
                }
            }

            // ===== AUTHENTICATION =====
            async login(email, password) {
                const data = await this.request('/api/auth/login', {
                    method: 'POST',
                    body: { email, password }
                });
                
                if (data.token) {
                    this.token = data.token;
                    localStorage.setItem(CONFIG.TOKEN_KEY, data.token);
                    localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(data.user));
                }
                
                return data;
            }

            async logout() {
                try {
                    await this.request('/api/auth/logout', { method: 'POST' });
                } finally {
                    this.token = null;
                    localStorage.removeItem(CONFIG.TOKEN_KEY);
                    localStorage.removeItem(CONFIG.USER_KEY);
                }
            }

            // ===== MEDICAL STAFF =====
            async getMedicalStaff() {
                try {
                    const data = await this.request('/api/medical-staff');
                    return Array.isArray(data) ? data : data?.data || [];
                } catch { return []; }
            }

            async getEnhancedStaff(id) {
                try {
                    const response = await this.request(`/api/medical-staff/${id}/enhanced`);
                    return response?.data || response;
                } catch (error) {
                    console.error('Enhanced staff error:', error);
                    return null;
                }
            }

            async createMedicalStaff(staffData) {
                return await this.request('/api/medical-staff', {
                    method: 'POST',
                    body: staffData
                });
            }

            async updateMedicalStaff(id, staffData) {
                return await this.request(`/api/medical-staff/${id}`, {
                    method: 'PUT',
                    body: staffData
                });
            }

            async deleteMedicalStaff(id) {
                return await this.request(`/api/medical-staff/${id}`, { method: 'DELETE' });
            }

            // ===== RESEARCH LINES =====
            async getResearchLines() {
                try {
                    const response = await this.request('/api/research-lines');
                    return response?.data || response || [];
                } catch { return []; }
            }

            async getStaffResearchLines(staffId) {
                try {
                    const response = await this.request(`/api/medical-staff/${staffId}/research-lines`);
                    return response?.data || response || [];
                } catch { return []; }
            }

            async updateStaffResearchLines(staffId, researchLineIds) {
                return await this.request(`/api/medical-staff/${staffId}/research-lines`, {
                    method: 'PUT',
                    body: { research_line_ids: researchLineIds }
                });
            }

            // ===== CLINICAL UNITS =====
            async getClinicalUnits() {
                try {
                    const data = await this.request('/api/training-units');
                    return Array.isArray(data) ? data : data?.data || [];
                } catch { return []; }
            }

            async getClinicalUnitsWithStaff() {
                try {
                    const response = await this.request('/api/clinical-units/with-staff');
                    return response?.data || response || [];
                } catch { return []; }
            }

            async getClinicalUnitStaff(unitId) {
                try {
                    const response = await this.request(`/api/clinical-units/${unitId}/staff`);
                    return response?.data || response || [];
                } catch { return []; }
            }

            async assignStaffToUnit(unitId, assignmentData) {
                return await this.request(`/api/clinical-units/${unitId}/assign-staff`, {
                    method: 'POST',
                    body: assignmentData
                });
            }

            async removeStaffFromUnit(unitId, staffId) {
                return await this.request(`/api/clinical-units/${unitId}/staff/${staffId}`, {
                    method: 'DELETE'
                });
            }

            // ===== DEPARTMENTS =====
            async getDepartments() {
                try {
                    const data = await this.request('/api/departments');
                    return Array.isArray(data) ? data : data?.data || [];
                } catch { return []; }
            }

            async createDepartment(deptData) {
                return await this.request('/api/departments', {
                    method: 'POST',
                    body: deptData
                });
            }

            async updateDepartment(id, deptData) {
                return await this.request(`/api/departments/${id}`, {
                    method: 'PUT',
                    body: deptData
                });
            }

            // ===== ROTATIONS =====
            async getRotations() {
                try {
                    const data = await this.request('/api/rotations');
                    return Array.isArray(data) ? data : data?.data || [];
                } catch { return []; }
            }

            async createRotation(rotationData) {
                return await this.request('/api/rotations', {
                    method: 'POST',
                    body: rotationData
                });
            }

            async updateRotation(id, rotationData) {
                return await this.request(`/api/rotations/${id}`, {
                    method: 'PUT',
                    body: rotationData
                });
            }

            async deleteRotation(id) {
                return await this.request(`/api/rotations/${id}`, { method: 'DELETE' });
            }

            // ===== ON-CALL SCHEDULE =====
            async getOnCallSchedule() {
                try {
                    const data = await this.request('/api/oncall');
                    return Array.isArray(data) ? data : data?.data || [];
                } catch { return []; }
            }

            async getOnCallToday() {
                try {
                    const data = await this.request('/api/oncall/today');
                    return Array.isArray(data) ? data : data?.data || [];
                } catch { return []; }
            }

            async createOnCall(scheduleData) {
                return await this.request('/api/oncall', {
                    method: 'POST',
                    body: scheduleData
                });
            }

            async updateOnCall(id, scheduleData) {
                return await this.request(`/api/oncall/${id}`, {
                    method: 'PUT',
                    body: scheduleData
                });
            }

            async deleteOnCall(id) {
                return await this.request(`/api/oncall/${id}`, { method: 'DELETE' });
            }

            // ===== ABSENCES =====
            async getAbsences() {
                try {
                    const data = await this.request('/api/absence-records');
                    return Array.isArray(data) ? data : data?.data || [];
                } catch { return []; }
            }

            async createAbsence(absenceData) {
                return await this.request('/api/absence-records', {
                    method: 'POST',
                    body: absenceData
                });
            }

            async updateAbsence(id, absenceData) {
                return await this.request(`/api/absence-records/${id}`, {
                    method: 'PUT',
                    body: absenceData
                });
            }

            async deleteAbsence(id) {
                return await this.request(`/api/absence-records/${id}`, { method: 'DELETE' });
            }

            // ===== ANNOUNCEMENTS =====
            async getAnnouncements() {
                try {
                    const data = await this.request('/api/announcements');
                    return Array.isArray(data) ? data : data?.data || [];
                } catch { return []; }
            }

            async createAnnouncement(announcementData) {
                return await this.request('/api/announcements', {
                    method: 'POST',
                    body: announcementData
                });
            }

            async updateAnnouncement(id, announcementData) {
                return await this.request(`/api/announcements/${id}`, {
                    method: 'PUT',
                    body: announcementData
                });
            }

            async deleteAnnouncement(id) {
                return await this.request(`/api/announcements/${id}`, { method: 'DELETE' });
            }

            // ===== LIVE STATUS =====
            async getClinicalStatus() {
                try {
                    const response = await this.request('/api/live-status/current');
                    return response;
                } catch (error) {
                    console.error('Clinical status error:', error);
                    return { success: false, data: null };
                }
            }

            async createClinicalStatus(statusData) {
                return await this.request('/api/live-status', {
                    method: 'POST',
                    body: statusData
                });
            }

            async deleteClinicalStatus(id) {
                return await this.request(`/api/live-status/${id}`, { method: 'DELETE' });
            }

            // ===== SYSTEM STATS =====
            async getSystemStats() {
                try {
                    const response = await this.request('/api/system-stats');
                    return response?.data || response || {};
                } catch {
                    return {
                        totalStaff: 0,
                        activeAttending: 0,
                        activeResidents: 0,
                        onCallNow: 0,
                        activeRotations: 0,
                        currentlyAbsent: 0
                    };
                }
            }

            // ===== SEARCH =====
            async searchMedicalStaff(query) {
                try {
                    const data = await this.request(`/api/search/medical-staff?q=${encodeURIComponent(query)}`);
                    return Array.isArray(data) ? data : [];
                } catch { return []; }
            }
        }

        const API = new ApiService();

        // ============ 5. COMPLETE VUE APP ============
        const app = createApp({
            setup() {
                // ============ 6. CORE STATE ============
                const currentUser = ref(null);
                const currentView = ref('login');
                const isLoading = ref(false);
                const isSaving = ref(false);
                const currentTime = ref(new Date());

                // ============ 7. DATA STORES ============
                const medicalStaff = ref([]);
                const researchLines = ref([]);
                const clinicalUnits = ref([]);
                const clinicalUnitsWithStaff = ref([]);
                const rotations = ref([]);
                const onCallSchedule = ref([]);
                const absences = ref([]);
                const announcements = ref([]);
                const departments = ref([]);
                const systemStats = ref({});
                const clinicalStatus = ref(null);
                const todaysOnCall = ref([]);

                // ============ 8. UI STATE ============
                const sidebarCollapsed = ref(false);
                const mobileMenuOpen = ref(false);
                const userMenuOpen = ref(false);
                const toasts = ref([]);
                const activeAlerts = ref([]);
                const globalSearchQuery = ref('');

                // ============ 9. FILTER STATES ============
                const filters = reactive({
                    staff: {
                        search: '',
                        staffType: '',
                        department: '',
                        clinicalUnit: '',
                        status: ''
                    },
                    rotations: {
                        status: '',
                        clinicalUnit: '',
                        resident: '',
                        supervisor: ''
                    },
                    oncall: {
                        date: '',
                        shiftType: '',
                        physician: '',
                        coverageArea: ''
                    },
                    absences: {
                        staff: '',
                        status: '',
                        reason: '',
                        startDate: ''
                    },
                    announcements: {
                        priority: '',
                        audience: ''
                    }
                });

                // ============ 10. MODAL STATES ============
                const modals = reactive({
                    // Staff Management
                    staff: {
                        show: false,
                        mode: 'add', // 'add' or 'edit'
                        data: null,
                        activeTab: 'basic'
                    },
                    
                    // Research Lines
                    researchLines: {
                        show: false,
                        staffId: null,
                        selectedLines: []
                    },
                    
                    // Clinical Units
                    clinicalUnit: {
                        show: false,
                        mode: 'add',
                        data: null
                    },
                    
                    clinicalUnitStaff: {
                        show: false,
                        unitId: null,
                        unitName: '',
                        staff: []
                    },
                    
                    // Rotations
                    rotation: {
                        show: false,
                        mode: 'add',
                        data: null
                    },
                    
                    // On-Call
                    oncall: {
                        show: false,
                        mode: 'add',
                        data: null
                    },
                    
                    // Absences
                    absence: {
                        show: false,
                        mode: 'add',
                        data: null,
                        activeTab: 'basic'
                    },
                    
                    // Announcements
                    announcement: {
                        show: false,
                        mode: 'add',
                        data: null
                    },
                    
                    // Departments
                    department: {
                        show: false,
                        mode: 'add',
                        data: null
                    },
                    
                    // Live Status
                    liveStatus: {
                        show: false,
                        editing: false,
                        statusText: '',
                        expiryHours: 8
                    },
                    
                    // Profile
                    profile: {
                        show: false,
                        data: null
                    },
                    
                    // Confirmation
                    confirmation: {
                        show: false,
                        title: '',
                        message: '',
                        confirmText: 'Confirm',
                        cancelText: 'Cancel',
                        onConfirm: null,
                        type: 'warning' // 'info', 'success', 'warning', 'danger'
                    }
                });

                // ============ 11. FORM STATES ============
                const forms = reactive({
                    login: {
                        email: '',
                        password: '',
                        remember: false
                    },
                    
                    staff: {
                        full_name: '',
                        staff_type: 'medical_resident',
                        staff_id: Utils.generateId('MD'),
                        employment_status: 'active',
                        professional_email: '',
                        department_id: '',
                        clinical_unit_id: '',
                        academic_degree: '',
                        specialization: '',
                        training_year: '',
                        clinical_study_certificate: '',
                        certificate_status: 'current',
                        research_line_ids: []
                    },
                    
                    clinicalUnit: {
                        unit_name: '',
                        unit_code: '',
                        department_id: '',
                        maximum_residents: 10,
                        unit_status: 'active',
                        specialty: '',
                        supervising_attending_id: ''
                    },
                    
                    rotation: {
                        rotation_id: Utils.generateId('ROT'),
                        resident_id: '',
                        training_unit_id: '', // Backend field name
                        clinical_unit_id: '', // Frontend field name
                        rotation_start_date: new Date().toISOString().split('T')[0],
                        rotation_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        rotation_status: 'scheduled',
                        rotation_category: 'clinical_rotation',
                        supervising_attending_id: ''
                    },
                    
                    oncall: {
                        duty_date: new Date().toISOString().split('T')[0],
                        shift_type: 'primary_call',
                        start_time: '08:00',
                        end_time: '17:00',
                        primary_physician_id: '',
                        backup_physician_id: '',
                        coverage_notes: 'emergency',
                        schedule_id: Utils.generateId('SCH')
                    },
                    
                    absence: {
                        staff_member_id: '',
                        absence_type: 'planned',
                        absence_reason: 'vacation',
                        start_date: new Date().toISOString().split('T')[0],
                        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        coverage_arranged: false,
                        covering_staff_id: '',
                        coverage_notes: '',
                        hod_notes: ''
                    },
                    
                    announcement: {
                        title: '',
                        content: '',
                        priority_level: 'normal',
                        target_audience: 'all_staff',
                        publish_start_date: new Date().toISOString().split('T')[0],
                        publish_end_date: null
                    },
                    
                    department: {
                        name: '',
                        code: '',
                        description: '',
                        head_of_department_id: '',
                        contact_email: '',
                        contact_phone: '',
                        status: 'active'
                    }
                });

                // ============ 12. PERMISSIONS MATRIX ============
                const PERMISSIONS = {
                    system_admin: {
                        medical_staff: ['create', 'read', 'update', 'delete'],
                        research_lines: ['create', 'read', 'update', 'delete'],
                        clinical_units: ['create', 'read', 'update', 'delete'],
                        rotations: ['create', 'read', 'update', 'delete'],
                        oncall: ['create', 'read', 'update', 'delete'],
                        absences: ['create', 'read', 'update', 'delete'],
                        announcements: ['create', 'read', 'update', 'delete'],
                        departments: ['create', 'read', 'update', 'delete'],
                        system_settings: ['read', 'update']
                    },
                    department_head: {
                        medical_staff: ['read', 'update'],
                        research_lines: ['read', 'update'],
                        clinical_units: ['read', 'update'],
                        rotations: ['create', 'read', 'update'],
                        oncall: ['create', 'read', 'update'],
                        absences: ['create', 'read', 'update'],
                        announcements: ['create', 'read'],
                        departments: ['read'],
                        system_settings: ['read']
                    },
                    attending_physician: {
                        medical_staff: ['read'],
                        research_lines: ['read'],
                        clinical_units: ['read'],
                        rotations: ['read'],
                        oncall: ['read'],
                        absences: ['read'],
                        announcements: ['read'],
                        departments: ['read'],
                        system_settings: []
                    },
                    medical_resident: {
                        medical_staff: ['read'],
                        research_lines: ['read'],
                        clinical_units: ['read'],
                        rotations: ['read'],
                        oncall: ['read'],
                        absences: ['read'],
                        announcements: ['read'],
                        departments: [],
                        system_settings: []
                    }
                };

                // ============ 13. TOAST SYSTEM ============
                const showToast = (title, message, type = 'info', duration = 5000) => {
                    const toast = {
                        id: Date.now(),
                        title,
                        message,
                        type,
                        icon: getToastIcon(type)
                    };
                    
                    toasts.value.push(toast);
                    
                    if (duration > 0) {
                        setTimeout(() => {
                            const index = toasts.value.findIndex(t => t.id === toast.id);
                            if (index > -1) toasts.value.splice(index, 1);
                        }, duration);
                    }
                };

                const getToastIcon = (type) => {
                    const icons = {
                        info: 'fas fa-info-circle',
                        success: 'fas fa-check-circle',
                        error: 'fas fa-exclamation-circle',
                        warning: 'fas fa-exclamation-triangle'
                    };
                    return icons[type] || icons.info;
                };

                // ============ 14. CONFIRMATION MODAL ============
                const showConfirmation = (config) => {
                    modals.confirmation = {
                        show: true,
                        title: config.title || 'Confirm Action',
                        message: config.message || 'Are you sure you want to continue?',
                        confirmText: config.confirmText || 'Confirm',
                        cancelText: config.cancelText || 'Cancel',
                        onConfirm: config.onConfirm || null,
                        type: config.type || 'warning'
                    };
                };

                const confirmAction = () => {
                    if (modals.confirmation.onConfirm) {
                        modals.confirmation.onConfirm();
                    }
                    modals.confirmation.show = false;
                };

                const cancelConfirmation = () => {
                    modals.confirmation.show = false;
                };

                // ============ 15. DATA LOADING FUNCTIONS ============
                const loadAllData = async () => {
                    isLoading.value = true;
                    try {
                        await Promise.all([
                            loadMedicalStaff(),
                            loadResearchLines(),
                            loadClinicalUnits(),
                            loadClinicalUnitsWithStaff(),
                            loadRotations(),
                            loadOnCallSchedule(),
                            loadTodaysOnCall(),
                            loadAbsences(),
                            loadAnnouncements(),
                            loadDepartments(),
                            loadSystemStats(),
                            loadClinicalStatus()
                        ]);
                    } catch (error) {
                        console.error('Failed to load data:', error);
                        showToast('Error', 'Failed to load some data', 'error');
                    } finally {
                        isLoading.value = false;
                    }
                };

                const loadMedicalStaff = async () => {
                    medicalStaff.value = await API.getMedicalStaff();
                };

                const loadResearchLines = async () => {
                    researchLines.value = await API.getResearchLines();
                };

                const loadClinicalUnits = async () => {
                    clinicalUnits.value = await API.getClinicalUnits();
                };

                const loadClinicalUnitsWithStaff = async () => {
                    clinicalUnitsWithStaff.value = await API.getClinicalUnitsWithStaff();
                };

                const loadRotations = async () => {
                    rotations.value = await API.getRotations();
                };

                const loadOnCallSchedule = async () => {
                    onCallSchedule.value = await API.getOnCallSchedule();
                };

                const loadTodaysOnCall = async () => {
                    todaysOnCall.value = await API.getOnCallToday();
                };

                const loadAbsences = async () => {
                    absences.value = await API.getAbsences();
                };

                const loadAnnouncements = async () => {
                    announcements.value = await API.getAnnouncements();
                };

                const loadDepartments = async () => {
                    departments.value = await API.getDepartments();
                };

                const loadSystemStats = async () => {
                    systemStats.value = await API.getSystemStats();
                };

                const loadClinicalStatus = async () => {
                    const response = await API.getClinicalStatus();
                    if (response && response.success) {
                        clinicalStatus.value = response.data;
                    } else {
                        clinicalStatus.value = null;
                    }
                };

                // ============ 16. AUTHENTICATION ============
                const handleLogin = async () => {
                    if (!forms.login.email || !forms.login.password) {
                        showToast('Error', 'Email and password are required', 'error');
                        return;
                    }

                    isLoading.value = true;
                    try {
                        const response = await API.login(forms.login.email, forms.login.password);
                        
                        currentUser.value = response.user;
                        localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(response.user));
                        
                        showToast('Welcome', `Hello, ${response.user.full_name}!`, 'success');
                        
                        await loadAllData();
                        currentView.value = 'dashboard';
                        
                    } catch (error) {
                        showToast('Login Failed', error.message || 'Invalid credentials', 'error');
                    } finally {
                        isLoading.value = false;
                    }
                };

                const handleLogout = () => {
                    showConfirmation({
                        title: 'Logout',
                        message: 'Are you sure you want to logout?',
                        confirmText: 'Logout',
                        type: 'warning',
                        onConfirm: async () => {
                            try {
                                await API.logout();
                            } finally {
                                currentUser.value = null;
                                currentView.value = 'login';
                                userMenuOpen.value = false;
                                showToast('Logged Out', 'See you soon!', 'info');
                            }
                        }
                    });
                };

                // ============ 17. NAVIGATION ============
                const switchView = (view) => {
                    currentView.value = view;
                    mobileMenuOpen.value = false;
                };

                const getViewTitle = () => {
                    const titles = {
                        dashboard: 'Dashboard',
                        medical_staff: 'Medical Staff',
                        clinical_units: 'Clinical Units',
                        rotations: 'Resident Rotations',
                        oncall_schedule: 'On-Call Schedule',
                        staff_absence: 'Staff Absence',
                        communications: 'Communications',
                        department_management: 'Departments'
                    };
                    return titles[currentView.value] || 'NeumoCare';
                };

                const getViewSubtitle = () => {
                    const subtitles = {
                        dashboard: 'System Overview',
                        medical_staff: 'Manage physicians and residents',
                        clinical_units: 'Clinical training units and assignments',
                        rotations: 'Resident training rotations',
                        oncall_schedule: 'On-call physician schedules',
                        staff_absence: 'Staff absence management',
                        communications: 'Announcements and updates',
                        department_management: 'Department structure'
                    };
                    return subtitles[currentView.value] || 'Hospital Management System';
                };

                // ============ 18. PERMISSION CHECKING ============
                const hasPermission = (module, action = 'read') => {
                    if (!currentUser.value) return false;
                    
                    const role = currentUser.value.user_role;
                    if (role === 'system_admin') return true;
                    
                    const permissions = PERMISSIONS[role];
                    if (!permissions) return false;
                    
                    const modulePermissions = permissions[module];
                    if (!modulePermissions) return false;
                    
                    return modulePermissions.includes(action);
                };

                // ============ 19. FORMATTING HELPERS ============
                const formatStaffType = (type) => {
                    const map = {
                        'medical_resident': 'Medical Resident',
                        'attending_physician': 'Attending Physician',
                        'fellow': 'Fellow',
                        'nurse_practitioner': 'Nurse Practitioner'
                    };
                    return map[type] || type;
                };

                const formatAbsenceReason = (reason) => {
                    const map = {
                        'vacation': 'Vacation',
                        'conference': 'Conference',
                        'sick_leave': 'Sick Leave',
                        'training': 'Training',
                        'personal': 'Personal',
                        'other': 'Other'
                    };
                    return map[reason] || reason;
                };

                const formatRotationStatus = (status) => {
                    const map = {
                        'scheduled': 'Scheduled',
                        'active': 'Active',
                        'completed': 'Completed',
                        'cancelled': 'Cancelled'
                    };
                    return map[status] || status;
                };

                const getDepartmentName = (id) => {
                    const dept = departments.value.find(d => d.id === id);
                    return dept ? dept.name : 'Unassigned';
                };

                const getClinicalUnitName = (id) => {
                    const unit = clinicalUnits.value.find(u => u.id === id);
                    return unit ? unit.unit_name : 'Unassigned';
                };

                const getStaffName = (id) => {
                    const staff = medicalStaff.value.find(s => s.id === id);
                    return staff ? staff.full_name : 'Unknown';
                };

                const getStaffEmail = (id) => {
                    const staff = medicalStaff.value.find(s => s.id === id);
                    return staff ? staff.professional_email : '';
                };

                // ============ 20. MODAL OPEN FUNCTIONS ============
                const openAddStaffModal = () => {
                    modals.staff = {
                        show: true,
                        mode: 'add',
                        data: null,
                        activeTab: 'basic'
                    };
                    
                    // Reset form
                    Object.assign(forms.staff, {
                        full_name: '',
                        staff_type: 'medical_resident',
                        staff_id: Utils.generateId('MD'),
                        employment_status: 'active',
                        professional_email: '',
                        department_id: '',
                        clinical_unit_id: '',
                        academic_degree: '',
                        specialization: '',
                        training_year: '',
                        clinical_study_certificate: '',
                        certificate_status: 'current',
                        research_line_ids: []
                    });
                };

                const openEditStaffModal = (staff) => {
                    modals.staff = {
                        show: true,
                        mode: 'edit',
                        data: staff,
                        activeTab: 'basic'
                    };
                    
                    // Load staff data into form
                    Object.assign(forms.staff, {
                        full_name: staff.full_name,
                        staff_type: staff.staff_type,
                        staff_id: staff.staff_id,
                        employment_status: staff.employment_status,
                        professional_email: staff.professional_email,
                        department_id: staff.department_id,
                        clinical_unit_id: staff.clinical_unit_id || staff.current_clinical_unit_id,
                        academic_degree: staff.academic_degree,
                        specialization: staff.specialization,
                        training_year: staff.training_year,
                        clinical_study_certificate: staff.clinical_study_certificate,
                        certificate_status: staff.certificate_status,
                        research_line_ids: []
                    });
                    
                    // Load research lines for this staff
                    loadStaffResearchLines(staff.id);
                };

                const openResearchLinesModal = (staffId) => {
                    modals.researchLines = {
                        show: true,
                        staffId,
                        selectedLines: []
                    };
                    
                    loadStaffResearchLines(staffId);
                };

                const loadStaffResearchLines = async (staffId) => {
                    try {
                        const lines = await API.getStaffResearchLines(staffId);
                        modals.researchLines.selectedLines = lines.map(line => line.id);
                        
                        if (modals.staff.mode === 'edit') {
                            forms.staff.research_line_ids = lines.map(line => line.id);
                        }
                    } catch (error) {
                        console.error('Failed to load research lines:', error);
                    }
                };

                const openAddClinicalUnitModal = () => {
                    modals.clinicalUnit = {
                        show: true,
                        mode: 'add',
                        data: null
                    };
                    
                    Object.assign(forms.clinicalUnit, {
                        unit_name: '',
                        unit_code: '',
                        department_id: '',
                        maximum_residents: 10,
                        unit_status: 'active',
                        specialty: '',
                        supervising_attending_id: ''
                    });
                };

                const openClinicalUnitStaffModal = (unit) => {
                    modals.clinicalUnitStaff = {
                        show: true,
                        unitId: unit.id,
                        unitName: unit.unit_name,
                        staff: []
                    };
                    
                    loadClinicalUnitStaff(unit.id);
                };

                const loadClinicalUnitStaff = async (unitId) => {
                    try {
                        const staff = await API.getClinicalUnitStaff(unitId);
                        modals.clinicalUnitStaff.staff = staff;
                    } catch (error) {
                        console.error('Failed to load unit staff:', error);
                    }
                };

                const openAddRotationModal = () => {
                    modals.rotation = {
                        show: true,
                        mode: 'add',
                        data: null
                    };
                    
                    Object.assign(forms.rotation, {
                        rotation_id: Utils.generateId('ROT'),
                        resident_id: '',
                        training_unit_id: '',
                        clinical_unit_id: '',
                        rotation_start_date: new Date().toISOString().split('T')[0],
                        rotation_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        rotation_status: 'scheduled',
                        rotation_category: 'clinical_rotation',
                        supervising_attending_id: ''
                    });
                };

                const openAddOnCallModal = () => {
                    modals.oncall = {
                        show: false,
                        mode: 'add',
                        data: null
                    };
                    
                    Object.assign(forms.oncall, {
                        duty_date: new Date().toISOString().split('T')[0],
                        shift_type: 'primary_call',
                        start_time: '08:00',
                        end_time: '17:00',
                        primary_physician_id: '',
                        backup_physician_id: '',
                        coverage_notes: 'emergency',
                        schedule_id: Utils.generateId('SCH')
                    });
                    
                    // Show modal after data is set
                    nextTick(() => {
                        modals.oncall.show = true;
                    });
                };

                // ============ 21. CRUD OPERATIONS ============
                // Staff Operations
                const saveStaff = async () => {
                    isSaving.value = true;
                    try {
                        // Prepare data for backend
                        const staffData = {
                            full_name: forms.staff.full_name,
                            staff_type: forms.staff.staff_type,
                            staff_id: forms.staff.staff_id,
                            employment_status: forms.staff.employment_status,
                            professional_email: forms.staff.professional_email,
                            department_id: forms.staff.department_id || null,
                            academic_degree: forms.staff.academic_degree || null,
                            specialization: forms.staff.specialization || null,
                            training_year: forms.staff.training_year || null,
                            clinical_study_certificate: forms.staff.clinical_study_certificate || null,
                            certificate_status: forms.staff.certificate_status || null,
                            current_clinical_unit_id: forms.staff.clinical_unit_id || null,
                            research_line_ids: forms.staff.research_line_ids || []
                        };

                        let result;
                        if (modals.staff.mode === 'add') {
                            result = await API.createMedicalStaff(staffData);
                            medicalStaff.value.unshift(result);
                            showToast('Success', 'Medical staff added successfully', 'success');
                        } else {
                            result = await API.updateMedicalStaff(modals.staff.data.id, staffData);
                            const index = medicalStaff.value.findIndex(s => s.id === result.id);
                            if (index > -1) medicalStaff.value[index] = result;
                            showToast('Success', 'Medical staff updated successfully', 'success');
                        }
                        
                        modals.staff.show = false;
                        await loadSystemStats();
                        
                    } catch (error) {
                        console.error('Save staff error:', error);
                        showToast('Error', error.message || 'Failed to save staff', 'error');
                    } finally {
                        isSaving.value = false;
                    }
                };

                const deleteStaff = (staff) => {
                    showConfirmation({
                        title: 'Delete Medical Staff',
                        message: `Are you sure you want to delete ${staff.full_name}? This action cannot be undone.`,
                        confirmText: 'Delete',
                        type: 'danger',
                        onConfirm: async () => {
                            try {
                                await API.deleteMedicalStaff(staff.id);
                                const index = medicalStaff.value.findIndex(s => s.id === staff.id);
                                if (index > -1) medicalStaff.value.splice(index, 1);
                                showToast('Success', 'Medical staff deleted', 'success');
                                await loadSystemStats();
                            } catch (error) {
                                showToast('Error', error.message, 'error');
                            }
                        }
                    });
                };

                // Research Lines Operations
                const saveResearchLines = async () => {
                    isSaving.value = true;
                    try {
                        await API.updateStaffResearchLines(
                            modals.researchLines.staffId,
                            modals.researchLines.selectedLines
                        );
                        
                        // Update local staff data
                        const staffIndex = medicalStaff.value.findIndex(s => s.id === modals.researchLines.staffId);
                        if (staffIndex > -1) {
                            medicalStaff.value[staffIndex].research_line_ids = modals.researchLines.selectedLines;
                        }
                        
                        modals.researchLines.show = false;
                        showToast('Success', 'Research lines updated', 'success');
                    } catch (error) {
                        showToast('Error', 'Failed to update research lines', 'error');
                    } finally {
                        isSaving.value = false;
                    }
                };

                // Clinical Unit Operations
                const saveClinicalUnit = async () => {
                    isSaving.value = true;
                    try {
                        const unitData = {
                            unit_name: forms.clinicalUnit.unit_name,
                            unit_code: forms.clinicalUnit.unit_code,
                            department_id: forms.clinicalUnit.department_id,
                            supervising_attending_id: forms.clinicalUnit.supervising_attending_id || null,
                            maximum_residents: forms.clinicalUnit.maximum_residents,
                            unit_status: forms.clinicalUnit.unit_status,
                            specialty: forms.clinicalUnit.specialty || ''
                        };

                        if (modals.clinicalUnit.mode === 'add') {
                            const result = await API.createTrainingUnit(unitData);
                            clinicalUnits.value.unshift(result);
                            showToast('Success', 'Clinical unit created', 'success');
                        } else {
                            const result = await API.updateTrainingUnit(modals.clinicalUnit.data.id, unitData);
                            const index = clinicalUnits.value.findIndex(u => u.id === result.id);
                            if (index > -1) clinicalUnits.value[index] = result;
                            showToast('Success', 'Clinical unit updated', 'success');
                        }
                        
                        modals.clinicalUnit.show = false;
                        await loadClinicalUnits();
                        await loadClinicalUnitsWithStaff();
                        
                    } catch (error) {
                        showToast('Error', error.message, 'error');
                    } finally {
                        isSaving.value = false;
                    }
                };

                const assignStaffToUnit = async (unitId, staffId, assignmentType, startDate, endDate = null) => {
                    try {
                        const assignmentData = {
                            staff_id: staffId,
                            assignment_type: assignmentType,
                            start_date: startDate,
                            end_date: assignmentType === 'resident' ? endDate : null
                        };
                        
                        await API.assignStaffToUnit(unitId, assignmentData);
                        showToast('Success', 'Staff assigned to unit', 'success');
                        await loadClinicalUnitsWithStaff();
                        await loadMedicalStaff();
                    } catch (error) {
                        showToast('Error', error.message, 'error');
                    }
                };

                // Rotation Operations
                const saveRotation = async () => {
                    isSaving.value = true;
                    try {
                        // Map frontend field to backend field
                        const rotationData = {
                            rotation_id: forms.rotation.rotation_id,
                            resident_id: forms.rotation.resident_id,
                            training_unit_id: forms.rotation.clinical_unit_id || forms.rotation.training_unit_id,
                            start_date: forms.rotation.rotation_start_date,
                            end_date: forms.rotation.rotation_end_date,
                            rotation_status: forms.rotation.rotation_status,
                            rotation_category: forms.rotation.rotation_category,
                            supervising_attending_id: forms.rotation.supervising_attending_id || null
                        };

                        if (modals.rotation.mode === 'add') {
                            const result = await API.createRotation(rotationData);
                            rotations.value.unshift(result);
                            showToast('Success', 'Rotation scheduled', 'success');
                        } else {
                            const result = await API.updateRotation(modals.rotation.data.id, rotationData);
                            const index = rotations.value.findIndex(r => r.id === result.id);
                            if (index > -1) rotations.value[index] = result;
                            showToast('Success', 'Rotation updated', 'success');
                        }
                        
                        modals.rotation.show = false;
                        await loadRotations();
                        await loadSystemStats();
                        
                    } catch (error) {
                        showToast('Error', error.message, 'error');
                    } finally {
                        isSaving.value = false;
                    }
                };

                const deleteRotation = (rotation) => {
                    showConfirmation({
                        title: 'Delete Rotation',
                        message: 'Are you sure you want to delete this rotation?',
                        confirmText: 'Delete',
                        type: 'danger',
                        onConfirm: async () => {
                            try {
                                await API.deleteRotation(rotation.id);
                                const index = rotations.value.findIndex(r => r.id === rotation.id);
                                if (index > -1) rotations.value.splice(index, 1);
                                showToast('Success', 'Rotation deleted', 'success');
                                await loadSystemStats();
                            } catch (error) {
                                showToast('Error', error.message, 'error');
                            }
                        }
                    });
                };

                // On-Call Operations
                const saveOnCall = async () => {
                    isSaving.value = true;
                    try {
                        const scheduleData = {
                            duty_date: forms.oncall.duty_date,
                            shift_type: forms.oncall.shift_type,
                            start_time: forms.oncall.start_time,
                            end_time: forms.oncall.end_time,
                            primary_physician_id: forms.oncall.primary_physician_id,
                            backup_physician_id: forms.oncall.backup_physician_id || null,
                            coverage_notes: forms.oncall.coverage_notes,
                            schedule_id: forms.oncall.schedule_id
                        };

                        if (modals.oncall.mode === 'add') {
                            const result = await API.createOnCall(scheduleData);
                            onCallSchedule.value.unshift(result);
                            showToast('Success', 'On-call scheduled', 'success');
                        } else {
                            const result = await API.updateOnCall(modals.oncall.data.id, scheduleData);
                            const index = onCallSchedule.value.findIndex(s => s.id === result.id);
                            if (index > -1) onCallSchedule.value[index] = result;
                            showToast('Success', 'On-call updated', 'success');
                        }
                        
                        modals.oncall.show = false;
                        await loadOnCallSchedule();
                        await loadTodaysOnCall();
                        
                    } catch (error) {
                        showToast('Error', error.message, 'error');
                    } finally {
                        isSaving.value = false;
                    }
                };

                // Live Status Operations
                const saveClinicalStatus = async () => {
                    if (!modals.liveStatus.statusText.trim()) {
                        showToast('Error', 'Please enter status text', 'error');
                        return;
                    }

                    isSaving.value = true;
                    try {
                        const statusData = {
                            status_text: modals.liveStatus.statusText.trim(),
                            author_id: currentUser.value.id,
                            expires_in_hours: modals.liveStatus.expiryHours
                        };

                        const response = await API.createClinicalStatus(statusData);
                        
                        if (response && response.success) {
                            clinicalStatus.value = response.data;
                            modals.liveStatus.show = false;
                            modals.liveStatus.statusText = '';
                            modals.liveStatus.expiryHours = 8;
                            showToast('Success', 'Live status updated', 'success');
                        } else {
                            throw new Error('Failed to save status');
                        }
                    } catch (error) {
                        showToast('Error', error.message || 'Failed to update status', 'error');
                    } finally {
                        isSaving.value = false;
                    }
                };

                const deleteClinicalStatus = () => {
                    if (!clinicalStatus.value) return;
                    
                    showConfirmation({
                        title: 'Clear Live Status',
                        message: 'Are you sure you want to clear the current live status?',
                        confirmText: 'Clear',
                        type: 'warning',
                        onConfirm: async () => {
                            try {
                                await API.deleteClinicalStatus(clinicalStatus.value.id);
                                clinicalStatus.value = null;
                                showToast('Success', 'Live status cleared', 'success');
                            } catch (error) {
                                showToast('Error', error.message, 'error');
                            }
                        }
                    });
                };

                // ============ 22. COMPUTED PROPERTIES ============
                // Filtered Data
                const filteredMedicalStaff = computed(() => {
                    let filtered = medicalStaff.value;
                    const f = filters.staff;
                    
                    if (f.search) {
                        const search = f.search.toLowerCase();
                        filtered = filtered.filter(s =>
                            s.full_name?.toLowerCase().includes(search) ||
                            s.staff_id?.toLowerCase().includes(search) ||
                            s.professional_email?.toLowerCase().includes(search)
                        );
                    }
                    if (f.staffType) filtered = filtered.filter(s => s.staff_type === f.staffType);
                    if (f.department) filtered = filtered.filter(s => s.department_id === f.department);
                    if (f.clinicalUnit) filtered = filtered.filter(s => s.clinical_unit_id === f.clinicalUnit);
                    if (f.status) filtered = filtered.filter(s => s.employment_status === f.status);
                    
                    return filtered;
                });

                const filteredRotations = computed(() => {
                    let filtered = rotations.value;
                    const f = filters.rotations;
                    
                    if (f.status) filtered = filtered.filter(r => r.rotation_status === f.status);
                    if (f.clinicalUnit) filtered = filtered.filter(r => r.training_unit_id === f.clinicalUnit);
                    if (f.resident) filtered = filtered.filter(r => r.resident_id === f.resident);
                    if (f.supervisor) filtered = filtered.filter(r => r.supervising_attending_id === f.supervisor);
                    
                    return filtered;
                });

                const filteredOnCall = computed(() => {
                    let filtered = onCallSchedule.value;
                    const f = filters.oncall;
                    
                    if (f.date) filtered = filtered.filter(s => s.duty_date === f.date);
                    if (f.shiftType) filtered = filtered.filter(s => s.shift_type === f.shiftType);
                    if (f.physician) {
                        filtered = filtered.filter(s =>
                            s.primary_physician_id === f.physician ||
                            s.backup_physician_id === f.physician
                        );
                    }
                    
                    return filtered;
                });

                const filteredAbsences = computed(() => {
                    let filtered = absences.value;
                    const f = filters.absences;
                    
                    if (f.staff) filtered = filtered.filter(a => a.staff_member_id === f.staff);
                    if (f.status) filtered = filtered.filter(a => a.current_status === f.status);
                    if (f.reason) filtered = filtered.filter(a => a.absence_reason === f.reason);
                    if (f.startDate) filtered = filtered.filter(a => a.start_date >= f.startDate);
                    
                    return filtered;
                });

                // Staff Lists
                const activeResidents = computed(() => {
                    return medicalStaff.value.filter(s =>
                        s.staff_type === 'medical_resident' &&
                        s.employment_status === 'active'
                    );
                });

                const activeAttendings = computed(() => {
                    return medicalStaff.value.filter(s =>
                        s.staff_type === 'attending_physician' &&
                        s.employment_status === 'active'
                    );
                });

                const clinicalUnitsWithCapacity = computed(() => {
                    return clinicalUnits.value.map(unit => {
                        const currentResidents = medicalStaff.value.filter(s =>
                            s.clinical_unit_id === unit.id &&
                            s.staff_type === 'medical_resident'
                        ).length;
                        
                        const currentAttendings = medicalStaff.value.filter(s =>
                            s.clinical_unit_id === unit.id &&
                            s.staff_type === 'attending_physician'
                        ).length;
                        
                        const capacityPercent = Math.round((currentResidents / unit.maximum_residents) * 100);
                        let capacityStatus = 'good';
                        if (capacityPercent >= 90) capacityStatus = 'full';
                        else if (capacityPercent >= 75) capacityStatus = 'warning';
                        
                        return {
                            ...unit,
                            current_residents: currentResidents,
                            current_attendings: currentAttendings,
                            capacity_percent: capacityPercent,
                            capacity_status: capacityStatus,
                            has_capacity: currentResidents < unit.maximum_residents
                        };
                    });
                });

                const unreadAnnouncements = computed(() => {
                    return announcements.value.filter(a => !a.read_by?.includes(currentUser.value?.id)).length;
                });

                const recentAnnouncements = computed(() => {
                    return announcements.value
                        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                        .slice(0, 5);
                });

                const isStatusExpired = computed(() => {
                    if (!clinicalStatus.value || !clinicalStatus.value.expires_at) return true;
                    const expires = new Date(clinicalStatus.value.expires_at);
                    return new Date() > expires;
                });

                const statusTimeRemaining = computed(() => {
                    if (!clinicalStatus.value || !clinicalStatus.value.expires_at) return '';
                    
                    const expires = new Date(clinicalStatus.value.expires_at);
                    const now = new Date();
                    const diffMs = expires - now;
                    
                    if (diffMs <= 0) return 'Expired';
                    
                    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                    
                    if (diffHours > 0) return `${diffHours}h ${diffMinutes}m`;
                    return `${diffMinutes}m`;
                });

                // ============ 23. LIFECYCLE ============
                onMounted(() => {
                    console.log('🚀 NeumoCare v8.0 Complete mounted');
                    
                    // Check existing session
                    const token = localStorage.getItem(CONFIG.TOKEN_KEY);
                    const user = localStorage.getItem(CONFIG.USER_KEY);
                    
                    if (token && user) {
                        try {
                            currentUser.value = JSON.parse(user);
                            loadAllData();
                            currentView.value = 'dashboard';
                        } catch {
                            currentView.value = 'login';
                        }
                    }
                    
                    // Update current time every minute
                    setInterval(() => {
                        currentTime.value = new Date();
                    }, 60000);
                    
                    // Auto-refresh clinical status every 5 minutes
                    setInterval(() => {
                        if (currentUser.value) {
                            loadClinicalStatus();
                        }
                    }, 300000);
                    
                    // Handle ESC key to close modals
                    document.addEventListener('keydown', (e) => {
                        if (e.key === 'Escape') {
                            Object.keys(modals).forEach(key => {
                                if (modals[key].show && key !== 'confirmation') {
                                    modals[key].show = false;
                                }
                            });
                        }
                    });
                });

                // Watch for changes to update stats
                watch([medicalStaff, rotations, absences], () => {
                    loadSystemStats();
                });

                // ============ 24. RETURN ============
                return {
                    // State
                    currentUser,
                    currentView,
                    isLoading,
                    isSaving,
                    currentTime,
                    
                    // Data
                    medicalStaff,
                    researchLines,
                    clinicalUnits,
                    clinicalUnitsWithStaff,
                    rotations,
                    onCallSchedule,
                    todaysOnCall,
                    absences,
                    announcements,
                    departments,
                    systemStats,
                    clinicalStatus,
                    
                    // UI
                    sidebarCollapsed,
                    mobileMenuOpen,
                    userMenuOpen,
                    toasts,
                    activeAlerts,
                    globalSearchQuery,
                    
                    // Filters
                    filters,
                    
                    // Modals
                    modals,
                    
                    // Forms
                    forms,
                    
                    // Config
                    CONFIG,
                    
                    // Functions
                    handleLogin,
                    handleLogout,
                    switchView,
                    getViewTitle,
                    getViewSubtitle,
                    showToast,
                    showConfirmation,
                    confirmAction,
                    cancelConfirmation,
                    hasPermission,
                    
                    // Formatting
                    Utils,
                    formatStaffType,
                    formatAbsenceReason,
                    formatRotationStatus,
                    getDepartmentName,
                    getClinicalUnitName,
                    getStaffName,
                    getStaffEmail,
                    
                    // Modal Openers
                    openAddStaffModal,
                    openEditStaffModal,
                    openResearchLinesModal,
                    openAddClinicalUnitModal,
                    openClinicalUnitStaffModal,
                    openAddRotationModal,
                    openAddOnCallModal,
                    
                    // CRUD Operations
                    saveStaff,
                    deleteStaff,
                    saveResearchLines,
                    saveClinicalUnit,
                    assignStaffToUnit,
                    saveRotation,
                    deleteRotation,
                    saveOnCall,
                    saveClinicalStatus,
                    deleteClinicalStatus,
                    
                    // Computed
                    filteredMedicalStaff,
                    filteredRotations,
                    filteredOnCall,
                    filteredAbsences,
                    activeResidents,
                    activeAttendings,
                    clinicalUnitsWithCapacity,
                    unreadAnnouncements,
                    recentAnnouncements,
                    isStatusExpired,
                    statusTimeRemaining
                };
            }
        });

        // ============ 25. MOUNT APP ============
        app.mount('#app');
        
        console.log('✅ NeumoCare v8.0 Complete mounted successfully!');
        console.log('📋 Features implemented:');
        console.log('   • Complete medical staff management');
        console.log('   • Research lines integration');
        console.log('   • Clinical units with staff assignments');
        console.log('   • Enhanced rotation management');
        console.log('   • Live status with configurable expiry');
        console.log('   • Permission-based access control');
        console.log('   • Real-time dashboard updates');

    } catch (error) {
        console.error('💥 Fatal error:', error);
        showCriticalError('Application failed to load');
    }

    // ============ HELPER FUNCTIONS ============
    function showCriticalError(message) {
        document.body.innerHTML = `
            <div style="padding: 40px; text-align: center; margin-top: 100px; font-family: Arial, sans-serif;">
                <h2 style="color: #dc3545;">⚠️ Critical Error</h2>
                <p style="margin: 20px 0; color: #666;">${message}</p>
                <button onclick="window.location.reload()" 
                        style="padding: 12px 24px; background: #007bff; color: white; border: none; border-radius: 6px; cursor: pointer; margin-top: 20px;">
                    🔄 Refresh Page
                </button>
            </div>
        `;
    }
});
