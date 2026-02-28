# 🧾 Bitespeed Identity Reconciliation API

This project is a solution to the Bitespeed Backend Task.

The API identifies and links customer contacts based on email and phone number.
If multiple records belong to the same person, they are merged under a single primary contact.

---

## 🚀 Live Deployment

Base URL:

https://bitespeed-task-r0k3.onrender.com

---

## 📌 API Endpoint

### POST /identify

This endpoint accepts an email and/or phone number and returns consolidated contact information.

---

## 📨 Request Format

Send a POST request to:

https://bitespeed-task-r0k3.onrender.com/identify

---

### Request Body (JSON)

json
{
  "email": "test@example.com",
  "phoneNumber": "1234567890"
}

---

## Sample Response

{
  "contact": {
    "primaryContactId": 1,
    "emails": [
      "test@example.com",
      "new@example.com"
    ],
    "phoneNumbers": [
      "1234567890",
      "9999999999"
    ],
    "secondaryContactIds": [
      2,
      3
    ]
  }
}

---


## How It Works

## If no matching contact exists:

* A new primary contact is created.

## If matching contacts exist:

* The oldest contact remains primary.

* Other primary contacts are converted to secondary.

* New unique email/phone is added as secondary.

* The response always returns:

* Primary Contact ID

* All associated emails

* All associated phone numbers

* All secondary contact IDs

---

## 🛠 Tech Stack

Node.js

Express.js

PostgreSQL

Render (Deployment)

---

## 🗄 Database Schema

## Table: Contact

1.id (Primary Key)

2.email

3.phoneNumber

4.linkedId (references Contact.id)

5.linkPrecedence ('primary' or 'secondary')

6.createdAt

7.updatedAt

8.deletedAt

---


## ⚙️ Running Locally

Clone the repository

Install dependencies

npm install

---

## Create a .env file and add:
DATABASE_URL=your_postgresql_connection_string

## Start the server
node server.js

---


## 📌 Notes

Root route ("/") is not defined.

Only /identify endpoint is exposed as required in the assignment.

The project is fully deployed and production-ready.
