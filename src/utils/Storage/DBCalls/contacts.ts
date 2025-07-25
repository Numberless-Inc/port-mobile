import {runSimpleQuery} from './dbCommon';

export interface ContactEntry extends ContactInfo {
  pairHash: string;
}

export interface ContactInfo extends ContactUpdate {
  name?: string | null;
}

export interface ContactUpdate {
  name?: string | null;
  displayPic?: string | null;
  notes?: string | null;
  connectedOn?: string | null;
  connectionSource?: string | null;
}

/**
 * Get all of the user's contacts
 * @returns All contacts
 */
export async function getContacts(): Promise<ContactEntry[]> {
  const contacts: ContactEntry[] = [];
  await runSimpleQuery(
    `
    SELECT * FROM contacts;
    `,
    [],
    (tx, results) => {
      const len = results.rows.length;
      for (let i = 0; i < len; i++) {
        contacts.push(results.rows.item(i));
      }
    },
  );
  return contacts;
}

/**
 * Get info associate with a contact
 * @returns contact info
 */
export async function getContact(
  pairHash: string,
): Promise<ContactEntry | null> {
  let contact: ContactEntry | null = null;
  await runSimpleQuery(
    `
    SELECT * 
    FROM contacts 
    WHERE pairHash = ?;
    `,
    [pairHash],
    (tx, results) => {
      if (results.rows.length > 0) {
        contact = results.rows.item(0);
      }
    },
  );
  return contact;
}

/**
 * Adds new contact to the contacts table
 * @param contact - new contact to add
 */
export async function addContact(contact: ContactEntry) {
  await runSimpleQuery(
    `
    INSERT INTO contacts (
      pairHash,
      name,
      displayPic,
      notes,
      connectedOn,
      connectionSource
    ) VALUES (?,?,?,?,?,?);`,
    [
      contact.pairHash,
      contact.name,
      contact.displayPic,
      contact.notes,
      contact.connectedOn,
      contact.connectionSource,
    ],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (tx, result) => {},
  );
}

/**
 * Updates an existing contact
 * @param pairHash - pairHash of contact being updated
 * @param update - values to be updated
 */
export async function updateContact(pairHash: string, update: ContactUpdate) {
  await runSimpleQuery(
    `
    UPDATE contacts
    SET
    name = COALESCE(?, name),
    displayPic = COALESCE(?, displayPic),
    notes = COALESCE(?, notes),
    connectedOn = COALESCE(?, connectedOn),
    connectionSource = COALESCE(?, connectionSource)
    WHERE pairHash = ? ;
    `,
    [
      update.name,
      update.displayPic,
      update.notes,
      update.connectedOn,
      update.connectionSource,
      pairHash,
    ],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (tx, results) => {},
  );
}

/**
 * Deletes a contact if there are no matching chats in the connections table
 * @param pairHash - pairHash of contact
 * @returns - true if deleted. false if not.
 */
export async function deleteContact(pairHash: string) {
  let shouldDeleteContact = true;
  //check if a direct chat exists with the pair Hash.
  await runSimpleQuery(
    `
    SELECT * 
    FROM connections 
    WHERE pairHash = ?;
    `,
    [pairHash],

    (tx, results) => {
      const exists = (results.rows.length > 0);
      if (exists) {
        shouldDeleteContact = false;
      }
    },
  );
  //check if a group member exists with the pair hash.
  if (shouldDeleteContact) {
    await runSimpleQuery(
      `
        SELECT *
        FROM groupMembers 
        WHERE pairHash = ?
      `,
      [pairHash],

      (tx, results) => {
        const exists = (results.rows.length > 0);
        if (exists) {
          shouldDeleteContact = false;
        }
      },
    );
  }
  if (shouldDeleteContact) {
    await runSimpleQuery(
      `
      DELETE FROM contacts
      WHERE pairHash = ?
      `,
      [pairHash],
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (tx, results) => {},
    );
  }
  return shouldDeleteContact;
}
