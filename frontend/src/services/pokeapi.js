import axios from "axios";

const POKE_API = "https://pokeapi.co/api/v2";

export const GENERATIONS = {
  all: { name: "All Generations", limit: 1300, offset: 0 },
  gen1: { name: "Gen 1 (Kanto)", limit: 151, offset: 0 },
  gen2: { name: "Gen 2 (Johto)", limit: 100, offset: 151 },
  gen3: { name: "Gen 3 (Hoenn)", limit: 135, offset: 251 },
  gen4: { name: "Gen 4 (Sinnoh)", limit: 107, offset: 386 },
  gen5: { name: "Gen 5 (Unova)", limit: 156, offset: 493 },
  gen6: { name: "Gen 6 (Kalos)", limit: 72, offset: 649 },
  gen7: { name: "Gen 7 (Alola)", limit: 88, offset: 721 },
  gen8: { name: "Gen 8 (Galar)", limit: 96, offset: 809 },
  gen9: { name: "Gen 9 (Paldea)", limit: 120, offset: 905 },
};

// Helper function to map and sort move sets consistently
const mapAndSortMoves = (movesArray) => {
  const hmMoveNames = [
    "cut", "fly", "surf", "strength", "flash",
    "whirlpool", "waterfall", "dive", "defog",
    "rock-smash", "rock-climb",
  ];

  return movesArray
    .map((m) => {
      const learnMethod = m.version_group_details[0]?.move_learn_method.name;
      const itemObj = m.version_group_details[0]?.item?.name || "";
      const moveName = m.move.name;

      let formattedMethod = learnMethod;

      if (learnMethod === "machine") {
        if (itemObj.includes("hm") || hmMoveNames.includes(moveName)) {
          formattedMethod = "HM";
        } else {
          formattedMethod = "TM";
        }
      } else if (learnMethod === "level-up") {
        formattedMethod = "Lvl Up";
      } else if (learnMethod === "egg") {
        formattedMethod = "Egg";
      } else if (learnMethod === "tutor") {
        formattedMethod = "Tutor";
      }

      return {
        name: moveName,
        method: formattedMethod,
        level: m.version_group_details[0]?.level_learned_at ?? 0,
      };
    })
    .sort((a, b) => {
      const priority = { "Lvl Up": 1, TM: 2, HM: 3, Egg: 4, Tutor: 5 };
      const pA = priority[a.method] || 99;
      const pB = priority[b.method] || 99;

      if (pA !== pB) return pA - pB;
      if (a.method === "Lvl Up" && b.method === "Lvl Up") {
        return a.level - b.level;
      }
      return a.name.localeCompare(b.name);
    });
};

export const getPokemonList = async (limit = 50, offset = 0) => {
  const res = await axios.get(`${POKE_API}/pokemon?limit=${limit}&offset=${offset}`);

  const detailedPokemon = await Promise.all(
    res.data.results.map(async (pokemon) => {
      const detailRes = await axios.get(pokemon.url);
      const data = detailRes.data;

      const totalStats = data.stats.reduce((acc, curr) => acc + curr.base_stat, 0);

      return {
        id: data.id,
        name: data.name,
        image: data.sprites.other["official-artwork"].front_default || data.sprites.front_default,
        types: data.types.map((t) => t.type.name),
        height: (data.height / 10).toFixed(1),
        weight: (data.weight / 10).toFixed(1),
        abilities: data.abilities.map((a) => a.ability.name),
        bst: totalStats,
        stats: data.stats.map((s) => ({
          name: s.stat.name,
          value: s.base_stat,
        })),
        moves: mapAndSortMoves(data.moves),
      };
    })
  );

  return detailedPokemon;
};

const parseEvolutionChain = (chainNode) => {
  const evolutions = [];
  let current = chainNode;

  while (current) {
    const speciesName = current.species.name;
    const speciesId = current.species.url.split("/").filter(Boolean).pop();

    let condition = "Base";
    if (current.evolution_details && current.evolution_details.length > 0) {
      const details = current.evolution_details[0];
      if (details.min_level) {
        condition = `Lvl ${details.min_level}`;
      } else if (details.item) {
        condition = `Use ${details.item.name.replace("-", " ")}`;
      } else if (details.trigger?.name === "trade") {
        condition = "Trade";
      } else if (details.min_happiness) {
        condition = `Friendship`;
      } else if (details.known_move) {
        condition = `Knows ${details.known_move.name}`;
      } else {
        condition = details.trigger?.name.replace("-", " ") || "Special";
      }
    }

    evolutions.push({
      id: speciesId,
      name: speciesName,
      image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${speciesId}.png`,
      condition: condition,
    });

    current = current.evolves_to[0];
  }

  return evolutions;
};

export const getEvolutionChain = async (pokemonId) => {
  try {
    const speciesRes = await axios.get(`${POKE_API}/pokemon-species/${pokemonId}`);
    const evoChainUrl = speciesRes.data.evolution_chain.url;

    const evoRes = await axios.get(evoChainUrl);
    return parseEvolutionChain(evoRes.data.chain);
  } catch (err) {
    console.error("Failed to fetch evolution chain:", err);
    return [];
  }
};

export const getPokemonVarieties = async (pokemonId) => {
  try {
    const speciesRes = await axios.get(`${POKE_API}/pokemon-species/${pokemonId}`);
    const varieties = speciesRes.data.varieties;

    if (!varieties || varieties.length <= 1) return [];

    const formPromises = varieties.map(async (v) => {
      const detailRes = await axios.get(v.pokemon.url);
      const data = detailRes.data;

      const totalStats = data.stats.reduce((acc, curr) => acc + curr.base_stat, 0);

      return {
        id: data.id,
        name: data.name.replace(/-/g, " "),
        isDefault: v.is_default,
        image: data.sprites.other["official-artwork"].front_default || data.sprites.front_default,
        types: data.types.map((t) => t.type.name),
        bst: totalStats,
        stats: data.stats.map((s) => ({
          name: s.stat.name,
          value: s.base_stat,
        })),
        moves: mapAndSortMoves(data.moves),
      };
    });

    return await Promise.all(formPromises);
  } catch (error) {
    console.error("Error fetching form varieties:", error);
    return [];
  }
};