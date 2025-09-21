#!/usr/bin/env node

// Script to switch API environment
const fs = require("fs");
const path = require("path");

const configPath = path.join(__dirname, "../data/config/apiConfig.ts");

const environments = {
  local: "Local development (same network)",
  ngrok: "ngrok tunnel (external access)",
  production: "Production (deployed backend)",
};

function updateConfig(env) {
  if (!environments[env]) {
    console.error(`❌ Invalid environment: ${env}`);
    console.log(
      "Available environments:",
      Object.keys(environments).join(", ")
    );
    process.exit(1);
  }

  let config = fs.readFileSync(configPath, "utf8");

  // Update the default environment
  config = config.replace(/return 'ngrok';/, `return '${env}';`);

  fs.writeFileSync(configPath, config);

  console.log(`✅ Switched to ${env} environment: ${environments[env]}`);
  console.log("🔄 Restart your Expo app to apply changes");
}

function showCurrentConfig() {
  const config = fs.readFileSync(configPath, "utf8");
  const match = config.match(/return '(\w+)';/);
  const current = match ? match[1] : "unknown";

  console.log(`📡 Current environment: ${current}`);
  console.log(`📝 Description: ${environments[current] || "Unknown"}`);
}

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

if (!command || command === "status") {
  showCurrentConfig();
} else if (command === "list") {
  console.log("Available environments:");
  Object.entries(environments).forEach(([key, desc]) => {
    console.log(`  ${key}: ${desc}`);
  });
} else {
  updateConfig(command);
}
