
// ============ NEUMOCARE HOSPITAL MANAGEMENT SYSTEM v8.0 ============
// COMPLETELY FIXED VERSION - 100% SERVER COMPATIBLE
// ===================================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 NeumoCare Hospital Management System v8.0 loading...');
    
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
            APP_VERSION: '8.0',
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
            
            static formatRelativeTime(dateString) {
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
            
            static calculateDateDifference(startDate, endDate) {
                try {
                    const start = new Date(startDate);
                    const end = new Date(endDate);
                    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
                    const diffTime = Math.abs(end - start);
                    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                } catch { return 0; }
            }
            
            static generateId(prefix) {
                return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
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
            
            // ===== AUTHENTICATION ENDPOINTS =====
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
            
            // ===== MEDICAL STAFF ENDPOINTS =====
            async getMedicalStaff() {
                try {
                    const data = await this.request('/api/medical-staff');
                    return EnhancedUtils.ensureArray(data);
                } catch { return []; }
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
            
            // ===== DEPARTMENT ENDPOINTS =====
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
            
            // ===== TRAINING UNIT ENDPOINTS =====
            async getTrainingUnits() {
                try {
                    const data = await this.request('/api/training-units');
                    return EnhancedUtils.ensureArray(data);
                } catch { return []; }
            }
            
            async createTrainingUnit(unitData) {
                return await this.request('/api/training-units', {
                    method: 'POST',
                    body: unitData
                });
            }
            
            async updateTrainingUnit(id, unitData) {
                return await this.request(`/api/training-units/${id}`, {
                    method: 'PUT',
                    body: unitData
                });
            }
            
            // ===== ROTATION ENDPOINTS =====
            async getRotations() {
                try {
                    const data = await this.request('/api/rotations');
                    return EnhancedUtils.ensureArray(data);
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
            
            // ===== ON-CALL ENDPOINTS =====
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
            
            // ===== ABSENCE ENDPOINTS =====
            async getAbsences() {
                try {
                    const data = await this.request('/api/absences');
                    return EnhancedUtils.ensureArray(data);
                } catch { return []; }
            }
            
            async createAbsence(absenceData) {
                return await this.request('/api/absences', {
                    method: 'POST',
                    body: absenceData
                });
            }
            
            async updateAbsence(id, absenceData) {
                return await this.request(`/api/absences/${id}`, {
                    method: 'PUT',
                    body: absenceData
                });
            }
            
            // ===== ANNOUNCEMENT ENDPOINTS =====
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
            
            // ===== LIVE STATUS ENDPOINTS =====
            async getClinicalStatus() {
                try {
                    const data = await this.request('/api/live-status/current');
                    return data;
                } catch (error) {
                    console.error('Clinical status API error:', error);
                    return {
                        success: false,
                        data: null,
                        error: error.message
                    };
                }
            }
            
            async createClinicalStatus(statusData) {
                return await this.request('/api/live-status', {
                    method: 'POST',
                    body: statusData
                });
            }
            
            // ===== SYSTEM STATS ENDPOINT =====
            async getSystemStats() {
                try {
                    const data = await this.request('/api/system-stats');
                    return data || {};
                } catch {
                    return {
                        activeAttending: 0,
                        activeResidents: 0,
                        onCallNow: 0,
                        inSurgery: 0,
                        nextShiftChange: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
                        pendingApprovals: 0
                    };
                }
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
                const loadingSchedule = ref(false);
                const isLoadingStatus = ref(false);
                
                // 6.4 Data Stores
                const medicalStaff = ref([]);
                const departments = ref([]);
                const trainingUnits = ref([]);
                const rotations = ref([]);
                const absences = ref([]);
                const onCallSchedule = ref([]);
                const announcements = ref([]);
                
                // 6.5 LIVE STATUS DATA
                const clinicalStatus = ref(null);
                const newStatusText = ref('');
                const selectedAuthorId = ref('');
                const expiryHours = ref(8);
                const activeMedicalStaff = ref([]);
                const liveStatsEditMode = ref(false);
                
                // 6.6 Dashboard Data
                const systemStats = ref({
                    totalStaff: 0,
                    activeAttending: 0,
                    activeResidents: 0,
                    onCallNow: 0,
                    inSurgery: 0,
                    activeRotations: 0,
                    endingThisWeek: 0,
                    startingNextWeek: 0,
                    onLeaveStaff: 0,
                    departmentStatus: 'normal',
                    activePatients: 0,
                    icuOccupancy: 0,
                    wardOccupancy: 0,
                    pendingApprovals: 0,
                    nextShiftChange: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString()
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
                    status: ''
                });
                
                const onCallFilters = reactive({
                    date: '',
                    shiftType: '',
                    physician: '',
                    coverageArea: ''
                });
                
                const rotationFilters = reactive({
                    resident: '',
                    status: '',
                    trainingUnit: '',
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
                        academic_degree: '',
                        specialization: '',
                        resident_year: '',
                        clinical_certificate: '',
                        certificate_status: 'current'
                    }
                });
                
                const communicationsModal = reactive({
                    show: false,
                    activeTab: 'announcement',
                    form: {
                        title: '',
                        content: '',
                        priority: 'normal',
                        target_audience: 'all_staff',
                        updateType: 'daily',
                        dailySummary: '',
                        highlight1: '',
                        highlight2: '',
                        alerts: {
                            erBusy: false,
                            icuFull: false,
                            wardFull: false,
                            staffShortage: false
                        },
                        metricName: '',
                        metricValue: '',
                        metricTrend: 'stable',
                        metricChange: '',
                        metricNote: '',
                        alertLevel: 'low',
                        alertMessage: '',
                        affectedAreas: {
                            er: false,
                            icu: false,
                            ward: false,
                            surgery: false
                        }
                    }
                });
                
                const onCallModal = reactive({
                    show: false,
                    mode: 'add',
                    form: {
                        duty_date: new Date().toISOString().split('T')[0],
                        shift_type: 'primary',
                        start_time: '08:00',
                        end_time: '17:00',
                        primary_physician_id: '',
                        backup_physician_id: '',
                        coverage_area: 'emergency'
                    }
                });
                
                const rotationModal = reactive({
                    show: false,
                    mode: 'add',
                    form: {
                        rotation_id: '',
                        resident_id: '',
                        training_unit_id: '',
                        rotation_start_date: new Date().toISOString().split('T')[0],
                        rotation_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        rotation_status: 'scheduled',
                        rotation_category: 'clinical_rotation',
                        supervising_attending_id: ''
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
                        supervising_attending_id: ''
                    }
                });
                
                const absenceModal = reactive({
                    show: false,
                    mode: 'add',
                    form: {
                        staff_member_id: '',
                        absence_reason: 'vacation',
                        start_date: new Date().toISOString().split('T')[0],
                        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        status: 'active',
                        replacement_staff_id: '',
                        notes: ''
                    }
                });
                
                const departmentModal = reactive({
                    show: false,
                    mode: 'add',
                    form: {
                        name: '',
                        code: '',
                        status: 'active',
                        head_of_department_id: ''
                    }
                });
                
                const userProfileModal = reactive({
                    show: false,
                    form: {
                        full_name: '',
                        email: '',
                        department_id: ''
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
                    details: ''
                });
                
                // 6.10 Permission Matrix
                const PERMISSION_MATRIX = {
                    system_admin: {
                        medical_staff: ['create', 'read', 'update', 'delete'],
                        oncall_schedule: ['create', 'read', 'update', 'delete'],
                        resident_rotations: ['create', 'read', 'update', 'delete'],
                        training_units: ['create', 'read', 'update', 'delete'],
                        staff_absence: ['create', 'read', 'update', 'delete'],
                        department_management: ['create', 'read', 'update', 'delete'],
                        communications: ['create', 'read', 'update', 'delete'],
                        system: ['manage_departments', 'manage_updates']
                    },
                    department_head: {
                        medical_staff: ['read', 'update'],
                        oncall_schedule: ['create', 'read', 'update'],
                        resident_rotations: ['create', 'read', 'update'],
                        training_units: ['read', 'update'],
                        staff_absence: ['create', 'read', 'update'],
                        department_management: ['read'],
                        communications: ['create', 'read'],
                        system: ['manage_updates']
                    },
                    attending_physician: {
                        medical_staff: ['read'],
                        oncall_schedule: ['read'],
                        resident_rotations: ['read'],
                        training_units: ['read'],
                        staff_absence: ['read'],
                        department_management: ['read'],
                        communications: ['read']
                    },
                    medical_resident: {
                        medical_staff: ['read'],
                        oncall_schedule: ['read'],
                        resident_rotations: ['read'],
                        training_units: ['read'],
                        staff_absence: ['read'],
                        department_management: [],
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
                
                const formatAbsenceStatus = (status) => {
                    const map = {
                        'active': 'Active',
                        'upcoming': 'Upcoming',
                        'completed': 'Completed'
                    };
                    return map[status] || status;
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
                
                const getUserRoleDisplay = (role) => {
                    const map = {
                        'system_admin': 'System Administrator',
                        'department_head': 'Department Head',
                        'attending_physician': 'Attending Physician',
                        'medical_resident': 'Medical Resident'
                    };
                    return map[role] || role;
                };
                
                const getCurrentViewTitle = () => {
                    const map = {
                        'dashboard': 'Dashboard Overview',
                        'medical_staff': 'Medical Staff Management',
                        'oncall_schedule': 'On-call Schedule',
                        'resident_rotations': 'Resident Rotations',
                        'training_units': 'Training Units',
                        'staff_absence': 'Staff Absence Management',
                        'department_management': 'Department Management',
                        'communications': 'Communications Center'
                    };
                    return map[currentView.value] || 'NeumoCare Dashboard';
                };
                
                const getCurrentViewSubtitle = () => {
                    const map = {
                        'dashboard': 'Real-time department overview and analytics',
                        'medical_staff': 'Manage physicians, residents, and clinical staff',
                        'oncall_schedule': 'View and manage on-call physician schedules',
                        'resident_rotations': 'Track and manage resident training rotations',
                        'training_units': 'Clinical training units and resident assignments',
                        'staff_absence': 'Track staff absences and coverage assignments',
                        'department_management': 'Organizational structure and clinical units',
                        'communications': 'Department announcements and capacity updates'
                    };
                    return map[currentView.value] || 'Hospital Management System';
                };
                
                const getSearchPlaceholder = () => {
                    const map = {
                        'dashboard': 'Search staff, units, rotations...',
                        'medical_staff': 'Search by name, ID, or email...',
                        'oncall_schedule': 'Search on-call schedules...',
                        'resident_rotations': 'Search rotations by resident or unit...',
                        'training_units': 'Search training units...',
                        'staff_absence': 'Search absences by staff member...',
                        'department_management': 'Search departments...',
                        'communications': 'Search announcements...'
                    };
                    return map[currentView.value] || 'Search across system...';
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
                
                const getTrainingUnitName = (unitId) => {
                    if (!unitId) return 'Not assigned';
                    const unit = trainingUnits.value.find(u => u.id === unitId);
                    return unit ? unit.unit_name : 'Unknown Unit';
                };
                
                const getSupervisorName = (supervisorId) => {
                    return getStaffName(supervisorId);
                };
                
                const getPhysicianName = (physicianId) => {
                    return getStaffName(physicianId);
                };
                
                const getResidentName = (residentId) => {
                    return getStaffName(residentId);
                };
                
                const getDepartmentUnits = (departmentId) => {
                    return trainingUnits.value.filter(unit => unit.department_id === departmentId);
                };
                
                const getDepartmentStaffCount = (departmentId) => {
                    return medicalStaff.value.filter(staff => staff.department_id === departmentId).length;
                };
                
                const getCurrentRotationForStaff = (staffId) => {
                    const rotation = rotations.value.find(r => {
                        return r.resident_id === staffId && r.rotation_status === 'active';
                    });
                    return rotation || null;
                };
                
                const calculateAbsenceDuration = (startDate, endDate) => {
                    return EnhancedUtils.calculateDateDifference(startDate, endDate);
                };
                
                // ============ 8. NEW LIVE STATUS FUNCTIONS ============
                
                const loadClinicalStatus = async () => {
                    isLoadingStatus.value = true;
                    try {
                        const response = await API.getClinicalStatus();
                        
                        if (response && response.success) {
                            clinicalStatus.value = response.data;
                        } else {
                            clinicalStatus.value = null;
                        }
                    } catch (error) {
                        console.error('Failed to load clinical status:', error);
                        clinicalStatus.value = null;
                    } finally {
                        isLoadingStatus.value = false;
                    }
                };
                
                const loadActiveMedicalStaff = async () => {
                    try {
                        const data = await API.getMedicalStaff();
                        activeMedicalStaff.value = data.filter(staff => 
                            staff.employment_status === 'active'
                        );
                        
                        // Auto-select current user if they're medical staff
                        if (currentUser.value) {
                            const currentUserStaff = activeMedicalStaff.value.find(
                                staff => staff.professional_email === currentUser.value.email
                            );
                            if (currentUserStaff) {
                                selectedAuthorId.value = currentUserStaff.id;
                            }
                        }
                    } catch (error) {
                        console.error('Failed to load active medical staff:', error);
                        activeMedicalStaff.value = [];
                    }
                };
                
                const saveClinicalStatus = async () => {
                    if (!newStatusText.value.trim() || !selectedAuthorId.value) {
                        showToast('Error', 'Validation failed', 'Please fill all required fields');
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
                            liveStatsEditMode.value = false;
                            
                            showToast('Success', 'Status Updated', 'Live status has been updated for all staff');
                            await loadSystemStats();
                        } else {
                            throw new Error(response?.error || 'Failed to save status');
                        }
                    } catch (error) {
                        console.error('Failed to save clinical status:', error);
                        showToast('Error', 'Save Failed', error.message || 'Could not update status. Please try again.');
                    } finally {
                        isLoadingStatus.value = false;
                    }
                };
                
                const isStatusExpired = (expiresAt) => {
                    if (!expiresAt) return true;
                    try {
                        const expires = new Date(expiresAt);
                        const now = new Date();
                        return now > expires;
                    } catch {
                        return true;
                    }
                };
                
                const showCreateStatusModal = () => {
                    liveStatsEditMode.value = true;
                    newStatusText.value = '';
                    selectedAuthorId.value = '';
                    expiryHours.value = 8;
                };
                
                // ============ 9. DATA LOADING FUNCTIONS ============
                
                const loadMedicalStaff = async () => {
                    try {
                        const data = await API.getMedicalStaff();
                        medicalStaff.value = data;
                    } catch (error) {
                        console.error('Failed to load medical staff:', error);
                        showToast('Error', 'Failed to load medical staff', 'error');
                    }
                };
                
                const loadDepartments = async () => {
                    try {
                        const data = await API.getDepartments();
                        departments.value = data;
                    } catch (error) {
                        console.error('Failed to load departments:', error);
                        showToast('Error', 'Failed to load departments', 'error');
                    }
                };
                
                const loadTrainingUnits = async () => {
                    try {
                        const data = await API.getTrainingUnits();
                        trainingUnits.value = data;
                    } catch (error) {
                        console.error('Failed to load training units:', error);
                        showToast('Error', 'Failed to load training units', 'error');
                    }
                };
                
                const loadRotations = async () => {
                    try {
                        const data = await API.getRotations();
                        rotations.value = data;
                    } catch (error) {
                        console.error('Failed to load rotations:', error);
                        showToast('Error', 'Failed to load rotations', 'error');
                    }
                };
                
                const loadAbsences = async () => {
                    try {
                        const data = await API.getAbsences();
                        absences.value = data;
                    } catch (error) {
                        console.error('Failed to load absences:', error);
                        showToast('Error', 'Failed to load absences', 'error');
                    }
                };
                
                const loadOnCallSchedule = async () => {
                    try {
                        loadingSchedule.value = true;
                        const data = await API.getOnCallSchedule();
                        onCallSchedule.value = data;
                    } catch (error) {
                        console.error('Failed to load on-call schedule:', error);
                        showToast('Error', 'Failed to load on-call schedule', 'error');
                    } finally {
                        loadingSchedule.value = false;
                    }
                };
                
                const loadTodaysOnCall = async () => {
                    try {
                        loadingSchedule.value = true;
                        const data = await API.getOnCallToday();
                        
                        todaysOnCall.value = data.map(item => {
                            const startTime = item.start_time ? item.start_time.substring(0, 5) : 'N/A';
                            const endTime = item.end_time ? item.end_time.substring(0, 5) : 'N/A';
                            const physicianName = item.primary_physician?.full_name || 'Unknown Physician';
                            
                            let shiftTypeDisplay = 'Unknown';
                            if (item.shift_type === 'primary_call' || item.shift_type === 'primary') {
                                shiftTypeDisplay = 'Primary';
                            } else if (item.shift_type === 'backup_call' || item.shift_type === 'backup' || item.shift_type === 'secondary') {
                                shiftTypeDisplay = 'Backup';
                            }
                            
                            const coverageArea = item.coverage_area || 'General Coverage';
                            const backupPhysician = item.backup_physician?.full_name || null;
                            const contactInfo = item.primary_physician?.professional_email || 'No contact info';
                            
                            let staffType = 'Physician';
                            const matchingStaff = medicalStaff.value.find(staff => 
                                staff.id === item.primary_physician_id
                            );
                            
                            if (matchingStaff) {
                                staffType = formatStaffType(matchingStaff.staff_type);
                            }
                            
                            return {
                                id: item.id,
                                startTime,
                                endTime,
                                physicianName,
                                staffType,
                                shiftType: shiftTypeDisplay,
                                coverageArea,
                                backupPhysician,
                                contactInfo,
                                raw: item
                            };
                        });
                        
                    } catch (error) {
                        console.error('Failed to load today\'s on-call:', error);
                        showToast('Error', 'Failed to load today\'s on-call schedule', 'error');
                        todaysOnCall.value = [];
                    } finally {
                        loadingSchedule.value = false;
                    }
                };
                
                const loadAnnouncements = async () => {
                    try {
                        const data = await API.getAnnouncements();
                        announcements.value = data;
                    } catch (error) {
                        console.error('Failed to load announcements:', error);
                        showToast('Error', 'Failed to load announcements', 'error');
                    }
                };
                
                const loadSystemStats = async () => {
                    try {
                        const data = await API.getSystemStats();
                        if (data && data.success) {
                            Object.assign(systemStats.value, data.data);
                        }
                    } catch (error) {
                        console.error('Failed to load system stats:', error);
                    }
                };
                
                const updateDashboardStats = () => {
                    systemStats.value.totalStaff = medicalStaff.value.length;
                    systemStats.value.activeAttending = medicalStaff.value.filter(s => 
                        s.staff_type === 'attending_physician' && s.employment_status === 'active'
                    ).length;
                    systemStats.value.activeResidents = medicalStaff.value.filter(s => 
                        s.staff_type === 'medical_resident' && s.employment_status === 'active'
                    ).length;
                    systemStats.value.onLeaveStaff = medicalStaff.value.filter(s => 
                        s.employment_status === 'on_leave'
                    ).length;
                    systemStats.value.activeRotations = rotations.value.filter(r => 
                        r.rotation_status === 'active'
                    ).length;
                    
                    const today = new Date();
                    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
                    systemStats.value.endingThisWeek = rotations.value.filter(r => {
                        if (r.rotation_status !== 'active') return false;
                        const endDate = new Date(r.rotation_end_date);
                        return endDate >= today && endDate <= nextWeek;
                    }).length;
                    
                    const nextWeekStart = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
                    const twoWeeks = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
                    systemStats.value.startingNextWeek = rotations.value.filter(r => {
                        if (r.rotation_status !== 'scheduled') return false;
                        const startDate = new Date(r.rotation_start_date);
                        return startDate >= nextWeekStart && startDate <= twoWeeks;
                    }).length;
                };
                
                const loadAllData = async () => {
                    loading.value = true;
                    try {
                        await Promise.all([
                            loadMedicalStaff(),
                            loadDepartments(),
                            loadTrainingUnits(),
                            loadRotations(),
                            loadAbsences(),
                            loadOnCallSchedule(),
                            loadTodaysOnCall(),
                            loadAnnouncements(),
                            loadClinicalStatus(),
                            loadSystemStats()
                        ]);
                        
                        await loadActiveMedicalStaff();
                        updateDashboardStats();
                        showToast('Success', 'System data loaded successfully', 'success');
                    } catch (error) {
                        console.error('Failed to load data:', error);
                        showToast('Error', 'Failed to load some data', 'error');
                    } finally {
                        loading.value = false;
                    }
                };
                
                // ============ 10. AUTHENTICATION FUNCTIONS ============
                
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
                
                // ============ 11. NAVIGATION & UI FUNCTIONS ============
                
                const switchView = (view) => {
                    currentView.value = view;
                    mobileMenuOpen.value = false;
                };
                
                const toggleStatsSidebar = () => {
                    statsSidebarOpen.value = !statsSidebarOpen.value;
                };
                
                const handleGlobalSearch = () => {
                    if (globalSearchQuery.value.trim()) {
                        showToast('Search', `Searching for "${globalSearchQuery.value}"`, 'info');
                    }
                };
                
                const dismissAlert = (id) => {
                    const index = systemAlerts.value.findIndex(alert => alert.id === id);
                    if (index > -1) systemAlerts.value.splice(index, 1);
                };
                
                // ============ 12. MODAL SHOW FUNCTIONS ============
                
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
                        academic_degree: '',
                        specialization: '',
                        resident_year: '',
                        clinical_certificate: '',
                        certificate_status: 'current'
                    };
                    medicalStaffModal.show = true;
                };
                
                const showAddDepartmentModal = () => {
                    departmentModal.mode = 'add';
                    departmentModal.form = {
                        name: '',
                        code: '',
                        status: 'active',
                        head_of_department_id: ''
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
                        supervising_attending_id: ''
                    };
                    rotationModal.show = true;
                };
                
const showAddOnCallModal = () => {
  onCallModal.mode = 'add';
  onCallModal.form = {
    duty_date: new Date().toISOString().split('T')[0],
    shift_type: 'primary_call',  // ← CONFIRM THIS IS SET
    start_time: '08:00',
    end_time: '17:00',
    primary_physician_id: '',
    backup_physician_id: '',
    coverage_notes: 'emergency',
    schedule_id: `SCH-${Date.now().toString().slice(-6)}`
  };
  
  // ADD DEBUG:
  console.log('🔍 Modal opened with shift_type:', onCallModal.form.shift_type);
  
  onCallModal.show = true;
};
      

                
                const showAddAbsenceModal = () => {
                    absenceModal.mode = 'add';
                    absenceModal.form = {
                        staff_member_id: '',
                        absence_reason: 'vacation',
                        start_date: new Date().toISOString().split('T')[0],
                        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        status: 'active',
                        replacement_staff_id: '',
                        notes: ''
                    };
                    absenceModal.show = true;
                };
                
                const showCommunicationsModal = () => {
                    communicationsModal.show = true;
                    communicationsModal.activeTab = 'announcement';
                    communicationsModal.form = {
                        title: '',
                        content: '',
                        priority: 'normal',
                        target_audience: 'all_staff',
                        updateType: 'daily',
                        dailySummary: '',
                        highlight1: '',
                        highlight2: '',
                        alerts: {
                            erBusy: false,
                            icuFull: false,
                            wardFull: false,
                            staffShortage: false
                        },
                        metricName: '',
                        metricValue: '',
                        metricTrend: 'stable',
                        metricChange: '',
                        metricNote: '',
                        alertLevel: 'low',
                        alertMessage: '',
                        affectedAreas: {
                            er: false,
                            icu: false,
                            ward: false,
                            surgery: false
                        }
                    };
                };
                
                const showUserProfileModal = () => {
                    userProfileModal.form = {
                        full_name: currentUser.value?.full_name || '',
                        email: currentUser.value?.email || '',
                        department_id: currentUser.value?.department_id || ''
                    };
                    userProfileModal.show = true;
                    userMenuOpen.value = false;
                };
                
                // ============ 13. VIEW/EDIT FUNCTIONS ============
                
                const viewStaffDetails = (staff) => {
                    staffProfileModal.staff = staff;
                    staffProfileModal.activeTab = 'clinical';
                    staffProfileModal.show = true;
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
                
                // ============ 14. FIXED SAVE FUNCTIONS ============
                
const saveMedicalStaff = async () => {
    saving.value = true;
    try {
        // Prepare data with correct field names for server
        const staffData = {
            full_name: medicalStaffModal.form.full_name,
            staff_type: medicalStaffModal.form.staff_type,
            staff_id: medicalStaffModal.form.staff_id || EnhancedUtils.generateId('MD'),
            employment_status: medicalStaffModal.form.employment_status || 'active',
            professional_email: medicalStaffModal.form.professional_email,
            department_id: medicalStaffModal.form.department_id || null,
            academic_degree: medicalStaffModal.form.academic_degree || null,
            specialization: medicalStaffModal.form.specialization || null,
            // FIXED: Convert string to integer for database
            training_year: medicalStaffModal.form.resident_year ? 
                parseInt(medicalStaffModal.form.resident_year, 10) : null,
            clinical_certificate: medicalStaffModal.form.clinical_certificate || null,
            certificate_status: medicalStaffModal.form.certificate_status || null
        };
        
        if (medicalStaffModal.mode === 'add') {
            const result = await API.createMedicalStaff(staffData);
            medicalStaff.value.unshift(result);
            showToast('Success', 'Medical staff added successfully', 'success');
        } else {
            const result = await API.updateMedicalStaff(medicalStaffModal.form.id, staffData);
            const index = medicalStaff.value.findIndex(s => s.id === result.id);
            if (index !== -1) medicalStaff.value[index] = result;
            showToast('Success', 'Medical staff updated successfully', 'success');
        }
        medicalStaffModal.show = false;
        updateDashboardStats();
    } catch (error) {
        console.error('Save medical staff error:', error);
        showToast('Error', error.message || 'Failed to save medical staff', 'error');
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
                        updateDashboardStats();
                    } catch (error) {
                        showToast('Error', error.message, 'error');
                    } finally {
                        saving.value = false;
                    }
                };
                
                const saveRotation = async () => {
                    if (!rotationModal.form.resident_id) {
                        showToast('Error', 'Please select a resident', 'error');
                        return;
                    }
                    
                    if (!rotationModal.form.training_unit_id) {
                        showToast('Error', 'Please select a training unit', 'error');
                        return;
                    }
                    
                    if (!rotationModal.form.rotation_start_date) {
                        showToast('Error', 'Please enter a start date', 'error');
                        return;
                    }
                    
                    if (!rotationModal.form.rotation_end_date) {
                        showToast('Error', 'Please enter an end date', 'error');
                        return;
                    }
                    
                    const start = new Date(rotationModal.form.rotation_start_date);
                    const end = new Date(rotationModal.form.rotation_end_date);
                    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                        showToast('Error', 'Invalid date format. Please use YYYY-MM-DD', 'error');
                        return;
                    }
                    
                    if (end <= start) {
                        showToast('Error', 'End date must be after start date', 'error');
                        return;
                    }
                    
                    saving.value = true;
                    
                    try {
                        // FIXED: Send data with correct field names that server expects
                        const rotationData = {
                            rotation_id: rotationModal.form.rotation_id || EnhancedUtils.generateId('ROT'),
                            resident_id: rotationModal.form.resident_id,
                            training_unit_id: rotationModal.form.training_unit_id,
                            supervising_attending_id: rotationModal.form.supervising_attending_id || null,
                            // FIXED: Use exact field names from server schema
                            start_date: rotationModal.form.rotation_start_date,  // ✅
                            end_date: rotationModal.form.rotation_end_date,      // ✅
                            rotation_category: rotationModal.form.rotation_category.toLowerCase(),
                            rotation_status: rotationModal.form.rotation_status.toLowerCase()
                        };
                        
                        console.log('📤 Sending rotation data to server:', rotationData);
                        
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
                        await loadRotations();
                        updateDashboardStats();
                        
                    } catch (error) {
                        console.error('❌ Rotation save error:', error);
                        showToast('Error', error.message || 'Failed to save rotation', 'error');
                    } finally {
                        saving.value = false;
                    }
                };
    const saveOnCallSchedule = async () => {
    saving.value = true;
    try {
        // ADD THIS DEBUG LINE:
        console.log('🔍 DEBUG - Sending on-call data:', onCallModal.form);
        
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
        loadTodaysOnCall();
    } catch (error) {
        showToast('Error', error.message, 'error');
    } finally {
        saving.value = false;
    }
};
                
                const saveAbsence = async () => {
                    saving.value = true;
                    try {
                        // Prepare data with correct field names for server
                        const absenceData = {
                            staff_member_id: absenceModal.form.staff_member_id,
                            absence_reason: absenceModal.form.absence_reason,
                            start_date: absenceModal.form.start_date,
                            end_date: absenceModal.form.end_date,
                            status: absenceModal.form.status || 'pending',
                            replacement_staff_id: absenceModal.form.replacement_staff_id || null,
                            notes: absenceModal.form.notes || ''
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
                        updateDashboardStats();
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
                            const result = await API.createAnnouncement({
                                title: communicationsModal.form.title,
                                content: communicationsModal.form.content,
                                priority_level: communicationsModal.form.priority,
                                target_audience: communicationsModal.form.target_audience,
                                type: 'announcement'
                            });
                            
                            announcements.value.unshift(result);
                            showToast('Success', 'Announcement posted successfully', 'success');
                        } else {
                            await saveClinicalStatus();
                        }
                        
                        communicationsModal.show = false;
                    } catch (error) {
                        showToast('Error', error.message, 'error');
                    } finally {
                        saving.value = false;
                    }
                };
                
                const saveUserProfile = async () => {
                    saving.value = true;
                    try {
                        currentUser.value.full_name = userProfileModal.form.full_name;
                        currentUser.value.department_id = userProfileModal.form.department_id;
                        localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(currentUser.value));
                        
                        userProfileModal.show = false;
                        showToast('Success', 'Profile updated successfully', 'success');
                    } catch (error) {
                        showToast('Error', error.message, 'error');
                    } finally {
                        saving.value = false;
                    }
                };
                
                // ============ 15. ACTION FUNCTIONS ============
                
                const contactPhysician = (shift) => {
                    if (shift.contactInfo && shift.contactInfo !== 'No contact info') {
                        showToast('Contact Physician', 
                            `Would contact ${shift.physicianName} via ${shift.contactInfo.includes('@') ? 'email' : 'phone'}`, 
                            'info');
                    } else {
                        showToast('No Contact Info', 
                            `No contact information available for ${shift.physicianName}`, 
                            'warning');
                    }
                };
                
                const viewAnnouncement = (announcement) => {
                    showToast(announcement.title, EnhancedUtils.truncateText(announcement.content, 100), 'info');
                };
                
                const viewDepartmentStaff = (department) => {
                    showToast('Department Staff', `Viewing staff for ${department.name}`, 'info');
                };
                
                const viewUnitResidents = (unit) => {
                    showToast('Unit Residents', `Viewing residents for ${unit.unit_name}`, 'info');
                };
                
                // ============ 16. PERMISSION FUNCTIONS ============
                
                const hasPermission = (module, action = 'read') => {
                    const role = currentUser.value?.user_role;
                    if (!role) return false;
                    
                    if (role === 'system_admin') return true;
                    
                    const permissions = PERMISSION_MATRIX[role]?.[module];
                    if (!permissions) return false;
                    
                    return permissions.includes(action) || permissions.includes('*');
                };
                
                // ============ 17. COMPUTED PROPERTIES ============
                
                const authToken = computed(() => {
                    return localStorage.getItem(CONFIG.TOKEN_KEY);
                });
                
                const unreadAnnouncements = computed(() => {
                    return announcements.value.filter(a => !a.read).length;
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
                
                const availableAttendings = computed(() => {
                    return medicalStaff.value.filter(staff => 
                        staff.staff_type === 'attending_physician' && 
                        staff.employment_status === 'active'
                    );
                });
                
                const availableHeadsOfDepartment = computed(() => {
                    return availableAttendings.value;
                });
                
                const availableReplacementStaff = computed(() => {
                    return medicalStaff.value.filter(staff => 
                        staff.employment_status === 'active' && 
                        staff.staff_type === 'medical_resident'
                    );
                });
                
                const filteredMedicalStaff = computed(() => {
                    let filtered = medicalStaff.value;
                    
                    if (staffFilters.search) {
                        const search = staffFilters.search.toLowerCase();
                        filtered = filtered.filter(staff =>
                            staff.full_name?.toLowerCase().includes(search) ||
                            staff.staff_id?.toLowerCase().includes(search) ||
                            staff.professional_email?.toLowerCase().includes(search)
                        );
                    }
                    
                    if (staffFilters.staffType) {
                        filtered = filtered.filter(staff => staff.staff_type === staffFilters.staffType);
                    }
                    
                    if (staffFilters.department) {
                        filtered = filtered.filter(staff => staff.department_id === staffFilters.department);
                    }
                    
                    if (staffFilters.status) {
                        filtered = filtered.filter(staff => staff.employment_status === staffFilters.status);
                    }
                    
                    return filtered;
                });
                
                const filteredOnCallSchedules = computed(() => {
                    let filtered = onCallSchedule.value;
                    
                    if (onCallFilters.date) {
                        filtered = filtered.filter(schedule => schedule.duty_date === onCallFilters.date);
                    }
                    
                    if (onCallFilters.shiftType) {
                        filtered = filtered.filter(schedule => schedule.shift_type === onCallFilters.shiftType);
                    }
                    
                    if (onCallFilters.physician) {
                        filtered = filtered.filter(schedule =>
                            schedule.primary_physician_id === onCallFilters.physician ||
                            schedule.backup_physician_id === onCallFilters.physician
                        );
                    }
                    
                    if (onCallFilters.coverageArea) {
                        filtered = filtered.filter(schedule => schedule.coverage_area === onCallFilters.coverageArea);
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
                    
                    if (rotationFilters.trainingUnit) {
                        filtered = filtered.filter(rotation => rotation.training_unit_id === rotationFilters.trainingUnit);
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
                        filtered = filtered.filter(absence => absence.status === absenceFilters.status);
                    }
                    
                    if (absenceFilters.reason) {
                        filtered = filtered.filter(absence => absence.absence_reason === absenceFilters.reason);
                    }
                    
                    if (absenceFilters.startDate) {
                        filtered = filtered.filter(absence => absence.start_date >= absenceFilters.startDate);
                    }
                    
                    return filtered;
                });
                
                const recentAnnouncements = computed(() => {
                    return announcements.value.slice(0, 10);
                });
                
                // ============ 18. LIFECYCLE ============
                
                onMounted(() => {
                    console.log('🚀 Vue app mounted');
                    
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
                    
                    document.addEventListener('keydown', (e) => {
                        if (e.key === 'Escape') {
                            const openModals = [
                                medicalStaffModal,
                                departmentModal,
                                trainingUnitModal,
                                rotationModal,
                                onCallModal,
                                absenceModal,
                                communicationsModal,
                                staffProfileModal,
                                userProfileModal,
                                confirmationModal
                            ];
                            
                            openModals.forEach(modal => {
                                if (modal.show) modal.show = false;
                            });
                        }
                    });
                });
                
                onUnmounted(() => {
                    // Clean up intervals
                    document.removeEventListener('keydown', () => {});
                });
                
                watch([medicalStaff, rotations, trainingUnits, absences], 
                    () => {
                        updateDashboardStats();
                    }, 
                    { deep: true }
                );
                
                // ============ 19. RETURN EXPOSED DATA/METHODS ============
                return {
                    // State
                    currentUser,
                    loginForm,
                    loginLoading,
                    loading,
                    saving,
                    loadingSchedule,
                    isLoadingStatus,
                    
                    currentView,
                    sidebarCollapsed,
                    mobileMenuOpen,
                    userMenuOpen,
                    statsSidebarOpen,
                    globalSearchQuery,
                    
                    // Data
                    medicalStaff,
                    departments,
                    trainingUnits,
                    rotations,
                    absences,
                    onCallSchedule,
                    announcements,
                    
                    // Live Status Data
                    clinicalStatus,
                    newStatusText,
                    selectedAuthorId,
                    expiryHours,
                    activeMedicalStaff,
                    liveStatsEditMode,
                    
                    // Dashboard
                    systemStats,
                    todaysOnCall,
                    todaysOnCallCount,
                    
                    // UI
                    toasts,
                    systemAlerts,
                    
                    // Filters
                    staffFilters,
                    onCallFilters,
                    rotationFilters,
                    absenceFilters,
                    
                    // Modals
                    staffProfileModal,
                    medicalStaffModal,
                    communicationsModal,
                    onCallModal,
                    rotationModal,
                    trainingUnitModal,
                    absenceModal,
                    departmentModal,
                    userProfileModal,
                    confirmationModal,
                    
                    // Core Functions
                    formatDate: EnhancedUtils.formatDate,
                    formatDateTime: EnhancedUtils.formatDateTime,
                    formatTime: EnhancedUtils.formatTime,
                    formatRelativeTime: EnhancedUtils.formatRelativeTime,
                    getInitials: EnhancedUtils.getInitials,
                    formatStaffType,
                    getStaffTypeClass,
                    formatEmploymentStatus,
                    formatAbsenceReason,
                    formatAbsenceStatus,
                    formatRotationStatus,
                    getUserRoleDisplay,
                    getCurrentViewTitle,
                    getCurrentViewSubtitle,
                    getSearchPlaceholder,
                    
                    // Helper Functions
                    getDepartmentName,
                    getStaffName,
                    getTrainingUnitName,
                    getSupervisorName,
                    getPhysicianName,
                    getResidentName,
                    getDepartmentUnits,
                    getDepartmentStaffCount,
                    getCurrentRotationForStaff,
                    calculateAbsenceDuration,
                    
                    // Live Status Functions
                    loadClinicalStatus,
                    loadActiveMedicalStaff,
                    saveClinicalStatus,
                    isStatusExpired,
                    showCreateStatusModal,
                    
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
                    toggleStatsSidebar,
                    handleGlobalSearch,
                    
                    // Modal Show Functions
                    showAddMedicalStaffModal,
                    showAddDepartmentModal,
                    showAddTrainingUnitModal,
                    showAddRotationModal,
                    showAddOnCallModal,
                    showAddAbsenceModal,
                    showCommunicationsModal,
                    showUserProfileModal,
                    
                    // View/Edit Functions
                    viewStaffDetails,
                    editMedicalStaff,
                    editDepartment,
                    editTrainingUnit,
                    editRotation,
                    editOnCallSchedule,
                    editAbsence,
                    
                    // Action Functions
                    contactPhysician,
                    viewAnnouncement,
                    viewDepartmentStaff,
                    viewUnitResidents,
                    
                    // Save Functions
                    saveMedicalStaff,
                    saveDepartment,
                    saveTrainingUnit,
                    saveRotation,
                    saveOnCallSchedule,
                    saveAbsence,
                    saveCommunication,
                    saveUserProfile,
                    
                    // Permission Functions
                    hasPermission,
                    
                    // Computed Properties
                    authToken,
                    unreadAnnouncements,
                    availablePhysicians,
                    availableResidents,
                    availableAttendings,
                    availableHeadsOfDepartment,
                    availableReplacementStaff,
                    filteredMedicalStaff,
                    filteredOnCallSchedules,
                    filteredRotations,
                    filteredAbsences,
                    recentAnnouncements
                };
            }
        });
        
        // ============ 20. MOUNT APP ============
        app.mount('#app');
        
        console.log('✅ NeumoCare v8.0 mounted successfully - 100% FIXED VERSION!');
        
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
