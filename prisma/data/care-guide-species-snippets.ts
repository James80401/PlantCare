import { TaskType } from '@prisma/client';
import { speciesSeedId } from './species-catalog';

/** Extra depth for popular species — merged into matching task sections */
export const speciesSnippets: Record<string, Partial<Record<TaskType, string>>> = {
  [speciesSeedId('Basil', 'Ocimum basilicum')]: {
    WATER:
      '💡 Basil wilts dramatically when dry but recovers fast — use that as your cue. Morning water reduces leaf spot.',
    PRUNE:
      '💡 Pinch the top set of leaves weekly. Flower spikes taste bitter — remove them the day you see buds.',
  },
  [speciesSeedId('Sweet Basil', 'Ocimum basilicum')]: {
    WATER: '💡 Same as basil: never let the root ball go bone-dry in full sun.',
    PRUNE: '💡 Harvest from the top down; always leave two leaf pairs on each stem.',
  },
  [speciesSeedId('Snake Plant', 'Sansevieria trifasciata')]: {
    WATER:
      '💡 In winter, some snake plants need water only once a month. When in doubt, wait.',
  },
  [speciesSeedId('Monstera', 'Monstera deliciosa')]: {
    PRUNE:
      '💡 Trim aerial roots only if they block a walkway — otherwise leave them. Cut leggy vines above a node with a leaf.',
    WATER: '💡 Yellow leaves with wet soil often mean overwatering, not underwatering.',
  },
  [speciesSeedId('Pothos', 'Epipremnum aureum')]: {
    PRUNE: '💡 Cut just above a leaf; each node can sprout a new vine. Propagate cuttings in water.',
  },
  [speciesSeedId('Tomato', 'Solanum lycopersicum')]: {
    WATER:
      '💡 Uneven watering causes blossom end rot — keep soil consistently moist during fruit set.',
    FERTILIZE: '💡 Switch to lower nitrogen once flowers appear; too much N gives leaves, not fruit.',
    PRUNE: '💡 Remove suckers below the first flower cluster on indeterminate types.',
  },
  [speciesSeedId('Cherry Tomato', 'Solanum lycopersicum')]: {
    WATER: '💡 Container cherries dry out fast — check daily in heat.',
  },
  [speciesSeedId('Peace Lily', 'Spathiphyllum')]: {
    WATER: '💡 Drooping leaves are a reliable “water me” signal for peace lilies.',
    MIST: '💡 Group with other plants or use a pebble tray; misting alone is not enough in dry homes.',
  },
  [speciesSeedId('Fiddle Leaf Fig', 'Ficus lyrata')]: {
    WATER: '💡 Water when top 2 inches are dry. Brown spots on edges can be inconsistent watering.',
    PRUNE: '💡 Prune in spring. Milky sap is normal — wipe tools after.',
  },
  [speciesSeedId('Blueberry', 'Vaccinium corymbosum')]: {
    PH_TEST:
      '💡 Use sulfur or acid-loving fertilizer if pH drifts above 5.5. Test twice per season in containers.',
  },
  [speciesSeedId('Orchid', 'Phalaenopsis')]: {
    WATER:
      '💡 Ice cubes are controversial — lukewarm soak for 10–15 minutes when roots turn silvery is safer.',
    REPOT: '💡 Repot after bloom in fresh orchid bark; do not bury the crown.',
  },
  [speciesSeedId('Rosemary', 'Salvia rosmarinus')]: {
    WATER: '💡 Let soil dry between waterings; rosemary hates wet feet indoors.',
  },
  [speciesSeedId('Mint', 'Mentha')]: {
    WATER: '💡 Mint in pots may need water every 1–2 days in summer.',
    PRUNE: '💡 Harvest often — leggy mint has weaker flavor.',
  },
  [speciesSeedId('Spider Plant', 'Chlorophytum comosum')]: {
    WATER: '💡 Brown tips often mean fluoride or dry air, not always thirst.',
  },
  [speciesSeedId('ZZ Plant', 'Zamioculcas zamiifolia')]: {
    WATER: '💡 Yellow stems usually mean overwatering — let soil dry completely.',
  },
  [speciesSeedId('African Violet', 'Saintpaulia ionantha')]: {
    WATER: '💡 Bottom-water to avoid leaf spots; never splash cold water on fuzzy leaves.',
    MIST: '💡 Do not mist African violets — humidity tray only.',
  },
  [speciesSeedId('Lavender', 'Lavandula angustifolia')]: {
    WATER: '💡 Treat like a Mediterranean herb: dry between waterings, full sun.',
  },
  [speciesSeedId('Jade Plant', 'Crassula ovata')]: {
    WATER: '💡 Wrinkled leaves mean thirsty; mushy leaves mean too much water.',
  },
  [speciesSeedId('Calathea Medallion', 'Calathea veitchiana')]: {
    WATER: '💡 Use filtered or rainwater if possible — browning edges may be fluoride.',
    MIST: '💡 Needs 50%+ humidity; misting helps but a humidifier is better.',
  },
};

export function getSpeciesSnippet(speciesId: string, taskType: TaskType): string {
  return speciesSnippets[speciesId]?.[taskType] ?? '';
}
