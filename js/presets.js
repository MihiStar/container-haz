/* Ready-made designs: 3-4 per container size. Each one is a complete, buildable combination of catalog options,
 * with the reasoning behind it ("why"). Only options that differ from the defaults are listed in cfg.
 * Load one from the Presets gallery (header), then change anything you like.
 */
window.CHZ = window.CHZ || {};
CHZ.PRESETS = [
  // ---------------------------------------------------------------- 10 ft
  {
    id: 'p10-micro', size: '10ft', tag: 'Best value', name: 'Micro Studio',
    blurb: 'The lowest cost per square metre: a compact sleeping studio that is ready to plug in.',
    chips: ['1 bedroom', 'EPS 75 mm', 'Iron grey steel'],
    why: [
      'Standard EPS core and colour steel skin keep the price down; 75 mm is enough for a mild climate.',
      'Inward-opening windows and a glass double door give daylight without upgrades.',
      'PVC flooring is waterproof and easy to replace in a small, high-traffic space.',
    ],
    cfg: { size: '10ft', layout: '10-1b', clad: 'irongray', frame: 'black', winType: 'inward', floor: 'pvc-grey' },
  },
  {
    id: 'p10-office', size: '10ft', tag: 'Work', name: 'Garden Office',
    blurb: 'A quiet, bright workspace at the bottom of the garden, with a full glass front.',
    chips: ['Open shell', 'Glass front', 'Rock wool 75 mm', 'Blinds'],
    why: [
      'A rock wool core damps sound better than foam, so calls stay private and outside noise stays out.',
      'A full-height glass front gives desk daylight; built-in blinds stop screen glare.',
      'The open shell leaves the whole floor free for desks and shelving; 4 mm SPC handles office chairs.',
    ],
    cfg: { size: '10ft', layout: '10-shell', sandwich: 'rockwool', curtain: 'front', blinds: true, cladType: 'wpcFlat', clad: 'wf-walnut',
      frame: 'darkgray', intWallType: 'carbon', intWall: 'cw-oak', floorType: 'spc4', floor: 's4-8916', indoorLights: 'up', outdoorLights: true, furniture: false },
  },
  {
    id: 'p10-offgrid', size: '10ft', tag: 'Off-grid', name: 'Off-Grid Cabin',
    blurb: 'A self-sufficient hut for remote land: best insulation, its own power and a roof that sheds snow.',
    chips: ['PIR 100 mm', 'Gable roof', 'Solar', 'Steel door'],
    why: [
      'PIR at 100 mm gives the lowest wall U-value in the catalog, so a small solar system can heat it.',
      'A gable roof sheds snow and rain instead of loading a flat roof.',
      'A steel security door with a smart lock suits a cabin that stands empty between visits.',
    ],
    cfg: { size: '10ft', layout: '10-1b', sandwich: 'pir', panelThk: 100, roof: 'gable', solar: true, entrance: 'steel', steelColor: 'sd-anthracite',
      smartLock: true, cladType: 'wpcEmb', clad: 'we-teak', frame: 'brown', winType: 'double', heater: 'instant' },
  },
  {
    id: 'p10-cabana', size: '10ft', tag: 'Outdoor', name: 'Poolside Cabana',
    blurb: 'A small pool house: changing room, outdoor kitchen and a plunge pool on one patio.',
    chips: ['Pool QG-01', 'Outdoor kitchen', 'Covered deck'],
    why: [
      'The 5.8 m QG-01 pool and the Plus kitchen fit beside a 10 ft unit on one connected patio.',
      'A covered front deck gives shade between pool and kitchen.',
      'WPC decking and cladding take sun and splashes without painting.',
    ],
    cfg: { size: '10ft', layout: '10-shell', pool: 'QG-01', outdoorKitchen: 'plus', deck: 'front', deckRoof: true, terraceFloor: 'wpc',
      cladType: 'wpcFlat', clad: 'wf-teak', frame: 'white', curtain: 'front', outdoorLights: true },
  },

  // ---------------------------------------------------------------- 15 ft
  {
    id: 'p15-cottage', size: '15ft', tag: 'Weekend', name: 'Weekend Cottage',
    blurb: 'A cosy holiday cottage with a covered porch and a timber look.',
    chips: ['Gable roof', 'Graphite EPS 75 mm', 'Covered porch'],
    why: [
      'Graphite EPS insulates about 15% better than white EPS for little extra cost.',
      'A gable roof and wood-grain steel give a classic cottage look on a standard frame.',
      'The covered front deck doubles the usable space in summer.',
    ],
    cfg: { size: '15ft', layout: '15-1b', sandwich: 'graphite', roof: 'gable', clad: 'wood3d', frame: 'brown', deck: 'front', deckRoof: true,
      floorType: 'spc4', floor: 's4-8007', wetDry: 'door', outdoorLights: true },
  },
  {
    id: 'p15-glass', size: '15ft', tag: 'Design', name: 'Glass Loft',
    blurb: 'A glass-walled studio with warm floors and a full kitchen: the house is the view.',
    chips: ['Glass front + end', 'PU 100 mm', 'Floor heating', 'Quartz'],
    why: [
      'Glass loses heat, so the solid walls get a 100 mm PU core to balance it.',
      'Graphene floor heating keeps the glass side comfortable without radiators under the windows.',
      'Fishbone SPC and a quartz worktop make the open room feel finished.',
    ],
    cfg: { size: '15ft', layout: '15-1b', curtain: 'both', sandwich: 'pu', panelThk: 100, blinds: true, floorHeat: true, floorType: 'fishbone', floor: 'fb-natural',
      kitchenCab: 'up', cabFinish: 'pet-cashmere', counterType: 'quartz', counter: 'q-calacatta', frame: 'black', clad: 'gray7042', indoorLights: 'up' },
  },
  {
    id: 'p15-rental', size: '15ft', tag: 'Rental', name: 'Guest Suite',
    blurb: 'Built for short-term rental: self check-in, hard-wearing finishes, quiet rooms.',
    chips: ['Smart pack', 'Rock wool 100 mm', 'SPC 6 mm'],
    why: [
      'A smart lock allows self check-in; a smart toilet, towel rack and bath heater add guest comfort.',
      'Carborundum 6 mm SPC is the most wear-resistant floor, built for suitcases and turnover.',
      'Rock wool is non-combustible and quieter, a plus for licensing and reviews.',
    ],
    cfg: { size: '15ft', layout: '15-1b', sandwich: 'rockwool', panelThk: 100, smartLock: true, smartToilet: true, towelRack: true, bathHeater: true,
      floorType: 'spc6', floor: 's6-8105', bathWallType: 'spc', bathWall: 'spc-stone23', heater: 'instant', exhaust: true, clad: 'xinyu', frame: 'black' },
  },

  // ---------------------------------------------------------------- 20 ft
  {
    id: 'p20-starter', size: '20ft', tag: 'Best value', name: 'Starter Home',
    blurb: 'Two bedrooms on a budget: everything needed to live, nothing that is not.',
    chips: ['2 bedrooms', 'EPS 75 mm', 'Beige steel'],
    why: [
      'Standard catalog options throughout keep the price at the base level.',
      'Two bedrooms plus a living-kitchen fit a couple or a small family.',
      'A light beige skin stays cooler in the sun than dark colours.',
    ],
    cfg: { size: '20ft', layout: '20-2b', clad: 'beige', frame: 'white', winFrame: 'wf-white', floor: 'pvc-oak' },
  },
  {
    id: 'p20-family', size: '20ft', tag: 'Family', name: 'Family Compact',
    blurb: 'Three bedrooms in a 20 ft unit, warm and durable for everyday family life.',
    chips: ['3 bedrooms', 'Rock wool 75 mm', 'Floor heating', 'Porch'],
    why: [
      'Rock wool keeps bedrooms quiet from each other and from outside.',
      'Floor heating frees wall space in small rooms.',
      'A covered front deck gives children an outdoor space that stays dry.',
    ],
    cfg: { size: '20ft', layout: '20-3b', sandwich: 'rockwool', floorHeat: true, floorType: 'spc6', floor: 's6-8102', indoorLights: 'up', deck: 'front',
      deckRoof: true, clad: 'wenge', frame: 'black', roomDoor: 'rd-oak', kitchenCab: 'up', cabFinish: 'pet-warmgrey-st' },
  },
  {
    id: 'p20-twobath', size: '20ft', tag: 'Rental', name: 'Two-Bath Duo',
    blurb: 'Two bedrooms with a bathroom each: ideal for two tenants or two couples.',
    chips: ['2 bedrooms, 2 baths', 'PIR 75 mm', 'Smart lock', 'Carved slate'],
    why: [
      'Each bedroom has its own bathroom, so two parties share only the living space.',
      'Instant water heaters heat only on demand, so two bathrooms do not need a large tank.',
      'Carved slate cladding gives a solid, premium look that rents well.',
    ],
    cfg: { size: '20ft', layout: '20-2b2ba', sandwich: 'pir', smartLock: true, heater: 'instant', bathWallType: 'spc', bathWall: 'spc-yafeigrey',
      exhaust: true, cladType: 'carved', clad: 'cv-slate', frame: 'black', floorType: 'spc4', floor: 's4-8913' },
  },
  {
    id: 'p20-rooftop', size: '20ft', tag: 'Outdoor', name: 'Rooftop Lounge',
    blurb: 'A one-bedroom home with a shaded roof terrace and solar on the canopy.',
    chips: ['Roof terrace', 'Canopy with solar', 'Glass front'],
    why: [
      'The roof terrace adds a second "floor" of living space without enlarging the footprint.',
      'Solar panels sit on the sloped terrace canopy, which also shades the deck.',
      'A glass front links the living room to the garden below.',
    ],
    cfg: { size: '20ft', layout: '20-1b', terrace: true, terraceRoof: true, solar: true, terraceFloor: 'wpc', terraceThick: true, curtain: 'front',
      cladType: 'wpcEmb', clad: 'we-charcoal', frame: 'black', outdoorLights: true, indoorLights: 'up' },
  },

  // ---------------------------------------------------------------- 30 ft
  {
    id: 'p30-lake', size: '30ft', tag: 'Holiday', name: 'Lakeside Holiday Home',
    blurb: 'Two bedrooms facing the water, with an L-shaped covered terrace and an outdoor kitchen.',
    chips: ['Glass front', 'L-shaped terrace', 'Outdoor kitchen', 'PU 100 mm'],
    why: [
      'A glass front and an L-shaped terrace turn the long side toward the view.',
      'PU 100 mm and floor heating balance the heat lost through the glass.',
      'The outdoor kitchen uses the indoor kitchen finishes, so inside and outside read as one design.',
    ],
    cfg: { size: '30ft', layout: '30-2b', curtain: 'front', blinds: true, deck: 'L', deckRoof: true, terraceFloor: 'wpc', sandwich: 'pu', panelThk: 100,
      floorHeat: true, cladType: 'wpcFlat', clad: 'wf-teak', frame: 'brown', outdoorKitchen: 'plus', okFinish: 'match', kitchenCab: 'up',
      cabFinish: 'pet-cream-st', counterType: 'quartz', counter: 'q-white', outdoorLights: true },
  },
  {
    id: 'p30-fourseason', size: '30ft', tag: 'Year-round', name: 'Four-Season Family',
    blurb: 'Three bedrooms built for cold winters: thick insulation, warm floors, snow-shedding roof.',
    chips: ['3 bedrooms', 'Graphite EPS 100 mm', 'Gable roof', 'Floor heating'],
    why: [
      'Graphite EPS at 100 mm is a strong insulation choice at a moderate price.',
      'A gable roof sheds snow; double-opening windows seal tightly for winter.',
      'Floor heating plus a full kitchen with tall units make it a permanent home, not a cabin.',
    ],
    cfg: { size: '30ft', layout: '30-3b', sandwich: 'graphite', panelThk: 100, roof: 'gable', floorHeat: true, winType: 'double', floorType: 'spc6',
      floor: 's6-8104', kitchenCab: 'up', cabFinish: 'pet-sage-st', counterType: 'quartz', counter: 'q-concrete', entrance: 'steel', steelColor: 'sd-walnut',
      clad: 'maple', frame: 'brown', heater: 'storage', indoorLights: 'up' },
  },
  {
    id: 'p30-duo', size: '30ft', tag: 'Rental', name: 'Twin Suites',
    blurb: 'Two private suites, each with its own bathroom, with smart access for managed rentals.',
    chips: ['2 bedrooms, 2 baths', 'Rock wool 100 mm', 'Smart pack'],
    why: [
      'Rock wool 100 mm gives fire safety and sound separation between the two suites.',
      'The smart pack lets guests check in and use the bathroom heaters without a host on site.',
      'SPC bathroom walls and carborundum floors stand up to frequent cleaning.',
    ],
    cfg: { size: '30ft', layout: '30-2b2ba', sandwich: 'rockwool', panelThk: 100, smartLock: true, smartToilet: true, towelRack: true, bathHeater: true,
      bathWallType: 'spc', bathWall: 'spc-warmwhite', heater: 'instant', exhaust: true, floorType: 'spc6', floor: 's6-8106', clad: 'gray7042', frame: 'darkgray' },
  },
  {
    id: 'p30-wellness', size: '30ft', tag: 'Outdoor', name: 'Wellness Retreat',
    blurb: 'A one-bedroom spa house: large pool, outdoor kitchen and a bathroom to match.',
    chips: ['Pool QG-02', 'Outdoor kitchen Pro', 'Spa bathroom'],
    why: [
      'The 8.8 m QG-02 pool with its stepped block suits relaxing rather than lap swimming.',
      'The Pro kitchen in custom finishes and a covered deck make the patio the main living space.',
      'SPC stone bathroom walls, a 120 cm vanity and a fluted-glass door carry the spa theme inside.',
    ],
    cfg: { size: '30ft', layout: '30-1b', pool: 'QG-02', outdoorKitchen: 'pro', okFinish: 'custom', okCab: 'pet-elegant-oak', okTop: 'q-black',
      okWall: 'okw-char', okFrame: 'okf-black', deck: 'front', deckRoof: true, terraceFloor: 'wpc', cladType: 'wpcEmb', clad: 'we-walnut', frame: 'black',
      bathWallType: 'spc', bathWall: 'spc-roman', vanityW: 120, bathDoor: 'rainbow', floorHeat: true, outdoorLights: true },
  },

  // ---------------------------------------------------------------- 40 ft
  {
    id: 'p40-residence', size: '40ft', tag: 'Family', name: 'Family Residence',
    blurb: 'A full three-bedroom home: warm, solar-assisted and finished like a permanent house.',
    chips: ['3 bedrooms', 'Graphite EPS 100 mm', 'Solar', 'Covered porch'],
    why: [
      'Graphite EPS 100 mm plus floor heating gives comfortable rooms at a sensible running cost.',
      'Solar on the flat roof offsets the electric heating and hot water.',
      'Quartz worktop, tall units and LED lighting finish it to a permanent-home standard.',
    ],
    cfg: { size: '40ft', layout: '40-3b', sandwich: 'graphite', panelThk: 100, floorHeat: true, solar: true, floorType: 'spc6', floor: 's6-8102',
      kitchenCab: 'up', cabFinish: 'pet-iceberg-hg', counterType: 'quartz', counter: 'q-calacatta', deck: 'front', deckRoof: true, outdoorLights: true,
      indoorLights: 'up', clad: 'xinyu', frame: 'black', winType: 'sliding', roomDoor: 'rd-walnut' },
  },
  {
    id: 'p40-villa', size: '40ft', tag: 'Showcase', name: 'Resort Villa',
    blurb: 'Every outdoor upgrade on one plot: glass walls, roof terrace, L-terrace, kitchen and the long pool.',
    chips: ['Glass walls', 'Roof terrace + solar', 'Pool QG-03', 'L-terrace'],
    why: [
      'The 11.8 m QG-03 pool matches the 40 ft length, so the yard reads as one composition.',
      'Glass on the front and the entrance end, with PU 100 mm walls and blinds to manage heat.',
      'The roof terrace canopy carries the solar panels; the L-shaped terrace wraps the entrance.',
    ],
    cfg: { size: '40ft', layout: '40-2b-m', curtain: 'both', blinds: true, sandwich: 'pu', panelThk: 100, terrace: true, terraceRoof: true, solar: true,
      terraceFloor: 'wpc', terraceThick: true, deck: 'L', deckRoof: true, pool: 'QG-03', outdoorKitchen: 'pro', okFinish: 'match', kitchenCab: 'up',
      cabFinish: 'pet-black-hg', counterType: 'quartz', counter: 'q-white', cladType: 'wpcEmb', clad: 'we-grey', frame: 'black', floorHeat: true,
      floorType: 'fishbone', floor: 'fb-smoke', outdoorLights: true, indoorLights: 'up', smartLock: true },
  },
  {
    id: 'p40-homestead', size: '40ft', tag: 'Off-grid', name: 'Off-Grid Homestead',
    blurb: 'Four bedrooms on remote land: maximum insulation, solar power and a secure, low-maintenance shell.',
    chips: ['4 bedrooms', 'PIR 100 mm', 'Solar', 'Steel door'],
    why: [
      'PIR 100 mm has the lowest heat loss, which keeps the solar and battery system small.',
      'A sloping roof sheds rain and snow; a storage water heater runs on low connection power.',
      'Carved slate cladding and a steel security door need no painting and resist knocks.',
    ],
    cfg: { size: '40ft', layout: '40-4b', sandwich: 'pir', panelThk: 100, roof: 'sloping', solar: true, heater: 'storage', entrance: 'steel',
      steelColor: 'sd-black', smartLock: true, cladType: 'carved', clad: 'cv-slate', frame: 'darkgray', winType: 'double', floorType: 'spc6', floor: 's6-8107' },
  },
  {
    id: 'p40-showroom', size: '40ft', tag: 'Work', name: 'Showroom & Office',
    blurb: 'An open commercial space with a glass shop front, fire-safe walls and a hard-wearing floor.',
    chips: ['Open shell', 'Glass front', 'Rock wool 100 mm', 'SPC 6 mm'],
    why: [
      'Rock wool 100 mm is non-combustible, which commercial use and fire rules often require.',
      'A full glass front works as a shop window; LED strips and downlights light the display.',
      'Carborundum SPC takes foot traffic, and the open shell can be divided later.',
    ],
    cfg: { size: '40ft', layout: '40-shell', curtain: 'front', sandwich: 'rockwool', panelThk: 100, floorType: 'spc6', floor: 's6-8113', indoorLights: 'up',
      outdoorLights: true, clad: 'gray7042', frame: 'white', winFrame: 'wf-white', furniture: false, smartLock: true },
  },
];
