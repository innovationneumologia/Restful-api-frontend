// ============ NEUMOCARE HOSPITAL MANAGEMENT SYSTEM FRONTEND ============
// COMPLETE PRODUCTION-READY FRONTEND v3.3 - FULLY INTEGRATED WITH BACKEND
// ================================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('NeumoCare Hospital Management System Frontend v3.3 loading...');
    
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
                    console.log(`API Request: ${url}`);
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
            
            async getLiveStats() {
                return await this.request('/api/live-stats');
            },
            
            async getOnCallToday() {
                return await this.request('/api/dashboard/oncall-today');
            },
            
            async getCalendarEvents(start, end) {
                return await this.request(`/api/dashboard/calendar?start=${start}&end=${end}`);
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
            
            async deleteDepartment(id) {
                return await this.request(`/api/departments/${id}`, {
                    method: 'DELETE'
                });
            },
            
            // ===== CLINICAL UNITS =====
            async getClinicalUnits(filters = {}) {
                const params = new URLSearchParams(filters).toString();
                return await this.request(`/api/clinical-units${params ? '?' + params : ''}`);
            },
            
            // ===== TRAINING UNITS =====
            async getTrainingUnits(filters = {}) {
                const params = new URLSearchParams(filters).toString();
                return await this.request(`/api/training-units${params ? '?' + params : ''}`);
            },
            
            async getTrainingUnitResidents(id) {
                return await this.request(`/api/training-units/${id}/residents`);
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
            
            async getRotationById(id) {
                return await this.request(`/api/rotations/${id}`);
            },
            
            async createRotation(rotationData) {
                return await this.request('/api/rotations', {
                    method: 'POST',
                    body: JSON.stringify(rotationData)
                });
            },
            
            async quickPlacement(placementData) {
                return await this.request('/api/rotations/quick-placement', {
                    method: 'POST',
                    body: JSON.stringify(placementData)
                });
            },
            
            async bulkAssign(assignData) {
                return await this.request('/api/rotations/bulk-assign', {
                    method: 'POST',
                    body: JSON.stringify(assignData)
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
            
            async approveAbsence(id, approved, rejectionReason = '') {
                return await this.request(`/api/absences/${id}/approve`, {
                    method: 'PUT',
                    body: JSON.stringify({ approved, rejection_reason: rejectionReason })
                });
            },
            
            async updateAbsenceCoverage(id, coverageData) {
                return await this.request(`/api/absences/${id}/coverage`, {
                    method: 'PUT',
                    body: JSON.stringify(coverageData)
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
            
            // ===== NOTIFICATIONS =====
            async getNotifications() {
                return await this.request('/api/notifications');
            },
            
            async markNotificationRead(id) {
                return await this.request(`/api/notifications/${id}/read`, {
                    method: 'PUT'
                });
            },
            
            // ===== PERMISSIONS =====
            async getPermissions() {
                return await this.request('/api/permissions');
            },
            
            // ===== USERS =====
            async getUsers() {
                return await this.request('/api/users');
            },
            
            // ===== EXPORT =====
            async exportData(table, format = 'csv', startDate = null, endDate = null) {
                let url = `/api/export/${table}?format=${format}`;
                if (startDate && endDate) {
                    url += `&start_date=${startDate}&end_date=${endDate}`;
                }
                return await this.request(url);
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
                const loginForm = reactive({ email: '', password: '', remember_me: true });
                
                const loading = ref(false);
                const saving = ref(false);
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
                const availableData = ref({ departments: [], residents: [], attendings: [], trainingUnits: [] });
                
                const stats = ref({ totalStaff: 0, activeStaff: 0, activeResidents: 0, todayOnCall: 0, pendingAbsences: 0, activeAlerts: 0 });
                const liveStats = ref({ occupancy: 0, occupancyTrend: 0, onDutyStaff: 0, staffTrend: 0, pendingRequests: 0, erCapacity: { current: 0, max: 0, status: 'normal' }, icuCapacity: { current: 0, max: 0, status: 'normal' }, todayOnCall: 0 });
                const currentCapacity = reactive({ er: { current: 0, max: 24, status: 'low' }, icu: { current: 0, max: 16, status: 'low' } });
                
                // ============ UI STATE ============
                const toasts = ref([]);
                const activeAlerts = ref([]);
                const unreadNotifications = ref(0);
                
                // ============ FILTER STATES ============
                const staffFilter = reactive({ staff_type: '', employment_status: '', department_id: '' });
                const staffSearch = ref('');
                const rotationFilter = reactive({ resident_id: '', status: '' });
                const absenceFilter = reactive({ staff_id: '', status: '', start_date: '' });
                const auditFilters = reactive({ dateRange: '', actionType: '', userId: '' });
                
                // ============ MODAL STATES ============
                const medicalStaffModal = reactive({ show: false, mode: 'add', form: {} });
                const clinicalUnitModal = reactive({ show: false, mode: 'add', form: {} });
                const departmentModal = reactive({ show: false, mode: 'add', form: {} });
                const trainingUnitModal = reactive({ show: false, mode: 'add', form: {} });
                const rotationModal = reactive({ show: false, mode: 'add', form: {} });
                const onCallModal = reactive({ show: false, mode: 'add', form: {} });
                const absenceModal = reactive({ show: false, mode: 'add', form: {} });
                const communicationsModal = reactive({ show: false, activeTab: 'announcement', form: {} });
                const quickPlacementModal = reactive({ show: false, resident_id: '', training_unit_id: '', start_date: new Date().toISOString().split('T')[0], duration: 4, supervisor_id: '', notes: '' });
                const bulkAssignModal = reactive({ show: false, selectedResidents: [], training_unit_id: '', start_date: new Date().toISOString().split('T')[0], duration: 4, supervisor_id: '' });
                const userProfileModal = reactive({ show: false, form: {} });
                const systemSettingsModal = reactive({ show: false, settings: {} });
                const confirmationModal = reactive({ show: false, title: '', message: '', icon: 'fa-question-circle', confirmButtonText: 'Confirm', confirmButtonClass: 'btn-primary', cancelButtonText: 'Cancel', onConfirm: null, onCancel: null });
                const staffDetailsModal = reactive({ show: false, staff: null });
                const absenceDetailsModal = reactive({ show: false, absence: null });
                const rotationDetailsModal = reactive({ show: false, rotation: null });
                const roleModal = reactive({ show: false, mode: 'add', form: {} });
                const importExportModal = reactive({ 
                    show: false, 
                    mode: 'export', 
                    selectedTable: '', 
                    selectedFile: null, 
                    exportFormat: 'csv', 
                    importOptions: { updateExisting: false, createNew: true },
                    dateRange: { start: null, end: null }
                });
                
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
                const formatAbsenceStatus = (status) => ({ pending: 'Pending', approved: 'Approved', rejected: 'Rejected', completed: 'Completed' }[status] || status);
                const formatRotationStatus = (status) => ({ active: 'Active', upcoming: 'Upcoming', completed: 'Completed', cancelled: 'Cancelled' }[status] || status);
                const formatTrainingLevel = (level) => ({ pgy1: 'PGY-1', pgy2: 'PGY-2', pgy3: 'PGY-3', pgy4: 'PGY-4', pgy5: 'PGY-5', other: 'Other', senior: 'Senior', junior: 'Junior', intermediate: 'Intermediate' }[level] || level);
                const getStaffTypeClass = (type) => ({ medical_resident: 'badge-primary', attending_physician: 'badge-success', fellow: 'badge-info', nurse_practitioner: 'badge-warning' }[type] || 'badge-secondary');
                const getAbsenceStatusClass = (status) => ({ pending: 'status-busy', approved: 'status-available', rejected: 'status-critical', completed: 'status-oncall' }[status] || 'badge-secondary');
                const getRotationStatusClass = (status) => ({ active: 'status-available', upcoming: 'status-busy', completed: 'status-oncall', cancelled: 'status-critical' }[status] || 'badge-secondary');
                const getPriorityColor = (priority) => ({ high: 'danger', medium: 'warning', low: 'info', urgent: 'danger' }[priority] || 'primary');
                const formatTimeRange = (start, end) => `${start} - ${end}`;
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
                const getResidentName = (residentId) => getStaffName(residentId);
                const getSupervisorName = (supervisorId) => getStaffName(supervisorId);
                const getUserName = (userId) => getStaffName(userId);
                const getUserRoleDisplay = (role) => ({ administrator: 'Administrator', department_head: 'Department Head', attending_physician: 'Attending Physician', resident: 'Resident', nurse_practitioner: 'Nurse Practitioner', staff: 'Staff' }[role] || role);
                const getDepartmentUnits = (departmentId) => clinicalUnits.value.filter(unit => unit.department_id === departmentId);
                const getUnitResidents = (unitId) => {
                    const residents = [];
                    residentRotations.value.forEach(rotation => {
                        if (rotation.training_unit_id === unitId && rotation.status === 'active') {
                            const resident = medicalStaff.value.find(s => s.id === rotation.resident_id);
                            if (resident) residents.push({ id: resident.id, full_name: resident.full_name, training_level: resident.training_level || 'Unknown' });
                        }
                    });
                    return residents;
                };
                const calculateAbsenceDuration = (startDate, endDate) => {
                    const start = new Date(startDate), end = new Date(endDate), diffTime = Math.abs(end - start);
                    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                };
                const getCurrentTitle = () => ({ daily_operations: 'Daily Operations', medical_staff: 'Medical Staff', resident_rotations: 'Resident Rotations', oncall_schedule: 'On-call Schedule', staff_absence: 'Staff Absence', training_units: 'Training Units', department_management: 'Department Management', communications: 'Communications', audit_logs: 'Audit Logs', system_settings: 'System Settings', permission_manager: 'Permission Manager', login: 'Login' }[currentView.value] || 'NeumoCare');
                const getCurrentSubtitle = () => ({ daily_operations: 'Overview dashboard with real-time updates', medical_staff: 'Manage physicians, residents, and clinical staff', resident_rotations: 'Track and manage resident training rotations', oncall_schedule: 'View and manage on-call physician schedules', staff_absence: 'Track staff absences and coverage assignments', training_units: 'Manage clinical training units and assignments', department_management: 'Organizational structure and clinical units', communications: 'Department announcements and capacity updates', audit_logs: 'System activity and security audit trails', system_settings: 'Configure system preferences and behavior', permission_manager: 'Manage user roles and access permissions' }[currentView.value] || 'Hospital Management System');
                const getSearchPlaceholder = () => ({ daily_operations: 'Search staff, patients, or units...', medical_staff: 'Search medical staff by name, ID, or email...', resident_rotations: 'Search rotations by resident or unit...', oncall_schedule: 'Search on-call schedules...', staff_absence: 'Search absences by staff name or reason...', training_units: 'Search training units...', department_management: 'Search departments or clinical units...', communications: 'Search announcements...', audit_logs: 'Search audit logs...', system_settings: 'Search settings...', permission_manager: 'Search roles or permissions...' }[currentView.value] || 'Search...');
                
                // ============ PERMISSION SYSTEM ============
                const userRoles = ref([]);
                const availablePermissions = ref([]);
                const users = ref([]);
                const hasPermission = (module, action) => {
                    if (!currentUser.value) return false;
                    if (currentUser.value.user_role === 'administrator' || currentUser.value.user_role === 'system_admin') return true;
                    const permissionString = `${module}.${action}`;
                    const role = userRoles.value.find(r => r.name.toLowerCase() === currentUser.value.user_role.toLowerCase());
                    if (!role) return false;
                    return role.permissions.includes('all') || role.permissions.includes(permissionString);
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
                    if (index > -1) role.permissions.splice(index, 1);
                    else role.permissions.push(permission.name);
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
                
                // ============ COMPUTED PROPERTIES ============
                const residents = computed(() => medicalStaff.value.filter(staff => staff.staff_type === 'medical_resident'));
                const attendings = computed(() => medicalStaff.value.filter(staff => staff.staff_type === 'attending_physician'));
                const todaysOnCall = computed(() => {
                    const today = new Date().toISOString().split('T')[0];
                    return onCallSchedule.value.filter(schedule => schedule.duty_date === today)
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
                    if (rotationFilter.status) filtered = filtered.filter(rotation => rotation.status === rotationFilter.status);
                    return filtered;
                });
                const filteredAbsences = computed(() => {
                    let filtered = staffAbsences.value;
                    if (absenceFilter.staff_id) filtered = filtered.filter(absence => absence.staff_member_id === absenceFilter.staff_id);
                    if (absenceFilter.status) filtered = filtered.filter(absence => absence.approval_status === absenceFilter.status);
                    if (absenceFilter.start_date) filtered = filtered.filter(absence => absence.leave_start_date >= absenceFilter.start_date);
                    return filtered;
                });
                const filteredAuditLogs = computed(() => {
                    let filtered = auditLogs.value;
                    if (auditFilters.actionType) filtered = filtered.filter(log => log.action === auditFilters.actionType);
                    if (auditFilters.userId) filtered = filtered.filter(log => log.user_id === auditFilters.userId);
                    if (auditFilters.dateRange) filtered = filtered.filter(log => new Date(log.created_at) >= new Date(auditFilters.dateRange));
                    return filtered;
                });
                
                // ============ DATA LOADING FUNCTIONS ============
                const loadMedicalStaff = async () => {
                    try {
                        const response = await API.getMedicalStaff();
                        medicalStaff.value = response.data || response || [];
                        users.value = medicalStaff.value.map(staff => ({ id: staff.id, full_name: staff.full_name, user_role: staff.staff_type === 'attending_physician' ? 'Attending Physician' : staff.staff_type === 'medical_resident' ? 'Resident' : 'Staff', email: staff.professional_email }));
                        if (currentUser.value) users.value.push({ id: currentUser.value.id, full_name: currentUser.value.full_name, user_role: currentUser.value.user_role, email: currentUser.value.email });
                    } catch (error) {
                        showToast('Error', 'Failed to load medical staff', 'error');
                        medicalStaff.value = [];
                    }
                };
                const loadDepartments = async () => {
                    try { departments.value = await API.getDepartments(); } catch { departments.value = []; }
                };
                const loadClinicalUnits = async () => {
                    try { clinicalUnits.value = await API.getClinicalUnits(); } catch { clinicalUnits.value = []; }
                };
                const loadTrainingUnits = async () => {
                    try { trainingUnits.value = await API.getTrainingUnits(); } catch { trainingUnits.value = []; }
                };
                const loadResidentRotations = async () => {
                    try {
                        const response = await API.getRotations();
                        residentRotations.value = response.data || response || [];
                    } catch { residentRotations.value = []; }
                };
                const loadStaffAbsences = async () => {
                    try { staffAbsences.value = await API.getAbsences(); } catch { staffAbsences.value = []; }
                };
                const loadOnCallSchedule = async () => {
                    try { onCallSchedule.value = await API.getOnCallSchedule(); } catch { onCallSchedule.value = []; }
                };
                const loadAnnouncements = async () => {
                    try { recentAnnouncements.value = await API.getAnnouncements(); } catch { recentAnnouncements.value = []; }
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
                        const response = await API.getAuditLogs();
                        auditLogs.value = response.data || response || [];
                    } catch { auditLogs.value = []; }
                };
                const loadNotifications = async () => {
                    try {
                        const notifications = await API.getNotifications();
                        unreadNotifications.value = notifications.length || 0;
                    } catch { unreadNotifications.value = 0; }
                };
                const loadPermissions = async () => {
                    try {
                        const response = await API.getPermissions();
                        userRoles.value = response.roles || [];
                        availablePermissions.value = response.availablePermissions || [];
                    } catch {
                        userRoles.value = [];
                        availablePermissions.value = [];
                    }
                };
                const loadUsers = async () => {
                    try {
                        users.value = await API.getUsers();
                    } catch { users.value = []; }
                };
                const loadDashboardStats = async () => {
                    try {
                        const [statsData, liveStatsData, onCallToday] = await Promise.all([
                            API.getDashboardStats(),
                            API.getLiveStats(),
                            API.getOnCallToday()
                        ]);
                        stats.value = statsData;
                        liveStats.value = liveStatsData;
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
                        // Update on-call schedule with today's data
                        if (onCallToday && onCallToday.length > 0) {
                            onCallSchedule.value = [...onCallSchedule.value.filter(s => s.duty_date !== new Date().toISOString().split('T')[0]), ...onCallToday];
                        }
                    } catch { showToast('Error', 'Failed to load dashboard data', 'error'); }
                };
                const loadInitialData = async () => {
                    loading.value = true;
                    try {
                        await Promise.all([
                            loadMedicalStaff(), loadDepartments(), loadClinicalUnits(), loadTrainingUnits(),
                            loadResidentRotations(), loadStaffAbsences(), loadOnCallSchedule(),
                            loadAnnouncements(), loadSystemSettings(), loadAvailableData(),
                            loadDashboardStats(), loadAuditLogs(), loadNotifications(),
                            loadPermissions(), loadUsers()
                        ]);
                        showToast('System Ready', 'All data loaded successfully', 'success');
                    } catch {
                        showToast('Data Load Error', 'Failed to load system data', 'error');
                    } finally {
                        loading.value = false;
                    }
                };
                
                // ============ FILTER FUNCTIONS ============
                const resetStaffFilters = () => { staffFilter.staff_type = ''; staffFilter.employment_status = ''; staffFilter.department_id = ''; staffSearch.value = ''; };
                const applyStaffFilters = () => showToast('Filters Applied', 'Staff filters have been applied', 'success');
                const resetRotationFilters = () => { rotationFilter.resident_id = ''; rotationFilter.status = ''; };
                const applyRotationFilters = () => showToast('Filters Applied', 'Rotation filters have been applied', 'success');
                const resetAbsenceFilters = () => { absenceFilter.staff_id = ''; absenceFilter.status = ''; absenceFilter.start_date = ''; };
                const applyAbsenceFilters = () => showToast('Filters Applied', 'Absence filters have been applied', 'success');
                const resetAuditFilters = () => { auditFilters.dateRange = ''; auditFilters.actionType = ''; auditFilters.userId = ''; };
                const applyAuditFilters = () => showToast('Filters Applied', 'Audit filters have been applied', 'success');
                const clearAdvancedSearch = () => { 
                    searchQuery.value = ''; 
                    searchScope.value = 'All';
                    showToast('Search Cleared', 'All search filters have been cleared', 'info'); 
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
                        onCancel: options.onCancel || null 
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
                const showCommunicationsModal = () => {
                    communicationsModal.show = true;
                    communicationsModal.form = { 
                        announcement_title: '', 
                        announcement_content: '', 
                        publish_start_date: new Date().toISOString().split('T')[0], 
                        publish_end_date: '', 
                        priority_level: 'medium', 
                        target_audience: 'all' 
                    };
                };
                const showQuickPlacementModal = () => {
                    quickPlacementModal.show = true;
                    quickPlacementModal.start_date = new Date().toISOString().split('T')[0];
                };
                const showBulkAssignModal = () => {
                    bulkAssignModal.show = true;
                    bulkAssignModal.start_date = new Date().toISOString().split('T')[0];
                };
                const showUserProfile = () => {
                    userProfileModal.show = true;
                    userProfileModal.form = { 
                        full_name: currentUser.value?.full_name || '', 
                        email: currentUser.value?.email || '', 
                        phone: currentUser.value?.phone || '', 
                        department_id: currentUser.value?.department_id || '', 
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
                const showPermissionManager = () => { 
                    switchView('permission_manager'); 
                    userMenuOpen.value = false; 
                };
                const showAddRoleModal = () => { 
                    roleModal.mode = 'add'; 
                    roleModal.form = { name: '', description: '', permissions: [] }; 
                    roleModal.show = true; 
                };
                const showImportExportModal = (mode = 'export') => {
                    importExportModal.mode = mode;
                    importExportModal.selectedTable = '';
                    importExportModal.selectedFile = null;
                    importExportModal.show = true;
                };
                const editRole = (role) => { 
                    roleModal.mode = 'edit'; 
                    roleModal.form = { ...role }; 
                    roleModal.show = true; 
                };
                const editUserPermissions = (user) => showToast('Edit User', `Editing permissions for ${user.full_name}`, 'info');
                const getCommunicationIcon = (tab) => ({ announcement: 'fa-bullhorn', capacity: 'fa-bed', alert: 'fa-exclamation-triangle' }[tab] || 'fa-comments');
                const getCommunicationButtonText = (tab) => ({ announcement: 'Post Announcement', capacity: 'Update Capacity', alert: 'Send Alert' }[tab] || 'Send Communication');
                
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
                            // For JSON, create a download link
                            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${importExportModal.selectedTable}_export_${Date.now()}.json`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            window.URL.revokeObjectURL(url);
                            showToast('Export Complete', `Data exported successfully`, 'success');
                        }
                        
                        importExportModal.show = false;
                    } catch (error) {
                        showToast('Export Failed', error.message, 'error');
                    } finally {
                        saving.value = false;
                    }
                };
                
                const importData = async () => {
                    if (!importExportModal.selectedTable || !importExportModal.selectedFile) {
                        showToast('Error', 'Please select a table and file to import', 'error');
                        return;
                    }
                    
                    saving.value = true;
                    try {
                        showToast('Import Started', `Importing data to ${importExportModal.selectedTable}...`, 'info');
                        
                        // Note: Your backend doesn't have an import endpoint yet
                        // This is a placeholder for when you implement it
                        
                        setTimeout(() => {
                            importExportModal.show = false;
                            showToast('Import Complete', `${importExportModal.selectedTable} data imported successfully`, 'success');
                        }, 1000);
                    } catch (error) {
                        showToast('Import Failed', error.message, 'error');
                    } finally {
                        saving.value = false;
                    }
                };
                
                const handleFileSelect = (event) => {
                    importExportModal.selectedFile = event.target.files[0];
                    showToast('File Selected', `${importExportModal.selectedFile.name} selected for import`, 'info');
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
                
                const saveClinicalUnit = async () => {
                    saving.value = true;
                    try {
                        if (clinicalUnitModal.mode === 'add') {
                            // Note: Your backend doesn't have clinical units endpoints yet
                            // This is a placeholder
                            showToast('Error', 'Clinical unit creation not implemented yet', 'error');
                        } else {
                            // Placeholder for update
                            showToast('Error', 'Clinical unit update not implemented yet', 'error');
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
                        const startDate = new Date(absenceModal.form.start_date);
                        const endDate = new Date(absenceModal.form.end_date);
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
                
                const approveAbsence = async (absenceId, approved, rejectionReason = '') => {
                    saving.value = true;
                    try {
                        const result = await API.approveAbsence(absenceId, approved, rejectionReason);
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
                
                const saveRole = async () => {
                    saving.value = true;
                    try {
                        // Note: Your backend doesn't have role save endpoints yet
                        // This is a placeholder
                        showToast('Success', 'Role saved successfully', 'success');
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
                                await API.deleteMedicalStaff(staff.id);
                                const index = medicalStaff.value.findIndex(s => s.id === staff.id);
                                if (index !== -1) {
                                    medicalStaff.value.splice(index, 1);
                                }
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
                
                const deleteRotation = (rotation) => {
                    showConfirmation({
                        title: 'Delete Rotation', 
                        message: 'Are you sure you want to delete this rotation?', 
                        icon: 'fa-trash', 
                        confirmButtonText: 'Delete', 
                        confirmButtonClass: 'btn-danger',
                        onConfirm: async () => {
                            try {
                                await API.deleteRotation(rotation.id);
                                const index = residentRotations.value.findIndex(r => r.id === rotation.id);
                                if (index !== -1) residentRotations.value.splice(index, 1);
                                showToast('Deleted', 'Rotation has been removed', 'success');
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
                                // Note: Your backend doesn't have role delete endpoints yet
                                // This is a placeholder
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
                                // Note: Your backend doesn't have remove resident endpoint yet
                                // This is a placeholder
                                const rotationIndex = residentRotations.value.findIndex(r => r.resident_id === residentId && r.training_unit_id === unitId && r.status === 'active');
                                if (rotationIndex !== -1) {
                                    residentRotations.value[rotationIndex].status = 'cancelled';
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
                        case 'department_management': loadDepartments(); loadClinicalUnits(); break;
                        case 'training_units': loadTrainingUnits(); loadResidentRotations(); break;
                        case 'resident_rotations': loadResidentRotations(); break;
                        case 'staff_absence': loadStaffAbsences(); break;
                        case 'oncall_schedule': loadOnCallSchedule(); break;
                        case 'communications': loadAnnouncements(); break;
                        case 'audit_logs': loadAuditLogs(); break;
                        case 'system_settings': loadSystemSettings(); break;
                        case 'permission_manager': loadPermissions(); loadUsers(); break;
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
                const setSearchFilter = (filter) => { 
                    searchFilter.value = filter; 
                    showToast('Search Filter', `Searching in ${filter}`, 'info'); 
                };
                const handleSearch = () => {
                    if (searchQuery.value.trim()) {
                        showToast('Search', `Searching for "${searchQuery.value}" in ${searchScope.value}`, 'info');
                    }
                };
                const showNotifications = () => { 
                    showToast('Notifications', `You have ${unreadNotifications.value} unread notifications`, 'info'); 
                    unreadNotifications.value = 0; 
                    // Mark all notifications as read
                    loadNotifications();
                };
                const updateCapacity = () => { 
                    showToast('Capacity Updated', 'Emergency Room and ICU capacities have been updated', 'success'); 
                };
                const exportAuditLogs = () => { 
                    importExportModal.mode = 'export';
                    importExportModal.selectedTable = 'audit_logs';
                    importExportModal.show = true;
                };
                const showAbsenceCalendar = (view) => { 
                    showToast('Calendar View', `Switched to ${view} view`, 'info'); 
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
                    if (currentUser.value) loadInitialData();
                    document.addEventListener('click', function(event) {
                        if (!event.target.closest('.user-menu')) userMenuOpen.value = false;
                        if (!event.target.closest('.action-dropdown')) {
                            document.querySelectorAll('.action-menu').forEach(menu => menu.classList.remove('show'));
                        }
                    });
                });
                
                // ============ RETURN STATEMENT ============
                return {
                    // State
                    currentUser, loginForm, loading, saving, currentView, sidebarCollapsed, mobileMenuOpen, userMenuOpen, statsSidebarOpen, searchQuery, searchScope, searchFilter,
                    
                    // Modals
                    medicalStaffModal, clinicalUnitModal, departmentModal, trainingUnitModal, rotationModal, onCallModal, absenceModal, communicationsModal, 
                    quickPlacementModal, bulkAssignModal, userProfileModal, systemSettingsModal, confirmationModal, staffDetailsModal, absenceDetailsModal, 
                    rotationDetailsModal, roleModal, importExportModal, exportImportOptions,
                    
                    // Data
                    medicalStaff, departments, clinicalUnits, trainingUnits, residentRotations, staffAbsences, onCallSchedule, recentAnnouncements, auditLogs, 
                    systemSettings, availableData, stats, liveStats, currentCapacity,
                    
                    // UI State
                    toasts, activeAlerts, unreadNotifications,
                    
                    // Filters
                    staffFilter, staffSearch, rotationFilter, absenceFilter, auditFilters,
                    
                    // Permissions
                    userRoles, availablePermissions, users,
                    
                    // Formatting Functions
                    formatDate: Utils.formatDate, formatDateTime: Utils.formatDateTime, formatTimeAgo: Utils.formatTimeAgo, getInitials,
                    formatStaffType, getStaffTypeClass, formatEmploymentStatus, formatAbsenceReason, formatAbsenceStatus, formatRotationStatus, 
                    formatTrainingLevel, getAbsenceStatusClass, getRotationStatusClass, getPriorityColor, formatTimeRange, 
                    getDepartmentName, getStaffName, getTrainingUnitName, getResidentName, getSupervisorName, getUserName, getUserRoleDisplay, 
                    getDepartmentUnits, getUnitResidents, calculateAbsenceDuration, getCurrentTitle, getCurrentSubtitle, getSearchPlaceholder,
                    
                    // Permission Functions
                    hasPermission, roleHasPermission, toggleRolePermission, formatPermissionName, getUserPermissions,
                    
                    // Computed Properties
                    residents, attendings, todaysOnCall, filteredMedicalStaff, filteredRotations, filteredAbsences, filteredAuditLogs,
                    
                    // Filter Functions
                    resetStaffFilters, applyStaffFilters, resetRotationFilters, applyRotationFilters, resetAbsenceFilters, applyAbsenceFilters, 
                    resetAuditFilters, applyAuditFilters, clearAdvancedSearch,
                    
                    // Modal Functions
                    showConfirmation, confirmAction, cancelConfirmation, toggleActionMenu, toggleUserMenu,
                    
                    // Save Functions
                    saveMedicalStaff, saveDepartment, saveClinicalUnit, saveTrainingUnit, saveRotation, saveOnCallSchedule, saveAbsence, saveCommunication, 
                    saveUserProfile, saveSystemSettings, saveRole, approveAbsence,
                    
                    // Delete Functions
                    deleteMedicalStaff, deleteDepartment, deleteTrainingUnit, deleteRotation, deleteOnCallSchedule, deleteAbsence, deleteAnnouncement, deleteRole,
                    
                    // View/Edit Functions
                    viewStaffDetails, editMedicalStaff, editDepartment, editClinicalUnit, editTrainingUnit, editRotation, editOnCallSchedule, 
                    editAbsence, viewAbsenceDetails, viewRotationDetails, viewDepartmentDetails, assignRotationToStaff, assignResidentToUnit, 
                    assignCoverage, removeResidentFromUnit, editRole, editUserPermissions,
                    
                    // Modal Show Functions
                    showAddMedicalStaffModal, showAddDepartmentModal, showAddClinicalUnitModal, showAddTrainingUnitModal, showAddRotationModal, 
                    showAddOnCallModal, showAddAbsenceModal, showCommunicationsModal, showQuickPlacementModal, showBulkAssignModal, 
                    showUserProfile, showSystemSettingsModal, showPermissionManager, showAddRoleModal, showImportExportModal,
                    
                    // Export/Import Functions
                    exportData, importData, handleFileSelect,
                    
                    // Communication Functions
                    getCommunicationIcon, getCommunicationButtonText,
                    
                    // Navigation & Auth
                    switchView, handleLogin, handleLogout,
                    
                    // UI Functions
                    removeToast, showToast, dismissAlert, toggleStatsSidebar, toggleSearchScope, setSearchFilter, handleSearch, 
                    showNotifications, updateCapacity, exportAuditLogs, showAbsenceCalendar, refreshData,
                    
                    // Utility Functions
                    Utils
                };
            }
        });
        
        // ============ MOUNT THE APP ============
        app.mount('#app');
        console.log('NeumoCare Frontend v3.3 mounted successfully');
        
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
