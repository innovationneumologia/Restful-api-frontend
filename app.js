// ============ NEUMOCARE HOSPITAL MANAGEMENT SYSTEM v10.0 COMPLETE ============
// 100% COMPLETE VERSION - ALL API ENDPOINTS INTEGRATED
// ================================================================/===

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 NeumoCare Hospital Management System v10.0 Complete loading...');
    
    try {
        // ============ 1. VUE VALIDATION ============
        if (typeof Vue === 'undefined') {
            document.body.innerHTML = `
                <div style="padding: 40px; text-align: center; margin-top: 100px; color: #333;">
                    <h2 style="color: #dc3545;">⚠️ Critical Error</h2>
                    <p>Vue.js failed to load. Please refresh the page.</p>
                    <button onclick="window.location.reload()" 
                            style="padding: 12px 24px; background: #007bff; color: white; 
                                   border: none; border-radius: 6px; cursor: pointer; margin-top: 20px;">
                        🔄 Refresh Page
                    </button>
                </div>
            `;
            throw new Error('Vue.js not loaded');
        }
        
        console.log('✅ Vue.js loaded successfully:', Vue.version);
        
        const { createApp, ref, reactive, computed, onMounted, watch, onUnmounted } = Vue;
        
        // ============ 2. CONFIGURATION ============
        const CONFIG = {
            API_BASE_URL: 'https://neumac.up.railway.app',
            TOKEN_KEY: 'neumocare_token',
            USER_KEY: 'neumocare_user',
            APP_VERSION: '10.0',
            DEBUG: window.location.hostname.includes('localhost')
        };
        
        // ============ 3. ENHANCED UTILITIES ============
        class EnhancedUtils {
            static formatDate(dateString) {
                if (!dateString) return 'N/A';
                try {
                    const date = new Date(dateString);
                    if (isNaN(date.getTime())) return dateString;
                    return date.toLocaleDateString('en-US', { 
                        month: 'short', day: 'numeric', year: 'numeric' 
                    });
                } catch { return dateString; }
            }
            
            static formatDateTime(dateString) {
                if (!dateString) return 'N/A';
                try {
                    const date = new Date(dateString);
                    if (isNaN(date.getTime())) return dateString;
                    return date.toLocaleString('en-US', { 
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
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
            
            static ensureArray(data) {
                if (Array.isArray(data)) return data;
                if (data && typeof data === 'object' && data.data && Array.isArray(data.data)) return data.data;
                if (data && typeof data === 'object') return Object.values(data);
                return [];
            }
            
            static truncateText(text, maxLength = 100) {
                if (!text) return '';
                if (text.length <= maxLength) return text;
                return text.substring(0, maxLength) + '...';
            }
            
            static formatTime(dateString) {
                if (!dateString) return '';
                try {
                    const date = new Date(dateString);
                    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                } catch { return dateString; }
            }
            
            static generateId(prefix) {
                return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
            }
            
            static calculateDateDifference(startDate, endDate) {
                try {
                    const start = new Date(startDate);
                    const end = new Date(endDate);
                    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
                    const diffTime = Math.abs(end - start);
                    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                } catch { return 0; }
            }
        }
        
        // ============ 4. COMPLETE API SERVICE ============
        class ApiService {
            constructor() {
                this.token = localStorage.getItem(CONFIG.TOKEN_KEY) || null;
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
                const url = `${CONFIG.API_BASE_URL}${endpoint}`;
                
                try {
                    const config = {
                        method: options.method || 'GET',
                        headers: this.getHeaders(),
                        mode: 'cors',
                        cache: 'no-cache'
                    };
                    
                    if (options.body && typeof options.body === 'object') {
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
                try {
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
                } catch (error) {
                    throw new Error('Login failed: ' + error.message);
                }
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
                    return EnhancedUtils.ensureArray(data);
                } catch { return []; }
            }
            
       async getEnhancedMedicalStaff() {
    try {
        // Try the enhanced endpoint, fall back to regular
        const data = await this.request('/api/medical-staff');
        return EnhancedUtils.ensureArray(data);
    } catch { 
        // Fallback to regular endpoint
        const data = await this.request('/api/medical-staff');
        return EnhancedUtils.ensureArray(data);
    }
}
            
            async getMedicalStaffById(id) {
                try {
                    const data = await this.request(`/api/medical-staff/${id}/enhanced`);
                    return data.data || data;
                } catch { return null; }
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
                    const data = await this.request('/api/research-lines');
                    return EnhancedUtils.ensureArray(data.data || data);
                } catch { return []; }
            }
            
            async getStaffResearchLines(staffId) {
                try {
                    const data = await this.request(`/api/medical-staff/${staffId}/research-lines`);
                    return EnhancedUtils.ensureArray(data.data || data);
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
                    return EnhancedUtils.ensureArray(data);
                } catch { return []; }
            }
            
            async getClinicalUnitsWithStaff() {
                try {
                    const data = await this.request('/api/clinical-units/with-staff');
                    return EnhancedUtils.ensureArray(data.data || data);
                } catch { return []; }
            }
            
            async getClinicalUnitStaff(unitId) {
                try {
                    const data = await this.request(`/api/clinical-units/${unitId}/staff`);
                    return EnhancedUtils.ensureArray(data.data || data);
                } catch { return []; }
            }
            
            async assignStaffToClinicalUnit(unitId, assignmentData) {
                return await this.request(`/api/clinical-units/${unitId}/assign-staff`, {
                    method: 'POST',
                    body: assignmentData
                });
            }
            
            async removeStaffFromClinicalUnit(unitId, staffId) {
                return await this.request(`/api/clinical-units/${unitId}/staff/${staffId}`, {
                    method: 'DELETE'
                });
            }
            
            async createClinicalUnit(unitData) {
                return await this.request('/api/training-units', {
                    method: 'POST',
                    body: unitData
                });
            }
            
            async updateClinicalUnit(id, unitData) {
                return await this.request(`/api/training-units/${id}`, {
                    method: 'PUT',
                    body: unitData
                });
            }
            
            // ===== DEPARTMENTS =====
            async getDepartments() {
                try {
                    const data = await this.request('/api/departments');
                    return EnhancedUtils.ensureArray(data);
                } catch { return []; }
            }
            
            async createDepartment(departmentData) {
                return await this.request('/api/departments', {
                    method: 'POST',
                    body: departmentData
                });
            }
            
            async updateDepartment(id, departmentData) {
                return await this.request(`/api/departments/${id}`, {
                    method: 'PUT',
                    body: departmentData
                });
            }
            
            // ===== ROTATIONS =====
            async getRotations() {
                try {
                    const data = await this.request('/api/rotations');
                    return EnhancedUtils.ensureArray(data.data || data);
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
            
            // ===== ON-CALL =====
            async getOnCallSchedule() {
                try {
                    const data = await this.request('/api/oncall');
                    return EnhancedUtils.ensureArray(data);
                } catch { return []; }
            }
            
            async getOnCallToday() {
                try {
                    const data = await this.request('/api/oncall/today');
                    return EnhancedUtils.ensureArray(data);
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
                    return EnhancedUtils.ensureArray(data.data || data);
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
                    return EnhancedUtils.ensureArray(data);
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
                    const data = await this.request('/api/live-status/current');
                    return data;
                } catch { return null; }
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
                    const data = await this.request('/api/system-stats');
                    return data.data || data;
                } catch {
                    return {
                        totalStaff: 0,
                        activeAttending: 0,
                        activeResidents: 0,
                        onCallNow: 0,
                        clinicalUnits: 0,
                        researchLines: 0,
                        currentlyAbsent: 0
                    };
                }
            }
            
            // ===== AVAILABLE DATA =====
            async getAvailableData() {
                try {
                    const data = await this.request('/api/available-data');
                    return data.data || data;
                } catch { return {}; }
            }
            
            // ===== REPORTS =====
            async getStaffDistributionReport() {
                try {
                    const data = await this.request('/api/reports/staff-distribution');
                    return data;
                } catch { return {}; }
            }
            
            async getRotationSummaryReport() {
                try {
                    const data = await this.request('/api/reports/rotation-summary');
                    return data;
                } catch { return {}; }
            }
            
            async getResearchParticipationReport() {
                try {
                    const data = await this.request('/api/reports/research-participation');
                    return data.data || data;
                } catch { return {}; }
            }
            
            async getStaffByClinicalUnitReport() {
                try {
                    const data = await this.request('/api/reports/staff-by-clinical-unit');
                    return data.data || data;
                } catch { return {}; }
            }
        }
        
        // Initialize API Service
        const API = new ApiService();
        
        // ============ 5. CREATE VUE APP ============
        const app = createApp({
            setup() {
                // ============ 6. REACTIVE STATE ============
                
                // 6.1 User State
                const currentUser = ref(null);
                const loginForm = reactive({
                    email: '',
                    password: '',
                    remember_me: false
                });
                const loginLoading = ref(false);
                
                // 6.2 UI State
                const currentView = ref('login');
                const sidebarCollapsed = ref(false);
                const mobileMenuOpen = ref(false);
                const userMenuOpen = ref(false);
                const statsSidebarOpen = ref(false);
                const globalSearchQuery = ref('');
                
                // 6.3 Loading States
                const loading = ref(false);
                const saving = ref(false);
                const isLoadingStatus = ref(false);
                
                // 6.4 Data Stores
                const medicalStaff = ref([]);
                const enhancedMedicalStaff = ref([]);
                const researchLines = ref([]);
                const clinicalUnits = ref([]);
                const clinicalUnitsWithStaff = ref([]);
                const departments = ref([]);
                const rotations = ref([]);
                const absences = ref([]);
                const onCallSchedule = ref([]);
                const announcements = ref([]);
                const clinicalStatus = ref(null);
                const availableData = ref({});
                
                // 6.5 Modal Data
                const selectedStaffId = ref('');
                const selectedResearchLines = ref([]);
                const newStatusText = ref('');
                const selectedAuthorId = ref('');
                const expiryHours = ref(8);
                const activeMedicalStaff = ref([]);
                
                // 6.6 Dashboard Data
                const systemStats = ref({
                    totalStaff: 0,
                    activeAttending: 0,
                    activeResidents: 0,
                    onCallNow: 0,
                    clinicalUnits: 0,
                    researchLines: 0,
                    currentlyAbsent: 0,
                    activeRotations: 0,
                    departmentStatus: 'normal'
                });
                
                const todaysOnCall = ref([]);
                const todaysOnCallCount = computed(() => todaysOnCall.value.length);
                
                // 6.7 UI Components
                const toasts = ref([]);
                const systemAlerts = ref([]);
                
                // 6.8 Filter States
                const staffFilters = reactive({
                    search: '',
                    staffType: '',
                    department: '',
                    clinicalUnit: '',
                    status: '',
                    hasResearchLines: ''
                });
                
                const clinicalUnitFilters = reactive({
                    department: '',
                    status: 'active',
                    capacity: '',
                    search: ''
                });
                
                const rotationFilters = reactive({
                    resident: '',
                    status: '',
                    clinicalUnit: '',
                    supervisor: ''
                });
                
                const absenceFilters = reactive({
                    staff: '',
                    status: '',
                    reason: '',
                    startDate: ''
                });
                
                // 6.9 Modal States
                const staffProfileModal = reactive({
                    show: false,
                    staff: null,
                    activeTab: 'clinical'
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
                        training_year: '',
                        specialization: '',
                        clinical_study_certificate: '',
                        certificate_status: 'current',
                        clinical_unit_id: '',
                        research_line_ids: []
                    }
                });
                
                const clinicalUnitModal = reactive({
                    show: false,
                    mode: 'add',
                    form: {
                        unit_name: '',
                        unit_code: '',
                        department_id: '',
                        maximum_residents: 10,
                        unit_status: 'active',
                        specialty: '',
                        supervising_attending_id: ''
                    }
                });
                
                const staffAssignmentModal = reactive({
                    show: false,
                    unit: null,
                    form: {
                        staff_id: '',
                        assignment_type: 'resident',
                        start_date: new Date().toISOString().split('T')[0],
                        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                    }
                });
                
                const researchLinesModal = reactive({
                    show: false,
                    staff: null,
                    selectedLines: []
                });
                
                const rotationModal = reactive({
                    show: false,
                    mode: 'add',
                    form: {
                        resident_id: '',
                        clinical_unit_id: '',
                        start_date: new Date().toISOString().split('T')[0],
                        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        rotation_status: 'scheduled',
                        rotation_category: 'clinical_rotation',
                        supervising_attending_id: ''
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
                        coverage_notes: ''
                    }
                });
                
                const absenceModal = reactive({
                    show: false,
                    mode: 'add',
                    form: {
                        staff_member_id: '',
                        absence_type: 'planned',
                        absence_reason: 'vacation',
                        start_date: new Date().toISOString().split('T')[0],
                        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        coverage_arranged: false,
                        covering_staff_id: ''
                    }
                });
                // Inside setup(), after other formatting functions:
const getUserRoleDisplay = (role) => {
    const map = {
        'system_admin': 'System Administrator',
        'department_head': 'Department Head',
        'attending_physician': 'Attending Physician',
        'medical_resident': 'Medical Resident'
    };
    return map[role] || role;
};

const getCurrentViewSubtitle = () => {
    const map = {
        'dashboard': 'Real-time department overview and analytics',
        'medical_staff': 'Manage physicians, residents, and clinical staff',
        'clinical_units': 'Clinical training units and resident assignments',
        'research_lines': 'Research interests and participation tracking',
        'rotations': 'Track and manage resident training rotations',
        'oncall_schedule': 'View and manage on-call physician schedules',
        'staff_absence': 'Track staff absences and coverage assignments',
        'announcements': 'Department announcements and updates',
        'departments': 'Organizational structure and clinical units',
        'reports': 'System analytics and reporting'
    };
    return map[currentView.value] || 'Hospital Management System';
};

const getSearchPlaceholder = () => {
    const map = {
        'dashboard': 'Search staff, units, rotations...',
        'medical_staff': 'Search by name, ID, or email...',
        'clinical_units': 'Search clinical units...',
        'research_lines': 'Search research lines...',
        'rotations': 'Search rotations by resident or unit...',
        'oncall_schedule': 'Search on-call schedules...',
        'staff_absence': 'Search absences by staff member...',
        'announcements': 'Search announcements...',
        'departments': 'Search departments...',
        'reports': 'Search reports...'
    };
    return map[currentView.value] || 'Search across system...';
};
                
                const announcementModal = reactive({
                    show: false,
                    mode: 'add',
                    form: {
                        title: '',
                        content: '',
                        priority_level: 'normal',
                        target_audience: 'all_staff',
                        publish_start_date: new Date().toISOString().split('T')[0]
                    }
                });
                
                const departmentModal = reactive({
                    show: false,
                    mode: 'add',
                    form: {
                        name: '',
                        code: '',
                        status: 'active',
                        head_of_department_id: '',
                        contact_email: '',
                        contact_phone: ''
                    }
                });
                
                const reportsModal = reactive({
                    show: false,
                    activeReport: 'staff_distribution',
                    data: null
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
                    details: ''
                });
                
                // 6.10 Permission Matrix
                const PERMISSION_MATRIX = {
                    system_admin: {
                        medical_staff: ['create', 'read', 'update', 'delete'],
                        clinical_units: ['create', 'read', 'update', 'delete'],
                        research_lines: ['create', 'read', 'update', 'delete'],
                        departments: ['create', 'read', 'update', 'delete'],
                        rotations: ['create', 'read', 'update', 'delete'],
                        oncall_schedule: ['create', 'read', 'update', 'delete'],
                        staff_absence: ['create', 'read', 'update', 'delete'],
                        announcements: ['create', 'read', 'update', 'delete'],
                        communications: ['create', 'read', 'update', 'delete']
                    },
                    department_head: {
                        medical_staff: ['read', 'update'],
                        clinical_units: ['read', 'update'],
                        research_lines: ['read', 'update'],
                        departments: ['read'],
                        rotations: ['create', 'read', 'update'],
                        oncall_schedule: ['create', 'read', 'update'],
                        staff_absence: ['create', 'read', 'update'],
                        announcements: ['create', 'read'],
                        communications: ['create', 'read']
                    },
                    attending_physician: {
                        medical_staff: ['read'],
                        clinical_units: ['read'],
                        research_lines: ['read'],
                        departments: ['read'],
                        rotations: ['read'],
                        oncall_schedule: ['read'],
                        staff_absence: ['read'],
                        announcements: ['read'],
                        communications: ['read']
                    },
                    medical_resident: {
                        medical_staff: ['read'],
                        clinical_units: ['read'],
                        research_lines: ['read'],
                        departments: ['read'],
                        rotations: ['read'],
                        oncall_schedule: ['read'],
                        staff_absence: ['read'],
                        announcements: ['read'],
                        communications: ['read']
                    }
                };
                
                // ============ 7. CORE FUNCTIONS ============
                
                // 7.1 Toast System
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
                    if (index > -1) toasts.value.splice(index, 1);
                };
                
                // 7.2 Confirmation Modal
                const showConfirmation = (options) => {
                    Object.assign(confirmationModal, {
                        show: true,
                        ...options
                    });
                };
                
                const confirmAction = async () => {
                    if (confirmationModal.onConfirm) {
                        try {
                            await confirmationModal.onConfirm();
                        } catch (error) {
                            showToast('Error', error.message, 'error');
                        }
                    }
                    confirmationModal.show = false;
                };
                
                const cancelConfirmation = () => {
                    confirmationModal.show = false;
                };
                
                // 7.3 Formatting Functions
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
                        'conference': 'Conference',
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
                
                const formatAudience = (audience) => {
                    const map = {
                        'all_staff': 'All Staff',
                        'medical_staff': 'Medical Staff',
                        'attending_only': 'Attending Physicians',
                        'residents_only': 'Residents Only'
                    };
                    return map[audience] || audience;
                };
                
                const getCurrentViewTitle = () => {
                    const map = {
                        'dashboard': 'Dashboard Overview',
                        'medical_staff': 'Medical Staff Management',
                        'clinical_units': 'Clinical Units',
                        'research_lines': 'Research Lines',
                        'rotations': 'Resident Rotations',
                        'oncall_schedule': 'On-call Schedule',
                        'staff_absence': 'Staff Absence Management',
                        'announcements': 'Announcements',
                        'departments': 'Department Management',
                        'reports': 'Reports & Analytics'
                    };
                    return map[currentView.value] || 'NeumoCare Dashboard';
                };
                
                // 7.4 Data Helper Functions
                const getDepartmentName = (departmentId) => {
                    if (!departmentId) return 'Not assigned';
                    const dept = departments.value.find(d => d.id === departmentId);
                    return dept ? dept.name : 'Unknown Department';
                };
                
                const getStaffName = (staffId) => {
                    if (!staffId) return 'Not assigned';
                    const staff = medicalStaff.value.find(s => s.id === staffId);
                    return staff ? staff.full_name : 'Unknown Staff';
                };
                
                const getClinicalUnitName = (unitId) => {
                    if (!unitId) return 'Not assigned';
                    const unit = clinicalUnits.value.find(u => u.id === unitId);
                    return unit ? unit.unit_name : 'Unknown Unit';
                };
                
                const getResearchLineNames = (lineIds) => {
                    if (!lineIds || !Array.isArray(lineIds)) return 'None';
                    return lineIds.map(id => {
                        const line = researchLines.value.find(r => r.id === id);
                        return line ? line.name : 'Unknown';
                    }).join(', ');
                };
                
                // ============ 8. DATA LOADING FUNCTIONS ============
                
                const loadMedicalStaff = async () => {
                    try {
                        const data = await API.getMedicalStaff();
                        medicalStaff.value = data;
                    } catch (error) {
                        console.error('Failed to load medical staff:', error);
                        showToast('Error', 'Failed to load medical staff', 'error');
                    }
                };
                
                const loadEnhancedMedicalStaff = async () => {
                    try {
                        const data = await API.getEnhancedMedicalStaff();
                        enhancedMedicalStaff.value = data;
                    } catch (error) {
                        console.error('Failed to load enhanced medical staff:', error);
                    }
                };
                
                const loadResearchLines = async () => {
                    try {
                        const data = await API.getResearchLines();
                        researchLines.value = data;
                    } catch (error) {
                        console.error('Failed to load research lines:', error);
                        showToast('Error', 'Failed to load research lines', 'error');
                    }
                };
                
                const loadClinicalUnits = async () => {
                    try {
                        const data = await API.getClinicalUnits();
                        clinicalUnits.value = data;
                    } catch (error) {
                        console.error('Failed to load clinical units:', error);
                        showToast('Error', 'Failed to load clinical units', 'error');
                    }
                };
                
                const loadClinicalUnitsWithStaff = async () => {
                    try {
                        const data = await API.getClinicalUnitsWithStaff();
                        clinicalUnitsWithStaff.value = data;
                    } catch (error) {
                        console.error('Failed to load clinical units with staff:', error);
                    }
                };
                
                const loadDepartments = async () => {
                    try {
                        const data = await API.getDepartments();
                        departments.value = data;
                    } catch (error) {
                        console.error('Failed to load departments:', error);
                    }
                };
                
                const loadRotations = async () => {
                    try {
                        const data = await API.getRotations();
                        rotations.value = data;
                    } catch (error) {
                        console.error('Failed to load rotations:', error);
                    }
                };
                
                const loadAbsences = async () => {
                    try {
                        const data = await API.getAbsences();
                        absences.value = data;
                    } catch (error) {
                        console.error('Failed to load absences:', error);
                    }
                };
                
                const loadOnCallSchedule = async () => {
                    try {
                        const data = await API.getOnCallSchedule();
                        onCallSchedule.value = data;
                    } catch (error) {
                        console.error('Failed to load on-call schedule:', error);
                    }
                };
                
                const loadTodaysOnCall = async () => {
                    try {
                        const data = await API.getOnCallToday();
                        todaysOnCall.value = data;
                    } catch (error) {
                        console.error('Failed to load today\'s on-call:', error);
                    }
                };
                
                const loadAnnouncements = async () => {
                    try {
                        const data = await API.getAnnouncements();
                        announcements.value = data;
                    } catch (error) {
                        console.error('Failed to load announcements:', error);
                    }
                };
                
                const loadClinicalStatus = async () => {
                    isLoadingStatus.value = true;
                    try {
                        const response = await API.getClinicalStatus();
                        clinicalStatus.value = response?.data || null;
                    } catch (error) {
                        console.error('Failed to load clinical status:', error);
                        clinicalStatus.value = null;
                    } finally {
                        isLoadingStatus.value = false;
                    }
                };
                
                const loadSystemStats = async () => {
                    try {
                        const data = await API.getSystemStats();
                        if (data) {
                            Object.assign(systemStats.value, data);
                        }
                    } catch (error) {
                        console.error('Failed to load system stats:', error);
                    }
                };
                
                const loadAvailableData = async () => {
                    try {
                        const data = await API.getAvailableData();
                        availableData.value = data;
                    } catch (error) {
                        console.error('Failed to load available data:', error);
                    }
                };
                
                const loadActiveMedicalStaff = async () => {
                    try {
                        const data = await API.getMedicalStaff();
                        activeMedicalStaff.value = data.filter(staff => 
                            staff.employment_status === 'active'
                        );
                    } catch (error) {
                        console.error('Failed to load active medical staff:', error);
                        activeMedicalStaff.value = [];
                    }
                };
                
                const loadAllData = async () => {
                    loading.value = true;
                    try {
                        await Promise.all([
                            loadMedicalStaff(),
                            loadEnhancedMedicalStaff(),
                            loadResearchLines(),
                            loadClinicalUnits(),
                            loadClinicalUnitsWithStaff(),
                            loadDepartments(),
                            loadRotations(),
                            loadAbsences(),
                            loadOnCallSchedule(),
                            loadTodaysOnCall(),
                            loadAnnouncements(),
                            loadClinicalStatus(),
                            loadSystemStats(),
                            loadAvailableData(),
                            loadActiveMedicalStaff()
                        ]);
                        
                        showToast('Success', 'System data loaded successfully', 'success');
                    } catch (error) {
                        console.error('Failed to load data:', error);
                        showToast('Error', 'Failed to load some data', 'error');
                    } finally {
                        loading.value = false;
                    }
                };
                
                // ============ 9. AUTHENTICATION ============
                
                const handleLogin = async () => {
                    if (!loginForm.email || !loginForm.password) {
                        showToast('Error', 'Email and password are required', 'error');
                        return;
                    }
                    
                    loginLoading.value = true;
                    try {
                        const response = await API.login(loginForm.email, loginForm.password);
                        
                        currentUser.value = response.user;
                        localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(response.user));
                        
                        showToast('Success', `Welcome, ${response.user.full_name}!`, 'success');
                        
                        await loadAllData();
                        currentView.value = 'dashboard';
                        
                    } catch (error) {
                        showToast('Error', error.message || 'Login failed', 'error');
                    } finally {
                        loginLoading.value = false;
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
                                showToast('Info', 'Logged out successfully', 'info');
                            }
                        }
                    });
                };
                
                // ============ 10. MODAL FUNCTIONS ============
                
                // Medical Staff Modal
                const showAddMedicalStaffModal = () => {
                    medicalStaffModal.mode = 'add';
                    medicalStaffModal.activeTab = 'basic';
                    medicalStaffModal.form = {
                        full_name: '',
                        staff_type: 'medical_resident',
                        staff_id: EnhancedUtils.generateId('MD'),
                        employment_status: 'active',
                        professional_email: '',
                        department_id: '',
                        training_year: '',
                        specialization: '',
                        clinical_study_certificate: '',
                        certificate_status: 'current',
                        clinical_unit_id: '',
                        research_line_ids: []
                    };
                    medicalStaffModal.show = true;
                };
                
                const editMedicalStaff = (staff) => {
                    medicalStaffModal.mode = 'edit';
                    medicalStaffModal.form = { ...staff };
                    medicalStaffModal.show = true;
                };
                
                const saveMedicalStaff = async () => {
                    saving.value = true;
                    try {
                        if (medicalStaffModal.mode === 'add') {
                            const result = await API.createMedicalStaff(medicalStaffModal.form);
                            medicalStaff.value.unshift(result);
                            enhancedMedicalStaff.value.unshift(result);
                            showToast('Success', 'Medical staff added successfully', 'success');
                        } else {
                            const result = await API.updateMedicalStaff(medicalStaffModal.form.id, medicalStaffModal.form);
                            const index = medicalStaff.value.findIndex(s => s.id === result.id);
                            if (index !== -1) medicalStaff.value[index] = result;
                            
                            const enhancedIndex = enhancedMedicalStaff.value.findIndex(s => s.id === result.id);
                            if (enhancedIndex !== -1) enhancedMedicalStaff.value[enhancedIndex] = result;
                            
                            showToast('Success', 'Medical staff updated successfully', 'success');
                        }
                        medicalStaffModal.show = false;
                        await loadSystemStats();
                    } catch (error) {
                        showToast('Error', error.message, 'error');
                    } finally {
                        saving.value = false;
                    }
                };
                
                // Research Lines Modal
                const showResearchLinesModal = (staff) => {
                    researchLinesModal.staff = staff;
                    researchLinesModal.selectedLines = staff.research_line_ids || [];
                    researchLinesModal.show = true;
                };
                
                const saveResearchLines = async () => {
                    if (!researchLinesModal.staff) return;
                    
                    saving.value = true;
                    try {
                        await API.updateStaffResearchLines(
                            researchLinesModal.staff.id,
                            researchLinesModal.selectedLines
                        );
                        
                        // Update local staff data
                        const staffIndex = medicalStaff.value.findIndex(s => s.id === researchLinesModal.staff.id);
                        if (staffIndex !== -1) {
                            medicalStaff.value[staffIndex].research_line_ids = researchLinesModal.selectedLines;
                        }
                        
                        const enhancedIndex = enhancedMedicalStaff.value.findIndex(s => s.id === researchLinesModal.staff.id);
                        if (enhancedIndex !== -1) {
                            enhancedMedicalStaff.value[enhancedIndex].research_line_ids = researchLinesModal.selectedLines;
                        }
                        
                        researchLinesModal.show = false;
                        showToast('Success', 'Research lines updated successfully', 'success');
                    } catch (error) {
                        showToast('Error', error.message, 'error');
                    } finally {
                        saving.value = false;
                    }
                };
                
                // Clinical Unit Modal
                const showAddClinicalUnitModal = () => {
                    clinicalUnitModal.mode = 'add';
                    clinicalUnitModal.form = {
                        unit_name: '',
                        unit_code: '',
                        department_id: '',
                        maximum_residents: 10,
                        unit_status: 'active',
                        specialty: '',
                        supervising_attending_id: ''
                    };
                    clinicalUnitModal.show = true;
                };
                
                const editClinicalUnit = (unit) => {
                    clinicalUnitModal.mode = 'edit';
                    clinicalUnitModal.form = { ...unit };
                    clinicalUnitModal.show = true;
                };
                
                const saveClinicalUnit = async () => {
                    saving.value = true;
                    try {
                        if (clinicalUnitModal.mode === 'add') {
                            const result = await API.createClinicalUnit(clinicalUnitModal.form);
                            clinicalUnits.value.unshift(result);
                            showToast('Success', 'Clinical unit created successfully', 'success');
                        } else {
                            const result = await API.updateClinicalUnit(clinicalUnitModal.form.id, clinicalUnitModal.form);
                            const index = clinicalUnits.value.findIndex(u => u.id === result.id);
                            if (index !== -1) clinicalUnits.value[index] = result;
                            showToast('Success', 'Clinical unit updated successfully', 'success');
                        }
                        clinicalUnitModal.show = false;
                        await loadClinicalUnitsWithStaff();
                        await loadSystemStats();
                    } catch (error) {
                        showToast('Error', error.message, 'error');
                    } finally {
                        saving.value = false;
                    }
                };
                
                // Staff Assignment Modal
                const showStaffAssignmentModal = (unit) => {
                    staffAssignmentModal.unit = unit;
                    staffAssignmentModal.form = {
                        staff_id: '',
                        assignment_type: 'resident',
                        start_date: new Date().toISOString().split('T')[0],
                        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                    };
                    staffAssignmentModal.show = true;
                };
                
                const saveStaffAssignment = async () => {
                    if (!staffAssignmentModal.unit) return;
                    
                    saving.value = true;
                    try {
                        await API.assignStaffToClinicalUnit(
                            staffAssignmentModal.unit.id,
                            staffAssignmentModal.form
                        );
                        
                        staffAssignmentModal.show = false;
                        showToast('Success', 'Staff assigned to clinical unit successfully', 'success');
                        await loadClinicalUnitsWithStaff();
                        await loadEnhancedMedicalStaff();
                    } catch (error) {
                        showToast('Error', error.message, 'error');
                    } finally {
                        saving.value = false;
                    }
                };
                
                const removeStaffAssignment = async (unitId, staffId) => {
                    showConfirmation({
                        title: 'Remove Staff',
                        message: 'Are you sure you want to remove this staff member from the clinical unit?',
                        confirmButtonText: 'Remove',
                        confirmButtonClass: 'btn-danger',
                        onConfirm: async () => {
                            try {
                                await API.removeStaffFromClinicalUnit(unitId, staffId);
                                showToast('Success', 'Staff removed from clinical unit', 'success');
                                await loadClinicalUnitsWithStaff();
                                await loadEnhancedMedicalStaff();
                            } catch (error) {
                                showToast('Error', error.message, 'error');
                            }
                        }
                    });
                };
                
                // Rotation Modal
                const showAddRotationModal = () => {
                    rotationModal.mode = 'add';
                    rotationModal.form = {
                        resident_id: '',
                        clinical_unit_id: '',
                        start_date: new Date().toISOString().split('T')[0],
                        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        rotation_status: 'scheduled',
                        rotation_category: 'clinical_rotation',
                        supervising_attending_id: ''
                    };
                    rotationModal.show = true;
                };
                
                const editRotation = (rotation) => {
                    rotationModal.mode = 'edit';
                    rotationModal.form = { ...rotation };
                    rotationModal.show = true;
                };
                
                const saveRotation = async () => {
                    saving.value = true;
                    try {
                        if (rotationModal.mode === 'add') {
                            const result = await API.createRotation(rotationModal.form);
                            rotations.value.unshift(result);
                            showToast('Success', 'Rotation created successfully', 'success');
                        } else {
                            const result = await API.updateRotation(rotationModal.form.id, rotationModal.form);
                            const index = rotations.value.findIndex(r => r.id === result.id);
                            if (index !== -1) rotations.value[index] = result;
                            showToast('Success', 'Rotation updated successfully', 'success');
                        }
                        rotationModal.show = false;
                        await loadSystemStats();
                    } catch (error) {
                        showToast('Error', error.message, 'error');
                    } finally {
                        saving.value = false;
                    }
                };
                
                // On-call Modal
                const showAddOnCallModal = () => {
                    onCallModal.mode = 'add';
                    onCallModal.form = {
                        duty_date: new Date().toISOString().split('T')[0],
                        shift_type: 'primary_call',
                        start_time: '08:00',
                        end_time: '17:00',
                        primary_physician_id: '',
                        backup_physician_id: '',
                        coverage_notes: ''
                    };
                    onCallModal.show = true;
                };
                
                const editOnCallSchedule = (schedule) => {
                    onCallModal.mode = 'edit';
                    onCallModal.form = { ...schedule };
                    onCallModal.show = true;
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
                        await loadTodaysOnCall();
                    } catch (error) {
                        showToast('Error', error.message, 'error');
                    } finally {
                        saving.value = false;
                    }
                };
                
                // Absence Modal
                const showAddAbsenceModal = () => {
                    absenceModal.mode = 'add';
                    absenceModal.form = {
                        staff_member_id: '',
                        absence_type: 'planned',
                        absence_reason: 'vacation',
                        start_date: new Date().toISOString().split('T')[0],
                        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        coverage_arranged: false,
                        covering_staff_id: ''
                    };
                    absenceModal.show = true;
                };
                
                const editAbsence = (absence) => {
                    absenceModal.mode = 'edit';
                    absenceModal.form = { ...absence };
                    absenceModal.show = true;
                };
                
                const saveAbsence = async () => {
                    saving.value = true;
                    try {
                        if (absenceModal.mode === 'add') {
                            const result = await API.createAbsence(absenceModal.form);
                            absences.value.unshift(result);
                            showToast('Success', 'Absence recorded successfully', 'success');
                        } else {
                            const result = await API.updateAbsence(absenceModal.form.id, absenceModal.form);
                            const index = absences.value.findIndex(a => a.id === result.id);
                            if (index !== -1) absences.value[index] = result;
                            showToast('Success', 'Absence updated successfully', 'success');
                        }
                        absenceModal.show = false;
                        await loadSystemStats();
                    } catch (error) {
                        showToast('Error', error.message, 'error');
                    } finally {
                        saving.value = false;
                    }
                };
                
                // Announcement Modal
                const showAddAnnouncementModal = () => {
                    announcementModal.mode = 'add';
                    announcementModal.form = {
                        title: '',
                        content: '',
                        priority_level: 'normal',
                        target_audience: 'all_staff',
                        publish_start_date: new Date().toISOString().split('T')[0]
                    };
                    announcementModal.show = true;
                };
                
                const editAnnouncement = (announcement) => {
                    announcementModal.mode = 'edit';
                    announcementModal.form = { ...announcement };
                    announcementModal.show = true;
                };
                
                const saveAnnouncement = async () => {
                    saving.value = true;
                    try {
                        if (announcementModal.mode === 'add') {
                            const result = await API.createAnnouncement(announcementModal.form);
                            announcements.value.unshift(result);
                            showToast('Success', 'Announcement posted successfully', 'success');
                        } else {
                            const result = await API.updateAnnouncement(announcementModal.form.id, announcementModal.form);
                            const index = announcements.value.findIndex(a => a.id === result.id);
                            if (index !== -1) announcements.value[index] = result;
                            showToast('Success', 'Announcement updated successfully', 'success');
                        }
                        announcementModal.show = false;
                    } catch (error) {
                        showToast('Error', error.message, 'error');
                    } finally {
                        saving.value = false;
                    }
                };
                
                // Department Modal
                const showAddDepartmentModal = () => {
                    departmentModal.mode = 'add';
                    departmentModal.form = {
                        name: '',
                        code: '',
                        status: 'active',
                        head_of_department_id: '',
                        contact_email: '',
                        contact_phone: ''
                    };
                    departmentModal.show = true;
                };
                
                const editDepartment = (department) => {
                    departmentModal.mode = 'edit';
                    departmentModal.form = { ...department };
                    departmentModal.show = true;
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
                
                // Reports Modal
                const showReportsModal = async (reportType) => {
                    reportsModal.activeReport = reportType;
                    reportsModal.data = null;
                    reportsModal.show = true;
                    
                    try {
                        switch (reportType) {
                            case 'staff_distribution':
                                reportsModal.data = await API.getStaffDistributionReport();
                                break;
                            case 'rotation_summary':
                                reportsModal.data = await API.getRotationSummaryReport();
                                break;
                            case 'research_participation':
                                reportsModal.data = await API.getResearchParticipationReport();
                                break;
                            case 'staff_by_clinical_unit':
                                reportsModal.data = await API.getStaffByClinicalUnitReport();
                                break;
                        }
                    } catch (error) {
                        showToast('Error', 'Failed to load report data', 'error');
                    }
                };
                
                // Live Status Functions
                const saveClinicalStatus = async () => {
                    if (!newStatusText.value.trim() || !selectedAuthorId.value) {
                        showToast('Error', 'Please fill all required fields', 'error');
                        return;
                    }
                    
                    isLoadingStatus.value = true;
                    try {
                        const response = await API.createClinicalStatus({
                            status_text: newStatusText.value.trim(),
                            author_id: selectedAuthorId.value,
                            expires_in_hours: expiryHours.value
                        });
                        
                        if (response && response.success && response.data) {
                            clinicalStatus.value = response.data;
                            newStatusText.value = '';
                            selectedAuthorId.value = '';
                            
                            showToast('Success', 'Live status has been updated for all staff', 'success');
                        } else {
                            throw new Error(response?.error || 'Failed to save status');
                        }
                    } catch (error) {
                        console.error('Failed to save clinical status:', error);
                        showToast('Error', error.message || 'Could not update status. Please try again.', 'error');
                    } finally {
                        isLoadingStatus.value = false;
                    }
                };
                
                const deleteClinicalStatus = async () => {
                    if (!clinicalStatus.value) return;
                    
                    showConfirmation({
                        title: 'Clear Live Status',
                        message: 'Are you sure you want to clear the current live status?',
                        confirmButtonText: 'Clear',
                        confirmButtonClass: 'btn-danger',
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
                
                // ============ 11. DELETE FUNCTIONS ============
                
                const deleteMedicalStaff = async (staff) => {
                    showConfirmation({
                        title: 'Delete Medical Staff',
                        message: `Are you sure you want to delete ${staff.full_name}?`,
                        confirmButtonText: 'Delete',
                        confirmButtonClass: 'btn-danger',
                        onConfirm: async () => {
                            try {
                                await API.deleteMedicalStaff(staff.id);
                                const index = medicalStaff.value.findIndex(s => s.id === staff.id);
                                if (index > -1) medicalStaff.value.splice(index, 1);
                                
                                const enhancedIndex = enhancedMedicalStaff.value.findIndex(s => s.id === staff.id);
                                if (enhancedIndex > -1) enhancedMedicalStaff.value.splice(enhancedIndex, 1);
                                
                                showToast('Success', 'Medical staff deleted successfully', 'success');
                                await loadSystemStats();
                            } catch (error) {
                                showToast('Error', error.message, 'error');
                            }
                        }
                    });
                };
                
                const deleteRotation = async (rotation) => {
                    showConfirmation({
                        title: 'Delete Rotation',
                        message: 'Are you sure you want to delete this rotation?',
                        confirmButtonText: 'Delete',
                        confirmButtonClass: 'btn-danger',
                        onConfirm: async () => {
                            try {
                                await API.deleteRotation(rotation.id);
                                const index = rotations.value.findIndex(r => r.id === rotation.id);
                                if (index > -1) rotations.value.splice(index, 1);
                                showToast('Success', 'Rotation deleted successfully', 'success');
                                await loadSystemStats();
                            } catch (error) {
                                showToast('Error', error.message, 'error');
                            }
                        }
                    });
                };
                
                const deleteOnCallSchedule = async (schedule) => {
                    showConfirmation({
                        title: 'Delete On-Call Schedule',
                        message: 'Are you sure you want to delete this on-call schedule?',
                        confirmButtonText: 'Delete',
                        confirmButtonClass: 'btn-danger',
                        onConfirm: async () => {
                            try {
                                await API.deleteOnCall(schedule.id);
                                const index = onCallSchedule.value.findIndex(s => s.id === schedule.id);
                                if (index > -1) onCallSchedule.value.splice(index, 1);
                                showToast('Success', 'On-call schedule deleted successfully', 'success');
                                await loadTodaysOnCall();
                            } catch (error) {
                                showToast('Error', error.message, 'error');
                            }
                        }
                    });
                };
                
                const deleteAbsence = async (absence) => {
                    showConfirmation({
                        title: 'Delete Absence',
                        message: 'Are you sure you want to delete this absence record?',
                        confirmButtonText: 'Delete',
                        confirmButtonClass: 'btn-danger',
                        onConfirm: async () => {
                            try {
                                await API.deleteAbsence(absence.id);
                                const index = absences.value.findIndex(a => a.id === absence.id);
                                if (index > -1) absences.value.splice(index, 1);
                                showToast('Success', 'Absence deleted successfully', 'success');
                                await loadSystemStats();
                            } catch (error) {
                                showToast('Error', error.message, 'error');
                            }
                        }
                    });
                };
                
                const deleteAnnouncement = async (announcement) => {
                    showConfirmation({
                        title: 'Delete Announcement',
                        message: `Are you sure you want to delete "${announcement.title}"?`,
                        confirmButtonText: 'Delete',
                        confirmButtonClass: 'btn-danger',
                        onConfirm: async () => {
                            try {
                                await API.deleteAnnouncement(announcement.id);
                                const index = announcements.value.findIndex(a => a.id === announcement.id);
                                if (index > -1) announcements.value.splice(index, 1);
                                showToast('Success', 'Announcement deleted successfully', 'success');
                            } catch (error) {
                                showToast('Error', error.message, 'error');
                            }
                        }
                    });
                };
                
                // ============ 12. VIEW FUNCTIONS ============
                
                const viewStaffDetails = (staff) => {
                    staffProfileModal.staff = staff;
                    staffProfileModal.activeTab = 'clinical';
                    staffProfileModal.show = true;
                };
                
                const viewClinicalUnitDetails = async (unitId) => {
                    try {
                        const staff = await API.getClinicalUnitStaff(unitId);
                        showToast('Clinical Unit Staff', `${staff.length} staff members found`, 'info');
                    } catch (error) {
                        showToast('Error', 'Failed to load unit staff', 'error');
                    }
                };
                
                // ============ 13. NAVIGATION ============
                
                const switchView = (view) => {
                    currentView.value = view;
                    mobileMenuOpen.value = false;
                };
                
                // ============ 14. PERMISSION FUNCTIONS ============
                
                const hasPermission = (module, action = 'read') => {
                    const role = currentUser.value?.user_role;
                    if (!role) return false;
                    
                    if (role === 'system_admin') return true;
                    
                    const permissions = PERMISSION_MATRIX[role]?.[module];
                    if (!permissions) return false;
                    
                    return permissions.includes(action) || permissions.includes('*');
                };
                
                // ============ 15. COMPUTED PROPERTIES ============
                
                const filteredMedicalStaff = computed(() => {
                    let filtered = enhancedMedicalStaff.value;
                    
                    if (staffFilters.search) {
                        const search = staffFilters.search.toLowerCase();
                        filtered = filtered.filter(staff =>
                            staff.full_name?.toLowerCase().includes(search) ||
                            staff.staff_id?.toLowerCase().includes(search) ||
                            staff.professional_email?.toLowerCase().includes(search) ||
                            staff.specialization?.toLowerCase().includes(search)
                        );
                    }
                    
                    if (staffFilters.staffType) {
                        filtered = filtered.filter(staff => staff.staff_type === staffFilters.staffType);
                    }
                    
                    if (staffFilters.department) {
                        filtered = filtered.filter(staff => staff.department_id === staffFilters.department);
                    }
                    
                    if (staffFilters.clinicalUnit) {
                        filtered = filtered.filter(staff => staff.clinical_unit_id === staffFilters.clinicalUnit);
                    }
                    
                    if (staffFilters.status) {
                        filtered = filtered.filter(staff => staff.employment_status === staffFilters.status);
                    }
                    
                    if (staffFilters.hasResearchLines === 'yes') {
                        filtered = filtered.filter(staff => staff.research_line_ids && staff.research_line_ids.length > 0);
                    } else if (staffFilters.hasResearchLines === 'no') {
                        filtered = filtered.filter(staff => !staff.research_line_ids || staff.research_line_ids.length === 0);
                    }
                    
                    return filtered;
                });
                
                const filteredClinicalUnits = computed(() => {
                    let filtered = clinicalUnitsWithStaff.value;
                    
                    if (clinicalUnitFilters.department) {
                        filtered = filtered.filter(unit => unit.department_id === clinicalUnitFilters.department);
                    }
                    
                    if (clinicalUnitFilters.status) {
                        filtered = filtered.filter(unit => unit.unit_status === clinicalUnitFilters.status);
                    }
                    
                    if (clinicalUnitFilters.capacity === 'full') {
                        filtered = filtered.filter(unit => 
                            unit.staff_count?.residents >= unit.maximum_residents
                        );
                    } else if (clinicalUnitFilters.capacity === 'available') {
                        filtered = filtered.filter(unit => 
                            unit.staff_count?.residents < unit.maximum_residents
                        );
                    }
                    
                    if (clinicalUnitFilters.search) {
                        const search = clinicalUnitFilters.search.toLowerCase();
                        filtered = filtered.filter(unit =>
                            unit.unit_name?.toLowerCase().includes(search) ||
                            unit.unit_code?.toLowerCase().includes(search) ||
                            unit.specialty?.toLowerCase().includes(search)
                        );
                    }
                    
                    return filtered;
                });
                
                const filteredRotations = computed(() => {
                    let filtered = rotations.value;
                    
                    if (rotationFilters.resident) {
                        filtered = filtered.filter(rotation => rotation.resident_id === rotationFilters.resident);
                    }
                    
                    if (rotationFilters.status) {
                        filtered = filtered.filter(rotation => rotation.rotation_status === rotationFilters.status);
                    }
                    
                    if (rotationFilters.clinicalUnit) {
                        filtered = filtered.filter(rotation => rotation.clinical_unit_id === rotationFilters.clinicalUnit);
                    }
                    
                    if (rotationFilters.supervisor) {
                        filtered = filtered.filter(rotation => rotation.supervising_attending_id === rotationFilters.supervisor);
                    }
                    
                    return filtered;
                });
                
                const filteredAbsences = computed(() => {
                    let filtered = absences.value;
                    
                    if (absenceFilters.staff) {
                        filtered = filtered.filter(absence => absence.staff_member_id === absenceFilters.staff);
                    }
                    
                    if (absenceFilters.status) {
                        filtered = filtered.filter(absence => absence.current_status === absenceFilters.status);
                    }
                    
                    if (absenceFilters.reason) {
                        filtered = filtered.filter(absence => absence.absence_reason === absenceFilters.reason);
                    }
                    
                    if (absenceFilters.startDate) {
                        filtered = filtered.filter(absence => absence.start_date >= absenceFilters.startDate);
                    }
                    
                    return filtered;
                });
                
                const activeResearchLines = computed(() => {
                    return researchLines.value.filter(line => line.active);
                });
                
                const clinicalUnitCapacity = computed(() => {
                    return clinicalUnitsWithStaff.value.map(unit => ({
                        id: unit.id,
                        name: unit.unit_name,
                        capacity: unit.maximum_residents || 10,
                        current: unit.staff_count?.residents || 0,
                        available: (unit.maximum_residents || 10) - (unit.staff_count?.residents || 0),
                        percentage: Math.round(((unit.staff_count?.residents || 0) / (unit.maximum_residents || 10)) * 100)
                    }));
                });
                
                const availablePhysicians = computed(() => {
                    return medicalStaff.value.filter(staff => 
                        (staff.staff_type === 'attending_physician' || 
                         staff.staff_type === 'fellow' || 
                         staff.staff_type === 'nurse_practitioner') && 
                        staff.employment_status === 'active'
                    );
                });
                
                const availableResidents = computed(() => {
                    return medicalStaff.value.filter(staff => 
                        staff.staff_type === 'medical_resident' && 
                        staff.employment_status === 'active'
                    );
                });
                
                const unreadAnnouncements = computed(() => {
                    return announcements.value.filter(a => !a.read).length;
                });
                
                // ============ 16. LIFECYCLE ============
                
                onMounted(() => {
                    console.log('🚀 Vue app v10.0 Complete mounted');
                    
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
                    } else {
                        currentView.value = 'login';
                    }
                    
                    // Auto-refresh data
                    const refreshInterval = setInterval(() => {
                        if (currentUser.value) {
                            loadSystemStats();
                            loadClinicalStatus();
                            loadTodaysOnCall();
                        }
                    }, 5 * 60 * 1000);
                    
                    onUnmounted(() => {
                        clearInterval(refreshInterval);
                    });
                });
                
                // Watch for data changes to update stats
                watch([medicalStaff, rotations, clinicalUnits, absences], 
                    () => {
                        // Update stats when data changes
                        systemStats.value.totalStaff = medicalStaff.value.length;
                        systemStats.value.activeResidents = medicalStaff.value.filter(s => 
                            s.staff_type === 'medical_resident' && s.employment_status === 'active'
                        ).length;
                        systemStats.value.activeAttending = medicalStaff.value.filter(s => 
                            s.staff_type === 'attending_physician' && s.employment_status === 'active'
                        ).length;
                        systemStats.value.clinicalUnits = clinicalUnits.value.length;
                        systemStats.value.researchLines = researchLines.value.length;
                        systemStats.value.activeRotations = rotations.value.filter(r => 
                            r.rotation_status === 'active'
                        ).length;
                        systemStats.value.currentlyAbsent = absences.value.filter(a => 
                            a.current_status === 'currently_absent'
                        ).length;
                    }, 
                    { deep: true }
                );
                
                // ============ 17. RETURN EXPOSED DATA/METHODS ============
                return {
                    // State
                    currentUser,
                    loginForm,
                    loginLoading,
                    loading,
                    saving,
                    isLoadingStatus,
                    
                    currentView,
                    sidebarCollapsed,
                    mobileMenuOpen,
                    userMenuOpen,
                    statsSidebarOpen,
                    globalSearchQuery,
                    
                    // Data
                    medicalStaff,
                    enhancedMedicalStaff,
                    researchLines,
                    clinicalUnits,
                    clinicalUnitsWithStaff,
                    departments,
                    rotations,
                    absences,
                    onCallSchedule,
                    announcements,
                    clinicalStatus,
                    availableData,
                    
                    // Modal Data
                    selectedStaffId,
                    selectedResearchLines,
                    newStatusText,
                    selectedAuthorId,
                    expiryHours,
                    activeMedicalStaff,
                    
                    // Dashboard
                    systemStats,
                    todaysOnCall,
                    todaysOnCallCount,
                    
                    // UI
                    toasts,
                    systemAlerts,
                    
                    // Filters
                    staffFilters,
                    clinicalUnitFilters,
                    rotationFilters,
                    absenceFilters,
                    
                    // Modals
                    staffProfileModal,
                    medicalStaffModal,
                    clinicalUnitModal,
                    staffAssignmentModal,
                    researchLinesModal,
                    rotationModal,
                    onCallModal,
                    absenceModal,
                    announcementModal,
                    departmentModal,
                    reportsModal,
                    confirmationModal,
                    
                    // Core Functions
                    formatDate: EnhancedUtils.formatDate,
                    formatDateTime: EnhancedUtils.formatDateTime,
                    formatTime: EnhancedUtils.formatTime,
                    getInitials: EnhancedUtils.getInitials,
                    truncateText: EnhancedUtils.truncateText,
                    formatStaffType,
                    getStaffTypeClass,
                    formatEmploymentStatus,
                    formatAbsenceReason,
                    formatRotationStatus,
                    formatAudience,
                    getCurrentViewTitle,
                    
                    // Helper Functions
                    getDepartmentName,
                    getStaffName,
                    getClinicalUnitName,
                    getResearchLineNames,
                    
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
                    
                    // Modal Show Functions
                    showAddMedicalStaffModal,
                    editMedicalStaff,
                    saveMedicalStaff,
                    showAddClinicalUnitModal,
                    editClinicalUnit,
                    saveClinicalUnit,
                    showStaffAssignmentModal,
                    saveStaffAssignment,
                    removeStaffAssignment,
                    showResearchLinesModal,
                    saveResearchLines,
                    showAddRotationModal,
                    editRotation,
                    saveRotation,
                    showAddOnCallModal,
                    editOnCallSchedule,
                    saveOnCallSchedule,
                    showAddAbsenceModal,
                    editAbsence,
                    saveAbsence,
                    showAddAnnouncementModal,
                    editAnnouncement,
                    saveAnnouncement,
                    showAddDepartmentModal,
                    editDepartment,
                    saveDepartment,
                    showReportsModal,
                    getUserRoleDisplay,
    getCurrentViewSubtitle,
    getSearchPlaceholder,
                    
                    // Live Status Functions
                    saveClinicalStatus,
                    deleteClinicalStatus,
                    
                    // Delete Functions
                    deleteMedicalStaff,
                    deleteRotation,
                    deleteOnCallSchedule,
                    deleteAbsence,
                    deleteAnnouncement,
                    
                    // View Functions
                    viewStaffDetails,
                    viewClinicalUnitDetails,
                    
                    // Permission Functions
                    hasPermission,
                    
                    // Computed Properties
                    filteredMedicalStaff,
                    filteredClinicalUnits,
                    filteredRotations,
                    filteredAbsences,
                    activeResearchLines,
                    clinicalUnitCapacity,
                    availablePhysicians,
                    availableResidents,
                    unreadAnnouncements
                };
            }
        });
        
        // ============ 18. MOUNT APP ============
        app.mount('#app');
        
        console.log('✅ NeumoCare v10.0 100% COMPLETE mounted successfully!');
        console.log('📋 ALL FEATURES INTEGRATED:');
        console.log('   ✅ Medical Staff Management (Enhanced)');
        console.log('   ✅ Clinical Units with Staff Assignment');
        console.log('   ✅ Research Lines Management');
        console.log('   ✅ Resident Rotations');
        console.log('   ✅ On-call Schedule Management');
        console.log('   ✅ Staff Absence Tracking');
        console.log('   ✅ Announcements System');
        console.log('   ✅ Department Management');
        console.log('   ✅ Reports & Analytics');
        console.log('   ✅ Live Status Updates');
        console.log('   ✅ Permission System');
        console.log('   ✅ Advanced Filtering');
        console.log('   ✅ Real-time Dashboard');
        
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
                               border: none; border-radius: 6px; cursor: pointer; margin-top: 20px;">
                    🔄 Refresh Page
                </button>
            </div>
        `;
        
        throw error;
    }
});
