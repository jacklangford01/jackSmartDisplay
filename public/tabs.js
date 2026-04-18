///weather logic 

window.TabHelpers = {
    buildWeatherTab(weatherData, getWeatherDescription) {
        if (!weatherData || !weatherData.daily || !weatherData.current) {
            return {
                label: 'Weather',
                icon: 'fa-sun',
                main: '--',
                sub: 'Weather unavailable',
                detail: 'Check connection'
            };
        }

        const high = Math.round(weatherData.daily.temperature_2m_max?.[0] ?? 0);
        const low = Math.round(weatherData.daily.temperature_2m_min?.[0] ?? 0);
        const weatherCode = weatherData.daily.weather_code?.[0] ?? 0;
        const uvMax = Math.round(weatherData.daily.uv_index_max?.[0] ?? 0);
        const rainChance = Math.round(weatherData.daily.precipitation_probability_max?.[0] ?? 0);
        const windMax = Math.round(weatherData.daily.wind_speed_10m_max?.[0] ?? 0);

        const desc = getWeatherDescription(weatherCode);

        let sub = desc;
        if (high >= 100) {
            sub = `${desc} and very hot later`;
        } else if (high >= 90) {
            sub = `${desc} and hot later`;
        } else if (rainChance >= 40) {
            sub = `${desc} with a chance of rain`;
        }

        let detail = 'Nice weather through the day';
        if (uvMax >= 8) {
            detail = 'UV very high this afternoon';
        } else if (rainChance >= 50) {
            detail = `${rainChance}% chance of rain today`;
        } else if (windMax >= 20) {
            detail = `Breezy later with gusts near ${windMax} mph`;
        } else if (low <= 45) {
            detail = 'Cool start before warming up';
        }

        return {
            label: 'Weather',
            icon: 'fa-sun',
            main: `${high}° / ${low}°`,
            sub,
            detail
        };
    },

    applyLiveWeatherTab(tabSet, liveWeatherTab) {
        if (!tabSet || !tabSet.tabs || !liveWeatherTab) return tabSet;

        const updatedTabs = [...tabSet.tabs];
        const weatherIndex = updatedTabs.findIndex(tab => tab.label === 'Weather');

        if (weatherIndex !== -1) {
            updatedTabs[weatherIndex] = liveWeatherTab;
        }

        return {
            ...tabSet,
            tabs: updatedTabs
        };
    }
};

//////////////////////////////////////////////////////////////////
//Calendar logic

window.TabHelpers = {
    ...window.TabHelpers,

    buildNextUpTab(events) {
        if (!events || !events.length) {
            return {
                label: 'Next Up',
                icon: 'fa-hourglass-half',
                main: 'No more events today',
                sub: 'Calendar is clear',
                detail: 'Nothing upcoming'
            };
        }

        const now = new Date();

        const timedEvents = events
            .filter(event => event.start?.dateTime)
            .map(event => ({
                title: event.summary || 'Event',
                start: new Date(event.start.dateTime),
                end: new Date(event.end.dateTime),
                location: event.location || ''
            }))
            .sort((a, b) => a.start - b.start);

        const currentEvent = timedEvents.find(event => now >= event.start && now <= event.end);
        const nextEvent = timedEvents.find(event => event.start > now);

        if (currentEvent) {
            const endText = currentEvent.end.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit'
            });

            return {
                label: 'Next Up',
                icon: 'fa-hourglass-half',
                main: `Now: ${currentEvent.title}`,
                sub: `Ends at ${endText}`,
                detail: currentEvent.location ? currentEvent.location : 'Currently in progress'
            };
        }

        if (nextEvent) {
            const startText = nextEvent.start.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit'
            });

            const minsAway = Math.round((nextEvent.start - now) / (1000 * 60));
            const awayText = minsAway < 60
                ? `Starts in ${minsAway} min`
                : `Starts in ${Math.floor(minsAway / 60)}h ${minsAway % 60}m`;

            return {
                label: 'Next Up',
                icon: 'fa-hourglass-half',
                main: nextEvent.title,
                sub: `${startText} • ${awayText}`,
                detail: nextEvent.location ? nextEvent.location : 'Upcoming event'
            };
        }

        return {
            label: 'Next Up',
            icon: 'fa-hourglass-half',
            main: 'No timed events left',
            sub: 'Rest of the day is open',
            detail: 'Nothing upcoming'
        };
    },

    buildMorningScheduleTab(events) {
        if (!events || !events.length) {
            return {
                label: 'Schedule',
                icon: 'fa-calendar-day',
                main: 'No events today',
                sub: 'Calendar is clear',
                detail: 'Open schedule'
            };
        }

        const now = new Date();
        const todayString = now.toDateString();

        const todaysEvents = events.filter(event => {
            const start = new Date(event.start.dateTime || event.start.date);
            return start.toDateString() === todayString;
        });

        const timedEvents = todaysEvents
            .filter(event => event.start?.dateTime)
            .map(event => ({
                title: event.summary || 'Event',
                start: new Date(event.start.dateTime),
                end: new Date(event.end.dateTime)
            }))
            .sort((a, b) => a.start - b.start);

        const count = todaysEvents.length;

        let sub = 'Calendar is clear';
        if (todaysEvents.length) {
            sub = todaysEvents
                .slice(0, 3)
                .map(event => event.summary || 'Event')
                .join(' • ');
        }

        let detail = 'No large free blocks found';

        if (timedEvents.length === 0) {
            detail = 'Only all-day events today';
        } else if (timedEvents.length === 1) {
            const startText = timedEvents[0].start.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit'
            });
            detail = `First event starts at ${startText}`;
        } else {
            let bestGap = 0;
            let bestStart = null;
            let bestEnd = null;

            for (let i = 0; i < timedEvents.length - 1; i++) {
                const gap = timedEvents[i + 1].start - timedEvents[i].end;
                if (gap > bestGap) {
                    bestGap = gap;
                    bestStart = timedEvents[i].end;
                    bestEnd = timedEvents[i + 1].start;
                }
            }

            if (bestStart && bestEnd && bestGap >= 30 * 60 * 1000) {
                const startText = bestStart.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit'
                });
                const endText = bestEnd.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit'
                });
                detail = `Free from ${startText} to ${endText}`;
            }
        }

        return {
            label: 'Schedule',
            icon: 'fa-calendar-day',
            main: `${count} event${count === 1 ? '' : 's'} today`,
            sub,
            detail
        };
    },

    buildEveningScheduleTab(events) {
        if (!events || !events.length) {
            return {
                label: 'Schedule',
                icon: 'fa-calendar-day',
                main: 'Tomorrow is open',
                sub: 'No early events scheduled',
                detail: 'Good window for focused work'
            };
        }

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowString = tomorrow.toDateString();

        const tomorrowEvents = events.filter(event => {
            const start = new Date(event.start.dateTime || event.start.date);
            return start.toDateString() === tomorrowString;
        });

        if (!tomorrowEvents.length) {
            return {
                label: 'Schedule',
                icon: 'fa-calendar-day',
                main: 'Tomorrow is open',
                sub: 'No events on the calendar',
                detail: 'Good window for focused work'
            };
        }

        const timedTomorrow = tomorrowEvents
            .filter(event => event.start?.dateTime)
            .map(event => ({
                title: event.summary || 'Event',
                start: new Date(event.start.dateTime),
                end: new Date(event.end.dateTime)
            }))
            .sort((a, b) => a.start - b.start);

        let main = `${tomorrowEvents.length} event${tomorrowEvents.length === 1 ? '' : 's'} tomorrow`;
        let sub = 'Tomorrow is taking shape';
        let detail = tomorrowEvents
            .slice(0, 2)
            .map(event => event.summary || 'Event')
            .join(' • ');

        if (timedTomorrow.length) {
            const first = timedTomorrow[0];
            const firstText = first.start.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit'
            });

            main = `Tomorrow starts at ${firstText}`;
            sub = `${tomorrowEvents.length} event${tomorrowEvents.length === 1 ? '' : 's'} on deck`;
            detail = first.title;
        }

        return {
            label: 'Schedule',
            icon: 'fa-calendar-day',
            main,
            sub,
            detail
        };
    },

    applyLiveCalendarTabs(tabSet, liveTabs) {
        if (!tabSet || !tabSet.tabs || !liveTabs) return tabSet;

        const updatedTabs = [...tabSet.tabs];

        Object.entries(liveTabs).forEach(([label, value]) => {
            if (!value) return;
            const index = updatedTabs.findIndex(tab => tab.label === label);
            if (index !== -1) {
                updatedTabs[index] = value;
            }
        });

        return {
            ...tabSet,
            tabs: updatedTabs
        };
    }
};

window.TabHelpers = {
    ...window.TabHelpers,

    buildTomorrowTab(events) {
        if (!events || !events.length) {
            return {
                label: 'Tomorrow',
                icon: 'fa-calendar-check',
                main: 'Tomorrow is open',
                sub: 'No scheduled events',
                detail: 'Good window for focused work'
            };
        }

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowString = tomorrow.toDateString();

        const tomorrowEvents = events.filter(event => {
            const start = new Date(event.start.dateTime || event.start.date);
            return start.toDateString() === tomorrowString;
        });

        if (!tomorrowEvents.length) {
            return {
                label: 'Tomorrow',
                icon: 'fa-calendar-check',
                main: 'Tomorrow is open',
                sub: 'No scheduled events',
                detail: 'Good window for focused work'
            };
        }

        const timedEvents = tomorrowEvents
            .filter(event => event.start?.dateTime)
            .map(event => ({
                title: event.summary || 'Event',
                start: new Date(event.start.dateTime)
            }))
            .sort((a, b) => a.start - b.start);

        const count = tomorrowEvents.length;

        let main = `${count} event${count === 1 ? '' : 's'} tomorrow`;
        let sub = tomorrowEvents
            .slice(0, 2)
            .map(event => event.summary || 'Event')
            .join(' • ');
        let detail = 'Plan ahead tonight if needed';

        if (timedEvents.length) {
            const first = timedEvents[0];
            const firstText = first.start.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit'
            });

            sub = `First starts at ${firstText}`;
            detail = tomorrowEvents
                .slice(0, 3)
                .map(event => event.summary || 'Event')
                .join(' • ');
        }

        return {
            label: 'Tomorrow',
            icon: 'fa-calendar-check',
            main,
            sub,
            detail
        };
    }
};