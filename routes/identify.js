import express from "express";
import pool from "../db.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { email, phoneNumber } = req.body;

    if (!email && !phoneNumber) {
      return res.status(400).json({
        error: "Email or phoneNumber required",
      });
    }

    //  Step 1: Find matching contacts
    const matchResult = await pool.query(
      `
      SELECT * FROM Contact
      WHERE email = $1 OR phoneNumber = $2
      `,
      [email || null, phoneNumber || null]
    );

    //  CASE 1: No match → create primary
    if (matchResult.rows.length === 0) {
      const newContact = await pool.query(
        `
        INSERT INTO Contact (email, phoneNumber, linkedId, linkPrecedence)
        VALUES ($1, $2, NULL, 'primary')
        RETURNING *
        `,
        [email || null, phoneNumber || null]
      );

      const contact = newContact.rows[0];

      return res.status(200).json({
        contact: {
          primaryContactId: contact.id,
          emails: contact.email ? [contact.email] : [],
          phoneNumbers: contact.phonenumber ? [contact.phonenumber] : [],
          secondaryContactIds: []
        }
      });
    }

    //  CASE 2 & 3: Match exists (including merge case)

    let matchedContacts = matchResult.rows;

    // Step 2: Collect all primary IDs
    let primaryIds = new Set();

    for (let contact of matchedContacts) {
      if (contact.linkprecedence === "primary") {
        primaryIds.add(contact.id);
      } else {
        primaryIds.add(contact.linkedid);
      }
    }

    // Step 3: Fetch all primary contacts
    const primaryContacts = await pool.query(
  `
  SELECT * FROM Contact
  WHERE id = ANY($1::int[])
  `,
  [Array.from(primaryIds)]
);

    let allPrimaries = primaryContacts.rows;

    // Step 4: Find oldest primary (smallest id)
    allPrimaries.sort((a, b) => a.id - b.id);
    let oldestPrimary = allPrimaries[0];

    // Step 5: Convert other primaries to secondary + update their children
    for (let p of allPrimaries) {
      if (p.id !== oldestPrimary.id) {

        // Convert primary to secondary
        await pool.query(
          `
          UPDATE Contact
          SET linkPrecedence = 'secondary',
              linkedId = $1,
              updatedAt = CURRENT_TIMESTAMP
          WHERE id = $2
          `,
          [oldestPrimary.id, p.id]
        );

        //  Update children of that primary
        await pool.query(
          `
          UPDATE Contact
          SET linkedId = $1,
              updatedAt = CURRENT_TIMESTAMP
          WHERE linkedId = $2
          `,
          [oldestPrimary.id, p.id]
        );
      }
    }

    // Step 6: Fetch all contacts linked to oldest primary
    const allContacts = await pool.query(
      `
      SELECT * FROM Contact
      WHERE id = $1 OR linkedId = $1
      `,
      [oldestPrimary.id]
    );

    let contacts = allContacts.rows;

    const existingEmails = contacts.map(c => c.email).filter(Boolean);
    const existingPhones = contacts.map(c => c.phonenumber).filter(Boolean);

    const isNewEmail = email && !existingEmails.includes(email);
    const isNewPhone = phoneNumber && !existingPhones.includes(phoneNumber);

    // Step 7: Insert secondary if new info
    if (isNewEmail || isNewPhone) {
      await pool.query(
        `
        INSERT INTO Contact (email, phoneNumber, linkedId, linkPrecedence)
        VALUES ($1, $2, $3, 'secondary')
        `,
        [email || null, phoneNumber || null, oldestPrimary.id]
      );
    }

    // Step 8: Final fetch
    const updated = await pool.query(
      `
      SELECT * FROM Contact
      WHERE id = $1 OR linkedId = $1
      `,
      [oldestPrimary.id]
    );

    const finalContacts = updated.rows;

    const emails = [...new Set(finalContacts.map(c => c.email).filter(Boolean))];
    const phones = [...new Set(finalContacts.map(c => c.phonenumber).filter(Boolean))];
    const secondaryIds = finalContacts
      .filter(c => c.linkprecedence === "secondary")
      .map(c => c.id);

    return res.status(200).json({
      contact: {
        primaryContactId: oldestPrimary.id,
        emails,
        phoneNumbers: phones,
        secondaryContactIds: secondaryIds
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;