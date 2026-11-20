
const fs = require("fs");
const path = require("path");

const rawPath = path.join(__dirname, "profiles_raw.json");
const outputPath = path.join(__dirname, "profiles.json");

try {
  // Load the 30 profiles directly
  const profiles = JSON.parse(
    fs.readFileSync(rawPath, "utf8")
  );

  if (!Array.isArray(profiles)) {
    throw new Error("profiles_raw.json must contain an array.");
  }

  if (profiles.length !== 30) {
    throw new Error(`Expected exactly 30 profiles, found ${profiles.length}.`);
  }

  // Validate required profile fields
  const requiredFields = [
    "id",
    "name",
    "gender",
    "age",
    "photo",
    "bio",
    "city",
    "interests",
    "likesMe",
  ];

  for (const profile of profiles) {
    for (const field of requiredFields) {
      if (profile[field] === undefined || profile[field] === null) {
        throw new Error(
          `Profile ${profile.id || "unknown"} is missing ${field}.`
        );
      }
    }
  }

  // Check duplicate IDs
  const ids = profiles.map((profile) => profile.id);

  if (new Set(ids).size !== 30) {
    throw new Error("Duplicate profile IDs found.");
  }

  // Save exactly the supplied profiles without changing their details
  fs.writeFileSync(
    outputPath,
    JSON.stringify(profiles, null, 2),
    "utf8"
  );

  console.log("--------------------------------");
  console.log("Successfully generated profiles!");
  console.log(`Total profiles: ${profiles.length}`);
  console.log(
    `Male profiles: ${profiles.filter(p => p.gender === "male").length}`
  );
  console.log(
    `Female profiles: ${profiles.filter(p => p.gender === "female").length}`
  );
  console.log(
    `Profiles who liked you: ${profiles.filter(p => p.likesMe === true).length}`
  );
  console.log("Profile IDs: p1 to p30");
  console.log("Saved to profiles.json");
  console.log("--------------------------------");

} catch (error) {
  console.error("Profile generation failed:", error.message);
  process.exit(1);
}
