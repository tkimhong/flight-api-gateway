const express = require("express");
const app = express();

// Use proxy server to redirect the incoming request
const httpProxy = require("http-proxy");
const proxy = httpProxy.createProxyServer();

const jwt = require("jsonwebtoken");
const JWT_SECRET = "flight_management_jwt_secret_key_2025";

function authToken(req, res, next) {
  console.log(req.headers.authorization);
  const header = req?.headers.authorization;
  const token = header && header.split(" ")[1];

  if (token == null) return res.status(401).json("No token provided");

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json("Invalid token", err);
    req.user = user;
    next();
  });
}

function authRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json("Access denied");
    }
    next();
  };
}

// Redirect to the registration microservice
app.use("/reg", (req, res) => {
  console.log("INSIDE API GATEWAY REGISTRATION ROUTE");
  proxy.web(req, res, { target: "http://localhost:5001" });
});

// Redirect to the login (authentication) microservice
app.use("/auth", (req, res) => {
  console.log("INSIDE API GATEWAY LOGIN ROUTE");
  proxy.web(req, res, { target: "http://localhost:5002" });
});

// Redirect to the customer microservice
app.use("/customer", authToken, authRole("customer"), (req, res) => {
  console.log("INSIDE API GATEWAY CUSTOMER ROUTE");
  proxy.web(req, res, { target: "http://localhost:5003" });
});

// Redirect to the admin microservice
app.use("/admin", authToken, authRole("admin"), (req, res) => {
  console.log("INSIDE API GATEWAY ADMIN ROUTE");
  proxy.web(req, res, { target: "http://localhost:5004" });
});

app.listen(4000, () => {
  console.log("Flight Management API Gateway running on port 4000");
});
