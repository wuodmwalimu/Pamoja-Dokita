const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./database1.db");

db.serialize(() => {
    console.log("Updating database schema...");

    // Create the Users table
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE
        )
    `, (err) => {
        if (err) {
            console.error("Error creating users table:", err.message);
        } else {
            console.log("Users table created successfully");
        }
    });

    // Create the Blood Requests table
    db.run(`
        CREATE TABLE IF NOT EXISTS requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            recipientName TEXT NOT NULL,
            dob DATE NOT NULL,
            age INTEGER NOT NULL,
            bloodType TEXT NOT NULL,
            units INTEGER NOT NULL,
            gender TEXT NOT NULL,
            country TEXT NOT NULL,
            region TEXT NOT NULL,
            hospital TEXT NOT NULL,
            doctor TEXT NOT NULL,
            contactHospital TEXT NOT NULL,
            location TEXT NOT NULL,
            requestDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) {
            console.error("Error creating requests table:", err.message);
        } else {
            console.log("Requests table created successfully");
        }
    });

    // Create the Unprocessed List table
    db.run(`
        CREATE TABLE IF NOT EXISTS unprocessed_list (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            last_name TEXT NOT NULL,
            first_name TEXT NOT NULL,
            phone TEXT NOT NULL,
            dob TEXT NOT NULL,
            age INTEGER NOT NULL,
            residence TEXT NOT NULL,
            donor_type TEXT NOT NULL,
            consent TEXT NOT NULL,
            confirm TEXT NOT NULL,
            signature TEXT NOT NULL,
            submission_date TEXT NOT NULL,
            medical_problems TEXT,
            medical_details TEXT,
            pregnant TEXT,
            pregnancy_details TEXT,
            cancer TEXT,
            cancer_details TEXT,
            allergies TEXT,
            allergy_details TEXT,
            chronic_conditions TEXT,
            chronic_details TEXT,
            surgery TEXT,
            surgery_details TEXT,
            blood_disorder TEXT,
            blood_disorder_details TEXT,
            medications TEXT,
            medication_details TEXT,
            organ_transplant TEXT,
            transplant_details TEXT,
            breastfeeding TEXT,
            breastfeeding_details TEXT,
            sti TEXT,
            sti_details TEXT,
            contact_hiv TEXT,
            drugs TEXT,
            contagious_disease TEXT,
            donation_history TEXT,
            last_donation TEXT,
            donation_reaction TEXT,
            reaction_details TEXT,
            currently_unwell TEXT,
            overall_observation TEXT,
            temperature REAL,
            blood_pressure TEXT,
            pulse INTEGER,
            respiration_rate INTEGER,
            heart_examination TEXT,
            lung_examination TEXT,
            overall_impression TEXT
        )
    `, (err) => {
        if (err) {
            console.error("Error creating unprocessed_list table:", err.message);
        } else {
            console.log("Unprocessed list table created successfully");
        }
    });
  // Create approved_requests table
db.run(`
    CREATE TABLE IF NOT EXISTS approved_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recipientName TEXT,
        dob TEXT,
        age INTEGER,
        bloodType TEXT,
        units INTEGER,
        gender TEXT,
        country TEXT,
        region TEXT,
        hospital TEXT,
        doctor TEXT,
        contactHospital TEXT,
        location TEXT,
        requestDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        approvedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
`, (err) => {
    if (err) {
        console.error("Error creating approved_requests table:", err.message);
    } else {
        console.log("approved_requests table created or already exists.");
    }
});

// Create denied_requests table with reason for denial
db.run(`
    CREATE TABLE IF NOT EXISTS denied_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recipientName TEXT,
        dob TEXT,
        age INTEGER,
        bloodType TEXT,
        units INTEGER,
        gender TEXT,
        country TEXT,
        region TEXT,
        hospital TEXT,
        doctor TEXT,
        contactHospital TEXT,
        location TEXT,
        requestDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deniedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reason TEXT
    )
`, (err) => {
    if (err) {
        console.error("Error creating denied_requests table:", err.message);
    } else {
        console.log("denied_requests table created or already exists.");
    }
});
  
    // Create the Registered Donors table
    db.run(`
        CREATE TABLE IF NOT EXISTS registered_donors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            last_name TEXT NOT NULL,
            first_name TEXT NOT NULL,
            phone TEXT NOT NULL,
            dob TEXT NOT NULL,
            age INTEGER NOT NULL,
            residence TEXT NOT NULL,
            donor_type TEXT NOT NULL,
            consent TEXT NOT NULL,
            confirm TEXT NOT NULL,
            signature TEXT NOT NULL,
            submission_date TEXT NOT NULL,
            medical_problems TEXT,
            medical_details TEXT,
            pregnant TEXT,
            pregnancy_details TEXT,
            cancer TEXT,
            cancer_details TEXT,
            allergies TEXT,
            allergy_details TEXT,
            chronic_conditions TEXT,
            chronic_details TEXT,
            surgery TEXT,
            surgery_details TEXT,
            blood_disorder TEXT,
            blood_disorder_details TEXT,
            medications TEXT,
            medication_details TEXT,
            organ_transplant TEXT,
            transplant_details TEXT,
            breastfeeding TEXT,
            breastfeeding_details TEXT,
            sti TEXT,
            sti_details TEXT,
            contact_hiv TEXT,
            drugs TEXT,
            contagious_disease TEXT,
            donation_history TEXT,
            last_donation TEXT,
            donation_reaction TEXT,
            reaction_details TEXT,
            currently_unwell TEXT,
            overall_observation TEXT,
            temperature REAL,
            blood_pressure TEXT,
            pulse INTEGER,
            respiration_rate INTEGER,
            heart_examination TEXT,
            lung_examination TEXT,
            overall_impression TEXT
        )
    `, (err) => {
        if (err) {
            console.error("Error creating registered_donors table:", err.message);
        } else {
            console.log("Registered Donors table created successfully");
        }
    });

});

module.exports = db;