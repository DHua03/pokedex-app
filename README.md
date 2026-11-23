# Full-Stack Pokémon Team Builder & Analyzer

A high-performance, full-stack Pokémon team-builder application built with React, Vite, Node.js, Express, and PostgreSQL that allows users to construct teams, analyze defensive and offensive type coverage, and manage user data using data structures optimized for speed.

## Overview

This application provides an interactive team-building interface where users can search across thousands of Pokémon entries, assemble custom teams, calculate dual-type elemental coverages, and save favorites and squads securely to a relational database.

The application optimizes frontend performance by leveraging memoized JavaScript hash maps (`Map`) for $O(1)$ lookups across the complete PokéAPI dataset and structures backend persistence using normalized PostgreSQL relational schemas with B-Tree indexes for $O(\log N)$ query execution.

## Features

* Search and filter through thousands of Pokémon entities with instant response times
* Build, name, and manage custom 6-slot Pokémon teams (`TeamBuilder.jsx`)
* Custom type-coverage engine (`typeChart.js`) evaluating dual-type strengths, weaknesses, immunities, and resistances
* Persistent user favorites (`Favorites.jsx`, `FavoriteButton.jsx`) and saved teams via backend database storage[cite: 1, 2]
* Relational data integrity enforced via foreign keys and `CASCADE` deletes
* Secure authentication (`Login.jsx`, `Register.jsx`, `authMiddleware.js`) and protected API endpoints[cite: 1, 2]
* Clean code quality maintained with ESLint

## Tech Stack

* React 18
* Vite
* JavaScript (ES6+)
* Node.js
* Express.js
* PostgreSQL (Supabase)
* REST API
* CSS

## Project Structure

```text
pokedex-app/
│
├── backend/
│   ├── middleware/
│   │   └── authMiddleware.js    # Protected route authentication verification
│   ├── routes/
│   │   ├── auth.js              # Authentication route handlers
│   │   ├── favorites.js         # User favorites route handlers
│   │   └── teams.js             # Team management route handlers
│   ├── database.env             # Backend environment configuration
│   ├── db.js                    # Database connection pool setup
│   ├── package.json             # Backend dependencies and scripts
│   ├── package-lock.json        # Backend dependency lock file
│   ├── schema.sql               # Normalized PostgreSQL schema & B-Tree indexes
│   └── server.js                # Express application entry point
│
├── frontend/
│   ├── public/                  # Static browser assets and icons
│   │   ├── favicon.svg
│   │   └── icons.svg
│   ├── src/
│   │   ├── assets/              # Local image and graphic assets
│   │   ├── components/          # Reusable UI components
│   │   │   ├── FavoriteButton.jsx
│   │   │   └── PokemonModal.jsx
│   │   ├── pages/               # Page-level view containers
│   │   │   ├── Favorites.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── TeamBuilder.jsx
│   │   ├── services/            # API integration and core logic engines
│   │   │   ├── api.js
│   │   │   ├── pokeapi.js
│   │   │   └── typeChart.js
│   │   ├── App.css              # Main application styling
│   │   ├── App.jsx              # Root component container
│   │   ├── index.css            # Global CSS styles
│   │   └── main.jsx             # React DOM entry point
│   ├── eslint.config.js         # ESLint configuration
│   ├── index.html               # HTML entry point
│   ├── package.json             # Frontend dependencies and scripts
│   ├── package-lock.json        # Frontend dependency lock file
│   └── vite.config.js           # Vite configuration
│
├── .gitignore                   # Global ignore rules for dependencies & secrets
├── package.json                 # Root workspace scripts (concurrently runner)
├── package-lock.json            # Root dependency lock file
└── README.md
```

## Installations

Make sure Node.js and npm are installed on your system.

### 1. Clone Repository, Navigate to Project Directory, and Install Dependencies

```bash
git clone https://github.com/DHua03/pokedex-app.git
cd pokedex-app
npm install
```

### 2. Navigate and Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Configure Environment Variables

Create a file named `database.env` inside the `backend/` directory and add your configuration:

```env
PORT=your_port_number
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_super_secret_jwt_key_here
```

### 4. Database Setup

Execute the contents of `backend/schema.sql` in your PostgreSQL SQL console to initialize tables and performance indexes.

### 5. Navigate and Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### 6. Navigate to Project Directory and Run Project

```bash
cd ..
npm run dev
```
Open the local development URL provided by Vite in your browser.


## What I Learned

* Designing normalized relational database schemas with foreign keys and cascading rules in PostgreSQL
* Implementing B-Tree database indexes to optimize relational query performance to $O(\log N)$
* Managing large frontend datasets efficiently by replacing linear array scans with $O(1)$ JavaScript Map objects and useMemo
* Structuring modular React architectures featuring decoupled pages (TeamBuilder.jsx, Favorites.jsx), atomic components, and service layers (pokeapi.js, typeChart.js)
* Developing modular backend route handlers and custom authentication middleware in Express.js
* Handling asynchronous REST API requests and managing loading/error states safely
* Maintaining code standards and quality using ESLint

## Future Improvements

* **Pokémon Showdown Import/Export:** Add functionality to parse and export standard Pokémon Showdown team text formats, allowing users to easily share builds or test teams in external battle simulators.
* **Advanced Team Customization:** Expand slots beyond base species to include custom movesets, abilities, and held items that dynamically factor into the type-coverage analyzer (e.g., accounting for immunities granted by *Levitate*).
* **Visual UI Polish:** Elevate the application's aesthetic with modern webpage layouts, custom type-themed color palettes, glassmorphism card designs, smooth micro-interactions, and fully responsive screen adaptations.
* **UX & Accessibility (a11y) Enhancements:** Improve usability with drag-and-drop team slot reordering, intuitive user flows, keyboard navigation support, and full screen-reader compatibility.
* **Automated Testing Suite:** Implement unit tests for `typeChart.js` coverage calculations using **Vitest** and integration tests for Express API routes using **Supertest**.
* **Docker & Docker Compose Containerization:** Containerize the React frontend, Express backend, and PostgreSQL database so the entire application stack can be launched seamlessly via a single `docker-compose up` command.
* **Public Team Community Gallery:** Enable users to toggle saved squads as "Public" so other members of the app can browse, clone, and rate community-built teams.
* **CI/CD Pipeline & Cloud Deployment:** Configure GitHub Actions to automate linting and testing on pull requests, and deploy the application live to cloud hosting platforms (e.g., Vercel and Render).

## Author

Dylan Hua\
Computer Science Graduate | Software Engineer\
GitHub: https://github.com/DHua03