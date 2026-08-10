"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDatabase = seedDatabase;
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = require("../models/User");
const Contractor_1 = require("../models/Contractor");
const Lead_1 = require("../models/Lead");
const Review_1 = require("../models/Review");
const Earning_1 = require("../models/Earning");
const Activity_1 = require("../models/Activity");
dotenv_1.default.config();
const SERVICES = [
    'Plumbing',
    'Electrical',
    'HVAC',
    'Roofing',
    'Carpentry',
    'Painting',
    'Landscaping',
    'Flooring',
    'Masonry',
    'General Contracting',
    'Window Installation',
    'Deck Building',
];
const FIRST_NAMES = [
    'James',
    'Maria',
    'Robert',
    'Jennifer',
    'Michael',
    'Linda',
    'William',
    'Patricia',
    'David',
    'Elizabeth',
    'Richard',
    'Susan',
    'Joseph',
    'Jessica',
    'Thomas',
    'Sarah',
    'Charles',
    'Karen',
    'Daniel',
    'Nancy',
    'Matthew',
    'Lisa',
    'Anthony',
    'Margaret',
    'Mark',
    'Betty',
    'Donald',
    'Sandra',
    'Steven',
    'Ashley',
];
const LAST_NAMES = [
    'Smith',
    'Johnson',
    'Williams',
    'Brown',
    'Jones',
    'Garcia',
    'Miller',
    'Davis',
    'Rodriguez',
    'Martinez',
    'Hernandez',
    'Lopez',
    'Gonzalez',
    'Wilson',
    'Anderson',
    'Thomas',
    'Taylor',
    'Moore',
    'Jackson',
    'Martin',
];
const CITIES = [
    'Austin',
    'Dallas',
    'Houston',
    'San Antonio',
    'Fort Worth',
    'El Paso',
    'Arlington',
    'Corpus Christi',
    'Plano',
    'Laredo',
    'Lubbock',
    'Garland',
    'Irving',
    'Amarillo',
    'Grand Prairie',
];
const URGENCIES = ['Emergency', 'High', 'Medium', 'Low'];
function randomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randomFloat(min, max) {
    return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}
function randomDate(daysBack = 180) {
    const now = new Date();
    const past = new Date();
    past.setDate(now.getDate() - randomInt(1, daysBack));
    return past;
}
function randomSubset(arr, min, max) {
    const count = randomInt(min, max);
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}
async function seedUsers() {
    console.log('Creating users...');
    await User_1.User.deleteMany({});
    const users = [];
    const hashedPassword = await bcryptjs_1.default.hash('Password123!', 12);
    users.push({
        email: 'admin@getonlypros.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        phone: '555-0100',
        zipCode: '78701',
        type: 'admin',
        createdAt: randomDate(30),
    });
    const contractorEmails = [
        'john@mastersplumbing.com',
        'sarah@eliteelectrical.com',
        'mike@texashvac.com',
        'emily@sturdyroofing.com',
        'david@precisioncarpentry.com',
        'lisa@perfectpainting.com',
        'robert@greenlandscaping.com',
        'jennifer@premiumflooring.com',
    ];
    contractorEmails.forEach((email, i) => {
        users.push({
            email,
            password: hashedPassword,
            firstName: randomElement(FIRST_NAMES),
            lastName: randomElement(LAST_NAMES),
            phone: `555-${String(randomInt(1000, 9999)).padStart(4, '0')}`,
            zipCode: String(randomInt(75000, 79999)),
            type: 'contractor',
            createdAt: randomDate(120),
        });
    });
    for (let i = 0; i < 12; i++) {
        const firstName = randomElement(FIRST_NAMES);
        const lastName = randomElement(LAST_NAMES);
        users.push({
            email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@email.com`,
            password: hashedPassword,
            firstName,
            lastName,
            phone: `555-${String(randomInt(1000, 9999)).padStart(4, '0')}`,
            zipCode: String(randomInt(75000, 79999)),
            type: 'homeowner',
            createdAt: randomDate(90),
        });
    }
    const createdUsers = await User_1.User.insertMany(users);
    console.log(`  Created ${createdUsers.length} users`);
    return createdUsers.map((u) => u._id);
}
async function seedContractors(userIds) {
    console.log('Creating contractors...');
    await Contractor_1.Contractor.deleteMany({});
    const contractorData = [
        {
            companyName: "Master's Plumbing Solutions",
            services: ['Plumbing', 'Drain Cleaning', 'Water Heater Installation'],
            serviceRadius: 30,
            licenseNumber: 'PLB-2015-78432',
            hasInsurance: true,
            yearsInBusiness: 12,
            status: 'active',
        },
        {
            companyName: 'Elite Electrical Services',
            services: ['Electrical', 'EV Charger Installation', 'Panel Upgrades'],
            serviceRadius: 25,
            licenseNumber: 'ELE-2018-45123',
            hasInsurance: true,
            yearsInBusiness: 8,
            status: 'active',
        },
        {
            companyName: 'Texas HVAC Experts',
            services: ['HVAC', 'Duct Cleaning', 'AC Repair'],
            serviceRadius: 40,
            licenseNumber: 'HVAC-2012-98765',
            hasInsurance: true,
            yearsInBusiness: 15,
            status: 'active',
        },
        {
            companyName: 'Sturdy Roofing Co.',
            services: ['Roofing', 'Gutter Installation', 'Roof Inspection'],
            serviceRadius: 35,
            licenseNumber: 'ROF-2020-32145',
            hasInsurance: true,
            yearsInBusiness: 5,
            status: 'active',
        },
        {
            companyName: 'Precision Carpentry LLC',
            services: ['Carpentry', 'Custom Cabinets', 'Furniture Building'],
            serviceRadius: 20,
            licenseNumber: 'CAR-2019-56432',
            hasInsurance: true,
            yearsInBusiness: 7,
            status: 'active',
        },
        {
            companyName: 'Perfect Painting Pros',
            services: ['Painting', 'Wallpaper Installation', 'Drywall Repair'],
            serviceRadius: 30,
            licenseNumber: 'PTG-2017-24680',
            hasInsurance: true,
            yearsInBusiness: 10,
            status: 'active',
        },
        {
            companyName: 'Green Landscaping & Design',
            services: ['Landscaping', 'Irrigation', 'Hardscaping'],
            serviceRadius: 25,
            licenseNumber: 'LND-2021-13579',
            hasInsurance: true,
            yearsInBusiness: 3,
            status: 'pending',
        },
        {
            companyName: 'Premium Flooring Installers',
            services: ['Flooring', 'Tile Installation', 'Carpet Installation'],
            serviceRadius: 35,
            licenseNumber: 'FLR-2016-97531',
            hasInsurance: true,
            yearsInBusiness: 9,
            status: 'active',
        },
    ];
    const contractorUserIds = userIds.slice(1, 9);
    const contractors = contractorData.map((data, i) => ({
        userId: contractorUserIds[i],
        ...data,
        stripeAccountId: `acct_${randomElement(['1', '2', '3'])}${randomInt(1000000000, 9999999999)}`,
        stripeOnboardingComplete: data.status === 'active',
        rating: randomFloat(3.5, 5.0),
        reviewCount: randomInt(5, 50),
        totalLeads: randomInt(20, 150),
        acceptedLeads: randomInt(15, 120),
        responseRate: randomInt(75, 100),
        avgResponseTime: randomInt(15, 480),
        totalEarnings: randomFloat(5000, 150000),
        ytdEarnings: randomFloat(2000, 75000),
        pendingPayout: randomFloat(0, 5000),
    }));
    const createdContractors = await Contractor_1.Contractor.insertMany(contractors);
    console.log(`  Created ${createdContractors.length} contractors`);
    return createdContractors.map((c) => c._id);
}
async function seedLeads(contractorIds) {
    console.log('Creating leads...');
    await Lead_1.Lead.deleteMany({});
    const leadDescriptions = [
        'Kitchen sink is completely clogged. Water drains very slowly. Tried plunger but did not help. Need professional drain cleaning or possible pipe replacement.',
        'Need to install a new 200-amp electrical panel. Current panel is outdated and shows signs of overheating. Also need to add a few new circuits for home office.',
        'AC unit is blowing warm air. Unit is about 8 years old. Thermostat seems fine. Probably needs refrigerant recharge or compressor check.',
        'Roof has missing shingles after last storm. About 15-20 shingles need replacement. Also want a full roof inspection for any hidden damage.',
        'Need custom built-in shelving for living room. About 12 feet wide, floor to ceiling. Prefer white oak material.',
        'Looking to paint the exterior of a 2500 sq ft house. Two stories. Need power washing, prep work, and premium paint.',
        'Need to redesign backyard with new sod, sprinkler system, and patio area. About 2000 sq ft total area.',
        'Need hardwood flooring installed in 3 bedrooms and hallway. About 800 sq ft total. Prefinished oak planks.',
        'Bathroom faucet is leaking constantly. Also toilet runs intermittently. Need both repaired or replaced.',
        'Want to install recessed LED lighting in kitchen and living room. About 12 lights total. Need new switches with dimmers.',
        'Furnace is making loud banging noises when starting up. 12 years old. May need replacement soon.',
        'Minor roof leak around chimney area. Water stains on ceiling. Need flashing repair and ceiling patch.',
        'Want a custom deck built in backyard. 16x20 feet, composite material, with built-in bench seating and lighting.',
        'Interior painting for entire first floor. Living room, dining room, kitchen. About 1200 sq ft of wall space. Light gray colors.',
        'Front yard needs complete overhaul. New plants, mulch, landscape lighting, and irrigation repair.',
        'Replace carpet with luxury vinyl plank flooring in basement. About 600 sq ft. Need moisture barrier too.',
        'Emergency! Water heater burst and flooding garage. Need immediate replacement with tankless unit.',
        'Need whole-house surge protector installed. Also want to upgrade some outlets to GFCI in kitchen and bathrooms.',
        'Ductwork cleaning for entire house. Not cleaned in 10 years. Family has allergies. Want UV light installed too.',
        'Want solar panel installation for 3000 sq ft home. Interested in tax incentives and financing options.',
        'Need a load-bearing wall removed between kitchen and dining room. Also need beam installation and electrical rerouting.',
        'Fence needs repair after wind storm. About 40 feet of 6-foot privacy fence needs new posts and panels.',
        'Bathroom remodel - need tile shower installation, new vanity, toilet, and flooring. About 80 sq ft room.',
        'Garage door opener is broken. Chain drive system, 15 years old. Want quiet belt drive replacement.',
        'Foundation has visible cracks. Need inspection and repair estimate. House is 25 years old, slab foundation.',
        'Need gutter guards installed and gutter cleaning. Two-story house, about 200 linear feet of gutters.',
        'Want to finish basement. Need framing, drywall, electrical, and flooring for about 900 sq ft.',
        'Kitchen cabinet refacing. 20 cabinets total. Also want new hardware and under-cabinet lighting.',
        'Need epoxy coating for 2-car garage floor. Some cracks need repair first.',
        'Patio door is difficult to open and has air leaks. Need sliding door replacement with energy efficient model.',
    ];
    const leads = leadDescriptions.map((description, i) => {
        const assignedContractor = Math.random() > 0.5
            ? randomElement(contractorIds)
            : null;
        const statuses = assignedContractor
            ? ['Viewed', 'Accepted', 'Completed']
            : ['New', 'Viewed'];
        const urgency = randomElement([...URGENCIES]);
        return {
            service: randomElement(SERVICES),
            homeownerName: `${randomElement(FIRST_NAMES)} ${randomElement(LAST_NAMES)}`,
            zipCode: String(randomInt(75000, 79999)),
            city: randomElement(CITIES),
            distance: randomFloat(1, 30),
            budgetMin: randomInt(500, 5000),
            budgetMax: randomInt(5000, 50000),
            urgency,
            description,
            status: randomElement(statuses),
            assignedContractorId: assignedContractor,
            homeownerEmail: `homeowner${i}@email.com`,
            homeownerPhone: `555-${String(randomInt(1000, 9999)).padStart(4, '0')}`,
            score: randomInt(30, 95),
            createdAt: randomDate(90),
            updatedAt: new Date(),
        };
    });
    const createdLeads = await Lead_1.Lead.insertMany(leads);
    console.log(`  Created ${createdLeads.length} leads`);
    return createdLeads.map((l) => l._id);
}
async function seedReviews(contractorIds) {
    console.log('Creating reviews...');
    await Review_1.Review.deleteMany({});
    const reviewComments = [
        {
            comment: 'Excellent work! John was professional, on time, and fixed our plumbing issue quickly. Highly recommend!',
            sentiment: 'Positive',
        },
        {
            comment: 'Very satisfied with the electrical work. Clean installation and explained everything thoroughly.',
            sentiment: 'Positive',
        },
        {
            comment: 'Good service overall. AC is working great now. Took a bit longer than expected but quality work.',
            sentiment: 'Positive',
        },
        {
            comment: 'Roof repair was done well. No more leaks! Crew was respectful and cleaned up nicely.',
            sentiment: 'Positive',
        },
        {
            comment: 'Outstanding craftsmanship on our custom cabinets. Exceeded our expectations. Will hire again!',
            sentiment: 'Positive',
        },
        {
            comment: 'House looks amazing! The paint job is flawless. Great attention to detail on trim work.',
            sentiment: 'Positive',
        },
        {
            comment: 'Average experience. Work was okay but communication could have been better throughout the project.',
            sentiment: 'Neutral',
        },
        {
            comment: 'Happy with the flooring installation. Some minor issues with baseboard alignment but they came back to fix.',
            sentiment: 'Neutral',
        },
        {
            comment: 'Disappointed with the timeline. Promised 2 weeks, took 5 weeks. Quality is decent though.',
            sentiment: 'Negative',
        },
        {
            comment: 'Would not recommend. Left a mess behind and had to call them back twice to fix mistakes.',
            sentiment: 'Negative',
        },
        {
            comment: 'Fantastic experience! They went above and beyond. Fair pricing and exceptional quality.',
            sentiment: 'Positive',
        },
        {
            comment: 'The team was knowledgeable and efficient. Our new deck looks incredible. Five stars!',
            sentiment: 'Positive',
        },
        {
            comment: 'Great landscaping work. Creative design suggestions and within budget.',
            sentiment: 'Positive',
        },
        {
            comment: 'Pricing was higher than quoted initially. Work quality is good but unexpected costs were frustrating.',
            sentiment: 'Neutral',
        },
        {
            comment: 'Had some scheduling conflicts but once they started, the work was solid. Good HVAC expertise.',
            sentiment: 'Neutral',
        },
    ];
    const reviews = reviewComments.map((review, i) => {
        const rating = review.sentiment === 'Positive'
            ? randomInt(4, 5)
            : review.sentiment === 'Neutral'
                ? 3
                : randomInt(1, 2);
        return {
            contractorId: randomElement(contractorIds),
            homeownerName: `${randomElement(FIRST_NAMES)} ${randomElement(LAST_NAMES)}`,
            rating,
            comment: review.comment,
            service: randomElement(SERVICES),
            date: randomDate(90),
            sentiment: review.sentiment,
            responded: Math.random() > 0.5,
            responseText: Math.random() > 0.5
                ? 'Thank you for your feedback! We appreciate your business.'
                : '',
        };
    });
    const createdReviews = await Review_1.Review.insertMany(reviews);
    console.log(`  Created ${createdReviews.length} reviews`);
    return createdReviews.map((r) => r._id);
}
async function seedEarnings(contractorIds, leadIds) {
    console.log('Creating earnings...');
    await Earning_1.Earning.deleteMany({});
    const servicePrices = {
        Plumbing: 85,
        Electrical: 95,
        HVAC: 120,
        Roofing: 150,
        Carpentry: 80,
        Painting: 65,
        Landscaping: 75,
        Flooring: 90,
        Masonry: 100,
        'General Contracting': 125,
        'Window Installation': 110,
        'Deck Building': 95,
    };
    const earnings = [];
    for (let i = 0; i < 20; i++) {
        const service = randomElement(SERVICES);
        const hourlyRate = servicePrices[service] || 75;
        const hours = randomFloat(2, 40);
        const amount = Math.round(hourlyRate * hours * 100) / 100;
        earnings.push({
            contractorId: randomElement(contractorIds),
            leadId: leadIds[i % leadIds.length],
            service,
            homeownerName: `${randomElement(FIRST_NAMES)} ${randomElement(LAST_NAMES)}`,
            amount,
            status: randomElement(['Paid', 'Pending']),
            date: randomDate(120),
        });
    }
    const createdEarnings = await Earning_1.Earning.insertMany(earnings);
    console.log(`  Created ${createdEarnings.length} earnings`);
    return createdEarnings.map((e) => e._id);
}
async function seedActivities(contractorIds) {
    console.log('Creating activities...');
    await Activity_1.Activity.deleteMany({});
    const activities = [
        {
            type: 'new_lead',
            message: 'New Emergency Plumbing Lead in Austin, TX',
            location: 'Austin, TX',
        },
        {
            type: 'lead_accepted',
            message: 'Lead accepted: Kitchen Remodel - Budget $25,000',
            location: 'Dallas, TX',
        },
        {
            type: 'review',
            message: 'New 5-star review from Sarah Johnson',
            location: 'Houston, TX',
        },
        {
            type: 'payout',
            message: 'Payout of $3,240.50 processed to your account',
            location: 'Fort Worth, TX',
        },
        {
            type: 'milestone',
            message: 'Congratulations! You completed your 50th project',
            location: 'San Antonio, TX',
        },
        {
            type: 'profile_update',
            message: 'Your contractor profile has been verified',
            location: 'Plano, TX',
        },
        {
            type: 'new_lead',
            message: 'New HVAC Installation Lead in Arlington',
            location: 'Arlington, TX',
        },
        {
            type: 'lead_accepted',
            message: 'Lead accepted: Roof Repair - Budget $8,500',
            location: 'Corpus Christi, TX',
        },
        {
            type: 'review',
            message: 'New 4-star review from Michael Chen',
            location: 'Laredo, TX',
        },
        {
            type: 'payout',
            message: 'Payout of $5,100.00 processed to your account',
            location: 'Lubbock, TX',
        },
        {
            type: 'milestone',
            message: 'You earned $100,000 lifetime on GetOnlyPros!',
            location: 'Austin, TX',
        },
        {
            type: 'new_lead',
            message: 'New Electrical Panel Upgrade Lead in Garland',
            location: 'Garland, TX',
        },
    ];
    const activityDocs = activities.map((activity) => ({
        ...activity,
        timestamp: randomDate(14),
    }));
    const createdActivities = await Activity_1.Activity.insertMany(activityDocs);
    console.log(`  Created ${createdActivities.length} activities`);
    return createdActivities.map((a) => a._id);
}
async function seedDatabase() {
    console.log('\n========================================');
    console.log('  GetOnlyPros Database Seeder');
    console.log('========================================\n');
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            console.error('MONGODB_URI is not defined in environment variables');
            process.exit(1);
        }
        console.log('Connecting to MongoDB...');
        await mongoose_1.default.connect(mongoUri);
        console.log('Connected to MongoDB\n');
        const userIds = await seedUsers();
        const contractorIds = await seedContractors(userIds);
        const leadIds = await seedLeads(contractorIds);
        await seedReviews(contractorIds);
        await seedEarnings(contractorIds, leadIds);
        await seedActivities(contractorIds);
        console.log('\n========================================');
        console.log('  Seed completed successfully!');
        console.log('========================================');
        console.log('\nDefault credentials:');
        console.log('  Admin:    admin@getonlypros.com / Password123!');
        console.log('  Contractor passwords: Password123!');
        console.log('  Homeowner passwords: Password123!\n');
        await mongoose_1.default.connection.close();
        console.log('MongoDB connection closed.\n');
        process.exit(0);
    }
    catch (error) {
        console.error('\nSeed failed:', error);
        await mongoose_1.default.connection.close();
        process.exit(1);
    }
}
if (require.main === module) {
    seedDatabase();
}
//# sourceMappingURL=seed.js.map