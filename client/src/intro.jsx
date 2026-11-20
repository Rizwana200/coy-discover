import { useEffect, useState } from "react";
import { Heart, Users, Handshake, ArrowRight, X } from "lucide-react";
import "./intro.css";

function HeartLogo() {
  return (
    <svg className="logo-svg" viewBox="0 0 110 96" aria-hidden="true">
      <defs>
        <linearGradient id="coyGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff4fa0" />
          <stop offset="100%" stopColor="#8c52e9" />
        </linearGradient>
      </defs>
      <path
        className="logo-heart"
        pathLength="1"
        d="M52 84 C22 60 8 42 8 26 C8 14 18 6 30 6 C40 6 48 12 52 20 C56 12 64 6 74 6 C86 6 96 14 96 26 C96 42 82 60 52 84 Z"
        fill="none"
        stroke="url(#coyGrad)"
        strokeWidth="8"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <g transform="translate(97 12)">
        <path
          className="logo-spark"
          d="M0 -10 C1 -3 3 -1 10 0 C3 1 1 3 0 10 C-1 3 -3 1 -10 0 C-3 -1 -1 -3 0 -10Z"
          fill="#ff7ab8"
        />
      </g>
    </svg>
  );
}

const SMALL_HEARTS = [
  { top: "8%", left: "6%", size: 16, d: 0 },
  { top: "4%", right: "8%", size: 22, d: 1.1 },
  { top: "52%", left: "22%", size: 20, d: 0.6 },
  { top: "40%", right: "20%", size: 18, d: 1.7 },
  { top: "74%", left: "10%", size: 14, d: 2.2 },
  { top: "70%", right: "6%", size: 12, d: 0.3 },
];

export default function Intro({ onEnter }) {
  const [leaving, setLeaving] = useState(false);

  function enter() {
    if (leaving) return;
    setLeaving(true);
    setTimeout(onEnter, 900);
  }

  useEffect(() => {
    const onKey = (e) => e.key === "Enter" && enter();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className={`intro ${leaving ? "intro-exit" : ""}`}>
      <div className="intro-bg" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>

      <div className="intro-inner">
        {/* logo + title */}
        <div className="intro-logo">
          <HeartLogo />
        </div>

        <h1 className="intro-title">
          <span className="t-coy">Coy</span>{" "}
          <span className="t-disc">Discover</span>
        </h1>
        <p className="intro-tagline">Swipe. Connect. Belong.</p>

        {/* stage */}
        <div className="stage" aria-hidden="true">
          <div className="orbit">
            <div className="orbit-spin">
              <span className="orbit-dot" />
            </div>
          </div>

          {SMALL_HEARTS.map((h, i) => (
            <span
              key={i}
              className="sheart"
              style={{
                top: h.top,
                left: h.left,
                right: h.right,
                "--s": `${h.size}px`,
                "--d": `${h.d}s`,
              }}
            >
              <Heart size={h.size} fill="currentColor" />
            </span>
          ))}

          <div className="phone">
            <div className="phone-body">
              <div className="phone-notch" />
              <div className="phone-screen">
                <div className="pcard">
                  <div className="avatar">
                    <span className="avatar-head" />
                    <span className="avatar-body" />
                  </div>
                  <div className="pcard-lines">
                    <b />
                    <s />
                  </div>
                </div>

                <div className="phone-actions">
                  <span className="pbtn pbtn-x">
                    <X size={20} strokeWidth={3} />
                  </span>
                  <span className="pbtn pbtn-like">
                    <Heart size={19} fill="currentColor" />
                    <em className="pburst">
                      <Heart size={14} fill="currentColor" />
                    </em>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="gcard gcard-left">
            <div className="gcard-body">
              <Users size={24} />
              <span>
                Find
                <br />
                Like-minded
                <br />
                People
              </span>
            </div>
          </div>

          <div className="gcard gcard-right">
            <div className="gcard-body">
              <Handshake size={24} />
              <span>
                Get
                <br />
                Mutual
                <br />
                Matches
              </span>
            </div>
          </div>
        </div>

        <p className="intro-caption">
          A new way to discover
          <br />
          real connections.
        </p>

        <button className="intro-cta" onClick={enter}>
          <span>Let's Discover</span>
          <ArrowRight size={18} />
        </button>

        <div className="intro-dots" aria-hidden="true">
          <span className="on" />
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}