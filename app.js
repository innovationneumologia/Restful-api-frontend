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
        // ============ CORE STATE ============
        const currentUser = ref(null);
        const currentView = ref('login');
        const sidebarCollapsed = ref(false);
        const mobileMenuOpen = ref(false);
        const userMenuOpen = ref(false);
        const statsSidebarOpen = ref(false);
        const globalSearchQuery = ref('');
        
        // ============ AUTH STATE ============
        const loginForm = reactive({
            email: '',
            password: ''
        });
        const loginLoading = ref(false);
        
        // ============ ENHANCED PROFILE STATE ============
        const staffProfileModal = reactive({
            show: false,
            loading: false,
            staff: null
        });
        
        const currentDoctorProfile = ref(null);
        const profileError = ref(null);
        
        // ============ DATA STORES ============
        const medicalStaff = ref([]);
        const departments = ref([]);
        const trainingUnits = ref([]);
        const rotations = ref([]);
        const absences = ref([]);
        const onCallSchedule = ref([]);
        const todaysOnCall = ref([]);
        const announcements = ref([]);
        
        // ============ LIVE STATUS ============
        const clinicalStatus = ref(null);
        const isLoadingStatus = ref(false);
        const systemStats = ref({
            totalStaff: 0,
            activeAttending: 0,
            activeResidents: 0,
            onCallNow: 0,
            activeRotations: 0,
            currentlyAbsent: 0,
            nextShiftChange: ''
        });
        
        // ============ UI STATE ============
        const toasts = ref([]);
        const systemAlerts = ref([]);
        const loading = ref(false);
        const saving = ref(false);
        const loadingSchedule = ref(false);
        
        // ============ FILTERS ============
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
        
        // ============ MODAL STATES ============
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
                }
            }
        });
        // Add this to your setup() function
const getSearchPlaceholder = () => {
    const placeholders = {
        'dashboard': 'Search staff, departments...',
        'medical_staff': 'Search by name, staff ID, or email...',
        'oncall_schedule': 'Search by physician, date, or coverage area...',
        'resident_rotations': 'Search by resident name, training unit...',
        'training_units': 'Search by unit name, department...',
        'staff_absence': 'Search by staff name or reason...',
        'department_management': 'Search by department name or code...',
        'communications': 'Search announcements...'
    };
    return placeholders[currentView.value] || 'Search...';
};
        const getUserRoleDisplay = (role) => {
    const roleMap = {
        'system_admin': 'System Administrator',
        'department_head': 'Department Head',
        'attending_physician': 'Attending Physician',
        'medical_resident': 'Medical Resident',
        'fellow': 'Fellow',
        'nurse_practitioner': 'Nurse Practitioner'
    };
    return roleMap[role] || role || 'Unknown Role';
};
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
                coverage_area: 'emergency'
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
            form: {
                staff_member_id: '',
                absence_type: 'planned',
                absence_reason: 'vacation',
                start_date: new Date().toISOString().split('T')[0],
                end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                coverage_arranged: false,
                covering_staff_id: '',
                coverage_notes: ''
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
        
        // ============ API SERVICE ============
        const CONFIG = {
            API_BASE_URL: 'https://neumac.up.railway.app',
            TOKEN_KEY: 'neumocare_token',
            USER_KEY: 'neumocare_user'
        };
        
        class ApiService {
            constructor() {
                this.token = localStorage.getItem(CONFIG.TOKEN_KEY);
            }
            
            getHeaders() {
                const headers = {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                };
                
                if (this.token) {
                    headers['Authorization'] = `Bearer ${this.token}`;
                }
                
                return headers;
            }
            
            async request(endpoint, options = {}) {
                const url = `${CONFIG.API_BASE_URL}${endpoint}`;
                
                try {
                    const config = {
                        method: options.method || 'GET',
                        headers: this.getHeaders()
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
                        
                        throw new Error(`HTTP ${response.status}`);
                    }
                    
                    return await response.json();
                    
                } catch (error) {
                    console.error(`API ${endpoint} failed:`, error);
                    throw error;
                }
            }
            
            // ===== AUTH =====
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
                    return Array.isArray(data) ? data : (data.data || []);
                } catch { return []; }
            }
            
            async getMedicalStaffById(id) {
                try {
                    return await this.request(`/api/medical-staff/${id}`);
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
            
            // ===== DEPARTMENTS =====
            async getDepartments() {
                try {
                    const data = await this.request('/api/departments');
                    return Array.isArray(data) ? data : (data.data || []);
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
            
            // ===== TRAINING UNITS =====
            async getTrainingUnits() {
                try {
                    const data = await this.request('/api/training-units');
                    return Array.isArray(data) ? data : (data.data || []);
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
            
            // ===== ROTATIONS =====
            async getRotations() {
                try {
                    const data = await this.request('/api/rotations');
                    return Array.isArray(data) ? data : (data.data || []);
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
                    return Array.isArray(data) ? data : (data.data || []);
                } catch { return []; }
            }
            
            async getOnCallToday() {
                try {
                    const data = await this.request('/api/oncall/today');
                    return Array.isArray(data) ? data : (data.data || []);
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
                    return Array.isArray(data) ? data : (data.data || []);
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
                    return Array.isArray(data) ? data : (data.data || []);
                } catch { return []; }
            }
            
            async createAnnouncement(announcementData) {
                return await this.request('/api/announcements', {
                    method: 'POST',
                    body: announcementData
                });
            }
            
            // ===== LIVE STATUS =====
            async getClinicalStatus() {
                try {
                    return await this.request('/api/live-status/current');
                } catch {
                    return { success: false, data: null };
                }
            }
            
            async createClinicalStatus(statusData) {
                return await this.request('/api/live-status', {
                    method: 'POST',
                    body: statusData
                });
            }
            
            // ===== SYSTEM STATS =====
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
                        currentlyAbsent: 0
                    };
                }
            }
        }
        
        const API = new ApiService();
        
        // ============ ENHANCED PROFILE BUILDER ============
        class EnhancedProfileBuilder {
            static async buildForStaff(staffId) {
                try {
                    // Fetch all data in parallel
                    const [
                        basicStaff,
                        allRotations,
                        todaysOnCallData,
                        allAbsences,
                        allDepartments,
                        allTrainingUnits
                    ] = await Promise.all([
                        API.getMedicalStaffById(staffId),
                        API.getRotations(),
                        API.getOnCallToday(),
                        API.getAbsences(),
                        API.getDepartments(),
                        API.getTrainingUnits()
                    ]);
                    
                    if (!basicStaff || !basicStaff.id) {
                        throw new Error('Medical staff not found');
                    }
                    
                    const today = new Date().toISOString().split('T')[0];
                    const now = new Date();
                    
                    // Build profile structure
                    const profile = {
                        header: {
                            id: basicStaff.id,
                            full_name: basicStaff.full_name || 'Unknown',
                            staff_type: basicStaff.staff_type,
                            staff_id: basicStaff.staff_id || 'N/A',
                            professional_email: basicStaff.professional_email || '',
                            specialization: basicStaff.specialization || '',
                            training_year: basicStaff.training_year || '',
                            certificate_status: basicStaff.certificate_status || 'unknown'
                        },
                        
                        research: {
                            line: 'Pulmonary Fibrosis Research',
                            position: 'Principal Investigator',
                            progress: 'Milestone 1 of 6 completed',
                            progress_percent: 17
                        },
                        
                        status_bar: {
                            status: 'PRESENT',
                            icon: 'fas fa-check-circle',
                            description: 'Available',
                            priority_level: 'normal',
                            last_updated: new Date().toISOString()
                        },
                        
                        clinical_assignments: {},
                        
                        timeline: {
                            today: [],
                            upcoming: []
                        },
                        
                        training: {
                            pgy_level: '',
                            program: '',
                            certifications: [],
                            academic_progress: {}
                        },
                        
                        department: {
                            name: '',
                            head: '',
                            unit: '',
                            coverage_chain: []
                        },
                        
                        contact: {
                            email: basicStaff.professional_email || '',
                            work_phone: basicStaff.work_phone || '',
                            mobile: basicStaff.mobile_phone || '',
                            escalation_path: []
                        },
                        
                        alerts: []
                    };
                    
                    // Find department
                    const department = allDepartments.find(d => d.id === basicStaff.department_id);
                    if (department) {
                        profile.department.name = department.name;
                        profile.department.head = department.head_of_department?.full_name || 'Not assigned';
                    }
                    
                    // Find current rotation
                    const activeRotation = allRotations.find(r => 
                        r.resident_id === staffId && r.rotation_status === 'active'
                    );
                    
                    if (activeRotation) {
                        const trainingUnit = allTrainingUnits.find(u => u.id === activeRotation.training_unit_id);
                        const rotationDept = allDepartments.find(d => d.id === activeRotation.department_id);
                        
                        let daysRemaining = 0;
                        if (activeRotation.end_date) {
                            const endDate = new Date(activeRotation.end_date);
                            daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
                        }
                        
                        profile.clinical_assignments.rotation = {
                            unit_name: trainingUnit?.unit_name || 'Training Unit',
                            unit_code: trainingUnit?.unit_code || '',
                            department: rotationDept?.name || 'Not specified',
                            supervisor: activeRotation.supervising_attending?.full_name || 'Not assigned',
                            start_date: activeRotation.start_date,
                            end_date: activeRotation.end_date,
                            days_remaining: daysRemaining > 0 ? daysRemaining : 0,
                            status: daysRemaining <= 7 ? 'Ending soon' : 'Active',
                            progress_percent: this.calculateProgressPercent(activeRotation.start_date, activeRotation.end_date)
                        };
                    }
                    
                    // Find today's on-call
                    const todaysShift = todaysOnCallData.find(s => 
                        (s.primary_physician_id === staffId || s.backup_physician_id === staffId) &&
                        s.duty_date === today
                    );
                    
                    if (todaysShift) {
                        const isActive = this.isShiftActive(todaysShift);
                        
                        profile.clinical_assignments.on_call = {
                            shift_type: todaysShift.shift_type === 'primary_call' ? 'Primary' : 'Backup',
                            start_time: todaysShift.start_time,
                            end_time: todaysShift.end_time,
                            coverage_area: todaysShift.coverage_area || 'Emergency Department',
                            is_active: isActive,
                            hours_remaining: isActive ? this.calculateHoursRemaining(todaysShift.end_time) : 0,
                            role: todaysShift.primary_physician_id === staffId ? 'Primary Physician' : 'Backup Physician'
                        };
                        
                        // Update status based on on-call
                        if (isActive) {
                            profile.status_bar.status = 'ON_CALL_ACTIVE';
                            profile.status_bar.icon = 'fas fa-phone-volume';
                            profile.status_bar.description = `On-Call: ${profile.clinical_assignments.on_call.coverage_area}`;
                            profile.status_bar.priority_level = 'critical';
                        } else {
                            profile.status_bar.status = 'ON_CALL_SCHEDULED';
                            profile.status_bar.icon = 'fas fa-calendar-check';
                            profile.status_bar.description = `Scheduled on-call at ${todaysShift.start_time}`;
                        }
                    }
                    
                    // Find current absence
                    const currentAbsence = allAbsences.find(a => 
                        a.staff_member_id === staffId &&
                        a.start_date <= today && 
                        a.end_date >= today
                    );
                    
                    if (currentAbsence) {
                        profile.clinical_assignments.absence = {
                            reason: currentAbsence.absence_reason || 'Leave',
                            start_date: currentAbsence.start_date,
                            end_date: currentAbsence.end_date,
                            coverage_arranged: currentAbsence.coverage_arranged || false,
                            covering_staff: currentAbsence.covering_staff?.full_name,
                            days_remaining: this.calculateDaysRemaining(currentAbsence.end_date)
                        };
                        
                        // Override status if absent
                        profile.status_bar.status = 'ABSENT';
                        profile.status_bar.icon = 'fas fa-umbrella-beach';
                        profile.status_bar.description = `On Leave: ${profile.clinical_assignments.absence.reason}`;
                        profile.status_bar.priority_level = 'warning';
                    }
                    
                    // Build timeline
                    profile.timeline.today = this.buildTodayTimeline(profile.clinical_assignments);
                    
                    // Add training info for residents
                    if (basicStaff.staff_type === 'medical_resident') {
                        const pgyNumber = parseInt(basicStaff.training_year?.replace('PGY-', '') || '1');
                        profile.training.pgy_level = basicStaff.training_year || 'PGY-1';
                        profile.training.program = basicStaff.specialization || 'Medical Resident';
                        profile.training.academic_progress = {
                            years_completed: pgyNumber - 1,
                            total_years: 4,
                            percent_complete: Math.round(((pgyNumber - 1) / 4) * 100)
                        };
                    }
                    
                    // Add certifications
                    if (basicStaff.clinical_certificate) {
                        profile.training.certifications.push({
                            name: basicStaff.clinical_certificate,
                            status: basicStaff.certificate_status || 'current',
                            expires: '2024-12-31'
                        });
                    }
                    
                    // Generate alerts
                    profile.alerts = this.generateAlerts(profile);
                    
                    return {
                        success: true,
                        data: profile
                    };
                    
                } catch (error) {
                    console.error('Profile build error:', error);
                    return {
                        success: false,
                        error: error.message,
                        data: null
                    };
                }
            }
            
            // Helper methods
            static calculateProgressPercent(startDate, endDate) {
                if (!startDate || !endDate) return 0;
                
                const start = new Date(startDate);
                const end = new Date(endDate);
                const now = new Date();
                
                if (now < start) return 0;
                if (now > end) return 100;
                
                const total = end - start;
                const elapsed = now - start;
                return Math.round((elapsed / total) * 100);
            }
            
            static isShiftActive(schedule) {
                if (!schedule) return false;
                
                const now = new Date();
                const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                                   now.getMinutes().toString().padStart(2, '0');
                
                if (schedule.duty_date !== now.toISOString().split('T')[0]) return false;
                
                const startMinutes = this.parseTime(schedule.start_time);
                const endMinutes = this.parseTime(schedule.end_time);
                const currentMinutes = this.parseTime(currentTime);
                
                if (endMinutes < startMinutes) {
                    // Overnight shift
                    return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
                } else {
                    // Normal shift
                    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
                }
            }
            
            static parseTime(timeStr) {
                if (!timeStr) return 0;
                const [hours, minutes] = timeStr.split(':').map(Number);
                return (hours || 0) * 60 + (minutes || 0);
            }
            
            static calculateHoursRemaining(endTime) {
                const [hours, minutes] = endTime.split(':').map(Number);
                const end = new Date();
                end.setHours(hours, minutes, 0, 0);
                
                if (end < new Date()) {
                    end.setDate(end.getDate() + 1);
                }
                
                return Math.ceil((end - new Date()) / (1000 * 60 * 60));
            }
            
            static calculateDaysRemaining(endDate) {
                if (!endDate) return 0;
                const end = new Date(endDate);
                return Math.ceil((end - new Date()) / (1000 * 60 * 60 * 24));
            }
            
            static buildTodayTimeline(assignments) {
                const timeline = [];
                
                if (assignments.rotation) {
                    timeline.push({
                        time: '08:00-17:00',
                        activity: 'Clinical Rotation',
                        location: assignments.rotation.unit_name,
                        type: 'rotation',
                        status: 'active'
                    });
                }
                
                if (assignments.on_call) {
                    timeline.push({
                        time: `${assignments.on_call.start_time}-${assignments.on_call.end_time}`,
                        activity: assignments.on_call.is_active ? 'ON-CALL ACTIVE' : 'On-Call Scheduled',
                        location: assignments.on_call.coverage_area,
                        type: 'oncall',
                        status: assignments.on_call.is_active ? 'critical' : 'scheduled'
                    });
                }
                
                if (assignments.absence) {
                    timeline.push({
                        time: 'All day',
                        activity: `On Leave: ${assignments.absence.reason}`,
                        location: 'Not available',
                        type: 'absence',
                        status: 'warning'
                    });
                }
                
                return timeline;
            }
            
            static generateAlerts(profile) {
                const alerts = [];
                
                // Certificate expiry
                if (profile.header.certificate_status === 'expired') {
                    alerts.push({
                        type: 'critical',
                        message: 'Medical certificate expired',
                        icon: 'fas fa-exclamation-triangle'
                    });
                }
                
                // On-call ending soon
                if (profile.clinical_assignments.on_call?.hours_remaining < 2 && 
                    profile.clinical_assignments.on_call?.is_active) {
                    alerts.push({
                        type: 'info',
                        message: `On-call ending in ${profile.clinical_assignments.on_call.hours_remaining} hour(s)`,
                        icon: 'fas fa-clock'
                    });
                }
                
                // Rotation ending
                if (profile.clinical_assignments.rotation?.days_remaining < 7) {
                    alerts.push({
                        type: 'info',
                        message: `Rotation ends in ${profile.clinical_assignments.rotation.days_remaining} days`,
                        icon: 'fas fa-calendar'
                    });
                }
                
                return alerts;
            }
        }
        
        // ============ UTILITY FUNCTIONS ============
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
        
        const formatRotationStatus = (status) => {
            const map = {
                'scheduled': 'Scheduled',
                'active': 'Active',
                'completed': 'Completed',
                'cancelled': 'Cancelled'
            };
            return map[status] || status;
        };
        
        const getInitials = (name) => {
            if (!name) return '??';
            return name.split(' ')
                .map(word => word[0])
                .join('')
                .toUpperCase()
                .substring(0, 2);
        };
        
        const formatDate = (dateString) => {
            if (!dateString) return 'N/A';
            try {
                const date = new Date(dateString);
                return date.toLocaleDateString('en-US', { 
                    month: 'short', day: 'numeric', year: 'numeric' 
                });
            } catch {
                return dateString;
            }
        };
        
        const formatTime = (dateString) => {
            if (!dateString) return '';
            try {
                const date = new Date(dateString);
                return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            } catch {
                return dateString;
            }
        };
        
        const formatRelativeTime = (dateString) => {
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
        
        // ============ PROFILE FUNCTIONS ============
        const viewStaffDetails = async (staff) => {
            console.log('Opening enhanced profile for:', staff.full_name);
            
            staffProfileModal.show = true;
            staffProfileModal.staff = staff;
            staffProfileModal.loading = true;
            profileError.value = null;
            
            try {
                const enhancedProfile = await EnhancedProfileBuilder.buildForStaff(staff.id);
                
                if (enhancedProfile.success && enhancedProfile.data) {
                    currentDoctorProfile.value = enhancedProfile.data;
                    showToast('Success', `Profile loaded for ${staff.full_name}`, 'success');
                } else {
                    fallbackToBasicView(staff);
                    showToast('Info', 'Using basic profile data', 'info');
                }
                
            } catch (error) {
                console.error('Profile load error:', error);
                profileError.value = error.message;
                fallbackToBasicView(staff);
                showToast('Notice', 'Profile loaded with limited data', 'warning');
            } finally {
                staffProfileModal.loading = false;
            }
        };
        
        const fallbackToBasicView = (staff) => {
            currentDoctorProfile.value = {
                header: {
                    id: staff.id,
                    full_name: staff.full_name,
                    staff_type: staff.staff_type,
                    staff_id: staff.staff_id || 'N/A',
                    professional_email: staff.professional_email || ''
                },
                research: {
                    line: 'Pulmonary Research Line',
                    position: 'Team Member',
                    progress: 'Milestone 1 of 6 completed'
                },
                status_bar: {
                    status: 'PRESENT',
                    icon: 'fas fa-check-circle',
                    description: 'Available',
                    priority_level: 'normal'
                }
            };
        };
        
        const getStatusClass = () => {
            if (!currentDoctorProfile.value) return 'status-unknown';
            
            const status = currentDoctorProfile.value.status_bar?.status;
            switch (status) {
                case 'ON_CALL_ACTIVE': return 'status-critical';
                case 'ABSENT': return 'status-warning';
                case 'ON_CALL_SCHEDULED': return 'status-info';
                case 'PRESENT': return 'status-normal';
                default: return 'status-unknown';
            }
        };
        
        const getStatusIcon = () => {
            if (!currentDoctorProfile.value) return 'fas fa-question-circle';
            return currentDoctorProfile.value.status_bar?.icon || 'fas fa-user';
        };
        
        const getStatusText = () => {
            if (!currentDoctorProfile.value) return 'Status Unknown';
            
            const status = currentDoctorProfile.value.status_bar?.status;
            const map = {
                'ON_CALL_ACTIVE': 'ON-CALL ACTIVE',
                'ABSENT': 'ON LEAVE',
                'ON_CALL_SCHEDULED': 'ON-CALL SCHEDULED',
                'PRESENT': 'PRESENT'
            };
            
            return map[status] || 'Available';
        };
        
        const getStatusDescription = () => {
            if (!currentDoctorProfile.value) return '';
            return currentDoctorProfile.value.status_bar?.description || '';
        };
        
        // ============ AUTH FUNCTIONS ============
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
        
        // ============ DATA LOADING FUNCTIONS ============
        const loadMedicalStaff = async () => {
            try {
                medicalStaff.value = await API.getMedicalStaff();
            } catch (error) {
                showToast('Error', 'Failed to load medical staff', 'error');
            }
        };
        
        const loadDepartments = async () => {
            try {
                departments.value = await API.getDepartments();
            } catch (error) {
                showToast('Error', 'Failed to load departments', 'error');
            }
        };
        
        const loadTrainingUnits = async () => {
            try {
                trainingUnits.value = await API.getTrainingUnits();
            } catch (error) {
                showToast('Error', 'Failed to load training units', 'error');
            }
        };
        
        const loadRotations = async () => {
            try {
                rotations.value = await API.getRotations();
            } catch (error) {
                showToast('Error', 'Failed to load rotations', 'error');
            }
        };
        
        const loadAbsences = async () => {
            try {
                absences.value = await API.getAbsences();
            } catch (error) {
                showToast('Error', 'Failed to load absences', 'error');
            }
        };
        
        const loadOnCallSchedule = async () => {
            try {
                loadingSchedule.value = true;
                onCallSchedule.value = await API.getOnCallSchedule();
            } catch (error) {
                showToast('Error', 'Failed to load on-call schedule', 'error');
            } finally {
                loadingSchedule.value = false;
            }
        };
        
        const loadTodaysOnCall = async () => {
            try {
                todaysOnCall.value = await API.getOnCallToday();
            } catch (error) {
                showToast('Error', 'Failed to load today\'s on-call', 'error');
            }
        };
        
        const loadAnnouncements = async () => {
            try {
                announcements.value = await API.getAnnouncements();
            } catch (error) {
                showToast('Error', 'Failed to load announcements', 'error');
            }
        };
        
        const loadClinicalStatus = async () => {
            isLoadingStatus.value = true;
            try {
                const response = await API.getClinicalStatus();
                if (response && response.success) {
                    clinicalStatus.value = response.data;
                }
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
                showToast('Error', 'Failed to load some data', 'error');
            } finally {
                loading.value = false;
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
            
            systemStats.value.activeRotations = rotations.value.filter(r => 
                r.rotation_status === 'active'
            ).length;
            
            // Calculate currently absent
            const today = new Date().toISOString().split('T')[0];
            systemStats.value.currentlyAbsent = absences.value.filter(absence => {
                const startDate = absence.start_date;
                const endDate = absence.end_date;
                
                if (!startDate || !endDate) return false;
                
                const isCurrentlyAbsent = startDate <= today && today <= endDate;
                return isCurrentlyAbsent;
            }).length;
            
            // Count on-call now
            const currentOnCall = todaysOnCall.value.filter(shift => {
                const now = new Date();
                const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                                   now.getMinutes().toString().padStart(2, '0');
                
                if (shift.duty_date !== today) return false;
                
                const startMinutes = EnhancedProfileBuilder.parseTime(shift.start_time);
                const endMinutes = EnhancedProfileBuilder.parseTime(shift.end_time);
                const currentMinutes = EnhancedProfileBuilder.parseTime(currentTime);
                
                if (endMinutes < startMinutes) {
                    return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
                } else {
                    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
                }
            });
            
            systemStats.value.onCallNow = currentOnCall.length;
        };
        
        // ============ NAVIGATION ============
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
        
        // ============ VIEW TITLE HELPERS ============
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
        
        // ============ PERMISSION SYSTEM ============
        const PERMISSION_MATRIX = {
            system_admin: {
                medical_staff: ['create', 'read', 'update', 'delete'],
                oncall_schedule: ['create', 'read', 'update', 'delete'],
                resident_rotations: ['create', 'read', 'update', 'delete'],
                training_units: ['create', 'read', 'update', 'delete'],
                staff_absence: ['create', 'read', 'update', 'delete'],
                department_management: ['create', 'read', 'update', 'delete'],
                communications: ['create', 'read', 'update', 'delete']
            },
            department_head: {
                medical_staff: ['read', 'update'],
                oncall_schedule: ['create', 'read', 'update'],
                resident_rotations: ['create', 'read', 'update'],
                training_units: ['read', 'update'],
                staff_absence: ['create', 'read', 'update'],
                department_management: ['read'],
                communications: ['create', 'read']
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
        
        const hasPermission = (module, action = 'read') => {
            const role = currentUser.value?.user_role;
            if (!role) return false;
            
            if (role === 'system_admin') return true;
            
            const permissions = PERMISSION_MATRIX[role]?.[module];
            if (!permissions) return false;
            
            return permissions.includes(action) || permissions.includes('*');
        };
        
        // ============ MODAL SHOW FUNCTIONS ============
        const showAddMedicalStaffModal = () => {
            medicalStaffModal.mode = 'add';
            medicalStaffModal.form = {
                full_name: '',
                staff_type: 'medical_resident',
                staff_id: `MD-${Date.now().toString().slice(-6)}`,
                employment_status: 'active',
                professional_email: '',
                department_id: '',
                academic_degree: '',
                specialization: '',
                training_year: '',
                clinical_certificate: '',
                certificate_status: 'current'
            };
            medicalStaffModal.show = true;
        };
        
        const showAddOnCallModal = () => {
            onCallModal.mode = 'add';
            onCallModal.form = {
                duty_date: new Date().toISOString().split('T')[0],
                shift_type: 'primary_call',
                start_time: '15:00',
                end_time: '08:00',
                primary_physician_id: '',
                backup_physician_id: '',
                coverage_area: 'emergency'
            };
            onCallModal.show = true;
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
                covering_staff_id: '',
                coverage_notes: ''
            };
            absenceModal.show = true;
        };
        
        const showAddRotationModal = () => {
            rotationModal.mode = 'add';
            rotationModal.form = {
                rotation_id: `ROT-${Date.now().toString().slice(-6)}`,
                resident_id: '',
                training_unit_id: '',
                start_date: new Date().toISOString().split('T')[0],
                end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                rotation_status: 'scheduled',
                rotation_category: 'clinical_rotation',
                supervising_attending_id: ''
            };
            rotationModal.show = true;
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
        
        // ============ EDIT FUNCTIONS ============
        const editMedicalStaff = (staff) => {
            medicalStaffModal.mode = 'edit';
            medicalStaffModal.form = {
                id: staff.id,
                full_name: staff.full_name,
                staff_type: staff.staff_type,
                staff_id: staff.staff_id,
                employment_status: staff.employment_status,
                professional_email: staff.professional_email,
                department_id: staff.department_id,
                academic_degree: staff.academic_degree,
                specialization: staff.specialization,
                training_year: staff.training_year,
                clinical_certificate: staff.clinical_certificate,
                certificate_status: staff.certificate_status
            };
            medicalStaffModal.show = true;
        };
        
        const editDepartment = (department) => {
            departmentModal.mode = 'edit';
            departmentModal.form = {
                id: department.id,
                name: department.name,
                code: department.code,
                status: department.status,
                head_of_department_id: department.head_of_department_id
            };
            departmentModal.show = true;
        };
        
        const editTrainingUnit = (unit) => {
            trainingUnitModal.mode = 'edit';
            trainingUnitModal.form = {
                id: unit.id,
                unit_name: unit.unit_name,
                unit_code: unit.unit_code,
                department_id: unit.department_id,
                maximum_residents: unit.maximum_residents,
                unit_status: unit.unit_status,
                specialty: unit.specialty,
                supervising_attending_id: unit.supervising_attending_id
            };
            trainingUnitModal.show = true;
        };
        
        const editRotation = (rotation) => {
            rotationModal.mode = 'edit';
            rotationModal.form = {
                id: rotation.id,
                rotation_id: rotation.rotation_id,
                resident_id: rotation.resident_id,
                training_unit_id: rotation.training_unit_id,
                start_date: rotation.start_date,
                end_date: rotation.end_date,
                rotation_status: rotation.rotation_status,
                rotation_category: rotation.rotation_category,
                supervising_attending_id: rotation.supervising_attending_id
            };
            rotationModal.show = true;
        };
        
        const editOnCallSchedule = (schedule) => {
            onCallModal.mode = 'edit';
            onCallModal.form = {
                id: schedule.id,
                duty_date: schedule.duty_date,
                shift_type: schedule.shift_type,
                start_time: schedule.start_time,
                end_time: schedule.end_time,
                primary_physician_id: schedule.primary_physician_id,
                backup_physician_id: schedule.backup_physician_id,
                coverage_area: schedule.coverage_area
            };
            onCallModal.show = true;
        };
        
        const editAbsence = (absence) => {
            absenceModal.mode = 'edit';
            absenceModal.form = {
                id: absence.id,
                staff_member_id: absence.staff_member_id,
                absence_type: absence.absence_type,
                absence_reason: absence.absence_reason,
                start_date: absence.start_date,
                end_date: absence.end_date,
                coverage_arranged: absence.coverage_arranged,
                covering_staff_id: absence.covering_staff_id,
                coverage_notes: absence.coverage_notes
            };
            absenceModal.show = true;
        };
        
        // ============ SAVE FUNCTIONS ============
        const saveMedicalStaff = async () => {
            saving.value = true;
            
            if (!medicalStaffModal.form.full_name || !medicalStaffModal.form.full_name.trim()) {
                showToast('Error', 'Full name is required', 'error');
                saving.value = false;
                return;
            }
            
            try {
                const staffData = {
                    full_name: medicalStaffModal.form.full_name.trim(),
                    staff_type: medicalStaffModal.form.staff_type,
                    staff_id: medicalStaffModal.form.staff_id,
                    employment_status: medicalStaffModal.form.employment_status,
                    professional_email: medicalStaffModal.form.professional_email,
                    department_id: medicalStaffModal.form.department_id || null,
                    academic_degree: medicalStaffModal.form.academic_degree || null,
                    specialization: medicalStaffModal.form.specialization || null,
                    training_year: medicalStaffModal.form.training_year || null,
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
            saving.value = true;
            try {
                if (!rotationModal.form.resident_id) {
                    showToast('Error', 'Please select a resident', 'error');
                    saving.value = false;
                    return;
                }
                
                if (!rotationModal.form.training_unit_id) {
                    showToast('Error', 'Please select a training unit', 'error');
                    saving.value = false;
                    return;
                }
                
                const rotationData = {
                    rotation_id: rotationModal.form.rotation_id,
                    resident_id: rotationModal.form.resident_id,
                    training_unit_id: rotationModal.form.training_unit_id,
                    start_date: rotationModal.form.start_date,
                    end_date: rotationModal.form.end_date,
                    rotation_status: rotationModal.form.rotation_status,
                    rotation_category: rotationModal.form.rotation_category,
                    supervising_attending_id: rotationModal.form.supervising_attending_id || null
                };
                
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
                updateDashboardStats();
                
            } catch (error) {
                showToast('Error', error.message || 'Failed to save rotation', 'error');
            } finally {
                saving.value = false;
            }
        };
        
        const saveOnCallSchedule = async () => {
            saving.value = true;
            try {
                const onCallData = {
                    duty_date: onCallModal.form.duty_date,
                    shift_type: onCallModal.form.shift_type,
                    start_time: onCallModal.form.start_time,
                    end_time: onCallModal.form.end_time,
                    primary_physician_id: onCallModal.form.primary_physician_id,
                    backup_physician_id: onCallModal.form.backup_physician_id || null,
                    coverage_area: onCallModal.form.coverage_area
                };
                
                if (onCallModal.mode === 'add') {
                    const result = await API.createOnCall(onCallData);
                    onCallSchedule.value.unshift(result);
                    showToast('Success', 'On-call scheduled successfully', 'success');
                } else {
                    const result = await API.updateOnCall(onCallModal.form.id, onCallData);
                    const index = onCallSchedule.value.findIndex(s => s.id === result.id);
                    if (index !== -1) onCallSchedule.value[index] = result;
                    showToast('Success', 'On-call updated successfully', 'success');
                }
                
                onCallModal.show = false;
                await loadTodaysOnCall();
                
            } catch (error) {
                showToast('Error', error.message || 'Failed to save on-call schedule', 'error');
            } finally {
                saving.value = false;
            }
        };
        
        const saveAbsence = async () => {
            saving.value = true;
            try {
                if (!absenceModal.form.start_date || !absenceModal.form.end_date) {
                    showToast('Error', 'Start date and end date are required', 'error');
                    saving.value = false;
                    return;
                }
                
                const absenceData = {
                    staff_member_id: absenceModal.form.staff_member_id,
                    absence_type: absenceModal.form.absence_type,
                    absence_reason: absenceModal.form.absence_reason,
                    start_date: absenceModal.form.start_date,
                    end_date: absenceModal.form.end_date,
                    coverage_arranged: absenceModal.form.coverage_arranged || false,
                    covering_staff_id: absenceModal.form.covering_staff_id || null,
                    coverage_notes: absenceModal.form.coverage_notes || ''
                };
                
                if (absenceModal.mode === 'add') {
                    const result = await API.createAbsence(absenceData);
                    absences.value.unshift(result.data || result);
                    showToast('Success', 'Absence recorded successfully', 'success');
                } else {
                    const result = await API.updateAbsence(absenceModal.form.id, absenceData);
                    const index = absences.value.findIndex(a => a.id === result.id);
                    if (index !== -1) absences.value[index] = result.data || result;
                    showToast('Success', 'Absence updated successfully', 'success');
                }
                
                absenceModal.show = false;
                await loadAbsences();
                updateDashboardStats();
                
            } catch (error) {
                showToast('Error', error.message || 'Failed to save absence record', 'error');
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
        
        // ============ DELETE FUNCTIONS ============
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
                details: `Resident: ${getStaffName(rotation.resident_id)}`,
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
        
        // ============ HELPER FUNCTIONS ============
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
        
        const getPhysicianName = getStaffName;
        const getResidentName = getStaffName;
        const getSupervisorName = getStaffName;
        
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
        
        // ============ COMPUTED PROPERTIES ============
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
        
        const todaysOnCallCount = computed(() => todaysOnCall.value.length);
        
        const recentAnnouncements = computed(() => {
            return announcements.value.slice(0, 10);
        });
        
        // ============ INITIALIZATION ============
        onMounted(() => {
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
        });
        
        // Watch for data changes
        watch([medicalStaff, rotations, absences], 
            () => {
                updateDashboardStats();
            }, 
            { deep: true }
        );
        
        // ============ RETURN EVERYTHING ============
        return {
            // State
            currentUser,
            currentView,
            sidebarCollapsed,
            mobileMenuOpen,
            userMenuOpen,
            statsSidebarOpen,
            globalSearchQuery,
            loginForm,
            loginLoading,
            loading,
            saving,
            loadingSchedule,
            isLoadingStatus,
            
            // Profile State
            staffProfileModal,
            currentDoctorProfile,
            profileError,
            
            // Data
            medicalStaff,
            departments,
            trainingUnits,
            rotations,
            absences,
            onCallSchedule,
            todaysOnCall,
            announcements,
            clinicalStatus,
            systemStats,
            
            // UI
            toasts,
            systemAlerts,
            
            // Filters
            staffFilters,
            onCallFilters,
            rotationFilters,
            absenceFilters,
            
            // Modals
            medicalStaffModal,
            communicationsModal,
            onCallModal,
            rotationModal,
            trainingUnitModal,
            absenceModal,
            departmentModal,
            userProfileModal,
            confirmationModal,
            
           // Profile Functions
viewStaffDetails,
getStatusClass,
getStatusIcon,
getStatusText,
getStatusDescription,

// Auth Functions
handleLogin,
handleLogout,

// Navigation
switchView,
toggleStatsSidebar,
handleGlobalSearch,

// View Title Helpers
getCurrentViewTitle,
getCurrentViewSubtitle,

// Permission System
hasPermission,

// Modal Show Functions
showAddMedicalStaffModal,
showAddOnCallModal,
showAddAbsenceModal,
showAddRotationModal,
showAddTrainingUnitModal,
showAddDepartmentModal,
showCommunicationsModal,
showUserProfileModal,

// Edit Functions
editMedicalStaff,
editDepartment,
editTrainingUnit,
editRotation,
editOnCallSchedule,
editAbsence,

// Save Functions
saveMedicalStaff,
saveDepartment,
saveTrainingUnit,
saveRotation,
saveOnCallSchedule,
saveAbsence,
saveCommunication,
saveUserProfile,
    getSearchPlaceholder,

// Delete Functions
deleteMedicalStaff,
deleteRotation,
deleteOnCallSchedule,
deleteAbsence,

// Helper Functions
getDepartmentName,
getStaffName,
getTrainingUnitName,
getPhysicianName,
getResidentName,
getSupervisorName,
contactPhysician,

// Formatting Utilities
formatStaffType,
formatEmploymentStatus,
formatAbsenceReason,
formatRotationStatus,
getInitials,
formatDate,
formatTime,
formatRelativeTime,

// Toast System
showToast,
removeToast,

// Confirmation Modal
showConfirmation,
confirmAction,
cancelConfirmation,

// Computed Properties
availablePhysicians,
availableResidents,
availableAttendings,
availableHeadsOfDepartment,
availableReplacementStaff,
filteredMedicalStaff,
filteredOnCallSchedules,
filteredRotations,
filteredAbsences,
todaysOnCallCount,
recentAnnouncements,
getUserRoleDisplay,


// Data Loading Functions
loadMedicalStaff,
loadDepartments,
loadTrainingUnits,
loadRotations,
loadAbsences,
loadOnCallSchedule,
loadTodaysOnCall,
loadAnnouncements,
loadClinicalStatus,
loadSystemStats,
loadAllData
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
