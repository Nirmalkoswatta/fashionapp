const bcrypt = require("bcryptjs");

const Role = require("../models/Role");
const User = require("../models/User");

const DEFAULT_ROLES = [
    {
        name: "admin",
        description: "Full platform access for system administration.",
    },
    {
        name: "staff",
        description: "Operational access for order and catalog management.",
    },
    {
        name: "customer",
        description: "Standard buyer access for storefront usage.",
    },
];

async function seedRoles() {
    for (const role of DEFAULT_ROLES) {
        await Role.updateOne({ name: role.name }, { $set: role }, { upsert: true });
    }
}

async function seedUsers() {
    const adminRole = await Role.findOne({ name: "admin" });
    const staffRole = await Role.findOne({ name: "staff" });
    const customerRole = await Role.findOne({ name: "customer" });

    if (!adminRole || !staffRole || !customerRole) {
        throw new Error("Required roles missing. Cannot seed users.");
    }

    const seedUsers = [
        {
            name: "Platform Admin",
            email: process.env.SEED_ADMIN_EMAIL || "admin@gmail.com",
            password: process.env.SEED_ADMIN_PASSWORD || "admin123",
            role: adminRole._id,
        },
        {
            name: "Store Staff",
            email: process.env.SEED_STAFF_EMAIL || "staff@gmail.com",
            password: process.env.SEED_STAFF_PASSWORD || "staff123",
            role: staffRole._id,
        },
        {
            name: "Fashion User",
            email: process.env.SEED_USER_EMAIL || "user@gmail.com",
            password: process.env.SEED_USER_PASSWORD || "user123",
            role: customerRole._id,
        },
    ];

    for (const seedUser of seedUsers) {
        const existingUser = await User.findOne({ email: seedUser.email });

        if (existingUser) {
            continue;
        }

        const passwordHash = await bcrypt.hash(seedUser.password, 10);

        await User.create({
            name: seedUser.name,
            email: seedUser.email,
            passwordHash,
            role: seedUser.role,
        });
    }
}

async function runSeed() {
    await seedRoles();
    await seedUsers();
    console.log("Seed completed: roles and users ensured.");
}

module.exports = {
    runSeed,
};
