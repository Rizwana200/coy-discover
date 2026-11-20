\documentclass[11pt,a4paper]{article}

\usepackage[margin=1in]{geometry}
\usepackage[T1]{fontenc}
\usepackage{lmodern}
\usepackage{xcolor}
\usepackage{listings}
\usepackage{array}
\usepackage{tabularx}
\usepackage{booktabs}
\usepackage{enumitem}
\usepackage{amssymb}
\usepackage{titlesec}
\usepackage[colorlinks=true,linkcolor=blue!60!black,urlcolor=blue!60!black]{hyperref}

\definecolor{codebg}{RGB}{245,245,245}
\definecolor{codeframe}{RGB}{200,200,200}

\lstset{
  backgroundcolor=\color{codebg},
  frame=single,
  rulecolor=\color{codeframe},
  basicstyle=\ttfamily\small,
  breaklines=true,
  breakatwhitespace=false,
  columns=fullflexible,
  keepspaces=true,
  showstringspaces=false,
  xleftmargin=0.5em,
  xrightmargin=0.5em,
  aboveskip=0.8em,
  belowskip=0.8em
}

\lstdefinelanguage{SQL}{
  keywords={CREATE,TABLE,NOT,NULL,PRIMARY,KEY,CHECK,IN,DEFAULT,UNIQUE,INDEX,ON,ALTER,ENABLE,ROW,LEVEL,SECURITY,GENERATED,ALWAYS,AS,IDENTITY},
  keywordstyle=\color{blue!60!black}\bfseries,
  sensitive=false,
  morecomment=[l]{--},
  morestring=[b]'
}

\setlist{itemsep=2pt,topsep=4pt}
\setlength{\parindent}{0pt}
\setlength{\parskip}{6pt}
\titleformat{\section}{\Large\bfseries}{\thesection.}{0.5em}{}[\titlerule]
\titleformat{\subsection}{\large\bfseries}{}{0em}{}

\newcommand{\code}[1]{\texttt{#1}}
\newcommand{\done}{$\boxtimes$\ }
\newcommand{\todo}{$\square$\ }

\title{\textbf{Coy Discover}\\[4pt]\large A Profile Discovery Application}
\author{P Rizwana}
\date{}

\begin{document}

\maketitle

\begin{center}
\emph{Built with React, Vite, Node.js, Express, and Supabase PostgreSQL.}\\
Users can discover profiles, like or pass on them, view matches, revisit skipped profiles, and manage their swipe history.
\end{center}

\tableofcontents
\bigskip

%-----------------------------------------------------------
\section{Project Overview}

Coy Discover is a standalone profile discovery application developed as part of a development assignment.

The application provides a card-based discovery interface where visitors can interact with profiles and view their previous actions.

Each browser visitor receives a unique visitor ID. Their likes and passes are stored separately in a PostgreSQL database.

%-----------------------------------------------------------
\section{Technologies Used}

\subsection*{Frontend}
\begin{itemize}
  \item React
  \item Vite
  \item JavaScript
  \item CSS
  \item Lucide React Icons
\end{itemize}

\subsection*{Backend}
\begin{itemize}
  \item Node.js
  \item Express.js
  \item JavaScript
  \item PostgreSQL driver (\code{pg})
  \item CORS
\end{itemize}

\subsection*{Database}
\begin{itemize}
  \item Supabase PostgreSQL
  \item SQL
  \item Row Level Security (RLS)
\end{itemize}

\subsection*{Deployment}
\begin{itemize}
  \item GitHub
  \item Render (planned deployment)
\end{itemize}

%-----------------------------------------------------------
\section{Features}

\subsection*{Discover}
\begin{itemize}
  \item Displays available profiles.
  \item Supports profile discovery through an interactive card interface.
  \item Allows visitors to like or pass on profiles.
  \item Automatically removes previously swiped profiles from the Discover feed.
\end{itemize}

\subsection*{Likes and Passes}
\begin{itemize}
  \item Visitors can like profiles.
  \item Visitors can pass on profiles.
  \item Swipe actions are stored in the database.
  \item Duplicate swipe actions for the same visitor and profile are prevented.
\end{itemize}

\subsection*{Matches}
\begin{itemize}
  \item Displays profiles that the visitor liked and that have \code{likesMe} set to true.
  \item Shows matching profile information.
\end{itemize}

\subsection*{Skipped Profiles}
\begin{itemize}
  \item Displays previously passed profiles.
  \item Allows visitors to revisit skipped profiles.
\end{itemize}

\subsection*{Undo Pass}
\begin{itemize}
  \item Removes a previous pass.
  \item Returns that profile to the Discover feed.
\end{itemize}

\subsection*{Change Pass to Like}
\begin{itemize}
  \item Allows visitors to change a previous pass into a like.
  \item Checks whether the profile qualifies as a match.
\end{itemize}

\subsection*{Visitor-Specific Data}
\begin{itemize}
  \item Generates a unique visitor ID in the browser.
  \item Stores the visitor ID in \code{localStorage}.
  \item Keeps each visitor's swipe history separate.
  \item Preserves swipe history across browser refreshes and visits using the same browser storage.
\end{itemize}

%-----------------------------------------------------------
\section{Project Structure}

\begin{lstlisting}
coy-discover/
|
|-- client/
|   |-- public/
|   |-- src/
|   |   |-- App.jsx
|   |   |-- index.css
|   |   `-- animations.css
|   |-- package.json
|   `-- vite.config.js
|
|-- server/
|   |-- data/
|   |   `-- state.json
|   |-- profiles.json
|   |-- profiles_raw.json
|   |-- generateProfiles.js
|   |-- server.js
|   `-- package.json
|
|-- README.md
`-- package.json
\end{lstlisting}

\textbf{Note:} \code{state.json} was used for the earlier local JSON-based storage implementation. Swipe history is now stored in Supabase PostgreSQL.

%-----------------------------------------------------------
\section{Database Design}

The application uses Supabase PostgreSQL to persist visitor swipe history.

\subsection*{Table: \code{public.swipes}}

\begin{tabularx}{\textwidth}{@{}l l X@{}}
\toprule
\textbf{Column} & \textbf{Data Type} & \textbf{Description} \\
\midrule
\code{id}         & bigint      & Unique record ID \\
\code{visitor\_id} & text        & Identifies the browser visitor \\
\code{profile\_id} & text        & Identifies the interacted profile \\
\code{direction}  & text        & Like or pass \\
\code{created\_at} & timestamptz & Date and time of the action \\
\bottomrule
\end{tabularx}

\subsection*{Database Constraints}
\begin{itemize}
  \item Primary key on \code{id}.
  \item Unique combination of \code{visitor\_id} and \code{profile\_id}.
  \item Direction restricted to \code{like} or \code{pass}.
  \item Index on \code{visitor\_id}.
  \item Row Level Security enabled.
\end{itemize}

\subsection*{SQL Schema}

\begin{lstlisting}[language=SQL]
CREATE TABLE public.swipes (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    visitor_id text NOT NULL,
    profile_id text NOT NULL,
    direction text NOT NULL
        CHECK (direction IN ('like', 'pass')),
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (visitor_id, profile_id)
);

CREATE INDEX swipes_visitor_id_idx
ON public.swipes(visitor_id);

ALTER TABLE public.swipes
ENABLE ROW LEVEL SECURITY;
\end{lstlisting}

The backend connects to PostgreSQL using the \code{pg} package.

%-----------------------------------------------------------
\section{Backend API Endpoints}

Base URL during local development:

\begin{lstlisting}
http://localhost:5000
\end{lstlisting}

\begin{tabularx}{\textwidth}{@{}l l X@{}}
\toprule
\textbf{Method} & \textbf{Endpoint} & \textbf{Description} \\
\midrule
GET  & \code{/}               & Backend health check \\
GET  & \code{/feed}           & Retrieves profiles not yet swiped \\
POST & \code{/swipe}          & Saves a like or pass \\
GET  & \code{/matches}        & Retrieves matching profiles \\
GET  & \code{/skipped}        & Retrieves passed profiles \\
POST & \code{/undo-pass}      & Removes a previous pass \\
POST & \code{/change-to-like} & Changes a pass into a like \\
\bottomrule
\end{tabularx}

\subsection*{Visitor Identification}

All API requests except the health check require the following HTTP header:

\begin{lstlisting}
x-user-id: visitor-unique-id
\end{lstlisting}

The frontend generates and stores this ID in browser \code{localStorage}.

\subsection*{Example Swipe Request}

\begin{lstlisting}
{
  "profileId": "p1",
  "direction": "like"
}
\end{lstlisting}

Allowed directions:
\begin{itemize}
  \item \code{like}
  \item \code{pass}
\end{itemize}

%-----------------------------------------------------------
\section{Local Installation and Setup}

\subsection*{Prerequisites}
\begin{itemize}
  \item Node.js
  \item npm
  \item Git
  \item Supabase account
\end{itemize}

\subsection*{Step 1: Clone the Repository}

\begin{lstlisting}[language=bash]
git clone https://github.com/Rizwana200/coy-discover.git
cd coy-discover
\end{lstlisting}

\subsection*{Step 2: Install Backend Dependencies}

\begin{lstlisting}[language=bash]
cd server
npm install
\end{lstlisting}

\subsection*{Step 3: Configure Database Connection}

Set the Supabase PostgreSQL connection string as an environment variable.

Variable name:

\begin{lstlisting}
DATABASE_URL
\end{lstlisting}

Example format:

\begin{lstlisting}
postgresql://username:password@host:5432/postgres
\end{lstlisting}

Do not commit database credentials to GitHub.

For Git Bash, set the variable temporarily:

\begin{lstlisting}[language=bash]
export DATABASE_URL='YOUR_SUPABASE_CONNECTION_STRING'
\end{lstlisting}

\subsection*{Step 4: Start Backend}

\begin{lstlisting}[language=bash]
npm start
\end{lstlisting}

Backend runs at:

\begin{lstlisting}
http://localhost:5000
\end{lstlisting}

\subsection*{Step 5: Install Frontend Dependencies}

Open another terminal:

\begin{lstlisting}[language=bash]
cd client
npm install
\end{lstlisting}

\subsection*{Step 6: Start Frontend}

\begin{lstlisting}[language=bash]
npm run dev
\end{lstlisting}

Frontend runs at:

\begin{lstlisting}
http://localhost:5173
\end{lstlisting}

%-----------------------------------------------------------
\section{Environment Variables}

\subsection*{Backend}

\begin{tabularx}{\textwidth}{@{}l X@{}}
\toprule
\textbf{Variable} & \textbf{Description} \\
\midrule
\code{DATABASE\_URL} & Supabase PostgreSQL connection string \\
\code{PORT}         & Backend port; supplied by Render during deployment \\
\bottomrule
\end{tabularx}

\subsection*{Frontend}

\begin{tabularx}{\textwidth}{@{}l X@{}}
\toprule
\textbf{Variable} & \textbf{Description} \\
\midrule
\code{VITE\_API\_URL} & Deployed backend URL \\
\bottomrule
\end{tabularx}

For local development, the frontend uses \code{http://localhost:5000} as its default API URL.

%-----------------------------------------------------------
\section{Deployment Plan}

The application is intended to be deployed using Render.

\subsection*{Backend Deployment}
\begin{itemize}
  \item Service type: Web Service
  \item Root directory: \code{server}
  \item Build command: \code{npm install}
  \item Start command: \code{npm start}
\end{itemize}

Environment variable:

\begin{lstlisting}
DATABASE_URL=YOUR_SUPABASE_CONNECTION_STRING
\end{lstlisting}

\subsection*{Frontend Deployment}
\begin{itemize}
  \item Service type: Static Site
  \item Root directory: \code{client}
  \item Build command: \code{npm install \&\& npm run build}
  \item Publish directory: \code{dist}
\end{itemize}

Environment variable:

\begin{lstlisting}
VITE_API_URL=YOUR_DEPLOYED_BACKEND_URL
\end{lstlisting}

%-----------------------------------------------------------
\section{Important Notes}

\begin{itemize}
  \item The application currently uses sample profile data stored in \code{profiles.json}.
  \item Visitor IDs are browser-generated identifiers, not authenticated user accounts.
  \item Clearing browser \code{localStorage} or using another browser creates a new visitor identity.
  \item Match results use the predefined \code{likesMe} field in the sample profile data.
  \item Supabase stores visitor swipe history, while profile information is loaded from the backend JSON file.
  \item The database connection string must remain private.
  \item Row Level Security is enabled on the database table. The backend uses its PostgreSQL connection to access the table.
\end{itemize}

%-----------------------------------------------------------
\section{Project Status}

\begin{itemize}[label={}]
  \item \done React frontend implemented
  \item \done Express backend implemented
  \item \done Profile discovery
  \item \done Like and pass functionality
  \item \done Matches
  \item \done Skipped profiles
  \item \done Undo pass
  \item \done Change pass to like
  \item \done Visitor-specific swipe history
  \item \done Supabase PostgreSQL integration
  \item \done Local database persistence tested
  \item \todo GitHub deployment-ready update
  \item \todo Render backend deployment
  \item \todo Render frontend deployment
  \item \todo Production deployment testing
\end{itemize}

%-----------------------------------------------------------
\section{Author}

\textbf{P Rizwana}

GitHub: \url{https://github.com/Rizwana200}

Project: Coy Discover

\end{document}