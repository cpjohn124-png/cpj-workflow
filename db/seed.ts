import { getDb } from "../api/queries/connection";

async function seed() {
  const db = getDb();
  console.log("Seeding database...");
  // Add seed data here if needed
}

seed().catch(console.error);
