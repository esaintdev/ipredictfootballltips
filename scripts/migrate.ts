/** Creates / updates the database schema and seeds the default competitions: `npm run db:migrate` */
import { ensureSchema } from "../lib/db";

ensureSchema()
  .then(() => { console.log("Database schema is up to date."); process.exit(0); })
  .catch((e) => { console.error(e); process.exit(1); });
