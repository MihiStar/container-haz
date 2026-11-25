/* Benefits: scores (with an itemised breakdown), unlockable badges, researched background facts and factory questions.
 * Everything is derived from cfg, so it updates live. Scores are indicative comparisons, not engineering values.
 */
(function (CHZ) {
  'use strict';
  const { byId } = CHZ;
  const clamp = (v) => Math.max(0, Math.min(100, Math.round(v)));

  const ICON = {
    leaf: 'M5 19c8 0 14-6 14-14-8 0-14 5-14 13zM5 19l7-7',
    sun: 'M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM12 1v3M12 20v3M1 12h3M20 12h3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1',
    shield: 'M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5zM9 12l2 2 4-4',
    flame: 'M12 22c4 0 7-3 7-7 0-5-5-7-5-12-3 2-4 5-4 7-1-1-2-2-2-4-2 2-3 5-3 9 0 4 3 7 7 7z',
    waves: 'M3 8c3-2 6 2 9 0s6-2 9 0M3 13c3-2 6 2 9 0s6-2 9 0M3 18c3-2 6 2 9 0s6-2 9 0',
    lock: 'M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4M12 15v2',
    chip: 'M7 7h10v10H7zM10 10h4v4h-4zM9 3v4M15 3v4M9 17v4M15 17v4M3 9h4M3 15h4M17 9h4M17 15h4',
    drop: 'M12 3s7 7 7 12a7 7 0 0 1-14 0c0-5 7-12 7-12z',
    pot: 'M4 10h16v3a7 7 0 0 1-7 7h-2a7 7 0 0 1-7-7zM2 10h20M9 6c0-2 2-2 2-4M14 6c0-2 2-2 2-4',
    deck: 'M3 21V11l9-7 9 7v10M3 11h18M7 21v-6M17 21v-6M3 17h18',
    pool: 'M2 18c2.5-1.5 5 1.5 7.5 0s5-1.5 7.5 0 5 1.5 5 0M2 14c2.5-1.5 5 1.5 7.5 0s5-1.5 7.5 0 5 1.5 5 0M7 12V4a2 2 0 0 1 4 0M15 12V4a2 2 0 0 1 4 0M7 8h8',
    window: 'M4 3h16v18H4zM12 3v18M4 12h16',
    layers: 'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5M3 17l9 5 9-5',
    moon: 'M20 15A8 8 0 1 1 9 4a7 7 0 0 0 11 11z',
    tree: 'M12 2l6 9h-3l4 6H5l4-6H6zM12 17v5',
    home: 'M3 11l9-8 9 8v10H3zM9 21v-6h6v6',
    bolt: 'M13 2L4 14h7l-1 8 9-12h-7z',
    snow: 'M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7M9 4l3 2 3-2M9 20l3-2 3 2',
    help: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01',
  };

  const uOf = (lambda, mm) => 1 / (0.17 + mm / 1000 / lambda);
  function uValue(cfg) { return uOf(Number(byId(CHZ.SANDWICH, cfg.sandwich).lambda), cfg.panelThk); }

  // score = base + sum of contributions that are switched on; every possible contribution is listed (on/off) for the report
  function score(id, name, icon, sec, base, parts) {
    const v = clamp(base + parts.reduce((a, p) => a + (p.on ? p.pts : 0), 0));
    return { id, name, icon, sec, v, base, parts };
  }

  function evaluate(cfg) {
    const s = byId(CHZ.SANDWICH, cfg.sandwich);
    const U = uValue(cfg);
    const smartN = ['smartLock', 'smartToilet', 'towelRack', 'bathHeater'].filter((k) => cfg[k]).length;
    const beds = (CHZ.LAYOUTS[cfg.layout] || { beds: 0 }).beds;
    const spans = (cfg.glassSpans || []).length, gates = (cfg.gates || []).length;
    const glassy = cfg.curtain !== 'none' || spans > 0;
    const deck = cfg.deck && cfg.deck !== 'none';
    const p = (label, pts, on, hint) => ({ label, pts, on: !!on, hint });

    const uPts = Math.round(100 - (U - 0.2) * 130) - 60; // relative to base 60
    const scores = [
      score('energy', 'Energy efficiency', 'bolt', 'exterior', 60, [
        p(`Wall insulation: ${s.name}, ${cfg.panelThk} mm (U ≈ ${U.toFixed(2)})`, uPts, true, 'Lower U-value = less heat loss. PU/PIR or thicker panels score best.'),
        p('Solar power system', 18, cfg.solar, 'Makes its own electricity.'),
        p('LED lighting upgrade', 4, cfg.indoorLights === 'up'),
        p('Built-in blinds (solar shading)', 5, cfg.blinds),
        p('Instant water heater (heats only on demand)', 3, cfg.heater === 'instant'),
        p('Glass curtain wall / panorama glass (more heat loss than panel wall)', cfg.curtain === 'both' ? -14 : -8, glassy),
      ]),
      score('comfort', 'Comfort', 'home', 'interior', 35, [
        p('Graphene floor heating film', 22, cfg.floorHeat),
        p('Upgraded water heater', 6, cfg.heater !== 'basic'),
        p('Bath heater', 6, cfg.bathHeater),
        p('Smart toilet', 6, cfg.smartToilet),
        p('LED lighting upgrade', 6, cfg.indoorLights === 'up'),
        p('Rock wool core (quieter rooms)', 6, cfg.sandwich === 'rockwool'),
        p('Wider LED mirror cabinet', 5, cfg.vanityW > 60),
        p('Exhaust fan + shelf', 5, cfg.exhaust),
        p('Smart towel rack', 4, cfg.towelRack),
        p('Built-in blinds', 3, cfg.blinds),
        p('Glass dividing door in the shower', 3, cfg.wetDry === 'door'),
      ]),
      score('safety', 'Safety', 'shield', 'openings', 30, [
        p('Rock wool core (non-combustible)', 40, s.id === 'rockwool'),
        p('PIR core (better fire behaviour than PU/EPS)', 25, s.id === 'pir'),
        p('Graphite EPS core', 15, s.id === 'graphite'),
        p('Steel security entrance door', 20, cfg.entrance === 'steel'),
        p('Smart lock', 12, cfg.smartLock),
        p('Outdoor lights', 6, cfg.outdoorLights),
      ]),
      score('durable', 'Durability', 'layers', 'exterior', 40, [
        p('Metal carved cladding', 18, cfg.cladType === 'carved'),
        p('WPC embossed cladding', 14, cfg.cladType === 'wpcEmb'),
        p('WPC flat cladding', 12, cfg.cladType === 'wpcFlat'),
        p('6 mm SPC floor with carborundum wear layer', 22, cfg.floorType === 'spc6'),
        p('Fishbone SPC floor', 14, cfg.floorType === 'fishbone'),
        p('4 mm SPC floor', 12, cfg.floorType === 'spc4'),
        p('Quartz worktop', 8, cfg.counterType === 'quartz'),
        p('Pitched roof (sheds rain and snow)', 8, cfg.roof !== 'flat'),
        p('Thickened 80x80 terrace frame', 8, cfg.terraceThick && (cfg.terrace || deck)),
        p('SPC bathroom walls', 6, cfg.bathWallType === 'spc'),
      ]),
      score('outdoor', 'Outdoor living', 'tree', 'outdoor', 0, [
        p(cfg.deck === 'L' ? 'Ground terrace, front + side' : 'Ground terrace deck', cfg.deck === 'L' ? 24 : 18, deck),
        p('Roof over the deck', 8, deck && cfg.deckRoof),
        p('Roof terrace', 30, cfg.terrace),
        p('Roof terrace canopy', 10, cfg.terrace && cfg.terraceRoof),
        p('Outdoor kitchen', cfg.outdoorKitchen === 'pro' ? 28 : 20, cfg.outdoorKitchen !== 'none'),
        p('Swimming pool', 28, cfg.pool !== 'none'),
        p('Outdoor lights', 10, cfg.outdoorLights),
        p('Glass doors to the garden', 6, gates > 0 || glassy),
      ]),
      score('smart', 'Smart & tech', 'chip', 'smart', 0, [
        p('Smart lock', 18, cfg.smartLock), p('Smart toilet', 18, cfg.smartToilet), p('Smart towel rack', 18, cfg.towelRack), p('Bath heater', 18, cfg.bathHeater),
        p('Solar power system', 14, cfg.solar),
        p('Floor heating thermostat', 8, cfg.floorHeat),
        p('Instant water heater', 6, cfg.heater === 'instant'),
        p('LED lighting upgrade', 6, cfg.indoorLights === 'up'),
      ]),
    ];

    const A = (id, name, icon, sec, got, of, desc, hint) => ({ id, name, icon, sec, got: Math.min(got, of), of, done: got >= of, desc, hint });
    const spa = [cfg.bathWallType === 'spc', cfg.vanityW > 60, cfg.heater !== 'basic', cfg.exhaust].filter(Boolean).length;
    const resort = (cfg.pool !== 'none' ? 1 : 0) + (cfg.outdoorKitchen !== 'none' ? 1 : 0);
    const achievements = [
      A('insulated', 'Energy Saver', 'leaf', 'exterior', U <= 0.32 ? 1 : 0, 1, `Wall U-value about ${U.toFixed(2)} W/m²K. Lower heating and cooling bills.`, 'Choose a PU or PIR core, or 100 mm panels.'),
      A('offgrid', 'Off-Grid Ready', 'sun', 'outdoor', cfg.solar ? 1 : 0, 1, 'Solar power system makes its own electricity.', 'Add the solar power system.'),
      A('fire', 'Fire Safe A1', 'flame', 'exterior', cfg.sandwich === 'rockwool' ? 1 : 0, 1, 'Non-combustible rock wool core (A1 core, A2-s1,d0 panel) with sound damping.', 'Choose the rock wool sandwich core.'),
      A('warm', 'Warm Floors', 'waves', 'interior', cfg.floorHeat ? 1 : 0, 1, 'Graphene film floor heating: even, silent warmth from below.', 'Add graphene floor heating.'),
      A('fortress', 'Fortress', 'lock', 'openings', (cfg.entrance === 'steel' ? 1 : 0) + (cfg.smartLock ? 1 : 0), 2, 'Steel security door with a smart lock.', 'Steel security door + smart lock.'),
      A('smarthome', 'Smart Home', 'chip', 'smart', smartN, 3, 'Three or more smart pack devices.', 'Pick 3 items from the smart pack.'),
      A('spa', 'Spa Bathroom', 'drop', 'bathroom', spa, 4, 'SPC stone walls, wide LED mirror cabinet, upgraded heater and exhaust fan.', 'Upgrade bathroom walls, cabinet, heater and fan.'),
      A('chef', "Chef's Kitchen", 'pot', 'kitchen', (cfg.kitchenCab === 'up' ? 1 : 0) + (cfg.counterType === 'quartz' ? 1 : 0), 2, 'Full cabinet set with a quartz stone worktop.', 'Upgrade cabinets and choose quartz.'),
      A('porch', 'Porch Life', 'deck', 'terrace', (deck ? 1 : 0) + (deck && cfg.deckRoof ? 1 : 0), 2, 'Covered ground terrace at the front or side.', 'Add a ground terrace and its roof.'),
      A('rooftop', 'Rooftop Lounge', 'deck', 'terrace', (cfg.terrace ? 1 : 0) + (cfg.terrace && cfg.terraceRoof ? 1 : 0), 2, 'Roof terrace with a shade canopy.', 'Add the roof terrace and its canopy.'),
      A('resort', 'Resort Living', 'pool', 'outdoor', resort, 2, 'Swimming pool and outdoor kitchen.', 'Add a pool and an outdoor kitchen.'),
      A('panorama', 'Panorama', 'window', 'openings', glassy ? 1 : 0, 1, 'Glass curtain wall or drawn panorama glass opens the house to the view.', 'Add a curtain wall or draw panorama glass on the 2D plan.'),
      A('wearproof', 'Wear-Proof Floors', 'layers', 'interior', cfg.floorType === 'spc6' ? 1 : 0, 1, '6 mm SPC with carborundum wear layer.', 'Choose 6 mm SPC flooring.'),
      A('nightglow', 'Night Glow', 'moon', 'outdoor', (cfg.outdoorLights ? 1 : 0) + (cfg.indoorLights === 'up' ? 1 : 0), 2, 'Outdoor wall lights and LED interior lighting.', 'Add outdoor lights and LED indoor lights.'),
      A('natural', 'Natural Look', 'tree', 'exterior', cfg.cladType === 'wpcEmb' || cfg.cladType === 'wpcFlat' || cfg.cladType === 'carved' ? 1 : 0, 1, 'WPC or carved panel cladding.', 'Choose WPC or carved cladding.'),
      A('family', 'Family Home', 'home', 'model', beds >= 3 ? 1 : 0, 1, `${beds} bedrooms.`, 'Choose a plan with 3 or more bedrooms (20, 30 or 40 ft).'),
      A('allseason', 'All-Season', 'snow', 'exterior', (U <= 0.32 ? 1 : 0) + (cfg.floorHeat ? 1 : 0) + (cfg.roof !== 'flat' ? 1 : 0), 3, 'Insulated, heated floors and a pitched roof that sheds snow and rain.', 'Energy Saver + floor heating + pitched roof.'),
    ];
    const overall = clamp(scores.reduce((a, b) => a + b.v, 0) / scores.length);
    return { U, scores, achievements, overall, unlocked: achievements.filter((a) => a.done).length };
  }

  // ---------------------------------------------------------------- researched background (public sources, Nov 2026)
  const SOURCES = {
    neopor: { t: 'BASF Neopor (graphite EPS) brochure', u: 'https://fepwaf20.basf.com/portal/load/fid1225927/Neopor_Thermal_insulation.pdf' },
    gepsStudy: { t: 'Graphite microfiller in EPS - MDPI Materials 2020', u: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7321605/' },
    rwGuide: { t: 'ROCKWOOL sandwich panel technical guide', u: 'https://editserver.rockwool.com/contentassets/e9d99690c8fa4f688c694a73b424cdc4/2022_04_08-rw-cs-swp-technical-guide-en.pdf' },
    rwBrochure: { t: 'ROCKWOOL sandwich panel brochure', u: 'https://www.rockwool.com/siteassets/rw-group/media/cs-material/rw_cs_sandwich-panel-brochure_v72.pdf' },
    puEurope: { t: 'PU Europe factsheet 24C (fire performance)', u: 'https://www.pu-europe.eu/wp-content/uploads/2023/06/Factsheet_24C_Fire_performance_of_thermal_insulation_products_in_end-use_conditions_-_Room_fire_test_of_an_insulated_internal_plasterboard_wall.pdf' },
    elastopir: { t: 'BASF Elastopir (PIR) overview', u: 'https://products.basf.com/en/Elastopir.html' },
    gb8624: { t: 'GB 8624-2012 (Chinese fire classification)', u: 'https://www.chinesestandard.net/PDF-EN/GB8624-2012EN-P15P-H12580H-777937.pdf' },
    filmWiki: { t: 'Heating film - Wikipedia', u: 'https://en.wikipedia.org/wiki/Heating_film' },
    filmManual: { t: 'Infrared underfloor heating film installation manual', u: 'https://checkout.mkm.com/content/products/pdf/52304/i-warm-flux-infrared-underfloor-heating-50cm-8m2-pack-l090091_Installation_1.pdf' },
    grapheneFloor: { t: 'Numerical heat study of a graphene-heated floor - BioResources 2023', u: 'https://bioresources.cnr.ncsu.edu/wp-content/uploads/2023/01/BioRes_18_1_1948_Yang_GZZXT_Numeric_Heat_Graphene_Heat_Graphene_Floor_20375.pdf' },
    shower: { t: 'Electric shower circuits (cable and breaker sizes)', u: 'https://www.diydoctor.org.uk/projects/electricshower.htm' },
  };

  // per report page: facts with a confidence level (verified = public sources agree / catalog = from the PDF only / check = ask the factory)
  const FACTS = {
    energy: [
      { h: 'Graphite vs graphene - two different things', c: 'verified', b: '<b>Graphite core</b> (catalog p.24) is a wall/roof <b>sandwich panel core</b>: grey EPS foam with graphite particles that block radiant heat. <b>Graphene</b> (catalog p.25) is the <b>floor heating film</b> laid under the flooring. Graphite does not heat; graphene film does not insulate.', s: ['neopor', 'gepsStudy', 'filmWiki'] },
      { h: 'Insulation values of the panel cores', c: 'verified', b: 'Typical thermal conductivity (lower = better): PIR 0.018-0.023, PU 0.022-0.026, graphite EPS 0.030-0.032, white EPS 0.035-0.038, rock wool 0.039-0.042 W/m.K. Exact values depend on density and grade; manufacturers advise using declared (tested) values, rock wool data adds a design safety margin.', s: ['neopor', 'rwGuide', 'elastopir'] },
      { h: 'U-value in this configurator', c: 'check', b: 'U is estimated for the wall panel only: 1 / (0.17 + thickness / lambda). Steel frame, fold joints, windows and doors add heat loss (thermal bridges), so the real whole-house value is higher. Ask the factory for a tested or calculated U-value.', s: [] },
      { h: 'Glass areas', c: 'verified', b: 'Glazing loses several times more heat than an insulated panel wall. Large curtain walls look great but cost energy; double glazing / low-E glass reduces this. The glass type is not specified in the catalog.', s: [] },
    ],
    heating: [
      { h: 'Graphene / carbon film floor heating (p.25)', c: 'verified', b: 'Electric heating film under laminate/SPC, typically about 200-220 W/m² rated output, controlled by a room thermostat with a floor temperature sensor (the catalog shows wall thermostats). Installers place an insulation layer (e.g. 6-10 mm XPS) under the film. Manufacturers say the film must not be installed under wet-room floors, which matches the configurator: no film in bathrooms.', s: ['filmManual', 'filmWiki'] },
      { h: 'Efficiency claims', c: 'check', b: 'Electric film turns ~100% of electricity into heat (as all resistive heaters do). "Far-infrared comfort" and "saves X% energy" are marketing claims without independent test data in what was found. It is comfortable, quiet and even, but running cost depends on insulation and electricity price; a heat pump air conditioner is usually cheaper to run.', s: ['filmWiki', 'grapheneFloor'] },
      { h: 'Instant water heater 7000 W (p.49)', c: 'verified', b: 'A 7 kW instant heater draws about 30 A at 230 V and normally needs its own 32 A circuit (RCBO / 30 mA RCD) with 6 mm² cable; above about 7.2 kW some rules require 10 mm². The house main supply must be sized for it together with floor heating and A/C.', s: ['shower'] },
      { h: 'Storage water heater and bath heater', c: 'catalog', b: 'Storage heaters (catalog p.49) need less connection power but take space and reheat time; capacity and wattage are not given in the catalog. The bath heater (smart pack, p.76) is a ceiling unit with heat lamps / fan heater; wattage not given.', s: [] },
      { h: 'Main heating and cooling', c: 'check', b: 'The catalog shows A/C sockets on the electrical plan (p.6) but no air-conditioner or heat pump product. Plan for a split A/C (heat pump) for heating + cooling, or confirm what the factory offers.', s: [] },
    ],
    safety: [
      { h: 'Fire classes of the cores', c: 'verified', b: 'Rock wool: core non-combustible A1, sandwich panel A2-s1,d0 (EN 13501-1). PIR panels can reach B-s1,d0, but only as a tested panel system including joints. PU, EPS and graphite EPS are combustible; "B1" on Chinese product sheets refers to the older GB 8624 grading and only applies to flame-retardant grades with a test report.', s: ['rwGuide', 'rwBrochure', 'puEurope', 'gb8624'] },
      { h: 'What to ask for', c: 'check', b: 'A fire classification report for the complete panel (EN 13501-1 or GB 8624-2012), not just a statement about the core. Local building rules decide what is allowed for homes, especially close to boundaries.', s: ['gb8624'] },
    ],
    comfort: [
      { h: 'Sound', c: 'verified', b: 'Rock wool cores damp sound noticeably better than foam cores (EPS/PU/PIR) of the same thickness; manufacturers market it for acoustic performance.', s: ['rwBrochure'] },
      { h: 'Inner height and space', c: 'catalog', b: 'Inner height 2.4 m in all models (catalog p.9). Bathrooms are in the core module so plumbing never crosses a fold joint.', s: [] },
    ],
    durable: [
      { h: 'Floors', c: 'catalog', b: '6 mm SPC with a silicon-carbide (carborundum) wear layer is the most wear-resistant floor option (p.30); 4 mm SPC and fishbone SPC are mid-range; PVC is the standard.', s: [] },
      { h: 'Cladding', c: 'catalog', b: 'Colour steel plate is standard; metal carved panels and WPC (wood-plastic composite) cladding are upgrades (p.15-23). WPC needs no painting; colour fading data is not given.', s: [] },
    ],
    outdoor: [
      { h: 'Ground terrace, roof terrace, outdoor kitchen, pool', c: 'catalog', b: 'Ground decks and roof terraces with railings and canopies (p.67-71), outdoor kitchen Plus 2850 mm / Pro 3850 mm with 80x80 columns and a lift-up canopy (p.77-78), container pools QG-01/02/03 with acrylic window, pump, filter and LEDs (p.79).', s: [] },
    ],
    smart: [
      { h: 'Smart pack (p.76)', c: 'catalog', b: 'Smart lock, smart toilet, smart towel rack and bath heater. Brands, app support and voltage standards are not given in the catalog.', s: [] },
    ],
  };

  const QUESTIONS = [
    ['Wall, roof & floor panels', [
      'Which exact core material and density is used for each option (EPS, graphite EPS, PU, PIR, rock wool), and what is the declared thermal conductivity (lambda) with its test standard?',
      'Which panel thicknesses are available for walls and roof (50 / 75 / 100 mm?) and which is standard?',
      'Please send the fire classification report for the complete sandwich panel (EN 13501-1 or GB 8624-2012). Is the EPS / graphite EPS a flame-retardant (B1) grade?',
      'Do the roof and floor use the same core? Is there insulation under the floor, and how thick?',
      'What are the U-values of wall, roof and floor, and how are thermal bridges at the frame and fold joints insulated?',
      'Please confirm: "graphite core" (p.24) is the wall/roof panel core, and "graphene" (p.25) is the floor heating film - two separate products.',
    ]],
    ['Heating & hot water', [
      'Graphene floor heating: power per m², supply voltage, which rooms are covered (confirm not under the bathroom), thermostat model with floor sensor, insulation layer under the film, and CE/UL certification.',
      'Which flooring is approved on top of the heating film (PVC, SPC 4 mm, SPC 6 mm, fishbone) and the maximum floor temperature?',
      'Is an air conditioner / heat pump offered or prepared (A/C sockets are shown on p.6)?',
      'Instant water heater 7000 W: is the house main breaker and cable sized for it (32 A circuit, 6 mm²), together with floor heating? Single-phase or three-phase supply?',
      'Storage water heater: capacity in litres and power. Bath heater: power.',
    ]],
    ['Electrical & certification', [
      'Main breaker rating, RCD protection and earthing of the house; total connected load.',
      'Certification for the destination country (CE / UKCA / AS/NZS / UL) for the wiring, sockets and appliances.',
      'Solar system: panel kW, inverter, battery size, on-grid or off-grid.',
    ]],
    ['Glass, doors & layout', [
      'Can the glass curtain wall / panorama glass be placed anywhere along the long sides, and what are the structural limits (posts, maximum span)?',
      'Glass type: single or double glazing, tempered, low-E? U-value of the windows and curtain wall?',
      'Which glass doors (double, sliding) can be fitted inside a curtain wall, and in which widths?',
      'Can floor plans be customised beyond the catalog layouts, and how many bathrooms fit in the core module?',
    ]],
    ['Outdoor kitchen & pool', [
      'Can the outdoor kitchen cabinets and worktop use the same PET finishes and quartz as the indoor kitchen? Are they outdoor/UV rated?',
      'Which appliances are included in Party Kitchen Plus / Pro (grill, sink, fridge, range hood, lighting)?',
      'Pool QG-01/02/03: liner thickness, acrylic window thickness, pump and filter flow rate, heating option, winter protection, and delivery as one piece?',
    ]],
    ['General', [
      'Unfolded sizes of the 10, 20 and 30 ft models and the folded transport size.',
      'Price list for every upgrade, lead time, and how many units fit in a 40HQ container.',
    ]],
  ];

  const icon = (name, size) => `<svg viewBox="0 0 24 24" width="${size || 20}" height="${size || 20}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="${ICON[name] || ICON.home}"/></svg>`;

  CHZ.benefits = { evaluate, icon, uValue, uOf, FACTS, SOURCES, QUESTIONS };
})(window.CHZ);
