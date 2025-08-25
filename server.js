const express = require('express');
const path = require('path');
const cors = require('cors');
const { google } = require('googleapis');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Google APIs setup (for calendar and tasks)
let calendar = null;
let tasks = null;

// Gemini AI setup
let gemini = null;
if (process.env.GEMINI_API_KEY) {
    gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    console.log('✅ Google Gemini AI initialized successfully');
} else {
    console.log('⚠️ Gemini API key not found');
}

try {
  const fs = require('fs');
  const path = require('path');
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const tokenPath = path.join(process.cwd(), 'token.json');
  
  if (credentialsPath && fs.existsSync(credentialsPath)) {
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    
    // Check if it's OAuth2 credentials (has installed or web property)
    if (credentials.installed || credentials.web) {
      // Load saved token if it exists
      let auth = null;
      if (fs.existsSync(tokenPath)) {
        try {
          const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
          auth = google.auth.fromJSON(token);
          console.log('✅ Loaded existing OAuth2 token');
        } catch (error) {
          console.log('⚠️ Failed to load existing token, will need re-authentication');
        }
      }
      
      if (!auth) {
        // For server environment, we'll use fallback since OAuth2 requires browser interaction
        console.log('⚠️ OAuth2 requires browser interaction for initial setup');
        console.log('📝 Using fallback mock calendar data');
        console.log('💡 To enable real Google Calendar:');
        console.log('   1. Run the OAuth2 setup locally with browser access');
        console.log('   2. Copy the generated token.json to your server');
      } else {
        calendar = google.calendar({ version: 'v3', auth });
        tasks = google.tasks({ version: 'v1', auth });
        console.log('✅ Google Calendar API initialized successfully with OAuth2');
        console.log('✅ Google Tasks API initialized successfully with OAuth2');
      }
    } else {
      console.log('⚠️ Credentials file is not OAuth2 format (missing installed/web property)');
      console.log('📝 Using fallback mock calendar data');
    }
  } else {
    console.log('⚠️ Google credentials file not found');
    console.log('📝 Using fallback mock calendar data');
  }
} catch (error) {
  console.log('⚠️ Google Calendar API initialization failed:', error.message);
  console.log('📝 Using fallback mock calendar data');
}

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Unsplash API endpoint for nature photos
app.get('/api/photos/:query?', async (req, res) => {
  try {
    const query = req.params.query || 'nature landscape';
    const unsplashAccessKey = process.env.UNSPLASH_ACCESS_KEY;
    const unsplashSecretKey = process.env.UNSPLASH_SECRET_KEY;
    
    if (!unsplashAccessKey) {
      // Fallback to mock data if no API key
      return res.json({
        mediaItems: [
          {
            id: '1',
            baseUrl: 'https://picsum.photos/1920/1080?random=1',
            filename: 'nature1.jpg',
            photographer: 'Unsplash',
            photographerUrl: 'https://unsplash.com'
          },
          {
            id: '2',
            baseUrl: 'https://picsum.photos/1920/1080?random=2',
            filename: 'nature2.jpg',
            photographer: 'Unsplash',
            photographerUrl: 'https://unsplash.com'
          },
          {
            id: '3',
            baseUrl: 'https://picsum.photos/1920/1080?random=3',
            filename: 'nature3.jpg',
            photographer: 'Unsplash',
            photographerUrl: 'https://unsplash.com'
          }
        ]
      });
    }
    
    const response = await axios.get(`https://api.unsplash.com/search/photos`, {
      params: {
        query: query,
        per_page: 20,
        orientation: 'landscape'
      },
      headers: {
        'Authorization': `Client-ID ${unsplashAccessKey}`
      }
    });
    
    const photos = response.data.results.map((photo, index) => ({
      id: photo.id,
      baseUrl: photo.urls.regular,
      filename: `nature${index + 1}.jpg`,
      photographer: photo.user.name,
      photographerUrl: photo.user.links.html
    }));
    
    res.json({ mediaItems: photos });
  } catch (error) {
    console.error('Error fetching photos:', error);
    res.status(500).json({ error: 'Failed to fetch photos' });
  }
});

// Google Calendar API endpoint
app.get('/api/calendar/events', async (req, res) => {
  try {
    // Check if Google Calendar API is available
    if (!calendar) {
      console.log('No Google Calendar API available, returning empty calendar data');
      return res.json([]);
    }

    const now = new Date();
    
    // For all-day events, we need to include today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    
    // Fetch events for the next 24 hours from now, but include all-day events for today
    const endTime = new Date(now.getTime() + (24 * 60 * 60 * 1000)); // 24 hours from now
    
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: today.toISOString(), // Start from beginning of today to catch all-day events
      timeMax: endTime.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 15
    });
    
    res.json(response.data.items || []);
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    // Return empty array on error to prevent hallucination
    res.json([]);
  }
});

// Google Tasks API endpoint
app.get('/api/tasks', async (req, res) => {
  try {
    if (!tasks) {
      console.log('No Google Tasks API available, returning empty tasks data');
      return res.json([]);
    }

    const response = await tasks.tasklists.list();
    const taskLists = response.data.items || [];
    
    if (taskLists.length === 0) {
      return res.json([]);
    }

    // Get tasks from the first task list (usually "My Tasks")
    const taskListId = taskLists[0].id;
    const tasksResponse = await tasks.tasks.list({
      tasklist: taskListId,
      showCompleted: false,
      maxResults: 20
    });

    const taskItems = tasksResponse.data.items || [];
    const formattedTasks = taskItems.map(task => ({
      title: task.title,
      notes: task.notes || '',
      due: task.due || null
    }));

    res.json(formattedTasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.json([]);
  }
});

// Google Calendar API endpoint for next week (agenda view)
app.get('/api/calendar/agenda', async (req, res) => {
  try {
    // Check if Google Calendar API is available
    if (!calendar) {
      console.log('No Google Calendar API available, returning mock agenda data');
      const mockEvents = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(Date.now() + i * 24 * 60 * 60 * 1000);
        mockEvents.push({
          id: `mock${i + 1}`,
          summary: `Event ${i + 1}`,
          start: { dateTime: new Date(date.getTime() + 9 * 60 * 60 * 1000).toISOString() },
          end: { dateTime: new Date(date.getTime() + 10 * 60 * 60 * 1000).toISOString() }
        });
      }
      return res.json(mockEvents);
    }

    const now = new Date();
    const endTime = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000)); // Next 7 days
    
    // For all-day events, we need to use date-based filtering
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: today.toISOString(),
      timeMax: endTime.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 50
    });
    
    res.json(response.data.items || []);
  } catch (error) {
    console.error('Error fetching calendar agenda:', error);
    // Return mock data on error
    const mockEvents = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(Date.now() + i * 24 * 60 * 60 * 1000);
      mockEvents.push({
        id: `mock${i + 1}`,
        summary: `Event ${i + 1}`,
        start: { dateTime: new Date(date.getTime() + 9 * 60 * 60 * 1000).toISOString() },
        end: { dateTime: new Date(date.getTime() + 10 * 60 * 60 * 1000).toISOString() }
      });
    }
    res.json(mockEvents);
  }
});

// Weather API endpoint (using OpenMeteo)
app.get('/api/weather', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index&hourly=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m,wind_direction_10m,precipitation_probability,wind_gusts_10m,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max,uv_index_max&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America/New_York`
    );
    
    const weatherData = await response.json();
    res.json(weatherData);
  } catch (error) {
    console.error('Error fetching weather:', error);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

// Cache for hourly summary to avoid repeated API calls
let summaryCache = null;
let summaryCacheHour = null;

// Hourly Summary API endpoint using Gemini AI
app.get('/api/summary', async (req, res) => {
  try {
    // Check cache first - generate once per hour, unless refresh is requested
    const cacheHour = new Date().getHours();
    const isRefreshRequest = req.query.refresh;
    
    // Clear cache if refresh is requested
    if (isRefreshRequest) {
      summaryCache = null;
      summaryCacheHour = null;
    }
    
    if (!isRefreshRequest && summaryCache && summaryCacheHour === cacheHour) {
      return res.json(summaryCache);
    }

    if (!gemini) {
      const fallbackSummary = {
        summary: "Hourly summary is not available. Please configure Gemini API key.",
        timestamp: new Date().toISOString()
      };
      summaryCache = fallbackSummary;
      summaryCacheHour = cacheHour;
      return res.json(fallbackSummary);
    }

    // Fetch all data sources with timeout
    const timeout = 10000; // 10 second timeout
    const [weatherResponse, hourlyWeatherResponse, calendarResponse] = await Promise.allSettled([
      Promise.race([
        axios.get(`http://localhost:${PORT}/api/weather?lat=${process.env.LATITUDE || '40.7128'}&lon=${process.env.LONGITUDE || '-74.0060'}`),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Weather timeout')), timeout))
      ]),
      Promise.race([
        axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${process.env.LATITUDE || '40.7128'}&longitude=${process.env.LONGITUDE || '-74.0060'}&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,wind_speed_10m,wind_direction_10m,uv_index&temperature_unit=fahrenheit&timezone=auto`),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Hourly weather timeout')), timeout))
      ]),
      Promise.race([
        axios.get(`http://localhost:${PORT}/api/calendar/events`),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Calendar timeout')), timeout))
      ])
    ]);

    // Skip tasks API for now due to permission issues
    const tasksResponse = { status: 'rejected', reason: new Error('Tasks API not available') };

    // Prepare data for AI
    const weatherData = weatherResponse.status === 'fulfilled' ? weatherResponse.value.data : null;
    const hourlyWeatherData = hourlyWeatherResponse.status === 'fulfilled' ? hourlyWeatherResponse.value.data : null;
    const calendarData = calendarResponse.status === 'fulfilled' ? calendarResponse.value.data : [];
    const tasksData = tasksResponse.status === 'fulfilled' ? tasksResponse.value.data : [];

    // Get current time context
    const now = new Date();
    const currentHour = now.getHours();
    const timeOfDay = currentHour < 12 ? 'morning' : currentHour < 17 ? 'afternoon' : 'evening';
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;

    // Helper function to ensure temperature is in Fahrenheit
    const ensureFahrenheit = (temp) => {
      // If temperature seems like Celsius (below 50), convert it
      if (temp < 50) {
        return Math.round((temp * 9/5) + 32);
      }
      return Math.round(temp);
    };
    
    // Format data for AI prompt
    let dataSummary = '';
    
    if (weatherData && hourlyWeatherData) {
      const current = weatherData.current;
      const daily = weatherData.daily;
      const hourly = hourlyWeatherData.hourly;
      
      // Find current hour index
      const currentHourIndex = hourly.time.findIndex(time => {
        const hourTime = new Date(time);
        return hourTime.getHours() === currentHour;
      });
      
      // Get next few hours for context
      const nextHours = [];
      for (let i = 1; i <= 6; i++) {
        const nextIndex = currentHourIndex + i;
        if (nextIndex < hourly.time.length) {
          const nextTime = new Date(hourly.time[nextIndex]);
          const nextHour = nextTime.getHours();
          const nextTemp = ensureFahrenheit(hourly.temperature_2m[nextIndex]);
          const nextPrecip = hourly.precipitation_probability[nextIndex];
          const nextWeather = hourly.weather_code[nextIndex];
          nextHours.push({
            hour: nextHour,
            temp: nextTemp,
            precip: nextPrecip,
            weather: nextWeather
          });
        }
      }
      
      dataSummary += `Current Time Context: It's currently ${timeOfDay} (${currentHour}:00). ${isWeekend ? 'It\'s the weekend, so you might have more flexibility in your schedule.' : 'It\'s a weekday, so you\'re likely in the middle of your work routine.'} `;
      
      dataSummary += `Weather: Current temperature ${ensureFahrenheit(current.temperature_2m)}°F, humidity ${current.relative_humidity_2m}%, wind speed ${current.wind_speed_10m} mph, wind direction ${current.wind_direction_10m}°, wind gusts ${current.wind_gusts_10m} mph, UV index ${current.uv_index || 'N/A'}. Today's forecast: High ${ensureFahrenheit(daily.temperature_2m_max[0])}°F, Low ${ensureFahrenheit(daily.temperature_2m_min[0])}°F, max wind speed ${daily.wind_speed_10m_max[0]} mph, max wind gusts ${daily.wind_gusts_10m_max[0]} mph, precipitation probability ${daily.precipitation_probability_max[0]}%, max UV index ${daily.uv_index_max ? daily.uv_index_max[0] : 'N/A'}. `;
      
      // Add hourly forecast context
      if (nextHours.length > 0) {
        dataSummary += `Next few hours: `;
        nextHours.forEach((hour, index) => {
          const hourLabel = hour.hour === 0 ? 'midnight' : hour.hour === 12 ? 'noon' : hour.hour > 12 ? `${hour.hour - 12} PM` : `${hour.hour} AM`;
          dataSummary += `${hourLabel} will be ${hour.temp}°F with ${hour.precip}% chance of rain`;
          if (index < nextHours.length - 1) dataSummary += ', ';
        });
        dataSummary += '. ';
      }
    }
    
    if (calendarData && calendarData.length > 0) {
      // Validate and filter calendar events to prevent hallucination
      const validEvents = calendarData.filter(event => {
        // Ensure event has required properties
        if (!event || !event.summary || !event.start) {
          return false;
        }
        
        // Validate event summary is not empty or suspicious
        const summary = event.summary.trim();
        if (!summary || summary.length < 1 || summary.length > 200) {
          return false;
        }
        
        // Check for suspicious patterns that might indicate mock data
        const suspiciousPatterns = ['mock', 'test', 'example', 'sample', 'placeholder'];
        if (suspiciousPatterns.some(pattern => summary.toLowerCase().includes(pattern))) {
          return false;
        }
        
        // Validate start date
        try {
          const start = new Date(event.start.dateTime || event.start.date);
          if (isNaN(start.getTime())) {
            return false;
          }
          
          // Only include events within reasonable time range (past 24 hours to next 7 days)
          const now = new Date();
          const past24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          const next7days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          
          if (start < past24h || start > next7days) {
            return false;
          }
          
          return true;
        } catch (error) {
          return false;
        }
      });
      
      if (validEvents.length > 0) {
        console.log('Valid calendar events being sent to Gemini:', validEvents.length);
        dataSummary += `Calendar Events: ${validEvents.map(event => {
          const start = new Date(event.start.dateTime || event.start.date);
          const time = event.start.dateTime ? start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'All day';
          return `${time} - ${event.summary}`;
        }).join(', ')}. `;
      } else {
        console.log('No valid calendar events found, sending empty calendar data to Gemini');
        dataSummary += `Calendar Events: No upcoming events scheduled. `;
      }
    } else {
      dataSummary += `Calendar Events: No upcoming events scheduled. `;
    }
    
    if (tasksData && tasksData.length > 0) {
      // Validate and filter tasks to prevent hallucination
      const validTasks = tasksData.filter(task => {
        // Ensure task has required properties
        if (!task || !task.title) {
          return false;
        }
        
        // Validate task title is not empty or suspicious
        const title = task.title.trim();
        if (!title || title.length < 1 || title.length > 200) {
          return false;
        }
        
        // Check for suspicious patterns that might indicate mock data
        const suspiciousPatterns = ['mock', 'test', 'example', 'sample', 'placeholder'];
        if (suspiciousPatterns.some(pattern => title.toLowerCase().includes(pattern))) {
          return false;
        }
        
        return true;
      });
      
      if (validTasks.length > 0) {
        console.log('Valid tasks being sent to Gemini:', validTasks.length);
        dataSummary += `Tasks: ${validTasks.map(task => task.title).join(', ')}. `;
      } else {
        console.log('No valid tasks found, sending empty tasks data to Gemini');
        dataSummary += `Tasks: No pending tasks. `;
      }
    } else {
      dataSummary += `Tasks: No pending tasks. `;
    }

    // Get user name from query parameter or use default
    const userName = req.query.name || 'there';
    
    // Create AI prompt
    const prompt = `You are a warm, friendly, and conversational AI assistant. Given the following detailed weather and schedule information, create a natural, engaging overview that feels like a friend checking in. Be contextual about the time of day and make the language feel natural and human.

Data: ${dataSummary}

IMPORTANT: Generate ONLY the HTML content without any markdown code blocks, backticks, or formatting wrappers. Return pure HTML that can be directly inserted into a webpage.

Context Guidelines:
- Reference the time of day naturally (morning, afternoon, evening)
- Mention how the weather will affect the rest of the day
- Be conversational and warm, not robotic
- Consider if it's a weekday or weekend
- Highlight any precipitation or weather changes coming up
- Make clothing recommendations feel natural and helpful
- Include UV index information and sun protection recommendations when relevant
- IMPORTANT: Only mention calendar events that are explicitly provided in the data
- Do NOT create or invent any calendar events that are not in the provided data
- If no calendar events are provided, simply state "No upcoming events scheduled" or similar

For wind analysis:
- Clothing: Consider wind chill, precipitation, and temperature to recommend appropriate layers (light jacket for 5-15 mph, heavier jacket for 15+ mph, windbreaker for gusty conditions, rain gear if precipitation expected)
- Be proactive and suggest things to do based on the weather and events and the weather forecast. (ie: tell user to apply sunscreen if it's sunny and warm or reschedule an outdoor activity if it's going to rain)
- Sailing: Assess suitability based on wind speed (5-15 mph: good, 15-25 mph: fun and thrilling, 25+ mph: not recommended) and gust conditions

Please provide a natural, conversational summary with the following HTML structure and formatting:

1. **Introduction Header**: Use <h1> tags for the greeting and weather introduction
   - Start with: <h1>Hey [userName],</h1> (use the exact name "${userName}" if provided, otherwise use "there")
   - Follow with detailed weather info in <h1> tags: <h1>The day is shaping up to be [weather description], with a current temperature of <span class="weather-highlight">[current temp]°F</span> (High: <span class="weather-highlight">[high]°F</span>, Low: <span class="weather-highlight">[low]°F</span>). Humidity is at <span class="weather-highlight">[humidity]%</span> with winds from the [wind direction] at <span class="weather-highlight">[wind speed] mph</span> and gusts up to <span class="weather-highlight">[wind gusts] mph</span>.</h1>

2. **Wind Analysis Section**: Add a brief wind analysis after the weather info
   - Use <h2> for header: <h2>Wind Analysis:</h2>
   - Include clothing recommendations based on wind, temperature, and precipitation conditions
   - Assess sailing suitability based on wind speed and gusts
   - Format as: <p>For clothing: [clothing advice based on wind, temperature, and precipitation]. For sailing: [sailing assessment - suitable/not suitable/conditions].</p>

3. **Events Section**: 
   - Use <h2> for section headers: <h2>Today's Events:</h2> and <h2>Tomorrow's Events:</h2>
   - Separate today's and tomorrow's events clearly
   - Use proper HTML bullet points with <ul> and <li> tags
   - Format each event as: <li><strong>[time]</strong> : [event name]</li>
   - For all-day events use: <li><strong>All day</strong> : [event name]</li>

4. **Reminders Section**:
   - Use <h2> for header: <h2>A couple of reminders to keep in mind:</h2>
   - Use <ul> and <li> tags for bullet points
   - Format as: <li><strong>[reminder text]</strong></li>

5. **Daily Affirmation**: Add a motivational daily affirmation
   - Use <h2> for header: <h2 class="daily-affirmation">Daily Affirmation:</h2>
   - Include an inspiring, positive message that fits the day's context
   - Format as: <h3>[inspiring affirmation message]</h3>


Example structure (return exactly like this, no code blocks):
<h1>Hey Tim,</h1>
<h1>Good morning! It's shaping up to be a beautiful day with a current temperature of <span class="weather-highlight">67.4°F</span> (High: <span class="weather-highlight">72°F</span>, Low: <span class="weather-highlight">58°F</span>). The humidity is at <span class="weather-highlight">79%</span> with gentle winds from the northeast at <span class="weather-highlight">8 mph</span> and gusts up to <span class="weather-highlight">15 mph</span>. Perfect weather for getting outside!</h1>

<h2>Wind Analysis:</h2>
<p>For clothing: A light jacket should keep you comfortable with these gentle breezes. For sailing: Great conditions with steady 8 mph winds and manageable 15 mph gusts - perfect for a relaxing sail!</p>

<h2>Today's Events:</h2>
<ul>
<li><strong>All day</strong> : Test</li>
<li><strong>1:00 AM</strong> : Test #1</li>
<li><strong>12:00 PM</strong> : Brunch</li>
</ul>

<h2>Tomorrow's Events:</h2>
<ul>
<li><strong>All day</strong> : Bowdoin Move in</li>
</ul>

<h2>A couple of reminders to keep in mind:</h2>
<ul>
<li><strong>Don't forget to take a moment to enjoy this beautiful weather!</strong></li>
<li><strong>Stay hydrated and energized for your day ahead.</strong></li>
</ul>

<h2 class="daily-affirmation">Daily Affirmation:</h2>
<h3>Embrace the gentle energy of this morning and let it carry you through whatever challenges come your way today.</h3>

Keep the tone warm, friendly, and conversational while maintaining a clean, modern feel. Use the actual user name provided, not placeholder text. Make the daily affirmation inspiring and relevant to the day's weather and events. Be natural and contextual about the time of day and weather conditions. Return ONLY the HTML content without any markdown formatting or code blocks. If you feel like there is something additional to add, add it.`;

    // Generate summary using Gemini with timeout
    const model = gemini.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    const result = await Promise.race([
      model.generateContent(prompt),
      new Promise((_, reject) => setTimeout(() => reject(new Error('AI generation timeout')), 15000))
    ]);
    const response = await result.response;
    const summary = response.text();

    const summaryData = {
      summary: summary,
      timestamp: new Date().toISOString(),
      data: {
        weather: weatherData ? 'Available' : 'Not available',
        calendar: calendarData.length,
        tasks: tasksData.length
      }
    };

    // Cache the result for the hour
    summaryCache = summaryData;
    summaryCacheHour = cacheHour;

    res.json(summaryData);

  } catch (error) {
    console.error('Error generating daily summary:', error);
    
    // Return cached data if available, otherwise fallback
    if (summaryCache) {
      return res.json({
        ...summaryCache,
        note: 'Using cached data due to error'
      });
    }
    
    const fallbackSummary = {
      summary: "Sorry, I couldn't generate your daily summary right now. Please try again later.",
      timestamp: new Date().toISOString(),
      error: error.message
    };
    
    summaryCache = fallbackSummary;
    summaryCacheHour = cacheHour;
    
    res.status(500).json(fallbackSummary);
  }
});

app.listen(PORT, () => {
  console.log(`Smart Display server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
});
