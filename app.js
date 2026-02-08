// ============ NEUMOCARE HOSPITAL MANAGEMENT SYSTEM v8.0 COMPLETE ============
// PROPERLY INTEGRATED VERSION - FULL BACKEND SYNCHRONIZATION
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
                } catch { 
                    return 'Recently'; 
                }
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
            
            static parseTime(timeStr) {
                if (!timeStr) return 0;
                const [hours, minutes] = timeStr.split(':').map(Number);
                return (hours || 0) * 60 + (minutes || 0);
            }
            
            static formatTimeFromMinutes(totalMinutes) {
                const hours = Math.floor(totalMinutes / 60);
                const minutes = totalMinutes % 60;
                return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            }
        }

        // ============ ON-CALL UTILITIES ============
        class OnCallUtils {
            static isOvernightShift(startTime, endTime) {
                if (!startTime || !endTime) return false;
                const startMinutes = EnhancedUtils.parseTime(startTime);
                const endMinutes = EnhancedUtils.parseTime(endTime);
                return endMinutes < startMinutes;
            }
            
            static calculateShiftDuration(startTime, endTime) {
                if (!startTime || !endTime) return 0;
                const startMinutes = EnhancedUtils.parseTime(startTime);
                const endMinutes = EnhancedUtils.parseTime(endTime);
                
                if (endMinutes < startMinutes) {
                    return (24 * 60 - startMinutes + endMinutes) / 60;
                } else {
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
                    const isToday = today === shiftInfo.startDate;
                    const isTomorrow = today === shiftInfo.endDate;
                    
                    if (isToday && currentTime >= shiftInfo.startTime) {
                        return true;
                    } else if (isTomorrow && currentTime <= shiftInfo.endTime) {
                        return true;
                    }
                } else {
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
                    
                    if (CONFIG.DEBUG) {
                        console.log(`📡 API Request to ${url}:`, {
                            method: config.method,
                            hasBody: !!options.body
                        });
                    }
                    
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
                        throw new Error(`Cannot connect to server. Please check your network connection.`);
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
            
            async getMedicalStaffById(id) {
                try {
                    const data = await this.request(`/api/medical-staff/${id}`);
                    return data;
                } catch {
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

            // ===== ENHANCED PROFILE ENDPOINT =====
    async getEnhancedDoctorProfile(doctorId) {
    console.log('🏥 Fetching enhanced profile for:', doctorId);
    
    try {
        // CHANGE THIS: The backend doesn't have this endpoint
        // const response = await this.request(`/api/medical-staff/${doctorId}/enhanced-profile`);
        
        // USE THIS INSTEAD: Use the build function directly since endpoint doesn't exist
        return await this.buildEnhancedProfileFromAllData(doctorId);
        
    } catch (error) {
        console.warn('⚠️ Enhanced profile endpoint failed, using fallback:', error.message);
        return await this.buildEnhancedProfileFromAllData(doctorId);
    }
}

            // ===== ENHANCED PROFILE BUILDER =====
            async buildEnhancedProfileFromAllData(doctorId) {
                try {
                    console.log('🏥 Building enhanced profile from multiple sources:', doctorId);
                    
                    // Get all related data in parallel
                    const [basicInfo, rotations, onCallToday, absences, departments] = await Promise.all([
                        this.getMedicalStaffById(doctorId).catch(() => ({})),
                        this.getRotations().catch(() => []),
                        this.getOnCallToday().catch(() => []),
                        this.getAbsences().catch(() => []),
                        this.getDepartments().catch(() => [])
                    ]);
                    
                    if (!basicInfo || !basicInfo.id) {
                        throw new Error('Medical staff not found');
                    }
                    
                    const today = new Date().toISOString().split('T')[0];
                    const now = new Date();
                    
                    // Process basic staff information
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
                    
                    // Current rotation status
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
                            id: activeRotation.id,
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
                    
                    // Today's on-call status
                    let todaysOnCall = null;
                    const onCallShift = onCallToday.find(s => 
                        (s.primary_physician_id === doctorId || s.backup_physician_id === doctorId) &&
                        s.duty_date === today
                    );
                    
                    if (onCallShift) {
                        const isActive = OnCallUtils.isShiftActive(onCallShift);
                        
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
                    
                    // Current absence status
                    let currentAbsence = null;
                    const absenceRecord = absences.find(a => 
                        a.staff_member_id === doctorId &&
                        a.start_date <= today && 
                        a.end_date >= today &&
                        (a.current_status === 'currently_absent' || a.current_status === 'active')
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
                    
                    // Upcoming on-call (next 7 days)
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
                    
                    // Determine current status
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
                    
                    // Department info
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
                    
                    // Build final enhanced profile
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
                    
                    console.log('✅ Enhanced profile built:', {
                        staff: basicInfo.full_name,
                        status: currentStatus,
                        description: statusDescription,
                        rotation: currentRotation?.unit_name,
                        oncall: todaysOnCall?.coverage_area,
                        absence: currentAbsence?.reason
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
                    return EnhancedUtils.ensureArray(data.data || []);
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
                        activeRotations: 0,
                        currentlyAbsent: 0,
                        nextShiftChange: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString()
                    };
                }
            }
        }

        // Initialize API Service
        const API = new ApiService();

        // ============ 5. CREATE VUE APP ============
        const app = createApp({
    setup() {
        // ============ REACTIVE STATE ============
        
        // User State
        const currentUser = ref(null);
        const loginForm = reactive({
            email: '',
            password: '',
            remember_me: false
        });
        const loginLoading = ref(false);
        
        // UI State
        const currentView = ref('login');
        const sidebarCollapsed = ref(false);
        const mobileMenuOpen = ref(false);
        const userMenuOpen = ref(false);
        const statsSidebarOpen = ref(false);
        const globalSearchQuery = ref('');
        
        // Loading States
        const loading = ref(false);
        const saving = ref(false);
        const loadingSchedule = ref(false);
        const isLoadingStatus = ref(false);
        const profileLoading = ref(false);
        
        // Data Stores
        const medicalStaff = ref([]);
        const departments = ref([]);
        const trainingUnits = ref([]);
        const rotations = ref([]);
        const absences = ref([]);
        const onCallSchedule = ref([]);
        const announcements = ref([]);
        
        // Live Status Data
        const clinicalStatus = ref(null);
        const newStatusText = ref('');
        const selectedAuthorId = ref('');
        const expiryHours = ref(8);
        const activeMedicalStaff = ref([]);
        const liveStatsEditMode = ref(false);
        
        // Enhanced Profile State
        const currentDoctorProfile = ref(null);
        const profileError = ref(null);
        
        // Dashboard Data
        const systemStats = ref({
            totalStaff: 0,
            activeAttending: 0,
            activeResidents: 0,
            onCallNow: 0,
            activeRotations: 0,
            currentlyAbsent: 0,
            nextShiftChange: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString()
        });
        
        const todaysOnCall = ref([]);
        
        // UI Components
        const toasts = ref([]);
        const systemAlerts = ref([]);
        
        // Filter States
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
        
        // Modal States
        const staffProfileModal = reactive({
            show: false,
            staff: null,
            activeTab: 'clinical',
            loading: false
        });
        
        const medicalStaffModal = reactive({
            show: false,
            mode: 'add',
            activeTab: 'basic',
            form: {
                full_name: '',
                staff_type: 'medical_resident',
                staff_id: `MD-${Date.now().toString().slice(-6)}`,
                employment_status: 'active',
                professional_email: '',
                department_id: '',
                academic_degree: '',
                specialization: '',
                training_year: '',
                clinical_study_certificate: '',
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
                }
            }
        });
        
        const onCallModal = reactive({
            show: false,
            mode: 'add',
            form: {
                duty_date: new Date().toISOString().split('T')[0],
                shift_type: 'primary_call',
                start_time: '15:00',
                end_time: '08:00',
                primary_physician_id: '',
                backup_physician_id: '',
                coverage_notes: 'Emergency Department',
                schedule_id: `SCH-${Date.now().toString().slice(-6)}`
            }
        });
        
        const rotationModal = reactive({
            show: false,
            mode: 'add',
            form: {
                rotation_id: `ROT-${Date.now().toString().slice(-6)}`,
                resident_id: '',
                training_unit_id: '',
                start_date: new Date().toISOString().split('T')[0],
                end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
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
                absence_type: 'planned',
                absence_reason: 'vacation',
                start_date: new Date().toISOString().split('T')[0],
                end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                current_status: 'planned_leave',
                covering_staff_id: '',
                coverage_notes: '',
                coverage_arranged: false,
                hod_notes: ''
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
        
        // ============ ENHANCED PROFILE HELPER FUNCTIONS ============
        // These MUST be defined in correct order - no circular dependencies!
        
        // Core function: Get current presence status
        const getCurrentPresenceStatus = () => {
            if (!currentDoctorProfile.value) return 'UNKNOWN';
            return currentDoctorProfile.value.status_bar?.status || 'UNKNOWN';
        };
        
        // UI Helper: Get CSS class for presence status
        const getPresenceStatusClass = () => {
            const status = getCurrentPresenceStatus();
            if (status === 'PRESENT') return 'status-normal';
            if (status === 'ABSENT') return 'status-critical';
            if (status === 'ON CALL') return 'status-caution';
            return 'status-unknown';
        };
        
        // UI Helper: Get indicator class
        const getPresenceIndicatorClass = () => {
            const status = getCurrentPresenceStatus();
            if (status === 'PRESENT') return 'neumac-status-normal';
            if (status === 'ABSENT') return 'neumac-status-critical';
            if (status === 'ON CALL') return 'neumac-status-caution';
            return 'neumac-status-unknown';
        };
        
        // Data Helper: Get current presence object
        const getCurrentPresence = () => {
            if (!currentDoctorProfile.value) return { status: 'Unknown', type: 'Loading...' };
            return {
                status: currentDoctorProfile.value.status_bar?.status || 'UNKNOWN',
                type: currentDoctorProfile.value.status_bar?.description || 'Loading...'
            };
        };
        
        // Data Helper: Get current activity description
        const getCurrentActivity = () => {
            if (!currentDoctorProfile.value) return 'Loading...';
            
            const statusBar = currentDoctorProfile.value.status_bar;
            if (statusBar?.description) return statusBar.description;
            
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
        
        // UI Helper: Get presence badge class
        const getPresenceBadgeClass = () => {
            const status = getCurrentPresenceStatus();
            if (status === 'PRESENT') return 'badge-success';
            if (status === 'ABSENT') return 'badge-danger';
            if (status === 'ON CALL') return 'badge-warning';
            return 'badge-secondary';
        };
        
        // UI Helper: Get presence icon
        const getPresenceIcon = () => {
            const status = getCurrentPresenceStatus();
            if (status === 'PRESENT') return 'fas fa-check-circle';
            if (status === 'ABSENT') return 'fas fa-times-circle';
            if (status === 'ON CALL') return 'fas fa-phone-volume';
            return 'fas fa-question-circle';
        };
        
        // Data Helper: Get today's schedule
        const getScheduleForToday = () => {
            if (!currentDoctorProfile.value) return [];
            
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
        
        // Status Check: Is currently on call?
        const isCurrentlyOnCall = () => {
            if (!currentDoctorProfile.value) return false;
            const onCallToday = currentDoctorProfile.value.scheduled_activities?.on_call_today;
            return onCallToday?.is_active || false;
        };
        
        // Action: Update presence status
        const updatePresenceStatus = async (status) => {
            if (!currentDoctorProfile.value || !currentDoctorProfile.value.header?.id) return;
            
            try {
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
        
        // Profile Viewer: Open staff details modal
        const viewStaffDetails = async (staff) => {
            console.log('📋 Opening enhanced profile for:', staff.full_name);
            
            staffProfileModal.show = true;
            staffProfileModal.activeTab = 'clinical';
            staffProfileModal.loading = true;
            profileError.value = null;
            
            try {
                const response = await API.getEnhancedDoctorProfile(staff.id);
                
                if (response && response.success) {
                    currentDoctorProfile.value = response.data;
                    staffProfileModal.staff = response.data.header;
                    showToast('Success', `Enhanced profile loaded for ${staff.full_name}`, 'success');
                } else {
                    profileError.value = response?.error || 'Failed to load enhanced profile';
                    showToast('Warning', 'Using basic profile data', 'warning');
                    fallbackToBasicView(staff);
                }
                
            } catch (error) {
                console.error('Profile loading error:', error);
                profileError.value = error.message;
                fallbackToBasicView(staff);
                showToast('Notice', 'Profile loaded with fallback data', 'info');
            } finally {
                staffProfileModal.loading = false;
            }
        };
        
        // Fallback: Use basic data when enhanced fails
        const fallbackToBasicView = (staff) => {
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
                a.end_date >= today &&
                (a.current_status === 'currently_absent' || a.current_status === 'active')
            );
            
            // Build fallback profile
            currentDoctorProfile.value = {
                header: {
                    id: staff.id,
                    full_name: staff.full_name || 'Unknown',
                    staff_type: staff.staff_type,
                    staff_id: staff.staff_id || 'N/A',
                    professional_email: staff.professional_email || '',
                    specialization: staff.specialization || '',
                    department: getDepartmentName(staff.department_id),
                    employment_status: staff.employment_status || 'active'
                },
                
                status_bar: {
                    status: currentAbsence ? 'ABSENT' : 
                           (onCallToday ? 'ON CALL' : 'PRESENT'),
                    icon: currentAbsence ? '🏖️' : 
                          (onCallToday ? '🚨' : '✅'),
                    description: currentAbsence ? `On Leave: ${currentAbsence.absence_reason}` :
                                 (onCallToday ? `On-Call: ${onCallToday.coverage_area || 'Emergency'}` :
                                 (currentRotation ? `In Rotation: ${getTrainingUnitName(currentRotation.training_unit_id)}` : 'Available')),
                    last_updated: new Date().toISOString()
                },
                
                scheduled_activities: {
                    rotation: currentRotation ? {
                        unit_name: getTrainingUnitName(currentRotation.training_unit_id),
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
                        coverage_area: onCallToday.coverage_area || 'Emergency Department',
                        is_active: OnCallUtils.isShiftActive(onCallToday),
                        role: onCallToday.primary_physician_id === staff.id ? 'Primary Physician' : 'Backup Physician'
                    } : null,
                    
                    absence: currentAbsence ? {
                        reason: currentAbsence.absence_reason || 'Leave',
                        start_date: currentAbsence.start_date,
                        end_date: currentAbsence.end_date,
                        duration_days: calculateAbsenceDuration(currentAbsence.start_date, currentAbsence.end_date),
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
                    department_head: 'Not specified'
                },
                
                metadata: {
                    generated_at: new Date().toISOString(),
                    data_sources: ['fallback'],
                    is_fallback: true
                }
            };
            
            staffProfileModal.staff = currentDoctorProfile.value.header;
        };
        
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
            
            if (duration > 0) {
                setTimeout(() => removeToast(toast.id), duration);
            }
        };
        
        const removeToast = (id) => {
            const index = toasts.value.findIndex(t => t.id === id);
            if (index > -1) toasts.value.splice(index, 1);
        };
        
        // ============ CONFIRMATION MODAL ============
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
        
        // ============ DATA HELPER FUNCTIONS ============
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
        
        const getSupervisorName = (supervisorId) => getStaffName(supervisorId);
        const getPhysicianName = (physicianId) => getStaffName(physicianId);
        const getResidentName = (residentId) => getStaffName(residentId);
        
        const calculateAbsenceDuration = (startDate, endDate) => {
            return EnhancedUtils.calculateDateDifference(startDate, endDate);
        };
        
        // ============ FORMATTING FUNCTIONS ============
        const formatStaffType = (type) => {
            const map = {
                'medical_resident': 'Medical Resident',
                'attending_physician': 'Attending Physician',
                'fellow': 'Fellow',
                'nurse_practitioner': 'Nurse Practitioner',
                'administrator': 'Administrator'
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
                'planned_leave': 'Planned Leave',
                'currently_absent': 'Currently Absent',
                'returned_to_duty': 'Returned to Duty',
                'cancelled': 'Cancelled'
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
        
        // ============ DATA LOADING FUNCTIONS ============
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
                
                updateOnCallStats();
                
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
                
                updateDashboardStats();
                showToast('Success', 'System data loaded successfully', 'success');
            } catch (error) {
                console.error('Failed to load data:', error);
                showToast('Error', 'Failed to load some data', 'error');
            } finally {
                loading.value = false;
            }
        };
        
        // ============ DASHBOARD FUNCTIONS ============
        const updateDashboardStats = () => {
            systemStats.value.totalStaff = medicalStaff.value.length;
            
            systemStats.value.activeAttending = medicalStaff.value.filter(s => 
                s.staff_type === 'attending_physician' && s.employment_status === 'active'
            ).length;
            
            systemStats.value.activeResidents = medicalStaff.value.filter(s => 
                s.staff_type === 'medical_resident' && s.employment_status === 'active'
            ).length;
            
            // Calculate staff currently on leave
            const today = new Date().toISOString().split('T')[0];
            
            systemStats.value.currentlyAbsent = absences.value.filter(absence => {
                const startDate = absence.start_date;
                const endDate = absence.end_date;
                
                if (!startDate || !endDate) return false;
                
                const isCurrentlyAbsent = startDate <= today && today <= endDate;
                
                if (!isCurrentlyAbsent) return false;
                
                if (absence.current_status) {
                    const activeStatuses = ['currently_absent', 'active'];
                    return activeStatuses.includes(absence.current_status);
                }
                
                return true;
            }).length;
            
            // Calculate active rotations
            systemStats.value.activeRotations = rotations.value.filter(r => 
                r.rotation_status === 'active'
            ).length;
            
            // Calculate today's on-call staff
            const todayStr = today;
            const onCallToday = onCallSchedule.value.filter(schedule => 
                schedule.duty_date === todayStr
            );
            
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
        };
        
        const updateOnCallStats = () => {
            const now = new Date();
            const today = now.toISOString().split('T')[0];
            
            // Count active on-call right now
            const currentOnCall = todaysOnCall.value.filter(shift => shift.isActive);
            systemStats.value.onCallNow = currentOnCall.length;
            
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
        };
        
        // ============ AUTHENTICATION FUNCTIONS ============
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
        
        // ============ NAVIGATION FUNCTIONS ============
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
        
        // ============ COMPUTED PROPERTIES ============
        const todaysOnCallCount = computed(() => todaysOnCall.value.length);
        
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
            
            if (absenceFilters.status) {
                filtered = filtered.filter(absence => {
                    const status = absence.current_status;
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
        
        // ============ LIFECYCLE ============
        onMounted(() => {
            console.log('🚀 Vue app mounted - Clean Version');
            
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
                document.removeEventListener('keydown', () => {});
            });
        });
        
        watch([medicalStaff, rotations, trainingUnits, absences], 
            () => {
                updateDashboardStats();
            }, 
            { deep: true }
        );
        
        // ============ RETURN ALL DATA & FUNCTIONS ============
        return {
            // State
            currentUser,
            loginForm,
            loginLoading,
            loading,
            saving,
            loadingSchedule,
            isLoadingStatus,
            profileLoading,
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
            
            // Live Status
            clinicalStatus,
            newStatusText,
            selectedAuthorId,
            expiryHours,
            activeMedicalStaff,
            liveStatsEditMode,
            currentDoctorProfile,
            profileError,
            
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
            
            // Enhanced Profile Functions
            getCurrentPresenceStatus,
            getPresenceStatusClass,
            getPresenceIndicatorClass,
            getCurrentPresence,
            getCurrentActivity,
            getPresenceBadgeClass,
            getPresenceIcon,
            getScheduleForToday,
            isCurrentlyOnCall,
            updatePresenceStatus,
            viewStaffDetails,
            fallbackToBasicView,
            
            // Utility Functions
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
            
            // Data Helper Functions
            getDepartmentName,
            getStaffName,
            getTrainingUnitName,
            getSupervisorName,
            getPhysicianName,
            getResidentName,
            calculateAbsenceDuration,
            
            // UI Functions
            showToast,
            removeToast,
            showConfirmation,
            confirmAction,
            cancelConfirmation,
            
            // Authentication
            handleLogin,
            handleLogout,
            
            // Navigation
            switchView,
            toggleStatsSidebar,
            handleGlobalSearch,
            
            // Data Loading
            loadAllData,
            loadMedicalStaff,
            loadDepartments,
            loadTrainingUnits,
            loadRotations,
            loadAbsences,
            loadOnCallSchedule,
            loadTodaysOnCall,
            loadAnnouncements,
            loadClinicalStatus,
            
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
            recentAnnouncements
        };
    }
});
        // ============ 23. MOUNT APP ============
        app.mount('#app');
        
        console.log('✅ NeumoCare v8.0 PROPERLY INTEGRATED VERSION mounted successfully!');
        console.log('📋 ENHANCED PROFILE FEATURES:');
        console.log('   ✓ Real-time presence status');
        console.log('   ✓ Current rotation tracking');
        console.log('   ✓ On-call schedule integration');
        console.log('   ✓ Absence management');
        console.log('   ✓ Backend API synchronization');
        console.log('   ✓ Fallback data handling');
        console.log('   ✓ Error recovery mechanisms');
        
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
