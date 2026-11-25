/* Container Haz configurator - product catalog.
 * Source: "Container Haz 1.pdf" (79-page supplier catalog). Page refs in comments (p.N).
 * Every option: { id, name, up (true = UPGRADE in catalog), t (texture descriptor) or c (colour) }.
 * Colours/patterns are visual approximations of the printed swatches - confirm codes with the supplier.
 */
window.CHZ = window.CHZ || {};
(function (CHZ) {
  'use strict';

  // ---------- Models (p.5-9). L = length along the container, W = unfolded width (m) ----------
  const SIZES = [
    { id: '10ft', name: '10 ft', L: 2.95, W: 6.32, layouts: ['studio'] },
    { id: '15ft', name: '15 ft', L: 4.57, W: 6.42, layouts: ['1bed', 'studio'] },
    { id: '20ft', name: '20 ft', L: 5.90, W: 6.42, layouts: ['1bed', '2bed', 'studio'] },
    { id: '30ft', name: '30 ft', L: 8.90, W: 6.74, layouts: ['2bed', '3bed', '1bed'] },
    { id: '40ft', name: '40 ft', L: 11.80, W: 6.74, layouts: ['3bed', '2bed', '4bed'] },
  ];
  const LAYOUTS = {
    studio: { name: 'Studio', beds: 0 },
    '1bed': { name: '1 bedroom', beds: 1 },
    '2bed': { name: '2 bedrooms', beds: 2 },
    '3bed': { name: '3 bedrooms', beds: 3 },
    '4bed': { name: '4 bedrooms', beds: 4 },
  };
  const CORE_W = 2.2;          // folded (transport) width of the central module
  const INNER_H = 2.4;         // p.9 inner height 2.4 m

  // ---------- Frame (p.11) ----------
  const FRAME = [
    { id: 'black', name: 'Black', c: '#1d1e20' },
    { id: 'lightgray', name: 'Light gray', c: '#b4b8bb' },
    { id: 'darkgray', name: 'Dark gray', c: '#4a4e54' },
    { id: 'white', name: 'Matte white', c: '#e4e3de' },
    { id: 'brown', name: 'Brown', c: '#4f3527' },
  ];

  // ---------- Exterior cladding (p.13-23) ----------
  const CLAD_TYPES = [
    { id: 'steel', name: 'Color steel plate', up: false },
    { id: 'carved', name: 'Metal carved panel', up: true },
    { id: 'wpcEmb', name: 'WPC embossed', up: true },
    { id: 'wpcFlat', name: 'WPC flat', up: true },
  ];
  const CLAD = {
    steel: [
      { id: 'irongray', name: 'Iron Gray', t: { k: 'rib', c: '#3a3c3f' } },
      { id: 'crimson', name: 'Crimson', t: { k: 'rib', c: '#b0141c' } },
      { id: 'gray7042', name: '7042 Light Gray', t: { k: 'rib', c: '#c6c9cb' } },
      { id: 'xinyu', name: 'Xinyu Great Wall Gray', t: { k: 'rib', c: '#686c71' } },
      { id: 'beige', name: 'Beige', t: { k: 'rib', c: '#d6d0bd' } },
      { id: 'wood3d', name: '3D Wood Grain', t: { k: 'wood', c: '#8b7a58', g: '#3f3424', rib: 1, knots: 1 } },
      { id: 'digicamo', name: 'Digital Camouflage', t: { k: 'digicamo', cs: ['#7b8a5a', '#3e5739', '#d4c49c'], rib: 1 } },
      { id: 'wenge', name: 'Wenge Wood Grain', t: { k: 'wood', c: '#6c4a30', g: '#24160d', rib: 1 } },
      { id: 'maple', name: 'Natural Wood Grain (Maple)', t: { k: 'wood', c: '#e8dcc4', g: '#c3ad86', rib: 1 } },
      { id: 'mahogany', name: 'Mahogany Wood Grain', t: { k: 'wood', c: '#b0532b', g: '#6e2c13', rib: 1 } },
      { id: 'stone', name: 'Cultured Stone', t: { k: 'stone', c: '#8a8a86' } },
      { id: 'yellowwood', name: 'Yellow Wood Grain', t: { k: 'wood', c: '#c98e3b', g: '#86561b', rib: 1, knots: 1 } },
      { id: 'deepcamo', name: 'M-1 Deep Camo', t: { k: 'camo', cs: ['#3a4a32', '#1f231c', '#6b7a4c', '#c8b98e'], rib: 1 } },
    ],
    carved: [ // p.15-20
      { id: 'cv-brick', name: 'Carved brick relief', up: true, t: { k: 'brick', c: '#9a4a32', m: '#cfc6b8', metal: 0.3 } },
      { id: 'cv-slate', name: 'Carved slate stone', up: true, t: { k: 'stone', c: '#4d5054', metal: 0.3 } },
      { id: 'cv-sand', name: 'Carved sandstone', up: true, t: { k: 'stone', c: '#c2ab84', metal: 0.25 } },
      { id: 'cv-wood', name: 'Carved timber plank', up: true, t: { k: 'wood', c: '#7a5235', g: '#3a2414', boards: 5, metal: 0.25 } },
      { id: 'cv-marble', name: 'Carved marble', up: true, t: { k: 'marble', c: '#e6e3dd', v: '#8d8a86', metal: 0.25 } },
    ],
    wpcEmb: [ // p.21-22
      { id: 'we-teak', name: 'Teak', up: true, t: { k: 'flute', c: '#a8713f' } },
      { id: 'we-walnut', name: 'Walnut', up: true, t: { k: 'flute', c: '#6b4529' } },
      { id: 'we-coffee', name: 'Coffee', up: true, t: { k: 'flute', c: '#4a3326' } },
      { id: 'we-grey', name: 'Ash grey', up: true, t: { k: 'flute', c: '#7c7f80' } },
      { id: 'we-charcoal', name: 'Charcoal', up: true, t: { k: 'flute', c: '#2f3133' } },
    ],
    wpcFlat: [ // p.23
      { id: 'wf-teak', name: 'Teak', up: true, t: { k: 'boards', c: '#a8713f', g: '#6e451f' } },
      { id: 'wf-walnut', name: 'Walnut', up: true, t: { k: 'boards', c: '#6b4529', g: '#3a2414' } },
      { id: 'wf-red', name: 'Red cedar', up: true, t: { k: 'boards', c: '#8f4a2e', g: '#5a2814' } },
      { id: 'wf-grey', name: 'Ash grey', up: true, t: { k: 'boards', c: '#8a8b88', g: '#5d5e5b' } },
      { id: 'wf-charcoal', name: 'Charcoal', up: true, t: { k: 'boards', c: '#333537', g: '#1b1c1d' } },
    ],
  };

  // ---------- Sandwich panel core (p.24). Typical industry values - verify with supplier ----------
  const SANDWICH = [
    // lambda = typical design value (W/m.K) used for the U-value estimate; range + fire notes from public manufacturer data (see Benefits report)
    { id: 'eps', name: 'EPS', up: false, core: '#f3f1ea', lambda: '0.037', range: '0.035-0.038', fire: 'Combustible; B1 only if flame-retardant grade', note: 'Standard core. Light and economical.' },
    { id: 'pu', name: 'Polyurethane', up: true, core: '#e9c95a', lambda: '0.023', range: '0.022-0.026', fire: 'Combustible; class depends on the tested panel', note: 'High insulation per mm of thickness.' },
    { id: 'rockwool', name: 'Rock wool', up: true, core: '#c9a35c', lambda: '0.040', range: '0.039-0.042', fire: 'Core A1; panel A2-s1,d0', note: 'Non-combustible core, best fire safety and sound damping.' },
    { id: 'graphite', name: 'Graphite core', up: true, core: '#6d6f73', lambda: '0.031', range: '0.030-0.032', fire: 'Combustible like EPS; B1 only if flame-retardant', note: 'Grey EPS with graphite in the WALL/ROOF panel: about 15% better than white EPS. Not the floor heating (that is graphene film).' },
    { id: 'pir', name: 'PIR', up: true, core: '#f0dc8a', lambda: '0.021', range: '0.018-0.023', fire: 'Panel system can reach B-s1,d0', note: 'PU-level insulation with a better fire behaviour.' },
  ];
  const PANEL_THK = [
    { id: 50, name: '50 mm' }, { id: 75, name: '75 mm' }, { id: 100, name: '100 mm' },
  ];

  // ---------- Roof (p.73-74) & terrace (p.67-71) ----------
  const ROOFS = [
    { id: 'flat', name: 'Flat', up: false },
    { id: 'gable', name: 'Gable', up: true },
    { id: 'sloping', name: 'Sloping', up: true },
  ];
  const DECKS = [ // p.67 ground-level terrace decks
    { id: 'none', name: 'None', up: false },
    { id: 'front', name: 'Front', sub: 'long side', up: true },
    { id: 'side', name: 'Side', sub: 'entrance end', up: true },
    { id: 'L', name: 'Front + side', sub: 'L-shape', up: true },
  ];
  const TERRACE_FLOOR = [
    { id: 'std', name: 'Anti-slip board', up: false, t: { k: 'checker', c: '#8d9094' } },
    { id: 'wpc', name: 'WPC decking', up: true, t: { k: 'planks', c: '#8a5a38', tile: 2.4, dir: 'x', pbr: 'deck' } },
  ];

  // ---------- Doors & windows (p.33-38, 72) ----------
  const ENTRANCE = [
    { id: 'glassDouble', name: 'Glass double door', up: false },
    { id: 'glassSingle', name: 'Glass door + side light', up: false },
    { id: 'steel', name: 'Steel security door', up: true },
  ];
  const STEEL_DOOR_COLORS = [
    { id: 'sd-black', name: 'Black', c: '#222326' },
    { id: 'sd-anthracite', name: 'Anthracite', c: '#3e4246' },
    { id: 'sd-bronze', name: 'Bronze', c: '#5b4634' },
    { id: 'sd-walnut', name: 'Walnut', t: { k: 'wood', c: '#6b4529', g: '#33200f' } },
  ];
  const WINDOWS = [
    { id: 'inward', name: 'Inward-opening', up: false },
    { id: 'outward', name: 'Outward-opening', up: false },
    { id: 'hanging', name: 'Hanging (awning)', up: false },
    { id: 'double', name: 'Double-opening', up: true },
    { id: 'sliding', name: 'Sliding', up: true },
    { id: 'strip', name: 'Strip 500x1200', up: true },
  ];
  const WIN_FRAME = [
    { id: 'wf-black', name: 'Black', c: '#1f2022' },
    { id: 'wf-white', name: 'White', c: '#eeeeea' },
    { id: 'wf-grey', name: 'Grey', c: '#7b7f84' },
  ];
  const CURTAIN = [
    { id: 'none', name: 'None', up: false },
    { id: 'front', name: 'Long side', up: true },
    { id: 'end', name: 'Entrance end', up: true },
    { id: 'both', name: 'Both', up: true },
  ];
  const ROOM_DOOR = [ // p.36
    { id: 'rd-white', name: 'White', c: '#efeee9' },
    { id: 'rd-oak', name: 'Light oak', t: { k: 'wood', c: '#c9a477', g: '#8d6a40' } },
    { id: 'rd-walnut', name: 'Walnut', t: { k: 'wood', c: '#6b4529', g: '#33200f' } },
    { id: 'rd-grey', name: 'Grey', c: '#8d9093' },
    { id: 'rd-black', name: 'Black', c: '#232427' },
  ];

  // ---------- Interior walls (p.14, 26-28) ----------
  const INT_WALL_TYPES = [
    { id: 'carbon', name: 'Carbon crystal panel', up: false },
    { id: 'bamboo', name: 'Bamboo fiber board', up: true },
  ];
  const INT_WALL = {
    carbon: [
      { id: 'match', name: 'Match exterior colour' },
      { id: 'cw-white', name: 'Warm white', t: { k: 'solid', c: '#efebe3' } },
      { id: 'cw-grey', name: 'Pearl grey', t: { k: 'solid', c: '#c9c8c4' } },
      { id: 'cw-oak', name: 'Light oak', t: { k: 'wood', c: '#d2b48a', g: '#a8875a' } },
      { id: 'cw-walnut', name: 'Walnut', t: { k: 'wood', c: '#7a5536', g: '#3f2a19' } },
      { id: 'cw-marble', name: 'White marble', t: { k: 'marble', c: '#eeece8', v: '#a9a49c' } },
      { id: 'cw-concrete', name: 'Concrete grey', t: { k: 'concrete', c: '#a3a19c' } },
      { id: 'cw-fabric', name: 'Linen fabric', t: { k: 'fabric', c: '#ddd3c2' } },
    ],
    bamboo: [
      { id: 'bb-white', name: 'Snow white', up: true, t: { k: 'fabric', c: '#f2f0ea' } },
      { id: 'bb-sand', name: 'Sand', up: true, t: { k: 'fabric', c: '#d9c9ab' } },
      { id: 'bb-oak', name: 'Natural oak', up: true, t: { k: 'wood', c: '#c9a272', g: '#946c3e' } },
      { id: 'bb-ash', name: 'Ash grey wood', up: true, t: { k: 'wood', c: '#a7a29a', g: '#76716a' } },
      { id: 'bb-stone', name: 'Stone', up: true, t: { k: 'marble', c: '#d8d5cf', v: '#8b8780' } },
    ],
  };
  const JOINT = [ // p.28 joint sealing strips
    { id: 'j-white', name: 'White', c: '#f2f2ef' },
    { id: 'j-silver', name: 'Silver', c: '#b3b7bb' },
    { id: 'j-black', name: 'Black', c: '#1e1e1e' },
    { id: 'j-gold', name: 'Champagne gold', c: '#b89b5e' },
  ];

  // ---------- Floors (p.29-32) ----------
  const FLOOR_TYPES = [
    { id: 'pvc', name: 'PVC', up: false },
    { id: 'spc4', name: 'SPC 4 mm', up: true },
    { id: 'spc6', name: 'SPC 6 mm carborundum', up: true },
    { id: 'fishbone', name: 'Fishbone SPC', up: true },
  ];
  const plank = (c) => ({ k: 'planks', c, tile: 2.4 });
  const SPC4 = [['8005', '#c9a77c'], ['8007', '#a57c55'], ['8008', '#8a6243'], ['8022', '#d8c4a4'], ['8061', '#6b4a33'],
    ['8911', '#bfa98a'], ['8912', '#9c8b78'], ['8913', '#7d6e60'], ['8915', '#d3bf9d'], ['8916', '#b38a5e'],
    ['8917', '#c4b8a6'], ['8918', '#8f8172'], ['8919', '#5d4b3d'], ['8920', '#e0d2bb'], ['8921', '#a99681'],
    ['8922', '#7b6450'], ['8923', '#ccc3b6']];
  const SPC6 = [['8101', '#d4bc98'], ['8102', '#b89670'], ['8103', '#9e7a55'], ['8104', '#7c5c40'], ['8105', '#c7b9a6'],
    ['8106', '#a49888'], ['8107', '#8a7d6e'], ['8108', '#e1d5c1'], ['8109', '#c09f7b'], ['8110', '#6a4e38'],
    ['8111', '#b5a38c'], ['8112', '#958168'], ['8113', '#d0c6b8'], ['8114', '#5c4d42'], ['8115', '#a88e6c']];
  const FLOOR = {
    pvc: [
      { id: 'pvc-oak', name: 'Oak', t: plank('#b48b5a') },
      { id: 'pvc-ash', name: 'Ash', t: plank('#b9b2a6') },
      { id: 'pvc-walnut', name: 'Walnut', t: plank('#6c4a31') },
      { id: 'pvc-grey', name: 'Grey', t: plank('#8d8983') },
    ],
    spc4: SPC4.map(([code, c]) => ({ id: 's4-' + code, name: code, up: true, t: plank(c) })),
    spc6: SPC6.map(([code, c]) => ({ id: 's6-' + code, name: code, up: true, t: plank(c) })),
    fishbone: [
      { id: 'fb-natural', name: 'Natural oak', up: true, t: { k: 'herring', c: '#c49a68', tile: 1.2 } },
      { id: 'fb-smoke', name: 'Smoked oak', up: true, t: { k: 'herring', c: '#8c6a4b', tile: 1.2 } },
      { id: 'fb-grey', name: 'Grey oak', up: true, t: { k: 'herring', c: '#a29a8f', tile: 1.2 } },
      { id: 'fb-walnut', name: 'Walnut', up: true, t: { k: 'herring', c: '#6b4a33', tile: 1.2 } },
    ],
  };

  // ---------- Lights & electric (p.12, 65-66, 70) ----------
  const INDOOR_LIGHTS = [
    { id: 'std', name: 'Ceiling lamps', up: false },
    { id: 'up', name: 'LED strips + downlights', up: true },
  ];
  const ELECTRIC = [
    { id: 'uk', name: 'British', sub: 'BS 1363, 230 V' },
    { id: 'eu', name: 'European', sub: 'Schuko, 230 V' },
    { id: 'it', name: 'Italian', sub: 'CEI 23-50, 230 V' },
    { id: 'au', name: 'Australian', sub: 'AS/NZS 3112, 230 V' },
    { id: 'us', name: 'American', sub: 'NEMA 5-15, 120 V' },
  ];

  // ---------- Bathroom (p.39-55) ----------
  const BATH_WALL_TYPES = [
    { id: 'uv', name: 'UV panel', up: false },
    { id: 'spc', name: 'SPC stone-plastic wall', up: true },
  ];
  const BATH_WALL = {
    uv: [
      { id: 'uv-white', name: 'Warm white', t: { k: 'solid', c: '#f1eee8' } },
      { id: 'uv-marble', name: 'Carrara marble', t: { k: 'marble', c: '#efede9', v: '#9a958d' } },
      { id: 'uv-grey', name: 'Grey stone', t: { k: 'marble', c: '#8f9092', v: '#d9d9d7' } },
      { id: 'uv-beige', name: 'Beige stone', t: { k: 'travertine', c: '#d6c6a8' } },
      { id: 'uv-wood', name: 'Wood grain', t: { k: 'wood', c: '#b08a62', g: '#7a5836' } },
    ],
    spc: [
      { id: 'spc-warmwhite', name: 'Warm White (Black)', up: true, t: { k: 'marble', c: '#f4f1ea', v: '#2b2b2b' } },
      { id: 'spc-yafeiyellow', name: 'Yafei Stone Grain Yellow', up: true, t: { k: 'marble', c: '#e2d1ad', v: '#a88c5a' } },
      { id: 'spc-stone23', name: 'Stone Texture 23', up: true, t: { k: 'marble', c: '#d9d6d0', v: '#7d7972' } },
      { id: 'spc-yafeigrey', name: 'Yafei Stone Grey', up: true, t: { k: 'marble', c: '#9c9d9e', v: '#e4e4e2' } },
      { id: 'spc-terrazzo13', name: 'Terrazzo 13', up: true, t: { k: 'terrazzo', c: '#e6e2da', cs: ['#8c8a85', '#c2b49a', '#5b5b58'] } },
      { id: 'spc-wood16', name: 'Texture Wood Grain 16', up: true, t: { k: 'wood', c: '#9a7752', g: '#5e4227' } },
      { id: 'spc-stone12', name: 'Stone Texture 12', up: true, t: { k: 'travertine', c: '#cbbfae' } },
      { id: 'spc-hermes', name: 'Hermes Orange', up: true, t: { k: 'solid', c: '#d9692b' } },
      { id: 'spc-blue', name: 'Blue', up: true, t: { k: 'solid', c: '#3e6c9a' } },
      { id: 'spc-colorterrazzo', name: 'Colorful Terrazzo', up: true, t: { k: 'terrazzo', c: '#efe9df', cs: ['#d9692b', '#3e6c9a', '#e2b23c', '#7aa37a'] } },
      { id: 'spc-fishbelly', name: 'Fish-belly White', up: true, t: { k: 'solid', c: '#f3f2ec' } },
      { id: 'spc-fabric10', name: 'Texture Fabric 10', up: true, t: { k: 'fabric', c: '#cfc6b6' } },
      { id: 'spc-roman', name: 'Roman Travertine', up: true, t: { k: 'travertine', c: '#d9c9a9' } },
      { id: 'spc-rock1', name: 'Rock Texture 1', up: true, t: { k: 'concrete', c: '#8b8a86' } },
    ],
  };
  const VANITY = [ // p.39-43 smart LED mirror cabinet, standard 60 cm
    { id: 'X1270D', name: 'X1270 dark', c: '#4a3b30', w: [60, 70, 90, 100, 110, 120] },
    { id: 'X1270L', name: 'X1270 light', c: '#cdb79a', w: [60, 70, 90, 100, 110, 120] },
    { id: 'X1117', name: 'X1117', c: '#e7e5e0', w: [60, 90, 100, 150] },
    { id: 'X1117L', name: 'X1117 light', c: '#d6c3a2', w: [60, 90, 100] },
    { id: 'X1212', name: 'X1212', c: '#7c7e80', w: [60, 90, 100] },
    { id: 'X1271', name: 'X1271', c: '#2b2c2e', w: [60, 70, 90, 100, 110, 120] },
    { id: 'X1272', name: 'X1272', c: '#9a7b5b', w: [60, 70, 90, 100, 110, 120] },
  ];
  const HEATER = [ // p.49
    { id: 'basic', name: 'Basic', up: false },
    { id: 'instant', name: 'Instant 7000 W', up: true },
    { id: 'storage', name: 'Storage tank', up: true },
  ];
  const HEATER_COLORS = [
    { id: 'h-white', name: 'White', c: '#f1f1ee' },
    { id: 'h-grey', name: 'Grey', c: '#8b8e91' },
    { id: 'h-black', name: 'Black', c: '#222325' },
  ];
  const SHOWER = [ // p.50
    { id: 'chrome', name: 'Electroplated chrome' },
    { id: 'gungrey', name: 'Gun grey' },
  ];
  const WETDRY = [ // p.52, 55
    { id: 'screen', name: 'Fixed glass screen' },
    { id: 'door', name: 'Glass dividing door' },
  ];
  const WETDRY_FRAME = [{ id: 'silver', name: 'Silver' }, { id: 'black', name: 'Black' }];
  const WETDRY_GLASS = [{ id: 'clear', name: 'Transparent' }, { id: 'frosted', name: 'Frosted' }];
  const BATH_DOOR = [ // p.53-54
    { id: 'std', name: 'Standard white', up: false },
    { id: 'match', name: 'Match bedroom doors', up: true },
    { id: 'rainbow', name: 'Fluted glass', up: true },
    { id: 'chinese', name: 'Chinese lattice', up: true },
  ];

  // ---------- Kitchen (p.56-64) ----------
  const KITCHEN_CAB = [
    { id: 'std', name: 'Base cabinets', up: false },
    { id: 'up', name: 'Base + wall + tall unit', up: true },
  ];
  const pet = (id, name, c, extra) => Object.assign({ id: 'pet-' + id, name, up: true, t: { k: 'solid', c } }, extra || {});
  const petWood = (id, name, c, g) => ({ id: 'pet-' + id, name, up: true, t: { k: 'wood', c, g } });
  const CAB_FINISH = [
    { id: 'k-white', name: 'Standard white', up: false, t: { k: 'solid', c: '#f1f0ec' } },
    pet('iceberg-hg', 'Iceberg White high-gloss', '#f7f7f4', { gloss: 1 }),
    pet('moon-st', 'Moonlight White soft-touch', '#eeebe3'),
    pet('cream-st', 'Creamy White soft-touch', '#efe6d3'),
    pet('crystal-hg', 'Crystal Grey high-gloss', '#b9bcbe', { gloss: 1 }),
    pet('warmgrey-st', 'Warm Grey soft-touch', '#a69d92'),
    pet('tinglan-hg', 'Tinglan Grey high-gloss', '#8f9290', { gloss: 1 }),
    pet('oat-st', 'Oat Grey matte', '#cfc6b6'),
    pet('cashmere', 'Cashmere Grey', '#9b958d'),
    pet('cement-st', 'Cement Grey soft-touch', '#8e8e8a'),
    pet('gentleman-hg', 'Gentleman Grey high-gloss', '#5f6366', { gloss: 1 }),
    pet('pine-st', 'Pine Forest Grey', '#4d5650'),
    pet('sage-st', 'Sage Green soft-touch', '#a3ad95'),
    pet('sky-st', 'Sky Blue soft-touch', '#a9c2d6'),
    pet('khaki-st', 'Khaki soft-touch', '#b9a585'),
    pet('ink', 'Ink', '#2c2f33'),
    pet('black-hg', 'Black high-gloss', '#1d1e20', { gloss: 1 }),
    petWood('sophia-walnut', 'Sophia Red Walnut', '#7b4a32', '#4a2818'),
    petWood('elegant-oak', 'Elegant Oak', '#c19a6b', '#8a6a42'),
    petWood('orlando-walnut', 'Orlando Walnut', '#6a4a33', '#3a2617'),
    petWood('cory-oak', 'Cory Oak', '#b59471', '#7d6143'),
    petWood('silk-road', 'Silk Road', '#a08a72', '#6d5a45'),
  ];
  const COUNTER_TYPES = [
    { id: 'marble', name: 'Marble', up: false },
    { id: 'quartz', name: 'Quartz stone', up: true },
  ];
  const COUNTER = {
    marble: [
      { id: 'ct-carrara', name: 'Carrara white', t: { k: 'marble', c: '#eeece8', v: '#9b968e' } },
      { id: 'ct-grey', name: 'Grey marble', t: { k: 'marble', c: '#8e8f90', v: '#d8d8d6' } },
    ],
    quartz: [
      { id: 'q-white', name: 'Pure white', up: true, t: { k: 'solid', c: '#f4f3ef' } },
      { id: 'q-calacatta', name: 'Calacatta gold', up: true, t: { k: 'marble', c: '#f2efe8', v: '#b8975a' } },
      { id: 'q-concrete', name: 'Concrete grey', up: true, t: { k: 'concrete', c: '#9a9893' } },
      { id: 'q-black', name: 'Black galaxy', up: true, t: { k: 'terrazzo', c: '#1d1e20', cs: ['#c9b27a', '#5d5e60'], fine: 1 } },
    ],
  };
  const SINK = [ // p.64
    { id: 'ss-double', name: 'Steel double 75x40' },
    { id: 'ss-single', name: 'Steel single 60x45' },
    { id: 'bk-single', name: 'Black single 60x45' },
    { id: 'bk-double', name: 'Black double 75x41' },
  ];

  // ---------- More options (p.75-79) ----------
  const OUTDOOR_KITCHEN = [
    { id: 'none', name: 'None', up: false },
    { id: 'plus', name: 'Party Kitchen Plus', sub: '2.85 x 1.0 x 2.35 m', up: true, len: 2.85 },
    { id: 'pro', name: 'Party Kitchen Pro', sub: '3.85 x 1.0 x 2.35 m', up: true, len: 3.85 },
  ];
  const OK_FINISH = [ // p.77-78: outdoor kitchen cabinets can use the indoor kitchen materials
    { id: 'std', name: 'Standard', sub: 'steel + WPC', up: false },
    { id: 'match', name: 'Match indoor kitchen', sub: 'PET fronts + worktop', up: true },
    { id: 'custom', name: 'Custom', sub: 'pick fronts + worktop', up: true },
  ];
  // outdoor kitchen materials (p.77-78): own cabinet fronts, worktop, WPC wall panels and frame colour
  const OK_CAB = [{ id: 'ok-anth', name: 'Anthracite steel (standard)', up: false, t: { k: 'solid', c: '#3a3d42' } }].concat(CAB_FINISH.filter((o) => o.id !== 'k-white'));
  const OK_TOP = [{ id: 'ok-ss', name: 'Stainless steel (standard)', up: false, t: { k: 'solid', c: '#c4c8cc' }, steel: 1 }]
    .concat(COUNTER.marble.map((o) => Object.assign({}, o, { up: true })), COUNTER.quartz);
  const OK_WALL = [
    { id: 'okw-teak', name: 'Teak WPC (standard)', up: false, t: { k: 'flute', c: '#6b4529' } },
    { id: 'okw-walnut', name: 'Walnut WPC', up: false, t: { k: 'flute', c: '#4a3122' } },
    { id: 'okw-oak', name: 'Light oak WPC', up: false, t: { k: 'flute', c: '#a8835a' } },
    { id: 'okw-grey', name: 'Stone grey WPC', up: false, t: { k: 'flute', c: '#7d7d78' } },
    { id: 'okw-char', name: 'Charcoal WPC', up: false, t: { k: 'flute', c: '#2f3033' } },
  ];
  const OK_FRAME = [
    { id: 'okf-house', name: 'Same as house frame', up: false, t: { k: 'solid', c: '#1d1e20' } },
    { id: 'okf-black', name: 'Black', up: false, t: { k: 'solid', c: '#1d1e20' } },
    { id: 'okf-anth', name: 'Anthracite', up: false, t: { k: 'solid', c: '#4a4d52' } },
    { id: 'okf-white', name: 'White', up: false, t: { k: 'solid', c: '#ecebe6' } },
  ];
  const POOLS = [
    { id: 'none', name: 'None', up: false },
    { id: 'QG-01', name: 'QG-01', sub: '5.8 x 2.2 x 1.5 m', up: true, len: 5.8, steps: false, leds: 2 },
    { id: 'QG-02', name: 'QG-02', sub: '8.8 x 2.2 x 1.5 m', up: true, len: 8.8, steps: true, leds: 2 },
    { id: 'QG-03', name: 'QG-03', sub: '11.8 x 2.2 x 1.5 m', up: true, len: 11.8, steps: true, leds: 4 },
  ];

  const DEFAULTS = {
    size: '20ft', layout: '20-1b', mirror: false, edit: null, furniture: true,
    frame: 'black', roof: 'flat',
    deck: 'none', deckRoof: false, terrace: false, terraceFloor: 'std', terraceRoof: false, terraceThick: false,
    cladType: 'steel', clad: 'mahogany', sandwich: 'eps', panelThk: 75,
    entrance: 'glassDouble', steelColor: 'sd-black', winType: 'hanging', winFrame: 'wf-black', blinds: false,
    curtain: 'none', roomDoor: 'rd-white',
    intWallType: 'carbon', intWall: 'cw-white', joint: 'j-silver',
    floorType: 'pvc', floor: 'pvc-oak', floorHeat: false, indoorLights: 'std', electric: 'eu',
    bathWallType: 'uv', bathWall: 'uv-marble', vanity: 'X1270D', vanityW: 60, heater: 'basic', heaterColor: 'h-white',
    shower: 'chrome', wetDry: 'screen', wetDryFrame: 'black', wetDryGlass: 'clear', bathDoor: 'std', exhaust: false,
    kitchenCab: 'std', cabFinish: 'k-white', counterType: 'marble', counter: 'ct-carrara', sink: 'ss-single',
    outdoorLights: false, solar: false, outdoorKitchen: 'none', okFinish: 'std', okCab: 'ok-anth', okTop: 'ok-ss', okWall: 'okw-teak', okFrame: 'okf-house', pool: 'none', glassSpans: [], gates: [],
    smartLock: false, smartToilet: false, towelRack: false, bathHeater: false,
  };

  const byId = (list, id) => list.find((o) => o.id === id) || list[0];
  const sizeOf = (cfg) => byId(SIZES, cfg.size);

  // ---------- UI schema: sections -> items. Rendered by app.js, also used for the spec sheet ----------
  const SECTIONS = [
    { id: 'model', title: 'Model & floor plan', pages: 'p.5-10', items: [
      { key: 'size', label: 'Container size', type: 'seg', options: () => SIZES.map((s) => ({ id: s.id, name: s.name, sub: s.L.toFixed(2) + ' x ' + s.W.toFixed(2) + ' m' })) },
      { key: 'layout', label: 'Floor plan (catalog)', type: 'plans', info: 'plancore',
        options: (cfg) => CHZ.plansFor(cfg.size).map((p) => ({ id: p.id, name: p.name, sub: p.page })) },
      { key: 'mirror', label: 'Mirror floor plan', type: 'toggle', desc: 'Rooms swap between the front and back sides. The entrance door, the bathroom and the terrace stair stay where they are.' },
      { key: 'furniture', label: 'Show furniture', type: 'toggle', spec: false },
    ] },
    { id: 'structure', title: 'Frame & roof', pages: 'p.11, 73-74', items: [
      { key: 'frame', label: 'Frame colour', type: 'swatch', options: FRAME },
      { key: 'roof', label: 'Roof', type: 'seg', options: ROOFS },
    ] },
    { id: 'terrace', title: 'Terraces', pages: 'p.67-71', items: [
      { key: 'deck', label: 'Ground terrace (deck)', type: 'seg', options: DECKS },
      { key: 'deckRoof', label: 'Terrace roof over the deck', type: 'toggle', up: true, desc: 'Canopy on steel posts', show: (c) => c.deck !== 'none' },
      { key: 'terrace', label: 'Roof terrace with stairs', type: 'toggle', up: true, desc: 'Railing, external steel stair. Needs a flat roof.' },
      { key: 'terraceRoof', label: 'Roof terrace canopy', type: 'toggle', up: true, show: (c) => c.terrace },
      { key: 'terraceFloor', label: 'Terrace floor', type: 'seg', options: TERRACE_FLOOR, show: (c) => c.terrace || c.deck !== 'none' },
      { key: 'terraceThick', label: 'Thickened terrace frame', type: 'toggle', up: true, desc: '80 x 80 mm square tube', show: (c) => c.terrace || c.deck !== 'none' },
    ] },
    { id: 'exterior', title: 'Exterior walls', pages: 'p.13-24', items: [
      { key: 'cladType', label: 'Cladding type', type: 'seg', options: CLAD_TYPES },
      { key: 'clad', label: 'Cladding finish', type: 'swatch', options: (cfg) => CLAD[cfg.cladType] },
      { key: 'sandwich', label: 'Sandwich panel core', type: 'seg', options: SANDWICH, info: 'sandwich' },
      { key: 'panelThk', label: 'Panel thickness', type: 'seg', options: PANEL_THK },
    ] },
    { id: 'openings', title: 'Doors & windows', pages: 'p.33-38, 72', items: [
      { key: 'entrance', label: 'Entrance door', type: 'seg', options: ENTRANCE },
      { key: 'steelColor', label: 'Security door colour', type: 'swatch', options: STEEL_DOOR_COLORS, show: (c) => c.entrance === 'steel' },
      { key: 'winType', label: 'Window type', type: 'seg', options: WINDOWS },
      { key: 'winFrame', label: 'Window & door frames', type: 'swatch', options: WIN_FRAME },
      { key: 'blinds', label: 'Built-in venetian blinds', type: 'toggle', up: true },
      { key: 'curtain', label: 'Glass curtain wall', type: 'seg', options: CURTAIN },
      { key: 'glassSpans', label: 'Panorama glass & glass doors (drawn)', type: 'drawn', up: true },
      { key: 'roomDoor', label: 'Bedroom doors', type: 'swatch', options: ROOM_DOOR },
    ] },
    { id: 'interior', title: 'Interior', pages: 'p.12, 25-32, 65-66', items: [
      { key: 'intWallType', label: 'Wall panel', type: 'seg', options: INT_WALL_TYPES },
      { key: 'intWall', label: 'Wall finish', type: 'swatch', options: (cfg) => INT_WALL[cfg.intWallType] },
      { key: 'joint', label: 'Joint sealing strips', type: 'swatch', options: JOINT },
      { key: 'floorType', label: 'Floor', type: 'seg', options: FLOOR_TYPES },
      { key: 'floor', label: 'Floor colour', type: 'swatch', options: (cfg) => FLOOR[cfg.floorType] },
      { key: 'floorHeat', label: 'Graphene floor heating (film)', type: 'toggle', up: true, desc: 'Heating film under the floor, about 220 W/m2 with a floor-sensor thermostat. Not under the bathroom. Shown in the cutaway view.' },
      { key: 'indoorLights', label: 'Indoor lights', type: 'seg', options: INDOOR_LIGHTS },
      { key: 'electric', label: 'Electrical standard', type: 'seg', options: ELECTRIC, info: 'electric' },
    ] },
    { id: 'bathroom', title: 'Bathroom', pages: 'p.39-55', items: [
      { key: 'bathWallType', label: 'Wall panel', type: 'seg', options: BATH_WALL_TYPES },
      { key: 'bathWall', label: 'Wall finish', type: 'swatch', options: (cfg) => BATH_WALL[cfg.bathWallType] },
      { key: 'vanity', label: 'LED mirror cabinet model', type: 'swatch', options: VANITY },
      { key: 'vanityW', label: 'Cabinet width', type: 'seg', options: (cfg) => byId(VANITY, cfg.vanity).w.map((w) => ({ id: w, name: w + ' cm', up: w > 60 })) },
      { key: 'shower', label: 'Shower finish', type: 'seg', options: SHOWER },
      { key: 'wetDry', label: 'Wet / dry separation', type: 'seg', options: WETDRY },
      { key: 'wetDryFrame', label: 'Screen frame', type: 'seg', options: WETDRY_FRAME },
      { key: 'wetDryGlass', label: 'Screen glass', type: 'seg', options: WETDRY_GLASS },
      { key: 'heater', label: 'Water heater', type: 'seg', options: HEATER },
      { key: 'heaterColor', label: 'Heater colour', type: 'swatch', options: HEATER_COLORS, show: (c) => c.heater !== 'basic' },
      { key: 'exhaust', label: 'Exhaust fan + storage shelf', type: 'toggle', up: true },
      { key: 'bathDoor', label: 'Bathroom door', type: 'seg', options: BATH_DOOR },
    ] },
    { id: 'kitchen', title: 'Kitchen', pages: 'p.56-64', items: [
      { key: 'kitchenCab', label: 'Cabinets', type: 'seg', options: KITCHEN_CAB },
      { key: 'cabFinish', label: 'Cabinet finish (PET)', type: 'swatch', options: CAB_FINISH },
      { key: 'counterType', label: 'Worktop', type: 'seg', options: COUNTER_TYPES },
      { key: 'counter', label: 'Worktop colour', type: 'swatch', options: (cfg) => COUNTER[cfg.counterType] },
      { key: 'sink', label: 'Sink', type: 'seg', options: SINK },
    ] },
    { id: 'outdoor', title: 'Outdoor & energy', pages: 'p.70, 75-79', items: [
      { key: 'outdoorLights', label: 'Outdoor wall lights', type: 'toggle', up: true },
      { key: 'solar', label: 'Solar power system', type: 'toggle', up: true },
      { key: 'outdoorKitchen', label: 'Outdoor kitchen', type: 'seg', options: OUTDOOR_KITCHEN },
      { key: 'okFinish', label: 'Outdoor kitchen finish', type: 'seg', options: OK_FINISH, show: (c) => c.outdoorKitchen !== 'none' },
      { key: 'okCab', label: 'Outdoor cabinet fronts', type: 'swatch', options: OK_CAB, show: (c) => c.outdoorKitchen !== 'none' && c.okFinish === 'custom' },
      { key: 'okTop', label: 'Outdoor worktop', type: 'swatch', options: OK_TOP, show: (c) => c.outdoorKitchen !== 'none' && c.okFinish === 'custom' },
      { key: 'okWall', label: 'Outdoor kitchen wall panels', type: 'swatch', options: OK_WALL, show: (c) => c.outdoorKitchen !== 'none' },
      { key: 'okFrame', label: 'Outdoor kitchen frame', type: 'swatch', options: OK_FRAME, show: (c) => c.outdoorKitchen !== 'none' },
      { key: 'pool', label: 'Outdoor swimming pool', type: 'seg', options: POOLS },
    ] },
    { id: 'smart', title: 'Smart pack', pages: 'p.76', items: [
      { key: 'smartLock', label: 'Smart lock', type: 'toggle', up: true },
      { key: 'smartToilet', label: 'Smart toilet', type: 'toggle', up: true },
      { key: 'towelRack', label: 'Smart towel rack', type: 'toggle', up: true },
      { key: 'bathHeater', label: 'Bath heater', type: 'toggle', up: true },
    ] },
  ];

  // ---------- Rules: keep the configuration valid. Returns messages for the toast ----------
  function applyRules(cfg, changed) {
    const msgs = [];
    const size = sizeOf(cfg);
    const plans = CHZ.plansFor(size.id);
    if (!plans.some((p) => p.id === cfg.layout)) {
      // keep the bedroom count when switching size (or migrating an old saved design)
      const wantBeds = CHZ.PLAN_BY[cfg.layout] ? CHZ.PLAN_BY[cfg.layout].beds : ({ studio: 0, '1bed': 1, '2bed': 2, '3bed': 3, '4bed': 4 }[cfg.layout]);
      const same = plans.find((p) => p.beds === wantBeds);
      cfg.layout = (same || plans[0]).id;
    }
    if (!DECKS.some((o) => o.id === cfg.deck)) cfg.deck = 'none';
    // a new floor plan (or size) starts clean: drawn glass, glass doors and edited walls / doors / windows are reset
    if (changed === 'layout' || changed === 'size') {
      const had = (cfg.glassSpans || []).length + (cfg.gates || []).length + (cfg.edit ? 1 : 0);
      cfg.glassSpans = []; cfg.gates = []; cfg.edit = null;
      if (had) msgs.push('New floor plan: drawn panorama glass, glass doors and wall edits were reset.');
    }
    if (cfg.edit && (cfg.edit.v !== 1 || !Array.isArray(cfg.edit.walls) || !Array.isArray(cfg.edit.doors) || !cfg.edit.wins)) cfg.edit = null;
    // a front entrance must still open into a living space after mirroring (plans with a bathroom at each end cannot be mirrored)
    if (cfg.mirror) {
      const Ym = CHZ.layout(cfg);
      if (Ym.entry.wall === 'front') {
        const cl = Ym.front.find((c) => Ym.entry.x > c.x0 && Ym.entry.x < c.x1);
        if (!cl || cl.type !== 'open') {
          cfg.mirror = false;
          msgs.push('This plan cannot be mirrored: its front door would open into a bedroom (there is a bathroom at each end, so the door cannot move).');
          if (changed === 'mirror') return msgs;
        }
      }
    }
    // mirroring swaps the rooms front <-> back, so drawn glass / glass doors and wall edits move with them:
    // front and back walls swap, positions along the end walls flip, interior lines map zB <-> zF
    if (changed === 'mirror') {
      const Y = CHZ.layout(cfg);
      const zm = (z) => { const n = (q) => Math.abs(z - q) < 0.03; return +(n(Y.zB) ? Y.zF : n(Y.zF) ? Y.zB : n(Y.z0) ? Y.z1 : n(Y.z1) ? Y.z0 : -z).toFixed(3); };
      const sw = (w) => (w === 'front' ? 'back' : w === 'back' ? 'front' : w);
      const long = (w) => w === 'front' || w === 'back';
      cfg.glassSpans = (cfg.glassSpans || []).map((q) => (long(q.w) ? { w: sw(q.w), a: q.a, b: q.b } : { w: q.w, a: -q.b, b: -q.a }));
      cfg.gates = (cfg.gates || []).map((q) => (long(q.w) ? { w: sw(q.w), x: q.x } : { w: q.w, x: -q.x }));
      if (cfg.edit) {
        const E = cfg.edit;
        cfg.edit = {
          v: 1,
          walls: E.walls.map((wl) => (wl.o === 'h' ? { o: 'h', at: zm(wl.at), a: wl.a, b: wl.b } : (() => { const a = zm(wl.a), b = zm(wl.b); return { o: 'v', at: wl.at, a: Math.min(a, b), b: Math.max(a, b) }; })())),
          doors: E.doors.map((d) => (d.o === 'h' ? Object.assign({}, d, { at: zm(d.at), into: -d.into }) : Object.assign({}, d, { p: -d.p }))),
          wins: { front: E.wins.back.slice(), back: E.wins.front.slice() },
        };
      }
    }
    // drawn panorama glass + glass doors on all four walls.
    // Long walls (front/back): positions along X. End walls (east/west): positions along Z, one door per end panel.
    const WALLS = ['front', 'back', 'east', 'west'];
    const limOf = (w) => (w === 'east' || w === 'west' ? size.W / 2 - 0.2 : size.L / 2 - 0.2);
    const blocked = CHZ.drawBlocked ? CHZ.drawBlocked(cfg) : () => false; // bathroom core panel, main entrance panel
    cfg.glassSpans = (Array.isArray(cfg.glassSpans) ? cfg.glassSpans : []).filter((s) => WALLS.includes(s.w))
      .map((s) => { const lim = limOf(s.w); return { w: s.w, a: Math.max(-lim, Math.min(s.a, s.b)), b: Math.min(lim, Math.max(s.a, s.b)) }; })
      .filter((s) => s.b - s.a >= 0.6);
    cfg.gates = (Array.isArray(cfg.gates) ? cfg.gates : []).filter((g) => WALLS.includes(g.w) && Math.abs(g.x) <= limOf(g.w) - (g.w === 'east' || g.w === 'west' ? 0.3 : 0.8) && !blocked(g.w, g.x))
      .map((g) => ({ w: g.w, x: g.x }));
    // re-check doors against the current floor plan (partitions, kitchen, beds): slide them to the nearest spot that fits, or drop them
    if (CHZ.gateSnap && cfg.gates.length) {
      const kept = [];
      cfg.gates.forEach((g) => {
        const r = CHZ.gateSnap(Object.assign({}, cfg, { gates: kept }), g.w, g.x);
        if (r.x != null) kept.push({ w: g.w, x: r.x });
      });
      cfg.gates = kept;
    }
    const ensure = (key, list) => { if (!list.some((o) => o.id === cfg[key])) cfg[key] = list[0].id; };
    ensure('clad', CLAD[cfg.cladType]);
    ensure('intWall', INT_WALL[cfg.intWallType]);
    ensure('floor', FLOOR[cfg.floorType]);
    ensure('bathWall', BATH_WALL[cfg.bathWallType]);
    ensure('counter', COUNTER[cfg.counterType]);
    ensure('okCab', OK_CAB); ensure('okTop', OK_TOP); ensure('okWall', OK_WALL); ensure('okFrame', OK_FRAME);
    const vw = byId(VANITY, cfg.vanity).w;
    if (!vw.includes(Number(cfg.vanityW))) {
      cfg.vanityW = vw.reduce((a, b) => (Math.abs(b - cfg.vanityW) < Math.abs(a - cfg.vanityW) ? b : a));
    }
    if (cfg.terrace && cfg.roof !== 'flat') {
      if (changed === 'roof') { cfg.terrace = false; msgs.push('The roof terrace needs a flat roof, so it was removed.'); }
      else { cfg.roof = 'flat'; msgs.push('Switched to a flat roof for the roof terrace.'); }
    }
    if (cfg.solar && cfg.terrace && !cfg.terraceRoof) {
      if (changed === 'terraceRoof') { cfg.solar = false; msgs.push('Solar panels were removed: with a terrace they mount on the terrace roof.'); }
      else { cfg.terraceRoof = true; msgs.push('Added the terrace roof to carry the solar panels.'); }
    }
    return msgs;
  }

  Object.assign(CHZ, {
    SIZES, LAYOUTS, CORE_W, INNER_H, FRAME, CLAD_TYPES, CLAD, SANDWICH, PANEL_THK, ROOFS, TERRACE_FLOOR, DECKS,
    ENTRANCE, STEEL_DOOR_COLORS, WINDOWS, WIN_FRAME, CURTAIN, ROOM_DOOR, INT_WALL_TYPES, INT_WALL, JOINT,
    FLOOR_TYPES, FLOOR, INDOOR_LIGHTS, ELECTRIC, BATH_WALL_TYPES, BATH_WALL, VANITY, HEATER, HEATER_COLORS,
    SHOWER, WETDRY, WETDRY_FRAME, WETDRY_GLASS, BATH_DOOR, KITCHEN_CAB, CAB_FINISH, COUNTER_TYPES, COUNTER,
    SINK, OUTDOOR_KITCHEN, OK_FINISH, OK_CAB, OK_TOP, OK_WALL, OK_FRAME, POOLS, DEFAULTS, SECTIONS, byId, sizeOf, applyRules,
  });
})(window.CHZ);
