import dotenv from "dotenv";
import app from "./src/app";
import { mongoConnect } from "./db/mongoConnect";

// global uncaught exception handler
process.on("uncaughtException", function (err) {
  console.error("Uncaught exception detected, shutting down the server 🖥...");
  console.error(err);

  process.exit(1);
});

// Load env variables
dotenv.config({ path: "./.env" });

// Connect to the DB
mongoConnect().then(() => console.log("DB setup completed..."));

// Server configuration
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, async () => {
  console.log(`Server listening on ${PORT}...`);
});

// global uncaught promise rejection handler
process.on("unhandledRejection", function (err) {
  console.error(
    "Unhandled promise rejection detected, shutting down the server 🖥..."
  );
  console.error(err);

  server.close(() => {
    process.exit(1);
  });
});
