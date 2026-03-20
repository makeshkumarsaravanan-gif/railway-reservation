🚆 Railway Reservation System (Node.js + MySQL + JWT)

A Full Stack Railway Reservation Web Application for booking train tickets online.

🛠️ Features

User Registration & Login (JWT Authentication)

Search Trains by Source, Destination, and Time

Select Seats (booked seats appear grey)

Enter Passenger Details

Make Payment (mock / integrated)

Booking Confirmation After Payment

Download Ticket PDF

🏗️ Tech Stack

Backend

Node.js

Express.js

MySQL

JWT (jsonwebtoken)

bcrypt

PDFKit

Frontend

HTML

Bootstrap 5

JavaScript (Fetch API)

📦 Installation & Setup
1️⃣ Clone the Repository
git clone https://github.com/yourusername/railway-reservation.git
cd railway-reservation
2️⃣ Install Dependencies
npm install
3️⃣ Configure Environment Variables

Create a .env file in the project root:

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=railway_reservation
JWT_SECRET=yourjwtsecret
PORT=5000
4️⃣ Database Setup
CREATE DATABASE railway_reservation;
USE railway_reservation;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE trains (
    id INT AUTO_INCREMENT PRIMARY KEY,
    train_name VARCHAR(150),
    source VARCHAR(100),
    destination VARCHAR(100),
    departure_time TIME,
    arrival_time TIME,
    price INT,
    total_seats INT
);

INSERT INTO trains (train_name, source, destination, departure_time, arrival_time, price, total_seats)
VALUES
('Chennai Express','Chennai','Coimbatore','06:00:00','13:00:00',450,100),
('Pandian Express','Chennai','Madurai','22:00:00','06:30:00',520,100),
('Cheran Express','Chennai','Coimbatore','23:00:00','06:00:00',500,100),
('Nilgiri Express','Chennai','Mettupalayam','21:00:00','06:00:00',550,100),
('Vaigai Express','Chennai','Madurai','13:40:00','21:00:00',480,100),
('Kovai Express','Chennai','Coimbatore','14:30:00','21:30:00',470,100);

CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    train_id INT,
    passenger_name VARCHAR(255),
    seats INT,
    seat_numbers VARCHAR(255),
    total_price INT,
    payment_method VARCHAR(50),
    pnr VARCHAR(20),
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (train_id) REFERENCES trains(id)
);
5️⃣ Start the Server
node app.js

Server will run at:

http://localhost:5000
6️⃣ Frontend

Open the client folder in your browser (or use Live Server extension):

login.html → User Login

register.html → User Registration

dashboard.html → Search trains, select seats, and book tickets

booking.html → Enter passenger details and proceed to payment

Note: Backend (app.js) must be running while using the frontend.

🔒 Authentication

JWT token stored in localStorage.

API requests require token in headers (Bearer Token).

⚡ API Examples

Get all trains:

GET http://localhost:5000/api/trains

Search trains:

GET http://localhost:5000/api/trains/search?source=Chennai&destination=Coimbatore&time=morning
📝 License

MIT License



# 🚂 Railway Reservation System (Full-Stack Web App)

Intha project oru complete **Railway Ticket Booking Portal**. Ithu user-ku oru smooth and interactive experience tharura maari design panni irukkaen.

## 🌟 Key Features (Project-oda mukhaya amsangal)

* **User Authentication**: User register panni, login panna mudiyum. JWT token moolama secure-ah handle panni irukkaen.
* **Live Train Search**: Source and Destination select panni, available trains-ah dashboard-la paarkalam.
* **Sleeper Coach Layout**: Real train coach maari (Lower, Middle, Upper, Side berths) layout design panni irukkaen. User-ae avangaluku pudicha seat-ah select pannikalam.
* **Passenger Management**: Multiple passengers-ku (Name, Age, Gender) details add panna mudiyum.
* **PNR Generation**: Payment success aana udanae unique PNR number generate aagum.
* **E-Ticket Download**: Book panna ticket-ah PDF format-la download panni save pannikalam.
* **Booking History**: "My Bookings" section-la user munnadi book panna ellaa tickets-ayum date-wise paarkalam.

## 🛠️ Tech Stack (Etha vachu senjaen?)

| Layer | Technology |
| :--- | :--- |
| **Frontend** | HTML5, CSS3, JavaScript (ES6+), Bootstrap 5 |
| **Icons** | Bootstrap Icons |
| **Backend** | Node.js, Express.js |
| **Database** | MySQL / MongoDB (Based on your backend) |
| **Auth** | JSON Web Tokens (JWT) & LocalStorage |



## 📂 Project Structure (File Details)

1.  `index.html`: Project-oda Welcome/Landing page.
2.  `register.html`: Puthu user account create panna.
3.  `login.html`: Existing user login panna.
4.  `dashboard.html`: Train search and selection page.
5.  `booking.html`: Seat selection (Coach Layout) & Passenger info.
6.  `payment.html`: Payment summary and PNR generation.
7.  `my-bookings.html`: User-oda ticket history page.

## 🚀 How to Run? (Eppadi run panrathu?)

1.  **Backend Start**: Terminal-la `node server.js` illa `npm start` kuduthu backend-ah run pannanum (Port: 5000).
2.  **Frontend**: `index.html`-ah browser-la open panna project ready!
3.  **Database**: Database server running-la irukura maari check pannikonga.

---
**Developed with ❤️ by makesh**


🚂 Railway Reservation System (Full-Stack Web App)

Intha project oru complete Online Railway Ticket Booking Portal. Ithu user registration-la irundhu, train search panni, seat select senju, PNR generate aagi ticket download panra varai full flow-ah handle pannum.
🌟 Key Features (Project-oda mukhaya amsangal)

    Secure Auth: User login/register panni JWT token moolama secure-ah handle panni irukkaen.

    Live Train Search: Source and Destination select panni, available trains-ah dashboard-la paarkalam.

    Sleeper Coach Layout: Real train coach maari (LB, MB, UB, SL, SU) layout design panni irukkaen.

    Passenger Management: Multiple passengers-ku (Name, Age, Gender) details add panna mudiyum.

    PNR & Ticket: Unique PNR generation and PDF Ticket download option sethu irukkaen.

    Booking History: "My Bookings" section-la user munnadi book panna tickets-ayum paarkalam.

🛠️ Tech Stack (Etha vachu senjaen?)
Layer	Technology
Frontend	HTML5, CSS3, JavaScript (ES6+), Bootstrap 5
Icons	Bootstrap Icons
Backend	Node.js, Express.js
Database	MySQL (Relational Database)
Auth	JSON Web Tokens (JWT) & LocalStorage
🗄️ Database Design (Schema)

Database-la intha 4 tables-ah nambi thaan project logic irukku. Intha SQL queries-ah run panni tables create pannikalam:
1. Users Table
SQL

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

2. Trains Table
SQL

CREATE TABLE trains (
    id INT PRIMARY KEY,
    train_name VARCHAR(100),
    source VARCHAR(50),
    destination VARCHAR(50),
    departure_time TIME,
    price INT,
    total_seats INT
);

3. Bookings Table (Main Ticket Table)
SQL

CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    train_id INT,
    pnr VARCHAR(20) UNIQUE,
    total_price INT,
    status VARCHAR(20) DEFAULT 'Success',
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (train_id) REFERENCES trains(id)
);

4. Passengers Table (Seat-wise Details)
SQL

CREATE TABLE passengers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT,
    passenger_name VARCHAR(100),
    age INT,
    gender VARCHAR(10),
    seat_number INT,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

📂 Project Structure (File Details)

    index.html: Landing page (Welcome screen).

    register.html / login.html: User security and access.

    dashboard.html: Train search logic and API integration.

    booking.html: Dynamic seat selection (Sleeper Layout).

    payment.html: Final review, PNR generation, and PDF download.

    my-bookings.html: Past trip details and ticket recovery.