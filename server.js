const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const db = require("./sqlite"); // Import database connection

const app = express();
const PORT = process.env.PORT || 3000;



const session = require("express-session"); // Add this line

// Session middleware
app.use(session({
    secret: 'briliancemoses',             // Hardcoded session secret
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }             // Set to true if using HTTPS
}));








// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// View engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS trial3 (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            donorId INTEGER,
            lastName TEXT NOT NULL,
            firstName TEXT NOT NULL,
            telephone TEXT NOT NULL,
            dob TEXT NOT NULL,
            age INTEGER NOT NULL,
            residence TEXT NOT NULL,
            donorType TEXT NOT NULL,
            submissionDate TEXT,
            dateAdded TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
});
                       
        // Route to render summer.ejs
// Create Trial 4 Table (if it doesn't already exist)
db.serialize(() => {
    const createTrial4TableQuery = `
        CREATE TABLE IF NOT EXISTS trial4 (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            lastName TEXT NOT NULL,
            firstName TEXT NOT NULL,
            telephone TEXT NOT NULL,
            dob TEXT NOT NULL,
            age INTEGER NOT NULL,
            residence TEXT NOT NULL,
            donorType TEXT NOT NULL,
            submissionDate TEXT NOT NULL,
            bloodGroup TEXT NOT NULL,
            rhesusFactor TEXT NOT NULL,
            donationVolume INTEGER NOT NULL,
            hemoglobinLevel REAL NOT NULL,
            donationType TEXT NOT NULL,
            donationDate TEXT NOT NULL,
            notes TEXT
        )
    `;

    db.run(createTrial4TableQuery, (err) => {
        if (err) {
            console.error('❌ Error creating Trial 4 table:', err.message);
        } else {
            console.log('✅ Trial 4 table created or already exists.');
        }
    });
});
// Route to render the 'summer' page with trial1 and trial3 data
app.get('/summer', (req, res) => {
    db.all('SELECT * FROM trial1', (err, trial1Data) => {
        if (err) {
            console.error('❌ Error fetching trial1 data:', err.message);
            return res.status(500).send('Database error while fetching trial1 data');
        }

        db.all('SELECT * FROM trial3', (err, trial3Data) => {
            if (err) {
                console.error('❌ Error fetching trial3 data:', err.message);
                return res.status(500).send('Database error while fetching trial3 data');
            }

            res.render('summer', { trial1Data, trial3Data });
        });
    });
});

// Route to copy a donor from trial1 to trial3 without deleting from trial1
app.post('/move-to-trial3', (req, res) => {
    const { id } = req.body;

    if (!id) {
        return res.status(400).send('Donor ID is required');
    }

    db.get('SELECT * FROM trial1 WHERE id = ?', [id], (err, donor) => {
        if (err) {
            console.error('❌ Error fetching donor from trial1:', err.message);
            return res.status(500).send('Database error while fetching donor');
        }
        if (!donor) {
            return res.status(404).send('Donor not found in trial1');
        }

        const insertQuery = `
            INSERT INTO trial3 (
                donorId, lastName, firstName, telephone, dob, age, residence, donorType, submissionDate
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const insertParams = [
            donor.id, donor.lastName, donor.firstName, donor.telephone,
            donor.dob, donor.age, donor.residence, donor.donorType, donor.submissionDate
        ];

        db.run(insertQuery, insertParams, (err) => {
            if (err) {
                console.error('❌ Error inserting donor into trial3:', err.message);
                return res.status(500).send('Failed to move donor to trial3');
            }
            console.log('✅ Donor moved to trial3 successfully');
            res.redirect('/summer');
        });
    });
});
// Route to fetch and render both Trial 3 and Trial 4 data
app.get('/erick', (req, res) => {
    const trial3Query = 'SELECT * FROM trial3';
    const trial4Query = 'SELECT * FROM trial4';

    db.all(trial3Query, (err, trial3Data) => {
        if (err) {
            console.error('❌ Error fetching trial3 data:', err.message);
            return res.status(500).send('Database error while fetching Trial 3 data');
        }

        db.all(trial4Query, (err, trial4Data) => {
            if (err) {
                console.error('❌ Error fetching trial4 data:', err.message);
                return res.status(500).send('Database error while fetching Trial 4 data');
            }

            // Render 'erick' page with both trial3 and trial4 data
            res.render('erick', { trial3Data, trial4Data });
        });
    });
});

// Route to handle adding details and moving a donor to trial 4
app.post('/add-to-trial4', (req, res) => {
    const { donorId, bloodGroup, rhesusFactor, donationVolume, hemoglobinLevel, donationType, donationDate, notes } = req.body;

    // Validate required fields
    if (!donorId || !bloodGroup || !rhesusFactor || !donationVolume || !hemoglobinLevel || !donationType || !donationDate) {
        return res.status(400).send('All required donor details must be provided');
    }

    // Fetch donor from trial 3
    db.get('SELECT * FROM trial3 WHERE id = ?', [donorId], (err, donor) => {
        if (err) {
            console.error('❌ Error fetching donor from trial3:', err.message);
            return res.status(500).send('Database error while fetching donor from trial3');
        }
        if (!donor) {
            return res.status(404).send('Donor not found in trial3');
        }

        // Insert donor into trial 4
        const insertQuery = `
            INSERT INTO trial4 (
                lastName, firstName, telephone, dob, age, residence, donorType, submissionDate,
                bloodGroup, rhesusFactor, donationVolume, hemoglobinLevel, donationType, donationDate, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const insertParams = [
            donor.lastName, donor.firstName, donor.telephone, donor.dob, donor.age, donor.residence, donor.donorType, donor.submissionDate,
            bloodGroup, rhesusFactor, donationVolume, hemoglobinLevel, donationType, donationDate, notes
        ];

        db.run(insertQuery, insertParams, function (err) {
            if (err) {
                console.error('❌ Error inserting into trial4:', err.message);
                return res.status(500).send('Failed to add donor to trial4');
            }
            console.log('✅ Donor added to trial4 successfully');

            // Delete donor from trial 3 after successful insertion into trial 4
            const deleteQuery = 'DELETE FROM trial3 WHERE id = ?';
            db.run(deleteQuery, [donorId], (err) => {
                if (err) {
                    console.error('❌ Error deleting donor from trial3:', err.message);
                    return res.status(500).send('Failed to remove donor from trial3');
                }
                console.log('✅ Donor removed from trial3 after moving to trial4');
                res.redirect('/erick'); // Refresh the page to show updated data
            });
        });
    });
});

// Route to fetch and render Trial 4 data on erick.ejs
app.get('/erick', (req, res) => {
    db.all('SELECT * FROM trial4', (err, trial4Data) => {
        if (err) {
            console.error('❌ Error fetching trial4 data:', err.message);
            return res.status(500).send('Database error while fetching Trial 4 data');
        }

        res.render('erick', { trial4Data });
    });
});






















// Create releasedDonations table if it doesn't exist
db.run(`
    CREATE TABLE IF NOT EXISTS releasedDonations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        donationID INTEGER,
        donationType TEXT,
        bloodType TEXT,
        donationDate TEXT,
        recipientName TEXT,
        units INTEGER,
        hospital TEXT,
        doctor TEXT,
        approvedDate TIMESTAMP,
        cashierName TEXT,
        additionalNotes TEXT,
        releasedBy TEXT,
        releaseDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
`);
// Endpoint to fetch all relevant tables
app.get("/inventories", (req, res) => {
    db.all("SELECT * FROM trial5 ORDER BY dateAdded DESC", (trialErr, trial5Data) => {
        if (trialErr) return res.status(500).send("Failed to fetch trial5 records.");

        db.all("SELECT * FROM cashier_cleared ORDER BY timestamp DESC", (cashierErr, cashierCleared) => {
            if (cashierErr) return res.status(500).send("Failed to fetch cashier-cleared requests.");

            db.all("SELECT * FROM releasedDonations ORDER BY releaseDate DESC", (releasedErr, releasedDonations) => {
                if (releasedErr) return res.status(500).send("Failed to fetch released donations.");

                res.render("inventories.ejs", { 
                    trial5Data, 
                    cashierCleared, 
                    releasedDonations 
                });
            });
        });
    });
});
// Fetch trial5 records for dropdown selection
app.get('/trial5-records', (req, res) => {
    db.all("SELECT id, donationID, donationType, bloodType, donationDate FROM trial5 ORDER BY dateAdded DESC", (err, records) => {
        if (err) return res.status(500).send("Error fetching trial5 records.");
        res.json(records); // Send trial5 records as JSON
    });
});
app.post('/release-donation', (req, res) => {
    const { 
        donationID, 
        donationType,  
        bloodType,  
        donationDate, 
        recipientName, 
        units, 
        hospital, 
        doctor, 
        approvedDate, 
        cashierName, 
        additionalNotes, 
        releasedBy
    } = req.body;

    // Ensure all required fields are provided
    if (!donationID || !donationType || !bloodType || !donationDate || !recipientName || !units || !hospital || !doctor || !approvedDate || !cashierName) {
        return res.status(400).json({ error: "All required fields must be provided." });
    }

    // Insert into releasedDonations table
    db.run(`INSERT INTO releasedDonations 
            (donationID, donationType, bloodType, donationDate, recipientName, units, hospital, doctor, approvedDate, cashierName, additionalNotes, releasedBy, releaseDate) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`, 
            [
                donationID, 
                donationType, 
                bloodType, 
                donationDate, 
                recipientName, 
                units, 
                hospital, 
                doctor, 
                approvedDate, 
                cashierName, 
                additionalNotes, 
                releasedBy
            ], 
            function(err) {
        if (err) return res.status(500).json({ error: "Failed to release donation." });
        res.status(201).json({ message: "Donation successfully released." });
    });
});







 























    db.run(`
    CREATE TABLE IF NOT EXISTS cashier_cleared (
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
        approvedDate TIMESTAMP,
        cashierName TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        additionalNotes TEXT
    )
`);
app.post("/cashier-clear", (req, res) => {
    const { requestId, additionalNotes, cashierName } = req.body;
    

    if (!requestId) {
        return res.status(400).send("Request ID is required.");
    }

    db.get("SELECT * FROM approved_requests WHERE id = ?", [requestId], (err, request) => {
        if (err || !request) {
            return res.status(500).send("Failed to fetch request.");
        }

        db.run(
            `INSERT INTO cashier_cleared (
                recipientName, dob, age, bloodType, units, gender, country, region, hospital, doctor, contactHospital, location, approvedDate, cashierName, additionalNotes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                request.recipientName,
                request.dob,
                request.age,
                request.bloodType,
                request.units,
                request.gender,
                request.country,
                request.region,
                request.hospital,
                request.doctor,
                request.contactHospital,
                request.location,
                request.approvedDate,
                cashierName,
                additionalNotes,
            ],
            (insertErr) => {
                if (insertErr) {
                    return res.status(500).send("Failed to clear request.");
                }

                db.run("DELETE FROM approved_requests WHERE id = ?", [requestId], (deleteErr) => {
                    if (deleteErr) {
                        return res.status(500).send("Failed to finalize clearance.");
                    }
                    res.redirect("/cashiered");
                });
            }
        );
    });
});
app.get("/cashiered", (req, res) => {
    db.all("SELECT * FROM approved_requests ORDER BY approvedDate DESC", (approveErr, approvedRequests) => {
        if (approveErr) {
            return res.status(500).send("Failed to fetch approved requests.");
        }

        db.all("SELECT * FROM cashier_cleared ORDER BY timestamp DESC", (clearErr, cashierCleared) => {
            if (clearErr) {
                return res.status(500).send("Failed to fetch cleared requests.");
            }

            res.render("cashiered", { approvedRequests, cashierCleared });
        });
    });
});














app.get('/reports', (req, res) => {
    db.all('SELECT * FROM trial7', (err, trial7Records) => {
        if (err) {
            console.error('❌ Error fetching trial7 records:', err.message);
            return res.status(500).send('Database error while fetching trial7 records');
        }

        res.render('reports', { trial7Records });
    });
});






// Create or update the "picked" table
db.run(`
    CREATE TABLE IF NOT EXISTS picked (
        id INTEGER PRIMARY KEY,
        bloodUnitID TEXT,
        bloodGroup TEXT,
        donationType TEXT,
        expirationDate TEXT,
        recipientName TEXT,
        recipientBloodType TEXT,
        hospital TEXT,
        doctor TEXT,
        approvedDate TEXT,
        releaseDate TEXT,
        confirmedBy TEXT,
        confirmedDate TEXT,
        additionalNotes TEXT
    )
`);
// Route to fetch both cashierclears and picked records
app.get('/picked', (req, res) => {
    const fetchCashierClears = `SELECT * FROM cashierclears`;
    const fetchPicked = `SELECT * FROM picked`;

    db.all(fetchCashierClears, [], (err, cashierClearsRows) => {
        if (err) {
            console.error('❌ Error fetching data from cashierclears:', err.message);
            return res.status(500).json({ error: 'Database error while fetching cashier clears' });
        }

        db.all(fetchPicked, [], (err, pickedRows) => {
            if (err) {
                console.error('❌ Error fetching data from picked:', err.message);
                return res.status(500).json({ error: 'Database error while fetching picked records' });
            }

            // Render the page with both tables
            res.render('picked', { cashierClears: cashierClearsRows, picked: pickedRows });
        });
    });
});

// Route to confirm a pickup and save it to the "picked" table
app.post('/confirm-pickup', (req, res) => {
    const {
        bloodUnitID,
        bloodGroup,
        donationType,
        expirationDate,
        recipientName,
        recipientBloodType,
        hospital,
        doctor,
        approvedDate,
        releaseDate,
        confirmedBy,
        additionalNotes
    } = req.body;

    const confirmedDate = new Date().toISOString();

    const insertQuery = `
        INSERT INTO picked (
            bloodUnitID, bloodGroup, donationType, expirationDate, 
            recipientName, recipientBloodType, hospital, doctor, 
            approvedDate, releaseDate, confirmedBy, confirmedDate, additionalNotes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(insertQuery, [
        bloodUnitID, bloodGroup, donationType, expirationDate,
        recipientName, recipientBloodType, hospital, doctor,
        approvedDate, releaseDate, confirmedBy, confirmedDate, additionalNotes
    ], function (err) {
        if (err) {
            console.error('❌ Error inserting data into picked table:', err.message);
            return res.status(500).json({ error: 'Database error while confirming pickup' });
        }

        res.json({ message: 'Pickup confirmed successfully', id: this.lastID });
    });
});








// Assuming you're using SQLite and `db` is your database instance
app.get('/regman', (req, res) => {
    // Querying the SQLite database to fetch all records from the `trial5` table
    db.all('SELECT * FROM trial5', [], (err, rows) => {
        if (err) {
            console.error('❌ Error fetching trial5 data:', err.message);
            // If there is an error with the query, return a 500 error with a message
            return res.status(500).json({ error: 'Database error while fetching records' });
        }

        // Successfully fetched the data, now render the 'regman' view and pass the rows as `trial5Records`
        res.render('regman', { trial5Records: rows });
    });
});











// Route to fetch counts for different request tables
app.get('/request-counts', (req, res) => {
    const queries = {
        requests: `SELECT COUNT(*) AS count FROM requests`,
        approved_requests: `SELECT COUNT(*) AS count FROM approved_requests`,
        denied_requests: `SELECT COUNT(*) AS count FROM denied_requests`,
        cleared_requests: `SELECT COUNT(*) AS count FROM cleared_requests`,
        cashier_clears: `SELECT COUNT(*) AS count FROM cashierclears`,
        picked: `SELECT COUNT(*) AS count FROM picked`,
    };

    const counts = {};
    const queryKeys = Object.keys(queries);
    let completedQueries = 0;

    queryKeys.forEach((key) => {
        db.get(queries[key], (err, row) => {
            if (err) {
                console.error(`Error fetching ${key} count:`, err.message);
                counts[key] = 0;
            } else {
                counts[key] = row.count || 0;
            }

            completedQueries++;
            if (completedQueries === queryKeys.length) {
                res.json(counts); // Send counts as JSON
            }
        });
    });
});



















app.post('/release-donation', (req, res) => {
    const { bloodUnitID, approvedRequestID } = req.body;

    // Validate required fields
    if (!bloodUnitID || !approvedRequestID) {
        console.error("Missing required fields:", { bloodUnitID, approvedRequestID });
        return res.status(400).json({ success: false, error: "Missing required data" });
    }

    console.log("Received Blood Unit ID:", bloodUnitID);
    console.log("Received Approved Request ID:", approvedRequestID);

    // Fetch the blood unit from trial5 table
    db.get("SELECT * FROM trial5 WHERE id = ?", [bloodUnitID], (err, bloodUnit) => {
        if (err) {
            console.error("Error fetching blood unit:", err.message);
            return res.status(500).json({ success: false, error: "Failed to fetch blood unit" });
        }

        if (!bloodUnit) {
            console.error("Blood unit not found for ID:", bloodUnitID);
            return res.status(404).json({ success: false, error: "Blood unit not found" });
        }

        console.log("Fetched blood unit:", bloodUnit);

        // Fetch the approved request from approved_requests table
        db.get("SELECT * FROM approved_requests WHERE id = ?", [approvedRequestID], (err, approvedRequest) => {
            if (err) {
                console.error("Error fetching approved request:", err.message);
                return res.status(500).json({ success: false, error: "Failed to fetch approved request" });
            }

            if (!approvedRequest) {
                console.error("Approved request not found for ID:", approvedRequestID);
                return res.status(404).json({ success: false, error: "Approved request not found" });
            }

            console.log("Fetched approved request:", approvedRequest);

            // Check blood group match (as in the original code)
            if (bloodUnit.bloodGroup !== approvedRequest.bloodType) {
                console.error("Blood group mismatch. Blood Unit Blood Group:", bloodUnit.bloodGroup, "Approved Request Blood Type:", approvedRequest.bloodType);
                return res.status(400).json({ success: false, error: "Blood group mismatch" });
            }

            console.log("Blood group matched! Proceeding to release donation...");

            db.serialize(() => {
                db.run("BEGIN TRANSACTION");

                // Delete from trial5
                db.run("DELETE FROM trial5 WHERE id = ?", [bloodUnitID], (err) => {
                    if (err) {
                        db.run("ROLLBACK");
                        console.error("Error deleting blood unit from trial5:", err.message);
                        return res.status(500).json({ success: false, error: "Failed to delete blood unit" });
                    }

                    console.log("Deleted blood unit from trial5 with ID:", bloodUnitID);

                    // Delete from approved_requests
                    db.run("DELETE FROM approved_requests WHERE id = ?", [approvedRequestID], (err) => {
                        if (err) {
                            db.run("ROLLBACK");
                            console.error("Error deleting approved request:", err.message);
                            return res.status(500).json({ success: false, error: "Failed to delete approved request" });
                        }

                        console.log("Deleted approved request from approved_requests with ID:", approvedRequestID);

                        // Insert into clearedRequests
                        console.log("Inserting into clearedRequests...");

                        db.run(
                            `INSERT INTO clearedRequests 
                            (bloodUnitID, bloodGroup, donationType, expirationDate, recipientName, recipientBloodType, hospital, doctor, approvedDate, releaseDate) 
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [
                                bloodUnit.id,
                                bloodUnit.bloodGroup, // Use bloodGroup from trial5
                                bloodUnit.donationType,
                                bloodUnit.donationDate, // Assuming donationDate acts as the expiration date
                                approvedRequest.recipientName,
                                approvedRequest.bloodType, // Use bloodType from approved_requests
                                approvedRequest.hospital,
                                approvedRequest.doctor,
                                approvedRequest.approvedDate,
                                new Date().toISOString()
                            ],
                            (err) => {
                                if (err) {
                                    db.run("ROLLBACK");
                                    console.error("Error inserting into clearedRequests:", err.message);
                                    return res.status(500).json({ success: false, error: "Failed to insert cleared request" });
                                }

                                db.run("COMMIT", () => {
                                    console.log("Donation successfully released and recorded.");
                                    res.json({ success: true, message: "Donation successfully released and recorded" });
                                });
                            }
                        );
                    });
                });
            });
        });
    });
});
















// Create Consent Table (if it doesn't already exist)
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS consent_forms (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            consent TEXT NOT NULL,
            confirmation TEXT NOT NULL,
            donor_signature TEXT NOT NULL,
            donation_date TEXT NOT NULL
        )
    `, (err) => {
        if (err) {
            console.error('❌ Error creating consent table:', err.message);
        } else {
            console.log('✅ Consent table created or already exists.');
        }
    });
});

// Route to display `main.ejs` with the consent list
app.get('/main', async (req, res) => {
    try {
        db.all(`SELECT * FROM consent_forms`, [], (err, rows) => {
            if (err) {
                console.error('❌ Error fetching consent data:', err.message);
                return res.status(500).json({ error: 'Database error while fetching consent data' });
            }
            res.render('main', { consentList: rows });
        });
    } catch (error) {
        console.error('❌ Unexpected error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Handle form submission and save to database (AJAX-friendly)
app.post('/submit-consent', async (req, res) => {
    const { consent, confirmation, donor_signature, donation_date } = req.body;

    // Validate input
    if (!consent || !confirmation || !donor_signature || !donation_date) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    try {
        db.run(
            `INSERT INTO consent_forms (consent, confirmation, donor_signature, donation_date) VALUES (?, ?, ?, ?)`,
            [consent, confirmation, donor_signature, donation_date],
            function (err) {
                if (err) {
                    console.error('❌ Error inserting consent data:', err.message);
                    return res.status(500).json({ error: 'Failed to submit consent form' });
                }
                console.log('✅ Consent form submitted successfully');
                res.json({ success: true, message: 'Consent form submitted successfully!' });
            }
        );
    } catch (error) {
        console.error('❌ Unexpected error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});













// Create Events Table (if it doesn't already exist)
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS blood_donation_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_name TEXT NOT NULL,
            event_date TEXT NOT NULL,
            location TEXT NOT NULL,
            description TEXT NOT NULL
        )
    `, (err) => {
        if (err) {
            console.error('❌ Error creating events table:', err.message);
        } else {
            console.log('✅ Events table is ready.');
        }
    });
});

// Route to display `main.ejs` with the list of events and consent forms
app.get('/main', (req, res) => {
    db.all(`SELECT * FROM blood_donation_events`, [], (err, eventRows) => {
        if (err) {
            console.error('❌ Error fetching events:', err.message);
            return res.status(500).json({ error: 'Database error while fetching events' });
        }

        db.all(`SELECT * FROM consent_forms`, [], (err, consentRows) => {
            if (err) {
                console.error('❌ Error fetching consent data:', err.message);
                return res.status(500).json({ error: 'Database error while fetching consent data' });
            }

            res.render('main', { eventsList: eventRows, consentList: consentRows });
        });
    });
});

// Handle Event Creation (AJAX-friendly)
app.post('/create-event', (req, res) => {
    const { event_name, event_date, location, description } = req.body;

    // Validate input
    if (!event_name || !event_date || !location || !description) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    // Insert event into the database
    db.run(
        `INSERT INTO blood_donation_events (event_name, event_date, location, description) VALUES (?, ?, ?, ?)`,
        [event_name, event_date, location, description],
        function (err) {
            if (err) {
                console.error('❌ Error inserting event:', err.message);
                return res.status(500).json({ error: 'Failed to create event' });
            }

            console.log(`✅ Event "${event_name}" created successfully.`);
            res.json({ success: true, message: 'Event created successfully!' });
        }
    );
});

// Fetch all events (API for frontend)
app.get('/api/events', (req, res) => {
    db.all(`SELECT * FROM blood_donation_events ORDER BY event_date ASC`, [], (err, rows) => {
        if (err) {
            console.error('❌ Error fetching events:', err.message);
            return res.status(500).json({ error: 'Database error while fetching events' });
        }

        res.json(rows);
    });
});














// Common function to handle user login
const handleLogin = (req, res, role = '') => {
    const { email, password } = req.body;

    // Adjust the query based on whether we are searching for a specific role (e.g., Regional Manager)
    const query = role ? 'SELECT * FROM userz WHERE email = ? AND role = ?' : 'SELECT * FROM userz WHERE email = ?';
    const params = role ? [email, role] : [email];

    db.get(query, params, (err, user) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error. Try again later.' });
        }

        // Check if user exists and validate the password
        if (!user || user.password !== password) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        // Respond with the user information including role, region, and hospital
        res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                role: role || user.role, // Ensure role is set for users and regional managers
                region: user.region,     // Include region in the response
                hospital: user.hospital  // Include hospital in the response
            }
        });
    });
};

// Route for rendering users (avoid redundancy in DB query)
app.get('/usez', (req, res) => {
    db.all('SELECT * FROM userz', (err, rows) => {
        if (err) {
            console.error('Error fetching data:', err);
            return res.status(500).send('Database error');
        }
        res.render('usez', { userz: rows });
    });
});

// Render Login Page
app.get('/', (req, res) => {
    res.render('index', { session: req.session, error: null });
});

// Handle User Login (No need to repeat logic for password check)
app.post('/login', (req, res) => {
    handleLogin(req, res); // For regular user login
});

// Handle Regional Manager Login (Same logic as user login but with role "Regional Manager")
app.post('/regman-login', (req, res) => {
    handleLogin(req, res, 'Regional Manager'); // For regional manager login
});

// Protected Dashboard Route for Regular Users
app.get('/main', (req, res) => {
    // Client-side will verify user role
    res.render('main');
});

// Protected Dashboard Route for Regional Manager
app.get('/regman', (req, res) => {
    // Client-side will verify user role
    res.render('regman');
});








app.get('/logout', (req, res) => {
    // Destroy the session (if using sessions)
    req.session.destroy((err) => {
        if (err) {
            console.error('Session destroy error:', err);
            return res.status(500).json({ error: 'Failed to logout. Try again later.' });
        }
        
        // Redirect to the login page
        res.redirect('/');  // Assuming / is your login page route
    });
});














// Route to display `complete.ejs` with `cashierclears` records
app.get('/complete', (req, res) => {
    db.all(`SELECT * FROM cashierclears`, [], (err, rows) => {
        if (err) {
            console.error('❌ Error fetching data from cashierclears:', err.message);
            return res.status(500).json({ error: 'Database error while fetching completed requests' });
        }

        res.render('complete', { completedRequests: rows });
    });
});




















db.run(`CREATE TABLE IF NOT EXISTS userz (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prefix TEXT,
    firstName TEXT,
    lastName TEXT,
    email TEXT,
    country TEXT,
    region TEXT,
    hospital TEXT,
    role TEXT,
    password TEXT
)`);







app.get('/main', (req, res) => {
    const userId = req.session ? req.session.userId : null; // Ensure session exists

    if (!userId) {
        return res.redirect('/login'); // Redirect to login if not authenticated
    }

    db.get('SELECT * FROM userz WHERE id = ?', [userId], (err, user) => {
        if (err) {
            console.error('Error fetching user:', err);
            return res.status(500).send('Database error');
        }

        if (!user) {
            return res.redirect('/login'); // Redirect if user not found
        }

        res.render('main', { user }); // Pass user object to main.ejs
    });
});










// Handle new user registration
app.post('/register', (req, res) => {
    const { prefix, firstName, lastName, email, country, region, hospital, role, password } = req.body;

    db.run(
        'INSERT INTO userz (prefix, firstName, lastName, email, country, region, hospital, role, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [prefix, firstName, lastName, email, country, region, hospital, role, password],
        (err) => {
            if (err) {
                console.error(err);
                res.status(500).send('Failed to register user');
            } else {
                res.redirect('/');
            }
        }
    );
});


























app.get("/inventory", (req, res) => {
    // Fetch donor data from trial5 table
    db.all("SELECT * FROM trial5", (err, trial5) => {
        if (err) {
            console.error("Error fetching trial5 data:", err.message);
            return res.status(500).send("Failed to fetch trial5 data");
        }

        // Fetch approved requests data from approved_requests table
        db.all("SELECT * FROM approved_requests", (err, approvedRequests) => {
            if (err) {
                console.error("Error fetching approved requests:", err.message);
                return res.status(500).send("Failed to fetch approved requests");
            }

            // Fetch cleared donations data from clearedRequests table
            db.all("SELECT * FROM clearedRequests", (err, clearedRequests) => {
                if (err) {
                    console.error("Error fetching cleared donations:", err.message);
                    return res.status(500).send("Failed to fetch cleared donations");
                }

                // Render the inventory page and pass all the data to the template
                res.render("inventory", { trial5, approvedRequests, clearedRequests });
            });
        });
    });
});







app.post('/release-donation', (req, res) => {
    const { bloodUnitID, approvedRequestID } = req.body;

    // Validate required fields
    if (!bloodUnitID || !approvedRequestID) {
        console.error("Missing required fields:", { bloodUnitID, approvedRequestID });
        return res.status(400).json({ success: false, error: "Missing required data" });
    }

    console.log("Received Blood Unit ID:", bloodUnitID);
    console.log("Received Approved Request ID:", approvedRequestID);

    // Fetch the blood unit from trial5 table using the id (primary key)
    db.get("SELECT * FROM trial5 WHERE id = ?", [bloodUnitID], (err, bloodUnit) => {
        if (err) {
            console.error("Error fetching blood unit:", err.message);
            return res.status(500).json({ success: false, error: "Failed to fetch blood unit" });
        }

        if (!bloodUnit) {
            console.error("Blood unit not found for ID:", bloodUnitID);
            return res.status(404).json({ success: false, error: "Blood unit not found" });
        }

        console.log("Fetched blood unit:", bloodUnit);

        // Fetch the approved request from approved_requests table
        db.get("SELECT * FROM approved_requests WHERE id = ?", [approvedRequestID], (err, approvedRequest) => {
            if (err) {
                console.error("Error fetching approved request:", err.message);
                return res.status(500).json({ success: false, error: "Failed to fetch approved request" });
            }

            if (!approvedRequest) {
                console.error("Approved request not found for ID:", approvedRequestID);
                return res.status(404).json({ success: false, error: "Approved request not found" });
            }

            console.log("Fetched approved request:", approvedRequest);

            // Check blood group match
            if (bloodUnit.bloodGroup !== approvedRequest.bloodType) {
                console.error("Blood group mismatch. Blood Unit Blood Group:", bloodUnit.bloodGroup, "Approved Request Blood Type:", approvedRequest.bloodType);
                return res.status(400).json({ success: false, error: "Blood group mismatch" });
            }

            console.log("Proceeding to release donation...");

            db.serialize(() => {
                db.run("BEGIN TRANSACTION");

                // Delete from trial5
                db.run("DELETE FROM trial5 WHERE id = ?", [bloodUnitID], (err) => {
                    if (err) {
                        db.run("ROLLBACK");
                        console.error("Error deleting blood unit from trial5:", err.message);
                        return res.status(500).json({ success: false, error: "Failed to delete blood unit" });
                    }

                    console.log("Deleted blood unit from trial5 with ID:", bloodUnitID);

                    // Delete from approved_requests
                    db.run("DELETE FROM approved_requests WHERE id = ?", [approvedRequestID], (err) => {
                        if (err) {
                            db.run("ROLLBACK");
                            console.error("Error deleting approved request:", err.message);
                            return res.status(500).json({ success: false, error: "Failed to delete approved request" });
                        }

                        console.log("Deleted approved request from approved_requests with ID:", approvedRequestID);

                        // Insert into clearedRequests
                        console.log("Inserting into clearedRequests with data:", {
                            bloodUnitID: bloodUnit.id,
                            bloodGroup: bloodUnit.bloodGroup,
                            donationType: bloodUnit.donationType,
                            expirationDate: bloodUnit.expirationDate,
                            recipientName: approvedRequest.recipientName,
                            recipientBloodType: approvedRequest.recipientBloodType,
                            hospital: approvedRequest.hospital,
                            doctor: approvedRequest.doctor,
                            approvedDate: approvedRequest.approvedDate,
                            releaseDate: new Date().toISOString()
                        });

                        db.run(
                            `INSERT INTO clearedRequests 
                            (bloodUnitID, bloodGroup, donationType, expirationDate, recipientName, recipientBloodType, hospital, doctor, approvedDate, releaseDate) 
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [
                                bloodUnit.id,
                                bloodUnit.bloodGroup,
                                bloodUnit.donationType,
                                bloodUnit.expirationDate,
                                approvedRequest.recipientName,
                                approvedRequest.recipientBloodType,
                                approvedRequest.hospital,
                                approvedRequest.doctor,
                                approvedRequest.approvedDate,
                                new Date().toISOString() // current timestamp for releaseDate
                            ],
                            (err) => {
                                if (err) {
                                    db.run("ROLLBACK");
                                    console.error("Error inserting into clearedRequests:", err.message);
                                    return res.status(500).json({ success: false, error: "Failed to insert cleared request" });
                                }

                                db.run("COMMIT", () => {
                                    console.log("Donation successfully released and recorded.");
                                    res.json({ success: true, message: "Donation successfully released and recorded" });
                                });
                            }
                        );
                    });
                });
            });
        });
    });
});


































// Endpoint to get blood group counts
app.get('/blood-group-counts', (req, res) => {
    const query = `
        SELECT bloodGroup, COUNT(*) AS count 
        FROM trial5 
        GROUP BY bloodGroup
    `;

    db.all(query, (err, rows) => {
        if (err) {
            console.error("Error fetching blood group counts:", err.message);
            return res.status(500).send("Error fetching blood group counts.");
        }

        const bloodGroupCounts = {};
        rows.forEach(row => {
            bloodGroupCounts[row.bloodGroup] = row.count;
        });

        res.json(bloodGroupCounts);
    });
});

// Endpoint to get donation trends over time
app.get('/donation-trend-data', (req, res) => {
    const query = `
        SELECT donationDate, COUNT(*) AS count 
        FROM trial5 
        GROUP BY donationDate
        ORDER BY donationDate
    `;

    db.all(query, (err, rows) => {
        if (err) {
            console.error("Error fetching donation trend data:", err.message);
            return res.status(500).send("Error fetching donation trend data.");
        }

        const donationTrends = {};
        rows.forEach(row => {
            donationTrends[row.donationDate] = row.count;
        });

        res.json(donationTrends);
    });
});

// Endpoint to get donation volume trends over time
app.get('/donation-volume-data', (req, res) => {
    const query = `
        SELECT donationDate, SUM(donationVolume) AS totalVolume
        FROM trial5 
        GROUP BY donationDate
        ORDER BY donationDate
    `;

    db.all(query, (err, rows) => {
        if (err) {
            console.error("Error fetching donation volume data:", err.message);
            return res.status(500).send("Error fetching donation volume data.");
        }

        const donationVolumes = {};
        rows.forEach(row => {
            donationVolumes[row.donationDate] = row.totalVolume || 0;
        });

        res.json(donationVolumes);
    });
});




























// Route to fetch data from trial5 and render the page
app.get('/bank', (req, res) => {
    const query = `
        SELECT donationID, bloodGroup, rhesusFactor, donationVolume, 
               hemoglobinLevel, donationType, donationDate, 
               submissionDate, dateAdded, notes 
        FROM trial5
    `;

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).send('Internal Server Error');
        }

        res.render('bank', { trial5Records: rows });
    });
});









// Create `cashierclears` table if it doesn't exist
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS cashierclears (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bloodUnitID INTEGER NOT NULL,
            bloodGroup TEXT NOT NULL,
            donationType TEXT NOT NULL,
            expirationDate TEXT NOT NULL,
            recipientName TEXT NOT NULL,
            recipientBloodType TEXT NOT NULL,
            hospital TEXT NOT NULL,
            doctor TEXT NOT NULL,
            approvedDate TEXT NOT NULL,
            releaseDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) {
            console.error('❌ Error creating cashierclears table:', err.message);
        } else {
            console.log('✅ cashierclears table created or already exists.');
        }
    });
});

// Route to display `cashier.ejs` with both `cashierclears` and `clearedRequests`
app.get('/cashier', (req, res) => {
    db.all(`SELECT * FROM clearedRequests`, [], (err, clearedRows) => {
        if (err) {
            console.error('❌ Error fetching data from clearedRequests:', err.message);
            return res.status(500).json({ error: 'Database error while fetching cleared requests' });
        }

        db.all(`SELECT * FROM cashierclears`, [], (err, cashierRows) => {
            if (err) {
                console.error('❌ Error fetching data from cashierclears:', err.message);
                return res.status(500).json({ error: 'Database error while fetching cashier records' });
            }

            res.render('cashier', { clearedRequests: clearedRows, cashierRecords: cashierRows });
        });
    });
});

// Route to move record from `clearedRequests` to `cashierclears`
app.post('/confirm-cashier/:id', (req, res) => {
    const recordId = req.params.id;

    db.get(`SELECT * FROM clearedRequests WHERE id = ?`, [recordId], (err, row) => {
        if (err || !row) {
            console.error('❌ Error retrieving record:', err?.message || 'Record not found');
            return res.status(500).json({ error: 'Error retrieving record' });
        }

        db.run(`
            INSERT INTO cashierclears (bloodUnitID, bloodGroup, donationType, expirationDate, recipientName, recipientBloodType, hospital, doctor, approvedDate)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            row.bloodUnitID, row.bloodGroup, row.donationType, row.expirationDate,
            row.recipientName, row.recipientBloodType, row.hospital, row.doctor, row.approvedDate
        ], (insertErr) => {
            if (insertErr) {
                console.error('❌ Error inserting record into cashierclears:', insertErr.message);
                return res.status(500).json({ error: 'Error moving record' });
            }

            db.run(`DELETE FROM clearedRequests WHERE id = ?`, [recordId], (deleteErr) => {
                if (deleteErr) {
                    console.error('❌ Error deleting record from clearedRequests:', deleteErr.message);
                    return res.status(500).json({ error: 'Error deleting record' });
                }
                console.log('✅ Record moved successfully to cashierclears');
                res.redirect('/cashier');  // 🚀 Redirect back to the same page
            });
        });
    });
});









app.get('/main', (req, res) => {
    // Query to get all records from the trial7 table
    db.all("SELECT * FROM trial7", [], (err, rows) => {
        if (err) {
            console.error(err);
            res.render("main", { records: [] }); // Just pass records to the view
        } else {
            res.render("main", { records: rows }); // Only pass records to the view
        }
    });
});
















db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS clearedRequests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bloodUnitID INTEGER NOT NULL,
            bloodGroup TEXT NOT NULL,
            donationType TEXT NOT NULL,
            expirationDate TEXT NOT NULL,
            recipientName TEXT NOT NULL,
            recipientBloodType TEXT NOT NULL,
            hospital TEXT NOT NULL,
            doctor TEXT NOT NULL,
            approvedDate TEXT NOT NULL,
            releaseDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
});


















db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS trial5 (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            donationID TEXT NOT NULL,
            lastName TEXT NOT NULL,
            firstName TEXT NOT NULL,
            telephone TEXT NOT NULL,
            dob TEXT NOT NULL,
            age INTEGER NOT NULL,
            residence TEXT NOT NULL,
            donorType TEXT NOT NULL,
            submissionDate TEXT,
            bloodGroup TEXT NOT NULL,
            rhesusFactor TEXT NOT NULL,
            donationVolume INTEGER NOT NULL,
            hemoglobinLevel REAL NOT NULL,
            donationType TEXT NOT NULL,
            donationDate TEXT NOT NULL,
            hivTest TEXT NOT NULL,
            hbsAgTest TEXT NOT NULL,
            hcvTest TEXT NOT NULL,
            syphilisTest TEXT NOT NULL,
            otherTests TEXT NOT NULL,
            notes TEXT,
            dateAdded TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
});
// Helper function to generate a unique donation ID
function generateDonationId(callback) {
    db.get("SELECT COUNT(*) AS count FROM trial5", (err, row) => {
        if (err) {
            console.error("Error generating donation ID:", err.message);
            callback(null);
        } else {
            const count = row.count + 1;
            const donationId = `DON${String(count).padStart(5, '0')}`;
            callback(donationId);
        }
    });
}

// Route to render the test page with both tables
app.get('/test', (req, res) => {
    db.serialize(() => {
        db.all("SELECT * FROM trial4", (err, trial4Records) => {
            if (err) {
                console.error("Error retrieving trial4 records:", err.message);
                return res.status(500).send("Error retrieving trial4 records.");
            }

            db.all("SELECT * FROM trial5", (err, trial5Records) => {
                if (err) {
                    console.error("Error retrieving trial5 records:", err.message);
                    return res.status(500).send("Error retrieving trial5 records.");
                }

                // Render the test page with both sets of records
                res.render('test', { trial4Records, trial5Records });
            });
        });
    });
});

// Route to handle adding a record to trial5
app.post('/add-to-trial5', (req, res) => {
    const { recordId, hivTest, hbsAgTest, hcvTest, syphilisTest, otherTests, notes } = req.body;

    // Fetch donor details from trial4
    db.get("SELECT * FROM trial4 WHERE id = ?", [recordId], (err, donor) => {
        if (err) {
            console.error("Error retrieving donor details:", err.message);
            return res.status(500).send("Error retrieving donor details.");
        }

        if (!donor) {
            return res.status(404).send("Donor not found.");
        }

        // Generate donation ID and insert into trial5
        generateDonationId((donationID) => {
            if (!donationID) {
                return res.status(500).send("Error generating donation ID.");
            }

            db.run(`
                INSERT INTO trial5 (
                    donationID, lastName, firstName, telephone, dob, age, residence, donorType,
                    submissionDate, bloodGroup, rhesusFactor, donationVolume, hemoglobinLevel, 
                    donationType, donationDate, hivTest, hbsAgTest, hcvTest, syphilisTest, 
                    otherTests, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                donationID, donor.lastName, donor.firstName, donor.telephone, donor.dob, donor.age,
                donor.residence, donor.donorType, donor.submissionDate, donor.bloodGroup, donor.rhesusFactor,
                donor.donationVolume, donor.hemoglobinLevel, donor.donationType, donor.donationDate,
                hivTest, hbsAgTest, hcvTest, syphilisTest, otherTests, notes || ""
            ], (err) => {
                if (err) {
                    console.error("Error adding record to trial5:", err.message);
                    return res.status(500).send("Error adding record to trial5.");
                } else {
                    console.log(`Donation confirmed with ID: ${donationID}`);
                    res.redirect('/test');
                }
            });
        });
    });
});


                









// Ensure trial7 table exists
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS trial7 (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            donationID TEXT NOT NULL,
            residence TEXT NOT NULL,
            donorType TEXT NOT NULL,
            submissionDate TEXT NOT NULL,
            bloodGroup TEXT NOT NULL,
            donationVolume TEXT NOT NULL,
            donationType TEXT NOT NULL,
            donationDate TEXT NOT NULL,
            deniedBy TEXT NOT NULL,
            reasonForDiscard TEXT NOT NULL,
            status TEXT NOT NULL,
            expirationDate TEXT NOT NULL,
            notes TEXT
        )
    `);
});

// Route to render discard.ejs
app.get('/discard', (req, res) => {
    db.serialize(() => {
        // Fetch records from trial5 where tests are positive (marked for discard)
        db.all(`
            SELECT * FROM trial5
            WHERE hivTest = 'Positive' OR hbsAgTest = 'Positive' OR 
                  hcvTest = 'Positive' OR syphilisTest = 'Positive' OR 
                  otherTests = 'Positive'
        `, (err, trial5Records) => {
            if (err) {
                console.error("Error fetching trial5 records:", err.message);
                return res.status(500).send("Error fetching pending discard records.");
            }

            // Fetch records already discarded (from trial7)
            db.all(`SELECT * FROM trial7`, (err, trial7Records) => {
                if (err) {
                    console.error("Error fetching trial7 records:", err.message);
                    return res.status(500).send("Error fetching discarded records.");
                }

                // Render discard.ejs with both pending and discarded records
                res.render('discard', { trial5Records, trial7Records });
            });
        });
    });
});

// Route to handle confirming discard
app.post('/confirm-discard', (req, res) => {
    const { id, deniedBy, reasonForDiscard } = req.body;

    if (!id || !deniedBy || !reasonForDiscard) {
        return res.status(400).send("All fields are required.");
    }

    db.serialize(() => {
        // Get the record from trial5
        db.get(`SELECT * FROM trial5 WHERE id = ?`, [id], (err, record) => {
            if (err || !record) {
                console.error("Error fetching donation record:", err?.message);
                return res.status(500).send("Error retrieving donation record.");
            }

            const expirationDate = new Date(new Date(record.donationDate).getTime() + 42 * 24 * 60 * 60 * 1000)
                .toISOString().split('T')[0];

            // Insert into trial7
            db.run(`
                INSERT INTO trial7 (
                    donationID, residence, donorType, submissionDate, bloodGroup,
                    donationVolume, donationType, donationDate, deniedBy,
                    reasonForDiscard, status, expirationDate, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                record.donationID, record.residence, record.donorType, record.submissionDate,
                record.bloodGroup, record.donationVolume, record.donationType, record.donationDate,
                deniedBy, reasonForDiscard, "Discarded", expirationDate, record.notes
            ], (err) => {
                if (err) {
                    console.error("Error inserting into trial7:", err.message);
                    return res.status(500).send("Error confirming discard.");
                }

                // Delete from trial5
                db.run(`DELETE FROM trial5 WHERE id = ?`, [id], (err) => {
                    if (err) {
                        console.error("Error deleting from trial5:", err.message);
                        return res.status(500).send("Error removing from pending discard list.");
                    }
                    res.redirect('/discard');
                });
            });
        });
    });
});















// Function to calculate expiration date based on donation type
function calculateExpiry(donationDate, donationType) {
    const date = new Date(donationDate);
    let expiryDays;

    switch (donationType.toLowerCase()) {
        case 'whole blood': expiryDays = 35; break;
        case 'plasma': expiryDays = 365; break;
        case 'platelets': expiryDays = 5; break;
        default: expiryDays = 30;
    }

    date.setDate(date.getDate() + expiryDays);
    return date.toISOString().split('T')[0]; // Return as YYYY-MM-DD
}

// Ensure trial6 table exists
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS trial6 (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            donationID TEXT NOT NULL,
            residence TEXT NOT NULL,
            bloodGroup TEXT NOT NULL,
            donationType TEXT NOT NULL,
            status TEXT NOT NULL,
            expirationDate TEXT NOT NULL,
            notes TEXT,
            donationDate TEXT NOT NULL,
            deniedBy TEXT NOT NULL,
            reasonForDiscard TEXT NOT NULL,
            dateDiscarded TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
});

// Route to render discard.ejs
app.get('/discard', (req, res) => {
    db.serialize(() => {
        db.all(`
            SELECT 
                id, donationID, residence, bloodGroup, donationType, 
                hivTest, hbsAgTest, hcvTest, syphilisTest, otherTests, 
                donationDate, notes
            FROM trial5
        `, (err, trial5Records) => {
            if (err) {
                console.error("Error retrieving trial5 records:", err.message);
                return res.status(500).send("Error retrieving trial5 records.");
            }

            db.all(`SELECT * FROM trial6`, (err, trial6Records) => {
                if (err) {
                    console.error("Error retrieving trial6 records:", err.message);
                    return res.status(500).send("Error retrieving trial6 records.");
                }

                res.render('discard', { trial5Records, trial6Records });
            });
        });
    });
});

// Route to confirm discard
app.post('/confirm-discard', (req, res) => {
    const { id, deniedBy, reasonForDiscard } = req.body;

    if (!deniedBy || !reasonForDiscard) {
        return res.status(400).send("Denied By and Reason for Discard are required.");
    }

    db.serialize(() => {
        // Fetch the record from trial5
        db.get(`SELECT * FROM trial5 WHERE id = ?`, [id], (err, record) => {
            if (err) {
                console.error("Error retrieving record from trial5:", err.message);
                return res.status(500).send("Error retrieving record.");
            }

            if (!record) return res.status(404).send("Record not found.");

            // Determine status based on test results
            let status = [];
            if (record.hivTest === "Positive") status.push("HIV");
            if (record.hbsAgTest === "Positive") status.push("Hepatitis B");
            if (record.hcvTest === "Positive") status.push("Hepatitis C");
            if (record.syphilisTest === "Positive") status.push("Syphilis");
            if (record.otherTests === "Positive") status.push("Other");

            const expirationDate = calculateExpiry(record.donationDate, record.donationType);

            // Insert into trial6
            db.run(`
                INSERT INTO trial6 (
                    donationID, residence, bloodGroup, donationType, status, expirationDate,
                    notes, donationDate, deniedBy, reasonForDiscard
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                record.donationID, record.residence, record.bloodGroup, record.donationType,
                status.join(", ") || "Safe", expirationDate, record.notes || "N/A",
                record.donationDate, deniedBy, reasonForDiscard
            ], (err) => {
                if (err) {
                    console.error("Error inserting into trial6:", err.message);
                    return res.status(500).send("Error inserting into trial6.");
                }

                // Delete from trial5
                db.run(`DELETE FROM trial5 WHERE id = ?`, [id], (err) => {
                    if (err) {
                        console.error("Error deleting record from trial5:", err.message);
                        return res.status(500).send("Error deleting record.");
                    }

                    res.redirect('/discard');
                });
            });
        });
    });
});















app.get('/patient', (req, res) => {
    db.all('SELECT * FROM trial1 ORDER BY submissionDate DESC', [], (err, rows) => {
        if (err) {
            console.error('Error fetching patients:', err);
            return res.render('patient', { patients: [] });
        }
        console.log('Fetched patients:', rows); // Log the fetched data
        res.render('patient', { patients: rows });
    });
});











// Create the donorlist table
function createTable() {
    const query = `
        CREATE TABLE IF NOT EXISTS donorlist (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            lastName TEXT NOT NULL,
            firstName TEXT NOT NULL,
            telephone TEXT NOT NULL,
            dob TEXT NOT NULL,
            age INTEGER NOT NULL,
            residence TEXT NOT NULL,
            donorType TEXT NOT NULL,
            medicalProblems TEXT,
            medicalProblemsSpecify TEXT,
            pregnant TEXT,
            pregnancySpecify TEXT,
            cancerTreatment TEXT,
            cancerTreatmentSpecify TEXT,
            allergies TEXT,
            allergiesSpecify TEXT,
            chronicConditions TEXT,
            chronicConditionsSpecify TEXT,
            surgeries TEXT,
            surgeriesSpecify TEXT,
            bloodDisorder TEXT,
            bloodDisorderSpecify TEXT,
            medications TEXT,
            medicationsSpecify TEXT,
            organTransplant TEXT,
            organTransplantSpecify TEXT,
            breastfeeding TEXT,
            breastfeedingSpecify TEXT,
            stis TEXT,
            stisSpecify TEXT,
            hivContact TEXT,
            unwell TEXT,
            temperature REAL,
            bpSystolic TEXT,
            bpDiastolic TEXT,
            pulse INTEGER,
            respirationRate INTEGER,
            heartExamination TEXT,
            lungExamination TEXT,
            overallImpression TEXT,
            consent TEXT,
            infoAccuracy TEXT,
            signature TEXT,
            submissionDate TEXT
        )
    `;

    db.run(query, (err) => {
        if (err) {
            console.error('❌ Error creating table:', err.message);
        } else {
            console.log('✅ Table "donorlist" created or already exists.');
        }
    });
}

// Routes
app.get('/registration', (req, res) => {
    res.render('registration');
});

app.post('/submit-donor', async (req, res) => {
    const {
        lastName, firstName, telephone, dob, age, residence, donorType,
        medicalProblems, medicalProblemsSpecify, pregnant, pregnancySpecify,
        cancerTreatment, cancerTreatmentSpecify, allergies, allergiesSpecify,
        chronicConditions, chronicConditionsSpecify, surgeries, surgeriesSpecify,
        bloodDisorder, bloodDisorderSpecify, medications, medicationsSpecify,
        organTransplant, organTransplantSpecify, breastfeeding, breastfeedingSpecify,
        stis, stisSpecify, hivContact, unwell, temperature, bpSystolic, bpDiastolic,
        pulse, respirationRate, heartExamination, lungExamination, overallImpression,
        consent, infoAccuracy, signature, submissionDate
    } = req.body;

    try {
        // Insert into database
        const query = `
            INSERT INTO donorlist (
                lastName, firstName, telephone, dob, age, residence, donorType,
                medicalProblems, medicalProblemsSpecify, pregnant, pregnancySpecify,
                cancerTreatment, cancerTreatmentSpecify, allergies, allergiesSpecify,
                chronicConditions, chronicConditionsSpecify, surgeries, surgeriesSpecify,
                bloodDisorder, bloodDisorderSpecify, medications, medicationsSpecify,
                organTransplant, organTransplantSpecify, breastfeeding, breastfeedingSpecify,
                stis, stisSpecify, hivContact, unwell, temperature, bpSystolic, bpDiastolic,
                pulse, respirationRate, heartExamination, lungExamination, overallImpression,
                consent, infoAccuracy, signature, submissionDate
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const params = [
            lastName, firstName, telephone, dob, age, residence, donorType,
            medicalProblems, medicalProblemsSpecify, pregnant, pregnancySpecify,
            cancerTreatment, cancerTreatmentSpecify, allergies, allergiesSpecify,
            chronicConditions, chronicConditionsSpecify, surgeries, surgeriesSpecify,
            bloodDisorder, bloodDisorderSpecify, medications, medicationsSpecify,
            organTransplant, organTransplantSpecify, breastfeeding, breastfeedingSpecify,
            stis, stisSpecify, hivContact, unwell, temperature, bpSystolic, bpDiastolic,
            pulse, respirationRate, heartExamination, lungExamination, overallImpression,
            consent, infoAccuracy, signature, submissionDate
        ];

        await db.run(query, params);
        res.send('🎉 Donor registered successfully!');
    } catch (err) {
        console.error('❌ Error registering donor:', err.message);
        res.status(500).send('❌ Error registering donor. Please try again.');
    }
});
// Route to fetch and display all donor responses
app.get('/responses', (req, res) => {
    // SQL query to fetch all data from the donorlist table
    const query = 'SELECT * FROM donorlist';

    // Execute the query
    db.all(query, [], (err, donors) => {
        if (err) {
            // Log the error and send a 500 response
            console.error('❌ Error fetching donors:', err.message);
            res.status(500).send('❌ Error fetching donor data. Please try again later.');
        } else if (!donors || donors.length === 0) {
            // If no donors are found, log a message and render the page with an empty list
            console.log('ℹ️ No donors found in the database.');
            res.render('responses', { donors: [] });
        } else {
            // Log the number of donors fetched and render the page with the donor data
            console.log(`✅ Fetched ${donors.length} donor(s) from the database.`);
            res.render('responses', { donors });
        }
    });
});











// Create tables
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS trial1 (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            lastName TEXT NOT NULL,
            firstName TEXT NOT NULL,
            telephone TEXT NOT NULL,
            dob TEXT NOT NULL,
            age INTEGER NOT NULL,
            residence TEXT NOT NULL,
            donorType TEXT NOT NULL,
            medicalProblems TEXT,
            medicalProblemsSpecify TEXT,
            pregnant TEXT,
            pregnancySpecify TEXT,
            cancerTreatment TEXT,
            cancerTreatmentSpecify TEXT,
            allergies TEXT,
            allergiesSpecify TEXT,
            chronicConditions TEXT,
            chronicConditionsSpecify TEXT,
            surgeries TEXT,
            surgeriesSpecify TEXT,
            bloodDisorder TEXT,
            bloodDisorderSpecify TEXT,
            medications TEXT,
            medicationsSpecify TEXT,
            organTransplant TEXT,
            organTransplantSpecify TEXT,
            breastfeeding TEXT,
            breastfeedingSpecify TEXT,
            stis TEXT,
            stisSpecify TEXT,
            hivContact TEXT,
            unwell TEXT,
            temperature REAL,
            bpSystolic TEXT,
            bpDiastolic TEXT,
            pulse INTEGER,
            respirationRate INTEGER,
            heartExamination TEXT,
            lungExamination TEXT,
            overallImpression TEXT,
            consent TEXT,
            infoAccuracy TEXT,
            signature TEXT,
            submissionDate TEXT,
            dateAdded TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS trial2 (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            donorId INTEGER,
            lastName TEXT NOT NULL,
            firstName TEXT NOT NULL,
            telephone TEXT NOT NULL,
            dob TEXT NOT NULL,
            age INTEGER NOT NULL,
            residence TEXT NOT NULL,
            donorType TEXT NOT NULL,
            medicalProblems TEXT,
            medicalProblemsSpecify TEXT,
            pregnant TEXT,
            pregnancySpecify TEXT,
            cancerTreatment TEXT,
            cancerTreatmentSpecify TEXT,
            allergies TEXT,
            allergiesSpecify TEXT,
            chronicConditions TEXT,
            chronicConditionsSpecify TEXT,
            surgeries TEXT,
            surgeriesSpecify TEXT,
            bloodDisorder TEXT,
            bloodDisorderSpecify TEXT,
            medications TEXT,
            medicationsSpecify TEXT,
            organTransplant TEXT,
            organTransplantSpecify TEXT,
            breastfeeding TEXT,
            breastfeedingSpecify TEXT,
            stis TEXT,
            stisSpecify TEXT,
            hivContact TEXT,
            unwell TEXT,
            temperature REAL,
            bpSystolic TEXT,
            bpDiastolic TEXT,
            pulse INTEGER,
            respirationRate INTEGER,
            heartExamination TEXT,
            lungExamination TEXT,
            overallImpression TEXT,
            consent TEXT,
            infoAccuracy TEXT,
            signature TEXT,
            submissionDate TEXT,
            startTime TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
});

// Route to render the donor page
app.get('/donor', (req, res) => {
    db.all('SELECT * FROM trial1', (err, pendingDonations) => {
        if (err) return res.status(500).send('Database error');

        db.all('SELECT * FROM trial2', (err, inProcessing) => {
            if (err) return res.status(500).send('Database error');

            res.render('donor', { pendingDonations, inProcessing });
        });
    });
});

// Add a new donor
app.post('/add-donor', (req, res) => {
    const {
        lastName, firstName, telephone, dob, age, residence, donorType,
        medicalProblems, medicalProblemsSpecify, pregnant, pregnancySpecify,
        cancerTreatment, cancerTreatmentSpecify, allergies, allergiesSpecify,
        chronicConditions, chronicConditionsSpecify, surgeries, surgeriesSpecify,
        bloodDisorder, bloodDisorderSpecify, medications, medicationsSpecify,
        organTransplant, organTransplantSpecify, breastfeeding, breastfeedingSpecify,
        stis, stisSpecify, hivContact, unwell, temperature, bpSystolic, bpDiastolic,
        pulse, respirationRate, heartExamination, lungExamination, overallImpression,
        consent, infoAccuracy, signature, submissionDate
    } = req.body;

    db.run(`
        INSERT INTO trial1 (
            lastName, firstName, telephone, dob, age, residence, donorType,
            medicalProblems, medicalProblemsSpecify, pregnant, pregnancySpecify,
            cancerTreatment, cancerTreatmentSpecify, allergies, allergiesSpecify,
            chronicConditions, chronicConditionsSpecify, surgeries, surgeriesSpecify,
            bloodDisorder, bloodDisorderSpecify, medications, medicationsSpecify,
            organTransplant, organTransplantSpecify, breastfeeding, breastfeedingSpecify,
            stis, stisSpecify, hivContact, unwell, temperature, bpSystolic, bpDiastolic,
            pulse, respirationRate, heartExamination, lungExamination, overallImpression,
            consent, infoAccuracy, signature, submissionDate
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
        lastName, firstName, telephone, dob, age, residence, donorType,
        medicalProblems, medicalProblemsSpecify, pregnant, pregnancySpecify,
        cancerTreatment, cancerTreatmentSpecify, allergies, allergiesSpecify,
        chronicConditions, chronicConditionsSpecify, surgeries, surgeriesSpecify,
        bloodDisorder, bloodDisorderSpecify, medications, medicationsSpecify,
        organTransplant, organTransplantSpecify, breastfeeding, breastfeedingSpecify,
        stis, stisSpecify, hivContact, unwell, temperature, bpSystolic, bpDiastolic,
        pulse, respirationRate, heartExamination, lungExamination, overallImpression,
        consent, infoAccuracy, signature, submissionDate
    ], (err) => {
        if (err) return res.status(500).send('Failed to add donor');
        res.redirect('/donor');
    });
});

// Start processing a donation
app.post('/process-donation', (req, res) => {
    const { id } = req.body;

    db.get('SELECT * FROM trial1 WHERE id = ?', [id], (err, donor) => {
        if (err || !donor) return res.status(404).send('Donor not found');

        db.run(`
            INSERT INTO trial2 (
                donorId, lastName, firstName, telephone, dob, age, residence, donorType,
                medicalProblems, medicalProblemsSpecify, pregnant, pregnancySpecify,
                cancerTreatment, cancerTreatmentSpecify, allergies, allergiesSpecify,
                chronicConditions, chronicConditionsSpecify, surgeries, surgeriesSpecify,
                bloodDisorder, bloodDisorderSpecify, medications, medicationsSpecify,
                organTransplant, organTransplantSpecify, breastfeeding, breastfeedingSpecify,
                stis, stisSpecify, hivContact, unwell, temperature, bpSystolic, bpDiastolic,
                pulse, respirationRate, heartExamination, lungExamination, overallImpression,
                consent, infoAccuracy, signature, submissionDate
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            donor.id, donor.lastName, donor.firstName, donor.telephone, donor.dob, donor.age, donor.residence, donor.donorType,
            donor.medicalProblems, donor.medicalProblemsSpecify, donor.pregnant, donor.pregnancySpecify,
            donor.cancerTreatment, donor.cancerTreatmentSpecify, donor.allergies, donor.allergiesSpecify,
            donor.chronicConditions, donor.chronicConditionsSpecify, donor.surgeries, donor.surgeriesSpecify,
            donor.bloodDisorder, donor.bloodDisorderSpecify, donor.medications, donor.medicationsSpecify,
            donor.organTransplant, donor.organTransplantSpecify, donor.breastfeeding, donor.breastfeedingSpecify,
            donor.stis, donor.stisSpecify, donor.hivContact, donor.unwell, donor.temperature, donor.bpSystolic, donor.bpDiastolic,
            donor.pulse, donor.respirationRate, donor.heartExamination, donor.lungExamination, donor.overallImpression,
            donor.consent, donor.infoAccuracy, donor.signature, donor.submissionDate
        ], () => {
            db.run('DELETE FROM trial1 WHERE id = ?', [id], () => {
                res.redirect('/donor');
            });
        });
    });
});

















// Helper function to calculate age
const calculateAge = (dob) => {
    if (!dob || isNaN(Date.parse(dob))) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    if (
        today.getMonth() < birthDate.getMonth() ||
        (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())
    ) {
        age--;
    }
    return age >= 0 ? age : null;
};















// Routes

// Home page
app.get("/", (req, res) => {
    // Fetch users from the database and pass them to the template
    db.all("SELECT * FROM users", (err, users) => {
        if (err) {
            console.error("Database error:", err.message);
            return res.status(500).send("Failed to fetch users");
        }
        res.rendes("index", { users });
    });
});











// Create tables if they don't exist
db.run(`
    CREATE TABLE IF NOT EXISTS requests (
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
        requestDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
`);

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
        approvedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
`);

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
        reason TEXT,
        deniedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
`);

// Approve a request
app.post("/approve-request", (req, res) => {
    const { requestId } = req.body;

    if (!requestId) {
        return res.status(400).send("Request ID is required.");
    }

    db.get("SELECT * FROM requests WHERE id = ?", [requestId], (err, request) => {
        if (err) {
            console.error("Error fetching request:", err.message);
            return res.status(500).send("Failed to fetch request.");
        }
        if (!request) {
            return res.status(404).send("Request not found.");
        }

        db.run(
            `INSERT INTO approved_requests (
                recipientName, dob, age, bloodType, units, gender, country, region, hospital, doctor, contactHospital, location
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                request.recipientName,
                request.dob,
                request.age,
                request.bloodType,
                request.units,
                request.gender,
                request.country,
                request.region,
                request.hospital,
                request.doctor,
                request.contactHospital,
                request.location,
            ],
            (insertErr) => {
                if (insertErr) {
                    console.error("Error approving request:", insertErr.message);
                    return res.status(500).send("Failed to approve request.");
                }

                db.run("DELETE FROM requests WHERE id = ?", [requestId], (deleteErr) => {
                    if (deleteErr) {
                        console.error("Error deleting approved request:", deleteErr.message);
                        return res.status(500).send("Failed to finalize approval.");
                    }
                    res.redirect("/denapp");
                });
            }
        );
    });
});

// Deny a request with one or more reasons
app.post("/deny-request", (req, res) => {
    const { requestId, reason } = req.body;

    if (!requestId) {
        return res.status(400).send("Request ID is required.");
    }
    if (!reason || (Array.isArray(reason) && reason.length === 0)) {
        return res.status(400).send("At least one denial reason is required.");
    }

    const reasonText = Array.isArray(reason) ? reason.join(", ") : reason;

    db.get("SELECT * FROM requests WHERE id = ?", [requestId], (err, request) => {
        if (err) {
            console.error("Error fetching request:", err.message);
            return res.status(500).send("Failed to fetch request.");
        }
        if (!request) {
            return res.status(404).send("Request not found.");
        }

        db.run(
            `INSERT INTO denied_requests (
                recipientName, dob, age, bloodType, units, gender, country, region, hospital, doctor, contactHospital, location, reason
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                request.recipientName,
                request.dob,
                request.age,
                request.bloodType,
                request.units,
                request.gender,
                request.country,
                request.region,
                request.hospital,
                request.doctor,
                request.contactHospital,
                request.location,
                reasonText,
            ],
            (insertErr) => {
                if (insertErr) {
                    console.error("Error denying request:", insertErr.message);
                    return res.status(500).send("Failed to deny request.");
                }

                db.run("DELETE FROM requests WHERE id = ?", [requestId], (deleteErr) => {
                    if (deleteErr) {
                        console.error("Error deleting denied request:", deleteErr.message);
                        return res.status(500).send("Failed to finalize denial.");
                    }
                    res.redirect("/denapp");
                });
            }
        );
    });
});

// Show approved and denied requests
app.get("/denapp", (req, res) => {
    db.all("SELECT * FROM approved_requests ORDER BY approvedDate DESC", (approveErr, approvedRequests) => {
        if (approveErr) {
            console.error("Error fetching approved requests:", approveErr.message);
            return res.status(500).send("Failed to fetch approved requests.");
        }

        db.all("SELECT * FROM denied_requests ORDER BY deniedDate DESC", (denyErr, deniedRequests) => {
            if (denyErr) {
                console.error("Error fetching denied requests:", denyErr.message);
                return res.status(500).send("Failed to fetch denied requests.");
            }

            res.render("denapp", { approvedRequests, deniedRequests });
        });
    });
});

// Show Blood Donation Request form
app.get("/request", (req, res) => {
    res.render("request");
});

// Handle donation request submission
app.post("/submit-request", (req, res) => {
    const {
        recipientName,
        dob,
        bloodType,
        units,
        gender,
        country,
        region,
        hospital,
        doctor,
        contactHospital,
        location,
    } = req.body;

    const age = calculateAge(dob);

    if (!recipientName || !dob || !bloodType || !units || !gender || !hospital || age === null) {
        return res.status(400).send("Invalid or missing fields");
    }

    db.run(
        `INSERT INTO requests (
            recipientName, dob, age, bloodType, units, gender, country, region, hospital, doctor, contactHospital, location
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [recipientName, dob, age, bloodType, units, gender, country, region, hospital, doctor, contactHospital, location],
        (err) => {
            if (err) {
                console.error("Database error:", err.message);
                return res.status(500).send("Failed to submit request");
            }
            res.redirect("/recentRequests");
        }
    );
});

// Show recent blood requests
app.get("/recentRequests", (req, res) => {
    db.all("SELECT * FROM requests ORDER BY requestDate DESC", (err, requests) => {
        if (err) {
            console.error("Database error:", err.message);
            return res.status(500).send("Failed to fetch requests");
        }
        res.render("recentRequests", { requests });
    });
});




// Route to show recent blood donation requests
app.get("/records", (req, res) => {
    db.all("SELECT * FROM requests ORDER BY requestDate DESC", (err, requests) => {
        if (err) {
            console.error("Database error:", err.message);
            return res.status(500).send("Failed to fetch requests.");
        }

        // Render the records.ejs page with the fetched requests data
        res.render("records", { requests });
    });
});













// Show donor responses
app.get("/responses", (req, res) => {
    db.all("SELECT * FROM donorregisters ORDER BY submission_date DESC", (err, donors) => {
        if (err) {
            console.error("Database error:", err.message);
            return res.status(500).send("Failed to fetch donor responses");
        }
        res.render("responses", { donors });
    });
});

// Create the donorregisters table
db.run(
    `CREATE TABLE IF NOT EXISTS donorregisters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        last_name TEXT NOT NULL,
        first_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        dob TEXT NOT NULL,
        age INTEGER NOT NULL,
        residence TEXT NOT NULL,
        donor_type TEXT NOT NULL,
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
        currently_unwell TEXT,
        overall_observation TEXT NOT NULL,
        temperature REAL NOT NULL,
        bp_systolic TEXT NOT NULL,
        bp_diastolic TEXT NOT NULL,
        pulse INTEGER NOT NULL,
        respiration_rate INTEGER NOT NULL,
        heart_examination TEXT NOT NULL,
        lung_examination TEXT NOT NULL,
        overall_impression TEXT NOT NULL,
        consent TEXT NOT NULL,
        confirm TEXT NOT NULL,
        signature TEXT NOT NULL,
        submission_date TEXT NOT NULL
    )`,
    (err) => {
        if (err) {
            console.error("Database error:", err.message);
        } else {
            console.log("Table 'donorregisters' created or already exists.");
        }
    }
);

// Route to render the questionnaire form
app.get("/questionnaire", (req, res) => {
    res.render("questionnaire");
});

// Handle form submission
app.post("/submit", (req, res) => {
    const {
        last_name,
        first_name,
        phone,
        dob,
        residence,
        donor_type,
        medical_problems,
        medical_details,
        pregnant,
        pregnancy_details,
        cancer,
        cancer_details,
        allergies,
        allergy_details,
        chronic_conditions,
        chronic_details,
        surgery,
        surgery_details,
        blood_disorder,
        blood_disorder_details,
        medications,
        medication_details,
        organ_transplant,
        transplant_details,
        breastfeeding,
        breastfeeding_details,
        sti,
        sti_details,
        contact_hiv,
        currently_unwell,
        overall_observation,
        temperature,
        bp_systolic,
        bp_diastolic,
        pulse,
        respiration_rate,
        heart_examination,
        lung_examination,
        overall_impression,
        consent,
        confirm,
        signature,
    } = req.body;

    const age = calculateAge(dob); // Ensure this function is defined
    const submission_date = new Date().toISOString().split("T")[0];

    if (
        !last_name || !first_name || !phone || !dob || !residence ||
        !donor_type || !consent || !confirm || !signature || age === null
    ) {
        return res.status(400).send("Invalid or missing fields");
    }

    db.run(
        `INSERT INTO donorregisters (
            last_name, first_name, phone, dob, age, residence, donor_type, medical_problems, medical_details, 
            pregnant, pregnancy_details, cancer, cancer_details, allergies, allergy_details, chronic_conditions, 
            chronic_details, surgery, surgery_details, blood_disorder, blood_disorder_details, medications, 
            medication_details, organ_transplant, transplant_details, breastfeeding, breastfeeding_details, 
            sti, sti_details, contact_hiv, currently_unwell, overall_observation, temperature, bp_systolic, 
            bp_diastolic, pulse, respiration_rate, heart_examination, lung_examination, overall_impression, 
            consent, confirm, signature, submission_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            last_name, first_name, phone, dob, age, residence, donor_type, medical_problems, medical_details,
            pregnant, pregnancy_details, cancer, cancer_details, allergies, allergy_details, chronic_conditions,
            chronic_details, surgery, surgery_details, blood_disorder, blood_disorder_details, medications,
            medication_details, organ_transplant, transplant_details, breastfeeding, breastfeeding_details,
            sti, sti_details, contact_hiv, currently_unwell, overall_observation, temperature, bp_systolic,
            bp_diastolic, pulse, respiration_rate, heart_examination, lung_examination, overall_impression,
            consent, confirm, signature, submission_date,
        ],
        (err) => {
            if (err) {
                console.error("Database error:", err.message);
                return res.status(500).send("Failed to submit donor questionnaire");
            }
            res.redirect("/responses");
        }
    );
});








// Function to fetch counts and grouped data
const fetchStatistics = async () => {
    return {
        requestsCount: await new Promise((resolve, reject) => {
            db.get("SELECT COUNT(*) as totalRequests FROM requests", (err, row) => {
                if (err) reject(err);
                else resolve(row || { totalRequests: 0 });
            });
        }),
        approvedCount: await new Promise((resolve, reject) => {
            db.get("SELECT COUNT(*) as totalApproved FROM approved_requests", (err, row) => {
                if (err) reject(err);
                else resolve(row || { totalApproved: 0 });
            });
        }),
        deniedCount: await new Promise((resolve, reject) => {
            db.get("SELECT COUNT(*) as totalDenied FROM denied_requests", (err, row) => {
                if (err) reject(err);
                else resolve(row || { totalDenied: 0 });
            });
        }),
        bloodTypeRequests: await new Promise((resolve, reject) => {
            db.all("SELECT bloodType, COUNT(*) as count FROM requests GROUP BY bloodType", (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        }),
        genderRequests: await new Promise((resolve, reject) => {
            db.all("SELECT gender, COUNT(*) as count FROM requests GROUP BY gender", (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        }),
        countryRequests: await new Promise((resolve, reject) => {
            db.all("SELECT country, COUNT(*) as count FROM requests GROUP BY country", (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        }),
        regionRequests: await new Promise((resolve, reject) => {
            db.all("SELECT region, COUNT(*) as count FROM requests GROUP BY region", (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        }),
        ageRequests: await new Promise((resolve, reject) => {
            db.all("SELECT age, COUNT(*) as count FROM requests GROUP BY age", (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        })
    };
};



// Reports page - show charts and stats
app.get("/reports", async (req, res) => {
    try {
        const stats = await fetchStatistics();
        
        // Render the reports.ejs page with the stats
        res.render("reports", {
            totalRequests: stats.requestsCount.totalRequests,
            totalApproved: stats.approvedCount.totalApproved,
            totalDenied: stats.deniedCount.totalDenied,
            bloodTypeRequests: stats.bloodTypeRequests,
            genderRequests: stats.genderRequests,
            countryRequests: stats.countryRequests,
            regionRequests: stats.regionRequests,
            ageRequests: stats.ageRequests,
        });
    } catch (err) {
        console.error("Error fetching data:", err.message);
        res.status(500).send("Failed to fetch statistics.");
    }
});






 // 404 error handler 
app.use((req, res) => { res.status(404).send("Page not found"); });

// Start the server 
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});



