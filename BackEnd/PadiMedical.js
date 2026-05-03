const dotenv = require("dotenv");
dotenv.config();
var createError = require("http-errors");
var express = require("express");
var morgan = require("morgan");
var path = require("path");
var cookieParser = require("cookie-parser");
const { startSocketServer } = require("./socket/socketServer");
var apisRouter = require("./routes/index");
var adminRouter = require("./routes/admin");
var usersRouter = require("./routes/users");
var authenticationRouter = require("./routes/authentication");
require("./cron/index");
var app = express();
var autoStartMonitoring = require("./model/monitoring/AutoStartMonitoring");

const OTJSError = require("./Exceptions/OTJSError");
const http = require("http").createServer(app);
app.set("trust proxy", true);
app.use(
  express.raw({ limit: "2000mb", type: ["application/dicom", "text/plain"] })
);
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "100mb" }));

app.use(cookieParser());

var unless = function (path, middleware) {
  return function (req, res, next) {
    if (path === req.path) {
      return next();
    } else {
      return middleware(req, res, next);
    }
  };
};

morgan.token("username", function (req, res) {
  return req.roles == null ? "Not Authentified" : req.roles.username;
});

morgan.token("remote-addr", (req, res) => {
  return req.headers["x-forwarded-for"] || req.connection.remoteAddress;
});

app.use(
  unless(
    "/",
    morgan(
      ':remote-addr - [:date[clf]] ":method :url HTTPS/:http-version" :status ":user-agent" ":username"'
    )
  )
);

// static routes
app.use("/sounds", express.static(path.join(__dirname, "build", "sounds")));
app.use("/images", express.static(path.join(__dirname, "build", "images")));
app.use("/static", express.static(path.join(__dirname, "build", "static")));

app.use(
  "/viewer-ohif/",
  express.static(path.join(__dirname, "build", "viewer-ohif"))
);
app.use("/viewer-ohif/*", function (req, res) {
  res.sendFile(path.join(__dirname, "build", "viewer-ohif", "index.html"));
});

app.use(
  "/viewer-stone/",
  express.static(path.join(__dirname, "build", "viewer-stone"))
);
app.use(
  "/streamSaver/",
  express.static(path.join(__dirname, "build", "streamSaver"))
);

app.use("/api/authentication", authenticationRouter);
app.use("/api/users", usersRouter);
app.use("/api", apisRouter);
app.use("/api", adminRouter);
app.use("/*", express.static(path.join(__dirname, "build")));

// If didn't found route catch 404 and forward to error handler
//SK A améliorer ne tient pas compte des routes dans le subrouter
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  if (req.app.get("env") === "development") {
    console.error(err);
  }

  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof OTJSError) {
    res.status(err.getStatusCode()).json(err.getJsonPayload());
    return;
  } else {
    return next(err);
  }
});
const port = 4000;

const server = app.listen(port, (error) => {
  if (error) {
    console.error(error);
    return process.exit(1);
  } else {
    console.log("Listening on port: " + port);
    if (app.get("env") === "production") {
      //Autostart monitonring service if needed
      autoStartMonitoring();
    }
  }
});

startSocketServer(server); //concurrent tukar

module.exports = app;
