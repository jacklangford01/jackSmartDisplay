const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const {authenticate} = require('@google-cloud/local-auth');
const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'client_secret.json');

const CALENDAR_IDS = [
  'jacklangford2004@gmail.com',
  'mnlp6igj0d72t8pptd6c8ugqr8@group.calendar.google.com', //asu football
  '3d4ea3a2d8ad36b882e2117f5eb3daaaee1f387d72414c3e58c1f87b76aa3dbc@group.calendar.google.com', //class times
  '7077c87cf42a0c80ecf5c5cb10538d1270f325d7e26632f05df23ab4adfc64aa@group.calendar.google.com', //tours
  'eeb57182e3aa63eb09c90261b6217a018d0987ae6e3a82c24ff3c4ec1a2228eb@group.calendar.google.com', //another asu football
  'os6gk16ljlrju1vl8f211tdr6g@group.calendar.google.com', //personal life
  '6q7hv3e427q7qr8i6re4al86f0@group.calendar.google.com' //school work

];

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

/**
 * Serializes credentials to a file compatible with GoogleAuth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

/**
 * Lists the next 10 events on the user's primary calendar.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
async function listEvents(auth) {
  const calendar = google.calendar({ version: 'v3', auth });

  const responses = await Promise.all(
    CALENDAR_IDS.map(calendarId =>
      calendar.events.list({
        calendarId,
        timeMin: new Date().toISOString(),
        maxResults: 10,
        singleEvents: true,
        orderBy: 'startTime',
      }).catch(error => {
        console.error(`Error fetching calendar ${calendarId}:`, error.message);
        return { data: { items: [] } };
      })
    )
  );

  const allEvents = responses.flatMap(response => response.data.items || []);

  const uniqueEvents = allEvents.filter(
    (event, index, self) =>
      index === self.findIndex(e =>
        e.id === event.id &&
        (e.start?.dateTime || e.start?.date) === (event.start?.dateTime || event.start?.date)
      )
  );

  uniqueEvents.sort((a, b) => {
    const aStart = new Date(a.start.dateTime || a.start.date);
    const bStart = new Date(b.start.dateTime || b.start.date);
    return aStart - bStart;
  });

  if (!uniqueEvents.length) {
    console.log('No upcoming events found.');
    return;
  }

  console.log('Upcoming events from selected calendars:');
  uniqueEvents.slice(0, 20).forEach(event => {
    const start = event.start.dateTime || event.start.date;
    console.log(`${start} - ${event.summary}`);
  });
}

console.log('🔐 Setting up Google Calendar OAuth2 authentication...');
console.log('📝 This will open a browser window for authorization');
console.log('💡 After authorization, token.json will be created for your smart display');

authorize().then(listEvents).catch(console.error);

