import React, { useState, useEffect } from "react";
import { getEvolutionChain, getPokemonVarieties } from "../services/pokeapi";
import { calculateDefensiveMatchups, calculateOffensiveCoverages } from "../services/typeChart";
import FavoriteButton from "./FavoriteButton"; // Import your favorite button

export default function PokemonModal({ pokemon, onClose, userFavorites = [], onFavoriteToggle }) {
  const [evolutionChain, setEvolutionChain] = useState([]);
  const [loadingEvo, setLoadingEvo] = useState(false);
  const [activeTab, setActiveTab] = useState("stats"); // 'stats', 'defense', 'offense', 'evolution', 'moves'
  const [varieties, setVarieties] = useState([]);

  // React recommended pattern: Reset state during render when prop changes (avoids useEffect setState)
  const [prevPokemonId, setPrevPokemonId] = useState(pokemon?.id);
  const [selectedVariety, setSelectedVariety] = useState(pokemon);
  const [activeFormId, setActiveFormId] = useState(pokemon?.id);

  if (pokemon?.id !== prevPokemonId) {
    setPrevPokemonId(pokemon?.id);
    setSelectedVariety(pokemon);
    setActiveFormId(pokemon?.id);
  }

  useEffect(() => {
    if (!pokemon) return;

    async function loadData() {
      setLoadingEvo(true);
      const chain = await getEvolutionChain(pokemon.id);
      setEvolutionChain(chain);
      setLoadingEvo(false);

      const forms = await getPokemonVarieties(pokemon.id);
      setVarieties(forms);
    }

    loadData();
  }, [pokemon]);

  if (!pokemon) return null;

  const current = selectedVariety || pokemon;
  const defenseMatchups = calculateDefensiveMatchups(current.types);
  const offenseMatchups = calculateOffensiveCoverages(current.types);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "rgba(0, 0, 0, 0.6)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "white",
          padding: "25px",
          borderRadius: "16px",
          width: "520px",
          maxWidth: "90%",
          textAlign: "center",
          position: "relative",
          boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "15px",
            right: "15px",
            background: "#eee",
            border: "none",
            borderRadius: "50%",
            width: "30px",
            height: "30px",
            cursor: "pointer",
            fontWeight: "bold",
            color: "#333",
            zIndex: 10,
          }}
        >
          ✕
        </button>

        {/* Header with ID and Favorite Heart Toggle */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 5px" }}>
          <span style={{ fontSize: "14px", color: "#64748b", fontWeight: "700" }}>
            #{String(current.id).padStart(3, "0")}
          </span>
          <FavoriteButton pokemon={current} userFavorites={userFavorites} onToggle={onFavoriteToggle} />
        </div>

        <img
          src={current.image}
          alt={current.name}
          style={{ width: "120px", height: "120px", objectFit: "contain", margin: "5px auto" }}
        />

        <h2 style={{ textTransform: "capitalize", margin: "0 0 8px 0", color: "#0f172a", fontSize: "24px", fontWeight: "800" }}>
          {current.name}
        </h2>

        {/* Variety / Mega Form Selector */}
        {varieties.length > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginBottom: "12px", flexWrap: "wrap" }}>
            {varieties.map((form) => {
              const isSelected = activeFormId === form.id;
              return (
                <button
                  key={form.id}
                  onClick={() => {
                    setActiveFormId(form.id);
                    setSelectedVariety(form);
                  }}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "12px",
                    border: "1px solid #3b4cca",
                    background: isSelected ? "#3b4cca" : "white",
                    color: isSelected ? "white" : "#3b4cca",
                    fontSize: "11px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    textTransform: "capitalize",
                    transition: "all 0.2s ease",
                  }}
                >
                  {form.name}
                </button>
              );
            })}
          </div>
        )}

        {/* Type Badges */}
        <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginBottom: "15px" }}>
          {current.types.map((t) => (
            <span
              key={t}
              style={{
                background: "#ee1515",
                color: "white",
                padding: "3px 10px",
                borderRadius: "12px",
                fontSize: "12px",
                textTransform: "capitalize",
                fontWeight: "bold",
              }}
            >
              {t}
            </span>
          ))}
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: "flex", justifyContent: "center", gap: "5px", marginBottom: "15px", borderBottom: "1px solid #e2e8f0", paddingBottom: "10px", flexWrap: "wrap" }}>
          <button
            onClick={() => setActiveTab("stats")}
            style={{ padding: "6px 8px", borderRadius: "6px", border: "none", background: activeTab === "stats" ? "#3b4cca" : "#f1f5f9", color: activeTab === "stats" ? "white" : "#475569", fontWeight: "bold", cursor: "pointer", fontSize: "11px" }}
          >
            Stats
          </button>
          <button
            onClick={() => setActiveTab("defense")}
            style={{ padding: "6px 8px", borderRadius: "6px", border: "none", background: activeTab === "defense" ? "#3b4cca" : "#f1f5f9", color: activeTab === "defense" ? "white" : "#475569", fontWeight: "bold", cursor: "pointer", fontSize: "11px" }}
          >
            Defense 🛡️
          </button>
          <button
            onClick={() => setActiveTab("offense")}
            style={{ padding: "6px 8px", borderRadius: "6px", border: "none", background: activeTab === "offense" ? "#3b4cca" : "#f1f5f9", color: activeTab === "offense" ? "white" : "#475569", fontWeight: "bold", cursor: "pointer", fontSize: "11px" }}
          >
            Offense ⚔️
          </button>
          <button
            onClick={() => setActiveTab("evolution")}
            style={{ padding: "6px 8px", borderRadius: "6px", border: "none", background: activeTab === "evolution" ? "#3b4cca" : "#f1f5f9", color: activeTab === "evolution" ? "white" : "#475569", fontWeight: "bold", cursor: "pointer", fontSize: "11px" }}
          >
            Evolutions
          </button>
          <button
            onClick={() => setActiveTab("moves")}
            style={{ padding: "6px 8px", borderRadius: "6px", border: "none", background: activeTab === "moves" ? "#3b4cca" : "#f1f5f9", color: activeTab === "moves" ? "white" : "#475569", fontWeight: "bold", cursor: "pointer", fontSize: "11px" }}
          >
            Moves
          </button>
        </div>

        {/* Tab Content Container */}
        <div style={{ overflowY: "auto", maxHeight: "300px", paddingRight: "4px" }}>
          {/* TAB 1: STATS */}
          {activeTab === "stats" && (
            <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "10px", textAlign: "left", border: "1px solid #e2e8f0" }}>
              <h4 style={{ margin: "0 0 10px 0", color: "#3b4cca", fontSize: "13px", textTransform: "uppercase", fontWeight: "800" }}>
                Base Stats (BST: {current.bst})
              </h4>
              {current.stats &&
                current.stats.map((s) => (
                  <div key={s.name} style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "13px" }}>
                    <span style={{ textTransform: "capitalize", color: "#475569", fontWeight: "600" }}>{s.name}:</span>
                    <span style={{ fontWeight: "700", color: "#0f172a" }}>{s.value}</span>
                  </div>
                ))}
            </div>
          )}

          {/* TAB 2: DEFENSIVE MATCHUPS */}
          {activeTab === "defense" && (
            <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "10px", textAlign: "left", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <h5 style={{ margin: "0 0 6px 0", color: "#ef4444", fontSize: "12px", textTransform: "uppercase", fontWeight: "800" }}>
                  Weak Against (Takes 2x+ Damage)
                </h5>
                {defenseMatchups.weaknesses.length > 0 ? (
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {defenseMatchups.weaknesses.map((w) => (
                      <span key={w.type} style={{ background: "#fee2e2", color: "#991b1b", padding: "2px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "bold", textTransform: "capitalize" }}>
                        {w.type} ({w.mult}x)
                      </span>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>None</p>
                )}
              </div>

              <div>
                <h5 style={{ margin: "0 0 6px 0", color: "#22c55e", fontSize: "12px", textTransform: "uppercase", fontWeight: "800" }}>
                  Resistant Against (Takes 0.5x- Damage)
                </h5>
                {defenseMatchups.resistances.length > 0 ? (
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {defenseMatchups.resistances.map((r) => (
                      <span key={r.type} style={{ background: "#dcfce7", color: "#166534", padding: "2px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "bold", textTransform: "capitalize" }}>
                        {r.type} ({r.mult}x)
                      </span>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>None</p>
                )}
              </div>

              <div>
                <h5 style={{ margin: "0 0 6px 0", color: "#64748b", fontSize: "12px", textTransform: "uppercase", fontWeight: "800" }}>
                  Immune Against (Takes 0x Damage)
                </h5>
                {defenseMatchups.immunities.length > 0 ? (
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {defenseMatchups.immunities.map((i) => (
                      <span key={i.type} style={{ background: "#f1f5f9", color: "#334155", padding: "2px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "bold", textTransform: "capitalize" }}>
                        {i.type} (0x)
                      </span>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>None</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: OFFENSIVE COVERAGE */}
          {activeTab === "offense" && (
            <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "10px", textAlign: "left", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <h5 style={{ margin: "0 0 6px 0", color: "#22c55e", fontSize: "12px", textTransform: "uppercase", fontWeight: "800" }}>
                  Super Effective Against (Deals 2x Damage)
                </h5>
                {offenseMatchups.superEffective.length > 0 ? (
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {offenseMatchups.superEffective.map((t) => (
                      <span key={t} style={{ background: "#dcfce7", color: "#166534", padding: "2px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "bold", textTransform: "capitalize" }}>
                        {t}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>None</p>
                )}
              </div>

              <div>
                <h5 style={{ margin: "0 0 6px 0", color: "#d97706", fontSize: "12px", textTransform: "uppercase", fontWeight: "800" }}>
                  Not Very Effective Against (Deals 0.5x Damage)
                </h5>
                {offenseMatchups.notVeryEffective.length > 0 ? (
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {offenseMatchups.notVeryEffective.map((t) => (
                      <span key={t} style={{ background: "#fef3c7", color: "#92400e", padding: "2px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "bold", textTransform: "capitalize" }}>
                        {t}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>None</p>
                )}
              </div>

              <div>
                <h5 style={{ margin: "0 0 6px 0", color: "#64748b", fontSize: "12px", textTransform: "uppercase", fontWeight: "800" }}>
                  No Effect Against (Deals 0x Damage)
                </h5>
                {offenseMatchups.noEffect.length > 0 ? (
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {offenseMatchups.noEffect.map((t) => (
                      <span key={t} style={{ background: "#f1f5f9", color: "#334155", padding: "2px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "bold", textTransform: "capitalize" }}>
                        {t}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>None</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: EVOLUTION */}
          {activeTab === "evolution" && (
            <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
              <h4 style={{ margin: "0 0 12px 0", color: "#3b4cca", fontSize: "13px", textTransform: "uppercase", fontWeight: "800" }}>
                Evolution Requirements
              </h4>

              {loadingEvo ? (
                <p style={{ fontSize: "12px", color: "#64748b" }}>Loading evolution tree... 🧬</p>
              ) : evolutionChain.length > 1 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "center" }}>
                  {evolutionChain.map((evo, index) => (
                    <React.Fragment key={evo.id}>
                      <div style={{ display: "flex", alignItems: "center", gap: "15px", background: evo.name === current.name ? "#eff6ff" : "white", padding: "8px 12px", borderRadius: "8px", border: "1px solid #e2e8f0", width: "100%" }}>
                        <img src={evo.image} alt={evo.name} style={{ width: "45px", height: "45px", objectFit: "contain" }} />
                        <div style={{ textAlign: "left" }}>
                          <span style={{ display: "block", fontSize: "13px", textTransform: "capitalize", fontWeight: "800", color: "#1e293b" }}>
                            {evo.name}
                          </span>
                          <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "600", textTransform: "capitalize" }}>
                            {evo.condition}
                          </span>
                        </div>
                      </div>
                      {index < evolutionChain.length - 1 && (
                        <span style={{ fontSize: "14px", color: "#94a3b8", fontWeight: "bold" }}>⬇️</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: "12px", color: "#64748b" }}>This Pokémon does not evolve.</p>
              )}
            </div>
          )}

          {/* TAB 5: MOVES */}
          {activeTab === "moves" && (
            <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
              <h4 style={{ margin: "0 0 10px 0", color: "#3b4cca", fontSize: "13px", textTransform: "uppercase", fontWeight: "800" }}>
                Learnset
              </h4>
              {current.moves && current.moves.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {current.moves.map((m, idx) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", background: "white", padding: "6px 10px", borderRadius: "6px", fontSize: "12px", border: "1px solid #e2e8f0" }}>
                      <span style={{ textTransform: "capitalize", fontWeight: "700", color: "#1e293b" }}>
                        {m.name.replace(/-/g, " ")}
                      </span>
                      <span style={{ color: "#64748b", textTransform: "capitalize", fontSize: "11px" }}>
                        {m.method} {m.level > 0 ? `(Lvl ${m.level})` : ""}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: "12px", color: "#64748b" }}>No move data available for this form.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}