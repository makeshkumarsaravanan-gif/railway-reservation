🚂 Railway Reservation System

A robust Full-Stack Web Application designed to streamline the train ticket booking process. This project provides a seamless user journey from train searching to E-Ticket generation.

🌐 Live Demo: https://railway-reservation-2vnm.onrender.com
🌟 Key Features

    Secure Authentication: User registration and login powered by JWT (JSON Web Tokens) and bcrypt password hashing.

    Dynamic Train Search: Real-time search functionality based on Source, Destination, and Timing.

    Interactive Seat Selection: A realistic Sleeper Coach Layout (Lower, Middle, Upper, and Side berths) where users can pick their preferred seats.

    Multi-Passenger Booking: Ability to add details (Name, Age, Gender) for multiple passengers in a single booking.

    PNR & Ticket Management: Unique PNR generation upon successful booking and PDF Ticket download capability using PDFKit.

    Booking History: A dedicated "My Bookings" section to track and manage past journeys.

🛠️ Tech Stack
Layer	Technology
Frontend	HTML5, CSS3, JavaScript (ES6+), Bootstrap 5
Backend	Node.js, Express.js
Database	MySQL
Authentication	JWT & LocalStorage
Utilities	PDFKit (Ticket Generation), Dotenv, Cors
📂 Project Structure
Plaintext

├── client/                # Frontend files (HTML, CSS, JS)
│   ├── index.html         # Landing Page
│   ├── login.html         # User Authentication
│   ├── dashboard.html     # Train Search & Results
│   ├── booking.html       # Seat Layout & Passenger Details
│   └── my-bookings.html   # User History
├── server/                # Backend Node.js API
│   ├── config/            # DB Connection
│   ├── routes/            # API Endpoints
│   └── app.js             # Server Entry Point
└── .env                   # Environment Variables

🚀 Installation & Setup

    Clone the Repository
    Bash

    git clone https://github.com/yourusername/railway-reservation.git
    cd railway-reservation

    Install Dependencies
    Bash

    npm install

    Database Configuration
    Create a MySQL database and run the schema provided in the database.sql file (or use the queries below):

        users: Stores credentials.

        trains: Stores route and pricing info.

        bookings: Main transaction table.

        passengers: Individual seat-wise details.

    Environment Variables
    Create a .env file in the root directory:
    Code snippet

    DB_HOST=localhost
    DB_USER=root
    DB_PASSWORD=yourpassword
    DB_NAME=railway_reservation
    JWT_SECRET=your_super_secret_key
    PORT=5000

    Run the Application
    Bash

    node app.js

    Access the app at http://localhost:5000.

🔒 Security Features

    Passwords are never stored in plain text (Bcrypt encryption).

    Protected routes ensure only logged-in users can book tickets.

    JWT tokens are verified for every sensitive API request.

Developed with ❤️ by Makesh