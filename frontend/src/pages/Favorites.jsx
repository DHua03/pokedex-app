import { useState, useEffect } from "react";
import API from "../services/api";
import axios from "axios";

export default function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const res = await API.get("/favorites");
        
        const detailedFavorites = await Promise.all(
          res.data.map(async (fav) => {
            const pokeRes = await axios.get(`https://pokeapi.co/api/v2/pokemon/${fav.pokemon_id}`);
            return {
              id: pokeRes.data.id,
              name: pokeRes.data.name,
              image: pokeRes.data.sprites.other["official-artwork"].front_default || pokeRes.data.sprites.front_default,
              types: pokeRes.data.types.map((t) => t.type.name),
            };
          })
        );

        setFavorites(detailedFavorites);
      } catch (error) {
        console.error("Failed to load favorites", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, []);

  const removeFavorite = async (id) => {
    try {
      await API.delete(`/favorites/${id}`);
      setFavorites(favorites.filter((poke) => poke.id !== id));
    } catch (error) {
      console.error("Failed to remove favorite:", error);
      alert("Failed to remove favorite.");
    }
  };

  if (loading) {
    return <h2 style={{ textAlign: "center", marginTop: "50px" }}>Loading your favorite Pokémon... ⭐</h2>;
  }

  if (favorites.length === 0) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        <h2>No Favorite Pokémon Yet!</h2>
        <p>Go back to the Home page and click "Favorite" on any Pokémon you like.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "30px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ textAlign: "center", marginBottom: "30px" }}>❤️ My Favorite Pokémon</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "20px" }}>
        {favorites.map((poke) => (
          <div
            key={poke.id}
            style={{
              border: "1px solid #e0e0e0",
              borderRadius: "12px",
              padding: "15px",
              textAlign: "center",
              boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
              background: "#ffffff",
            }}
          >
            <span style={{ fontSize: "14px", color: "#888", fontWeight: "bold" }}>#{String(poke.id).padStart(3, "0")}</span>
            <img src={poke.image} alt={poke.name} style={{ width: "120px", height: "120px", objectFit: "contain" }} />
            <h3 style={{ textTransform: "capitalize", margin: "10px 0 5px 0" }}>{poke.name}</h3>

            <div style={{ display: "flex", justifyContent: "center", gap: "5px", marginBottom: "15px" }}>
              {poke.types.map((t) => (
                <span
                  key={t}
                  style={{
                    background: "#ee1515",
                    color: "white",
                    padding: "2px 8px",
                    borderRadius: "12px",
                    fontSize: "12px",
                    textTransform: "capitalize",
                  }}
                >
                  {t}
                </span>
              ))}
            </div>

            <button
              onClick={() => removeFavorite(poke.id)}
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "6px",
                border: "none",
                background: "#ff3333",
                color: "white",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              🗑️ Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}