import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import expressMongoSanitize from "express-mongo-sanitize";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
// diabling chekcing for 'xss-clean' as it has no @types/xss-clean and is also deprecated.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import xss from "xss-clean";
import AppError from "./utils/appError";
import indexRouter from "./routes";

const app = express();

// security middlewares
app.use(cors());

app.options("*", cors());

app.use(helmet());

app.use(xss());

// dev logging
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// rate limit
if (process.env.NODE_ENV === "production") {
  const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: "Too many requests from this IP, please try again in an hour",
  });
  app.use("/api", limiter);
}

app.use(express.json({ limit: "10kb" }));

app.use(express.urlencoded({ extended: true, limit: "10kb" }));

app.use(expressMongoSanitize());

app.use(compression());

app.use(cookieParser());

// Secure static file serving
app.use(
  express.static(path.join(__dirname, "src/public"), {
    dotfiles: "ignore", // Prevent serving hidden files like .env, .git, etc.
    index: false, // Disable serving default index.html for directories.
    redirect: false, // Disable automatic redirects (e.g., /folder -> /folder/).
    setHeaders: (res) => {
      // Add security headers to all served static files
      res.setHeader("Cache-Control", "public, max-age=31536000"); // 1 year cache
      // res.setHeader("Content-Security-Policy", "default-src 'self'"); // CSP example
    },
  })
);

export default app;

// routing
app.use("/", indexRouter);

app.all("*", (req, _res, next) => {
  next(new AppError(`Could not find ${req.originalUrl}`, 404));
});
