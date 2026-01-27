// ============ NEUMOCARE HOSPITAL MANAGEMENT SYSTEM FRONTEND ============
// COMPLETE PRODUCTION-READY FRONTEND v3.0
// ================================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('NeumoCare Hospital Management System Frontend v3.0 loading...');
    
    try {
        // ============ ERROR BOUNDARY: CHECK VUE AVAILABILITY ============
        if (typeof Vue === 'undefined') {
            throw new Error('Vue.js failed to load. Please refresh the page.');
        }
        
        console.log('Vue.js loaded successfully:', Vue.version);
        
        const { createApp, ref, reactive, computed, onMounted } = Vue;
        
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
                    
                    return await response.json();
                } catch (error) {
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
            }
        };
        
        // ============ CREATE VUE APP ============
        const app = createApp({
            setup() {
                // ============ REACTIVE STATE ============
                const currentUser = ref(JSON.parse(localStorage.getItem('neumocare_user')) || null);
                const loginForm = reactive({ 
                    email: 'admin@neumocare.org', 
                    password: 'password123'
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
                
                const getStaffTypeClass = (type) => {
                    const classes = {
                        medical_resident: 'badge-primary',
                        attending_physician: 'badge-success',
                        fellow: 'badge-info',
                        nurse_practitioner: 'badge-warning'
                    };
                    return classes[type] || 'badge-secondary';
                };
                
                // ============ HELPER FUNCTIONS ============
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
                    return unit ? unit.unit_name : 'Unknown Training Unit';
                };
                
                // ============ DATA LOADING FUNCTIONS ============
                const loadMedicalStaff = async () => {
                    try {
                        const response = await API.getMedicalStaff();
                        medicalStaff.value = response.data || [];
                    } catch (error) {
                        showToast('Error', 'Failed to load medical staff', 'error');
                        medicalStaff.value = [];
                    }
                };
                
                const loadDepartments = async () => {
                    try {
                        const data = await API.getDepartments();
                        departments.value = data || [];
                    } catch (error) {
                        departments.value = [];
                    }
                };
                
                const loadTrainingUnits = async () => {
                    try {
                        const data = await API.getTrainingUnits();
                        trainingUnits.value = data || [];
                    } catch (error) {
                        trainingUnits.value = [];
                    }
                };
                
                const loadResidentRotations = async () => {
                    try {
                        const response = await API.getRotations();
                        residentRotations.value = response.data || [];
                    } catch (error) {
                        residentRotations.value = [];
                    }
                };
                
                const loadStaffAbsences = async () => {
                    try {
                        const data = await API.getAbsences();
                        staffAbsences.value = data || [];
                    } catch (error) {
                        staffAbsences.value = [];
                    }
                };
                
                const loadOnCallSchedule = async () => {
                    try {
                        const today = new Date().toISOString().split('T')[0];
                        const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                        
                        const data = await API.getOnCallSchedule({
                            start_date: today,
                            end_date: nextWeek
                        });
                        onCallSchedule.value = data || [];
                    } catch (error) {
                        onCallSchedule.value = [];
                    }
                };
                
                const loadAnnouncements = async () => {
                    try {
                        const data = await API.getAnnouncements();
                        recentAnnouncements.value = data || [];
                    } catch (error) {
                        recentAnnouncements.value = [];
                    }
                };
                
                const loadSystemSettings = async () => {
                    try {
                        const data = await API.getSystemSettings();
                        systemSettings.value = data;
                    } catch (error) {
                        systemSettings.value = {};
                    }
                };
                
                const loadAvailableData = async () => {
                    try {
                        const data = await API.getAvailableData();
                        availableData.value = data;
                    } catch (error) {
                        // Silent fail
                    }
                };
                
                const loadAuditLogs = async () => {
                    try {
                        const response = await API.getAuditLogs();
                        auditLogs.value = response.data || [];
                    } catch (error) {
                        auditLogs.value = [];
                    }
                };
                
                const loadDashboardStats = async () => {
                    try {
                        const stats = await API.getDashboardStats();
                        await loadAnnouncements();
                        await loadOnCallSchedule();
                        return stats;
                    } catch (error) {
                        showToast('Error', 'Failed to load dashboard data', 'error');
                        return {};
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
                            loadAvailableData(),
                            loadAuditLogs()
                        ]);
                        
                        showToast('System Ready', 'All data loaded successfully', 'success');
                    } catch (error) {
                        showToast('Data Load Error', 'Failed to load system data', 'error');
                    } finally {
                        loading.value = false;
                    }
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
                    onConfirm: null,
                    onCancel: null
                });
                
                const staffDetailsModal = reactive({
                    show: false,
                    staff: null
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
                        showToast('Error', error.message, 'error');
                    }
                };
                
                const cancelConfirmation = () => {
                    if (confirmationModal.onCancel) {
                        confirmationModal.onCancel();
                    }
                    confirmationModal.show = false;
                };
                
                // ============ DATA SAVE FUNCTIONS ============
                const saveMedicalStaff = async () => {
                    saving.value = true;
                    try {
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
                        return result;
                    } catch (error) {
                        showToast('Error', error.message, 'error');
                        throw error;
                    } finally {
                        saving.value = false;
                    }
                };
                
                const saveDepartment = async () => {
                    saving.value = true;
                    try {
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
                        return result;
                    } catch (error) {
                        showToast('Error', error.message, 'error');
                        throw error;
                    } finally {
                        saving.value = false;
                    }
                };
                
                const saveTrainingUnit = async () => {
                    saving.value = true;
                    try {
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
                        return result;
                    } catch (error) {
                        showToast('Error', error.message, 'error');
                        throw error;
                    } finally {
                        saving.value = false;
                    }
                };
                
                const saveRotation = async () => {
                    saving.value = true;
                    try {
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
                        return result;
                    } catch (error) {
                        showToast('Error', error.message, 'error');
                        throw error;
                    } finally {
                        saving.value = false;
                    }
                };
                
                const saveOnCall = async () => {
                    saving.value = true;
                    try {
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
                        return result;
                    } catch (error) {
                        showToast('Error', error.message, 'error');
                        throw error;
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
                        return result;
                    } catch (error) {
                        showToast('Error', error.message, 'error');
                        throw error;
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
                        return result;
                    } catch (error) {
                        showToast('Error', error.message, 'error');
                        throw error;
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
                        
                        const result = await API.quickPlacement(quickPlacementModal);
                        residentRotations.value.unshift(result);
                        quickPlacementModal.show = false;
                        showToast('Success', 'Resident placed successfully', 'success');
                        return result;
                    } catch (error) {
                        showToast('Error', error.message, 'error');
                        throw error;
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
                        
                        const result = await API.bulkAssign(bulkAssignModal);
                        await loadResidentRotations();
                        bulkAssignModal.show = false;
                        showToast('Success', `${bulkAssignModal.selectedResidents.length} resident${bulkAssignModal.selectedResidents.length === 1 ? '' : 's'} assigned successfully`, 'success');
                        return result;
                    } catch (error) {
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
                        showToast('Error', error.message, 'error');
                        throw error;
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
                        return result;
                    } catch (error) {
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
                                await API.deleteMedicalStaff(staff.id);
                                const index = medicalStaff.value.findIndex(s => s.id === staff.id);
                                if (index !== -1) medicalStaff.value.splice(index, 1);
                                showToast('Deleted', `${staff.full_name} has been deactivated`, 'success');
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
                                await API.deleteDepartment(departmentId);
                                const index = departments.value.findIndex(d => d.id === departmentId);
                                if (index !== -1) departments.value.splice(index, 1);
                                showToast('Deleted', `${department.name} has been removed`, 'success');
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
                
                const deleteRotation = (rotationId) => {
                    showConfirmation({
                        title: 'Delete Rotation',
                        message: 'Are you sure you want to delete this rotation?',
                        icon: 'fa-trash',
                        confirmButtonText: 'Delete',
                        confirmButtonClass: 'btn-danger',
                        onConfirm: async () => {
                            try {
                                await API.deleteRotation(rotationId);
                                const index = residentRotations.value.findIndex(r => r.id === rotationId);
                                if (index !== -1) residentRotations.value.splice(index, 1);
                                showToast('Deleted', 'Rotation has been removed', 'success');
                            } catch (error) {
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
                                await API.deleteOnCall(scheduleId);
                                const index = onCallSchedule.value.findIndex(s => s.id === scheduleId);
                                if (index !== -1) onCallSchedule.value.splice(index, 1);
                                showToast('Deleted', 'On-call schedule has been removed', 'success');
                            } catch (error) {
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
                                await API.deleteAbsence(absenceId);
                                const index = staffAbsences.value.findIndex(a => a.id === absenceId);
                                if (index !== -1) staffAbsences.value.splice(index, 1);
                                showToast('Deleted', 'Absence record has been removed', 'success');
                            } catch (error) {
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
                                await API.deleteAnnouncement(announcementId);
                                const index = recentAnnouncements.value.findIndex(a => a.id === announcementId);
                                if (index !== -1) recentAnnouncements.value.splice(index, 1);
                                showToast('Deleted', 'Announcement has been removed', 'success');
                            } catch (error) {
                                showToast('Error', error.message, 'error');
                            }
                        }
                    });
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
                
                // ============ NAVIGATION ============
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
                
                // ============ MODAL FUNCTIONS ============
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
                
                const editMedicalStaff = (staff) => {
                    medicalStaffModal.mode = 'edit';
                    medicalStaffModal.show = true;
                    medicalStaffModal.form = { ...staff };
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
                
                const editDepartment = (department) => {
                    departmentModal.mode = 'edit';
                    departmentModal.show = true;
                    departmentModal.form = { ...department };
                };
                
                const showAddTrainingUnitModal = () => {
                    trainingUnitModal.mode = 'add';
                    trainingUnitModal.show = true;
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
                
                const editTrainingUnit = (unit) => {
                    trainingUnitModal.mode = 'edit';
                    trainingUnitModal.show = true;
                    trainingUnitModal.form = { ...unit };
                };
                
                const showAddRotationModal = () => {
                    rotationModal.mode = 'add';
                    rotationModal.show = true;
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
                
                const editRotation = (rotation) => {
                    rotationModal.mode = 'edit';
                    rotationModal.show = true;
                    rotationModal.form = { ...rotation };
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
                        status: 'scheduled'
                    };
                };
                
                const editOnCallSchedule = (schedule) => {
                    onCallModal.mode = 'edit';
                    onCallModal.show = true;
                    onCallModal.form = { ...schedule };
                };
                
                const showAddAbsenceModal = () => {
                    absenceModal.mode = 'add';
                    absenceModal.show = true;
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
                
                const editAbsence = (absence) => {
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
                    communicationsModal.show = true;
                    communicationsModal.form.publish_start_date = new Date().toISOString().split('T')[0];
                };
                
                const showQuickPlacementModal = () => {
                    quickPlacementModal.show = true;
                    quickPlacementModal.start_date = new Date().toISOString().split('T')[0];
                };
                
                const showBulkAssignModal = () => {
                    bulkAssignModal.show = true;
                    bulkAssignModal.start_date = new Date().toISOString().split('T')[0];
                };
                
                const showUserProfileModal = () => {
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
                };
                
                const showSystemSettingsModal = () => {
                    systemSettingsModal.show = true;
                };
                
                const viewStaffDetails = (staff) => {
                    staffDetailsModal.staff = staff;
                    staffDetailsModal.show = true;
                };
                
                // ============ COMPUTED PROPERTIES ============
                const residents = computed(() => {
                    return medicalStaff.value.filter(staff => staff.staff_type === 'medical_resident');
                });
                
                const attendings = computed(() => {
                    return medicalStaff.value.filter(staff => staff.staff_type === 'attending_physician');
                });
                
                const todaysOnCall = computed(() => {
                    const today = new Date().toISOString().split('T')[0];
                    return onCallSchedule.value.filter(schedule => schedule.duty_date === today)
                        .map(schedule => ({
                            ...schedule,
                            physician_name: getStaffName(schedule.primary_physician_id),
                            role: schedule.shift_type === 'primary_call' ? 'Primary' : 'Backup'
                        }));
                });
                
                // ============ LIFECYCLE HOOKS ============
                onMounted(() => {
                    if (currentUser.value) {
                        loadInitialData();
                    }
                    
                    // Close user menu when clicking outside
                    document.addEventListener('click', function(event) {
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
                    
                    // Modal States
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
                    confirmationModal,
                    staffDetailsModal,
                    
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
                    
                    // Utility Functions
                    getInitials: Utils.getInitials,
                    formatDate: Utils.formatDate,
                    formatDateTime: Utils.formatDateTime,
                    formatTimeAgo: Utils.formatTimeAgo,
                    formatStaffType,
                    getStaffTypeClass,
                    formatEmploymentStatus,
                    getDepartmentName,
                    getStaffName,
                    getTrainingUnitName,
                    
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
                    deleteTrainingUnit,
                    showAddRotationModal,
                    editRotation,
                    saveRotation,
                    deleteRotation,
                    showAddOnCallModal,
                    editOnCallSchedule,
                    saveOnCall,
                    deleteOnCallSchedule,
                    showAddAbsenceModal,
                    editAbsence,
                    saveAbsence,
                    deleteAbsence,
                    showCommunicationsModal,
                    saveCommunication,
                    deleteAnnouncement,
                    showQuickPlacementModal,
                    saveQuickPlacement,
                    showBulkAssignModal,
                    saveBulkAssignment,
                    showUserProfileModal,
                    saveUserProfile,
                    showSystemSettingsModal,
                    saveSystemSettings,
                    viewStaffDetails,
                    
                    // Navigation Functions
                    switchView,
                    getCurrentTitle,
                    
                    // Authentication Functions
                    handleLogin,
                    handleLogout,
                    
                    // UI Functions
                    removeToast,
                    showToast,
                    
                    // Computed Properties
                    residents,
                    attendings,
                    todaysOnCall
                };
            }
        });
        
        // ============ MOUNT THE APP ============
        app.mount('#app');
        console.log('Frontend Vue app mounted successfully');
        
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
