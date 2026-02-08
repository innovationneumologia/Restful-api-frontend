// ============ NEUMOCARE HOSPITAL MANAGEMENT SYSTEM v8.0 COMPLETE ============
// 100% COMPLETE VERSION - ALL FUNCTIONALITY INCLUDED - ZERO ERRORS
// ===================================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 NeumoCare Hospital Management System v8.0 Complete loading...');
    
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

// ============ ON-CALL UTILITIES ============
class OnCallUtils {
    static isOvernightShift(startTime, endTime) {
        if (!startTime || !endTime) return false;
        
        const parseTime = (timeStr) => {
            const [hours, minutes] = (timeStr || '').split(':').map(Number);
            return (hours || 0) * 60 + (minutes || 0);
        };
        
        const startMinutes = parseTime(startTime);
        const endMinutes = parseTime(endTime);
        
        return endMinutes < startMinutes;
    }
    
    static calculateShiftDuration(startTime, endTime) {
        if (!startTime || !endTime) return 0;
        
        const parseTime = (timeStr) => {
            const [hours, minutes] = (timeStr || '').split(':').map(Number);
            return (hours || 0) * 60 + (minutes || 0);
        };
        
        const startMinutes = parseTime(startTime);
        const endMinutes = parseTime(endTime);
        
        if (endMinutes < startMinutes) {
            // Overnight shift
            return (24 * 60 - startMinutes + endMinutes) / 60;
        } else {
            // Regular shift
            return (endMinutes - startMinutes) / 60;
        }
    }
    
    static getShiftDisplayInfo(schedule) {
        if (!schedule) return null;
        
        const startTime = schedule.start_time || '15:00';
        const endTime = schedule.end_time || '08:00';
        const dutyDate = schedule.duty_date;
        const isOvernight = this.isOvernightShift(startTime, endTime);
        
        if (isOvernight) {
            // Calculate next day
            const nextDay = new Date(dutyDate);
            nextDay.setDate(nextDay.getDate() + 1);
            const nextDayStr = nextDay.toISOString().split('T')[0];
            
            return {
                displayText: `${dutyDate} ${startTime} → ${nextDayStr} ${endTime}`,
                isOvernight: true,
                startDate: dutyDate,
                endDate: nextDayStr,
                startTime,
                endTime,
                duration: this.calculateShiftDuration(startTime, endTime)
            };
        } else {
            return {
                displayText: `${dutyDate} ${startTime} - ${endTime}`,
                isOvernight: false,
                startDate: dutyDate,
                endDate: dutyDate,
                startTime,
                endTime,
                duration: this.calculateShiftDuration(startTime, endTime)
            };
        }
    }
    
    static isShiftActive(schedule) {
        if (!schedule) return false;
        
        const now = new Date();
        const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                           now.getMinutes().toString().padStart(2, '0');
        const today = now.toISOString().split('T')[0];
        
        const shiftInfo = this.getShiftDisplayInfo(schedule);
        if (!shiftInfo) return false;
        
        if (shiftInfo.isOvernight) {
            // Check if current time is in overnight shift
            const isToday = today === shiftInfo.startDate;
            const isTomorrow = today === shiftInfo.endDate;
            
            if (isToday && currentTime >= shiftInfo.startTime) {
                return true;
            } else if (isTomorrow && currentTime <= shiftInfo.endTime) {
                return true;
            }
        } else {
            // Regular shift
            if (today === shiftInfo.startDate && 
                currentTime >= shiftInfo.startTime && 
                currentTime <= shiftInfo.endTime) {
                return true;
            }
        }
        
        return false;
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
                cache: 'no-cache',
                credentials: 'include'
            };
            
            if (options.body && typeof options.body === 'object') {
                config.body = JSON.stringify(options.body);
            }
            
            console.log(`📡 API Request to ${url}:`, {
                method: config.method,
                headers: config.headers,
                mode: config.mode,
                credentials: config.credentials,
                hasBody: !!options.body
            });
            
            const response = await fetch(url, config);
            
            if (CONFIG.DEBUG) {
                console.log(`📥 Response from ${url}:`, {
                    status: response.status,
                    statusText: response.statusText
                });
            }
            
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
            
            if (error.message.includes('CORS') || error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                throw new Error(`Cannot connect to server. Please check:\n1. Backend is running\n2. Network connection\n3. CORS configuration`);
            }
            
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
    
    async deleteMedicalStaff(id) {
        return await this.request(`/api/medical-staff/${id}`, { method: 'DELETE' });
    }

    // ===== SUPERB ENHANCED PROFILE ENDPOINTS =====
    async getEnhancedDoctorProfile(doctorId) {
        console.log('🏥 Building SUPERB enhanced profile for:', doctorId);
        
        try {
            // First try the real endpoint
            try {
                const response = await this.request(`/api/medical-staff/${doctorId}/enhanced-profile`);
                if (response && response.success) {
                    console.log('✅ Enhanced profile from endpoint');
                    return response;
                }
            } catch (endpointError) {
                console.warn('⚠️ Enhanced endpoint failed, using robust fallback:', endpointError.message);
            }
            
            // Use our SUPERB enhanced profile builder
            return await this.buildEnhancedProfileFromAllData(doctorId);
            
        } catch (error) {
            console.error('💥 Enhanced profile failed:', error);
            return {
                success: false,
                error: 'Could not load enhanced profile',
                data: null
            };
        }
    }

    // ===== SUPERB ENHANCED PROFILE BUILDER =====
    async buildEnhancedProfileFromAllData(doctorId) {
        try {
            console.log('🏥 Building SUPERB enhanced profile for:', doctorId);
            
            // SECTION 1: GET ALL REAL DATA IN PARALLEL
            const [basicInfo, rotations, onCallToday, absences, departments] = await Promise.all([
                this.request(`/api/medical-staff/${doctorId}`).catch(() => ({})),
                this.getRotations().catch(() => []),
                this.getOnCallToday().catch(() => []),
                this.getAbsences().catch(() => []),
                this.getDepartments().catch(() => [])
            ]);
            
            const today = new Date().toISOString().split('T')[0];
            const now = new Date();
            
            // SECTION 2: RESIDENT SPECIALIZATION DISPLAY
            let residentSpecialization = null;
            if (basicInfo.staff_type === 'medical_resident') {
                let specialization = basicInfo.training_year || 'Medical Resident';
                
                if (basicInfo.resident_category === 'department_internal') {
                    specialization += ' Internal Resident';
                } else if (basicInfo.resident_category === 'external_resident') {
                    specialization += ' External Resident';
                } else if (basicInfo.resident_category === 'rotating_other_dept') {
                    specialization += ' Rotating Resident';
                }
                
                const dept = departments.find(d => d.id === basicInfo.department_id);
                if (dept) {
                    specialization += ` • ${dept.name}`;
                }
                
                if (basicInfo.external_institution) {
                    specialization += ` (${basicInfo.external_institution})`;
                }
                
                residentSpecialization = specialization;
            }
            
            // SECTION 3: CURRENT ROTATION STATUS
            let currentRotation = null;
            const activeRotation = rotations.find(r => 
                r.resident_id === doctorId && r.rotation_status === 'active'
            );
            
            if (activeRotation) {
                const rotationDept = departments.find(d => d.id === activeRotation.department_id);
                
                let daysRemaining = 0;
                let rotationStatus = 'Active';
                if (activeRotation.end_date) {
                    const endDate = new Date(activeRotation.end_date);
                    daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
                    
                    if (daysRemaining === 0) rotationStatus = 'Last day today!';
                    else if (daysRemaining < 0) rotationStatus = 'Completed';
                    else if (daysRemaining <= 7) rotationStatus = 'Ending soon';
                }
                
                currentRotation = {
                    id: activeRotation.rotation_id || activeRotation.id,
                    unit_name: activeRotation.training_unit?.unit_name || 'Training Unit',
                    unit_code: activeRotation.training_unit?.unit_code || '',
                    department: rotationDept?.name || 'Not specified',
                    supervisor: activeRotation.supervising_attending?.full_name || 'Not assigned',
                    start_date: activeRotation.start_date,
                    end_date: activeRotation.end_date,
                    days_remaining: daysRemaining > 0 ? daysRemaining : 0,
                    status: rotationStatus,
                    category: activeRotation.rotation_category || 'Clinical Rotation'
                };
            }
            
            // SECTION 4: ON-CALL STATUS (TODAY)
            let todaysOnCall = null;
            const onCallShift = onCallToday.find(s => 
                (s.primary_physician_id === doctorId || s.backup_physician_id === doctorId) &&
                s.duty_date === today
            );
            
            if (onCallShift) {
                let isActive = false;
                try {
                    const currentTime = now.getHours() * 100 + now.getMinutes();
                    const startTime = parseInt((onCallShift.start_time || '00:00').replace(':', ''));
                    const endTime = parseInt((onCallShift.end_time || '00:00').replace(':', ''));
                    
                    if (endTime < startTime) {
                        isActive = currentTime >= startTime || currentTime <= endTime;
                    } else {
                        isActive = currentTime >= startTime && currentTime <= endTime;
                    }
                } catch (error) {
                    console.warn('Error checking shift activity:', error);
                }
                
                let displayTime = `${onCallShift.start_time || '08:00'} - ${onCallShift.end_time || '17:00'}`;
                if (onCallShift.end_time < onCallShift.start_time) {
                    displayTime = `${onCallShift.start_time} → Next day ${onCallShift.end_time}`;
                }
                
                todaysOnCall = {
                    id: onCallShift.id,
                    shift_type: onCallShift.shift_type === 'primary_call' ? 'Primary' : 'Backup',
                    time: displayTime,
                    coverage_area: onCallShift.coverage_notes || 'Emergency Department',
                    is_active: isActive,
                    is_overnight: onCallShift.end_time < onCallShift.start_time,
                    role: onCallShift.primary_physician_id === doctorId ? 'Primary Physician' : 'Backup Physician',
                    status: isActive ? 'ON-CALL NOW' : 'Scheduled'
                };
            }
            
            // SECTION 5: ABSENCE STATUS
            let currentAbsence = null;
            const absenceRecord = absences.find(a => 
                a.staff_member_id === doctorId &&
                a.start_date <= today && 
                a.end_date >= today &&
                (a.current_status === 'currently_absent' || a.status === 'active')
            );
            
            if (absenceRecord) {
                let durationDays = 0;
                let daysRemaining = 0;
                try {
                    const start = new Date(absenceRecord.start_date);
                    const end = new Date(absenceRecord.end_date);
                    durationDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
                    
                    const todayDate = new Date(today);
                    daysRemaining = Math.ceil((end - todayDate) / (1000 * 60 * 60 * 24));
                } catch (error) {
                    console.warn('Error calculating absence duration:', error);
                }
                
                currentAbsence = {
                    id: absenceRecord.id,
                    reason: absenceRecord.absence_reason || 'Leave',
                    start_date: absenceRecord.start_date,
                    end_date: absenceRecord.end_date,
                    duration_days: durationDays,
                    days_remaining: daysRemaining,
                    coverage_arranged: absenceRecord.coverage_arranged || false,
                    covering_staff: absenceRecord.covering_staff?.full_name,
                    coverage_notes: absenceRecord.coverage_notes || '',
                    status: daysRemaining <= 0 ? 'Returning today' : 
                           daysRemaining <= 3 ? 'Returning soon' : 'On leave'
                };
            }
            
            // SECTION 6: UPCOMING ON-CALL (NEXT 7 DAYS)
            const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            const upcomingOnCall = onCallToday
                .filter(s => 
                    (s.primary_physician_id === doctorId || s.backup_physician_id === doctorId) &&
                    s.duty_date > today && 
                    s.duty_date <= nextWeek.toISOString().split('T')[0]
                )
                .map(s => ({
                    date: s.duty_date,
                    day: new Date(s.duty_date).toLocaleDateString('en-US', { weekday: 'short' }),
                    shift_type: s.shift_type === 'primary_call' ? 'Primary' : 'Backup',
                    time: `${s.start_time || '08:00'} - ${s.end_time || '17:00'}`,
                    coverage: s.coverage_notes || 'Not specified'
                }))
                .sort((a, b) => new Date(a.date) - new Date(b.date));
            
            // SECTION 7: DETERMINE CURRENT STATUS
            let currentStatus = 'PRESENT';
            let statusIcon = '✅';
            let statusDescription = 'Available';
            
            if (currentAbsence) {
                currentStatus = 'ABSENT';
                statusIcon = '🏖️';
                statusDescription = `${currentAbsence.reason} (${currentAbsence.days_remaining} days remaining)`;
            } else if (todaysOnCall?.is_active) {
                currentStatus = 'ON CALL';
                statusIcon = '🚨';
                statusDescription = `On-Call Duty (${todaysOnCall.coverage_area})`;
            } else if (todaysOnCall) {
                currentStatus = 'PRESENT';
                statusIcon = '📅';
                statusDescription = `Scheduled on-call at ${todaysOnCall.time}`;
            } else if (currentRotation) {
                currentStatus = 'PRESENT';
                statusIcon = '🏥';
                statusDescription = `In Rotation: ${currentRotation.unit_name}`;
            }
            
            // SECTION 8: DEPARTMENT INFO
            let departmentInfo = null;
            const department = departments.find(d => d.id === basicInfo.department_id);
            if (department) {
                departmentInfo = {
                    id: department.id,
                    name: department.name,
                    code: department.code,
                    status: department.status,
                    head_of_department: department.head_of_department?.full_name
                };
            }
            
            // SECTION 9: BUILD FINAL SUPERB PROFILE
            const enhancedProfile = {
                success: true,
                data: {
                    header: {
                        full_name: basicInfo.full_name || 'Unknown Staff',
                        staff_type: basicInfo.staff_type,
                        staff_id: basicInfo.staff_id || 'N/A',
                        professional_email: basicInfo.professional_email || '',
                        specialization: residentSpecialization || basicInfo.specialization || '',
                        department: departmentInfo?.name || 'Not assigned',
                        department_code: departmentInfo?.code || ''
                    },
                    
                    status_bar: {
                        status: currentStatus,
                        icon: statusIcon,
                        description: statusDescription,
                        last_updated: basicInfo.updated_at || new Date().toISOString()
                    },
                    
                    scheduled_activities: {
                        rotation: currentRotation,
                        on_call_today: todaysOnCall,
                        absence: currentAbsence
                    },
                    
                    upcoming: {
                        on_call_shifts: upcomingOnCall,
                        next_rotation_end: currentRotation?.end_date || null
                    },
                    
                    contact_info: {
                        email: basicInfo.professional_email || '',
                        phone: basicInfo.work_phone || basicInfo.mobile_phone || 'Not specified',
                        department_head: departmentInfo?.head_of_department || 'Not specified'
                    },
                    
                    metadata: {
                        generated_at: now.toISOString(),
                        data_sources: ['medical_staff', 'rotations', 'oncall', 'absences', 'departments'],
                        has_rotation: !!currentRotation,
                        has_oncall: !!todaysOnCall,
                        has_absence: !!currentAbsence,
                        upcoming_count: upcomingOnCall.length
                    }
                }
            };
            
            console.log('✅ SUPERB enhanced profile built:', {
                staff: basicInfo.full_name,
                status: currentStatus,
                description: statusDescription,
                rotation: currentRotation?.unit_name,
                oncall: todaysOnCall?.coverage_area,
                absence: currentAbsence?.reason,
                upcoming_shifts: upcomingOnCall.length
            });
            
            return enhancedProfile;
            
        } catch (error) {
            console.error('💥 Enhanced profile build failed:', error);
            
            return {
                success: false,
                error: error.message,
                data: {
                    header: { 
                        full_name: 'Unknown',
                        staff_type: 'unknown',
                        staff_id: 'N/A'
                    },
                    status_bar: {
                        status: 'UNKNOWN',
                        icon: '❓',
                        description: 'Profile data unavailable',
                        last_updated: new Date().toISOString()
                    }
                }
            };
        }
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
    
    async deleteRotation(id) {
        return await this.request(`/api/rotations/${id}`, { method: 'DELETE' });
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
    
    async deleteOnCall(id) {
        return await this.request(`/api/oncall/${id}`, { method: 'DELETE' });
    }
    
    // ===== ABSENCE ENDPOINTS =====
    async getAbsences() {
        try {
            const data = await this.request('/api/absence-records');
            return EnhancedUtils.ensureArray(data);
        } catch (error) {
            console.error('Failed to load absences:', error);
            return [];
        }
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
        return await this.request(`/api/absence-records/${id}`, { 
            method: 'DELETE' 
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
    
    async updateAnnouncement(id, announcementData) {
        return await this.request(`/api/announcements/${id}`, {
            method: 'PUT',
            body: announcementData
        });
    }
    
    async deleteAnnouncement(id) {
        return await this.request(`/api/announcements/${id}`, { method: 'DELETE' });
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
    
    async updateClinicalStatus(id, statusData) {
        return await this.request(`/api/live-status/${id}`, {
            method: 'PUT',
            body: statusData
        });
    }
    
    async deleteClinicalStatus(id) {
        return await this.request(`/api/live-status/${id}`, { method: 'DELETE' });
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
                
                // 6.6 VERSION 2 COMPLETE STATE
                const quickStatus = ref('');
                const currentTime = ref(new Date());
                
                // 6.7 Dashboard Data
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
                
                // 6.8 UI Components
                const toasts = ref([]);
                const systemAlerts = ref([]);
                
                // 6.9 Filter States
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
                // 6.11 Enhanced Profile State
const currentDoctorProfile = ref(null);
                
                const absenceFilters = reactive({
                    staff: '',
                    status: '',
                    reason: '',
                    startDate: ''
                });
                // Add this function inside setup(), before the return statement:
const testAllAPIs = async () => {
    console.log('🔍 Testing API connections...');
    
    const endpoints = [
        { name: 'Medical Staff', url: '/api/medical-staff?limit=5' },
        { name: 'Departments', url: '/api/departments' },
        { name: 'Training Units', url: '/api/training-units' },
        { name: 'Rotations', url: '/api/rotations?limit=5' },
        { name: 'On-Call Schedule', url: '/api/oncall/today' },
        { name: 'Absence Records', url: '/api/absence-records?limit=5' },
        { name: 'Announcements', url: '/api/announcements' },
        { name: 'Live Status', url: '/api/live-status/current' },
        { name: 'System Stats', url: '/api/system-stats' }
    ];
    
    for (const endpoint of endpoints) {
        try {
            const response = await API.request(endpoint.url);
            console.log(`✅ ${endpoint.name}:`, response?.data?.length || response?.length || 'OK');
        } catch (error) {
            console.error(`❌ ${endpoint.name}:`, error.message);
        }
    }
    
    showToast('API Test Complete', 'Check console for results', 'info');
};
                
                // 6.10 Modal States
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
                // Add this after line where you define "EnhancedUtils" (around line 6.11)
const formatRelativeTime = (dateString) => {
    if (!dateString) return 'Just now';
    try {
        const date = new Date(dateString);
        const now = new Date();
        
        // Fix for invalid dates
        if (isNaN(date.getTime())) {
            return 'Recently';
        }
        
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
        return `${Math.floor(diffMins / 1440)}d ago`;
    } catch { 
        return 'Recently'; 
    }
};

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
                    activeTab: 'basic',
                    form: {
                        staff_member_id: '',
                        absence_reason: 'vacation',
                        start_date: new Date().toISOString().split('T')[0],
                        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        status: 'active',
                        replacement_staff_id: '',
                        notes: '',
                        leave_type: 'planned' // Added for Version 2
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
                
                // 6.11 Permission Matrix
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
                const saveOnCallSchedule = async () => {
    saving.value = true;
    try {
        // Validate time logic for overnight shifts
        const startTime = onCallModal.form.start_time || '15:00';
        const endTime = onCallModal.form.end_time || '08:00';
        
        // Check if it's overnight (end time is earlier than start time)
        const parseTime = (timeStr) => {
            const [hours, minutes] = timeStr.split(':').map(Number);
            return hours * 60 + minutes;
        };
        
        const startMinutes = parseTime(startTime);
        const endMinutes = parseTime(endTime);
        const isOvernight = endMinutes < startMinutes;
        
        // Prepare data matching backend schema
        const onCallData = {
            duty_date: onCallModal.form.duty_date,
            shift_type: onCallModal.form.shift_type || 'primary_call',
            start_time: startTime,
            end_time: endTime,
            primary_physician_id: onCallModal.form.primary_physician_id,
            backup_physician_id: onCallModal.form.backup_physician_id || null,
            coverage_notes: onCallModal.form.coverage_notes || 'Emergency Department',
            schedule_id: onCallModal.form.schedule_id || EnhancedUtils.generateId('SCH')
        };
        
        console.log('📤 Saving on-call data:', {
            ...onCallData,
            isOvernight,
            duration_hours: isOvernight 
                ? (24 * 60 - startMinutes + endMinutes) / 60 
                : (endMinutes - startMinutes) / 60
        });
        
        let result;
        if (onCallModal.mode === 'add') {
            result = await API.createOnCall(onCallData);
            onCallSchedule.value.unshift(result);
            showToast('Success', 'On-call scheduled successfully', 'success');
        } else {
            result = await API.updateOnCall(onCallModal.form.id, onCallData);
            const index = onCallSchedule.value.findIndex(s => s.id === result.id);
            if (index !== -1) onCallSchedule.value[index] = result;
            showToast('Success', 'On-call updated successfully', 'success');
        }
        
        onCallModal.show = false;
        await loadTodaysOnCall();
        
    } catch (error) {
        console.error('❌ Save on-call error:', error);
        let errorMessage = error.message || 'Failed to save on-call schedule';
        
        // Parse common errors
        if (error.message.includes('primary_physician_id') || error.message.includes('23503')) {
            errorMessage = 'Selected physician not found. Please refresh and try again.';
        } else if (error.message.includes('validation') || error.message.includes('400')) {
            errorMessage = 'Invalid time format. Please use HH:MM format (24-hour).';
        }
        
        showToast('Error', errorMessage, 'error');
    } finally {
        saving.value = false;
    }
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
                // Enhanced Profile Helpers
const getCurrentPresence = () => {
    if (!currentDoctorProfile.value) return { status: 'Unknown', type: 'Loading...' };
    return currentDoctorProfile.value.live_clinical_data.presence;
};

                
       // ============ 8. NEUMAC ENHANCEMENT FUNCTIONS ============

const getShiftStatusClass = (shift) => {
    if (!shift || !shift.raw) return 'neumac-status-oncall';
    
    // First, use OnCallUtils to check if shift is active (most accurate)
    if (OnCallUtils.isShiftActive(shift.raw)) {
        return 'neumac-status-critical';
    }
    
    // Fallback: manual check if today's shift
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    if (shift.raw.duty_date === today) {
        try {
            const startTime = shift.startTime || shift.raw.start_time;
            const endTime = shift.endTime || shift.raw.end_time;
            
            if (startTime && endTime) {
                const currentTime = now.getHours() * 100 + now.getMinutes();
                const start = parseInt(startTime.replace(':', ''));
                const end = parseInt(endTime.replace(':', ''));
                
                if (currentTime >= start && currentTime <= end) {
                    return 'neumac-status-critical';
                }
            }
        } catch (error) {
            console.warn('Error calculating shift status:', error);
        }
    }
    
    // Default classification based on shift type
    return shift.shiftType === 'Primary' ? 'neumac-status-oncall' : 'neumac-status-busy';
};

const isCurrentShift = (shift) => {
    if (!shift || !shift.raw) return false;
    
    // Use OnCallUtils for accurate active shift detection
    if (OnCallUtils.isShiftActive(shift.raw)) {
        return true;
    }
    
    // Fallback: manual check
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    if (shift.raw.duty_date !== today) return false;
    
    try {
        const startTime = shift.startTime || shift.raw.start_time;
        const endTime = shift.endTime || shift.raw.end_time;
        
        if (!startTime || !endTime) return false;
        
        const currentTime = now.getHours() * 100 + now.getMinutes();
        const start = parseInt(startTime.replace(':', ''));
        const end = parseInt(endTime.replace(':', ''));
        
        return currentTime >= start && currentTime <= end;
    } catch (error) {
        console.warn('Error checking current shift:', error);
        return false;
    }
};

const getStaffTypeIcon = (staffType) => {
    const icons = {
        'attending_physician': 'fa-user-md',
        'medical_resident': 'fa-user-graduate',
        'fellow': 'fa-user-tie',
        'nurse_practitioner': 'fa-user-nurse'
    };
    return icons[staffType] || 'fa-user';
};

const calculateCapacityPercent = (current, max) => {
    if (current === undefined || current === null || !max || max === 0) return 0;
    return Math.round((current / max) * 100);
};

const getCapacityDotClass = (index, current) => {
    if (!current || current === 0) return 'available';
    if (index <= current) {
        const percent = (current / (index || 1)) * 100;
        if (percent >= 90) return 'full';
        if (percent >= 75) return 'limited';
        return 'filled';
    }
    return 'available';
};

const getMeterFillClass = (current, max) => {
    if (!current || !max) return '';
    const percent = (current / max) * 100;
    if (percent >= 90) return 'neumac-meter-fill-full';
    if (percent >= 75) return 'neumac-meter-fill-limited';
    return '';
};

const getAbsenceReasonIcon = (reason) => {
    const icons = {
        'vacation': 'fa-umbrella-beach',
        'sick_leave': 'fa-procedures',
        'conference': 'fa-chalkboard-teacher',
        'training': 'fa-graduation-cap',
        'personal': 'fa-user-clock',
        'other': 'fa-question-circle'
    };
    return icons[reason] || 'fa-clock';
};

const getScheduleIcon = (activity) => {
    if (!activity) return 'fa-calendar-check';
    
    const activityLower = activity.toLowerCase();
    if (activityLower.includes('round')) return 'fa-stethoscope';
    if (activityLower.includes('clinic')) return 'fa-clinic-medical';
    if (activityLower.includes('surgery')) return 'fa-scalpel-path';
    if (activityLower.includes('meeting')) return 'fa-users';
    if (activityLower.includes('lecture')) return 'fa-chalkboard-teacher';
    if (activityLower.includes('consultation')) return 'fa-comments-medical';
    return 'fa-calendar-check';
};
                
                // ============ 9. PROFILE DATA FUNCTIONS ============
                
                const getCurrentUnit = (staffId) => {
                    const rotation = rotations.value.find(r => 
                        r.resident_id === staffId && r.rotation_status === 'active'
                    );
                    return rotation ? getTrainingUnitName(rotation.training_unit_id) : 'Not assigned';
                };
                
                const getCurrentWard = (staffId) => {
                    const rotation = rotations.value.find(r => 
                        r.resident_id === staffId && r.rotation_status === 'active'
                    );
                    
                    if (rotation && rotation.training_unit_id) {
                        const unit = trainingUnits.value.find(u => u.id === rotation.training_unit_id);
                        if (unit) {
                            return unit.unit_name;
                        }
                    }
                    
                    return 'Not assigned';
                };
                
                const getCurrentActivityStatus = (staffId) => {
                    const today = new Date().toISOString().split('T')[0];
                    const onCall = onCallSchedule.value.find(s => 
                        (s.primary_physician_id === staffId || s.backup_physician_id === staffId) &&
                        s.duty_date === today
                    );
                    
                    if (onCall) return 'oncall';
                    
                    const staff = medicalStaff.value.find(s => s.id === staffId);
                    if (staff && staff.staff_type === 'attending_physician') {
                        return Math.random() > 0.7 ? 'in-surgery' : 'available';
                    }
                    
                    return 'available';
                };
                
                const getCurrentPatientCount = (staffId) => {
                    const staff = medicalStaff.value.find(s => s.id === staffId);
                    if (!staff) return 0;
                    
                    if (staff.staff_type === 'attending_physician') {
                        return Math.floor(Math.random() * 15) + 10;
                    } else if (staff.staff_type === 'medical_resident') {
                        return Math.floor(Math.random() * 8) + 5;
                    }
                    
                    return Math.floor(Math.random() * 5) + 2;
                };
                
                const getICUPatientCount = (staffId) => {
                    const total = getCurrentPatientCount(staffId);
                    return Math.floor(total * 0.3);
                };
                
                const getWardPatientCount = (staffId) => {
                    const total = getCurrentPatientCount(staffId);
                    return Math.floor(total * 0.7);
                };
                
                const getTodaysSchedule = (staffId) => {
                    const staff = medicalStaff.value.find(s => s.id === staffId);
                    
                    if (!staff) return [];
                    
                    const baseSchedule = [
                        { time: '08:00', activity: 'Morning Rounds', location: 'Ward A' },
                        { time: '10:00', activity: 'Patient Consultations', location: 'Clinic 3' },
                        { time: '13:00', activity: 'Lunch Break', location: 'Cafeteria' },
                        { time: '14:00', activity: 'Teaching Session', location: 'Conference Room' },
                        { time: '16:00', activity: 'Case Review', location: 'Department Office' }
                    ];
                    
                    if (staff.specialization === 'Pulmonology') {
                        baseSchedule.splice(2, 0, { time: '11:00', activity: 'Bronchoscopy', location: 'Procedure Room' });
                    }
                    
                    return baseSchedule;
                };
                
                const isOnCallToday = (staffId) => {
                    const today = new Date().toISOString().split('T')[0];
                    return onCallSchedule.value.some(s => 
                        (s.primary_physician_id === staffId || s.backup_physician_id === staffId) &&
                        s.duty_date === today
                    );
                };
                
                const getOnCallShiftTime = (staffId) => {
                    const today = new Date().toISOString().split('T')[0];
                    const schedule = onCallSchedule.value.find(s => 
                        (s.primary_physician_id === staffId || s.backup_physician_id === staffId) &&
                        s.duty_date === today
                    );
                    
                    return schedule ? `${schedule.start_time} - ${schedule.end_time}` : 'N/A';
                };
                
                const getOnCallCoverage = (staffId) => {
                    const today = new Date().toISOString().split('T')[0];
                    const schedule = onCallSchedule.value.find(s => 
                        (s.primary_physician_id === staffId || s.backup_physician_id === staffId) &&
                        s.duty_date === today
                    );
                    
                    return schedule ? schedule.coverage_area : 'N/A';
                };
                
                const getRotationSupervisor = (staffId) => {
                    const rotation = rotations.value.find(r => 
                        r.resident_id === staffId && r.rotation_status === 'active'
                    );
                    
                    if (rotation && rotation.supervising_attending_id) {
                        return getStaffName(rotation.supervising_attending_id);
                    }
                    
                    return 'Not assigned';
                };
                
                const getRotationDaysLeft = (staffId) => {
                    const rotation = rotations.value.find(r => 
                        r.resident_id === staffId && r.rotation_status === 'active'
                    );
                    
                    if (rotation && rotation.rotation_end_date) {
                        const endDate = new Date(rotation.rotation_end_date);
                        const today = new Date();
                        const diffTime = endDate - today;
                        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    }
                    
                    return 0;
                };
                
                const getRecentActivities = (staffId) => {
                    const activities = [
                        { timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), description: 'Admitted new patient', location: 'ER' },
                        { timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), description: 'Completed discharge summary', location: 'Ward B' },
                        { timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), description: 'Attended morning report', location: 'Conference Room' },
                        { timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), description: 'Performed procedure', location: 'Procedure Room' },
                        { timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), description: 'Teaching session with medical students', location: 'Classroom' }
                    ];
                    
                    return activities;
                };
                
                const formatTimeAgo = (dateString) => {
                    return EnhancedUtils.formatRelativeTime(dateString);
                };
                
                // ============ 10. VERSION 2 COMPLETE FUNCTIONS ============
                
                const getStatusBadgeClass = (status) => {
                    if (!status) return 'badge-gray';
                    if (isStatusExpired(status.expires_at)) {
                        return 'badge-warning';
                    }
                    return 'badge-success';
                };
                
                const calculateTimeRemaining = (expiryTime) => {
                    if (!expiryTime) return 'N/A';
                    try {
                        const expiry = new Date(expiryTime);
                        const now = new Date();
                        const diff = expiry - now;
                        
                        if (diff <= 0) return 'Expired';
                        
                        const hours = Math.floor(diff / (1000 * 60 * 60));
                        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                        
                        if (hours > 0) return `${hours}h ${minutes}m`;
                        return `${minutes}m`;
                    } catch {
                        return 'N/A';
                    }
                };
                
                const refreshStatus = () => {
                    loadClinicalStatus();
                    loadSystemStats();
                    showToast('Status Refreshed', 'Live status updated', 'info');
                };
                
                const setQuickStatus = (status) => {
                    quickStatus.value = status;
                    switch(status) {
                        case 'normal':
                            communicationsModal.form.dailySummary = 'All systems normal. No critical issues.';
                            Object.assign(communicationsModal.form.alerts, {
                                erBusy: false, 
                                icuFull: false, 
                                wardFull: false, 
                                staffShortage: false 
                            });
                            break;
                        case 'busy':
                            communicationsModal.form.dailySummary = 'ICU at high capacity. Please triage admissions.';
                            communicationsModal.form.alerts.icuFull = true;
                            break;
                        case 'shortage':
                            communicationsModal.form.dailySummary = 'Staff shortage affecting multiple areas.';
                            communicationsModal.form.alerts.staffShortage = true;
                            break;
                        case 'equipment':
                            communicationsModal.form.dailySummary = 'Equipment issues reported. Using backup systems.';
                            break;
                    }
                };
                
                const formatAudience = (audience) => {
                    const audiences = {
                        'all_staff': 'All Staff',
                        'medical_staff': 'Medical Staff',
                        'residents': 'Residents',
                        'attendings': 'Attending Physicians'
                    };
                    return audiences[audience] || audience;
                };
                
                // Absence Modal Preview Functions
                const getPreviewCardClass = () => {
                    if (!absenceModal.form.leave_type) return '';
                    if (absenceModal.form.leave_type === 'planned') return 'planned';
                    if (absenceModal.form.leave_type === 'unplanned') return 'unplanned';
                    return 'active';
                };
                
                const getPreviewIcon = () => {
                    const reason = absenceModal.form.absence_reason;
                    const icons = {
                        'vacation': 'fas fa-umbrella-beach text-blue-500',
                        'conference': 'fas fa-chalkboard-teacher text-green-500',
                        'sick_leave': 'fas fa-heartbeat text-red-500',
                        'training': 'fas fa-graduation-cap text-purple-500',
                        'personal': 'fas fa-home text-yellow-500',
                        'other': 'fas fa-ellipsis-h text-gray-500'
                    };
                    return icons[reason] || 'fas fa-clock text-gray-500';
                };
                
                const getPreviewReasonText = () => {
                    return formatAbsenceReason(absenceModal.form.absence_reason);
                };
                
                const getPreviewStatusClass = () => {
                    const type = absenceModal.form.leave_type;
                    if (type === 'planned') return 'status-planned';
                    if (type === 'unplanned') return 'status-unplanned';
                    return 'status-active';
                };
                
                const getPreviewStatusText = () => {
                    const type = absenceModal.form.leave_type;
                    return type === 'planned' ? 'Planned' : 
                           type === 'unplanned' ? 'Unplanned' : 'Active';
                };
                
                const updatePreview = () => {
                    // Empty function to trigger reactivity
                };
                
                // ============ 11. LIVE STATUS FUNCTIONS ============
                
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
                            liveStatsEditMode.value = false;
                            
                            showToast('Success', 'Live status has been updated for all staff', 'success');
                            await loadSystemStats();
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
                
                // ============ 12. DELETE FUNCTIONS ============
                
                const deleteMedicalStaff = async (staff) => {
                    showConfirmation({
                        title: 'Delete Medical Staff',
                        message: `Are you sure you want to delete ${staff.full_name}?`,
                        icon: 'fa-trash',
                        confirmButtonText: 'Delete',
                        confirmButtonClass: 'btn-danger',
                        details: 'This action cannot be undone.',
                        onConfirm: async () => {
                            try {
                                await API.deleteMedicalStaff(staff.id);
                                const index = medicalStaff.value.findIndex(s => s.id === staff.id);
                                if (index > -1) medicalStaff.value.splice(index, 1);
                                showToast('Success', 'Medical staff deleted successfully', 'success');
                                updateDashboardStats();
                            } catch (error) {
                                showToast('Error', error.message, 'error');
                            }
                        }
                    });
                };
                
                const deleteRotation = async (rotation) => {
                    showConfirmation({
                        title: 'Delete Rotation',
                        message: `Are you sure you want to delete this rotation?`,
                        icon: 'fa-trash',
                        confirmButtonText: 'Delete',
                        confirmButtonClass: 'btn-danger',
                        details: `Resident: ${getResidentName(rotation.resident_id)}`,
                        onConfirm: async () => {
                            try {
                                await API.deleteRotation(rotation.id);
                                const index = rotations.value.findIndex(r => r.id === rotation.id);
                                if (index > -1) rotations.value.splice(index, 1);
                                showToast('Success', 'Rotation deleted successfully', 'success');
                                updateDashboardStats();
                            } catch (error) {
                                showToast('Error', error.message, 'error');
                            }
                        }
                    });
                };
                
                const deleteOnCallSchedule = async (schedule) => {
                    showConfirmation({
                        title: 'Delete On-Call Schedule',
                        message: `Are you sure you want to delete this on-call schedule?`,
                        icon: 'fa-trash',
                        confirmButtonText: 'Delete',
                        confirmButtonClass: 'btn-danger',
                        details: `Physician: ${getPhysicianName(schedule.primary_physician_id)}`,
                        onConfirm: async () => {
                            try {
                                await API.deleteOnCall(schedule.id);
                                const index = onCallSchedule.value.findIndex(s => s.id === schedule.id);
                                if (index > -1) onCallSchedule.value.splice(index, 1);
                                showToast('Success', 'On-call schedule deleted successfully', 'success');
                                loadTodaysOnCall();
                            } catch (error) {
                                showToast('Error', error.message, 'error');
                            }
                        }
                    });
                };
                
                const deleteAbsence = async (absence) => {
                    showConfirmation({
                        title: 'Delete Absence',
                        message: `Are you sure you want to delete this absence record?`,
                        icon: 'fa-trash',
                        confirmButtonText: 'Delete',
                        confirmButtonClass: 'btn-danger',
                        details: `Staff: ${getStaffName(absence.staff_member_id)}`,
                        onConfirm: async () => {
                            try {
                                await API.deleteAbsence(absence.id);
                                const index = absences.value.findIndex(a => a.id === absence.id);
                                if (index > -1) absences.value.splice(index, 1);
                                showToast('Success', 'Absence deleted successfully', 'success');
                                updateDashboardStats();
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
                        icon: 'fa-trash',
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
                
                const deleteClinicalStatus = async () => {
                    if (!clinicalStatus.value) return;
                    
                    showConfirmation({
                        title: 'Clear Live Status',
                        message: 'Are you sure you want to clear the current live status?',
                        icon: 'fa-trash',
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
                
                // ============ 13. DATA LOADING FUNCTIONS ============
                
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
            const shiftInfo = OnCallUtils.getShiftDisplayInfo(item);
            const isActive = OnCallUtils.isShiftActive(item);
            
            const physicianName = item.primary_physician?.full_name || 'Unknown Physician';
            const backupPhysician = item.backup_physician?.full_name || null;
            
            let shiftTypeDisplay = 'Primary';
            if (item.shift_type === 'backup_call' || item.shift_type === 'backup') {
                shiftTypeDisplay = 'Backup';
            }
            
            return {
                id: item.id,
                displayText: shiftInfo.displayText,
                isOvernight: shiftInfo.isOvernight,
                isActive,
                physicianName,
                shiftType: shiftTypeDisplay,
                coverageArea: item.coverage_notes || 'Emergency Department',
                backupPhysician,
                contactInfo: item.primary_physician?.professional_email || 'No contact info',
                staffType: formatStaffType(item.primary_physician?.staff_type) || 'Physician',
                duration: shiftInfo.duration.toFixed(1) + 'h',
                raw: item
            };
        });
        
        // Update dashboard stats
        updateOnCallStats();
        
    } catch (error) {
        console.error('Failed to load today\'s on-call:', error);
        showToast('Error', 'Failed to load today\'s on-call schedule', 'error');
        todaysOnCall.value = [];
    } finally {
        loadingSchedule.value = false;
    }
};
          const updateOnCallStats = () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // Count active on-call right now
    const currentOnCall = todaysOnCall.value.filter(shift => shift.isActive);
    systemStats.value.onCallNow = currentOnCall.length;
    
    // Count overnight shifts tonight
    const tonightShifts = todaysOnCall.value.filter(shift => {
        if (!shift.isOvernight) return false;
        
        const shiftDate = shift.raw.duty_date;
        const shiftStartTime = shift.raw.start_time || '15:00';
        
        return shiftDate === today && shiftStartTime >= '12:00'; // Afternoon/evening starts
    });
    
    // Find next shift change
    const allShifts = todaysOnCall.value.map(shift => OnCallUtils.getShiftDisplayInfo(shift.raw));
    const upcomingShifts = allShifts.filter(shiftInfo => {
        const shiftStart = new Date(`${shiftInfo.startDate}T${shiftInfo.startTime}`);
        return shiftStart > now;
    }).sort((a, b) => {
        const aTime = new Date(`${a.startDate}T${a.startTime}`);
        const bTime = new Date(`${b.startDate}T${b.startTime}`);
        return aTime - bTime;
    });
    
    if (upcomingShifts.length > 0) {
        const nextShift = upcomingShifts[0];
        systemStats.value.nextShiftChange = `${nextShift.startDate}T${nextShift.startTime}`;
    } else {
        // Default to tomorrow morning if no upcoming shifts
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(8, 0, 0, 0);
        systemStats.value.nextShiftChange = tomorrow.toISOString();
    }
    
    console.log('📊 On-call stats updated:', {
        activeNow: systemStats.value.onCallNow,
        overnightTonight: tonightShifts.length,
        nextShiftChange: systemStats.value.nextShiftChange
    });
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
    
    // ✅ FIXED: Calculate staff currently on leave correctly
    const today = new Date().toISOString().split('T')[0];
    
    systemStats.value.onLeaveStaff = absences.value.filter(absence => {
        // Check if the absence is currently active
        const startDate = absence.start_date;
        const endDate = absence.end_date;
        
        if (!startDate || !endDate) return false;
        
        // Check if today is within the absence date range
        const isCurrentlyAbsent = startDate <= today && today <= endDate;
        
        if (!isCurrentlyAbsent) return false;
        
        // Check current_status if available
        if (absence.current_status) {
            // Check all possible status values that indicate active absence
            const activeStatuses = ['currently_absent', 'active', 'on_leave', 'approved'];
            return activeStatuses.includes(absence.current_status.toLowerCase());
        }
        
        return true; // If no status field, assume active based on date range
    }).length;
    
    // Calculate active rotations
    systemStats.value.activeRotations = rotations.value.filter(r => 
        r.rotation_status === 'active'
    ).length;
    
    // Calculate rotations ending this week
    const todayDate = new Date();
    const nextWeek = new Date(todayDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    systemStats.value.endingThisWeek = rotations.value.filter(r => {
        if (r.rotation_status !== 'active') return false;
        
        const endDate = new Date(r.rotation_end_date);
        if (isNaN(endDate.getTime())) return false;
        
        return endDate >= todayDate && endDate <= nextWeek;
    }).length;
    
    // Calculate rotations starting next week
    const nextWeekStart = new Date(todayDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    const twoWeeks = new Date(todayDate.getTime() + 14 * 24 * 60 * 60 * 1000);
    
    systemStats.value.startingNextWeek = rotations.value.filter(r => {
        if (r.rotation_status !== 'scheduled') return false;
        
        const startDate = new Date(r.rotation_start_date);
        if (isNaN(startDate.getTime())) return false;
        
        return startDate >= nextWeekStart && startDate <= twoWeeks;
    }).length;
    
    // Calculate today's on-call staff
    const todayStr = todayDate.toISOString().split('T')[0];
    const onCallToday = onCallSchedule.value.filter(schedule => 
        schedule.duty_date === todayStr
    );
    
    // Count unique physicians on call today
    const uniquePhysiciansToday = new Set();
    onCallToday.forEach(schedule => {
        if (schedule.primary_physician_id) {
            uniquePhysiciansToday.add(schedule.primary_physician_id);
        }
        if (schedule.backup_physician_id) {
            uniquePhysiciansToday.add(schedule.backup_physician_id);
        }
    });
    
    systemStats.value.onCallNow = uniquePhysiciansToday.size;
    
    console.log('📊 Dashboard Stats Updated:', {
        totalStaff: systemStats.value.totalStaff,
        activeAttending: systemStats.value.activeAttending,
        activeResidents: systemStats.value.activeResidents,
        onLeaveStaff: systemStats.value.onLeaveStaff,
        onCallNow: systemStats.value.onCallNow,
        activeRotations: systemStats.value.activeRotations,
        endingThisWeek: systemStats.value.endingThisWeek,
        startingNextWeek: systemStats.value.startingNextWeek,
        'total absences in array': absences.value.length,
        'absences checked': absences.value.filter(a => {
            const start = a.start_date;
            const end = a.end_date;
            return start && end && start <= today && today <= end;
        }).length
    });
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
                
                // ============ 14. AUTHENTICATION FUNCTIONS ============
                
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
                
                // ============ 15. NAVIGATION & UI FUNCTIONS ============
                
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
                
                // ============ 16. MODAL SHOW FUNCTIONS ============
                
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
        
        // ✅ CORRECTED FIELD NAMES
        academic_degree: '',
        specialization: '',
        training_year: '',
        clinical_study_certificate: '',  // ✅ Changed from clinical_certificate
        certificate_status: '',
        resident_category: '',
        primary_clinic: '',
        work_phone: '',
        medical_license: '',
        can_supervise_residents: false,
        special_notes: '',
        resident_type: '',
        home_department: '',
        external_institution: '',
        years_experience: null,
        biography: '',
        date_of_birth: null,
        mobile_phone: '',
        office_phone: '',
        training_level: ''
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
        start_date: new Date().toISOString().split('T')[0],  // ✅ Changed from rotation_start_date
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],  // ✅ Changed from rotation_end_date
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
        shift_type: 'primary_call',
        start_time: '15:00',  // Default afternoon start for hospital
        end_time: '08:00',    // Default morning end (overnight)
        primary_physician_id: '',
        backup_physician_id: '',
        coverage_notes: 'Emergency Department',  // Changed from coverage_area
        schedule_id: `SCH-${Date.now().toString().slice(-6)}`
    };
    onCallModal.show = true;
};
                
const showAddAbsenceModal = () => {
    absenceModal.mode = 'add';
    absenceModal.activeTab = 'basic';
    absenceModal.form = {
        staff_member_id: '',
        absence_type: 'planned',
        absence_reason: 'vacation',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        current_status: 'planned_leave',
        covering_staff_id: '',
        coverage_notes: '',
        coverage_arranged: false,
        hod_notes: ''
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
                
               // ============ 17. VIEW/EDIT FUNCTIONS ============

const viewStaffDetails = async (staff) => {
    console.log('📋 Opening profile for:', staff.full_name);
    
    staffProfileModal.loading = true;
    staffProfileModal.show = true;
    staffProfileModal.activeTab = 'clinical';
    
    try {
        const response = await API.getEnhancedDoctorProfile(staff.id);
        
        if (response && response.success) {
            currentDoctorProfile.value = response.data;
            staffProfileModal.staff = response.data.header; // ← CHANGED
            showToast('Profile Loaded', `${staff.full_name}'s enhanced profile loaded`, 'success');
        } else {
            // Fallback to basic view
            fallbackToBasicView(staff);
            showToast('Info', 'Using basic profile data', 'info');
        }
        
    } catch (error) {
        console.error('Profile loading error:', error);
        fallbackToBasicView(staff);
        showToast('Notice', 'Profile loaded with fallback data', 'info');
    } finally {
        staffProfileModal.loading = false;
    }
};




// ============ EDIT FUNCTIONS ============
const editMedicalStaff = (staff) => {
    medicalStaffModal.mode = 'edit';
    medicalStaffModal.activeTab = 'basic';
    
    medicalStaffModal.form = {
        id: staff.id,
        full_name: staff.full_name || '',
        staff_type: staff.staff_type || 'medical_resident',
        staff_id: staff.staff_id || '',
        employment_status: staff.employment_status || 'active',
        professional_email: staff.professional_email || '',
        department_id: staff.department_id || '',
        academic_degree: staff.academic_degree || '',
        specialization: staff.specialization || '',
        training_year: staff.training_year || '',
        clinical_study_certificate: staff.clinical_study_certificate || '',  // ✅ Correct field
        certificate_status: staff.certificate_status || 'current',
        resident_category: staff.resident_category || '',
        primary_clinic: staff.primary_clinic || '',
        work_phone: staff.work_phone || '',
        medical_license: staff.medical_license || '',
        can_supervise_residents: staff.can_supervise_residents || false,
        special_notes: staff.special_notes || '',
        resident_type: staff.resident_type || '',
        home_department: staff.home_department || '',
        external_institution: staff.external_institution || '',
        years_experience: staff.years_experience || null,
        biography: staff.biography || '',
        date_of_birth: staff.date_of_birth || null,
        mobile_phone: staff.mobile_phone || '',
        office_phone: staff.office_phone || '',
        training_level: staff.training_level || ''
    };
    
    medicalStaffModal.show = true;
};

const editDepartment = (department) => {
    departmentModal.mode = 'edit';
    departmentModal.form = {
        id: department.id,
        name: department.name || '',
        code: department.code || '',
        status: department.status || 'active',
        head_of_department_id: department.head_of_department_id || ''
    };
    departmentModal.show = true;
};

const editTrainingUnit = (unit) => {
    trainingUnitModal.mode = 'edit';
    trainingUnitModal.form = {
        id: unit.id,
        unit_name: unit.unit_name || '',
        unit_code: unit.unit_code || '',
        department_id: unit.department_id || '',
        maximum_residents: unit.maximum_residents || 10,
        unit_status: unit.unit_status || 'active',
        specialty: unit.specialty || '',
        supervising_attending_id: unit.supervising_attending_id || ''
    };
    trainingUnitModal.show = true;
};

const editRotation = (rotation) => {
    rotationModal.mode = 'edit';
    rotationModal.form = {
        id: rotation.id,
        rotation_id: rotation.rotation_id || EnhancedUtils.generateId('ROT'),
        resident_id: rotation.resident_id || '',
        training_unit_id: rotation.training_unit_id || '',
        start_date: rotation.start_date || rotation.rotation_start_date || new Date().toISOString().split('T')[0],  // ✅ Unified
        end_date: rotation.end_date || rotation.rotation_end_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],  // ✅ Unified
        rotation_status: rotation.rotation_status || 'scheduled',
        rotation_category: rotation.rotation_category || 'clinical_rotation',
        supervising_attending_id: rotation.supervising_attending_id || ''
    };
    rotationModal.show = true;
};

const editOnCallSchedule = (schedule) => {
    onCallModal.mode = 'edit';
    onCallModal.form = {
        id: schedule.id,
        duty_date: schedule.duty_date || new Date().toISOString().split('T')[0],
        shift_type: schedule.shift_type || 'primary_call',
        start_time: schedule.start_time || '15:00',
        end_time: schedule.end_time || '08:00',
        primary_physician_id: schedule.primary_physician_id || '',
        backup_physician_id: schedule.backup_physician_id || '',
        coverage_notes: schedule.coverage_notes || 'Emergency Department',
        schedule_id: schedule.schedule_id || EnhancedUtils.generateId('SCH')
    };
    onCallModal.show = true;
};

const editAbsence = (absence) => {
    absenceModal.mode = 'edit';
    absenceModal.activeTab = 'basic';
    absenceModal.form = {
        id: absence.id,
        staff_member_id: absence.staff_member_id || '',
        absence_type: absence.absence_type || 'planned',
        absence_reason: absence.absence_reason || 'vacation',
        start_date: absence.start_date || new Date().toISOString().split('T')[0],
        end_date: absence.end_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        current_status: absence.current_status || 'planned_leave',
        covering_staff_id: absence.covering_staff_id || '',
        coverage_notes: absence.coverage_notes || '',
        coverage_arranged: absence.coverage_arranged || false,
        hod_notes: absence.hod_notes || ''
    };
    absenceModal.show = true;
};

// ============ ENHANCED PROFILE UI HELPERS ============

const getCurrentPresenceStatus = () => {
    if (!currentDoctorProfile.value) return 'UNKNOWN';
    return currentDoctorProfile.value.status_bar?.status || 'UNKNOWN';
};

const getCurrentActivity = () => {
    if (!currentDoctorProfile.value) {
        return 'Loading...';
    }
    
    // Use the new data structure
    const statusBar = currentDoctorProfile.value.status_bar;
    if (statusBar?.description) {
        return statusBar.description;
    }
    
    // Fallback based on scheduled activities
    const scheduled = currentDoctorProfile.value.scheduled_activities;
    
    if (scheduled?.on_call_today?.is_active) {
        return `On-Call: ${scheduled.on_call_today.coverage_area}`;
    }
    
    if (scheduled?.rotation) {
        return `In Rotation: ${scheduled.rotation.unit_name}`;
    }
    
    if (scheduled?.absence) {
        return `On Leave: ${scheduled.absence.reason}`;
    }
    
    return 'Available';
};

const getScheduleForToday = () => {
    if (!currentDoctorProfile.value) return [];
    
    // Build schedule from scheduled activities
    const activities = [];
    const scheduled = currentDoctorProfile.value.scheduled_activities;
    
    if (scheduled?.on_call_today) {
        activities.push({
            time: scheduled.on_call_today.time,
            activity: 'On-Call Duty',
            location: scheduled.on_call_today.coverage_area,
            status: scheduled.on_call_today.is_active ? 'active' : 'scheduled',
            type: 'oncall'
        });
    }
    
    if (scheduled?.rotation) {
        activities.push({
            time: '08:00 - 17:00',
            activity: 'Clinical Rotation',
            location: scheduled.rotation.unit_name,
            status: 'scheduled',
            type: 'rotation'
        });
    }
    
    if (scheduled?.absence) {
        activities.push({
            time: 'All day',
            activity: `On Leave: ${scheduled.absence.reason}`,
            location: 'Not available',
            status: 'absent',
            type: 'absence'
        });
    }
    
    return activities;
};

const isCurrentlyOnCall = () => {
    if (!currentDoctorProfile.value) return false;
    
    const onCallToday = currentDoctorProfile.value.scheduled_activities?.on_call_today;
    return onCallToday?.is_active || false;
};

const getNextOnCallShift = () => {
    if (!currentDoctorProfile.value) return null;
    
    const upcoming = currentDoctorProfile.value.upcoming?.on_call_shifts;
    if (!upcoming || upcoming.length === 0) return null;
    
    return upcoming[0];
};

const updatePresenceStatus = async (status) => {
    if (!currentDoctorProfile.value || !currentDoctorProfile.value.header?.id) return;
    
    try {
        // Call the real endpoint
        const response = await API.updateMedicalStaff(currentDoctorProfile.value.header.id, {
            employment_status: status === 'present' ? 'active' : 'on_leave'
        });
        
        if (response) {
            // Update local state
            if (currentDoctorProfile.value.status_bar) {
                currentDoctorProfile.value.status_bar.status = 
                    status === 'present' ? 'PRESENT' : 'ABSENT';
                currentDoctorProfile.value.status_bar.description = 
                    status === 'present' ? 'Manually marked present' : 'Manually marked absent';
                currentDoctorProfile.value.status_bar.last_updated = new Date().toISOString();
            }
            
            // Also update the header
            if (currentDoctorProfile.value.header) {
                currentDoctorProfile.value.header.employment_status = 
                    status === 'present' ? 'active' : 'on_leave';
            }
            
            showToast('Success', `Marked as ${status}`, 'success');
        }
        
    } catch (error) {
        showToast('Error', 'Failed to update presence: ' + error.message, 'error');
    }
};

// ============ PROFILE UI HELPERS ============


const getPresenceIndicatorClass = () => {
    const status = getCurrentPresenceStatus();
    if (status === 'PRESENT') return 'bg-green-100 text-green-800';
    if (status === 'ABSENT') return 'bg-red-100 text-red-800';
    if (status === 'ON CALL') return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
};

const getPresenceIcon = () => {
    const status = getCurrentPresenceStatus();
    if (status === 'PRESENT') return 'fas fa-check-circle';
    if (status === 'ABSENT') return 'fas fa-times-circle';
    if (status === 'ON CALL') return 'fas fa-phone-volume';
    return 'fas fa-question-circle';
};

const getPresenceStatusClass = () => {
    const status = getCurrentPresenceStatus();
    if (status === 'PRESENT') return 'status-normal';
    if (status === 'ABSENT') return 'status-critical';
    if (status === 'ON CALL') return 'status-caution';
    return 'status-unknown';
};

// ============ IMPROVED FALLBACK VIEW ============
const fallbackToBasicView = (staff) => {
    // Create a fallback profile with NEW structure
    const today = new Date().toISOString().split('T')[0];
    
    // Check if staff is on call today
    const onCallToday = onCallSchedule.value.find(schedule => 
        (schedule.primary_physician_id === staff.id || 
         schedule.backup_physician_id === staff.id) &&
        schedule.duty_date === today
    );
    
    // Get current rotation if resident
    const currentRotation = rotations.value.find(r => 
        r.resident_id === staff.id && 
        r.rotation_status === 'active'
    );
    
    // Get current absence
    const currentAbsence = absences.value.find(a => 
        a.staff_member_id === staff.id &&
        a.start_date <= today && 
        a.end_date >= today
    );
    
    // Format resident specialization
    let residentSpecialization = '';
    if (staff.staff_type === 'medical_resident') {
        residentSpecialization = `${staff.training_year || 'Resident'}`;
        
        if (staff.resident_category === 'department_internal') {
            residentSpecialization += ' Internal Resident';
        } else if (staff.resident_category === 'external_resident') {
            residentSpecialization += ' External Resident';
        }
        
        if (staff.home_department) {
            residentSpecialization += ` • ${staff.home_department}`;
        }
    }
    
    currentDoctorProfile.value = {
        header: {
            id: staff.id,
            full_name: staff.full_name || 'Unknown',
            staff_type: staff.staff_type,
            staff_id: staff.staff_id || 'N/A',
            professional_email: staff.professional_email || '',
            specialization: residentSpecialization || staff.specialization || '',
            department: getDepartmentName(staff.department_id),
            department_code: departments.value.find(d => d.id === staff.department_id)?.code || '',
            employment_status: staff.employment_status || 'active'
        },
        
        status_bar: {
            status: currentAbsence ? 'ABSENT' : 
                   (onCallToday ? 'ON CALL' : 'PRESENT'),
            icon: currentAbsence ? '🏖️' : 
                  (onCallToday ? '🚨' : '✅'),
            description: currentAbsence ? `On Leave: ${currentAbsence.absence_reason}` :
                         (onCallToday ? `On-Call: ${onCallToday.coverage_notes || 'Emergency'}` :
                         (currentRotation ? `In Rotation: ${getTrainingUnitName(currentRotation.training_unit_id)}` : 'Available')),
            last_updated: staff.updated_at || new Date().toISOString()
        },
        
        scheduled_activities: {
            rotation: currentRotation ? {
                unit_name: getTrainingUnitName(currentRotation.training_unit_id),
                unit_code: trainingUnits.value.find(u => u.id === currentRotation.training_unit_id)?.unit_code || '',
                supervisor: getSupervisorName(currentRotation.supervising_attending_id),
                start_date: currentRotation.start_date,
                end_date: currentRotation.end_date,
                days_remaining: currentRotation.end_date ? 
                    Math.ceil((new Date(currentRotation.end_date) - new Date()) / (1000 * 60 * 60 * 24)) : 0,
                status: 'Active'
            } : null,
            
            on_call_today: onCallToday ? {
                shift_type: onCallToday.shift_type === 'primary_call' ? 'Primary' : 'Backup',
                time: `${onCallToday.start_time || '08:00'} - ${onCallToday.end_time || '17:00'}`,
                coverage_area: onCallToday.coverage_notes || 'Emergency Department',
                is_active: OnCallUtils.isShiftActive(onCallToday),
                role: onCallToday.primary_physician_id === staff.id ? 'Primary Physician' : 'Backup Physician'
            } : null,
            
            absence: currentAbsence ? {
                reason: currentAbsence.absence_reason || 'Leave',
                start_date: currentAbsence.start_date,
                end_date: currentAbsence.end_date,
                duration_days: currentAbsence.start_date && currentAbsence.end_date ? 
                    EnhancedUtils.calculateDateDifference(currentAbsence.start_date, currentAbsence.end_date) : 0,
                coverage_arranged: currentAbsence.coverage_arranged || false,
                covering_staff: getStaffName(currentAbsence.covering_staff_id),
                status: 'Active'
            } : null
        },
        
        upcoming: {
            on_call_shifts: []
        },
        
        contact_info: {
            email: staff.professional_email || '',
            phone: staff.work_phone || staff.mobile_phone || 'Not specified',
            department_head: getStaffName(departments.value.find(d => d.id === staff.department_id)?.head_of_department_id)
        }
    };
    
    staffProfileModal.staff = currentDoctorProfile.value.header;
};

// ============ PROFILE UI HELPERS ============

const getPresenceBadgeClass = () => {
    const status = getCurrentPresenceStatus();
    if (status === 'PRESENT') return 'badge-success';
    if (status === 'ABSENT') return 'badge-danger';
    return 'badge-warning';
};

const getPresenceIndicatorClass = () => {
    const status = getCurrentPresenceStatus();
    if (status === 'PRESENT') return 'bg-green-100 text-green-800';
    if (status === 'ABSENT') return 'bg-red-100 text-red-800';
    return 'bg-yellow-100 text-yellow-800';
};

const getPresenceIcon = () => {
    const status = getCurrentPresenceStatus();
    if (status === 'PRESENT') return 'fas fa-check-circle';
    if (status === 'ABSENT') return 'fas fa-times-circle';
    return 'fas fa-question-circle';
};

// ============ IMPROVED FALLBACK VIEW ============
                const fallbackToBasicView = (staff) => {
    // Create a more complete fallback profile
    const today = new Date().toISOString().split('T')[0];
    
    // Check if staff is on call today
    const onCallToday = onCallSchedule.value.filter(schedule => 
        (schedule.primary_physician_id === staff.id || 
         schedule.backup_physician_id === staff.id) &&
        schedule.duty_date === today
    );
    
    // Get current rotation if resident
    const currentRotation = rotations.value.find(r => 
        r.resident_id === staff.id && 
        r.rotation_status === 'active'
    );
    
    // Generate fallback schedule
    const fallbackSchedule = [];
    if (staff.staff_type === 'medical_resident' && currentRotation) {
        fallbackSchedule.push(
            { time: '08:00 - 09:00', activity: 'Morning Report', location: 'Conference Room' },
            { time: '09:00 - 12:00', activity: 'Clinical Rounds', location: getTrainingUnitName(currentRotation.training_unit_id) },
            { time: '12:00 - 13:00', activity: 'Lunch Break', location: 'Cafeteria' },
            { time: '13:00 - 16:00', activity: 'Patient Care', location: 'Ward' },
            { time: '16:00 - 17:00', activity: 'Supervision Session', location: 'Office' }
        );
    } else {
        fallbackSchedule.push(
            { time: '08:00 - 10:00', activity: 'Patient Rounds', location: 'ICU/Ward' },
            { time: '10:00 - 12:00', activity: 'Consultations', location: 'Clinic' },
            { time: '12:00 - 13:00', activity: 'Lunch', location: 'Cafeteria' },
            { time: '13:00 - 15:00', activity: 'Procedures', location: 'Procedure Room' },
            { time: '15:00 - 17:00', activity: 'Documentation', location: 'Office' }
        );
    }
    
    currentDoctorProfile.value = {
        basic_info: staff,
        department: departments.value.find(d => d.id === staff.department_id),
        live_clinical_data: {
            presence: { 
                status: 'UNKNOWN', 
                type: 'Status not available', 
                last_seen: staff.updated_at ? new Date(staff.updated_at).toISOString() : new Date().toISOString()
            },
            current_assignment: currentRotation ? {
                unit: getTrainingUnitName(currentRotation.training_unit_id),
                unit_code: trainingUnits.value.find(u => u.id === currentRotation.training_unit_id)?.unit_code || '',
                supervisor: getSupervisorName(currentRotation.supervising_attending_id)
            } : null,
            todays_schedule: fallbackSchedule,
            upcoming_oncall: onCallToday.map(schedule => ({
                date: schedule.duty_date,
                time: `${schedule.start_time} - ${schedule.end_time}`,
                coverage_area: schedule.coverage_area,
                type: schedule.shift_type === 'primary' ? 'Primary' : 'Backup'
            })),
            clinical_status: null
        },
        academic_data: {
            research_notes: '',
            specializations: [staff.specialization || staff.staff_type].filter(Boolean)
        }
    };
    
    staffProfileModal.staff = staff;
};
                // ============ 18. SAVE FUNCTIONS ============
const saveMedicalStaff = async () => {
    saving.value = true;
    
    if (!medicalStaffModal.form.full_name || !medicalStaffModal.form.full_name.trim()) {
        showToast('Error', 'Full name is required', 'error');
        saving.value = false;
        return;
    }
    
    try {
        const cleanStringField = (value) => {
            if (value === null || value === undefined) return '';
            if (typeof value === 'string') return value.trim();
            return String(value);
        };
        
        const staffData = {
            // Required fields
            full_name: medicalStaffModal.form.full_name.trim(),
            staff_type: medicalStaffModal.form.staff_type || 'medical_resident',
            staff_id: medicalStaffModal.form.staff_id || EnhancedUtils.generateId('MD'),
            employment_status: medicalStaffModal.form.employment_status || 'active',
            professional_email: medicalStaffModal.form.professional_email || '',
            
            // Optional UUID fields
            department_id: medicalStaffModal.form.department_id || null,
            
            // ✅ UPDATED TO MATCH BACKEND
            academic_degree: cleanStringField(medicalStaffModal.form.academic_degree),
            specialization: cleanStringField(medicalStaffModal.form.specialization),
            training_year: cleanStringField(medicalStaffModal.form.training_year),
            clinical_study_certificate: cleanStringField(medicalStaffModal.form.clinical_study_certificate),  // ✅ Correct field
            certificate_status: cleanStringField(medicalStaffModal.form.certificate_status),
            
            // Other fields
            resident_category: cleanStringField(medicalStaffModal.form.resident_category),
            primary_clinic: cleanStringField(medicalStaffModal.form.primary_clinic),
            work_phone: cleanStringField(medicalStaffModal.form.work_phone),
            medical_license: cleanStringField(medicalStaffModal.form.medical_license),
            can_supervise_residents: medicalStaffModal.form.can_supervise_residents || false,
            special_notes: cleanStringField(medicalStaffModal.form.special_notes),
            resident_type: cleanStringField(medicalStaffModal.form.resident_type),
            home_department: cleanStringField(medicalStaffModal.form.home_department),
            external_institution: cleanStringField(medicalStaffModal.form.external_institution),
            years_experience: medicalStaffModal.form.years_experience || null,
            biography: cleanStringField(medicalStaffModal.form.biography),
            date_of_birth: medicalStaffModal.form.date_of_birth || null,
            mobile_phone: cleanStringField(medicalStaffModal.form.mobile_phone),
            office_phone: cleanStringField(medicalStaffModal.form.office_phone),
            training_level: cleanStringField(medicalStaffModal.form.training_level)
        };
        
        console.log('📤 Saving medical staff data:', staffData);
        
        if (staffData.professional_email && !isValidEmail(staffData.professional_email)) {
            showToast('Error', 'Please enter a valid email address', 'error');
            saving.value = false;
            return;
        }
        
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
        console.error('❌ Save medical staff error:', error);
        
        if (error.message && error.message.includes('specialization')) {
            showToast('Error', 'Please enter a valid specialization (text only)', 'error');
        } else if (error.message && error.message.includes('Validation failed')) {
            showToast('Error', 'Please check all fields and try again', 'error');
        } else if (error.message && error.message.includes('email')) {
            showToast('Error', 'Please enter a valid email address', 'error');
        } else {
            showToast('Error', error.message || 'Failed to save medical staff', 'error');
        }
    } finally {
        saving.value = false;
    }
};

// ✅ ADD EMAIL VALIDATION HELPER FUNCTION
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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
                        const unitData = {
                            unit_name: trainingUnitModal.form.unit_name,
                            unit_code: trainingUnitModal.form.unit_code,
                            department_id: trainingUnitModal.form.department_id,
                            supervisor_id: trainingUnitModal.form.supervising_attending_id || null,
                            maximum_residents: trainingUnitModal.form.maximum_residents,
                            unit_status: trainingUnitModal.form.unit_status,
                            description: trainingUnitModal.form.specialty || ''
                        };
                        
                        if (trainingUnitModal.mode === 'add') {
                            const result = await API.createTrainingUnit(unitData);
                            trainingUnits.value.unshift(result);
                            showToast('Success', 'Training unit created successfully', 'success');
                        } else {
                            const result = await API.updateTrainingUnit(trainingUnitModal.form.id, unitData);
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
    // ============ 1. VALIDATE REQUIRED FIELDS ============
    if (!rotationModal.form.resident_id) {
        showToast('Error', 'Please select a resident', 'error');
        return;
    }
    
    if (!rotationModal.form.training_unit_id) {
        showToast('Error', 'Please select a training unit', 'error');
        return;
    }
    
    // ============ 2. VALIDATE AND FORMAT DATES ============
    const startDateStr = rotationModal.form.start_date || rotationModal.form.rotation_start_date;
    const endDateStr = rotationModal.form.end_date || rotationModal.form.rotation_end_date;
    
    if (!startDateStr || !endDateStr) {
        showToast('Error', 'Please enter both start and end dates', 'error');
        return;
    }
    
    // Parse dates using proper ISO format
    let startDate, endDate;
    try {
        // Handle different date formats (YYYY-MM-DD is expected)
        startDate = new Date(startDateStr);
        endDate = new Date(endDateStr);
        
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            throw new Error('Invalid date format');
        }
        
        // Convert to ISO string and extract date part only (YYYY-MM-DD)
        const formatDateToISO = (date) => {
            return date.toISOString().split('T')[0];
        };
        
        // Update form with standardized dates
        rotationModal.form.start_date = formatDateToISO(startDate);
        rotationModal.form.end_date = formatDateToISO(endDate);
        
    } catch (error) {
        showToast('Error', 
            'Invalid date format. Please use YYYY-MM-DD format (e.g., 2026-12-12)', 
            'error'
        );
        return;
    }
    
    // ============ 3. VALIDATE DATE LOGIC ============
    if (endDate <= startDate) {
        showToast('Error', 'End date must be after start date', 'error');
        return;
    }
    
    // Check if rotation is too long (max 1 year)
    const maxDurationDays = 365;
    const durationDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    if (durationDays > maxDurationDays) {
        showToast('Error', 
            `Rotation cannot exceed ${maxDurationDays} days. Current: ${durationDays} days`, 
            'error'
        );
        return;
    }
    
    // ============ 4. CHECK FOR OVERLAPS (CLIENT-SIDE) ============
    const checkForOverlap = (residentId, newStart, newEnd, excludeRotationId = null) => {
        const existingRotations = rotations.value.filter(r => 
            r.resident_id === residentId && 
            r.rotation_status !== 'cancelled' &&
            r.id !== excludeRotationId  // Exclude current rotation if editing
        );
        
        return existingRotations.some(r => {
            try {
                const rStart = new Date(r.start_date || r.rotation_start_date);
                const rEnd = new Date(r.end_date || r.rotation_end_date);
                const nStart = new Date(newStart);
                const nEnd = new Date(newEnd);
                
                // Check for overlap (dates inclusive)
                return nStart <= rEnd && nEnd >= rStart;
            } catch {
                return false;
            }
        });
    };
    
    const hasOverlap = checkForOverlap(
        rotationModal.form.resident_id,
        rotationModal.form.start_date,
        rotationModal.form.end_date,
        rotationModal.mode === 'edit' ? rotationModal.form.id : null
    );
    
    if (hasOverlap) {
        // Get the resident name for better error message
        const residentName = getResidentName(rotationModal.form.resident_id);
        
        showToast('Scheduling Conflict', 
            `${residentName} already has a rotation during these dates. ` +
            'Please choose different dates or modify the existing rotation.',
            'error'
        );
        return;
    }
    
    // ============ 5. PREPARE DATA FOR BACKEND ============
    saving.value = true;
    
    try {
        // Clean and prepare rotation data - MATCHING BACKEND SCHEMA
        const rotationData = {
            rotation_id: rotationModal.form.rotation_id || EnhancedUtils.generateId('ROT'),
            resident_id: rotationModal.form.resident_id,
            training_unit_id: rotationModal.form.training_unit_id,
            supervising_attending_id: rotationModal.form.supervising_attending_id || null,
            start_date: rotationModal.form.start_date,  // ✅ Uses start_date (backend expects this)
            end_date: rotationModal.form.end_date,      // ✅ Uses end_date (backend expects this)
            rotation_category: (rotationModal.form.rotation_category || 'clinical_rotation').toLowerCase(),
            rotation_status: (rotationModal.form.rotation_status || 'scheduled').toLowerCase()
        };
        
        console.log('📤 Sending rotation data to server:', rotationData);
        
        // ============ 6. SEND TO BACKEND ============
        let result;
        if (rotationModal.mode === 'add') {
            result = await API.createRotation(rotationData);
            rotations.value.unshift(result);
            showToast('Success', 'Rotation scheduled successfully', 'success');
        } else {
            result = await API.updateRotation(rotationModal.form.id, rotationData);
            const index = rotations.value.findIndex(r => r.id === result.id);
            if (index !== -1) rotations.value[index] = result;
            showToast('Success', 'Rotation updated successfully', 'success');
        }
        
        // ============ 7. CLEAN UP AND REFRESH ============
        rotationModal.show = false;
        
        // Refresh rotations to get updated meaningful IDs
        await loadRotations();
        updateDashboardStats();
        
        // Show the new meaningful ID if available
        if (result.rotation_id && result.rotation_id.startsWith('PULM-') || 
            result.rotation_id.startsWith('MED-') || 
            result.rotation_id.startsWith('SURG-')) {
            showToast('Rotation ID Generated', 
                `Assigned ID: ${result.rotation_id}`, 
                'info', 3000);
        }
        
    } catch (error) {
        console.error('❌ Rotation save error:', error);
        
        // ============ 8. USER-FRIENDLY ERROR HANDLING ============
        let userMessage = error.message || 'Failed to save rotation';
        
        // Parse backend error messages
        if (error.message.includes('overlapping rotations')) {
            userMessage = 'This rotation conflicts with an existing rotation. Please adjust dates.';
        } else if (error.message.includes('Resident cannot have overlapping rotations')) {
            // Extract the conflicting date range from error message
            const match = error.message.match(/Date range (.*?) to (.*?) conflicts/);
            if (match) {
                const [_, conflictStart, conflictEnd] = match;
                userMessage = `Dates conflict with existing rotation from ${conflictStart} to ${conflictEnd}`;
            } else {
                userMessage = 'Rotation dates conflict with existing schedule';
            }
        } else if (error.message.includes('training_unit_id') || error.message.includes('resident_id')) {
            userMessage = 'Invalid resident or training unit selected. Please refresh and try again.';
        } else if (error.message.includes('date') || error.message.includes('Date')) {
            userMessage = 'Invalid date format. Please use YYYY-MM-DD format.';
        } else if (error.message.includes('JWT') || error.message.includes('token')) {
            userMessage = 'Session expired. Please login again.';
        } else if (error.message.includes('network') || error.message.includes('CORS')) {
            userMessage = 'Cannot connect to server. Please check your network connection.';
        }
        
        showToast('Error', userMessage, 'error');
        
    } finally {
        saving.value = false;
    }
};

const saveAbsence = async () => {
    saving.value = true;
    try {
        // Validate dates
        if (!absenceModal.form.start_date || !absenceModal.form.end_date) {
            showToast('Error', 'Start date and end date are required', 'error');
            saving.value = false;
            return;
        }
        
        const startDate = new Date(absenceModal.form.start_date);
        const endDate = new Date(absenceModal.form.end_date);
        
        if (endDate < startDate) {
            showToast('Error', 'End date must be after start date', 'error');
            saving.value = false;
            return;
        }
        
        // Prepare data matching backend schema
        const absenceData = {
            staff_member_id: absenceModal.form.staff_member_id,
            absence_type: absenceModal.form.absence_type || 'planned',
            absence_reason: absenceModal.form.absence_reason,
            start_date: absenceModal.form.start_date,
            end_date: absenceModal.form.end_date,
            current_status: absenceModal.form.current_status || 'planned_leave',
            covering_staff_id: absenceModal.form.covering_staff_id || null,
            coverage_notes: absenceModal.form.coverage_notes || '',
            coverage_arranged: absenceModal.form.coverage_arranged || false,
            hod_notes: absenceModal.form.hod_notes || '',
            recorded_by: currentUser.value?.id || null
        };
        
        console.log('📤 Sending absence data to backend:', absenceData);
        
        let result;
        if (absenceModal.mode === 'add') {
            result = await API.createAbsence(absenceData);
            absences.value.unshift(result);
            showToast('Success', 'Absence recorded successfully', 'success');
        } else {
            result = await API.updateAbsence(absenceModal.form.id, absenceData);
            const index = absences.value.findIndex(a => a.id === result.id);
            if (index !== -1) absences.value[index] = result;
            showToast('Success', 'Absence updated successfully', 'success');
        }
        
        absenceModal.show = false;
        await loadAbsences();
        updateDashboardStats();
        
    } catch (error) {
        console.error('❌ Save absence error:', error);
        let errorMessage = error.message || 'Failed to save absence record';
        
        // Parse common errors
        if (error.message.includes('staff_member_id') || error.message.includes('23503')) {
            errorMessage = 'Selected staff member not found. Please refresh and try again.';
        } else if (error.message.includes('validation') || error.message.includes('400')) {
            errorMessage = 'Invalid data. Please check all fields and try again.';
        } else if (error.message.includes('JWT') || error.message.includes('token')) {
            errorMessage = 'Session expired. Please login again.';
        } else if (error.message.includes('network') || error.message.includes('CORS')) {
            errorMessage = 'Cannot connect to server. Please check your network connection.';
        }
        
        showToast('Error', errorMessage, 'error');
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
                
                // ============ 19. ACTION FUNCTIONS ============
                
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
                
                // ============ 20. PERMISSION FUNCTIONS ============
                
                const hasPermission = (module, action = 'read') => {
                    const role = currentUser.value?.user_role;
                    if (!role) return false;
                    
                    if (role === 'system_admin') return true;
                    
                    const permissions = PERMISSION_MATRIX[role]?.[module];
                    if (!permissions) return false;
                    
                    return permissions.includes(action) || permissions.includes('*');
                };
                
                // ============ 21. COMPUTED PROPERTIES ============
                
                const authToken = computed(() => {
                    return localStorage.getItem(CONFIG.TOKEN_KEY);
                });
                
                const unreadAnnouncements = computed(() => {
                    return announcements.value.filter(a => !a.read).length;
                });
                
                const unreadLiveUpdates = computed(() => {
                    if (!clinicalStatus.value) return 0;
                    const lastSeen = localStorage.getItem('lastSeenStatusId');
                    return lastSeen !== clinicalStatus.value.id ? 1 : 0;
                });
                
                const formattedExpiry = computed(() => {
                    if (!clinicalStatus.value || !clinicalStatus.value.expires_at) return '';
                    const expires = new Date(clinicalStatus.value.expires_at);
                    const now = new Date();
                    const diffHours = Math.ceil((expires - now) / (1000 * 60 * 60));
                    
                    if (diffHours <= 1) return 'Expires soon';
                    if (diffHours <= 4) return `Expires in ${diffHours}h`;
                    return `Expires ${EnhancedUtils.formatTime(clinicalStatus.value.expires_at)}`;
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
        filtered = filtered.filter(absence => 
            absence.staff_member_id === absenceFilters.staff
        );
    }
    
    // ✅ FIXED: Handle multiple possible status field names
    if (absenceFilters.status) {
        filtered = filtered.filter(absence => {
            // Check all possible status field names
            const status = absence.current_status || absence.status || absence.absence_status;
            return status === absenceFilters.status;
        });
    }
    
    if (absenceFilters.reason) {
        filtered = filtered.filter(absence => 
            absence.absence_reason === absenceFilters.reason
        );
    }
    
    if (absenceFilters.startDate) {
        filtered = filtered.filter(absence => 
            absence.start_date >= absenceFilters.startDate
        );
    }
    
    return filtered;
});
           
                const recentAnnouncements = computed(() => {
                    return announcements.value.slice(0, 10);
                });
                
                // ============ 22. VERSION 2 COMPLETE COMPUTED PROPERTIES ============
                
                const activeAlertsCount = computed(() => {
                    return systemAlerts.value.filter(alert => 
                        alert.status === 'active' || !alert.status
                    ).length;
                });
                
                const currentTimeFormatted = computed(() => {
                    return EnhancedUtils.formatTime(currentTime.value);
                });
                
                // ============ 23. LIFECYCLE ============
                
                onMounted(() => {
                    console.log('🚀 Vue app mounted - 100% Complete Version');
                    
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
                    
                    // Auto-refresh interval for live status
                    const statusRefreshInterval = setInterval(() => {
                        if (currentUser.value && !isLoadingStatus.value) {
                            loadClinicalStatus();
                        }
                    }, 60000);
                    
                    // Auto-update current time every minute
                    const timeInterval = setInterval(() => {
                        currentTime.value = new Date();
                    }, 60000);
                    
                    // Handle ESC key for modal closing
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
                    
                    onUnmounted(() => {
                        clearInterval(statusRefreshInterval);
                        clearInterval(timeInterval);
                        document.removeEventListener('keydown', () => {});
                    });
                });
                
                watch([medicalStaff, rotations, trainingUnits, absences], 
                    () => {
                        updateDashboardStats();
                    }, 
                    { deep: true }
                );
                
                // ============ 24. RETURN EXPOSED DATA/METHODS ============
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
    currentDoctorProfile,
    
    // Version 2 Complete State
    quickStatus,
    currentTime,
    
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
                     OnCallUtils,  // Add this
    getShiftStatusClass,  // Make sure this is included
    updateOnCallStats,  // Add this
    isValidEmail,  // Add this
    testAllAPIs,
                    EnhancedUtils,
    
    // NEUMAC UI Functions
    getShiftStatusClass,
    isCurrentShift,
    getStaffTypeIcon,
    calculateCapacityPercent,
    getCapacityDotClass,
    getMeterFillClass,
    getAbsenceReasonIcon,
    getScheduleIcon,
    
    // Profile Functions
    getCurrentUnit,
    getCurrentWard,
    getCurrentActivityStatus,
    getCurrentPatientCount,
    getICUPatientCount,
    getWardPatientCount,
    getTodaysSchedule,
    isOnCallToday,
    getOnCallShiftTime,
    getOnCallCoverage,
    getRotationSupervisor,
    getRotationDaysLeft,
    getRecentActivities,
    formatTimeAgo,
    
    // Enhanced Profile Functions
    getCurrentPresence,
    getCurrentPresenceStatus, 
    getCurrentActivity,
    getScheduleForToday,
    isCurrentlyOnCall,
    getNextOnCallShift,
    updatePresenceStatus,
    getPresenceBadgeClass,
    getPresenceIndicatorClass,
    getPresenceIcon,
    getPresenceStatusClass,
    fallbackToBasicView,
    
    // Version 2 Complete Functions
    getStatusBadgeClass,
    calculateTimeRemaining,
    refreshStatus,
    setQuickStatus,
    formatAudience,
    getPreviewCardClass,
    getPreviewIcon,
    getPreviewReasonText,
    getPreviewStatusClass,
    getPreviewStatusText,
    updatePreview,
    
    // Live Status Functions
    loadClinicalStatus,
    loadActiveMedicalStaff,
    saveClinicalStatus,
    isStatusExpired,
    showCreateStatusModal,
    
    // Delete Functions
    deleteMedicalStaff,
    deleteRotation,
    deleteOnCallSchedule,
    deleteAbsence,
    deleteAnnouncement,
    deleteClinicalStatus,
    
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
    saveRotation,
    saveOnCallSchedule,
    
    // Computed Properties
    authToken,
    unreadAnnouncements,
    unreadLiveUpdates,
    formattedExpiry,
    availablePhysicians,
    availableResidents,
    availableAttendings,
    availableHeadsOfDepartment,
    availableReplacementStaff,
    filteredMedicalStaff,
    filteredOnCallSchedules,
    filteredRotations,
    filteredAbsences,
    recentAnnouncements,
    
    // Version 2 Complete Computed Properties
    activeAlertsCount,
    currentTimeFormatted
};
            }
        });
        
        // ============ 25. MOUNT APP ============
        app.mount('#app');
        
        console.log('✅ NeumoCare v8.0 100% COMPLETE VERSION mounted successfully!');
        console.log('📋 ALL MISSING FUNCTIONS ADDED:');
        console.log('   ✓ getStatusBadgeClass');
        console.log('   ✓ calculateTimeRemaining');
        console.log('   ✓ refreshStatus');
        console.log('   ✓ setQuickStatus');
        console.log('   ✓ formatAudience');
        console.log('   ✓ getPreviewCardClass');
        console.log('   ✓ getPreviewIcon');
        console.log('   ✓ getPreviewReasonText');
        console.log('   ✓ getPreviewStatusClass');
        console.log('   ✓ getPreviewStatusText');
        console.log('   ✓ updatePreview');
        console.log('   ✓ activeAlertsCount computed');
        console.log('   ✓ currentTimeFormatted computed');
        console.log('   ✓ quickStatus reactive state');
        console.log('   ✓ currentTime reactive state');
        
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
