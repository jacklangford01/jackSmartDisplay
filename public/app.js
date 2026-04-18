// master function for automation
function getMasterTimeOfDay() {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const totalMinutes = hour * 60 + minute;

    // if (totalMinutes >= 5 * 60 && totalMinutes < 8 * 60) {
    //     return 'earlyMorning';
    // } 
    // else if (totalMinutes >= 8 * 60 && totalMinutes < 11 * 60) {
    //     return 'morning';
    // } 
    // else if (totalMinutes >= 11 * 60 && totalMinutes < 17 * 60) {
    //     return 'afternoon';
    // } 
    // else if (totalMinutes >= 17 * 60 && totalMinutes < 20 * 60) {
    //     return 'evening';
    // } 
    // else if (totalMinutes >= 20 * 60 && totalMinutes < (21 * 60 + 45)) {
    //     return 'night';
    // } 
    // else {
    //     return 'lateNight';
    // }

    //manual for testing

    return 'afternoon';

}

//settings for stocks and news...
const DASHBOARD_CONFIG = {
    cycleIntervalMs: 12000,

    morningBriefTabs: [
        {
            label: 'Commute',
            icon: 'fa-road',
            main: '22 min',
            sub: 'Home to campus via Loop 202',
            detail: 'Moderate traffic with one slowdown'
        },
        {
            label: 'Next Up',
            icon: 'fa-hourglass-half',
            main: 'Class in 42 min',
            sub: 'Leave by 8:15 AM',
            detail: 'Bring laptop and charger'
        },
        {
            label: 'Weather',
            icon: 'fa-sun',
            main: '96° / 71°',
            sub: 'Sunny and hot later',
            detail: 'UV very high this afternoon'
        },
        {
            label: 'Schedule',
            icon: 'fa-calendar-day',
            main: '3 events today',
            sub: 'Class • Meeting • Gym',
            detail: 'Free from 1:00 PM to 3:30 PM'
        },
        {
            label: 'Markets',
            icon: 'fa-chart-line',
            main: 'QQQ led yesterday',
            sub: 'SPY +0.4% • QQQ +0.7%',
            detail: 'Large-cap tech stayed firm'
        },
        {
            label: 'News',
            icon: 'fa-newspaper',
            main: 'Top headline',
            sub: 'Markets watching rates and earnings',
            detail: 'Investors remain focused on AI demand'
        }
    ],

    eveningTabs: [
        {
            label: 'Tomorrow',
            icon: 'fa-calendar-check',
            main: '2 key events tomorrow',
            sub: '10:00 AM meeting',
            detail: 'Prep notes tonight if needed'
        },
        {
            label: 'Schedule',
            icon: 'fa-calendar-day',
            main: 'Tomorrow starts at 10:00',
            sub: 'Light morning schedule',
            detail: 'Good window for focused work'
        },
        {
            label: 'Markets',
            icon: 'fa-chart-line',
            main: 'US markets closed mixed',
            sub: 'Tech outperformed',
            detail: 'Watch futures in the morning'
        },
        {
            label: 'Crypto',
            icon: 'fa-bitcoin-sign',
            main: 'BTC $68.4K',
            sub: 'ETH $3.4K • SOL $154',
            detail: 'Crypto active overnight'
        },
        {
            label: 'Alerts',
            icon: 'fa-triangle-exclamation',
            main: 'Heat Alert',
            sub: 'Hot afternoon tomorrow',
            detail: 'Hydrate before heading out',
            level: 'warning'
        },
        {
            label: 'Global',
            icon: 'fa-earth-americas',
            main: 'Asia opens tonight',
            sub: 'Europe data due in morning',
            detail: 'Overseas markets may set early tone'
        }
    ]
};

// blue light filter level based on time of day
function getBlueLightFilterLevel() {
    const masterTimeOfDay = getMasterTimeOfDay();

    if (masterTimeOfDay === 'lateNight') {
        return 'strong';
    }

    if (masterTimeOfDay === 'night' || masterTimeOfDay === 'earlyMorning') {
        return 'medium';
    }

    return 'off';
}

class SmartDisplay {
    constructor() {
        this.currentCard = 0;
        this.photos = [];
        this.currentPhotoIndex = 0;
        this.photoInterval = null;
        this.settings = this.loadSettings();
        this.summaryShown = false;
        this.lastSummaryDate = new Date().toDateString();
        
        // Cache DOM elements for better performance
        this.domCache = {};
        this.cacheDOMElements();
        
        // Performance optimization flags
        this.isLowPowerMode = this.detectLowPowerMode();
        this.lastUpdateTime = 0;
        this.lastTimeBarUpdate = 0;
        this.updateThrottle = 1000; // 1 second throttle for updates
        
        // Navigation control flags
        this.carouselNavigationDisabled = false;
        this.swipeEventsDisabled = false;

        //Stocks logic
        this.dashboardTabIndex = 0;
        this.dashboardTabTimer = null;
        
        this.init();
    }

    cacheDOMElements() {
        // Cache frequently accessed DOM elements
        this.domCache = {
            carouselWrapper: document.getElementById('carouselWrapper'),
            dashboardStrip: document.getElementById('dashboardStrip'),
            dashboardStripHeader: document.getElementById('dashboardStripHeader'),
            dashboardStripBody: document.getElementById('dashboardStripBody'),
            calendarCard: document.getElementById('calendarCard'),
            calendarContent: document.getElementById('calendarContent'),
            leftTouchArea: document.getElementById('leftTouchArea'),
            rightTouchArea: document.getElementById('rightTouchArea'),
            photoSlideshow: document.getElementById('photoSlideshow'),
            greetingMessage: document.getElementById('greetingMessage'),
            timeDisplay: document.querySelector('.time'),
            dateDisplay: document.querySelector('.date'),
            weatherDisplay: document.getElementById('weatherDisplay'),
            temperature: document.querySelector('.temperature'),
            condition: document.querySelector('.condition'),
            weatherIcon: document.querySelector('.weather-header i'),
            forecastContent: document.getElementById('forecastContent'),
            agendaContent: document.getElementById('agendaContent'),
            summaryContent: document.getElementById('summaryContent'),
            homeAssistantFrame: document.getElementById('homeAssistantFrame'),
            settingsModal: document.getElementById('settingsModal'),
            blackoutOverlay: document.getElementById('blackoutOverlay'),
            blueLightOverlay: document.getElementById('blueLightOverlay'),
            weatherTrend: document.getElementById('weatherTrend'),
            dashboardStrip: document.getElementById('dashboardStrip'),
            dashboardStripHeader: document.getElementById('dashboardStripHeader'),
            dashboardStripBody: document.getElementById('dashboardStripBody')
        };
    }

    detectLowPowerMode() {
        // Detect if running on low-power device (Raspberry Pi)
        return navigator.hardwareConcurrency <= 4 || 
               navigator.deviceMemory <= 4 ||
               /arm|aarch64/i.test(navigator.platform);
    }

    init() {
        this.setupEventListeners();
        this.updateTime();
        this.loadCalendarEvents();
        this.loadWeather();
        this.loadPhotos();
        this.updateBlueLightFilter();
        this.renderDashboardStrip();
        this.dashboardTabTimer = setInterval(() => this.cycleDashboardStrip(), DASHBOARD_CONFIG.cycleIntervalMs);
        
        // Optimize intervals based on power mode
        const intervals = this.isLowPowerMode ? {
            time: 2000,           // 2 seconds instead of 1
            weather: 45 * 60 * 1000,  // 45 minutes instead of 30
            calendar: 2 * 60 * 1000,  // 2 minutes instead of 1
            photos: 3 * 60 * 1000,    // 3 minutes instead of 1.5
            forecast: 20 * 60 * 1000, // 20 minutes instead of 15
            agenda: 20 * 60 * 1000,   // 20 minutes instead of 15
            summary: 30 * 1000        // 30 seconds instead of 10
        } : {
            time: 1000,
            weather: 30 * 60 * 1000,
            calendar: 60 * 1000,
            photos: 90 * 1000,
            forecast: 15 * 60 * 1000,
            agenda: 15 * 60 * 1000,
            summary: 60 * 1000 // Check every minute instead of every 10 seconds
        };
        
        // Update time with throttling
        setInterval(() => this.updateTime(), intervals.time);

        // blue light update
        setInterval(() => this.updateBlueLightFilter(), intervals.time);
        
        // Update weather less frequently
        setInterval(() => this.loadWeather(), intervals.weather);
        
        // Update calendar less frequently
        setInterval(() => this.loadCalendarEvents(), intervals.calendar);
        
        // Refresh photos less frequently
        setInterval(() => this.loadPhotos(), intervals.photos);
        
        // Load forecast and agenda initially
        this.loadForecast();
        this.loadAgenda();
        
        // Refresh forecast and agenda less frequently
        setInterval(() => this.loadForecast(), intervals.forecast);
        setInterval(() => this.loadAgenda(), intervals.agenda);
        
        // Check for hourly summary less frequently
        this.checkHourlySummary();
        setInterval(() => this.checkHourlySummary(), intervals.summary);
        
        // Update time bars less frequently
        this.updateAllTimeBars();
        setInterval(() => this.updateAllTimeBars(), intervals.time);

        //display refresh
        setInterval(() => this.animateTextRefresh(), 600000);

        // dashboard strip
        setInterval(() => this.renderDashboardStrip(), intervals.time);
        
        // Debounced resize handler
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                if (this.domCache.calendarContent.children.length > 0) {
                    this.adjustCalendarCardHeight(this.domCache.calendarContent.children.length);
                }
            }, 250);
        });
    }

//stock display logic:
getDashboardTabSet() {
    const timeOfDay = getMasterTimeOfDay();

    if (timeOfDay === 'earlyMorning' || timeOfDay === 'morning') {
        return {
            title: 'Morning Brief',
            tabs: DASHBOARD_CONFIG.morningBriefTabs
        };
    }

    if (timeOfDay === 'afternoon') {
        return {
            title: 'Day Watch',
            tabs: DASHBOARD_CONFIG.morningBriefTabs
        };
    }

    if (timeOfDay === 'evening' || timeOfDay === 'night') {
        return {
            title: 'Evening Wrap',
            tabs: DASHBOARD_CONFIG.eveningTabs
        };
    }

    return null;
}

renderDashboardStrip() {
    const strip = this.domCache.dashboardStrip;
    const header = this.domCache.dashboardStripHeader;
    const body = this.domCache.dashboardStripBody;

    if (!strip || !header || !body) return;

    const tabSet = this.getDashboardTabSet();

    if (!tabSet) {
        strip.style.display = 'none';
        return;
    }

    strip.style.display = 'block';
    header.textContent = tabSet.title;

    const tabs = tabSet.tabs;
    const activeIndex = this.dashboardTabIndex % tabs.length;
    const active = tabs[activeIndex];

    const buttons = tabs.map((tab, i) => `
        <button class="brief-tab ${i === activeIndex ? 'active' : ''}" data-tab="${i}">
            <i class="fas ${tab.icon}"></i>
            <span>${tab.label}</span>
        </button>
    `).join('');

    body.innerHTML = `
        <div class="brief-tabs-row">
            ${buttons}
        </div>

        <div class="brief-panel ${active.level || ''}">
            <div class="brief-panel-label">
                <i class="fas ${active.icon}"></i>
                <span>${active.label}</span>
            </div>

            <div class="brief-panel-main">${active.main}</div>
            <div class="brief-panel-sub">${active.sub}</div>
            <div class="brief-panel-detail">${active.detail}</div>
        </div>
    `;

    body.querySelectorAll('.brief-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            this.dashboardTabIndex = Number(btn.dataset.tab);
            this.renderDashboardStrip();
        });
    });
}

cycleDashboardStrip() {
    const tabSet = this.getDashboardTabSet();
    if (!tabSet) return;

    this.dashboardTabIndex = (this.dashboardTabIndex + 1) % tabSet.tabs.length;
    this.renderDashboardStrip();
}
    

    setupEventListeners() {
        // Touch areas for swipe gestures
        this.domCache.leftTouchArea.addEventListener('click', () => this.previousCard());
        this.domCache.rightTouchArea.addEventListener('click', () => this.nextCard());

        // Touch/swipe gestures with throttling
        let startX = 0;
        let endX = 0;
        let lastSwipeTime = 0;
        const swipeThrottle = 300; // Prevent rapid swipes

        document.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
        });

        document.addEventListener('touchend', (e) => {
            endX = e.changedTouches[0].clientX;
            const now = Date.now();
            if (now - lastSwipeTime > swipeThrottle) {
                this.handleSwipe(startX, endX);
                lastSwipeTime = now;
            }
        });

        // Mouse drag for desktop with throttling
        let isDragging = false;
        let startPos = 0;
        let lastMouseSwipeTime = 0;

        document.addEventListener('mousedown', (e) => {
            isDragging = true;
            startPos = e.clientX;
        });

        document.addEventListener('mouseup', (e) => {
            if (isDragging) {
                const endPos = e.clientX;
                const now = Date.now();
                if (now - lastMouseSwipeTime > swipeThrottle) {
                    this.handleSwipe(startPos, endPos);
                    lastMouseSwipeTime = now;
                }
                isDragging = false;
            }
        });

        // Settings with event delegation
        document.addEventListener('click', (e) => {
            if (e.target.closest('.settings-btn')) {
                e.preventDefault();
                e.stopPropagation();
                this.openSettings();
            }
        });

        document.getElementById('closeSettings').addEventListener('click', () => this.closeSettings());
        document.getElementById('saveSettings').addEventListener('click', () => this.saveSettings());
        document.getElementById('refreshPage').addEventListener('click', () => this.refreshPage());
        document.getElementById('summaryRefreshBtn').addEventListener('click', () => this.refreshSummary());
        
        // Hourly forecast overlay
        document.getElementById('closeHourlyForecast').addEventListener('click', () => this.closeHourlyForecast());
        
        // Close overlay when clicking outside
        document.getElementById('hourlyForecastOverlay').addEventListener('click', (e) => {
            if (e.target.id === 'hourlyForecastOverlay') {
                this.closeHourlyForecast();
            }
        });
        
        // Prevent scroll events from propagating to background on Raspberry Pi
        document.getElementById('hourlyForecastOverlay').addEventListener('wheel', (e) => {
            e.stopPropagation();
        }, { passive: false });
        
        document.getElementById('hourlyForecastOverlay').addEventListener('touchmove', (e) => {
            e.stopPropagation();
        }, { passive: false });
        
        // Close settings when clicking outside
        document.getElementById('settingsModal').addEventListener('click', (e) => {
            if (e.target.id === 'settingsModal') {
                this.closeSettings();
            }
        });
        
        // Prevent scroll events from propagating to background on Raspberry Pi
        document.getElementById('settingsModal').addEventListener('wheel', (e) => {
            e.stopPropagation();
        }, { passive: false });
        
        document.getElementById('settingsModal').addEventListener('touchmove', (e) => {
            e.stopPropagation();
        }, { passive: false });

        // Back buttons with event delegation
        document.addEventListener('click', (e) => {
            if (e.target.closest('.ha-back-btn')) {
                this.goToCard(0);
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (this.carouselNavigationDisabled) return;
            
            switch(e.key) {
                case 'ArrowLeft':
                    this.previousCard();
                    break;
                case 'ArrowRight':
                    this.nextCard();
                    break;
                case 'Escape':
                    this.closeSettings();
                    this.closeHourlyForecast();
                    break;
            }
        });
    }

    handleSwipe(startX, endX) {
        if (this.swipeEventsDisabled) return;
        
        const threshold = 50;
        const diff = startX - endX;

        if (Math.abs(diff) > threshold) {
            if (diff > 0) {
                this.nextCard();
            } else {
                this.previousCard();
            }
        }
    }

    goToCard(index) {
        if (index === this.currentCard) return;

        const wrapper = this.domCache.carouselWrapper;

        // Remove all slide classes
        wrapper.classList.remove('slide-left', 'slide-left-2', 'slide-left-3', 'slide-left-4');

        // Add appropriate slide class
        if (index === 1) {
            wrapper.classList.add('slide-left');
        } else if (index === 2) {
            wrapper.classList.add('slide-left-2');
        } else if (index === 3) {
            wrapper.classList.add('slide-left-3');
        } else if (index === 4) {
            wrapper.classList.add('slide-left-4');
        }

        this.currentCard = index;

        // Handle card-specific behavior
        if (index === 0) {
            // Photos card
            this.domCache.calendarCard.style.display = 'block';
            this.domCache.leftTouchArea.style.pointerEvents = 'auto';
            this.domCache.rightTouchArea.style.pointerEvents = 'auto';
        } else if (index === 1) {
            // Hourly Summary card
            this.domCache.calendarCard.style.display = 'none';
            this.domCache.leftTouchArea.style.pointerEvents = 'none';
            this.domCache.rightTouchArea.style.pointerEvents = 'none';
            this.loadSummary();
        } else if (index === 2) {
            // Home Assistant card
            this.domCache.calendarCard.style.display = 'none';
            this.domCache.leftTouchArea.style.pointerEvents = 'none';
            this.domCache.rightTouchArea.style.pointerEvents = 'none';
        } else if (index === 3) {
            // Weather Forecast card
            this.domCache.calendarCard.style.display = 'none';
            this.domCache.leftTouchArea.style.pointerEvents = 'none';
            this.domCache.rightTouchArea.style.pointerEvents = 'none';
            this.loadForecast();
        } else if (index === 4) {
            // Calendar Agenda card
            this.domCache.calendarCard.style.display = 'none';
            this.domCache.leftTouchArea.style.pointerEvents = 'none';
            this.domCache.rightTouchArea.style.pointerEvents = 'none';
            this.loadAgenda();
        }
    }

    //Change this back to unlock carousel navigation


    // nextCard() {
    //     const nextIndex = (this.currentCard + 1) % 5;
    //     this.goToCard(nextIndex);
    // }

    // previousCard() {
    //     const prevIndex = this.currentCard === 0 ? 4 : this.currentCard - 1;
    //     this.goToCard(prevIndex);
    // }

    // weather function helper:
    getWeatherDisplayMode() {
    const timeOfDay = getMasterTimeOfDay();

    if (timeOfDay === 'earlyMorning' || timeOfDay === 'morning') {
        return 'todayTrend';
    }

    if (timeOfDay === 'night') {
        return 'tomorrowPreview';
    }

    if (timeOfDay === 'lateNight') {
        return 'hidden';
    }

    return 'current';
    }

    nextCard() {
    return;
    }

    previousCard() {
        return;
    }

    // to help the display not ware as fast
    animateTextRefresh() {
    const targets = document.querySelectorAll(
        '.time, .date, .greeting, .temperature, .condition, .weather-trend, .calendar-event, .quote-text'
    );

    targets.forEach(el => {
        el.classList.add('display-text-fade');
        el.classList.add('display-text-hidden');
    });

    setTimeout(() => {
        targets.forEach(el => {
            el.classList.remove('display-text-hidden');
        });
    }, 1800);
}

    updateTime() {
        const now = Date.now();
        if (now - this.lastUpdateTime < this.updateThrottle) return;
        this.lastUpdateTime = now;

        const timeElement = this.domCache.timeDisplay;
        const dateElement = this.domCache.dateDisplay;

        const currentTime = new Date();
        timeElement.textContent = currentTime.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });

        dateElement.textContent = currentTime.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    
    const hour = currentTime.getHours();
    // const hour = 23;
    const minute = currentTime.getMinutes();
    let greeting = 'Good evening';

    if (hour < 11) {
        greeting = 'Good morning';
    } else if (hour < 17) {
        greeting = 'Good afternoon';
    } else if (hour < 21 || (hour === 21 && minute < 45)) {
        greeting = 'Good evening';
    } else {
        greeting = 'Goodnight';
    }

    if (this.domCache.greetingMessage) {
        this.domCache.greetingMessage.textContent = greeting;
    }

        const shouldBlackout =
        hour > 22 ||
        hour < 7;

    if (this.domCache.blackoutOverlay) {
        this.domCache.blackoutOverlay.style.display = shouldBlackout ? 'block' : 'none';
    }

    }

    updateAllTimeBars() {
        const now = Date.now();
        if (now - this.lastTimeBarUpdate < this.updateThrottle) return;
        this.lastTimeBarUpdate = now;

        const timeString = new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
        
        // Update all time displays in headers
        const headerTimeDisplays = document.querySelectorAll('.header-time-display');
        headerTimeDisplays.forEach(timeDisplay => {
            timeDisplay.textContent = timeString;
        });
    }

    async loadWeather() {
        try {
            if (!this.settings.latitude || !this.settings.longitude) {
                console.log('Weather coordinates not configured');
                return;
            }

            const response = await fetch(`/api/weather?lat=${this.settings.latitude}&lon=${this.settings.longitude}`);
            const weatherData = await response.json();

            if (weatherData.error) {
                console.error('Weather API error:', weatherData.error);
                return;
            }

            this.updateWeatherDisplay(weatherData);
        } catch (error) {
            console.error('Error loading weather:', error);
        }
    }


    getWeatherIcon(code) {
    if (code === 0) return 'fa-sun weather-sunny';
    if (code >= 1 && code <= 3) return 'fa-cloud weather-cloudy';
    if (code >= 45 && code <= 48) return 'fa-cloud weather-foggy';
    if (code >= 51 && code <= 67) return 'fa-cloud-rain weather-rain';
    if (code >= 71 && code <= 77) return 'fa-snowflake weather-snow';
    if (code >= 80 && code <= 82) return 'fa-cloud-rain weather-rain';
    if (code >= 85 && code <= 86) return 'fa-snowflake weather-snow';
    if (code >= 95 && code <= 99) return 'fa-bolt weather-storm';
    return 'fa-cloud weather-cloudy';
}

getWeatherDescription(code) {
    const descriptions = {
        0: 'Clear sky',
        1: 'Partly cloudy',
        2: 'Partly cloudy',
        3: 'Overcast',
        45: 'Foggy',
        48: 'Depositing rime fog',
        51: 'Light drizzle',
        53: 'Moderate drizzle',
        55: 'Dense drizzle',
        56: 'Light freezing drizzle',
        57: 'Dense freezing drizzle',
        61: 'Slight rain',
        63: 'Moderate rain',
        65: 'Heavy rain',
        66: 'Light freezing rain',
        67: 'Heavy freezing rain',
        71: 'Slight snow',
        73: 'Moderate snow',
        75: 'Heavy snow',
        77: 'Snow grains',
        80: 'Slight rain showers',
        81: 'Moderate rain showers',
        82: 'Violent rain showers',
        85: 'Slight snow showers',
        86: 'Heavy snow showers',
        95: 'Thunderstorm',
        96: 'Thunderstorm with slight hail',
        99: 'Thunderstorm with heavy hail'
    };
    return descriptions[code] || 'Unknown';
}

  updateWeatherDisplay(weatherData) {
        const weatherBox = this.domCache.weatherDisplay;
        const tempElement = this.domCache.temperature;
        const conditionElement = this.domCache.condition;
        const iconElement = this.domCache.weatherIcon;
        const calendarCard = this.domCache.calendarCard;
        const trendElement = this.domCache.weatherTrend;

        const displayMode = this.getWeatherDisplayMode();

        if (!weatherBox || !tempElement || !conditionElement || !iconElement) return;

        // Hide weather and calendar during late night
        if (displayMode === 'hidden') {
            weatherBox.style.display = 'none';
            if (calendarCard) {
                calendarCard.style.display = 'none';
            }
            return;
        }

        weatherBox.style.display = 'flex';

        // Only show calendar again if you're on the main card
        if (calendarCard && this.currentCard === 0) {
            calendarCard.style.display = 'block';
        }

        // Current weather default
        const currentTemp = Math.round(weatherData.current.temperature_2m);
        const currentDesc = this.getWeatherDescription(weatherData.current.weather_code);
        const currentIcon = this.getWeatherIcon(weatherData.current.weather_code);

        if (displayMode === 'todayTrend' && weatherData.hourly) {
            const now = new Date();
            const currentHour = now.getHours();

            const hourly = weatherData.hourly;
            const trendPoints = [];

            for (let i = 0; i < hourly.time.length; i++) {
                const hourTime = new Date(hourly.time[i]);
                const hour = hourTime.getHours();

                if (hour >= currentHour && trendPoints.length < 4) {
                    trendPoints.push({
                        hour,
                        temp: Math.round(hourly.temperature_2m[i]),
                        code: hourly.weather_code[i]
                    });
                }
            }

            const trendText = trendPoints.map(point => {
                const hourLabel =
                    point.hour === 0 ? '12a' :
                    point.hour < 12 ? `${point.hour}a` :
                    point.hour === 12 ? '12p' :
                    `${point.hour - 12}p`;

                return `${hourLabel}: ${point.temp}°`;
            }).join(' • ');

            tempElement.textContent = `${currentTemp}°F`;
            conditionElement.textContent = currentDesc;
            if (trendElement) {
                trendElement.textContent = trendText;
            }
            iconElement.className = `fas ${currentIcon}`;
            return;
        }

        if (displayMode === 'tomorrowPreview' && weatherData.daily) {
            const tomorrowHigh = Math.round(weatherData.daily.temperature_2m_max[1]);
            const tomorrowLow = Math.round(weatherData.daily.temperature_2m_min[1]);
            const tomorrowCode = weatherData.daily.weather_code[1];
            const tomorrowDesc = this.getWeatherDescription(tomorrowCode);

            tempElement.textContent = `${currentTemp}°F`;
            conditionElement.textContent = `Now: ${currentDesc}`;
            if (trendElement) {
                trendElement.textContent = `Tomorrow: ${tomorrowDesc} • H ${tomorrowHigh}° / L ${tomorrowLow}°`;
            }
            iconElement.className = `fas ${currentIcon}`;
            return;
        }

        // Default current weather view
        tempElement.textContent = `${currentTemp}°F`;
        conditionElement.textContent = currentDesc;
            if (trendElement) {
                trendElement.textContent = '';
            }
        iconElement.className = `fas ${currentIcon}`;

        if (weatherData.current.relative_humidity_2m) {
            const humidity = Math.round(weatherData.current.relative_humidity_2m);
            conditionElement.textContent += ` • ${humidity}% humidity`;
        }

        if (weatherData.current.wind_speed_10m) {
            const windSpeed = Math.round(weatherData.current.wind_speed_10m);
            const windDirection = this.getWindDirection(weatherData.current.wind_direction_10m);
            const windArrow = this.getWindArrow(weatherData.current.wind_direction_10m);
            conditionElement.innerHTML += ` • ${windArrow} ${windSpeed} mph ${windDirection}`;
        }
    }

    getWindDirection(degrees) {
        const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
        const index = Math.round(degrees / 22.5) % 16;
        return directions[index];
    }

    getWindArrow(degrees) {
        return `<span class="wind-direction" style="transform: rotate(${degrees}deg);">→</span>`;
    }

    async loadCalendarEvents() {
        try {
            const response = await fetch('/api/calendar/events');
            const events = await response.json();

            this.updateCalendarDisplay(events);
        } catch (error) {
            console.error('Error loading calendar events:', error);
            this.updateCalendarDisplay([]);
        }
    }

    updateCalendarDisplay(events) {
        const calendarContent = this.domCache.calendarContent;
        const calendarCard = this.domCache.calendarCard;

        if (events.length === 0) {
            calendarContent.innerHTML = '<div class="loading">No upcoming events</div>';
            calendarCard.classList.add('collapsed');
            return;
        }

        calendarCard.classList.remove('collapsed');

        // Filter events: show all-day events for today (persistent), timed events for next 24 hours
        const now = new Date();
        
        const upcomingEvents = events.filter(event => {
            const endTime = new Date(event.end.dateTime || event.end.date);
            const startTime = new Date(event.start.dateTime || event.start.date);
            
            // For all-day events, show if they're today or tomorrow
            if (!event.start.dateTime) {
                const [year, month, day] = event.start.date.split('-').map(Number);
                const eventDate = new Date(year, month - 1, day);
                const today = new Date();
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                
                const eventDateString = eventDate.toDateString();
                const todayString = today.toDateString();
                const tomorrowString = tomorrow.toDateString();
                
                return eventDateString === todayString || eventDateString === tomorrowString;
            }
            
            // For timed events, show if they start within the next 24 hours and haven't ended yet
            const next24Hours = new Date(now.getTime() + (24 * 60 * 60 * 1000));
            return startTime <= next24Hours && endTime > now;
        });
        
        if (upcomingEvents.length === 0) {
            calendarContent.innerHTML = '<div class="loading">No upcoming events</div>';
            calendarCard.classList.add('collapsed');
            return;
        }
        
        const sortedEvents = upcomingEvents.sort((a, b) => {
            const aStart = new Date(a.start.dateTime || a.start.date);
            const aEnd = new Date(a.end.dateTime || a.end.date);
            const bStart = new Date(b.start.dateTime || b.start.date);
            const bEnd = new Date(b.end.dateTime || b.end.date);
            
            const aIsCurrent = now >= aStart && now <= aEnd;
            const bIsCurrent = now >= bStart && now <= bEnd;
            const aIsAllDay = !a.start.dateTime;
            const bIsAllDay = !b.start.dateTime;
            
            // All-day events first
            if (aIsAllDay && !bIsAllDay) return -1;
            if (!aIsAllDay && bIsAllDay) return 1;
            
            // Then current events
            if (aIsCurrent && !bIsCurrent) return -1;
            if (!aIsCurrent && bIsCurrent) return 1;
            
            // Finally by start time
            return aStart - bStart;
        });

        const eventsHtml = sortedEvents.slice(0, 5).map(event => {
            const startTime = new Date(event.start.dateTime || event.start.date);
            const endTime = new Date(event.end.dateTime || event.end.date);
            const isAllDay = !event.start.dateTime;
            
            let timeString;
            let eventClass = 'event-item';
            let statusText = '';
            
            if (isAllDay) {
                timeString = 'All day';
                eventClass += ' all-day-event';
                
                const today = new Date();
                const [year, month, day] = event.start.date.split('-').map(Number);
                const eventDate = new Date(year, month - 1, day);
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                
                const eventDateString = eventDate.toDateString();
                const todayString = today.toDateString();
                const tomorrowString = tomorrow.toDateString();
                
                if (eventDateString === todayString) {
                    eventClass += ' current-event';
                    statusText = '<div class="event-status">Today</div>';
                } else if (eventDateString === tomorrowString) {
                    statusText = '<div class="event-status tomorrow-status">Tomorrow</div>';
                }
            } else {
                const duration = Math.round((endTime - startTime) / (1000 * 60));
                const durationText = duration < 60 ? `${duration}m` : `${Math.round(duration / 60)}h ${duration % 60}m`;
                
                timeString = startTime.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                });
                
                if (now >= startTime && now <= endTime) {
                    eventClass += ' current-event';
                    const remainingTime = Math.round((endTime - now) / (1000 * 60));
                    const remainingText = remainingTime < 60 ? `${remainingTime}m left` : `${Math.round(remainingTime / 60)}h ${remainingTime % 60}m left`;
                    statusText = `<div class="event-status">${remainingText}</div>`;
                }
                
                timeString += ` (${durationText})`;
            }

            let locationHtml = '';
            if (event.location) {
                locationHtml = `<div class="event-location">📍 ${event.location}</div>`;
            }

            return `
                <div class="${eventClass}">
                    <div class="event-time">${timeString}</div>
                    <div class="event-title">${event.summary}</div>
                    ${statusText}
                    ${locationHtml}
                </div>
            `;
        }).join('');

        calendarContent.innerHTML = eventsHtml;
        this.adjustCalendarCardHeight(sortedEvents.length);
    }

    adjustCalendarCardHeight(eventCount) {
        const calendarCard = this.domCache.calendarCard;
        const calendarContent = this.domCache.calendarContent;
        
        if (eventCount === 0) {
            calendarCard.classList.add('collapsed');
            return;
        }
        
        calendarCard.classList.remove('collapsed');
        
        // Simplified height calculation
        calendarContent.style.maxHeight = 'none';
        calendarContent.style.overflowY = 'visible';
        calendarCard.style.height = 'auto';
        
        const actualContentHeight = calendarContent.scrollHeight;
        const headerHeight = 60;
        const padding = 32;
        const actualCardHeight = headerHeight + actualContentHeight + padding;
        
        const viewportHeight = window.innerHeight;
        const maxAllowedHeight = viewportHeight * 0.7;
        
        if (actualCardHeight > maxAllowedHeight) {
            calendarCard.style.height = `${maxAllowedHeight}px`;
            calendarContent.style.maxHeight = `${maxAllowedHeight - headerHeight - padding}px`;
            calendarContent.style.overflowY = 'auto';
        } else {
            calendarCard.style.height = 'auto';
            calendarContent.style.maxHeight = 'none';
            calendarContent.style.overflowY = 'visible';
        }
    }

    async loadPhotos() {
    const hour = new Date().getHours();

    let timeOfDay = 'afternoon'; // Default to afternoon if time-based loading is disabled

    if (hour >= 5 && hour < 8) {
        timeOfDay = 'earlyMorning';
    } else if (hour >= 8 && hour < 11
    ) {
        timeOfDay = 'morning';
    } else if (hour >= 11 && hour < 17) {
        timeOfDay = 'afternoon';
    } else if (hour >= 17 && hour < 20) {
        timeOfDay = 'evening';
    } else {
        timeOfDay = 'night';
    }

    const localPhotos = {
        earlyMorning: [
            { baseUrl: 'images/earlyMorning/m1.jpg' },
            { baseUrl: 'images/earlyMorning/m2.jpg' },
            { baseUrl: 'images/earlyMorning/m3.jpg' }
        ],
        morning: [
            { baseUrl: 'images/morning/m1.jpg' },
            { baseUrl: 'images/morning/m2.jpg' },
            { baseUrl: 'images/morning/m3.jpg' },
            { baseUrl: 'images/morning/m4.jpg' },
            { baseUrl: 'images/morning/m5.jpg' },
            { baseUrl: 'images/morning/m6.jpg' },
            { baseUrl: 'images/morning/m7.jpg' }
        ],
        afternoon: [
            { baseUrl: 'images/afternoon/a1.jpg' },
            { baseUrl: 'images/afternoon/a2.jpg' },
            { baseUrl: 'images/afternoon/a3.jpg' },
            { baseUrl: 'images/afternoon/a4.jpg' },
            { baseUrl: 'images/afternoon/a5.jpg' },
            { baseUrl: 'images/afternoon/a6.jpg' },
            { baseUrl: 'images/afternoon/a7.jpg' },
            { baseUrl: 'images/afternoon/a8.jpg' },
            { baseUrl: 'images/afternoon/a9.jpg' },
            { baseUrl: 'images/afternoon/a10.jpg' },
            { baseUrl: 'images/afternoon/a11.jpg' },
            { baseUrl: 'images/afternoon/a12.jpg' },
            { baseUrl: 'images/afternoon/a13.jpg' },
            { baseUrl: 'images/afternoon/a14.jpg' },
            { baseUrl: 'images/afternoon/a15.jpg' },
            { baseUrl: 'images/afternoon/a16.jpg' },
            { baseUrl: 'images/afternoon/a17.jpg' },
            { baseUrl: 'images/afternoon/a18.jpg' },
            { baseUrl: 'images/afternoon/a19.jpg' },
            { baseUrl: 'images/afternoon/a20.jpg' }
        ],
        evening: [
            { baseUrl: 'images/evening/e1.jpg' },
            { baseUrl: 'images/evening/e2.jpg' },
            { baseUrl: 'images/evening/e3.jpg' },
            { baseUrl: 'images/evening/e4.jpg' },
            { baseUrl: 'images/evening/e5.jpg' },
            { baseUrl: 'images/evening/e6.jpg' },
            { baseUrl: 'images/evening/e7.jpg' },
            { baseUrl: 'images/evening/e8.jpg' }

        ],
        night: [
            { baseUrl: 'images/night/n1.jpg' },
            { baseUrl: 'images/night/n2.jpg' },
            { baseUrl: 'images/night/n3.jpg' },
            { baseUrl: 'images/night/n4.jpg' },
            { baseUrl: 'images/night/n5.jpg' },
            // { baseUrl: 'images/night/n6.jpg' },
            { baseUrl: 'images/night/n7.jpg' },
            { baseUrl: 'images/night/n8.jpg' }
        ]
    };

    this.photos = localPhotos[timeOfDay] || [];
    this.currentPhotoIndex = 0;
    this.startPhotoSlideshow();
}

    startPhotoSlideshow() {
        if (this.photos.length === 0) return;

        const slideshowContainer = this.domCache.photoSlideshow;
        slideshowContainer.innerHTML = '';

        // Create photo slides with optimized loading
        this.photos.forEach((photo, index) => {
            const slide = document.createElement('div');
            slide.className = `photo-slide ${index === 0 ? 'active' : ''}`;
            
            // Use lower resolution for better performance
            const imageUrl = photo.baseUrl;
            slide.style.backgroundImage = `url(${imageUrl})`;
            
            // Add photographer attribution
            // if (photo.photographer && photo.photographerUrl) {
            //     const attribution = document.createElement('div');
            //     attribution.className = 'photo-attribution';
            //     attribution.innerHTML = `
            //         <a href="${photo.photographerUrl}" target="_blank" rel="noopener noreferrer">
            //             Photo by ${photo.photographer}
            //         </a>
            //     `;
            //     slide.appendChild(attribution);
            // }
            
            slideshowContainer.appendChild(slide);
        });

        // Start slideshow with longer interval for better performance
        const slideInterval = this.isLowPowerMode ? 120000 : 60000; // 2 minutes vs 1 minute
        this.photoInterval = setInterval(() => {
            this.nextPhoto();
        }, slideInterval);
    }

    nextPhoto() {
        if (this.photos.length === 0) return;

        const slides = document.querySelectorAll('.photo-slide');
        slides[this.currentPhotoIndex].classList.remove('active');
        
        this.currentPhotoIndex = (this.currentPhotoIndex + 1) % this.photos.length;
        slides[this.currentPhotoIndex].classList.add('active');
    }

    openSettings() {
        this.domCache.settingsModal.classList.add('active');
        this.populateSettingsForm();
        
        // Disable carousel navigation
        this.disableCarouselNavigation();
    }

    closeSettings() {
        this.domCache.settingsModal.classList.remove('active');
        
        // Re-enable carousel navigation
        this.enableCarouselNavigation();
    }

    populateSettingsForm() {
        document.getElementById('photoQuery').value = this.settings.photoQuery || 'nature landscape';
        document.getElementById('haUrl').value = this.settings.haUrl || '';
        document.getElementById('latitude').value = this.settings.latitude || '';
        document.getElementById('longitude').value = this.settings.longitude || '';
        document.getElementById('summaryEnabled').value = this.settings.summaryEnabled ? 'true' : 'false';
        document.getElementById('summaryTime').value = this.settings.summaryTime || '08:00';
        document.getElementById('userName').value = this.settings.userName || '';
    }

    saveSettings() {
        const newSettings = {
            photoQuery: document.getElementById('photoQuery').value,
            haUrl: document.getElementById('haUrl').value,
            latitude: parseFloat(document.getElementById('latitude').value),
            longitude: parseFloat(document.getElementById('longitude').value),
            summaryEnabled: document.getElementById('summaryEnabled').value === 'true',
            summaryTime: document.getElementById('summaryTime').value,
            userName: document.getElementById('userName').value
        };

        this.settings = { ...this.settings, ...newSettings };
        localStorage.setItem('smartDisplaySettings', JSON.stringify(this.settings));

        // Update Home Assistant iframe if URL changed
        if (newSettings.haUrl) {
            this.domCache.homeAssistantFrame.src = newSettings.haUrl;
        }

        // Reload data if settings changed
        if (newSettings.photoQuery) {
            this.loadPhotos();
        }
        if (newSettings.latitude && newSettings.longitude) {
            this.loadWeather();
        }

        // Reset summary shown flag if settings changed
        this.summaryShown = false;
        console.log('Settings saved, summary will show at:', this.settings.summaryTime);

        this.closeSettings();
    }

    async loadForecast() {
        try {
            if (!this.settings.latitude || !this.settings.longitude) {
                console.log('Weather coordinates not configured');
                return;
            }

            const response = await fetch(`/api/weather?lat=${this.settings.latitude}&lon=${this.settings.longitude}`);
            const weatherData = await response.json();

            if (weatherData.error) {
                console.error('Weather API error:', weatherData.error);
                return;
            }

            this.updateForecastDisplay(weatherData);
        } catch (error) {
            console.error('Error loading forecast:', error);
        }
    }

    updateForecastDisplay(weatherData) {
        const forecastContent = this.domCache.forecastContent;
        
        if (!weatherData.daily) {
            forecastContent.innerHTML = '<div class="loading">No forecast data available</div>';
            return;
        }

        const forecastHtml = weatherData.daily.time.slice(0, 5).map((date, index) => {
            let displayDate;
            if (index === 0) {
                displayDate = new Date();
            } else {
                displayDate = new Date();
                displayDate.setDate(displayDate.getDate() + index);
            }
            
            const dayName = displayDate.toLocaleDateString('en-US', { weekday: 'short' });
            const dayDate = displayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const weatherCode = weatherData.daily.weather_code[index] || 0;
            const maxTemp = Math.round(weatherData.daily.temperature_2m_max[index]);
            const minTemp = Math.round(weatherData.daily.temperature_2m_min[index]);
            
            const precipChance = weatherData.daily.precipitation_probability_max ? weatherData.daily.precipitation_probability_max[index] : 0;
            const windSpeed = weatherData.daily.wind_speed_10m_max ? Math.round(weatherData.daily.wind_speed_10m_max[index]) : 0;
            const windGust = weatherData.daily.wind_gusts_10m_max ? Math.round(weatherData.daily.wind_gusts_10m_max[index]) : 0;
            const iconClass = this.getWeatherIcon(weatherCode) || 'fa-cloud weather-cloudy';

            const uvIndex = weatherData.daily.uv_index_max ? weatherData.daily.uv_index_max[index] : 'N/A';
            const uvClass = this.getUVClass(uvIndex);
            
            return `
                <div class="forecast-day" onclick="smartDisplay.openHourlyForecast(${index})" style="cursor: pointer;">
                    <div>
                        <div class="forecast-day-name">${dayName}</div>
                        <div class="forecast-day-date">${dayDate}</div>
                        <div class="forecast-icon">
                            <i class="fas ${iconClass}"></i>
                        </div>
                        <div class="forecast-temps">
                            <div class="forecast-high">${maxTemp}°F</div>
                            <div class="forecast-low">${minTemp}°F</div>
                        </div>
                    </div>
                    <div class="forecast-details">
                        <div class="forecast-detail-item">
                            <span class="forecast-detail-label">Rain:</span> ${precipChance}%
                        </div>
                        <div class="forecast-detail-item">
                            <span class="forecast-detail-label">Wind:</span> ${this.getWindArrow(weatherData.hourly.wind_direction_10m ? weatherData.hourly.wind_direction_10m[index * 12] : 0)} ${windSpeed} mph
                        </div>
                        <div class="forecast-detail-item">
                            <span class="forecast-detail-label">Gusts:</span> ${windGust} mph
                        </div>
                        <div class="forecast-detail-item">
                            <span class="forecast-detail-label">UV:</span> <span class="${uvClass}">${uvIndex}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        forecastContent.innerHTML = forecastHtml;
    }

    async loadAgenda() {
        try {
            const response = await fetch('/api/calendar/agenda');
            const events = await response.json();

            this.updateAgendaDisplay(events);
        } catch (error) {
            console.error('Error loading agenda:', error);
            this.updateAgendaDisplay([]);
        }
    }

    updateAgendaDisplay(events) {
        const agendaContent = this.domCache.agendaContent;

        if (events.length === 0) {
            agendaContent.innerHTML = '<div class="loading">No upcoming events</div>';
            return;
        }

        // Group events by day
        const eventsByDay = {};
        events.forEach(event => {
            let dayKey;
            
            if (event.start.dateTime) {
                // For timed events, use the date from the datetime
                const startTime = new Date(event.start.dateTime);
                dayKey = startTime.toDateString();
            } else {
                // For all-day events, use the date directly and ensure it's parsed as local time
                const [year, month, day] = event.start.date.split('-').map(Number);
                const startDate = new Date(year, month - 1, day); // month is 0-indexed
                dayKey = startDate.toDateString();
            }
            
            if (!eventsByDay[dayKey]) {
                eventsByDay[dayKey] = [];
            }
            eventsByDay[dayKey].push(event);
        });

        // Sort days chronologically
        const sortedDays = Object.keys(eventsByDay).sort((a, b) => {
            return new Date(a) - new Date(b);
        });
        let agendaHtml = '';

        sortedDays.forEach(dayKey => {
            const dayDate = new Date(dayKey);
            const dayHeader = dayDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'short', 
                day: 'numeric' 
            });
            
            agendaHtml += `<div class="agenda-day-header">${dayHeader}</div>`;
            
            // Sort events within each day: all-day events first, then by start time
            const sortedEvents = eventsByDay[dayKey].sort((a, b) => {
                const aIsAllDay = !a.start.dateTime;
                const bIsAllDay = !b.start.dateTime;
                
                // All-day events first
                if (aIsAllDay && !bIsAllDay) return -1;
                if (!aIsAllDay && bIsAllDay) return 1;
                
                // Then by start time
                const aStart = new Date(a.start.dateTime || a.start.date);
                const bStart = new Date(b.start.dateTime || b.start.date);
                return aStart - bStart;
            });
            
            sortedEvents.forEach(event => {
                const startTime = new Date(event.start.dateTime || event.start.date);
                const endTime = new Date(event.end.dateTime || event.end.date);
                const isAllDay = !event.start.dateTime; // All-day events have date but no dateTime
                
                let timeString;
                let durationText;
                let eventClass = 'agenda-event';
                
                if (isAllDay) {
                    timeString = 'All day';
                    durationText = '';
                    eventClass += ' all-day-event';
                } else {
                    timeString = startTime.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                    });
                    
                    const duration = Math.round((endTime - startTime) / (1000 * 60));
                    durationText = duration < 60 ? `${duration}m` : `${Math.round(duration / 60)}h ${duration % 60}m`;
                }

                let locationHtml = '';
                if (event.location) {
                    locationHtml = `<div class="agenda-event-location">📍 ${event.location}</div>`;
                }

                agendaHtml += `
                    <div class="${eventClass}">
                        <div class="agenda-event-time">${timeString}</div>
                        <div class="agenda-event-title">${event.summary}</div>
                        ${durationText ? `<div class="agenda-event-duration">${durationText}</div>` : ''}
                        ${locationHtml}
                    </div>
                `;
            });
        });

        agendaContent.innerHTML = agendaHtml;
    }

    loadSettings() {
        const saved = localStorage.getItem('smartDisplaySettings');
        return saved ? JSON.parse(saved) : {
            photoQuery: 'nature landscape',
            haUrl: 'http://your-home-assistant-url:8123',
            latitude: 33.4255,
            longitude: -111.9400,
            summaryEnabled: true,
            summaryTime: '08:00',
            userName: ''
        };
    }
// if hourly summaries are enabled can re implement this...

    // checkHourlySummary() {
    //     if (!this.settings.summaryEnabled) return;
        
    //     const now = new Date();
    //     const currentHour = now.getHours();
        
    //     // Reset summaryShown flag every hour to allow showing summary again
    //     if (this.lastSummaryHour !== currentHour) {
    //         this.summaryShown = false;
    //         this.lastSummaryHour = currentHour;
    //         console.log('Hourly summary reset for new hour:', currentHour);
    //     }
        
    //     // Check if it's time to show the summary (every hour on the hour)
    //     if (now.getMinutes() === 0 && !this.summaryShown) {
    //         console.log('Auto-swiping to hourly summary at:', currentHour + ':00');
    //         this.showDailySummary();
    //     }
    // }

    showDailySummary() {
        this.summaryShown = true;
        this.goToCard(1); // Go to Daily Summary card
        this.loadSummary(true); // Force refresh for hourly updates
    }

    async loadSummary(forceRefresh = false) {
        try {
            const userName = this.settings.userName || '';
            const url = forceRefresh 
                ? `/api/summary?name=${encodeURIComponent(userName)}&refresh=true`
                : `/api/summary?name=${encodeURIComponent(userName)}`;
            
            const response = await fetch(url);
            const data = await response.json();
            
            this.updateSummaryDisplay(data);
        } catch (error) {
            console.error('Error loading summary:', error);
            this.updateSummaryDisplay({
                summary: "Sorry, I couldn't generate your daily summary right now.",
                timestamp: new Date().toISOString()
            });
        }
    }

    async refreshSummary() {
        try {
            // Show loading state
            const refreshBtn = document.getElementById('summaryRefreshBtn');
            const originalContent = refreshBtn.innerHTML;
            refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            refreshBtn.disabled = true;
            
            const userName = this.settings.userName || '';
            const response = await fetch(`/api/summary?name=${encodeURIComponent(userName)}&refresh=true`);
            const data = await response.json();
            
            this.updateSummaryDisplay(data);
            
            // Restore button state
            refreshBtn.innerHTML = originalContent;
            refreshBtn.disabled = false;
        } catch (error) {
            console.error('Error refreshing summary:', error);
            
            // Restore button state on error
            const refreshBtn = document.getElementById('summaryRefreshBtn');
            refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
            refreshBtn.disabled = false;
        }
    }

    updateSummaryDisplay(data) {
        const summaryContent = this.domCache.summaryContent;
        
        // Format the summary with highlights
        let formattedSummary = data.summary;
        
        // Add highlighting for events, weather, and tasks
        formattedSummary = formattedSummary
            .replace(/\*\*(.*?)\*\*/g, '<span class="highlight">$1</span>')
            .replace(/(\d{1,2}:\d{2}\s*(?:AM|PM).*?)/g, '<span class="event-highlight">$1</span>')
            .replace(/(All day.*?)/g, '<span class="event-highlight">$1</span>')
            .replace(/(\d+\.?\d*°F)/gi, '<span class="weather-highlight">$1</span>')
            .replace(/(humidity is at \d+%)/gi, '<span class="weather-highlight">$1</span>')
            .replace(/(temperature of \d+\.?\d*°F)/gi, '<span class="weather-highlight">$1</span>')
            .replace(/(\d+°F|sunny|cloudy|rainy|snow)/gi, '<span class="weather-highlight">$1</span>')
            .replace(/\n/g, '<br>');
        
        summaryContent.innerHTML = formattedSummary;
    }

    refreshPage() {
        // Close settings modal first
        this.closeSettings();
        
        // Show a brief loading message
        const loadingMsg = document.createElement('div');
        loadingMsg.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 20px;
            border-radius: 10px;
            z-index: 10000;
            font-size: 16px;
        `;
        loadingMsg.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Refreshing page...';
        document.body.appendChild(loadingMsg);
        
        // Refresh the page after a short delay
        setTimeout(() => {
            window.location.reload();
        }, 500);
    }

    openHourlyForecast(dayIndex) {
        const overlay = document.getElementById('hourlyForecastOverlay');
        const title = document.getElementById('hourlyForecastTitle');
        const grid = document.getElementById('hourlyForecastGrid');
        
        // Set title based on day
        const dayNames = ['Today', 'Tomorrow', 'Wednesday', 'Thursday', 'Friday'];
        title.textContent = `${dayNames[dayIndex]} - Hourly Forecast`;
        
        // Load hourly data for the selected day
        this.loadHourlyForecastData(dayIndex, grid);
        
        // Show overlay
        overlay.classList.add('active');
        
        // Disable carousel navigation
        this.disableCarouselNavigation();
    }

    closeHourlyForecast() {
        const overlay = document.getElementById('hourlyForecastOverlay');
        overlay.classList.remove('active');
        
        // Re-enable carousel navigation
        this.enableCarouselNavigation();
    }

    // blue light filter logic
    updateBlueLightFilter() {
    const overlay = this.domCache.blueLightOverlay;
    if (!overlay) return;

    const filterLevel = getBlueLightFilterLevel();

    if (filterLevel === 'strong') {
        overlay.style.background = 'rgba(255, 140, 0, 0.28)';
    } else if (filterLevel === 'medium') {
        overlay.style.background = 'rgba(255, 170, 60, 0.16)';
    } else {
        overlay.style.background = 'rgba(255, 140, 0, 0)';
    }
        }

    async loadHourlyForecastData(dayIndex, grid) {
        try {
            const response = await fetch(`/api/weather?lat=${this.settings.latitude}&lon=${this.settings.longitude}`);
            const weatherData = await response.json();
            
            if (!weatherData.hourly) {
                grid.innerHTML = '<div class="loading">No hourly data available</div>';
                return;
            }

            // Get the target date
            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() + dayIndex);
            const targetDateString = targetDate.toISOString().split('T')[0];

            // Filter hourly data for the target day
            const hourlyData = [];
            for (let i = 0; i < weatherData.hourly.time.length; i++) {
                const hourTime = new Date(weatherData.hourly.time[i]);
                const hourDateString = hourTime.toISOString().split('T')[0];
                
                if (hourDateString === targetDateString) {
                    hourlyData.push({
                        time: hourTime,
                        temperature: weatherData.hourly.temperature_2m[i],
                        weatherCode: weatherData.hourly.weather_code[i],
                        precipitation: weatherData.hourly.precipitation_probability[i],
                        uvIndex: weatherData.hourly.uv_index[i],
                        windSpeed: weatherData.hourly.wind_speed_10m[i],
                        windDirection: weatherData.hourly.wind_direction_10m[i]
                    });
                }
            }

            // Generate HTML for hourly forecast
            const hourlyHTML = hourlyData.map(hour => {
                const timeString = hour.time.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit', 
                    hour12: true 
                });
                
                const weatherIcon = this.getWeatherIcon(hour.weatherCode);
                const uvClass = this.getUVClass(hour.uvIndex);
                
                return `
                    <div class="hourly-forecast-item">
                        <div class="hourly-time">${timeString}</div>
                        <div class="hourly-temp">${Math.round(hour.temperature)}°F</div>
                        <div class="hourly-icon">
                            <i class="fas ${weatherIcon}"></i>
                        </div>
                        <div class="hourly-precip">${hour.precipitation}% rain</div>
                        <div class="hourly-uv ${uvClass}">UV: ${hour.uvIndex}</div>
                        <div class="hourly-wind">${Math.round(hour.windSpeed)} mph</div>
                    </div>
                `;
            }).join('');

            grid.innerHTML = hourlyHTML;

        } catch (error) {
            console.error('Error loading hourly forecast:', error);
            grid.innerHTML = '<div class="loading">Error loading hourly forecast</div>';
        }
    }

    getUVClass(uvIndex) {
        if (uvIndex <= 2) return 'uv-low';
        if (uvIndex <= 5) return 'uv-moderate';
        if (uvIndex <= 7) return 'uv-high';
        if (uvIndex <= 10) return 'uv-very-high';
        return 'uv-extreme';
    }

    disableCarouselNavigation() {
        // Disable touch areas
        this.domCache.leftTouchArea.style.pointerEvents = 'none';
        this.domCache.rightTouchArea.style.pointerEvents = 'none';
        
        // Disable keyboard navigation
        this.carouselNavigationDisabled = true;
        
        // Disable mouse/touch swipe events
        this.swipeEventsDisabled = true;
        
        // Disable body scrolling on Raspberry Pi
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
    }

    enableCarouselNavigation() {
        // Re-enable touch areas
        this.domCache.leftTouchArea.style.pointerEvents = 'auto';
        this.domCache.rightTouchArea.style.pointerEvents = 'auto';
        
        // Re-enable keyboard navigation
        this.carouselNavigationDisabled = false;
        
        // Re-enable mouse/touch swipe events
        this.swipeEventsDisabled = false;
        
        // Re-enable body scrolling on Raspberry Pi
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.Sbody.style.width = '';
    }
}

// Initialize the smart display when the page loads
let smartDisplay;
document.addEventListener('DOMContentLoaded', () => {
    smartDisplay = new SmartDisplay();


});
