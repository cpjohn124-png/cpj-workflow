import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "@db/schema";

let connection: mysql.Connection | null = null;

export function getDb() {
  if (!connection) {
    connection = mysql.createConnection(process.env.DATABASE_URL!);
  }
  return drizzle(connection, { schema, mode: "default" });
}
