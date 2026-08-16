"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WeatherTriggerAgent = void 0;
const BaseAgent_1 = require("./BaseAgent");
const LAS_VEGAS_ZIPS = [
    { zip: '89101', lat: 36.1699, lon: -115.1398, name: 'Downtown Las Vegas' },
    { zip: '89102', lat: 36.1513, lon: -115.2046, name: 'West Las Vegas' },
    { zip: '89103', lat: 36.1147, lon: -115.1929, name: 'Paradise' },
    { zip: '89104', lat: 36.1520, lon: -115.1372, name: 'East Las Vegas' },
    { zip: '89108', lat: 36.2046, lon: -115.2251, name: 'Centennial Hills' },
    { zip: '89109', lat: 36.1215, lon: -115.1739, name: 'The Strip' },
    { zip: '89113', lat: 36.0679, lon: -115.2234, name: 'Southwest LV' },
    { zip: '89117', lat: 36.1408, lon: -115.2754, name: 'Spring Valley' },
    { zip: '89118', lat: 36.0807, lon: -115.2130, name: 'Enterprise' },
    { zip: '89128', lat: 36.2183, lon: -115.2560, name: 'Summerlin North' },
    { zip: '89129', lat: 36.2397, lon: -115.2792, name: 'Summerlin West' },
    { zip: '89130', lat: 36.2539, lon: -115.2331, name: 'Summerlin South' },
    { zip: '89131', lat: 36.3031, lon: -115.2674, name: 'Centennial' },
    { zip: '89134', lat: 36.1960, lon: -115.3231, name: 'Summerlin' },
    { zip: '89135', lat: 36.1373, lon: -115.3521, name: 'Summerlin South' },
    { zip: '89138', lat: 36.1747, lon: -115.3452, name: 'Summerlin' },
    { zip: '89139', lat: 36.0261, lon: -115.2057, name: 'Southern Highlands' },
    { zip: '89141', lat: 35.9874, lon: -115.1821, name: 'Anthem' },
    { zip: '89144', lat: 36.1687, lon: -115.2872, name: 'Summerlin' },
    { zip: '89145', lat: 36.1631, lon: -115.2584, name: 'Summerlin East' },
    { zip: '89147', lat: 36.1150, lon: -115.2794, name: 'Spring Valley' },
    { zip: '89148', lat: 36.0946, lon: -115.2988, name: 'Spring Valley' },
    { zip: '89149', lat: 36.2652, lon: -115.2590, name: 'Centennial' },
    { zip: '89166', lat: 36.3246, lon: -115.2843, name: 'Skye Canyon' },
    { zip: '89178', lat: 36.0564, lon: -115.2457, name: 'Enterprise' },
    { zip: '89179', lat: 36.0140, lon: -115.2316, name: 'Enterprise' },
    { zip: '89183', lat: 35.9807, lon: -115.1856, name: 'Southern Highlands' },
    { zip: '89030', lat: 36.1989, lon: -115.1175, name: 'North Las Vegas' },
    { zip: '89031', lat: 36.2369, lon: -115.1522, name: 'North Las Vegas' },
    { zip: '89032', lat: 36.2183, lon: -115.1648, name: 'North Las Vegas' },
    { zip: '89044', lat: 35.9679, lon: -115.1007, name: 'Henderson' },
    { zip: '89052', lat: 36.0100, lon: -115.1375, name: 'Henderson' },
    { zip: '89074', lat: 36.0395, lon: -115.0549, name: 'Henderson' },
    { zip: '89011', lat: 36.0726, lon: -114.9242, name: 'Henderson' },
    { zip: '89012', lat: 36.0049, lon: -115.0392, name: 'Henderson' },
    { zip: '89014', lat: 36.0561, lon: -115.0415, name: 'Henderson' },
    { zip: '89015', lat: 36.0294, lon: -114.9721, name: 'Henderson' },
];

class WeatherTriggerAgent extends BaseAgent_1.BaseAgent {
    constructor() {
        super(...arguments);
        this.slug = 'weather-trigger';
        this.name = 'Weather Trigger Agent';
        this.category = 'monitoring';
        this.defaultSchedule = '*/15 * * * *';
        this.apiKey = process.env.OPENWEATHER_API_KEY || '';
        const customZips = process.env.TARGET_ZIPS;
        this.targetZips = customZips
            ? LAS_VEGAS_ZIPS.filter(z => customZips.includes(z.zip))
            : LAS_VEGAS_ZIPS;
    }

    async execute(context) {
        if (!this.apiKey) {
            console.warn('[WeatherTriggerAgent] No OPENWEATHER_API_KEY found. Running in DEMO mode.');
            return this.generateDemoLeads();
        }
        const leads = [];
        const now = new Date();
        const batchSize = 10;
        const hour = now.getHours();
        const batchIndex = hour % Math.ceil(this.targetZips.length / batchSize);
        const batch = this.targetZips.slice(batchIndex * batchSize, (batchIndex + 1) * batchSize);
        for (const zip of batch) {
            try {
                const weather = await this.fetchWeather(zip.lat, zip.lon);
                const zipLeads = this.analyzeWeather(weather, zip);
                leads.push(...zipLeads);
            } catch (err) {
                console.error(`[WeatherTriggerAgent] Failed for ${zip.zip}:`, err);
            }
        }
        return leads;
    }

    async fetchWeather(lat, lon) {
        const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly&units=imperial&appid=${this.apiKey}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`OpenWeather API error: ${res.status}`);
        return res.json();
    }

    analyzeWeather(data, zipInfo) {
        const leads = [];
        const temp = data.current?.temp;
        const windSpeed = data.current?.wind?.speed || 0;
        const windGust = data.current?.wind?.gust || 0;
        const weatherMain = data.current?.weather?.[0]?.main || '';
        if (temp >= 105) {
            leads.push({
                firstName: 'Homeowner', lastName: `${zipInfo.zip}`,
                email: `lead+heat-${zipInfo.zip}@getonlypros.com`, phone: '',
                serviceType: 'HVAC / Air Conditioning', zipCode: zipInfo.zip,
                address: `${zipInfo.name}`,
                city: zipInfo.name.includes('Henderson') ? 'Henderson' : 'Las Vegas',
                state: 'NV', budget: 6500, urgency: 'high', timeline: 'asap',
                notes: `EXTREME HEAT ALERT: ${Math.round(temp)}°F recorded in ${zipInfo.name} (${zipInfo.zip}). AC systems are failing under sustained load. Peak summer demand. Emergency repair and replacement leads expected to spike.`,
                sourceDetail: `Weather trigger: Extreme heat ${Math.round(temp)}°F ${zipInfo.name}`,
            });
        }
        if (temp >= 100 && temp < 105) {
            leads.push({
                firstName: 'Homeowner', lastName: `${zipInfo.zip}`,
                email: `lead+heatwave-${zipInfo.zip}@getonlypros.com`, phone: '',
                serviceType: 'HVAC / Air Conditioning', zipCode: zipInfo.zip,
                address: `${zipInfo.name}`,
                city: zipInfo.name.includes('Henderson') ? 'Henderson' : 'Las Vegas',
                state: 'NV', budget: 5200, urgency: 'high', timeline: '1-2_weeks',
                notes: `HEAT WAVE: ${Math.round(temp)}°F in ${zipInfo.name} (${zipInfo.zip}). Preventative maintenance and system tune-ups urgently needed. Older units (10+ years) at high risk of failure.`,
                sourceDetail: `Weather trigger: Heat wave ${Math.round(temp)}°F ${zipInfo.name}`,
            });
        }
        if (windGust >= 40 || windSpeed >= 35) {
            leads.push({
                firstName: 'Homeowner', lastName: `${zipInfo.zip}`,
                email: `lead+wind-${zipInfo.zip}@getonlypros.com`, phone: '',
                serviceType: 'HVAC / Air Conditioning', zipCode: zipInfo.zip,
                address: `${zipInfo.name}`,
                city: zipInfo.name.includes('Henderson') ? 'Henderson' : 'Las Vegas',
                state: 'NV', budget: 3800, urgency: 'high', timeline: 'asap',
                notes: `DUST STORM / HIGH WIND: ${Math.round(windGust || windSpeed)}mph gusts in ${zipInfo.name} (${zipInfo.zip}). HVAC filters completely clogged. Outdoor condensers coated in fine dust.`,
                sourceDetail: `Weather trigger: Dust storm ${Math.round(windGust || windSpeed)}mph ${zipInfo.name}`,
            });
            leads.push({
                firstName: 'Homeowner', lastName: `${zipInfo.zip}`,
                email: `lead+roof-${zipInfo.zip}@getonlypros.com`, phone: '',
                serviceType: 'Roofing', zipCode: zipInfo.zip,
                address: `${zipInfo.name}`,
                city: zipInfo.name.includes('Henderson') ? 'Henderson' : 'Las Vegas',
                state: 'NV', budget: 12000, urgency: 'high', timeline: '1-2_weeks',
                notes: `HIGH WIND DAMAGE: ${Math.round(windGust || windSpeed)}mph gusts in ${zipInfo.name} (${zipInfo.zip}). Shingle displacement and flashing damage likely. Roof inspection recommended for homes 15+ years old.`,
                sourceDetail: `Weather trigger: Wind damage ${Math.round(windGust || windSpeed)}mph ${zipInfo.name}`,
            });
        }
        if (weatherMain.toLowerCase().includes('rain') || weatherMain.toLowerCase().includes('thunder')) {
            leads.push({
                firstName: 'Homeowner', lastName: `${zipInfo.zip}`,
                email: `lead+flood-${zipInfo.zip}@getonlypros.com`, phone: '',
                serviceType: 'Water Damage Restoration', zipCode: zipInfo.zip,
                address: `${zipInfo.name}`,
                city: zipInfo.name.includes('Henderson') ? 'Henderson' : 'Las Vegas',
                state: 'NV', budget: 7500, urgency: 'emergency', timeline: 'asap',
                notes: `MONSOON / FLASH FLOOD: Heavy rainfall detected in ${zipInfo.name} (${zipInfo.zip}). Standing water and roof leak risks elevated. Mold growth can start within 24-48 hours.`,
                sourceDetail: `Weather trigger: Monsoon rain ${zipInfo.name}`,
            });
        }
        if (data.alerts && data.alerts.length > 0) {
            for (const alert of data.alerts) {
                const alertEvent = alert.event.toLowerCase();
                if (alertEvent.includes('heat')) {
                    leads.push({
                        firstName: 'Homeowner', lastName: `${zipInfo.zip}`,
                        email: `lead+alert-${zipInfo.zip}@getonlypros.com`, phone: '',
                        serviceType: 'HVAC / Air Conditioning', zipCode: zipInfo.zip,
                        address: `${zipInfo.name}`,
                        city: zipInfo.name.includes('Henderson') ? 'Henderson' : 'Las Vegas',
                        state: 'NV', budget: 6800, urgency: 'emergency', timeline: 'asap',
                        notes: `NWS HEAT ALERT: "${alert.event}" issued for ${zipInfo.name} (${zipInfo.zip}). ${alert.description.substring(0, 200)}. AC failure risk extreme for elderly residents and homes with old systems.`,
                        sourceDetail: `Weather trigger: NWS alert ${alert.event} ${zipInfo.name}`,
                    });
                }
            }
        }
        return leads;
    }

    generateDemoLeads() {
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-US');
        return [
            { firstName: 'Robert', lastName: 'Ramirez', email: 'robert.ramirez@gmail.com', phone: '702-784-2310', serviceType: 'HVAC / Air Conditioning', zipCode: '89135', address: '9601 Summerlin Pkwy', city: 'Las Vegas', state: 'NV', budget: 9500, urgency: 'emergency', timeline: 'asap', notes: `EXTREME HEAT WAVE: 114°F peak in Summerlin on ${dateStr}. AC compressor failed at 2pm. Home has elderly resident. 23 emergency calls logged in zip 89135 today.`, sourceDetail: 'Weather trigger - extreme heat 114°F Summerlin (DEMO MODE)' },
            { firstName: 'Michelle', lastName: 'Gonzalez', email: 'michelle.gonzalez@gmail.com', phone: '702-901-3456', serviceType: 'Water Damage Restoration', zipCode: '89052', address: '2600 Green Valley Pkwy', city: 'Henderson', state: 'NV', budget: 8500, urgency: 'emergency', timeline: 'asap', notes: `MONSOON FLASH FLOOD: 1.3 inches rain in 45 minutes on ${dateStr}. Backyard flooded into home. Standing water in garage and laundry room. Mold risk within 24 hours.`, sourceDetail: 'Weather trigger - monsoon flash flood Anthem (DEMO MODE)' },
            { firstName: 'Kevin', lastName: 'Walker', email: 'kevin.walker@gmail.com', phone: '702-112-5567', serviceType: 'HVAC / Air Conditioning', zipCode: '89178', address: '645 Blue Diamond Rd', city: 'Las Vegas', state: 'NV', budget: 6800, urgency: 'high', timeline: 'asap', notes: `HABOOB DUST STORM: 55mph winds with wall of dust on ${dateStr}. HVAC filter completely clogged. Outdoor condenser coated in fine dust.`, sourceDetail: 'Weather trigger - haboob dust storm Enterprise (DEMO MODE)' },
            { firstName: 'Lisa', lastName: 'Hernandez', email: 'lisa.hernandez@gmail.com', phone: '702-445-8890', serviceType: 'Roofing', zipCode: '89074', address: '201 Pecos Rd', city: 'Henderson', state: 'NV', budget: 12000, urgency: 'high', timeline: '1-2_weeks', notes: `HAIL STORM: Golf ball-sized hail reported in Green Valley on ${dateStr}. Multiple broken roof tiles and dented flashing. 12 homes on street need inspection.`, sourceDetail: 'Weather trigger - hail storm Green Valley (DEMO MODE)' },
            { firstName: 'Daniel', lastName: 'Clark', email: 'daniel.clark@gmail.com', phone: '702-667-1123', serviceType: 'HVAC / Air Conditioning', zipCode: '89117', address: '20660 Charleston Blvd', city: 'Las Vegas', state: 'NV', budget: 8500, urgency: 'high', timeline: 'asap', notes: `FIRST 100°F DAY: Spring Valley hit 101°F on ${dateStr}. 15-year-old AC unit cannot maintain set temp. Compressor cycling constantly.`, sourceDetail: 'Weather trigger - first 100°F day Spring Valley (DEMO MODE)' },
            { firstName: 'Amanda', lastName: 'Torres', email: 'amanda.torres@gmail.com', phone: '702-889-3344', serviceType: 'Pool Service & Repair', zipCode: '89144', address: '4450 Hualapai Way', city: 'Las Vegas', state: 'NV', budget: 4200, urgency: 'high', timeline: 'asap', notes: `SUSTAINED HEAT (9 days 108°F+): Pool pump overheated and seized on ${dateStr}. Water turning green in 103°F heat. Summerlin master planned community.`, sourceDetail: 'Weather trigger - sustained heat pool failure Summerlin (DEMO MODE)' },
        ];
    }
}

exports.WeatherTriggerAgent = WeatherTriggerAgent;
