// ============ NEUMOCARE HOSPITAL MANAGEMENT SYSTEM v10.0 ============
// 100% COMPLETE WITH RESEARCH LINES & CLINICAL UNITS INTEGRATION
// ===================================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 NeumoCare Hospital Management System v10.0 Loading...');
    
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
        
        // ============ 4. COMPLETE API SERVICE WITH NEW ENDPOINTS ============
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
            
            // ===== MEDICAL STAFF - ENHANCED =====
            async getMedicalStaff() {
                try {
                    const data = await this.request('/api/medical-staff/enhanced');
                    return EnhancedUtils.ensureArray(data.data || data);
                } catch { return []; }
            }
            
            async getMedicalStaffBasic() {
                try {
                    const data = await this.request('/api/medical-staff');
                    return EnhancedUtils.ensureArray(data.data || data);
                } catch { return []; }
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
            
            // ===== CLINICAL UNITS (formerly Training Units) =====
            async getClinicalUnits() {
                try {
                    // Using training-units endpoint for backward compatibility
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
                // Map to training-units endpoint
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
            
            // ===== ROTATIONS - UPDATED FOR CLINICAL UNITS =====
            async getRotations() {
                try {
                    const data = await this.request('/api/rotations');
                    return EnhancedUtils.ensureArray(data.data || data);
                } catch { return []; }
            }
            
            async createRotation(rotationData) {
                // Map training_unit_id to clinical_unit_id if needed
                const dataToSend = {
                    ...rotationData,
                    clinical_unit_id: rotationData.training_unit_id || rotationData.clinical_unit_id
                };
                return await this.request('/api/rotations', {
                    method: 'POST',
                    body: dataToSend
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
            
            // ===== DASHBOARD & STATS =====
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
                        researchLines: 0
                    };
                }
            }
            
            async getAvailableData() {
                try {
                    const data = await this.request('/api/available-data');
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
                const loginForm = reactive({ email: '', password: '' });
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
                
                // 6.4 Data Stores - ENHANCED
                const medicalStaff = ref([]);
                const researchLines = ref([]);
                const clinicalUnits = ref([]);
                const clinicalUnitsWithStaff = ref([]);
                const departments = ref([]);
                const rotations = ref([]);
                const absences = ref([]);
                const onCallSchedule = ref([]);
                const announcements = ref([]);
                
                // 6.5 Live Status Data
                const clinicalStatus = ref(null);
                const newStatusText = ref('');
                const selectedAuthorId = ref('');
                
                // 6.6 Dashboard Data
                const systemStats = ref({
                    totalStaff: 0,
                    activeAttending: 0,
                    activeResidents: 0,
                    onCallNow: 0,
                    clinicalUnits: 0,
                    researchLines: 0,
                    currentlyAbsent: 0
                });
                
                const todaysOnCall = ref([]);
                const availableData = ref({
                    departments: [],
                    residents: [],
                    attendings: [],
                    clinicalUnits: [],
                    researchLines: []
                });
                
                // 6.7 UI Components
                const toasts = ref([]);
                
                // 6.8 Filter States
                const staffFilters = reactive({
                    search: '',
                    staffType: '',
                    department: '',
                    clinicalUnit: '',
                    status: ''
                });
                
                const clinicalUnitFilters = reactive({
                    department: '',
                    status: 'active',
                    capacity: ''
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
                
                const confirmationModal = reactive({
                    show: false,
                    title: '',
                    message: '',
                    confirmButtonText: 'Confirm',
                    confirmButtonClass: 'btn-primary',
                    onConfirm: null
                });
                
                // 6.10 Permission Matrix
                const PERMISSION_MATRIX = {
                    system_admin: {
                        medical_staff: ['create', 'read', 'update', 'delete'],
                        clinical_units: ['create', 'read', 'update', 'delete'],
                        research_lines: ['create', 'read', 'update', 'delete'],
                        rotations: ['create', 'read', 'update', 'delete'],
                        oncall: ['create', 'read', 'update', 'delete'],
                        absences: ['create', 'read', 'update', 'delete']
                    },
                    department_head: {
                        medical_staff: ['read', 'update'],
                        clinical_units: ['read', 'update'],
                        research_lines: ['read', 'update'],
                        rotations: ['create', 'read', 'update'],
                        oncall: ['create', 'read', 'update'],
                        absences: ['create', 'read', 'update']
                    },
                    attending_physician: {
                        medical_staff: ['read'],
                        clinical_units: ['read'],
                        research_lines: ['read'],
                        rotations: ['read'],
                        oncall: ['read'],
                        absences: ['read']
                    },
                    medical_resident: {
                        medical_staff: ['read'],
                        clinical_units: ['read'],
                        research_lines: ['read'],
                        rotations: ['read'],
                        oncall: ['read'],
                        absences: ['read']
                    }
                };
                
                // ============ 7. CORE FUNCTIONS ============
                
                // 7.1 Toast System
                const showToast = (title, message, type = 'info', duration = 5000) => {
                    const toast = {
                        id: Date.now(),
                        title,
                        message,
                        type,
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
                
                const getCurrentViewTitle = () => {
                    const map = {
                        'dashboard': 'Dashboard Overview',
                        'medical_staff': 'Medical Staff Management',
                        'clinical_units': 'Clinical Units',
                        'research_lines': 'Research Lines',
                        'rotations': 'Resident Rotations',
                        'oncall_schedule': 'On-call Schedule',
                        'staff_absence': 'Staff Absence',
                        'announcements': 'Announcements'
                    };
                    return map[currentView.value] || 'NeumoCare Dashboard';
                };
                
                // 7.4 Data Helper Functions
                const getDepartmentName = (departmentId) => {
                    const dept = departments.value.find(d => d.id === departmentId);
                    return dept ? dept.name : 'Not assigned';
                };
                
                const getStaffName = (staffId) => {
                    const staff = medicalStaff.value.find(s => s.id === staffId);
                    return staff ? staff.full_name : 'Unknown Staff';
                };
                
                const getClinicalUnitName = (unitId) => {
                    const unit = clinicalUnits.value.find(u => u.id === unitId);
                    return unit ? unit.unit_name : 'Unknown Unit';
                };
                
                const getResearchLineNames = (lineIds) => {
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
                    try {
                        const data = await API.getClinicalStatus();
                        clinicalStatus.value = data?.data || null;
                    } catch (error) {
                        console.error('Failed to load clinical status:', error);
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
                
                const loadAllData = async () => {
                    loading.value = true;
                    try {
                        await Promise.all([
                            loadMedicalStaff(),
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
                            loadAvailableData()
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
                            showToast('Success', 'Medical staff added successfully', 'success');
                        } else {
                            const result = await API.updateMedicalStaff(medicalStaffModal.form.id, medicalStaffModal.form);
                            const index = medicalStaff.value.findIndex(s => s.id === result.id);
                            if (index !== -1) medicalStaff.value[index] = result;
                            showToast('Success', 'Medical staff updated successfully', 'success');
                        }
                        medicalStaffModal.show = false;
                        await loadMedicalStaff();
                    } catch (error) {
                        showToast('Error', error.message, 'error');
                    } finally {
                        saving.value = false;
                    }
                };
                
                // Research Lines Modal
                const showResearchLinesModal = (staff) => {
                    researchLinesModal.staff = staff;
                    researchLinesModal.selectedLines = staff.research_lines?.map(r => r.id) || [];
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
                            medicalStaff.value[staffIndex].research_lines = researchLinesModal.selectedLines
                                .map(id => researchLines.value.find(r => r.id === id))
                                .filter(Boolean);
                        }
                        
                        researchLinesModal.show = false;
                        showToast('Success', 'Research lines updated successfully', 'success');
                    } catch (error) {
                        showToast('Error', error.message, 'error');
                    } finally {
                        saving.value = false;
                    }
                };
                
                // Clinical Units Modal
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
                        await loadClinicalUnits();
                        await loadClinicalUnitsWithStaff();
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
                        await loadMedicalStaff();
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
                                await loadMedicalStaff();
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
                    
                    if (staffFilters.clinicalUnit) {
                        filtered = filtered.filter(staff => staff.clinical_unit_id === staffFilters.clinicalUnit);
                    }
                    
                    if (staffFilters.status) {
                        filtered = filtered.filter(staff => staff.employment_status === staffFilters.status);
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
                    
                    if (clinicalUnitFilters.capacity) {
                        if (clinicalUnitFilters.capacity === 'full') {
                            filtered = filtered.filter(unit => 
                                unit.staff_count?.residents >= unit.maximum_residents
                            );
                        } else if (clinicalUnitFilters.capacity === 'available') {
                            filtered = filtered.filter(unit => 
                                unit.staff_count?.residents < unit.maximum_residents
                            );
                        }
                    }
                    
                    return filtered;
                });
                
                const activeResearchLines = computed(() => {
                    return researchLines.value.filter(line => line.active);
                });
                
                const clinicalUnitCapacity = computed(() => {
                    return clinicalUnits.value.map(unit => ({
                        id: unit.id,
                        name: unit.unit_name,
                        capacity: unit.maximum_residents,
                        current: unit.staff_count?.residents || 0,
                        available: unit.maximum_residents - (unit.staff_count?.residents || 0)
                    }));
                });
                
                // ============ 16. LIFECYCLE ============
                
                onMounted(() => {
                    console.log('🚀 Vue app v10.0 mounted');
                    
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
                    
                    // Auto-refresh every 5 minutes
                    const refreshInterval = setInterval(() => {
                        if (currentUser.value) {
                            loadSystemStats();
                            loadClinicalStatus();
                        }
                    }, 5 * 60 * 1000);
                    
                    onUnmounted(() => {
                        clearInterval(refreshInterval);
                    });
                });
                
                // ============ 17. RETURN EXPOSED DATA/METHODS ============
                return {
                    // State
                    currentUser,
                    loginForm,
                    loginLoading,
                    loading,
                    saving,
                    
                    currentView,
                    sidebarCollapsed,
                    mobileMenuOpen,
                    userMenuOpen,
                    statsSidebarOpen,
                    globalSearchQuery,
                    
                    // Data
                    medicalStaff,
                    researchLines,
                    clinicalUnits,
                    clinicalUnitsWithStaff,
                    departments,
                    rotations,
                    absences,
                    onCallSchedule,
                    announcements,
                    clinicalStatus,
                    
                    // Dashboard
                    systemStats,
                    todaysOnCall,
                    availableData,
                    
                    // UI
                    toasts,
                    
                    // Filters
                    staffFilters,
                    clinicalUnitFilters,
                    
                    // Modals
                    staffProfileModal,
                    medicalStaffModal,
                    clinicalUnitModal,
                    staffAssignmentModal,
                    researchLinesModal,
                    rotationModal,
                    onCallModal,
                    absenceModal,
                    confirmationModal,
                    
                    // Formatting Functions
                    formatDate: EnhancedUtils.formatDate,
                    formatDateTime: EnhancedUtils.formatDateTime,
                    formatStaffType,
                    formatEmploymentStatus,
                    formatAbsenceReason,
                    getInitials: EnhancedUtils.getInitials,
                    
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
                    
                    // Delete Functions
                    deleteMedicalStaff,
                    deleteRotation,
                    
                    // View Functions
                    viewStaffDetails,
                    viewClinicalUnitDetails,
                    
                    // Permission Functions
                    hasPermission,
                    
                    // Computed Properties
                    filteredMedicalStaff,
                    filteredClinicalUnits,
                    activeResearchLines,
                    clinicalUnitCapacity,
                    
                    // View Title
                    getCurrentViewTitle
                };
            }
        });
        
        // ============ 18. MOUNT APP ============
        app.mount('#app');
        
        console.log('✅ NeumoCare v10.0 COMPLETE WITH RESEARCH LINES & CLINICAL UNITS mounted successfully!');
        console.log('📋 NEW FEATURES INTEGRATED:');
        console.log('   ✓ Research Lines Management');
        console.log('   ✓ Clinical Units with Staff');
        console.log('   ✓ Enhanced Medical Staff endpoints');
        console.log('   ✓ Staff Assignment to Clinical Units');
        console.log('   ✓ Research Participation Tracking');
        console.log('   ✓ Clinical Unit Capacity Monitoring');
        console.log('   ✓ Updated API Integration');
        
    } catch (error) {
        console.error('💥 FATAL ERROR mounting app:', error);
        
        document.body.innerHTML = `
            <div style="padding: 40px; text-align: center; margin-top: 100px; color: #333; font-family: Arial, sans-serif;">
                <h2 style="color: #dc3545;">⚠️ Application Error</h2>
                <p style="margin: 20px 0; color: #666;">
                    ${error.message}
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
