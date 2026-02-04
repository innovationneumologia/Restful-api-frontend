// ============ NEUMOCARE HOSPITAL MANAGEMENT SYSTEM v10.0 COMPLETE ============
// 100% ALIGNED WITH BACKEND API - NO MISSING MODALS
// =============================================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 NeumoCare Hospital Management System v10.0 loading...');
    
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
            API_BASE_URL: window.location.hostname.includes('localhost') 
                ? 'http://localhost:3000' 
                : 'https://neumac.up.railway.app',
            TOKEN_KEY: 'neumocare_token',
            USER_KEY: 'neumocare_user',
            APP_VERSION: '10.0',
            DEBUG: true
        };
        
        // ============ 3. UTILITIES ============
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
        }
        
        // ============ 4. API SERVICE (ALIGNED WITH BACKEND) ============
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
                    
                    if (CONFIG.DEBUG) console.log(`🌐 ${config.method} ${url}`);
                    
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
                        const data = await response.json();
                        if (CONFIG.DEBUG) console.log(`✅ ${endpoint} response:`, data);
                        return data;
                    }
                    
                    return await response.text();
                    
                } catch (error) {
                    if (CONFIG.DEBUG) console.error(`❌ API ${endpoint} failed:`, error);
                    throw error;
                }
            }
            
            // ===== AUTHENTICATION =====
            async login(email, password) {
                return await this.request('/api/auth/login', {
                    method: 'POST',
                    body: { email, password }
                });
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
                const data = await this.request('/api/medical-staff');
                return EnhancedUtils.ensureArray(data.data || data);
            }
            
            async getEnhancedMedicalStaff() {
                try {
                    const data = await this.request('/api/medical-staff/enhanced');
                    return EnhancedUtils.ensureArray(data.data || data);
                } catch (error) {
                    console.log('Falling back to regular medical staff endpoint');
                    return this.getMedicalStaff();
                }
            }
            
            async getMedicalStaffById(id) {
                return await this.request(`/api/medical-staff/${id}`);
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
                const data = await this.request('/api/research-lines');
                return EnhancedUtils.ensureArray(data.data || data);
            }
            
            async getStaffResearchLines(staffId) {
                const data = await this.request(`/api/medical-staff/${staffId}/research-lines`);
                return EnhancedUtils.ensureArray(data.data || data);
            }
            
            async updateStaffResearchLines(staffId, researchLineIds) {
                return await this.request(`/api/medical-staff/${staffId}/research-lines`, {
                    method: 'PUT',
                    body: { research_line_ids: researchLineIds }
                });
            }
            
            // ===== CLINICAL UNITS =====
            async getTrainingUnits() {
                const data = await this.request('/api/training-units');
                return EnhancedUtils.ensureArray(data);
            }
            
            async getClinicalUnitsWithStaff() {
                const data = await this.request('/api/clinical-units/with-staff');
                return EnhancedUtils.ensureArray(data.data || data);
            }
            
            async getClinicalUnitStaff(unitId) {
                const data = await this.request(`/api/clinical-units/${unitId}/staff`);
                return EnhancedUtils.ensureArray(data.data || data);
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
            
            // ===== DEPARTMENTS =====
            async getDepartments() {
                const data = await this.request('/api/departments');
                return EnhancedUtils.ensureArray(data);
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
                const data = await this.request('/api/rotations');
                return EnhancedUtils.ensureArray(data.data || data);
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
                const data = await this.request('/api/oncall');
                return EnhancedUtils.ensureArray(data);
            }
            
            async getOnCallToday() {
                const data = await this.request('/api/oncall/today');
                return EnhancedUtils.ensureArray(data);
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
                const data = await this.request('/api/absence-records');
                return EnhancedUtils.ensureArray(data.data || data);
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
                const data = await this.request('/api/announcements');
                return EnhancedUtils.ensureArray(data);
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
                return await this.request('/api/live-status/current');
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
                } catch (error) {
                    console.log('Using fallback stats');
                    return this.getFallbackStats();
                }
            }
            
            async getFallbackStats() {
                return {
                    totalStaff: 0,
                    activeAttending: 0,
                    activeResidents: 0,
                    onCallNow: 0,
                    clinicalUnits: 0,
                    researchLines: 0,
                    currentlyAbsent: 0,
                    activeRotations: 0,
                    departmentStatus: 'normal'
                };
            }
            
            // ===== AVAILABLE DATA =====
            async getAvailableData() {
                try {
                    const data = await this.request('/api/available-data');
                    return data.data || data;
                } catch (error) {
                    return {};
                }
            }
            
            // ===== REPORTS =====
            async getStaffDistributionReport() {
                return await this.request('/api/reports/staff-distribution');
            }
            
            async getRotationSummaryReport() {
                return await this.request('/api/reports/rotation-summary');
            }
            
            async getResearchParticipationReport() {
                return await this.request('/api/reports/research-participation');
            }
            
            async getStaffByClinicalUnitReport() {
                return await this.request('/api/reports/staff-by-clinical-unit');
            }
            
            // ===== USER MANAGEMENT =====
            async getUserProfile() {
                return await this.request('/api/users/profile');
            }
            
            async updateUserProfile(profileData) {
                return await this.request('/api/users/profile', {
                    method: 'PUT',
                    body: profileData
                });
            }
        }
        
        // Initialize API Service
        const API = new ApiService();
        
        // ============ 5. CREATE VUE APP ============
        const app = createApp({
            setup() {
                // ============ 6. INITIALIZE ALL REACTIVE OBJECTS FIRST ============
                
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
                
                // ============ 7. INITIALIZE ALL MODAL OBJECTS (CRITICAL FIX) ============
                
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
                
                // ============ FIX: CONFIRMATION MODAL MUST BE INITIALIZED ============
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
                
                // ============ 8. HELPER FUNCTIONS ============
                
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
                
                // ============ 9. CONFIRMATION MODAL FUNCTIONS ============
                
                const showConfirmation = (options) => {
                    Object.assign(confirmationModal, {
                        show: true,
                        title: options.title || 'Confirm Action',
                        message: options.message || 'Are you sure?',
                        icon: options.icon || 'fa-question-circle',
                        confirmButtonText: options.confirmButtonText || 'Confirm',
                        confirmButtonClass: options.confirmButtonClass || 'btn-primary',
                        cancelButtonText: options.cancelButtonText || 'Cancel',
                        onConfirm: options.onConfirm || null,
                        details: options.details || ''
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
                
                // ============ 10. FORMATTING FUNCTIONS ============
                
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
                
                const getUserRoleDisplay = (role) => {
                    const map = {
                        'system_admin': 'System Administrator',
                        'department_head': 'Department Head',
                        'attending_physician': 'Attending Physician',
                        'medical_resident': 'Medical Resident'
                    };
                    return map[role] || role;
                };
                
                // ============ 11. DATA LOADING FUNCTIONS ============
                
                const loadAllData = async () => {
                    loading.value = true;
                    try {
                        const promises = [
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
                        ];
                        
                        await Promise.all(promises);
                        showToast('Success', 'System data loaded successfully', 'success');
                    } catch (error) {
                        console.error('Failed to load data:', error);
                        showToast('Error', 'Failed to load some data', 'error');
                    } finally {
                        loading.value = false;
                    }
                };
                
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
                    }
                };
                
                const loadClinicalUnits = async () => {
                    try {
                        const data = await API.getTrainingUnits();
                        clinicalUnits.value = data;
                    } catch (error) {
                        console.error('Failed to load clinical units:', error);
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
                
                // ============ 12. AUTHENTICATION ============
                
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
                
                // ============ 13. MODAL FUNCTIONS ============
                
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
                        await loadSystemStats();
                    } catch (error) {
                        showToast('Error', error.message, 'error');
                    } finally {
                        saving.value = false;
                    }
                };
                
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
                
                const saveClinicalUnit = async () => {
                    saving.value = true;
                    try {
                        if (clinicalUnitModal.mode === 'add') {
                            const result = await API.createTrainingUnit(clinicalUnitModal.form);
                            clinicalUnits.value.unshift(result);
                            showToast('Success', 'Clinical unit created successfully', 'success');
                        } else {
                            const result = await API.updateTrainingUnit(clinicalUnitModal.form.id, clinicalUnitModal.form);
                            const index = clinicalUnits.value.findIndex(u => u.id === result.id);
                            if (index !== -1) clinicalUnits.value[index] = result;
                            showToast('Success', 'Clinical unit updated successfully', 'success');
                        }
                        clinicalUnitModal.show = false;
                        await loadClinicalUnitsWithStaff();
                    } catch (error) {
                        showToast('Error', error.message, 'error');
                    } finally {
                        saving.value = false;
                    }
                };
                
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
                    } catch (error) {
                        showToast('Error', error.message, 'error');
                    } finally {
                        saving.value = false;
                    }
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
                        coverage_notes: ''
                    };
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
                
                // ============ 14. LIVE STATUS FUNCTIONS ============
                
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
                
                // ============ 15. DELETE FUNCTIONS ============
                
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
                
                // ============ 16. NAVIGATION ============
                
                const switchView = (view) => {
                    currentView.value = view;
                    mobileMenuOpen.value = false;
                };
                
                // ============ 17. COMPUTED PROPERTIES ============
                
                const filteredMedicalStaff = computed(() => {
                    let filtered = enhancedMedicalStaff.value;
                    
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
                
                const filteredClinicalUnits = computed(() => {
                    let filtered = clinicalUnitsWithStaff.value;
                    
                    if (clinicalUnitFilters.search) {
                        const search = clinicalUnitFilters.search.toLowerCase();
                        filtered = filtered.filter(unit =>
                            unit.unit_name?.toLowerCase().includes(search) ||
                            unit.unit_code?.toLowerCase().includes(search)
                        );
                    }
                    
                    if (clinicalUnitFilters.status) {
                        filtered = filtered.filter(unit => unit.unit_status === clinicalUnitFilters.status);
                    }
                    
                    return filtered;
                });
                
                const activeResearchLines = computed(() => {
                    return researchLines.value.filter(line => line.active);
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
                
                // ============ 18. LIFECYCLE ============
                
                onMounted(() => {
                    console.log('🚀 Vue app v10.0 mounted');
                    
                    // Debug: Check all modal objects are initialized
                    console.log('✅ Modals initialized:', {
                        staffProfileModal,
                        medicalStaffModal,
                        confirmationModal,
                        clinicalUnitModal,
                        reportsModal
                    });
                    
                    const token = localStorage.getItem(CONFIG.TOKEN_KEY);
                    const user = localStorage.getItem(CONFIG.USER_KEY);
                    
                    if (token && user) {
                        try {
                            currentUser.value = JSON.parse(user);
                            loadAllData();
                            currentView.value = 'dashboard';
                        } catch (error) {
                            console.error('Failed to restore session:', error);
                            currentView.value = 'login';
                        }
                    } else {
                        currentView.value = 'login';
                    }
                    
                    // Auto-refresh
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
                
                // ============ 19. RETURN STATEMENT (MUST INCLUDE ALL) ============
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
                    
                    // ============ ALL MODALS (CRITICAL) ============
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
                    confirmationModal, // <-- THIS WAS MISSING
                    
                    // Core Functions
                    formatDate: EnhancedUtils.formatDate,
                    formatDateTime: EnhancedUtils.formatDateTime,
                    getInitials: EnhancedUtils.getInitials,
                    truncateText: EnhancedUtils.truncateText,
                    formatStaffType,
                    getStaffTypeClass,
                    formatEmploymentStatus,
                    formatAbsenceReason,
                    getCurrentViewTitle,
                    getUserRoleDisplay,
                    
                    // Helper Functions
                    getDepartmentName: (id) => {
                        const dept = departments.value.find(d => d.id === id);
                        return dept ? dept.name : 'Not assigned';
                    },
                    getStaffName: (id) => {
                        const staff = medicalStaff.value.find(s => s.id === id);
                        return staff ? staff.full_name : 'Not assigned';
                    },
                    
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
                    saveClinicalUnit,
                    showAddRotationModal,
                    saveRotation,
                    showAddOnCallModal,
                    saveOnCallSchedule,
                    showAddAbsenceModal,
                    saveAbsence,
                    showAddAnnouncementModal,
                    saveAnnouncement,
                    showAddDepartmentModal,
                    saveDepartment,
                    showReportsModal,
                    
                    // Live Status Functions
                    saveClinicalStatus,
                    deleteClinicalStatus,
                    
                    // Delete Functions
                    deleteMedicalStaff,
                    deleteRotation,
                    deleteOnCallSchedule,
                    deleteAbsence,
                    deleteAnnouncement,
                    
                    // Computed Properties
                    filteredMedicalStaff,
                    filteredClinicalUnits,
                    activeResearchLines,
                    availablePhysicians,
                    availableResidents
                };
            }
        });
        
        // ============ 20. MOUNT APP ============
        app.mount('#app');
        
        console.log('✅ NeumoCare v10.0 COMPLETE mounted successfully!');
        console.log('📋 ALL MODALS INITIALIZED');
        console.log('🔗 PERFECTLY ALIGNED WITH BACKEND API');
        
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
