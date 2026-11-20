
import { useEffect, useRef, useState } from "react";
import {
  Heart,
  X,
  Sparkles,
  MapPin,
  RotateCcw,
  House,
  Compass,
  MessageCircle,
  Archive,
  Undo2,
} from "lucide-react";
import "./index.css";
import "./animations.css";

const API = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

function getVisitorId() {
  let visitorId = localStorage.getItem("coy-visitor-id");

  if (!visitorId) {
    visitorId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `visitor-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    localStorage.setItem("coy-visitor-id", visitorId);
  }

  return visitorId;
}

const VISITOR_ID = getVisitorId();

function apiFetch(endpoint, options = {}) {
  return fetch(`${API}${endpoint}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      "x-user-id": VISITOR_ID,
    },
  });
}

const FALLBACK_PHOTO =
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&h=1100&q=85";

const SWIPE_ANIMATION_TIME = 350;

export default function App() {
  const [profiles, setProfiles] = useState([]);
  const [matches, setMatches] = useState([]);
  const [skipped, setSkipped] = useState([]);
  const [tab, setTab] = useState("discover");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [matchProfile, setMatchProfile] = useState(null);
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [busy, setBusy] = useState(false);

  const startRef = useRef(null);
  const busyRef = useRef(false);
  const dragRef = useRef({ x: 0, y: 0 });

  async function loadFeed() {
    try {
      setLoading(true);
      setError("");

      const [feedResponse, matchResponse, skippedResponse] =
        await Promise.all([
          apiFetch("/feed"),
          apiFetch("/matches"),
          apiFetch("/skipped"),
        ]);

      if (
        !feedResponse.ok ||
        !matchResponse.ok ||
        !skippedResponse.ok
      ) {
        throw new Error("Unable to load data from the server.");
      }

      const [feedData, matchData, skippedData] = await Promise.all([
        feedResponse.json(),
        matchResponse.json(),
        skippedResponse.json(),
      ]);

      setProfiles(feedData);
      setMatches(matchData);
      setSkipped(skippedData);
    } catch (err) {
      setError(
        "Couldn't connect to Coy server. Make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFeed();
  }, []);

  useEffect(() => {
    profiles.slice(1, 4).forEach((profile) => {
      const img = new Image();
      img.src = profile.photo;
    });
  }, [profiles]);

  function resetDrag() {
    dragRef.current = { x: 0, y: 0 };
    setDrag({ x: 0, y: 0 });
  }

  async function refreshSavedLists() {
    try {
      const [matchResponse, skippedResponse] = await Promise.all([
        apiFetch("/matches"),
        apiFetch("/skipped"),
      ]);

      if (matchResponse.ok) {
        setMatches(await matchResponse.json());
      }

      if (skippedResponse.ok) {
        setSkipped(await skippedResponse.json());
      }
    } catch (err) {
      // A later visit or refresh will load the latest lists.
    }
  }

  async function swipe(direction) {
    if (!profiles.length || busyRef.current) return;

    busyRef.current = true;

    const current = profiles[0];

    setIsDragging(false);
    setError("");

    setDrag({
      x: direction === "like" ? 600 : -600,
      y: 30,
    });

    const swipeRequest = apiFetch("/swipe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profileId: current.id,
        direction,
      }),
    }).then(async (response) => {
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Swipe failed");
      }

      return result;
    });

    const safeSwipeRequest = swipeRequest.then(
      (result) => ({ result }),
      (requestError) => ({ requestError })
    );

    await new Promise((resolve) =>
      setTimeout(resolve, SWIPE_ANIMATION_TIME)
    );

    setProfiles((previous) =>
      previous.filter((profile) => profile.id !== current.id)
    );

    resetDrag();

    if (direction === "pass") {
      setSkipped((previous) => [
        current,
        ...previous.filter((profile) => profile.id !== current.id),
      ]);
    }

    const outcome = await safeSwipeRequest;

    if (outcome.requestError) {
      setProfiles((previous) =>
        previous.some((profile) => profile.id === current.id)
          ? previous
          : [current, ...previous]
      );

      if (direction === "pass") {
        setSkipped((previous) =>
          previous.filter((profile) => profile.id !== current.id)
        );
      }

      setError(
        outcome.requestError.message ||
          "Something went wrong. Please try again."
      );
    } else {
      if (outcome.result.isMatch) {
        setMatchProfile(current);
      }

      refreshSavedLists();
    }

    busyRef.current = false;
  }

  // Keyboard controls: Left Arrow = Pass, Right Arrow = Like.
  useEffect(() => {
    function handleKeyDown(event) {
      if (tab !== "discover" || loading || !profiles.length) return;

      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
        return;
      }

      const target = event.target;

      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.closest(
            "input, textarea, select, button, [contenteditable='true']"
          ))
      ) {
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        swipe("pass");
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        swipe("like");
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [tab, loading, profiles, swipe]);

  async function undoPass(profile) {
    if (busyRef.current) return;

    busyRef.current = true;
    setBusy(true);
    setActionError("");

    try {
      const response = await apiFetch("/undo-pass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId: profile.id }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not undo pass.");
      }

      await loadFeed();
    } catch (err) {
      setActionError(err.message || "Could not undo pass. Try again.");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  async function changeToLike(profile) {
    if (busyRef.current) return;

    busyRef.current = true;
    setBusy(true);
    setActionError("");

    try {
      const response = await apiFetch("/change-to-like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId: profile.id }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not like this profile.");
      }

      await loadFeed();

      if (result.isMatch) {
        setMatchProfile(profile);
      }
    } catch (err) {
      setActionError(
        err.message || "Could not like this profile. Try again."
      );
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  function handlePointerDown(e) {
    if (busyRef.current || e.target.closest("button")) return;

    startRef.current = { x: e.clientX, y: e.clientY };
    dragRef.current = { x: 0, y: 0 };

    setIsDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }

  function handlePointerMove(e) {
    if (!startRef.current || busyRef.current) return;

    const next = {
      x: e.clientX - startRef.current.x,
      y: e.clientY - startRef.current.y,
    };

    dragRef.current = next;
    setDrag(next);
  }

  function handlePointerUp() {
    if (!startRef.current) return;

    const x = dragRef.current.x;

    startRef.current = null;
    setIsDragging(false);

    if (x > 120) {
      swipe("like");
    } else if (x < -120) {
      swipe("pass");
    } else {
      resetDrag();
    }
  }

  function handlePointerCancel() {
    startRef.current = null;
    setIsDragging(false);
    resetDrag();
  }

  const current = profiles[0];
  const rotation = drag.x * 0.045;
  const likeOpacity = Math.min(Math.max(drag.x / 120, 0), 1);
  const passOpacity = Math.min(Math.max(-drag.x / 120, 0), 1);
  const isMoved = drag.x !== 0 || drag.y !== 0;

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" onClick={(e) => e.preventDefault()}>
          <span className="brand-icon">
            <Heart size={20} fill="white" />
          </span>
          coy<span className="brand-dot">.</span>
        </a>

        <div className="topbar-tag">
          <Sparkles size={14} />
          <span>Find your connection</span>
        </div>
      </header>

      <main className="main-content">
        <div className="welcome-section">
          <div>
            <p className="eyebrow">YOUR NEXT CONNECTION</p>
            <h1>
              Discover <span>someone.</span>
            </h1>
            <p className="subtitle">
              A little spark can change everything.
            </p>
          </div>

          <div className="online-indicator">
            <span className="online-dot" />
            Discover
          </div>
        </div>

        <div className="content-layout">
          <aside className="side-panel">
            <div className="side-heading">Your space</div>

            <button
              className={`side-link ${tab === "home" ? "active" : ""}`}
              onClick={() => setTab("home")}
            >
              <House size={19} />
              <span>Home</span>
            </button>

            <button
              className={`side-link ${tab === "discover" ? "active" : ""}`}
              onClick={() => setTab("discover")}
            >
              <Compass size={19} />
              <span>Discover</span>
            </button>

            <button
              className={`side-link ${tab === "matches" ? "active" : ""}`}
              onClick={() => setTab("matches")}
            >
              <Heart size={19} />
              <span>Matches</span>
              {matches.length > 0 && (
                <span className="match-count">{matches.length}</span>
              )}
            </button>

            <button
              className={`side-link ${tab === "skipped" ? "active" : ""}`}
              onClick={() => {
                setTab("skipped");
                setActionError("");
              }}
            >
              <Archive size={19} />
              <span>Skipped</span>
              {skipped.length > 0 && (
                <span className="match-count">{skipped.length}</span>
              )}
            </button>

            <div className="privacy-note">
              <div className="privacy-icon">
                <Heart size={16} />
              </div>
              <strong>Private by design</strong>
              <p>Your likes stay secret until the feeling is mutual.</p>
            </div>
          </aside>

          <section className="main-panel" key={tab}>
            {tab === "home" && (
              <div className="placeholder-view">
                <div className="placeholder-icon">
                  <House size={32} />
                </div>
                <h2>Welcome to Coy</h2>
                <p>Your home space. Something lovely starts here.</p>
                <button
                  className="primary-button"
                  onClick={() => setTab("discover")}
                >
                  <Compass size={18} />
                  Explore Discover
                </button>
              </div>
            )}

            {tab === "discover" && (
              <div className="discover-view">
                <div className="card-top-label">
                  <span>
                    <Sparkles size={15} />
                    CURATED FOR YOU
                  </span>
                  <span className="remaining-count">
                    {profiles.length} remaining
                  </span>
                </div>

                {loading ? (
                  <div className="card-stage">
                    <div className="profile-card skeleton" />
                  </div>
                ) : error ? (
                  <div className="error-state">
                    <div className="placeholder-icon">
                      <MessageCircle size={30} />
                    </div>
                    <h2>Connection interrupted</h2>
                    <p>{error}</p>
                    <button className="primary-button" onClick={loadFeed}>
                      <RotateCcw size={17} /> Try again
                    </button>
                  </div>
                ) : current ? (
                  <>
                    <div className="card-stage">
                      <div className="card-back card-back-two" />
                      <div className="card-back card-back-one" />

                      <article
                        key={current.id}
                        className={`profile-card card-enter ${
                          isDragging ? "dragging" : ""
                        }`}
                        style={{
                          transform: isMoved
                            ? `translate3d(${Math.round(
                                drag.x
                              )}px, ${Math.round(
                                drag.y
                              )}px, 0) rotate(${rotation}deg)`
                            : "none",
                          transition: isDragging
                            ? "none"
                            : "transform 0.35s cubic-bezier(.2,.8,.3,1)",
                        }}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerCancel={handlePointerCancel}
                      >
                        <img
                          className="profile-photo"
                          src={current.photo}
                          alt={current.name}
                          draggable="false"
                          loading="eager"
                          decoding="async"
                          onError={(e) => {
                            if (e.currentTarget.src !== FALLBACK_PHOTO) {
                              e.currentTarget.src = FALLBACK_PHOTO;
                            }
                          }}
                        />

                        <div className="photo-shade" />

                        <div
                          className="swipe-glow like-glow"
                          style={{ opacity: likeOpacity }}
                        />

                        <div
                          className="swipe-glow pass-glow"
                          style={{ opacity: passOpacity }}
                        />

                        <div
                          className="swipe-stamp like-stamp"
                          style={{ opacity: likeOpacity }}
                        >
                          LIKE
                        </div>

                        <div
                          className="swipe-stamp pass-stamp"
                          style={{ opacity: passOpacity }}
                        >
                          PASS
                        </div>

                        <div className="profile-content">
                          <div className="profile-location">
                            <MapPin size={14} />
                            {current.city}
                          </div>

                          <h2>
                            {current.name}, {current.age}
                          </h2>

                          <p className="profile-bio">{current.bio}</p>

                          <div className="interest-list">
                            {(current.interests || []).map((interest) => (
                              <span className="interest-tag" key={interest}>
                                {interest}
                              </span>
                            ))}
                          </div>
                        </div>
                      </article>
                    </div>

                    <div className="swipe-actions">
                      <button
                        className="action-button pass-button"
                        aria-label="Pass"
                        onClick={() => swipe("pass")}
                      >
                        <X size={27} />
                      </button>

                      <button
                        className="action-button like-button"
                        aria-label="Like"
                        onClick={() => swipe("like")}
                      >
                        <Heart size={25} fill="currentColor" />
                      </button>
                    </div>

                    <p className="swipe-hint">
                      <span>←</span> Pass{" "}
                      <span className="hint-divider">·</span> Like{" "}
                      <span>→</span>
                    </p>
                  </>
                ) : (
                  <div className="empty-state">
                    <div className="empty-heart">
                      <Heart size={35} />
                    </div>
                    <h2>You've seen everyone!</h2>
                    <p>
                      That's everyone for now. Keep an open heart, more people
                      may come along.
                    </p>
                    <button className="primary-button" onClick={loadFeed}>
                      <RotateCcw size={17} />
                      Refresh Discover
                    </button>
                  </div>
                )}
              </div>
            )}

            {tab === "matches" && (
              <div className="matches-view">
                <div className="matches-heading">
                  <div>
                    <p className="eyebrow">MUTUAL CONNECTIONS</p>
                    <h2>
                      Your matches <span>♥</span>
                    </h2>
                    <p className="subtitle">
                      The feeling was mutual. That's where it begins.
                    </p>
                  </div>

                  <div className="matches-total">
                    <Heart size={16} fill="currentColor" />
                    {matches.length}
                  </div>
                </div>

                {matches.length === 0 ? (
                  <div className="empty-matches">
                    <div className="empty-heart">
                      <Heart size={32} />
                    </div>
                    <h3>No matches just yet</h3>
                    <p>
                      Keep discovering. Your mutual connection could be one
                      swipe away.
                    </p>
                    <button
                      className="primary-button"
                      onClick={() => setTab("discover")}
                    >
                      <Compass size={18} />
                      Discover people
                    </button>
                  </div>
                ) : (
                  <div className="matches-grid">
                    {matches.map((profile, index) => (
                      <div
                        className="match-card"
                        key={profile.id}
                        style={{ "--i": index }}
                      >
                        <div className="match-image-wrap">
                          <img
                            src={profile.photo}
                            alt={profile.name}
                            decoding="async"
                            onError={(e) => {
                              if (e.currentTarget.src !== FALLBACK_PHOTO) {
                                e.currentTarget.src = FALLBACK_PHOTO;
                              }
                            }}
                          />

                          <span className="match-heart">
                            <Heart size={15} fill="currentColor" />
                          </span>
                        </div>

                        <div className="match-info">
                          <h3>
                            {profile.name}, {profile.age}
                          </h3>
                          <p>
                            <MapPin size={13} /> {profile.city}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === "skipped" && (
              <div className="matches-view skipped-view">
                <div className="matches-heading">
                  <div>
                    <p className="eyebrow">YOUR PREVIOUS PASSES</p>
                    <h2>
                      Skipped profiles <span>↩</span>
                    </h2>
                    <p className="subtitle">
                      Changed your mind? You can revisit anyone here.
                    </p>
                  </div>

                  <div className="matches-total">
                    <Archive size={16} />
                    {skipped.length}
                  </div>
                </div>

                {actionError && (
                  <div className="action-error">{actionError}</div>
                )}

                {loading ? (
                  <div className="loading-state">
                    <div className="loader" />
                    <p>Loading skipped profiles...</p>
                  </div>
                ) : error ? (
                  <div className="error-state">
                    <h2>Connection interrupted</h2>
                    <p>{error}</p>
                    <button className="primary-button" onClick={loadFeed}>
                      <RotateCcw size={17} /> Try again
                    </button>
                  </div>
                ) : skipped.length === 0 ? (
                  <div className="empty-matches">
                    <div className="empty-heart">
                      <Archive size={32} />
                    </div>
                    <h3>No skipped profiles</h3>
                    <p>
                      Profiles you pass in Discover will appear here. You can
                      revisit them anytime.
                    </p>
                    <button
                      className="primary-button"
                      onClick={() => setTab("discover")}
                    >
                      <Compass size={18} />
                      Discover people
                    </button>
                  </div>
                ) : (
                  <div className="skipped-grid">
                    {skipped.map((profile, index) => (
                      <article
                        className="skipped-card"
                        key={profile.id}
                        style={{ "--i": index }}
                      >
                        <div className="skipped-image-wrap">
                          <img
                            src={profile.photo}
                            alt={profile.name}
                            loading="lazy"
                            decoding="async"
                            onError={(e) => {
                              if (e.currentTarget.src !== FALLBACK_PHOTO) {
                                e.currentTarget.src = FALLBACK_PHOTO;
                              }
                            }}
                          />
                        </div>

                        <div className="skipped-info">
                          <h3>
                            {profile.name}, {profile.age}
                          </h3>

                          <p className="skipped-location">
                            <MapPin size={13} />
                            {profile.city}
                          </p>

                          <p className="skipped-bio">{profile.bio}</p>

                          <div className="skipped-interests">
                            {(profile.interests || []).slice(0, 3).map(
                              (interest) => (
                                <span key={interest}>{interest}</span>
                              )
                            )}
                          </div>

                          <div className="skipped-actions">
                            <button
                              className="undo-pass-button"
                              onClick={() => undoPass(profile)}
                              disabled={busy}
                            >
                              <Undo2 size={16} />
                              Undo Pass
                            </button>

                            <button
                              className="skipped-like-button"
                              onClick={() => changeToLike(profile)}
                              disabled={busy}
                            >
                              <Heart size={16} fill="currentColor" />
                              Like
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </main>

      <nav className="mobile-nav">
        <button
          className={tab === "home" ? "active" : ""}
          onClick={() => setTab("home")}
        >
          <House size={21} />
          <span>Home</span>
        </button>

        <button
          className={tab === "discover" ? "active" : ""}
          onClick={() => setTab("discover")}
        >
          <Compass size={21} />
          <span>Discover</span>
        </button>

        <button
          className={tab === "matches" ? "active" : ""}
          onClick={() => setTab("matches")}
        >
          <Heart size={21} />
          <span>Matches</span>
          {matches.length > 0 && (
            <i className="nav-badge">{matches.length}</i>
          )}
        </button>

        <button
          className={tab === "skipped" ? "active" : ""}
          onClick={() => {
            setTab("skipped");
            setActionError("");
          }}
        >
          <Archive size={21} />
          <span>Skipped</span>
          {skipped.length > 0 && (
            <i className="nav-badge">{skipped.length}</i>
          )}
        </button>
      </nav>

      {matchProfile && (
        <div
          className="match-overlay"
          onClick={() => setMatchProfile(null)}
        >
          <div
            className="match-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="confetti" aria-hidden="true">
              {Array.from({ length: 18 }).map((_, i) => (
                <i key={i} style={{ "--i": i }}>
                  <Heart size={10 + (i % 4) * 4} fill="currentColor" />
                </i>
              ))}
            </div>

            <button
              className="modal-close"
              onClick={() => setMatchProfile(null)}
              aria-label="Close"
            >
              <X size={20} />
            </button>

            <div className="match-sparkles">
              <Sparkles size={25} />
              <Heart size={40} fill="currentColor" />
              <Sparkles size={25} />
            </div>

            <p className="eyebrow">A CONNECTION MADE</p>

            <h1>
              It's a <span>match!</span>
            </h1>

            <p className="match-message">
              You and {matchProfile.name} liked each other. Maybe this is the
              start of something.
            </p>

            <div className="match-photos">
              <div className="match-photo you-photo">
                <span>YOU</span>
              </div>

              <div className="match-photo other-photo">
                <img src={matchProfile.photo} alt={matchProfile.name} />
              </div>

              <div className="match-heart-center">
                <Heart size={22} fill="currentColor" />
              </div>
            </div>

            <button
              className="primary-button match-continue"
              onClick={() => {
                setMatchProfile(null);
                setTab("matches");
              }}
            >
              See your matches <Heart size={17} fill="currentColor" />
            </button>

            <button
              className="text-button"
              onClick={() => setMatchProfile(null)}
            >
              Keep discovering
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
