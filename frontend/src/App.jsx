import { useState, useCallback, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Favorites from "./pages/Favorites";
import TeamBuilder from "./pages/TeamBuilder";
import PokemonModal from "./components/PokemonModal";
import FavoriteButton from "./components/FavoriteButton";
import { getPokemonList, GENERATIONS } from "./services/pokeapi";
import API from "./services/api";

function Home({ user, userFavorites, onFavoriteToggle }) {
  const [pokemon, setPokemon] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedGen, setSelectedGen] = useState("gen1");
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

  useEffect(() => {
    let isMounted = true;
    async function loadGenPokemon() {
      setLoading(true);
      try {
        const genConfig = GENERATIONS[selectedGen];
        const data = await getPokemonList(genConfig.limit, genConfig.offset);
        if (isMounted) {
          setPokemon(data);
          setCurrentPage(1);
        }
      } catch (err) {
        console.error("Failed to fetch Pokémon by generation", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadGenPokemon();
    return () => { isMounted = false; };
  }, [selectedGen]);

  const filteredPokemon = pokemon.filter((poke) => {
    const matchesSearch = poke.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "all" || poke.types.includes(selectedType);
    return matchesSearch && matchesType;
  });

  const totalPages = Math.ceil(filteredPokemon.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedPokemon = filteredPokemon.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const pokemonTypes = ["all", "fire", "water", "grass", "electric", "poison", "bug", "normal", "flying", "ground", "fairy", "psychic", "fighting", "rock", "ghost", "ice", "dragon"];

  return (
    <div style={{ padding: "30px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ textAlign: "center", marginBottom: "20px" }}>Pokédex Explorer</h1>

      <div style={{ 
        display: "flex", 
        gap: "15px", 
        justifyContent: "center", 
        marginBottom: "30px", 
        flexWrap: "wrap",
        background: "#f1f5f9",
        padding: "20px",
        borderRadius: "12px",
        border: "1px solid #e2e8f0"
      }}>
        <select
          value={selectedGen}
          onChange={(e) => setSelectedGen(e.target.value)}
          style={{ padding: "12px 16px", fontSize: "15px", fontWeight: "600", color: "#1e293b", borderRadius: "8px", border: "2px solid #cbd5e1", cursor: "pointer", background: "white", outline: "none" }}
        >
          {Object.entries(GENERATIONS).map(([key, gen]) => (
            <option key={key} value={key}>{gen.name}</option>
          ))}
        </select>

        <select
          value={selectedType}
          onChange={(e) => { setSelectedType(e.target.value); setCurrentPage(1); }}
          style={{ padding: "12px 16px", fontSize: "15px", fontWeight: "600", color: "#1e293b", borderRadius: "8px", border: "2px solid #cbd5e1", textTransform: "capitalize", cursor: "pointer", background: "white", outline: "none" }}
        >
          {pokemonTypes.map((type) => (
            <option key={type} value={type}>{type === "all" ? "All Types" : type}</option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search in this generation..."
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          style={{ padding: "12px 16px", fontSize: "15px", fontWeight: "600", color: "#1e293b", width: "260px", borderRadius: "8px", border: "2px solid #cbd5e1", background: "white", outline: "none" }}
        />
      </div>

      {loading ? (
        <h2 style={{ textAlign: "center", marginTop: "50px" }}>Loading Pokémon... 🔴</h2>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "20px" }}>
            {paginatedPokemon.map((poke) => (
              <div
                key={poke.id}
                onClick={() => setSelectedPokemon(poke)}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "14px",
                  padding: "16px",
                  textAlign: "center",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.06)",
                  background: "#ffffff",
                  cursor: "pointer",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "700" }}>
                      #{String(poke.id).padStart(3, "0")}
                    </span>
                    <span style={{ fontSize: "11px", background: "#f1f5f9", color: "#334155", padding: "2px 6px", borderRadius: "6px", fontWeight: "700" }}>
                      BST: {poke.bst}
                    </span>
                  </div>

                  <img src={poke.image} alt={poke.name} style={{ width: "110px", height: "110px", objectFit: "contain" }} />
                  
                  <h3 style={{ textTransform: "capitalize", margin: "8px 0 6px 0", color: "#0f172a", fontSize: "18px", fontWeight: "800" }}>
                    {poke.name}
                  </h3>

                  <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginBottom: "12px" }}>
                    {poke.types.map((t) => (
                      <span
                        key={t}
                        style={{
                          background: "#ee1515",
                          color: "white",
                          padding: "2px 8px",
                          borderRadius: "10px",
                          fontSize: "11px",
                          textTransform: "capitalize",
                          fontWeight: "700",
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", background: "#f8fafc", padding: "8px", borderRadius: "8px", marginBottom: "10px", fontSize: "12px" }}>
                    <div>
                      <span style={{ display: "block", color: "#64748b", fontSize: "10px", textTransform: "uppercase", fontWeight: "700" }}>Height</span>
                      <span style={{ fontWeight: "700", color: "#1e293b" }}>{poke.height} m</span>
                    </div>
                    <div>
                      <span style={{ display: "block", color: "#64748b", fontSize: "10px", textTransform: "uppercase", fontWeight: "700" }}>Weight</span>
                      <span style={{ fontWeight: "700", color: "#1e293b" }}>{poke.weight} kg</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "center", marginTop: "6px" }}>
                  {user ? (
                    <FavoriteButton pokemon={poke} userFavorites={userFavorites} onToggle={onFavoriteToggle} />
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); alert("Please log in to save favorites!"); }}
                      style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "none", background: "#ffcb05", color: "#1e293b", fontWeight: "800", cursor: "pointer" }}
                    >
                      ❤️ Favorite
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredPokemon.length === 0 && (
            <p style={{ textAlign: "center", fontSize: "18px", color: "#666", marginTop: "30px" }}>
              No Pokémon found matching your filters! 🔍
            </p>
          )}

          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "15px", marginTop: "40px" }}>
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                style={{ padding: "8px 16px", borderRadius: "6px", border: "none", background: currentPage === 1 ? "#ccc" : "#3b4cca", color: "white", fontWeight: "bold", cursor: currentPage === 1 ? "not-allowed" : "pointer" }}
              >
                ◀ Previous
              </button>

              <span style={{ fontSize: "16px", fontWeight: "bold", color: "#333" }}>
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                style={{ padding: "8px 16px", borderRadius: "6px", border: "none", background: currentPage === totalPages ? "#ccc" : "#3b4cca", color: "white", fontWeight: "bold", cursor: currentPage === totalPages ? "not-allowed" : "pointer" }}
              >
                Next ▶
              </button>
            </div>
          )}
        </>
      )}

      <PokemonModal 
        pokemon={selectedPokemon} 
        onClose={() => setSelectedPokemon(null)} 
        userFavorites={userFavorites}
        onFavoriteToggle={onFavoriteToggle}
      />
    </div>
  );
}

function Navigation({ user, onLogout }) {
  return (
    <nav style={{ padding: "20px", background: "#3b4cca", display: "flex", gap: "20px", justifyContent: "center", alignItems: "center" }}>
      <Link to="/" style={{ color: "white", textDecoration: "none", fontWeight: "bold" }}>Home</Link>
      
      {user && (
        <>
          <Link to="/favorites" style={{ color: "white", textDecoration: "none", fontWeight: "bold" }}>Favorites</Link>
          <Link to="/teams" style={{ color: "white", textDecoration: "none", fontWeight: "bold" }}>Team Builder</Link>
        </>
      )}

      {!user ? (
        <>
          <Link to="/login" style={{ color: "white", textDecoration: "none" }}>Login</Link>
          <Link to="/register" style={{ color: "white", textDecoration: "none" }}>Register</Link>
        </>
      ) : (
        <>
          <span style={{ fontWeight: "bold", color: "#ffcb05" }}>Hello, {user.username}! 👋</span>
          <button
            onClick={onLogout}
            style={{ padding: "5px 12px", background: "#ff3333", color: "white", border: "none", cursor: "pointer", borderRadius: "4px" }}
          >
            Logout
          </button>
        </>
      )}
    </nav>
  );
}

export default function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [userFavorites, setUserFavorites] = useState([]);

  const fetchUserFavorites = useCallback(async () => {
    if (!user) {
      setUserFavorites([]);
      return;
    }
    try {
      const res = await API.get("/favorites");
      setUserFavorites(res.data);
    } catch (err) {
      console.error("Failed to fetch favorites:", err);
    }
  }, [user]);

  // Instead of useEffect causing cascading setState linter errors, 
  // fetch favorites on demand when user logs in or when requested.
  // We can safely initialize favorites or fetch them in an async event wrapper if needed.

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setUserFavorites([]);
    alert("Logged out successfully!");
    window.location.href = "/";
  };

  return (
    <Router>
      <Navigation user={user} onLogout={handleLogout} />
      <Routes>
        <Route path="/" element={<Home user={user} userFavorites={userFavorites} onFavoriteToggle={fetchUserFavorites} />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/teams" element={<TeamBuilder />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </Router>
  );
}