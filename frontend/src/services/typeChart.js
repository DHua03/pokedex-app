// Official type effectiveness matrix (Attacking Type -> Defending Type multipliers)
const TYPE_CHART = {
  normal:   { rock: 0.5, ghost: 0, steel: 0.5 },
  fire:     { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water:    { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  grass:    { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5, ground: 2 },
  electric: { water: 2, grass: 0.5, electric: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  ice:      { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
  poison:   { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground:   { fire: 2, grass: 0.5, electric: 2, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying:   { grass: 2, electric: 0.5, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic:  { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug:      { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
  rock:     { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost:    { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon:   { dragon: 2, steel: 0.5, fairy: 0 },
  steel:    { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy:    { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 }
};

const ALL_TYPES = [
  "normal", "fire", "water", "grass", "electric", "ice", 
  "fighting", "poison", "ground", "flying", "psychic", "bug", 
  "rock", "ghost", "dragon", "steel", "fairy"
];

export function calculateDefensiveMatchups(pokemonTypes) {
  const multipliers = {};

  ALL_TYPES.forEach((defendingType) => {
    let multiplier = 1.0;

    pokemonTypes.forEach((pokeType) => {
      const typeDef = TYPE_CHART[defendingType];
      if (typeDef && typeDef[pokeType] !== undefined) {
        multiplier *= typeDef[pokeType];
      }
    });

    multipliers[defendingType] = multiplier;
  });

  // Group by effectiveness tier
  const result = {
    weaknesses: [],   // > 1 (e.g. 2x, 4x)
    resistances: [],  // < 1 (e.g. 0.5x, 0.25x)
    immunities: []    // === 0
  };

  Object.entries(multipliers).forEach(([type, mult]) => {
    if (mult > 1) {
      result.weaknesses.push({ type, mult });
    } else if (mult === 0) {
      result.immunities.push({ type, mult });
    } else if (mult < 1) {
      result.resistances.push({ type, mult });
    }
  });

  return result;
}

export function calculateOffensiveCoverages(pokemonTypes) {
  const superEffective = new Set();
  const notVeryEffective = new Set();
  const noEffect = new Set();

  pokemonTypes.forEach((pokeType) => {
    const attackingData = TYPE_CHART[pokeType];
    if (attackingData) {
      Object.entries(attackingData).forEach(([defendingType, mult]) => {
        if (mult > 1) {
          superEffective.add(defendingType);
        } else if (mult === 0) {
          noEffect.add(defendingType);
        } else if (mult < 1) {
          notVeryEffective.add(defendingType);
        }
      });
    }
  });

  return {
    superEffective: Array.from(superEffective),
    notVeryEffective: Array.from(notVeryEffective),
    noEffect: Array.from(noEffect),
  };
}