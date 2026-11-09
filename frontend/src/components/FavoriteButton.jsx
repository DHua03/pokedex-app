import { useState } from "react";
import API from "../services/api";

export default function FavoriteButton({ pokemon, userFavorites = [], onToggle }) {
  const [loading, setLoading] = useState(false);

  const isFav = pokemon && userFavorites
    ? userFavorites.some((f) =>
        typeof f === "object" ? Number(f.pokemon_id) === Number(pokemon.id) : Number(f) === Number(pokemon.id)
      )
    : false;

  const handleToggle = async (e) => {
    e.stopPropagation(); // Prevent opening modal if placed on a card
    if (!pokemon || loading) return;

    setLoading(true);
    try {
      const formattedName = pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1);
      
      if (isFav) {
        await API.delete(`/favorites/${pokemon.id}`);
        alert(`${formattedName} removed from favorites! 🤍`);
      } else {
        await API.post("/favorites", {
          pokemon_id: pokemon.id,
          pokemon_name: pokemon.name,
        });
        alert(`${formattedName} added to favorites! ❤️`);
      }
      if (onToggle) onToggle();
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
      alert(error.response?.data?.error || "Failed to update favorites.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      style={{
        background: "none",
        border: "none",
        fontSize: "20px",
        cursor: "pointer",
        padding: "4px",
        transition: "transform 0.15s ease",
      }}
      title={isFav ? "Remove from Favorites" : "Add to Favorites"}
    >
      {isFav ? "❤️" : "🤍"}
    </button>
  );
}