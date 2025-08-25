const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Mock API endpoints for testing
app.get('/api/photos/:albumId', (req, res) => {
  // Return mock photo data
  res.json({
    mediaItems: [
      {
        id: '1',
        baseUrl: 'https://picsum.photos/1920/1080?random=1',
        filename: 'photo1.jpg'
      },
      {
        id: '2',
        baseUrl: 'https://picsum.photos/1920/1080?random=2',
        filename: 'photo2.jpg'
      },
      {
        id: '3',
        baseUrl: 'https://picsum.photos/1920/1080?random=3',
        filename: 'photo3.jpg'
      }
    ]
  });
});

app.get('/api/calendar/events', (req, res) => {
  // Return mock calendar events
  res.json([
    {
      summary: 'Team Meeting',
      start: {
        dateTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
      }
    },
    {
      summary: 'Lunch with Client',
      start: {
        dateTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()
      }
    }
  ]);
});

app.get('/api/calendar/agenda', (req, res) => {
  // Return mock calendar agenda for next week
  const now = new Date();
  res.json([
    {
      summary: 'Morning Standup',
      start: {
        dateTime: new Date(now.getTime() + 30 * 60 * 1000).toISOString()
      },
      end: {
        dateTime: new Date(now.getTime() + 60 * 60 * 1000).toISOString()
      }
    },
    {
      summary: 'Team Meeting',
      start: {
        dateTime: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString()
      },
      end: {
        dateTime: new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString()
      }
    },
    {
      summary: 'Lunch with Client',
      start: {
        dateTime: new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString()
      },
      end: {
        dateTime: new Date(now.getTime() + 5 * 60 * 60 * 1000).toISOString()
      }
    },
    {
      summary: 'Project Review',
      start: {
        dateTime: new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString()
      },
      end: {
        dateTime: new Date(now.getTime() + 7 * 60 * 60 * 1000).toISOString()
      }
    },
    {
      summary: 'Weekly Planning',
      start: {
        dateTime: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
      },
      end: {
        dateTime: new Date(now.getTime() + 25 * 60 * 60 * 1000).toISOString()
      }
    },
    {
      summary: 'Client Presentation',
      start: {
        dateTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      end: {
        dateTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString()
      }
    },
    {
      summary: 'Team Building',
      start: {
        dateTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      end: {
        dateTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString()
      }
    },
    {
      summary: 'Product Launch',
      start: {
        dateTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      end: {
        dateTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString()
      }
    }
  ]);
});

app.get('/api/weather', (req, res) => {
  // Return mock OpenMeteo weather data in Fahrenheit with additional details
  res.json({
    current: {
      temperature_2m: 72.5,
      weather_code: 0,
      relative_humidity_2m: 65,
      wind_speed_10m: 8.5,
      wind_direction_10m: 180,
      wind_gusts_10m: 12.3
    },
          daily: {
        time: [
          new Date().toISOString().split('T')[0],
          new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        ],
        weather_code: [0, 1, 2, 3, 0],
        temperature_2m_max: [78, 75, 72, 68, 74],
        temperature_2m_min: [62, 58, 55, 52, 60],
        precipitation_probability_max: [5, 15, 45, 80, 10],
        wind_speed_10m_max: [12, 8, 15, 20, 6],
        wind_gusts_10m_max: [18, 12, 22, 28, 10],
        wind_direction_10m_max: [180, 225, 270, 315, 90]
      },
    hourly: {
      time: [
        new Date().toISOString(),
        new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
        new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()
      ],
      precipitation_probability: [5, 10, 15, 20, 25]
    }
  });
});

app.listen(PORT, () => {
  console.log(`✅ Smart Display test server running on port ${PORT}`);
  console.log(`🌐 Open http://localhost:${PORT} in your browser`);
  console.log(`📝 This is a test version with mock data`);
});
