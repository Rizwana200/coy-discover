
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Supabase PostgreSQL connection
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL environment variable is missing.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Load profiles from JSON
const profiles = JSON.parse(
  fs.readFileSync(path.join(__dirname, "profiles.json"), "utf-8")
);

// Identify each visitor
app.use((req, res, next) => {
  if (req.path === "/") {
    return next();
  }

  const userId = req.get("x-user-id");

  if (!userId || !/^[a-zA-Z0-9_-]{8,100}$/.test(userId)) {
    return res.status(400).json({
      error: "Valid visitor ID is required.",
    });
  }

  req.userId = userId;
  next();
});

// Find one visitor's swipe
async function getUserSwipe(userId, profileId) {
  const result = await pool.query(
    `SELECT * FROM public.swipes
     WHERE visitor_id = $1 AND profile_id = $2`,
    [userId, profileId]
  );

  return result.rows[0] || null;
}

// GET /feed
app.get("/feed", async (req, res) => {
  const result = await pool.query(
    `SELECT profile_id FROM public.swipes
     WHERE visitor_id = $1`,
    [req.userId]
  );

  const swipedIds = new Set(
    result.rows.map((row) => row.profile_id)
  );

  const feed = profiles.filter(
    (profile) => !swipedIds.has(profile.id)
  );

  res.json(feed);
});

// POST /swipe
app.post("/swipe", async (req, res) => {
  const { profileId, direction } = req.body;

  if (!profileId || !["like", "pass"].includes(direction)) {
    return res.status(400).json({
      error: "Invalid swipe data",
    });
  }

  const profile = profiles.find((p) => p.id === profileId);

  if (!profile) {
    return res.status(404).json({
      error: "Profile not found",
    });
  }

  const result = await pool.query(
    `INSERT INTO public.swipes
       (visitor_id, profile_id, direction)
     VALUES ($1, $2, $3)
     ON CONFLICT (visitor_id, profile_id) DO NOTHING
     RETURNING id`,
    [req.userId, profileId, direction]
  );

  if (result.rowCount === 0) {
    return res.status(409).json({
      error: "Profile already swiped",
    });
  }

  const isMatch =
    direction === "like" && profile.likesMe === true;

  res.json({
    success: true,
    isMatch,
    profile: {
      id: profile.id,
      name: profile.name,
      photo: profile.photo,
    },
  });
});

// GET /skipped
app.get("/skipped", async (req, res) => {
  const result = await pool.query(
    `SELECT profile_id FROM public.swipes
     WHERE visitor_id = $1 AND direction = 'pass'`,
    [req.userId]
  );

  const skippedIds = new Set(
    result.rows.map((row) => row.profile_id)
  );

  const skippedProfiles = profiles.filter(
    (profile) => skippedIds.has(profile.id)
  );

  res.json(skippedProfiles);
});

// POST /undo-pass
app.post("/undo-pass", async (req, res) => {
  const { profileId } = req.body;

  if (!profileId) {
    return res.status(400).json({
      error: "Profile ID is required",
    });
  }

  const result = await pool.query(
    `DELETE FROM public.swipes
     WHERE visitor_id = $1
       AND profile_id = $2
       AND direction = 'pass'
     RETURNING id`,
    [req.userId, profileId]
  );

  if (result.rowCount === 0) {
    return res.status(404).json({
      error: "Skipped profile not found",
    });
  }

  res.json({
    success: true,
    message: "Pass undone. Profile returned to Discover.",
  });
});

// POST /change-to-like
app.post("/change-to-like", async (req, res) => {
  const { profileId } = req.body;

  if (!profileId) {
    return res.status(400).json({
      error: "Profile ID is required",
    });
  }

  const profile = profiles.find((p) => p.id === profileId);

  if (!profile) {
    return res.status(404).json({
      error: "Profile not found",
    });
  }

  const result = await pool.query(
    `UPDATE public.swipes
     SET direction = 'like', created_at = NOW()
     WHERE visitor_id = $1
       AND profile_id = $2
       AND direction = 'pass'
     RETURNING id`,
    [req.userId, profileId]
  );

  if (result.rowCount === 0) {
    return res.status(404).json({
      error: "Skipped profile not found",
    });
  }

  const isMatch = profile.likesMe === true;

  res.json({
    success: true,
    isMatch,
    message: isMatch
      ? "It's a match!"
      : "Profile liked successfully.",
    profile: {
      id: profile.id,
      name: profile.name,
      photo: profile.photo,
    },
  });
});

// GET /matches
app.get("/matches", async (req, res) => {
  const result = await pool.query(
    `SELECT profile_id FROM public.swipes
     WHERE visitor_id = $1 AND direction = 'like'`,
    [req.userId]
  );

  const likedIds = new Set(
    result.rows.map((row) => row.profile_id)
  );

  const matches = profiles
    .filter(
      (profile) =>
        likedIds.has(profile.id) && profile.likesMe
    )
    .map((profile) => ({
      id: profile.id,
      name: profile.name,
      age: profile.age,
      photo: profile.photo,
      bio: profile.bio,
      city: profile.city,
      interests: profile.interests,
    }));

  res.json(matches);
});

// Health check
app.get("/", async (req, res) => {
  res.json({
    message: "Coy Discover API is running!",
    totalProfiles: profiles.length,
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("API error:", err);

  res.status(500).json({
    error: "Something went wrong. Please try again.",
  });
});

// Check database connection before starting
async function startServer() {
  try {
    await pool.query("SELECT 1");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Coy Discover backend running on port ${PORT}`);
      console.log(`Loaded ${profiles.length} profiles`);
      console.log("Supabase PostgreSQL connected successfully");
    });
  } catch (error) {
    console.error("Could not connect to Supabase:", error.message);
    process.exit(1);
  }
}

startServer();
