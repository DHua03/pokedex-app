import { useState, useEffect, useCallback, useMemo } from "react";
import API from "../services/api";
import axios from "axios";
import { calculateDefensiveMatchups, calculateOffensiveCoverages } from "../services/typeChart";

export default function TeamBuilder() {
  const [teams, setTeams] = useState([]);
  const [newTeamName, setNewTeamName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [allPokemonList, setAllPokemonList] = useState([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [stagedPokemon, setStagedPokemon] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Fetch user teams and enrich member data
  const fetchTeamsAndDetails = useCallback(async () => {
    try {
      const teamsRes = await API.get("/teams");
      const rawTeams = teamsRes.data;

      const enrichedTeams = await Promise.all(
        rawTeams.map(async (team) => {
          const memberPromises = (team.pokemon_ids || []).map(async (id) => {
            try {
              const res = await axios.get(`https://pokeapi.co/api/v2/pokemon/${id}`);
              const types = res.data.types.map((t) => t.type.name);
              const stats = {
                hp: res.data.stats[0]?.base_stat || 0,
                atk: res.data.stats[1]?.base_stat || 0,
                def: res.data.stats[2]?.base_stat || 0,
                spAtk: res.data.stats[3]?.base_stat || 0,
                spDef: res.data.stats[4]?.base_stat || 0,
                spd: res.data.stats[5]?.base_stat || 0,
              };
              const bst = Object.values(stats).reduce((acc, curr) => acc + curr, 0);

              return {
                id: res.data.id,
                name: res.data.name,
                image: res.data.sprites.other["official-artwork"].front_default || res.data.sprites.front_default,
                types,
                stats,
                bst,
              };
            } catch {
              return { id, name: `poke #${id}`, image: "", types: [], stats: {}, bst: 0 };
            }
          });
          const members = await Promise.all(memberPromises);
          return { ...team, members };
        })
      );

      setTeams(enrichedTeams);
      setSelectedTeamId((prev) => {
        if (!prev && enrichedTeams.length > 0) return enrichedTeams[0].id;
        return prev;
      });
    } catch (error) {
      console.error("Failed to load teams:", error);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadInitial = async () => {
      try {
        const pokeListRes = await axios.get("https://pokeapi.co/api/v2/pokemon?limit=15000");
        if (isMounted) {
          const formattedList = pokeListRes.data.results.map((p) => {
            const urlSegments = p.url.split("/").filter(Boolean);
            const realId = parseInt(urlSegments[urlSegments.length - 1], 10);
            return { id: realId, name: p.name };
          });
          setAllPokemonList(formattedList);
        }
        await fetchTeamsAndDetails();
      } catch (error) {
        console.error("Failed to load initial data:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadInitial();
    return () => { isMounted = false; };
  }, [fetchTeamsAndDetails]);

  // ==========================================
  // HASH MAP OPTIMIZATIONS (O(1) Lookups)
  // ==========================================
  
  // Hash Map for Teams: Key = team.id, Value = team object
  const teamsMap = useMemo(() => {
    const map = new Map();
    teams.forEach((t) => map.set(String(t.id), t));
    return map;
  }, [teams]);

  // Hash Map for All Pokémon: Key = pokemon.id (string), Value = pokemon object
  const pokemonHashMap = useMemo(() => {
    const map = new Map();
    allPokemonList.forEach((p) => map.set(String(p.id), p));
    return map;
  }, [allPokemonList]);

  const refreshTeams = async () => {
    await fetchTeamsAndDetails();
  };

  // 2. Optimized Autocomplete Search
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (!query.trim()) {
      setFilteredSuggestions([]);
      return;
    }

    const lowerQuery = query.toLowerCase().trim();
    const matches = allPokemonList
      .filter((p) => p.name.includes(lowerQuery) || p.id.toString() === lowerQuery)
      .slice(0, 8);

    setFilteredSuggestions(matches);
  };

  const handleSelectSuggestion = async (poke) => {
    // O(1) validation check using pokemonHashMap
    const hashedMatch = pokemonHashMap.get(String(poke.id));
    if (!hashedMatch) {
      alert("Pokémon not found in index.");
      return;
    }

    setSearchQuery(poke.name);
    setFilteredSuggestions([]);

    try {
      const res = await axios.get(`https://pokeapi.co/api/v2/pokemon/${poke.id}`);
      setSelectedPokemon({
        id: res.data.id,
        name: res.data.name,
        image: res.data.sprites.other["official-artwork"].front_default || res.data.sprites.front_default,
        types: res.data.types.map((t) => t.type.name),
      });
    } catch (error) {
      console.error("Failed to fetch Pokémon details:", error);
      alert("Could not load Pokémon details.");
    }
  };

  const handleStagePokemon = (poke) => {
    if (stagedPokemon.length >= 6) {
      alert("A team can have a maximum of 6 Pokémon!");
      return;
    }
    if (stagedPokemon.some((p) => p.id === poke.id)) {
      alert("This Pokémon is already staged!");
      return;
    }
    setStagedPokemon([...stagedPokemon, poke]);
    setSelectedPokemon(null);
    setSearchQuery("");
  };

  const handleUnstagePokemon = (pokeId) => {
    setStagedPokemon(stagedPokemon.filter((p) => p.id !== pokeId));
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!newTeamName.trim()) {
      alert("Please enter a team name.");
      return;
    }
    if (stagedPokemon.length === 0) {
      alert("Please add at least one Pokémon to stage your team!");
      return;
    }

    try {
      await API.post("/teams", {
        name: newTeamName,
        pokemon_ids: stagedPokemon.map((p) => p.id),
      });
      setNewTeamName("");
      setStagedPokemon([]);
      await refreshTeams();
    } catch (error) {
      alert(error.response?.data?.error || "Failed to create team.");
    }
  };

  const handleAddMemberToActiveTeam = async (poke) => {
    if (!selectedTeamId) {
      alert("Please select an active team from the dropdown!");
      return;
    }

    try {
      await API.post(`/teams/${selectedTeamId}/members`, {
        pokemon_id: poke.id,
      });
      setSelectedPokemon(null);
      setSearchQuery("");
      await refreshTeams();
    } catch (error) {
      alert(error.response?.data?.error || "Failed to add member to team.");
    }
  };

  const handleRemoveMember = async (teamId, pokemonId) => {
    try {
      await API.delete(`/teams/${teamId}/members/${pokemonId}`);
      await refreshTeams();
    } catch (error) {
      alert(error.response?.data?.error || "Failed to remove member.");
    }
  };

  const handleDeleteTeam = async (teamId) => {
    try {
      await API.delete(`/teams/${teamId}`);
      if (selectedTeamId === teamId) setSelectedTeamId(null);
      await refreshTeams();
    } catch (error) {
      alert(error.response?.data?.error || "Failed to delete team.");
    }
  };

  // Helper to compute complete Team Type Analyzer metrics
  const analyzeTeam = (members = []) => {
    const weaknessMap = {};
    const resistanceMap = {};
    const immunitySet = new Set();
    const superEffectiveSet = new Set();
    const notVeryEffectiveSet = new Set();
    const noEffectSet = new Set();

    members.forEach((member) => {
      if (!member.types || member.types.length === 0) return;

      const defMatchups = calculateDefensiveMatchups(member.types);
      defMatchups.weaknesses.forEach((w) => {
        const typeName = typeof w === "object" ? w.type : w;
        weaknessMap[typeName] = (weaknessMap[typeName] || 0) + 1;
      });
      defMatchups.resistances.forEach((r) => {
        const typeName = typeof r === "object" ? r.type : r;
        resistanceMap[typeName] = (resistanceMap[typeName] || 0) + 1;
      });
      if (defMatchups.immunities) {
        defMatchups.immunities.forEach((im) => {
          const typeName = typeof im === "object" ? im.type : im;
          immunitySet.add(typeName);
        });
      }

      const offMatchups = calculateOffensiveCoverages(member.types);
      offMatchups.superEffective.forEach((t) => superEffectiveSet.add(typeof t === "object" ? t.type : t));
      offMatchups.notVeryEffective.forEach((t) => notVeryEffectiveSet.add(typeof t === "object" ? t.type : t));
      offMatchups.noEffect.forEach((t) => noEffectSet.add(typeof t === "object" ? t.type : t));
    });

    return {
      weaknesses: Object.entries(weaknessMap).sort((a, b) => b[1] - a[1]),
      resistances: Object.entries(resistanceMap).sort((a, b) => b[1] - a[1]),
      immunities: Array.from(immunitySet).sort(),
      superEffective: Array.from(superEffectiveSet).sort(),
      notVeryEffective: Array.from(notVeryEffectiveSet).sort(),
      noEffect: Array.from(noEffectSet).sort(),
    };
  };

  if (loading) {
    return <h2 style={{ textAlign: "center", marginTop: "50px" }}>Loading Your Teams... 🛡️</h2>;
  }

  // O(1) Active Team Lookup via Hash Map
  const activeTeam = teamsMap.get(String(selectedTeamId)) || teams[0];
  const analysis = activeTeam ? analyzeTeam(activeTeam.members) : { weaknesses: [], resistances: [], immunities: [], superEffective: [], notVeryEffective: [], noEffect: [] };

  return (
    <div style={{ padding: "30px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ textAlign: "center", marginBottom: "30px" }}>⚔️ Pokémon Team Builder & Analyzer</h1>

      {/* 1. Search Bar */}
      <div style={{ background: "#f8fafc", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "25px", position: "relative" }}>
        <h3 style={{ margin: "0 0 15px 0", color: "#0f172a" }}>🔍 Live Pokémon Search</h3>
        
        <div style={{ position: "relative" }}>
          <input
            type="text"
            placeholder="Type name or ID (e.g. charizard-mega-x, rotom-wash, 10008)..."
            value={searchQuery}
            onChange={handleSearchChange}
            style={{ width: "100%", padding: "12px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "15px", boxSizing: "border-box" }}
          />

          {filteredSuggestions.length > 0 && (
            <ul style={{
              position: "absolute", top: "100%", left: 0, right: 0, background: "white",
              border: "1px solid #cbd5e1", borderRadius: "0 0 8px 8px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
              listStyle: "none", margin: 0, padding: 0, zIndex: 50, maxHeight: "250px", overflowY: "auto"
            }}>
              {filteredSuggestions.map((item) => (
                <li
                  key={item.id}
                  onClick={() => handleSelectSuggestion(item)}
                  style={{ padding: "10px 16px", cursor: "pointer", textTransform: "capitalize", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "white"}
                >
                  <span style={{ fontWeight: "600", color: "#1e293b" }}>{item.name}</span>
                  <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "bold" }}>#{item.id}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {selectedPokemon && (
          <div style={{ display: "flex", gap: "15px", alignItems: "center", background: "white", padding: "12px 18px", borderRadius: "8px", border: "1px solid #e2e8f0", marginTop: "15px" }}>
            <img src={selectedPokemon.image} alt={selectedPokemon.name} style={{ width: "60px", height: "60px", objectFit: "contain" }} />
            <div>
              <span style={{ fontWeight: "bold", textTransform: "capitalize", fontSize: "16px", display: "block", color: "#0f172a" }}>{selectedPokemon.name}</span>
              <span style={{ fontSize: "12px", color: "#64748b" }}>#{selectedPokemon.id}</span>
            </div>

            <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
              <button
                onClick={() => handleStagePokemon(selectedPokemon)}
                style={{ padding: "8px 14px", background: "#3b4cca", color: "white", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", fontSize: "12px" }}
              >
                + Stage for New Team
              </button>
              {selectedTeamId && (
                <button
                  onClick={() => handleAddMemberToActiveTeam(selectedPokemon)}
                  style={{ padding: "8px 14px", background: "#22c55e", color: "white", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", fontSize: "12px" }}
                >
                  + Add to Active Team
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2. Create Team Form */}
      <div style={{ background: "#f8fafc", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "30px" }}>
        <h3 style={{ margin: "0 0 15px 0", color: "#0f172a" }}>✨ Create New Team</h3>
        
        <div style={{ marginBottom: "15px" }}>
          <span style={{ fontSize: "13px", fontWeight: "bold", color: "#475569" }}>Staged Pokémon ({stagedPokemon.length}/6):</span>
          <div style={{ display: "flex", gap: "10px", marginTop: "8px", flexWrap: "wrap" }}>
            {stagedPokemon.length === 0 ? (
              <p style={{ fontSize: "13px", color: "#94a3b8", margin: 0 }}>Search above, select a suggestion, and click "+ Stage for New Team".</p>
            ) : (
              stagedPokemon.map((poke) => (
                <div key={poke.id} style={{ background: "white", border: "1px solid #cbd5e1", padding: "8px 12px", borderRadius: "8px", textAlign: "center", minWidth: "90px" }}>
                  <img src={poke.image} alt={poke.name} style={{ width: "40px", height: "40px", objectFit: "contain" }} />
                  <p style={{ margin: "2px 0", fontSize: "12px", fontWeight: "bold", textTransform: "capitalize" }}>{poke.name}</p>
                  <button
                    onClick={() => handleUnstagePokemon(poke.id)}
                    style={{ background: "none", border: "none", color: "#ef4444", fontSize: "11px", cursor: "pointer", fontWeight: "bold" }}
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <form onSubmit={handleCreateTeam} style={{ display: "flex", gap: "10px" }}>
          <input
            type="text"
            placeholder="Team Name (e.g. Kanto Champions)"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            style={{ padding: "10px 14px", fontSize: "15px", borderRadius: "8px", border: "1px solid #cbd5e1", flex: 1 }}
            required
          />
          <button type="submit" style={{ padding: "10px 20px", background: "#3b4cca", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
            Save Team 💾
          </button>
        </form>
      </div>

      {/* 3. Team Coverage Dashboard */}
      {teams.length > 0 && (
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px", marginBottom: "30px", boxShadow: "0 4px 6px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "15px" }}>
            <h3 style={{ margin: 0, color: "#0f172a" }}>📊 Team Coverage Analyzer</h3>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <label htmlFor="active-team-select" style={{ fontWeight: "bold", color: "#475569", fontSize: "14px" }}>Analyzing Team:</label>
              <select
                id="active-team-select"
                value={selectedTeamId || ""}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontWeight: "bold", fontSize: "14px" }}
              >
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>{team.name || team.team_name}</option>
                ))}
              </select>
            </div>
          </div>

          {activeTeam && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
              {/* Shared Weaknesses */}
              <div style={{ background: "#f8fafc", padding: "15px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <h4 style={{ color: "#ef4444", fontSize: "13px", textTransform: "uppercase", fontWeight: "800", margin: "0 0 10px 0" }}>🚨 Shared Weaknesses (2x+)</h4>
                {analysis.weaknesses.length > 0 ? (
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {analysis.weaknesses.map(([type, count]) => (
                      <span key={type} style={{ background: "#fee2e2", color: "#991b1b", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "bold", textTransform: "capitalize" }}>
                        {type} ({count} {count > 1 ? "members" : "member"})
                      </span>
                    ))}
                  </div>
                ) : <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>No weaknesses detected!</p>}
              </div>

              {/* Resistances */}
              <div style={{ background: "#f8fafc", padding: "15px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <h4 style={{ color: "#22c55e", fontSize: "13px", textTransform: "uppercase", fontWeight: "800", margin: "0 0 10px 0" }}>🛡️ Team Resistances</h4>
                {analysis.resistances.length > 0 ? (
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {analysis.resistances.map(([type, count]) => (
                      <span key={type} style={{ background: "#dcfce7", color: "#166534", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "bold", textTransform: "capitalize" }}>
                        {type} ({count} {count > 1 ? "members" : "member"})
                      </span>
                    ))}
                  </div>
                ) : <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>No resistances recorded.</p>}
              </div>

              {/* Immunities */}
              <div style={{ background: "#f8fafc", padding: "15px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <h4 style={{ color: "#3b4cca", fontSize: "13px", textTransform: "uppercase", fontWeight: "800", margin: "0 0 10px 0" }}>🛡️ Immune From (0x Damage)</h4>
                {analysis.immunities.length > 0 ? (
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {analysis.immunities.map((type) => (
                      <span key={type} style={{ background: "#dbeafe", color: "#1e40af", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "bold", textTransform: "capitalize" }}>
                        {type}
                      </span>
                    ))}
                  </div>
                ) : <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>No immunities on this team.</p>}
              </div>

              {/* Super Effective */}
              <div style={{ background: "#f8fafc", padding: "15px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <h4 style={{ color: "#22c55e", fontSize: "13px", textTransform: "uppercase", fontWeight: "800", margin: "0 0 10px 0" }}>⚔️ Super Effective Vs. (2x)</h4>
                {analysis.superEffective.length > 0 ? (
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {analysis.superEffective.map((type) => (
                      <span key={type} style={{ background: "#dcfce7", color: "#166534", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "bold", textTransform: "capitalize" }}>
                        {type}
                      </span>
                    ))}
                  </div>
                ) : <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>None</p>}
              </div>

              {/* Not Very Effective */}
              <div style={{ background: "#f8fafc", padding: "15px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <h4 style={{ color: "#d97706", fontSize: "13px", textTransform: "uppercase", fontWeight: "800", margin: "0 0 10px 0" }}>⚠️ Not Very Effective Vs. (0.5x)</h4>
                {analysis.notVeryEffective.length > 0 ? (
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {analysis.notVeryEffective.map((type) => (
                      <span key={type} style={{ background: "#fef3c7", color: "#92400e", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "bold", textTransform: "capitalize" }}>
                        {type}
                      </span>
                    ))}
                  </div>
                ) : <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>None</p>}
              </div>

              {/* No Effect */}
              <div style={{ background: "#f8fafc", padding: "15px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <h4 style={{ color: "#64748b", fontSize: "13px", textTransform: "uppercase", fontWeight: "800", margin: "0 0 10px 0" }}>❌ No Effect Vs. (0x)</h4>
                {analysis.noEffect.length > 0 ? (
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {analysis.noEffect.map((type) => (
                      <span key={type} style={{ background: "#f1f5f9", color: "#334155", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "bold", textTransform: "capitalize" }}>
                        {type}
                      </span>
                    ))}
                  </div>
                ) : <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>None</p>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Team Members List Display */}
      {teams.length === 0 ? (
        <p style={{ textAlign: "center", color: "#64748b" }}>No teams created yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {teams.map((team) => (
            <div key={team.id} style={{ border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px", background: "white", boxShadow: "0 4px 6px rgba(0,0,0,0.03)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                <h3 style={{ margin: 0, color: "#0f172a" }}>{team.name || team.team_name}</h3>
                <button
                  onClick={() => handleDeleteTeam(team.id)}
                  style={{ padding: "6px 12px", background: "#ef4444", color: "white", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}
                >
                  Delete Team 🗑️
                </button>
              </div>

              {/* Members Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "15px" }}>
                {team.members && team.members.length > 0 ? (
                  team.members.map((member, idx) => {
                    const memberMatchups = member.types && member.types.length > 0 ? calculateDefensiveMatchups(member.types) : { weaknesses: [], resistances: [], immunities: [] };

                    return (
                      <div key={idx} style={{ border: "1px solid #e2e8f0", padding: "12px", borderRadius: "10px", textAlign: "center", background: "#ffffff", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                          <span style={{ fontSize: "10px", color: "#64748b", fontWeight: "800" }}>Slot #{idx + 1}</span>
                          {member.bst > 0 && (
                            <span style={{ fontSize: "10px", background: "#f1f5f9", color: "#334155", padding: "2px 6px", borderRadius: "4px", fontWeight: "700" }}>
                              BST: {member.bst}
                            </span>
                          )}
                        </div>

                        {member.image && (
                          <img src={member.image} alt={member.name} style={{ width: "70px", height: "70px", objectFit: "contain", margin: "4px auto" }} />
                        )}
                        <p style={{ margin: "2px 0 6px 0", fontWeight: "bold", fontSize: "14px", textTransform: "capitalize", color: "#0f172a" }}>{member.name}</p>
                        
                        {/* Member Elemental Types */}
                        <div style={{ display: "flex", justifyContent: "center", gap: "4px", marginBottom: "10px" }}>
                          {member.types.map((t) => (
                            <span key={t} style={{ background: "#3b4cca", color: "white", fontSize: "10px", padding: "2px 8px", borderRadius: "6px", textTransform: "capitalize", fontWeight: "bold" }}>
                              {t}
                            </span>
                          ))}
                        </div>

                        {/* Stat Summary Box */}
                        {member.stats && (
                          <div style={{ background: "#f8fafc", padding: "6px", borderRadius: "6px", fontSize: "10px", marginBottom: "8px", border: "1px solid #f1f5f9" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "2px", fontWeight: "bold", color: "#475569" }}>
                              <span>HP: {member.stats.hp}</span>
                              <span>ATK: {member.stats.atk}</span>
                              <span>DEF: {member.stats.def}</span>
                              <span>SPA: {member.stats.spAtk}</span>
                              <span>SPD: {member.stats.spDef}</span>
                              <span>SPE: {member.stats.spd}</span>
                            </div>
                          </div>
                        )}

                        {/* Weak To Badges */}
                        {memberMatchups.weaknesses && memberMatchups.weaknesses.length > 0 && (
                          <div style={{ marginBottom: "6px", textAlign: "left" }}>
                            <span style={{ fontSize: "9px", color: "#ef4444", fontWeight: "800", textTransform: "uppercase", display: "block", marginBottom: "2px" }}>
                              Weak To:
                            </span>
                            <div style={{ display: "flex", gap: "3px", flexWrap: "wrap" }}>
                              {memberMatchups.weaknesses.map((w) => {
                                const typeName = typeof w === "object" ? w.type : w;
                                return (
                                  <span key={typeName} style={{ background: "#fee2e2", color: "#991b1b", fontSize: "9px", padding: "1px 5px", borderRadius: "4px", textTransform: "capitalize", fontWeight: "bold" }}>
                                    {typeName}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Strong Against Badges (Resistances & Immunities) */}
                        {((memberMatchups.resistances && memberMatchups.resistances.length > 0) || (memberMatchups.immunities && memberMatchups.immunities.length > 0)) && (
                          <div style={{ marginBottom: "8px", textAlign: "left" }}>
                            <span style={{ fontSize: "9px", color: "#22c55e", fontWeight: "800", textTransform: "uppercase", display: "block", marginBottom: "2px" }}>
                              Strong Vs:
                            </span>
                            <div style={{ display: "flex", gap: "3px", flexWrap: "wrap" }}>
                              {memberMatchups.resistances.map((r) => {
                                const typeName = typeof r === "object" ? r.type : r;
                                return (
                                  <span key={typeName} style={{ background: "#dcfce7", color: "#166534", fontSize: "9px", padding: "1px 5px", borderRadius: "4px", textTransform: "capitalize", fontWeight: "bold" }}>
                                    {typeName}
                                  </span>
                                );
                              })}
                              {memberMatchups.immunities && memberMatchups.immunities.map((im) => {
                                const typeName = typeof im === "object" ? im.type : im;
                                return (
                                  <span key={typeName} style={{ background: "#dbeafe", color: "#1e40af", fontSize: "9px", padding: "1px 5px", borderRadius: "4px", textTransform: "capitalize", fontWeight: "bold" }}>
                                    {typeName} (0x)
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <button
                          onClick={() => handleRemoveMember(team.id, member.id)}
                          style={{ padding: "4px 8px", background: "#fee2e2", color: "#991b1b", border: "none", borderRadius: "6px", fontSize: "11px", cursor: "pointer", fontWeight: "bold", width: "100%", marginTop: "4px" }}
                        >
                          Remove Member
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <p style={{ color: "#94a3b8", fontSize: "14px", margin: 0 }}>No Pokémon in this team yet.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}