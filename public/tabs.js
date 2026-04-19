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
                main: 'Next 3 days are open',
                sub: 'No events on the calendar',
                detail: 'Light schedule ahead'
            };
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const nextThreeDays = [];

        for (let i = 1; i <= 3; i++) {
            const day = new Date(today);
            day.setDate(day.getDate() + i);
            nextThreeDays.push(day);
        }

        const dayBuckets = nextThreeDays.map(day => {
            const dayString = day.toDateString();

            const dayEvents = events.filter(event => {
                const start = new Date(event.start.dateTime || event.start.date);
                return start.toDateString() === dayString;
            });

            return {
                date: day,
                events: dayEvents
            };
        });

        const totalEvents = dayBuckets.reduce((sum, day) => sum + day.events.length, 0);

        if (totalEvents === 0) {
            return {
                label: 'Schedule',
                icon: 'fa-calendar-day',
                main: 'Next 3 days are open',
                sub: 'No events on the calendar',
                detail: 'Light schedule ahead'
            };
        }

        const daySummary = dayBuckets.map(bucket => {
            const dayName = bucket.date.toLocaleDateString('en-US', { weekday: 'short' });
            return `${dayName} ${bucket.events.length}`;
        }).join(' • ');

        const firstBusyDay = dayBuckets.find(bucket => bucket.events.length > 0);

        let detail = 'Balanced schedule ahead';

        if (firstBusyDay) {
            const timedEvents = firstBusyDay.events
                .filter(event => event.start?.dateTime)
                .map(event => ({
                    title: event.summary || 'Event',
                    start: new Date(event.start.dateTime)
                }))
                .sort((a, b) => a.start - b.start);

            const dayName = firstBusyDay.date.toLocaleDateString('en-US', { weekday: 'long' });

            if (timedEvents.length) {
                const firstEvent = timedEvents[0];
                const firstTime = firstEvent.start.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit'
                });

                detail = `${dayName} starts with ${firstEvent.title} at ${firstTime}`;
            } else {
                detail = `${dayName} includes all-day events`;
            }
        }

        return {
            label: 'Schedule',
            icon: 'fa-calendar-day',
            main: `${totalEvents} event${totalEvents === 1 ? '' : 's'} in next 3 days`,
            sub: daySummary,
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

//////////////////////////////////////

//Commute logic 
window.TabHelpers = {
    ...window.TabHelpers,

    buildCommuteTab(commuteData) {
        if (!commuteData || commuteData.error) {
            return {
                label: 'Commute',
                icon: 'fa-road',
                main: 'Commute unavailable',
                sub: 'Check route settings',
                detail: 'No live route data'
            };
        }

        const minutes = Number(commuteData.durationMinutes);
        let detail = 'Typical drive time';
        let mainClass = 'brief-neutral';

        if (minutes <= 15) {
            detail = 'Quick drive right now';
            mainClass = 'brief-positive';
        } else if (minutes <= 30) {
            detail = 'Normal traffic conditions';
            mainClass = 'brief-neutral';
        } else {
            detail = 'Heavier commute than usual';
            mainClass = 'brief-negative';
        }

        return {
            label: 'Commute',
            icon: 'fa-road',
            main: `${minutes} min`,
            sub: `${commuteData.distanceMiles} mi drive`,
            detail,
            mainClass
        };
    }
};

//////////////////////////////////////

// Markets and Crypto Logic

window.TabHelpers = {
    ...window.TabHelpers,

buildMarketsTab(marketData) {
    if (!marketData || !marketData.length) {
        return {
            label: 'Markets',
            icon: 'fa-chart-line',
            main: 'Market data unavailable',
            sub: 'Check API settings',
            detail: 'No live stock data'
        };
    }

    const cleaned = marketData.filter(item =>
        item &&
        item.symbol &&
        item.changePercent
    );

    if (!cleaned.length) {
        return {
            label: 'Markets',
            icon: 'fa-chart-line',
            main: 'Market data unavailable',
            sub: 'No usable symbols returned',
            detail: 'API returned empty values'
        };
    }

    const formatted = cleaned.map(item => {
        const rawPercent = String(item.changePercent).replace('%', '');
        const numericPercent = Number(rawPercent);
        const roundedPercent = numericPercent.toFixed(1);
        const signedPercent = numericPercent > 0
            ? `+${roundedPercent}%`
            : `${roundedPercent}%`;

        return {
            symbol: item.symbol,
            percent: signedPercent,
            numericPercent
        };
    });

    const main = formatted
        .slice(0, 3)
        .map(item => `${item.symbol} ${item.percent}`)
        .join(' • ');

    const sub = `${formatted.length} market symbol${formatted.length === 1 ? '' : 's'} tracked`;

    const avgMove = formatted.reduce((sum, item) => sum + item.numericPercent, 0) / formatted.length;

    let detail = 'Mixed session across your watchlist';
    let detailClass = 'brief-neutral';

    if (avgMove > 0.15) {
        detail = 'Watchlist is mostly positive';
        detailClass = 'brief-positive';
    } else if (avgMove < -0.15) {
        detail = 'Watchlist is mostly negative';
        detailClass = 'brief-negative';
    }

    return {
        label: 'Markets',
        icon: 'fa-chart-line',
        main,
        sub,
        detail,
        mainClass: avgMove > 0.15 ? 'brief-positive' : avgMove < -0.15 ? 'brief-negative' : 'brief-neutral',
        detailClass
    };
},

    buildCryptoTab(cryptoData) {
        if (!cryptoData || !cryptoData.length) {
            return {
                label: 'Crypto',
                icon: 'fa-bitcoin-sign',
                main: 'Crypto unavailable',
                sub: 'Check API settings',
                detail: 'No live crypto data'
            };
        }

        const nameMap = {
            bitcoin: 'BTC',
            ethereum: 'ETH',
            solana: 'SOL'
        };

        const cleaned = cryptoData.filter(item => item && item.price != null);

        if (!cleaned.length) {
            return {
                label: 'Crypto',
                icon: 'fa-bitcoin-sign',
                main: 'Crypto unavailable',
                sub: 'No usable coin data',
                detail: 'API returned empty values'
            };
        }

        const top = cleaned[0];
        const summary = cleaned
            .slice(0, 3)
            .map(item => {
                const symbol = nameMap[item.id] || item.id.toUpperCase();
                const price = `$${Number(item.price).toLocaleString(undefined, {
                    maximumFractionDigits: 0
                })}`;
                return `${symbol} ${price}`;
            })
            .join(' • ');

        const topSymbol = nameMap[top.id] || top.id.toUpperCase();
        const topPrice = `$${Number(top.price).toLocaleString(undefined, {
            maximumFractionDigits: 0
        })}`;

        const move = typeof top.change24h === 'number' ? top.change24h : 0;

        return {
            label: 'Crypto',
            icon: 'fa-bitcoin-sign',
            main: `${topSymbol} ${topPrice}`,
            sub: summary,
            detail: `${topSymbol} ${move >= 0 ? '+' : ''}${move.toFixed(1)}% over 24h`,
            detailClass: move > 0 ? 'brief-positive' : move < 0 ? 'brief-negative' : 'brief-neutral'
        };
    }
};

////////////////////////////////
/// News tab logic

window.TabHelpers = {
    ...window.TabHelpers,

    buildNewsTab(newsData) {
        if (!newsData || !newsData.length) {
            return {
                label: 'News',
                icon: 'fa-newspaper',
                main: 'News unavailable',
                sub: 'Check API settings',
                detail: 'No live headlines'
            };
        }

        const cleaned = newsData.filter(item => item && item.title);

        if (!cleaned.length) {
            return {
                label: 'News',
                icon: 'fa-newspaper',
                main: 'News unavailable',
                sub: 'No usable headlines returned',
                detail: 'Try again later'
            };
        }

        const shorten = (text, max = 60) => {
            if (!text) return '';
            return text.length > max
                ? text.slice(0, max).trim() + '...'
                : text;
        };

        const headline1 = cleaned[0]
            ? `${cleaned[0].category}: ${shorten(cleaned[0].title, 65)}`
            : 'No headline available';

        const headline2 = cleaned[1]
            ? `${cleaned[1].category}: ${shorten(cleaned[1].title, 55)}`
            : 'More headlines loading';

        const headline3 = cleaned[2]
            ? `${cleaned[2].category}: ${shorten(cleaned[2].title, 55)}`
            : 'Top stories updated';

        return {
            label: 'News',
            icon: 'fa-newspaper',
            main: headline1,
            sub: headline2,
            detail: headline3
        };
    }
};