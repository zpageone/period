// Constants
const DEFAULT_CYCLE_LENGTH = 28;
const LUTEAL_PHASE = 14; // Days from ovulation to next period
const FERTILE_WINDOW_START_OFFSET = 5; // Days before ovulation
const FERTILE_WINDOW_END_OFFSET = 1; // Days after ovulation

// State
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let periods = [];
let currentDate = new Date();
let selectedDateForLog = null;
let authMode = 'login'; // 'login' or 'register'

// DOM Elements
const elements = {
    userGreeting: document.getElementById('user-greeting'),
    authBtn: document.getElementById('auth-btn'),
    authModal: document.getElementById('auth-modal'),
    closeAuthBtn: document.getElementById('close-auth-btn'),
    tabLogin: document.getElementById('tab-login'),
    tabRegister: document.getElementById('tab-register'),
    authForm: document.getElementById('auth-form'),
    nameGroup: document.getElementById('name-group'),
    authName: document.getElementById('auth-name'),
    authEmail: document.getElementById('auth-email'),
    authPassword: document.getElementById('auth-password'),
    authSubmitBtn: document.getElementById('auth-submit-btn'),
    authError: document.getElementById('auth-error'),
    authLoggedInView: document.getElementById('auth-logged-in-view'),
    userInfoText: document.getElementById('user-info-text'),
    logoutBtn: document.getElementById('logout-btn'),

    statusLabel: document.getElementById('status-label'),
    statusValue: document.getElementById('status-value'),
    cycleProgress: document.getElementById('cycle-progress'),
    nextPeriodDate: document.getElementById('next-period-date'),
    ovulationDate: document.getElementById('ovulation-date'),
    fertilityWindow: document.getElementById('fertility-window'),
    pregnancyChance: document.getElementById('pregnancy-chance'),
    avgCycle: document.getElementById('avg-cycle'),
    calendarMonthYear: document.getElementById('calendar-month-year'),
    calendarGrid: document.getElementById('calendar-grid'),
    prevMonthBtn: document.getElementById('prev-month'),
    nextMonthBtn: document.getElementById('next-month'),
    logPeriodBtn: document.getElementById('log-period-btn'),
    logModal: document.getElementById('log-modal'),
    closeModalBtn: document.getElementById('close-modal-btn'),
    logForm: document.getElementById('log-form'),
    periodStartInput: document.getElementById('period-start'),
    periodEndInput: document.getElementById('period-end'),
    deleteLogBtn: document.getElementById('delete-log-btn')
};

// --- Auth Logic ---
const loadUserData = () => {
    if (currentUser) {
        periods = JSON.parse(localStorage.getItem(`periods_${currentUser.email}`)) || [];
        elements.userGreeting.textContent = `${currentUser.name}님 환영합니다!`;
    } else {
        periods = [];
        elements.userGreeting.textContent = '';
    }
};

const saveUserData = () => {
    if (currentUser) {
        localStorage.setItem(`periods_${currentUser.email}`, JSON.stringify(periods));
    }
};

const openAuthModal = () => {
    if (currentUser) {
        elements.authForm.classList.add('hidden');
        elements.authLoggedInView.classList.remove('hidden');
        elements.userInfoText.textContent = `${currentUser.name} (${currentUser.email})`;
        elements.tabLogin.parentElement.style.display = 'none';
        elements.authModal.querySelector('#auth-modal-title').textContent = '내 정보';
    } else {
        elements.authForm.classList.remove('hidden');
        elements.authLoggedInView.classList.add('hidden');
        elements.tabLogin.parentElement.style.display = 'flex';
        elements.authModal.querySelector('#auth-modal-title').textContent = '로그인 / 회원가입';
        setAuthMode('login');
    }
    elements.authModal.setAttribute('open', '');
};

const closeAuthModal = () => {
    elements.authModal.removeAttribute('open');
    elements.authError.textContent = '';
    elements.authForm.reset();
};

const setAuthMode = (mode) => {
    authMode = mode;
    elements.authError.textContent = '';
    if (mode === 'login') {
        elements.tabLogin.classList.add('active');
        elements.tabRegister.classList.remove('active');
        elements.nameGroup.style.display = 'none';
        elements.authSubmitBtn.textContent = '로그인';
    } else {
        elements.tabRegister.classList.add('active');
        elements.tabLogin.classList.remove('active');
        elements.nameGroup.style.display = 'flex';
        elements.authSubmitBtn.textContent = '가입하기';
    }
};

const handleAuthSubmit = (e) => {
    e.preventDefault();
    const email = elements.authEmail.value.trim();
    const password = elements.authPassword.value;
    const name = elements.authName.value.trim();

    let users = JSON.parse(localStorage.getItem('users')) || {};

    if (authMode === 'register') {
        if (users[email]) {
            elements.authError.textContent = '이미 가입된 이메일입니다.';
            return;
        }
        if (!name) {
            elements.authError.textContent = '이름을 입력해주세요.';
            return;
        }
        users[email] = { email, password, name };
        localStorage.setItem('users', JSON.stringify(users));
        
        currentUser = { email, name };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        closeAuthModal();
        loadUserData();
        updateApp();
    } else {
        // Login
        const user = users[email];
        if (!user || user.password !== password) {
            elements.authError.textContent = '이메일 또는 비밀번호가 올바르지 않습니다.';
            return;
        }
        currentUser = { email: user.email, name: user.name };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        closeAuthModal();
        loadUserData();
        updateApp();
    }
};

const handleLogout = () => {
    currentUser = null;
    localStorage.removeItem('currentUser');
    closeAuthModal();
    loadUserData();
    updateApp();
};

// --- Utilities ---
const formatDate = (date) => {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
};

const parseDate = (dateStr) => {
    const [year, month, day] = dateStr.split('-');
    return new Date(year, month - 1, day);
};

const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

const diffDays = (date1, date2) => {
    const diffTime = Math.abs(date2 - date1);
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

const isSameDay = (d1, d2) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
};

const formatDisplayDate = (date) => {
    return `${date.getMonth() + 1}월 ${date.getDate()}일`;
};

// --- Logic ---
const calculateAvgCycle = () => {
    if (periods.length < 2) return DEFAULT_CYCLE_LENGTH;
    
    // Sort periods by start date
    const sorted = [...periods].sort((a, b) => parseDate(a.start) - parseDate(b.start));
    let totalDays = 0;
    
    for (let i = 1; i < sorted.length; i++) {
        const d1 = parseDate(sorted[i-1].start);
        const d2 = parseDate(sorted[i].start);
        totalDays += diffDays(d1, d2);
    }
    
    return Math.round(totalDays / (sorted.length - 1));
};

const getCyclePredictions = () => {
    const avgCycle = calculateAvgCycle();
    
    if (periods.length === 0) {
        return null;
    }
    
    // Get latest period
    const sorted = [...periods].sort((a, b) => parseDate(b.start) - parseDate(a.start));
    const latestPeriodStart = parseDate(sorted[0].start);
    
    const nextPeriod = addDays(latestPeriodStart, avgCycle);
    const ovulation = addDays(nextPeriod, -LUTEAL_PHASE);
    const fertileStart = addDays(ovulation, -FERTILE_WINDOW_START_OFFSET);
    const fertileEnd = addDays(ovulation, FERTILE_WINDOW_END_OFFSET);
    
    return {
        nextPeriod,
        ovulation,
        fertileStart,
        fertileEnd,
        avgCycle,
        latestPeriodStart
    };
};

const checkPregnancyChance = (predictions) => {
    if (!predictions) return "알 수 없음";
    
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const fStart = new Date(predictions.fertileStart);
    fStart.setHours(0,0,0,0);
    
    const fEnd = new Date(predictions.fertileEnd);
    fEnd.setHours(0,0,0,0);
    
    if (today >= fStart && today <= fEnd) {
        return "높음 (가임기)";
    }
    return "낮음";
};

// --- UI Updates ---
const updateDashboard = (predictions) => {
    if (!predictions) {
        elements.statusLabel.textContent = "기록을 추가해주세요";
        elements.statusValue.textContent = "--일";
        elements.cycleProgress.style.strokeDashoffset = 283;
        
        elements.nextPeriodDate.textContent = "--월 --일";
        elements.ovulationDate.textContent = "--월 --일";
        elements.fertilityWindow.textContent = "--월 --일 ~ --월 --일";
        elements.avgCycle.textContent = `${DEFAULT_CYCLE_LENGTH}일`;
        elements.pregnancyChance.textContent = `현재: 알 수 없음`;
        return;
    }

    const today = new Date();
    today.setHours(0,0,0,0);
    const nextP = new Date(predictions.nextPeriod);
    nextP.setHours(0,0,0,0);
    
    const daysLeft = diffDays(today, nextP);
    
    if (today > nextP) {
        elements.statusLabel.textContent = "생리 예정일 지남";
        elements.statusValue.textContent = `+${daysLeft}일`;
        elements.cycleProgress.style.strokeDashoffset = 0; // Full red
        elements.cycleProgress.style.stroke = "var(--danger-color)";
    } else {
        elements.statusLabel.textContent = "다음 생리까지";
        elements.statusValue.textContent = `${daysLeft}일`;
        
        // Progress ring logic
        const cycleProgress = (predictions.avgCycle - daysLeft) / predictions.avgCycle;
        const circumference = 283;
        const offset = circumference - (cycleProgress * circumference);
        elements.cycleProgress.style.strokeDashoffset = offset;
        elements.cycleProgress.style.stroke = "var(--primary-color)";
    }

    elements.nextPeriodDate.textContent = formatDisplayDate(predictions.nextPeriod);
    elements.ovulationDate.textContent = formatDisplayDate(predictions.ovulation);
    elements.fertilityWindow.textContent = `${formatDisplayDate(predictions.fertileStart)} ~ ${formatDisplayDate(predictions.fertileEnd)}`;
    elements.avgCycle.textContent = `${predictions.avgCycle}일`;
    
    const chance = checkPregnancyChance(predictions);
    elements.pregnancyChance.textContent = `현재: ${chance}`;
    if (chance.includes("높음")) {
        elements.pregnancyChance.style.color = "var(--secondary-color)";
        elements.pregnancyChance.style.backgroundColor = "var(--secondary-light)";
    } else {
        elements.pregnancyChance.style.color = "var(--primary-color)";
        elements.pregnancyChance.style.backgroundColor = "var(--primary-light)";
    }
};

const isDateInPeriod = (dateStr) => {
    const d = parseDate(dateStr);
    for (const p of periods) {
        const start = parseDate(p.start);
        const end = p.end ? parseDate(p.end) : start;
        if (d >= start && d <= end) return p;
    }
    return null;
};

const renderCalendar = () => {
    elements.calendarGrid.innerHTML = '';
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    elements.calendarMonthYear.textContent = `${year}년 ${month + 1}월`;
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const daysOfWeek = ['일', '월', '화', '수', '목', '금', '토'];
    daysOfWeek.forEach(day => {
        const el = document.createElement('div');
        el.className = 'day-header';
        el.textContent = day;
        elements.calendarGrid.appendChild(el);
    });
    
    const predictions = getCyclePredictions();
    const today = new Date();
    today.setHours(0,0,0,0);
    
    // Empty cells
    for (let i = 0; i < firstDay; i++) {
        const el = document.createElement('div');
        el.className = 'calendar-day empty';
        elements.calendarGrid.appendChild(el);
    }
    
    // Days
    for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(year, month, i);
        const dStr = formatDate(d);
        const el = document.createElement('div');
        el.className = 'calendar-day';
        el.textContent = i;
        
        // Classes
        if (isSameDay(d, today)) el.classList.add('today');
        
        const loggedPeriod = isDateInPeriod(dStr);
        if (loggedPeriod) {
            el.classList.add('period');
        } else if (predictions) {
            // Check predicted period (assuming 5 days length for UI)
            const pStart = predictions.nextPeriod;
            const pEnd = addDays(pStart, 4);
            if (d >= pStart && d <= pEnd) el.classList.add('predicted-period');
            
            // Check ovulation
            if (isSameDay(d, predictions.ovulation)) el.classList.add('ovulation');
            // Check fertile
            else if (d >= predictions.fertileStart && d <= predictions.fertileEnd) el.classList.add('fertile');
        }
        
        el.addEventListener('click', () => openModal(dStr, loggedPeriod));
        elements.calendarGrid.appendChild(el);
    }
};

// --- Modal & Form Interactions ---
const openModal = (dateStr = null, existingLog = null) => {
    if (!currentUser) {
        openAuthModal();
        elements.authError.textContent = '기록을 저장하려면 로그인해주세요.';
        return;
    }
    selectedDateForLog = dateStr || formatDate(new Date());
    
    if (existingLog) {
        elements.periodStartInput.value = existingLog.start;
        elements.periodEndInput.value = existingLog.end || existingLog.start;
        elements.deleteLogBtn.classList.remove('hidden');
    } else {
        elements.periodStartInput.value = selectedDateForLog;
        elements.periodEndInput.value = '';
        elements.deleteLogBtn.classList.add('hidden');
    }
    
    elements.logModal.setAttribute('open', '');
};

const closeModal = () => {
    elements.logModal.removeAttribute('open');
};

const saveLog = (e) => {
    e.preventDefault();
    if (!currentUser) return;
    
    const start = elements.periodStartInput.value;
    const end = elements.periodEndInput.value;
    
    // If editing an existing log, remove the old one first
    if (selectedDateForLog) {
        const existingLog = isDateInPeriod(selectedDateForLog);
        if (existingLog) {
            periods = periods.filter(p => p.start !== existingLog.start);
        }
    }
    
    // Also ensure no duplicate start dates
    periods = periods.filter(p => p.start !== start);
    
    periods.push({ start, end: end || start });
    saveUserData();
    
    closeModal();
    updateApp();
};

const deleteLog = () => {
    if (!currentUser) return;
    
    if (selectedDateForLog) {
        const existingLog = isDateInPeriod(selectedDateForLog);
        if (existingLog) {
            periods = periods.filter(p => p.start !== existingLog.start);
            saveUserData();
        }
    }
    closeModal();
    updateApp();
};

// --- App Initialization ---
const updateApp = () => {
    const predictions = getCyclePredictions();
    updateDashboard(predictions);
    renderCalendar();
};

const init = () => {
    loadUserData();
    updateApp();
    
    // Event Listeners
    elements.prevMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });
    
    elements.nextMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });
    
    elements.logPeriodBtn.addEventListener('click', () => openModal());
    elements.closeModalBtn.addEventListener('click', closeModal);
    elements.logForm.addEventListener('submit', saveLog);
    elements.deleteLogBtn.addEventListener('click', deleteLog);
    
    // Close modal on outside click
    elements.logModal.addEventListener('click', (e) => {
        if (e.target === elements.logModal) closeModal();
    });

    // Auth Listeners
    elements.authBtn.addEventListener('click', openAuthModal);
    elements.closeAuthBtn.addEventListener('click', closeAuthModal);
    elements.authModal.addEventListener('click', (e) => {
        if (e.target === elements.authModal) closeAuthModal();
    });
    elements.tabLogin.addEventListener('click', () => setAuthMode('login'));
    elements.tabRegister.addEventListener('click', () => setAuthMode('register'));
    elements.authForm.addEventListener('submit', handleAuthSubmit);
    elements.logoutBtn.addEventListener('click', handleLogout);
};

document.addEventListener('DOMContentLoaded', init);