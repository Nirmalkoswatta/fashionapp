const bcrypt = require("bcryptjs");

const Role = require("../models/Role");
const User = require("../models/User");
const Portfolio = require("../models/Portfolio");

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
    {
        name: "vendor",
        description: "Vendor access for managing products and portfolio.",
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
    const vendorRole = await Role.findOne({ name: "vendor" });

    if (!adminRole || !staffRole || !customerRole || !vendorRole) {
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
        {
            name: "Fashion Vendor",
            email: process.env.SEED_VENDOR_EMAIL || "vendor@gmail.com",
            password: process.env.SEED_VENDOR_PASSWORD || "vendor123",
            role: vendorRole._id,
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

async function seedPortfolios() {
    const defaultVendorEmail = process.env.SEED_VENDOR_EMAIL || "vendor@gmail.com";
    const portfolios = [
        {
            vendorId: defaultVendorEmail,
            imageUrl: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500",
            description: "Elegant silk evening gown with lace detail and long sleeves, perfect for weddings and formal parties."
        },
        {
            vendorId: defaultVendorEmail,
            imageUrl: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500",
            description: "Casual cotton linen shirt, breathable lightweight summer shirt with button closure."
        },
        {
            vendorId: defaultVendorEmail,
            imageUrl: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500",
            description: "Classic black leather jacket, heavy duty wool lining, modern street style fashion jacket."
        }
    ];

    for (const portfolio of portfolios) {
        const existing = await Portfolio.findOne({ description: portfolio.description });
        if (!existing) {
            await Portfolio.create(portfolio);
        }
    }
}

async function runSeed() {
    await seedRoles();
    await seedUsers();
    await seedPortfolios();
    console.log("Seed completed: roles, users, and portfolios ensured.");
}

module.exports = {
    runSeed,
};

