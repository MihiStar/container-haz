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
    carved: [ // p.15-20, codes D-001 to D-135 grouped by series; colours sampled from the catalogue photos
      { id: 'D-001', name: 'D-001 Ancient wall grey', up: true, grp: 'Seven bricks series', t: { k: 'brick', c: '#9c9fa4', m: '#85878d', rows: 12, cols: 4, metal: 0.25 } },
      { id: 'D-002', name: 'D-002 Light brown sand', up: true, grp: 'Seven bricks series', t: { k: 'brick', c: '#7e6a67', m: '#66514f', rows: 12, cols: 4, metal: 0.25 } },
      { id: 'D-003', name: 'D-003 Desert yellow', up: true, grp: 'Seven bricks series', t: { k: 'brick', c: '#e8cd8b', m: '#d6bb78', rows: 12, cols: 4, metal: 0.25 } },
      { id: 'D-004', name: 'D-004 Knotty pine', up: true, grp: 'Seven bricks series', t: { k: 'brick', c: '#c4613f', m: '#a64829', rows: 12, cols: 4, metal: 0.25 } },
      { id: 'D-005', name: 'D-005 Angel white', up: true, grp: 'Seven bricks series', t: { k: 'brick', c: '#e1dfe2', m: '#cecccf', rows: 12, cols: 4, metal: 0.25 } },
      { id: 'D-006', name: 'D-006 Brick red sand', up: true, grp: 'Seven bricks series', t: { k: 'brick', c: '#b14631', m: '#9d311d', rows: 12, cols: 4, metal: 0.25 } },
      { id: 'D-007', name: 'D-007 Light grey', up: true, grp: 'Seven bricks series', t: { k: 'brick', c: '#afafb0', m: '#8e8d8f', rows: 12, cols: 4, metal: 0.25 } },
      { id: 'D-008', name: 'D-008 Lilac beige', up: true, grp: 'Seven bricks series', t: { k: 'brick', c: '#c8bab0', m: '#a4978d', rows: 12, cols: 4, metal: 0.25 } },
      { id: 'D-009', name: 'D-009 Ivory white', up: true, grp: 'Seven bricks series', t: { k: 'brick', c: '#c9c7c3', m: '#a2a19d', rows: 12, cols: 4, metal: 0.25 } },
      { id: 'D-010', name: 'D-010 Signal blue', up: true, grp: 'Seven bricks series', t: { k: 'brick', c: '#5a5f9c', m: '#434781', rows: 12, cols: 4, metal: 0.25 } },
      { id: 'D-011', name: 'D-011 Sesame marble', up: true, grp: 'Seven bricks series', t: { k: 'brick', c: '#b7b6b9', m: '#706e71', rows: 12, cols: 4, metal: 0.25 } },
      { id: 'D-012', name: 'D-012 Cream', up: true, grp: 'Seven bricks series', t: { k: 'brick', c: '#e7dea5', m: '#ccc38a', rows: 12, cols: 4, metal: 0.25 } },
      { id: 'D-013', name: 'D-013 Ancient wall grey', up: true, grp: 'Three-brick series', t: { k: 'brick', c: '#707175', m: '#5c5d62', rows: 6, cols: 2, metal: 0.25 } },
      { id: 'D-014', name: 'D-014 Light brown sand', up: true, grp: 'Three-brick series', t: { k: 'brick', c: '#726060', m: '#5f4c4c', rows: 6, cols: 2, metal: 0.25 } },
      { id: 'D-015', name: 'D-015 Desert yellow', up: true, grp: 'Three-brick series', t: { k: 'brick', c: '#d8c693', m: '#beab77', rows: 6, cols: 2, metal: 0.25 } },
      { id: 'D-016', name: 'D-016 Angel white', up: true, grp: 'Three-brick series', t: { k: 'brick', c: '#d7d7d9', m: '#c2c2c4', rows: 6, cols: 2, metal: 0.25 } },
      { id: 'D-017', name: 'D-017 Lilac beige sand', up: true, grp: 'Three-brick series', t: { k: 'brick', c: '#beaea1', m: '#a29285', rows: 6, cols: 2, metal: 0.25 } },
      { id: 'D-018', name: 'D-018 Ivory white', up: true, grp: 'Three-brick series', t: { k: 'brick', c: '#d9d6cb', m: '#c2bfb3', rows: 6, cols: 2, metal: 0.25 } },
      { id: 'D-019', name: 'D-019 Golden granite', up: true, grp: 'Three-brick series', t: { k: 'brick', c: '#a09384', m: '#837566', rows: 6, cols: 2, metal: 0.25 } },
      { id: 'D-020', name: 'D-020 Cream sand', up: true, grp: 'Three-brick series', t: { k: 'brick', c: '#dbcca8', m: '#c3b38f', rows: 6, cols: 2, metal: 0.25 } },
      { id: 'D-021', name: 'D-021 Brick red sand', up: true, grp: 'Three-brick series', t: { k: 'brick', c: '#a94b37', m: '#973825', rows: 6, cols: 2, metal: 0.25 } },
      { id: 'D-022', name: 'D-022 Multicolour brick', up: true, grp: 'Three-brick series', t: { k: 'brick', c: '#985c57', m: '#7a4742', rows: 12, cols: 3, metal: 0.25 } },
      { id: 'D-023', name: 'D-023 Antique blue brick', up: true, grp: 'Three-brick series', t: { k: 'brick', c: '#50616c', m: '#a9b5bd', rows: 12, cols: 3, metal: 0.25 } },
      { id: 'D-024', name: 'D-024 Red brick, grey joints', up: true, grp: 'Three-brick series', t: { k: 'brick', c: '#a3312a', m: '#bca7a5', rows: 12, cols: 3, metal: 0.25 } },
      { id: 'D-025', name: 'D-025 Ivory white', up: true, grp: 'Three-brick series', t: { k: 'speck', c: '#d9d8d5', cs: ['#cececa', '#e1e1de'], n: 0.34, metal: 0.25 } },
      { id: 'D-026', name: 'D-026 Angel white', up: true, grp: 'Three-brick series', t: { k: 'speck', c: '#f3f4f6', cs: ['#e5e5e7', '#f9fafb'], n: 0.37, metal: 0.25 } },
      { id: 'D-027', name: 'D-027 Orange', up: true, grp: 'Three-brick series', t: { k: 'speck', c: '#d35c21', cs: ['#ce571d', '#da6225'], n: 0.25, metal: 0.25 } },
      { id: 'D-028', name: 'D-028 Lilac beige sand', up: true, grp: 'Three-brick series', t: { k: 'speck', c: '#c9b8a8', cs: ['#c2b2a2', '#cfbeae'], n: 0.25, metal: 0.25 } },
      { id: 'D-029', name: 'D-029 Cream sand', up: true, grp: 'Three-brick series', t: { k: 'speck', c: '#decf97', cs: ['#d7c78f', '#e4d59e'], n: 0.25, metal: 0.25 } },
      { id: 'D-030', name: 'D-030 Black sand', up: true, grp: 'Three-brick series', t: { k: 'speck', c: '#404447', cs: ['#34383b', '#4f5257'], n: 0.48, metal: 0.25 } },
      { id: 'D-031', name: 'D-031 Sparkle silver', up: true, grp: 'Textured flat panel series', t: { k: 'speck', c: '#bbbbba', cs: ['#9f9e9c', '#dadadb'], n: 1.07, metal: 0.25 } },
      { id: 'D-032', name: 'D-032 Light brown sand', up: true, grp: 'Textured flat panel series', t: { k: 'speck', c: '#846d67', cs: ['#7d6660', '#8b746e'], n: 0.25, metal: 0.25 } },
      { id: 'D-033', name: 'D-033 Sesame marble', up: true, grp: 'Textured flat panel series', t: { k: 'speck', c: '#b6b5ba', cs: ['#727276', '#dddce1'], n: 1.6, metal: 0.25 } },
      { id: 'D-034', name: 'D-034 Speckled marble', up: true, grp: 'Textured flat panel series', t: { k: 'speck', c: '#bfc0bb', cs: ['#91928e', '#d7d8d4'], n: 1.28, metal: 0.25 } },
      { id: 'D-035', name: 'D-035 Terrazzo', up: true, grp: 'Textured flat panel series', t: { k: 'speck', c: '#b3b0ad', cs: ['#74716e', '#cfcdca'], n: 1.6, metal: 0.25 } },
      { id: 'D-036', name: 'D-036 Sesame dot, double line', up: true, grp: 'Textured flat panel series', t: { k: 'speck', c: '#d5d5da', cs: ['#898a8e', '#e6e6eb'], n: 1.6, metal: 0.25 } },
      { id: 'D-037', name: 'D-037 Wenge', up: true, grp: 'Textured flat panel series', t: { k: 'wood', c: '#975331', g: '#8c4927', h: 1, metal: 0.25 } },
      { id: 'D-038', name: 'D-038 Yellow terrazzo', up: true, grp: 'Textured flat panel series', t: { k: 'speck', c: '#aea794', cs: ['#918975', '#c9c2b1'], n: 1.03, metal: 0.25 } },
      { id: 'D-039', name: 'D-039 Golden granite', up: true, grp: 'Textured flat panel series', t: { k: 'speck', c: '#a2968e', cs: ['#867b72', '#b8ada4'], n: 0.89, metal: 0.25 } },
      { id: 'D-040', name: 'D-040 Ancient wall grey', up: true, grp: 'Textured flat panel series', t: { k: 'speck', c: '#767880', cs: ['#6c6c71', '#868a96'], n: 0.53, metal: 0.25 } },
      { id: 'D-041', name: 'D-041 Cherry blossom marble', up: true, grp: 'Textured flat panel series', t: { k: 'speck', c: '#b8a18c', cs: ['#9e8773', '#ccb49f'], n: 0.81, metal: 0.25 } },
      { id: 'D-042', name: 'D-042 Cultured stone', up: true, grp: 'Textured flat panel series', t: { k: 'stone', c: '#766f6a', metal: 0.25 } },
      { id: 'D-043', name: 'D-043 Light grey', up: true, grp: 'Textured flat panel series', t: { k: 'speck', c: '#a1a1a3', cs: ['#959597', '#aeaeb0'], n: 0.44, metal: 0.25 } },
      { id: 'D-044', name: 'D-044 Speckle grid', up: true, grp: 'Textured flat panel series', t: { k: 'speck', c: '#cacbcf', cs: ['#78787c', '#e3e3e8'], n: 1.6, metal: 0.25 } },
      { id: 'D-045', name: 'D-045 Anxi red', up: true, grp: 'Textured flat panel series', t: { k: 'speck', c: '#9a5d50', cs: ['#703a2e', '#c1897c'], n: 1.41, metal: 0.25 } },
      { id: 'D-046', name: 'D-046 Signal blue', up: true, grp: 'Textured flat panel series', t: { k: 'speck', c: '#4c4f85', cs: ['#44477d', '#56598f'], n: 0.33, metal: 0.25 } },
      { id: 'D-047', name: 'D-047 Grey brick, white joints', up: true, grp: 'Textured flat panel series', t: { k: 'brick', c: '#434441', m: '#d1d3cf', rows: 12, cols: 3, metal: 0.25 } },
      { id: 'D-048', name: 'D-048 Sesame dot', up: true, grp: 'Textured flat panel series', t: { k: 'speck', c: '#afb1b3', cs: ['#97999b', '#bdbfc2'], n: 0.7, metal: 0.25 } },
      { id: 'D-049', name: 'D-049 Angel white', up: true, grp: 'Tapered coating, slanted groove series', t: { k: 'speck', c: '#e1e1e3', cs: ['#c8c8c9', '#f3f3f5'], n: 0.77, gr: 2, metal: 0.25 } },
      { id: 'D-050', name: 'D-050 Knotty pine', up: true, grp: 'Tapered coating, slanted groove series', t: { k: 'wood', c: '#b75633', g: '#a04324', h: 1, gr: 2, metal: 0.25 } },
      { id: 'D-051', name: 'D-051 Light grey', up: true, grp: 'Tapered coating, slanted groove series', t: { k: 'speck', c: '#929293', cs: ['#7d7d7f', '#a8a8aa'], n: 0.79, gr: 2, metal: 0.25 } },
      { id: 'D-052', name: 'D-052 Ancient wall grey', up: true, grp: 'Tapered coating, slanted groove series', t: { k: 'speck', c: '#6a6d71', cs: ['#5b5c61', '#7f8186'], n: 0.68, gr: 2, metal: 0.25 } },
      { id: 'D-053', name: 'D-053 Orange', up: true, grp: 'Tapered coating, slanted groove series', t: { k: 'speck', c: '#d45b1f', cs: ['#c7501b', '#e06a2d'], n: 0.49, gr: 2, metal: 0.25 } },
      { id: 'D-054', name: 'D-054 Angel white', up: true, grp: 'Splash-coated straight groove series', t: { k: 'speck', c: '#dedddd', cs: ['#c0bfbf', '#ededed'], n: 0.94, gr: 2, metal: 0.25 } },
      { id: 'D-055', name: 'D-055 Ivory white', up: true, grp: 'Splash-coated straight groove series', t: { k: 'speck', c: '#d8d7d2', cs: ['#bbb9b3', '#eae9e5'], n: 0.93, gr: 2, metal: 0.25 } },
      { id: 'D-056', name: 'D-056 Desert yellow', up: true, grp: 'Splash-coated straight groove series', t: { k: 'speck', c: '#b6a779', cs: ['#9e8f62', '#c6b88a'], n: 0.81, gr: 2, metal: 0.25 } },
      { id: 'D-057', name: 'D-057 Brick red', up: true, grp: 'Splash-coated straight groove series', t: { k: 'speck', c: '#8a2b22', cs: ['#7f221c', '#933429'], n: 0.32, gr: 2, metal: 0.25 } },
      { id: 'D-058', name: 'D-058 Light brown sand', up: true, grp: 'Splash-coated straight groove series', t: { k: 'speck', c: '#786666', cs: ['#665353', '#887777'], n: 0.73, gr: 2, metal: 0.25 } },
      { id: 'D-059', name: 'D-059 Cream', up: true, grp: 'Splash-coated straight groove series', t: { k: 'speck', c: '#c2b87a', cs: ['#b0a464', '#d3c98b'], n: 0.73, gr: 2, metal: 0.25 } },
      { id: 'D-060', name: 'D-060 Ancient wall grey', up: true, grp: 'Splash-coated straight groove series', t: { k: 'speck', c: '#84878f', cs: ['#717379', '#9598a0'], n: 0.74, gr: 2, metal: 0.25 } },
      { id: 'D-061', name: 'D-061 Angel white', up: true, grp: 'Wood grain flat panel series', t: { k: 'wood', c: '#e2e1e1', g: '#d1cfcf', h: 1, metal: 0.25 } },
      { id: 'D-062', name: 'D-062 Ivory white', up: true, grp: 'Wood grain flat panel series', t: { k: 'wood', c: '#c5c3be', g: '#aaa9a4', h: 1, metal: 0.25 } },
      { id: 'D-063', name: 'D-063 Wenge', up: true, grp: 'Wood grain flat panel series', t: { k: 'wood', c: '#995a39', g: '#864727', h: 1, metal: 0.25 } },
      { id: 'D-064', name: 'D-064 Black wenge', up: true, grp: 'Wood grain flat panel series', t: { k: 'wood', c: '#705345', g: '#52382d', h: 1, metal: 0.25 } },
      { id: 'D-065', name: 'D-065 Ancient wall grey', up: true, grp: 'Wood grain flat panel series', t: { k: 'wood', c: '#727579', g: '#64676b', h: 1, metal: 0.25 } },
      { id: 'D-066', name: 'D-066 Angel white', up: true, grp: 'Wood grain double straight groove series', t: { k: 'wood', c: '#ececea', g: '#c9c8c3', h: 1, gr: 3, metal: 0.25 } },
      { id: 'D-067', name: 'D-067 Wenge', up: true, grp: 'Wood grain double straight groove series', t: { k: 'wood', c: '#93512e', g: '#72381a', h: 1, gr: 3, metal: 0.25 } },
      { id: 'D-068', name: 'D-068 Brick red sand', up: true, grp: 'Wood grain double straight groove series', t: { k: 'wood', c: '#ab2b24', g: '#961f1d', h: 1, gr: 3, metal: 0.25 } },
      { id: 'D-069', name: 'D-069 Angel white', up: true, grp: 'Wood grain diagonal groove series', t: { k: 'wood', c: '#dfdfdf', g: '#c6c5c5', h: 1, gr: 2, metal: 0.25 } },
      { id: 'D-070', name: 'D-070 Ivory white', up: true, grp: 'Wood grain diagonal groove series', t: { k: 'wood', c: '#bebdb9', g: '#999994', h: 1, gr: 2, metal: 0.25 } },
      { id: 'D-071', name: 'D-071 Knotty pine', up: true, grp: 'Wood grain diagonal groove series', t: { k: 'wood', c: '#c26139', g: '#ae4e29', h: 1, gr: 2, metal: 0.25 } },
      { id: 'D-072', name: 'D-072 Light brown sand', up: true, grp: 'Wood grain diagonal groove series', t: { k: 'wood', c: '#7b6862', g: '#6b5852', h: 1, gr: 2, metal: 0.25 } },
      { id: 'D-073', name: 'D-073 Light grey', up: true, grp: 'Wood grain diagonal groove series', t: { k: 'wood', c: '#aaaaac', g: '#8d8d8f', h: 1, gr: 2, metal: 0.25 } },
      { id: 'D-074', name: 'D-074 Signal blue', up: true, grp: 'Wood grain diagonal groove series', t: { k: 'wood', c: '#434678', g: '#333665', h: 1, gr: 2, metal: 0.25 } },
      { id: 'D-075', name: 'D-075 Wenge', up: true, grp: 'Wood grain diagonal groove series', t: { k: 'wood', c: '#945732', g: '#7c401f', h: 1, gr: 2, metal: 0.25 } },
      { id: 'D-076', name: 'D-076 Yellow wenge', up: true, grp: 'Wood grain diagonal groove series', t: { k: 'wood', c: '#82603e', g: '#6a4a2b', h: 1, gr: 2, metal: 0.25 } },
      { id: 'D-077', name: 'D-077 Black wenge', up: true, grp: 'Wood grain diagonal groove series', t: { k: 'wood', c: '#714f3c', g: '#553523', h: 1, gr: 2, metal: 0.25 } },
      { id: 'D-078', name: 'D-078 Ancient wall grey', up: true, grp: 'Wood grain diagonal groove series', t: { k: 'wood', c: '#74777b', g: '#64666a', h: 1, gr: 2, metal: 0.25 } },
      { id: 'D-079', name: 'D-079 Burl wood', up: true, grp: 'Wood grain diagonal groove series', t: { k: 'wood', c: '#946c52', g: '#7a543c', h: 1, gr: 2, metal: 0.25 } },
      { id: 'D-080', name: 'D-080 Mountain pine', up: true, grp: 'Wood grain diagonal groove series', t: { k: 'wood', c: '#ad975a', g: '#9a8144', h: 1, gr: 2, metal: 0.25 } },
      { id: 'D-081', name: 'D-081 Lilac beige', up: true, grp: 'Wood grain straight groove series', t: { k: 'wood', c: '#c7bdb7', g: '#ab9f98', h: 1, gr: 2, metal: 0.25 } },
      { id: 'D-082', name: 'D-082 Knotty pine', up: true, grp: 'Wood grain straight groove series', t: { k: 'wood', c: '#ab5435', g: '#8e3a22', h: 1, gr: 2, metal: 0.25 } },
      { id: 'D-083', name: 'D-083 Signal blue', up: true, grp: 'Wood grain straight groove series', t: { k: 'wood', c: '#4c5185', g: '#393d6d', h: 1, gr: 2, metal: 0.25 } },
      { id: 'D-084', name: 'D-084 Yellow wenge', up: true, grp: 'Wood grain straight groove series', t: { k: 'wood', c: '#745d44', g: '#57422d', h: 1, gr: 2, metal: 0.25 } },
      { id: 'D-085', name: 'D-085 7006 grey', up: true, grp: 'Wood grain straight groove series', t: { k: 'wood', c: '#83796f', g: '#6d635a', h: 1, gr: 2, metal: 0.25 } },
      { id: 'D-086', name: 'D-086 Angel white', up: true, grp: 'Tablet series', t: { k: 'solid', c: '#eae8e9', metal: 0.25 } },
      { id: 'D-087', name: 'D-087 Ivory white', up: true, grp: 'Tablet series', t: { k: 'solid', c: '#dad8d4', metal: 0.25 } },
      { id: 'D-088', name: 'D-088 Jazz white', up: true, grp: 'Tablet series', t: { k: 'marble', c: '#e3e6ee', v: '#c1c3c5', metal: 0.25 } },
      { id: 'D-089', name: 'D-089 Gloss white', up: true, grp: 'Tablet series', t: { k: 'solid', c: '#e0e1e2', metal: 0.25 } },
      { id: 'D-090', name: 'D-090 Ancient wall grey', up: true, grp: 'Tablet series', t: { k: 'solid', c: '#7a7d82', metal: 0.25 } },
      { id: 'D-091', name: 'D-091 Vietnam wood', up: true, grp: 'Tablet series', t: { k: 'wood', c: '#bab6b1', g: '#b0aaa4', h: 1, metal: 0.25 } },
      { id: 'D-092', name: 'D-092 Brick red', up: true, grp: 'Tablet series', t: { k: 'solid', c: '#ad402a', metal: 0.25 } },
      { id: 'D-093', name: 'D-093 Mono cultured stone', up: true, grp: 'Tablet series', t: { k: 'stone', c: '#828078', metal: 0.25 } },
      { id: 'D-094', name: 'D-094 Desert yellow', up: true, grp: 'Tablet series', t: { k: 'solid', c: '#a5976a', metal: 0.25 } },
      { id: 'D-095', name: 'D-095 Light brown sand', up: true, grp: 'Tablet series', t: { k: 'solid', c: '#533f40', metal: 0.25 } },
      { id: 'D-096', name: 'D-096 Black sand', up: true, grp: 'Tablet series', t: { k: 'solid', c: '#3e3e3f', metal: 0.25 } },
      { id: 'D-097', name: 'D-097 Burl wood', up: true, grp: 'Tablet series', t: { k: 'wood', c: '#9d6f4f', g: '#8e6142', h: 1, metal: 0.25 } },
      { id: 'D-098', name: 'D-098 Mountain pine', up: true, grp: 'Tablet series', t: { k: 'wood', c: '#b6a266', g: '#a99151', h: 1, metal: 0.25 } },
      { id: 'D-099', name: 'D-099 Hetian jade', up: true, grp: 'Tablet series', t: { k: 'marble', c: '#e9f3f2', v: '#d1d6cf', metal: 0.25 } },
      { id: 'D-100', name: 'D-100 Zebra grain', up: true, grp: 'Tablet series', t: { k: 'wood', c: '#c17853', g: '#a15938', h: 1, metal: 0.25 } },
      { id: 'D-101', name: 'D-101 Angel white', up: true, grp: 'Flat plate straight groove series', t: { k: 'solid', c: '#dfe7e7', gr: 2, metal: 0.25 } },
      { id: 'D-102', name: 'D-102 Burl wood', up: true, grp: 'Flat plate straight groove series', t: { k: 'wood', c: '#c48e5a', g: '#976339', h: 1, gr: 2, metal: 0.25 } },
      { id: 'D-103', name: 'D-103 Dragon walnut', up: true, grp: 'Flat plate straight groove series', t: { k: 'wood', c: '#5e4036', g: '#452c24', h: 1, gr: 2, metal: 0.25 } },
      { id: 'D-104', name: 'D-104 Desert yellow', up: true, grp: 'Flat plate straight groove series', t: { k: 'solid', c: '#b7aa6c', gr: 2, metal: 0.25 } },
      { id: 'D-105', name: 'D-105 Wenge', up: true, grp: 'Flat plate oblique groove series', t: { k: 'wood', c: '#814b2a', g: '#653419', h: 1, gr: 2, metal: 0.25 } },
      { id: 'D-106', name: 'D-106 Burl wood', up: true, grp: 'Flat plate oblique groove series', t: { k: 'wood', c: '#a37f5e', g: '#7d5d42', h: 1, gr: 2, metal: 0.25 } },
      { id: 'D-107', name: 'D-107 Gloss white', up: true, grp: 'Flat plate oblique groove series', t: { k: 'solid', c: '#c3c5c2', gr: 2, metal: 0.25 } },
      { id: 'D-108', name: 'D-108 Knotty pine', up: true, grp: 'Flat plate double-sloping groove series', t: { k: 'wood', c: '#b2512d', g: '#9c4123', h: 1, gr: 3, metal: 0.25 } },
      { id: 'D-109', name: 'D-109 Dragon walnut', up: true, grp: 'Flat plate double-sloping groove series', t: { k: 'wood', c: '#6e3c2f', g: '#5a271d', h: 1, gr: 3, metal: 0.25 } },
      { id: 'D-110', name: 'D-110 Burl wood', up: true, grp: 'Flat plate double-sloping groove series', t: { k: 'wood', c: '#9e775b', g: '#826048', h: 1, gr: 3, metal: 0.25 } },
      { id: 'D-111', name: 'D-111 Black sand', up: true, grp: 'Flat plate double straight groove series', t: { k: 'solid', c: '#343436', gr: 3, metal: 0.25 } },
      { id: 'D-112', name: 'D-112 Burl wood', up: true, grp: 'Flat plate double straight groove series', t: { k: 'wood', c: '#92674b', g: '#6c4731', h: 1, gr: 3, metal: 0.25 } },
      { id: 'D-113', name: 'D-113 Mountain pine', up: true, grp: 'Flat plate double straight groove series', t: { k: 'wood', c: '#ab9356', g: '#8a723a', h: 1, gr: 3, metal: 0.25 } },
      { id: 'D-114', name: 'D-114 Ivory white', up: true, grp: 'Feldspar series', t: { k: 'stone', c: '#cbcac6', metal: 0.25 } },
      { id: 'D-115', name: 'D-115 Angel white', up: true, grp: 'Feldspar series', t: { k: 'stone', c: '#e8e8e8', metal: 0.25 } },
      { id: 'D-116', name: 'D-116 Lilac beige', up: true, grp: 'Feldspar series', t: { k: 'stone', c: '#bbb1a9', metal: 0.25 } },
      { id: 'D-117', name: 'D-117 Light brown sand', up: true, grp: 'Feldspar series', t: { k: 'stone', c: '#766364', metal: 0.25 } },
      { id: 'D-118', name: 'D-118 Black sand', up: true, grp: 'Feldspar series', t: { k: 'stone', c: '#39393a', metal: 0.25 } },
      { id: 'D-119', name: 'D-119 Ancient wall grey', up: true, grp: 'Feldspar series', t: { k: 'stone', c: '#707275', metal: 0.25 } },
      { id: 'D-120', name: 'D-120 Sesame dot', up: true, grp: 'Great Wall board series', t: { k: 'speck', c: '#c8cace', cs: ['#838586', '#e8e9eb'], n: 1.6, gr: 8, metal: 0.25 } },
      { id: 'D-121', name: 'D-121 Grass green', up: true, grp: 'Great Wall board series', t: { k: 'solid', c: '#7ac197', gr: 8, metal: 0.25 } },
      { id: 'D-122', name: 'D-122 Light grey', up: true, grp: 'Great Wall board series', t: { k: 'solid', c: '#939396', gr: 8, metal: 0.25 } },
      { id: 'D-123', name: 'D-123 Knotty pine', up: true, grp: 'Great Wall board series', t: { k: 'wood', c: '#8f4024', g: '#7c2e18', h: 1, gr: 8, metal: 0.25 } },
      { id: 'D-124', name: 'D-124 Light brown sand', up: true, grp: 'Great Wall board series', t: { k: 'solid', c: '#715d56', gr: 8, metal: 0.25 } },
      { id: 'D-125', name: 'D-125 Dragon walnut', up: true, grp: 'Great Wall board series', t: { k: 'wood', c: '#6d493e', g: '#472b21', h: 1, gr: 8, metal: 0.25 } },
      { id: 'D-126', name: 'D-126 Signal blue', up: true, grp: 'Great Wall board series', t: { k: 'solid', c: '#464a7f', gr: 8, metal: 0.25 } },
      { id: 'D-127', name: 'D-127 Wenge', up: true, grp: 'Great Wall board series', t: { k: 'wood', c: '#9a5531', g: '#703419', h: 1, gr: 8, metal: 0.25 } },
      { id: 'D-128', name: 'D-128 Yellow wenge', up: true, grp: 'Great Wall board series', t: { k: 'wood', c: '#7a6247', g: '#543f28', h: 1, gr: 8, metal: 0.25 } },
      { id: 'D-129', name: 'D-129 Black sand', up: true, grp: 'Great Wall board series', t: { k: 'solid', c: '#3a393c', gr: 8, metal: 0.25 } },
      { id: 'D-130', name: 'D-130 Ancient wall grey', up: true, grp: 'Great Wall board series', t: { k: 'solid', c: '#606065', gr: 8, metal: 0.25 } },
      { id: 'D-131', name: 'D-131 Sparkle silver', up: true, grp: 'Water ripple series', t: { k: 'solid', c: '#b2b3b6', gr: 14, metal: 0.25 } },
      { id: 'D-132', name: 'D-132 Orange', up: true, grp: 'Water ripple series', t: { k: 'solid', c: '#ca4f1a', gr: 14, metal: 0.25 } },
      { id: 'D-133', name: 'D-133 Black sand', up: true, grp: 'Oak grain series', t: { k: 'wood', c: '#474749', g: '#272728', h: 1, gr: 2, metal: 0.25 } },
      { id: 'D-134', name: 'D-134 Ancient wall grey', up: true, grp: 'Oak grain series', t: { k: 'wood', c: '#717276', g: '#55575a', h: 1, gr: 2, metal: 0.25 } },
      { id: 'D-135', name: 'D-135 Light grey', up: true, grp: 'Oak grain series', t: { k: 'wood', c: '#94958f', g: '#7c7d77', h: 1, gr: 2, metal: 0.25 } },
    ],
    wpcEmb: [ // p.22
      { id: 'we-ebony', name: 'Ebony', up: true, t: { k: 'flute', c: '#3c3c3c' } },
      { id: 'we-walnut', name: 'Walnut', up: true, t: { k: 'flute', c: '#5b5a53' } },
      { id: 'we-redsandal', name: 'Red sandalwood', up: true, t: { k: 'flute', c: '#807061' } },
      { id: 'we-rosewood', name: 'Rosewood', up: true, t: { k: 'flute', c: '#78604f' } },
      { id: 'we-ash', name: 'Cigarette ash', up: true, t: { k: 'flute', c: '#728387' } },
      { id: 'we-ancient', name: 'Ancient tree', up: true, t: { k: 'flute', c: '#929587' } },
      { id: 'we-offwhite', name: 'Off-white', up: true, t: { k: 'flute', c: '#b0b1a1' } },
      { id: 'we-orangered', name: 'Orange-red', up: true, t: { k: 'flute', c: '#9b5738' } },
      { id: 'we-camphor', name: 'Camphor tree', up: true, t: { k: 'flute', c: '#9e805d' } },
      { id: 'we-teak', name: 'Teak', up: true, t: { k: 'flute', c: '#9b7e54' } },
      { id: 'we-pomelo', name: 'Pure pomelo', up: true, t: { k: 'flute', c: '#b28a4d' } },
      { id: 'we-oak', name: 'Oak', up: true, t: { k: 'flute', c: '#bba973' } },
      { id: 'we-maple', name: 'Maple', up: true, t: { k: 'flute', c: '#bfab88' } },
      { id: 'we-white', name: 'Pure white', up: true, t: { k: 'flute', c: '#ebf4eb' } },
    ],
    wpcFlat: [ // p.23
      { id: 'wf-orange', name: 'Sweet orange', up: true, t: { k: 'boards', c: '#b57541', g: '#aa6b37' } },
      { id: 'wf-coffee', name: 'Coffee', up: true, t: { k: 'boards', c: '#966951', g: '#8b5e47' } },
      { id: 'wf-black', name: 'Black', up: true, t: { k: 'boards', c: '#3c4043', g: '#2e3537' } },
      { id: 'wf-teak', name: 'Teak', up: true, t: { k: 'boards', c: '#e1b272', g: '#daab6b' } },
      { id: 'wf-grey', name: 'Grey', up: true, t: { k: 'boards', c: '#918e87', g: '#807f79' } },
      { id: 'wf-rosewood', name: 'Rosewood', up: true, t: { k: 'boards', c: '#da8a75', g: '#d2826c' } },
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
  const TERRACE_FLOOR = [ // p.68 round-hole WPC is the standard terrace board, p.69 3D-embossed board is the upgrade
    { id: 'std', name: 'Anti-slip board', up: false, t: { k: 'checker', c: '#8d9094' } },
    { id: 'wpc', name: 'WPC decking', sub: 'round-hole, p.68', up: true, t: { k: 'planks', c: '#8a5a38', tile: 2.4, dir: 'x', pbr: 'deck' } },
    { id: 'wpc3d', name: '3D embossed WPC', sub: '140x25, p.69', up: true, t: { k: 'planks', c: '#8a5a38', tile: 2.4, dir: 'x', pbr: 'deck' } },
  ];
  const DECK_COLOR = [ // p.68-69: rosewood, red sandalwood, teak, coffee
    { id: 'tw-rosewood', name: 'Rosewood', c: '#b88065' },
    { id: 'tw-redsandal', name: 'Red sandalwood', c: '#6a5448' },
    { id: 'tw-teak', name: 'Teak', c: '#b39664' },
    { id: 'tw-coffee', name: 'Coffee', c: '#564e48' },
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
    { id: 'sd-grey', name: 'Grey', c: '#5d636c' },     // p.35 most doors: grey steel
    { id: 'sd-white', name: 'White', c: '#eaebe7' },  // p.35
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
    { id: 'rd-walnut', name: 'Walnut', t: { k: 'wood', c: '#846a5e', g: '#5a443a' } },
    { id: 'rd-oak', name: 'Greige oak', t: { k: 'wood', c: '#af9f97', g: '#857469' } },
    { id: 'rd-white', name: 'White', c: '#f4f4f1' },
    { id: 'rd-black', name: 'Black', c: '#383838' },
  ];

  // ---------- Interior walls (p.14, 26-28) ----------
  const INT_WALL_TYPES = [
    { id: 'carbon', name: 'Carbon crystal panel', up: false },
    { id: 'bamboo', name: 'Bamboo fiber board', up: true },
  ];
  const INT_WALL = { // p.26-27 colour codes (shared by carbon crystal panel and bamboo fibre board)
    carbon: [
      { id: 'match', name: 'Match exterior colour' },
      { id: 'iw-FG6006-2', name: 'FG6006-2 Milk coffee', t: { k: 'solid', c: '#ddd3c7' } },
      { id: 'iw-G002-2', name: 'G002-2 Milk white', t: { k: 'solid', c: '#fffdf1' } },
      { id: 'iw-H-XMT007-A229', name: 'H-XMT007-A229 Starry khaki', t: { k: 'speck', c: '#c2ae9f', cs: ['#bda99a', '#c7b3a3'], n: 0.6 } },
      { id: 'iw-H-XMT022-A229', name: 'H-XMT022-A229 Starry latte', t: { k: 'speck', c: '#d8d1c4', cs: ['#d4ccc0', '#dcd5c8'], n: 0.6 } },
      { id: 'iw-C1033-2', name: 'C1033-2 Cream', t: { k: 'solid', c: '#e7e1cb' } },
      { id: 'iw-G003-A216', name: 'G003-A216 Frosted ivory', t: { k: 'fabric', c: '#e6e6da' } },
      { id: 'iw-11-A197', name: '11-A197 Silk fabric', t: { k: 'fabric', c: '#e9e9e7' } },
      { id: 'iw-Z106-001', name: 'Z106-001 Cross weave cream', t: { k: 'fabric', c: '#eae9e7' } },
      { id: 'iw-Z213-001', name: 'Z213-001 Night star cream', t: { k: 'fabric', c: '#e8e7e5' } },
      { id: 'iw-S3012-A191', name: 'S3012-A191 Milk coffee', t: { k: 'fabric', c: '#d9cab9' } },
      { id: 'iw-S3016-A191', name: 'S3016-A191 Phantom grey', t: { k: 'fabric', c: '#b6b2ad' } },
      { id: 'iw-S3011-A192', name: 'S3011-A192 Cream', t: { k: 'fabric', c: '#e6ddd2' } },
      { id: 'iw-S3015-A192', name: 'S3015-A192 Pale blue', t: { k: 'fabric', c: '#b8b9b4' } },
      { id: 'iw-S3016-A192', name: 'S3016-A192 Phantom grey', t: { k: 'fabric', c: '#b4b0ad' } },
      { id: 'iw-S3022-A205', name: 'S3022-A205 Light linen', t: { k: 'fabric', c: '#e2d8d0' } },
      { id: 'iw-596-A125', name: '596-A125 New element fabric', t: { k: 'fabric', c: '#e2dbcb' } },
      { id: 'iw-785-A125', name: '785-A125 Still water', t: { k: 'fabric', c: '#d5d1cb' } },
      { id: 'iw-789-A155', name: '789-A155 Aishang fabric', t: { k: 'fabric', c: '#e9e3cf' } },
      { id: 'iw-D9102-2', name: 'D9102-2 Jazz white matte', t: { k: 'marble', c: '#eee8f6', v: '#e9e4f1' } },
      { id: 'iw-F8-A262', name: 'F8-A262 Dream Paris', t: { k: 'solid', c: '#e2e3e6' } },
      { id: 'iw-11-1', name: '11-1 Frosted cream', t: { k: 'fabric', c: '#e8e7e4' } },
      { id: 'iw-607-A206', name: '607-A206 Vera check taupe', t: { k: 'fabric', c: '#887f6e' } },
      { id: 'iw-C1011-A158', name: 'C1011-A158 Diatom pale teal', t: { k: 'fabric', c: '#799893' } },
      { id: 'iw-609-A206', name: '609-A206 Vera check navy', t: { k: 'fabric', c: '#333a42' } },
      { id: 'iw-697-A211', name: '697-A211 Drizzle cream', t: { k: 'solid', c: '#eee9ca' } },
      { id: 'iw-Z211-003', name: 'Z211-003 Drizzle beige', t: { k: 'solid', c: '#b2aea2' } },
      { id: 'iw-Z106-002', name: 'Z106-002 Cross weave grey', t: { k: 'fabric', c: '#abacae' } },
      { id: 'iw-1-A155', name: '1-A155 Soft white', t: { k: 'fabric', c: '#e8e2e9' } },
      { id: 'iw-7-A106', name: '7-A106 Off-white fabric', t: { k: 'fabric', c: '#ededeb' } },
      { id: 'iw-K7143-A189', name: 'K7143-A189 Pear wood', t: { k: 'wood', c: '#e4d9bc', g: '#e1d6b8' } },
      { id: 'iw-K7066-A189', name: 'K7066-A189 Light pear wood', t: { k: 'wood', c: '#c9b8a1', g: '#c0b098' } },
      { id: 'iw-K7073-A189', name: 'K7073-A189 Rosewood', t: { k: 'wood', c: '#775232', g: '#6e4a2d' } },
      { id: 'iw-663-A125', name: '663-A125 Element fabric', t: { k: 'fabric', c: '#d7d2d6' } },
      { id: 'iw-388-A155', name: '388-A155 Morandi', t: { k: 'fabric', c: '#c4bdab' } },
      { id: 'iw-389-A155', name: '389-A155 Morandi grey', t: { k: 'fabric', c: '#aaa7a0' } },
      { id: 'iw-195-A125', name: '195-A125 Grey element fabric', t: { k: 'fabric', c: '#cac3b1' } },
      { id: 'iw-811804-32', name: '811804-32 Grey tech wood', t: { k: 'wood', c: '#9a928c', g: '#8f8781' } },
    ],
    bamboo: [
      { id: 'iw-FG6006-2', name: 'FG6006-2 Milk coffee', t: { k: 'solid', c: '#ddd3c7' }, up: true },
      { id: 'iw-G002-2', name: 'G002-2 Milk white', t: { k: 'solid', c: '#fffdf1' }, up: true },
      { id: 'iw-H-XMT007-A229', name: 'H-XMT007-A229 Starry khaki', t: { k: 'speck', c: '#c2ae9f', cs: ['#bda99a', '#c7b3a3'], n: 0.6 }, up: true },
      { id: 'iw-H-XMT022-A229', name: 'H-XMT022-A229 Starry latte', t: { k: 'speck', c: '#d8d1c4', cs: ['#d4ccc0', '#dcd5c8'], n: 0.6 }, up: true },
      { id: 'iw-C1033-2', name: 'C1033-2 Cream', t: { k: 'solid', c: '#e7e1cb' }, up: true },
      { id: 'iw-G003-A216', name: 'G003-A216 Frosted ivory', t: { k: 'fabric', c: '#e6e6da' }, up: true },
      { id: 'iw-11-A197', name: '11-A197 Silk fabric', t: { k: 'fabric', c: '#e9e9e7' }, up: true },
      { id: 'iw-Z106-001', name: 'Z106-001 Cross weave cream', t: { k: 'fabric', c: '#eae9e7' }, up: true },
      { id: 'iw-Z213-001', name: 'Z213-001 Night star cream', t: { k: 'fabric', c: '#e8e7e5' }, up: true },
      { id: 'iw-S3012-A191', name: 'S3012-A191 Milk coffee', t: { k: 'fabric', c: '#d9cab9' }, up: true },
      { id: 'iw-S3016-A191', name: 'S3016-A191 Phantom grey', t: { k: 'fabric', c: '#b6b2ad' }, up: true },
      { id: 'iw-S3011-A192', name: 'S3011-A192 Cream', t: { k: 'fabric', c: '#e6ddd2' }, up: true },
      { id: 'iw-S3015-A192', name: 'S3015-A192 Pale blue', t: { k: 'fabric', c: '#b8b9b4' }, up: true },
      { id: 'iw-S3016-A192', name: 'S3016-A192 Phantom grey', t: { k: 'fabric', c: '#b4b0ad' }, up: true },
      { id: 'iw-S3022-A205', name: 'S3022-A205 Light linen', t: { k: 'fabric', c: '#e2d8d0' }, up: true },
      { id: 'iw-596-A125', name: '596-A125 New element fabric', t: { k: 'fabric', c: '#e2dbcb' }, up: true },
      { id: 'iw-785-A125', name: '785-A125 Still water', t: { k: 'fabric', c: '#d5d1cb' }, up: true },
      { id: 'iw-789-A155', name: '789-A155 Aishang fabric', t: { k: 'fabric', c: '#e9e3cf' }, up: true },
      { id: 'iw-D9102-2', name: 'D9102-2 Jazz white matte', t: { k: 'marble', c: '#eee8f6', v: '#e9e4f1' }, up: true },
      { id: 'iw-F8-A262', name: 'F8-A262 Dream Paris', t: { k: 'solid', c: '#e2e3e6' }, up: true },
      { id: 'iw-11-1', name: '11-1 Frosted cream', t: { k: 'fabric', c: '#e8e7e4' }, up: true },
      { id: 'iw-607-A206', name: '607-A206 Vera check taupe', t: { k: 'fabric', c: '#887f6e' }, up: true },
      { id: 'iw-C1011-A158', name: 'C1011-A158 Diatom pale teal', t: { k: 'fabric', c: '#799893' }, up: true },
      { id: 'iw-609-A206', name: '609-A206 Vera check navy', t: { k: 'fabric', c: '#333a42' }, up: true },
      { id: 'iw-697-A211', name: '697-A211 Drizzle cream', t: { k: 'solid', c: '#eee9ca' }, up: true },
      { id: 'iw-Z211-003', name: 'Z211-003 Drizzle beige', t: { k: 'solid', c: '#b2aea2' }, up: true },
      { id: 'iw-Z106-002', name: 'Z106-002 Cross weave grey', t: { k: 'fabric', c: '#abacae' }, up: true },
      { id: 'iw-1-A155', name: '1-A155 Soft white', t: { k: 'fabric', c: '#e8e2e9' }, up: true },
      { id: 'iw-7-A106', name: '7-A106 Off-white fabric', t: { k: 'fabric', c: '#ededeb' }, up: true },
      { id: 'iw-K7143-A189', name: 'K7143-A189 Pear wood', t: { k: 'wood', c: '#e4d9bc', g: '#e1d6b8' }, up: true },
      { id: 'iw-K7066-A189', name: 'K7066-A189 Light pear wood', t: { k: 'wood', c: '#c9b8a1', g: '#c0b098' }, up: true },
      { id: 'iw-K7073-A189', name: 'K7073-A189 Rosewood', t: { k: 'wood', c: '#775232', g: '#6e4a2d' }, up: true },
      { id: 'iw-663-A125', name: '663-A125 Element fabric', t: { k: 'fabric', c: '#d7d2d6' }, up: true },
      { id: 'iw-388-A155', name: '388-A155 Morandi', t: { k: 'fabric', c: '#c4bdab' }, up: true },
      { id: 'iw-389-A155', name: '389-A155 Morandi grey', t: { k: 'fabric', c: '#aaa7a0' }, up: true },
      { id: 'iw-195-A125', name: '195-A125 Grey element fabric', t: { k: 'fabric', c: '#cac3b1' }, up: true },
      { id: 'iw-811804-32', name: '811804-32 Grey tech wood', t: { k: 'wood', c: '#9a928c', g: '#8f8781' }, up: true },
    ],
  };
  const JOINT = [ // p.28 joint sealing strips
    { id: 'j-coffee', name: 'Milk coffee', c: '#ebe0b1' },
    { id: 'j-rosegold', name: 'Rose gold', c: '#b5a085' },
    { id: 'j-black', name: 'Matte black', c: '#333737' },
    { id: 'j-white', name: 'Porcelain white', c: '#e9edea' },
    { id: 'j-silver', name: 'Matte silver', c: '#818380' },
  ];

  // ---------- Floors (p.29-32) ----------
  const FLOOR_TYPES = [
    { id: 'pvc', name: 'PVC', up: false },
    { id: 'spc4', name: 'SPC 4 mm', up: true },
    { id: 'spc6', name: 'SPC 6 mm carborundum', up: true },
    { id: 'fishbone', name: 'Fishbone SPC', up: true },
  ];
  const FLOOR = {
    pvc: [ // p.32 commercial 2.0 mm
      { id: 'pvc-ash', name: 'Liya ash grey', t: { k: 'speck', c: '#abadac', cs: ['#a6a8a7', '#b1b2b1'], n: 0.7, tile: 1.2 } },
      { id: 'pvc-willow', name: 'Liya willow grey', t: { k: 'speck', c: '#7f7f7f', cs: ['#7a7a7a', '#898989'], n: 0.7, tile: 1.2 } },
      { id: 'pvc-blue', name: 'Liya elegant blue', t: { k: 'speck', c: '#99b0d4', cs: ['#8fa7cb', '#a4bbde'], n: 0.7, tile: 1.2 } },
      { id: 'pvc-apricot', name: 'Liya apricot beige', t: { k: 'speck', c: '#ece0ca', cs: ['#e9ddc7', '#efe3cd'], n: 0.7, tile: 1.2 } },
      { id: 'pvc-yellow', name: 'Liya bright yellow', t: { k: 'speck', c: '#f5e7b8', cs: ['#eee1b4', '#f7e9bb'], n: 0.7, tile: 1.2 } },
      { id: 'pvc-premgrey', name: 'Coral premium grey', t: { k: 'speck', c: '#857d7b', cs: ['#766e6d', '#8f8886'], n: 0.7, tile: 1.2 } },
      { id: 'pvc-mist', name: 'Coral cloud mist', t: { k: 'speck', c: '#b9b5a9', cs: ['#aeaa9e', '#bfbbb0'], n: 0.7, tile: 1.2 } },
      { id: 'pvc-offwhite', name: 'Coral off-white', t: { k: 'speck', c: '#eae2cb', cs: ['#e3dbc4', '#eee7cf'], n: 0.7, tile: 1.2 } },
      { id: 'pvc-sea', name: 'Coral shallow sea', t: { k: 'speck', c: '#aebcc7', cs: ['#a0aeba', '#b5c3cd'], n: 0.7, tile: 1.2 } },
      { id: 'pvc-med', name: 'Coral Mediterranean', t: { k: 'speck', c: '#8092ba', cs: ['#6e80a8', '#8a9dc4'], n: 0.7, tile: 1.2 } },
      { id: 'pvc-space', name: 'Nature space grey', t: { k: 'speck', c: '#cec8c3', cs: ['#bdb7b2', '#d8d1cd'], n: 0.7, tile: 1.2 } },
      { id: 'pvc-whitepine', name: 'White pine', t: { k: 'planks', c: '#ddd6ba', tile: 2.4 } },
      { id: 'pvc-plane', name: 'Plane tree wood', t: { k: 'planks', c: '#d2b597', tile: 2.4 } },
      { id: 'pvc-maple', name: 'Maple', t: { k: 'planks', c: '#c1a17a', tile: 2.4 } },
      { id: 'pvc-nanmu', name: 'Nanmu wood', t: { k: 'planks', c: '#b1a79b', tile: 2.4 } },
      { id: 'pvc-cedar', name: 'Cedar', t: { k: 'planks', c: '#96928e', tile: 2.4 } },
      { id: 'pvc-chestnut', name: 'Light chestnut', t: { k: 'planks', c: '#9c785c', tile: 2.4 } },
      { id: 'pvc-tung', name: 'Brown tung wood', t: { k: 'planks', c: '#80654e', tile: 2.4 } },
      { id: 'pvc-greywood', name: 'Grey wood', t: { k: 'planks', c: '#493f3d', tile: 2.4 } },
    ],
    spc4: [ // p.29
      { id: 's4-8005', name: '8005', up: true, t: { k: 'planks', c: '#855039', tile: 2.4 } },
      { id: 's4-8007', name: '8007', up: true, t: { k: 'planks', c: '#a4774b', tile: 2.4 } },
      { id: 's4-8008', name: '8008', up: true, t: { k: 'marble', c: '#d7d7d3', v: '#c2c2bb', tile: 1.2 } },
      { id: 's4-8022', name: '8022', up: true, t: { k: 'planks', c: '#d3cbb7', tile: 2.4 } },
      { id: 's4-8061', name: '8061', up: true, t: { k: 'planks', c: '#e8cca1', tile: 2.4 } },
      { id: 's4-8911', name: '8911', up: true, t: { k: 'planks', c: '#dcddd8', tile: 2.4 } },
      { id: 's4-8912', name: '8912', up: true, t: { k: 'planks', c: '#c4b69c', tile: 2.4 } },
      { id: 's4-8913', name: '8913', up: true, t: { k: 'planks', c: '#ababab', tile: 2.4 } },
      { id: 's4-8915', name: '8915', up: true, t: { k: 'planks', c: '#caae8b', tile: 2.4 } },
      { id: 's4-8916', name: '8916', up: true, t: { k: 'planks', c: '#c29565', tile: 2.4 } },
      { id: 's4-8917', name: '8917', up: true, t: { k: 'planks', c: '#91653f', tile: 2.4 } },
      { id: 's4-8918', name: '8918', up: true, t: { k: 'planks', c: '#886c56', tile: 2.4 } },
      { id: 's4-8919', name: '8919', up: true, t: { k: 'planks', c: '#89847e', tile: 2.4 } },
      { id: 's4-8920', name: '8920', up: true, t: { k: 'planks', c: '#955336', tile: 2.4 } },
      { id: 's4-8921', name: '8921', up: true, t: { k: 'marble', c: '#7a7a7e', v: '#6f6e72', tile: 1.2 } },
      { id: 's4-8922', name: '8922', up: true, t: { k: 'terrazzo', c: '#adaba6', cs: ['#8b8983', '#cccecd'], fine: 1, tile: 1.2 } },
      { id: 's4-8923', name: '8923', up: true, t: { k: 'planks', c: '#c6a67a', tile: 2.4 } },
    ],
    spc6: [ // p.30
      { id: 's6-8101', name: '8101', up: true, t: { k: 'planks', c: '#dadad3', tile: 2.4 } },
      { id: 's6-8102', name: '8102', up: true, t: { k: 'marble', c: '#ccccc4', v: '#c1bfb5', tile: 1.2 } },
      { id: 's6-8103', name: '8103', up: true, t: { k: 'marble', c: '#aaa7a4', v: '#98938f', tile: 1.2 } },
      { id: 's6-8104', name: '8104', up: true, t: { k: 'planks', c: '#c6ad82', tile: 2.4 } },
      { id: 's6-8105', name: '8105', up: true, t: { k: 'planks', c: '#b08860', tile: 2.4 } },
      { id: 's6-8106', name: '8106', up: true, t: { k: 'marble', c: '#c4c5c0', v: '#bdbeb7', tile: 1.2 } },
      { id: 's6-8107', name: '8107', up: true, t: { k: 'planks', c: '#dad2c0', tile: 2.4 } },
      { id: 's6-8108', name: '8108', up: true, t: { k: 'marble', c: '#f4f6f0', v: '#e4dfd7', tile: 1.2 } },
      { id: 's6-8109', name: '8109', up: true, t: { k: 'marble', c: '#a6a5a4', v: '#949491', tile: 1.2 } },
      { id: 's6-8110', name: '8110', up: true, t: { k: 'marble', c: '#bebdbb', v: '#b4b3b1', tile: 1.2 } },
      { id: 's6-8111', name: '8111', up: true, t: { k: 'planks', c: '#86705a', tile: 2.4 } },
      { id: 's6-8112', name: '8112', up: true, t: { k: 'planks', c: '#ba9464', tile: 2.4 } },
      { id: 's6-8113', name: '8113', up: true, t: { k: 'planks', c: '#dbdcd7', tile: 2.4 } },
      { id: 's6-8115', name: '8115', up: true, t: { k: 'terrazzo', c: '#c0bcbf', cs: ['#a8a4a5', '#d0cdd0'], fine: 1, tile: 1.2 } },
    ],
    fishbone: [ // p.31
      { id: 'fb-YG5716', name: 'YG5716', up: true, t: { k: 'herring', c: '#ad814e', tile: 1.2 } },
      { id: 'fb-YG5711', name: 'YG5711', up: true, t: { k: 'herring', c: '#7b604d', tile: 1.2 } },
      { id: 'fb-YG5715', name: 'YG5715', up: true, t: { k: 'herring', c: '#858071', tile: 1.2 } },
      { id: 'fb-YG5713', name: 'YG5713', up: true, t: { k: 'herring', c: '#bc9d6b', tile: 1.2 } },
      { id: 'fb-YG5712', name: 'YG5712', up: true, t: { k: 'herring', c: '#977c59', tile: 1.2 } },
      { id: 'fb-YG5717', name: 'YG5717', up: true, t: { k: 'herring', c: '#4b3024', tile: 1.2 } },
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
    uv: [ // p.44
      { id: 'uv-001', name: 'UV-001', t: { k: 'marble', c: '#939898', v: '#898d8d' } },
      { id: 'uv-002', name: 'UV-002', t: { k: 'marble', c: '#979695', v: '#74726f' } },
      { id: 'uv-003', name: 'UV-003', t: { k: 'marble', c: '#9e9e9c', v: '#7f7d77' } },
      { id: 'uv-004', name: 'UV-004', t: { k: 'marble', c: '#9a9a99', v: '#737270' } },
      { id: 'uv-005', name: 'UV-005', t: { k: 'marble', c: '#af9e89', v: '#9d8971' } },
      { id: 'uv-mt9138-g', name: 'MT9138-G', up: true, t: { k: 'marble', c: '#e1d6c6', v: '#cbc0b0' } },
      { id: 'uv-mt9158-1-g', name: 'MT9158-1-G', up: true, t: { k: 'marble', c: '#f9faf9', v: '#c9a23a' } },
      { id: 'uv-mt89162-g', name: 'MT89162-G', up: true, t: { k: 'marble', c: '#dfded7', v: '#c9a23a' } },
      { id: 'uv-mt89136-g', name: 'MT89136-G', up: true, t: { k: 'marble', c: '#b9c2b9', v: '#c9a23a' } },
      { id: 'uv-marble-texture', name: 'Marble Texture', up: true, t: { k: 'terrazzo', c: '#fefefe', cs: ['#d9483b', '#1d1d1d', '#9a9a9a', '#e8a090'] } },
      { id: 'uv-hh24342-1-lj', name: 'HH24342-1-LJ', up: true, t: { k: 'marble', c: '#f2f2ef', v: '#c9a23a' } },
      { id: 'uv-hh24454-lj', name: 'HH24454-LJ', up: true, t: { k: 'marble', c: '#cac9c6', v: '#63625e' } },
      { id: 'uv-ml9004b', name: 'ML9004B', up: true, t: { k: 'marble', c: '#e0d9d0', v: '#a0978d' } },
      { id: 'uv-mt9088-g', name: 'MT9088-G', up: true, t: { k: 'marble', c: '#151514', v: '#c9a23a' } },
      { id: 'uv-ml1268-1', name: 'ML1268-1', up: true, t: { k: 'marble', c: '#c5c6c0', v: '#babbb5' } },
    ],
    spc: [ // p.45-47
      { id: 'spc-wood1', name: 'Textured wood grain 1', up: true, t: { k: 'wood', c: '#d7b7a0', g: '#cfaf98' } },
      { id: 'spc-wood7', name: 'Textured wood grain 7', up: true, t: { k: 'wood', c: '#c0a68b', g: '#b59b80' } },
      { id: 'spc-wood8', name: 'Textured wood grain 8', up: true, t: { k: 'wood', c: '#9c7d61', g: '#8f7054' } },
      { id: 'spc-wood14', name: 'Textured wood grain 14', up: true, t: { k: 'wood', c: '#c5aa84', g: '#bda17c' } },
      { id: 'spc-wood16', name: 'Textured wood grain 16', up: true, t: { k: 'wood', c: '#a58265', g: '#977457' } },
      { id: 'spc-stone11', name: 'Stone texture 11', up: true, t: { k: 'marble', c: '#c9cad2', v: '#bfc0c9' } },
      { id: 'spc-stone12', name: 'Stone texture 12', up: true, t: { k: 'marble', c: '#c0c3cc', v: '#b5b8c1' } },
      { id: 'spc-stone13', name: 'Stone texture 13', up: true, t: { k: 'marble', c: '#cccbd0', v: '#c3c2c7' } },
      { id: 'spc-stone21', name: 'Stone texture 21', up: true, t: { k: 'marble', c: '#d7d3d4', v: '#d3cecf' } },
      { id: 'spc-stone23', name: 'Stone texture 23', up: true, t: { k: 'marble', c: '#cdccd1', v: '#c8c8cd' } },
      { id: 'spc-stone25', name: 'Stone texture 25', up: true, t: { k: 'marble', c: '#ddd4d3', v: '#dad0d0' } },
      { id: 'spc-terrazzo13', name: 'Terrazzo 13', up: true, t: { k: 'terrazzo', c: '#aaafa9', cs: ['#818680', '#bec2bc'] } },
      { id: 'spc-yafeiyellow', name: 'Yafei stone grain yellow', up: true, t: { k: 'marble', c: '#d6ccc2', v: '#d0c6bb' } },
      { id: 'spc-yafeigrey', name: 'Yafei stone grey', up: true, t: { k: 'marble', c: '#a7a6a9', v: '#99989b' } },
      { id: 'spc-warmwhite', name: 'Warm white (black)', up: true, t: { k: 'solid', c: '#fafaf6', grid: '#a0a09d' } },
      { id: 'spc-starway', name: 'Starway style (black)', up: true, t: { k: 'solid', c: '#c8c4ba', grid: '#78746e' } },
      { id: 'spc-zy-bw1', name: 'ZY-BW1', up: true, t: { k: 'fabric', c: '#cac2c2' } },
      { id: 'spc-allseason', name: '5.0 All-season fabric', up: true, t: { k: 'fabric', c: '#dfddd9' } },
      { id: 'spc-fabric10', name: 'Texture fabric 10', up: true, t: { k: 'fabric', c: '#d4cac0' } },
      { id: 'spc-fabric11', name: 'Texture fabric 11', up: true, t: { k: 'fabric', c: '#d9d4c9' } },
      { id: 'spc-grain1', name: 'Stone grain 1', up: true, t: { k: 'marble', c: '#a19d98', v: '#97928c' } },
      { id: 'spc-grain5', name: 'Stone grain 5', up: true, t: { k: 'marble', c: '#858789', v: '#747577' } },
      { id: 'spc-jihotel', name: 'Ji Hotel style', up: true, t: { k: 'wood', c: '#c69046', g: '#b88238' } },
      { id: 'spc-fishbelly', name: 'Fish-belly white', up: true, t: { k: 'marble', c: '#f9ffff', v: '#f3f7f6' } },
      { id: 'spc-warmwhite2', name: 'Warm white', up: true, t: { k: 'solid', c: '#f7fbfb' } },
      { id: 'spc-rock3', name: 'Rock grain 3', up: true, t: { k: 'concrete', c: '#81858a' } },
      { id: 'spc-rock3b', name: 'Rock grain 3 beige', up: true, t: { k: 'solid', c: '#d9cabb' } },
      { id: 'spc-grain2', name: 'Stone grain 2', up: true, t: { k: 'concrete', c: '#83888c' } },
      { id: 'spc-terrazzo1', name: 'Terrazzo 1', up: true, t: { k: 'terrazzo', c: '#7a7674', cs: ['#65605e', '#8d8987'] } },
      { id: 'spc-colorterrazzo', name: 'Colourful terrazzo', up: true, t: { k: 'terrazzo', c: '#f0f0f0', cs: ['#1f6b3a', '#8a2a2a', '#2f4f5f', '#222222'] } },
      { id: 'spc-blue', name: 'Blue', up: true, t: { k: 'solid', c: '#249eda', grid: '#4baddf' } },
      { id: 'spc-grain4', name: 'Stone grain 4', up: true, t: { k: 'marble', c: '#777677', v: '#6e6c6d' } },
      { id: 'spc-hermes', name: 'Hermès orange', up: true, t: { k: 'solid', c: '#ed6b16' } },
      { id: 'spc-terrazzo3', name: 'Terrazzo 3', up: true, t: { k: 'terrazzo', c: '#90837c', cs: ['#7c6f68', '#a3968f'] } },
      { id: 'spc-rock2', name: 'Rock texture 2', up: true, t: { k: 'concrete', c: '#968a81' } },
      { id: 'spc-orange', name: 'Orange hotel style', up: true, t: { k: 'solid', c: '#012a22', grid: '#30504a' } },
      { id: 'spc-rock1', name: 'Rock texture 1', up: true, t: { k: 'marble', c: '#cbcfce', v: '#b7bbba' } },
      { id: 'spc-terrazzo2', name: 'Terrazzo 2', up: true, t: { k: 'terrazzo', c: '#bfaea4', cs: ['#a9978d', '#d9cfc7'] } },
      { id: 'spc-sm-s520', name: 'SM-S520', up: true, t: { k: 'terrazzo', c: '#d8beb0', cs: ['#b79c8e', '#e8d1c5'] } },
      { id: 'spc-allseason5', name: 'All seasons 5.0', up: true, t: { k: 'wood', c: '#ba9b7e', g: '#ae9073' } },
      { id: 'spc-luxury', name: 'Light luxury', up: true, t: { k: 'terrazzo', c: '#f4fafa', cs: ['#e9efef', '#f6fcfc'] } },
      { id: 'spc-roman', name: 'Roman travertine', up: true, t: { k: 'travertine', c: '#dac6aa' } },
      { id: 'spc-flatrock1', name: 'Flat rock texture 1', up: true, t: { k: 'marble', c: '#c6ced0', v: '#b3babb' } },
      { id: 'spc-zy-bw3', name: 'ZY-BW3', up: true, t: { k: 'fabric', c: '#b3a198' } },
      { id: 'spc-sm-s1', name: 'SM-S1', up: true, t: { k: 'terrazzo', c: '#d4c5b4', cs: ['#c8b9a8', '#ddcfbf'] } },
      { id: 'spc-sm-s4', name: 'SM-S4', up: true, t: { k: 'terrazzo', c: '#9da2ac', cs: ['#767b85', '#acb1bb'] } },
      { id: 'spc-sm-s2', name: 'SM-S2', up: true, t: { k: 'terrazzo', c: '#6b6a67', cs: ['#2d2d29', '#83837f'] } },
      { id: 'spc-sm-s3', name: 'SM-S3', up: true, t: { k: 'terrazzo', c: '#cac7c2', cs: ['#adaaa4', '#d5d3ce'] } },
      { id: 'spc-zy-sw1', name: 'ZY-SW1', up: true, t: { k: 'marble', c: '#aeaea6', v: '#a6a69e' } },
      { id: 'spc-zy-sw2', name: 'ZY-SW2', up: true, t: { k: 'marble', c: '#a29c98', v: '#99938f' } },
      { id: 'spc-zy-sw3', name: 'ZY-SW3', up: true, t: { k: 'marble', c: '#1f2a22', v: '#152019' } },
      { id: 'spc-zy-yw1', name: 'ZY-YW1', up: true, t: { k: 'marble', c: '#bbbcb5', v: '#b5b6ae' } },
      { id: 'spc-flatrock2', name: 'Flat rock texture 2', up: true, t: { k: 'concrete', c: '#8a7f75' } },
      { id: 'spc-flatrock3', name: 'Flat rock texture 3', up: true, t: { k: 'concrete', c: '#797b82' } },
      { id: 'spc-sevendays', name: 'Seven Days style', up: true, t: { k: 'solid', c: '#1f2a4a' } },
      { id: 'spc-zy-bw2', name: 'ZY-BW2', up: true, t: { k: 'fabric', c: '#bbb1a6' } },
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
  const CAB_FINISH = [ // p.56 standard white, p.60-63 PET colour cards (G = gloss, F = matte)
    { id: 'k-white', name: 'Standard white', up: false, t: { k: 'solid', c: '#f1f0ec' } },
    { id: 'pet-2001', name: '2001 Iceberg white gloss', up: true, grp: 'PET colour card', gloss: 1, t: { k: 'solid', c: '#fdfffe' } },
    { id: 'pet-2002', name: '2002 Iceberg white matte', up: true, grp: 'PET colour card', t: { k: 'solid', c: '#fbffff' } },
    { id: 'pet-2003', name: '2003 Moonlight white gloss', up: true, grp: 'PET colour card', gloss: 1, t: { k: 'solid', c: '#fffff7' } },
    { id: 'pet-2005', name: '2005 Moonlight white matte', up: true, grp: 'PET colour card', t: { k: 'solid', c: '#fffffb' } },
    { id: 'pet-2020', name: '2020 Aige grey gloss', up: true, grp: 'PET colour card', gloss: 1, t: { k: 'solid', c: '#cecabe' } },
    { id: 'pet-2019', name: '2019 Aige grey matte', up: true, grp: 'PET colour card', t: { k: 'solid', c: '#cbcbc3' } },
    { id: 'pet-2026', name: '2026 Longing grey gloss', up: true, grp: 'PET colour card', gloss: 1, t: { k: 'solid', c: '#c7beb5' } },
    { id: 'pet-2021', name: '2021 Nanya grey matte', up: true, grp: 'PET colour card', t: { k: 'solid', c: '#d0cbc5' } },
    { id: 'pet-2015', name: '2015 Earl grey gloss', up: true, grp: 'PET colour card', gloss: 1, t: { k: 'solid', c: '#c2baa7' } },
    { id: 'pet-2007', name: '2007 Earl grey matte', up: true, grp: 'PET colour card', t: { k: 'solid', c: '#b8b19f' } },
    { id: 'pet-2009', name: '2009 Pepper grey matte', up: true, grp: 'PET colour card', t: { k: 'solid', c: '#999184' } },
    { id: 'pet-2006', name: '2006 Bright moon grey matte', up: true, grp: 'PET colour card', t: { k: 'solid', c: '#a6a19d' } },
    { id: 'pet-2016', name: '2016 Drape grey gloss', up: true, grp: 'PET colour card', gloss: 1, t: { k: 'solid', c: '#98999d' } },
    { id: 'pet-2008', name: '2008 Drape grey matte', up: true, grp: 'PET colour card', t: { k: 'solid', c: '#a2a3a7' } },
    { id: 'pet-2023', name: '2023 Crystal grey gloss', up: true, grp: 'PET colour card', gloss: 1, t: { k: 'solid', c: '#d2d4d3' } },
    { id: 'pet-2022', name: '2022 Morning grey matte', up: true, grp: 'PET colour card', t: { k: 'solid', c: '#cecfd1' } },
    { id: 'pet-2011', name: '2011 Cement grey matte', up: true, grp: 'PET colour card', t: { k: 'solid', c: '#ced6d8' } },
    { id: 'pet-2010', name: '2010 Light cyan grey matte', up: true, grp: 'PET colour card', t: { k: 'solid', c: '#a1a8b0' } },
    { id: 'pet-2025', name: '2025 Almond yellow matte', up: true, grp: 'PET colour card', t: { k: 'solid', c: '#e3dcca' } },
    { id: 'pet-2017', name: '2017 Bean green matte', up: true, grp: 'PET colour card', t: { k: 'solid', c: '#869b8c' } },
    { id: 'pet-2036', name: '2036 Hermès grey matte', up: true, grp: 'PET colour card', t: { k: 'solid', c: '#cac4ac' } },
    { id: 'pet-2037', name: '2037 Milk tea grey gloss', up: true, grp: 'PET colour card', gloss: 1, t: { k: 'solid', c: '#d9cdb7' } },
    { id: 'pet-2038', name: '2038 Milk tea grey matte', up: true, grp: 'PET colour card', t: { k: 'solid', c: '#d9cdb7' } },
    { id: 'pet-2033', name: '2033 Qingcheng grey matte', up: true, grp: 'PET colour card', t: { k: 'solid', c: '#dbccb7' } },
    { id: 'pet-2043', name: '2043 Shell grey matte', up: true, grp: 'PET colour card', t: { k: 'solid', c: '#c7c1ab' } },
    { id: 'pet-2028', name: '2028 Champagne gold matte', up: true, grp: 'PET colour card', t: { k: 'solid', c: '#c8bca2' } },
    { id: 'pet-2029', name: '2029 Platinum gold matte', up: true, grp: 'PET colour card', t: { k: 'solid', c: '#cbc4b1' } },
    { id: 'pet-2032', name: '2032 Iceberg white silver sparkle', up: true, grp: 'PET colour card', gloss: 1, t: { k: 'speck', c: '#f6f6f6', cs: ['#f4f4f4', '#f5f5f5'], n: 0.5 } },
    { id: 'pet-2031', name: '2031 Starry grey silver sparkle', up: true, grp: 'PET colour card', gloss: 1, t: { k: 'speck', c: '#a7a499', cs: ['#f4f4f4', '#a4a196'], n: 0.5 } },
    { id: 'pet-2040', name: '2040 Milk tea grey silver sparkle', up: true, grp: 'PET colour card', gloss: 1, t: { k: 'speck', c: '#bdb7a0', cs: ['#f4f4f4', '#b9b39d'], n: 0.5 } },
    { id: 'pet-2030', name: '2030 Lake green silver sparkle', up: true, grp: 'PET colour card', gloss: 1, t: { k: 'speck', c: '#c3dcc1', cs: ['#f4f4f4', '#c0d9be'], n: 0.5 } },
    { id: 'pet-2035', name: '2035 Mystery grey matte', up: true, grp: 'PET colour card', t: { k: 'solid', c: '#728186' } },
    { id: 'pet-2041', name: '2041 Dark brick red matte', up: true, grp: 'PET colour card', t: { k: 'solid', c: '#f46054' } },
    { id: 'pet-2039', name: '2039 Sandalwood grey gloss', up: true, grp: 'PET colour card', gloss: 1, t: { k: 'solid', c: '#d3ceb1' } },
    { id: 'pet-2018', name: '2018 Haze blue matte', up: true, grp: 'PET colour card', t: { k: 'solid', c: '#8399a6' } },
    { id: 'pet-2027', name: '2027 Jizhou grey gloss', up: true, grp: 'PET colour card', gloss: 1, t: { k: 'solid', c: '#2b292a' } },
    { id: 'pet-2013', name: '2013 Jizhou grey matte', up: true, grp: 'PET colour card', t: { k: 'solid', c: '#353334' } },
    { id: 'pet-2012', name: '2012 Window grey matte', up: true, grp: 'PET colour card', t: { k: 'solid', c: '#3c3d41' } },
    { id: 'pet-twilight-grey', name: 'Twilight grey', up: true, grp: 'PET wood and stone', t: { k: 'solid', c: '#bab8bd' } },
    { id: 'pet-locke-grey', name: 'Locke grey', up: true, grp: 'PET wood and stone', t: { k: 'solid', c: '#b3aaa1' } },
    { id: 'pet-elegant-grey', name: 'Elegant grey', up: true, grp: 'PET wood and stone', t: { k: 'solid', c: '#dbdad6' } },
    { id: 'pet-brocade-grey', name: 'Brocade grey', up: true, grp: 'PET wood and stone', t: { k: 'solid', c: '#5f686f' } },
    { id: 'pet-khaki-st', name: 'Khaki grey', up: true, grp: 'PET wood and stone', t: { k: 'solid', c: '#918c86' } },
    { id: 'pet-zi-wu-grey', name: 'Zi-Wu grey', up: true, grp: 'PET wood and stone', t: { k: 'solid', c: '#c6c3bc' } },
    { id: 'pet-cashmere', name: 'Cashmere grey', up: true, grp: 'PET wood and stone', t: { k: 'solid', c: '#cfc6bf' } },
    { id: 'pet-963', name: '963', up: true, grp: 'PET wood and stone', t: { k: 'solid', c: '#5f6161' } },
    { id: 'pet-pearl-white-granite', name: 'Pearl white granite', up: true, grp: 'PET wood and stone', t: { k: 'solid', c: '#f7f6f4' } },
    { id: 'pet-tinglan-grey', name: 'Tinglan grey', up: true, grp: 'PET wood and stone', t: { k: 'solid', c: '#e2e0d4' } },
    { id: 'pet-702', name: '702', up: true, grp: 'PET wood and stone', t: { k: 'solid', c: '#e9dfd5' } },
    { id: 'pet-ink', name: 'Ink', up: true, grp: 'PET wood and stone', t: { k: 'solid', c: '#2d3139' } },
    { id: 'pet-baolifeng-oak-1', name: 'Baolifeng oak 1', up: true, grp: 'PET wood and stone', t: { k: 'wood', c: '#d7b387', g: '#cdaa7e' } },
    { id: 'pet-baolifeng-oak-2', name: 'Baolifeng oak 2', up: true, grp: 'PET wood and stone', t: { k: 'wood', c: '#a68f79', g: '#9d8670' } },
    { id: 'pet-silk-road-1', name: 'Silk Road 1', up: true, grp: 'PET wood and stone', t: { k: 'wood', c: '#deb989', g: '#d2ad7d' } },
    { id: 'pet-silk-road', name: 'Silk Road', up: true, grp: 'PET wood and stone', t: { k: 'wood', c: '#e5cca2', g: '#dcc399' } },
    { id: 'pet-cory-oak', name: 'Cory oak 1', up: true, grp: 'PET wood and stone', t: { k: 'wood', c: '#9c7459', g: '#936a50' } },
    { id: 'pet-sailuo-walnut', name: 'Sailuo walnut', up: true, grp: 'PET wood and stone', t: { k: 'wood', c: '#c6ae90', g: '#bda588' } },
    { id: 'pet-orlando-walnut', name: 'Orlando walnut', up: true, grp: 'PET wood and stone', t: { k: 'wood', c: '#936f52', g: '#8a664a' } },
    { id: 'pet-velo-walnut', name: 'Velo walnut', up: true, grp: 'PET wood and stone', t: { k: 'wood', c: '#8c705e', g: '#836857' } },
    { id: 'pet-wanjia-walnut', name: 'Wanjia walnut', up: true, grp: 'PET wood and stone', t: { k: 'wood', c: '#5a4039', g: '#513b34' } },
    { id: 'pet-sophia-rosewood', name: 'Sophia rosewood', up: true, grp: 'PET wood and stone', t: { k: 'wood', c: '#74635c', g: '#6b5b54' } },
    { id: 'pet-elegant-oak', name: 'Elegant oak', up: true, grp: 'PET wood and stone', t: { k: 'wood', c: '#655546', g: '#5a4c3f' } },
    { id: 'pet-sophia-walnut', name: 'Sophia red walnut', up: true, grp: 'PET wood and stone', t: { k: 'wood', c: '#5e251f', g: '#55211b' } },
    { id: 'pet-iceberg-hg', name: 'Iceberg white high-gloss', up: true, grp: 'PET gloss and soft-touch', gloss: 1, t: { k: 'solid', c: '#ffffff' } },
    { id: 'pet-iceberg-white-soft-touch', name: 'Iceberg white soft-touch', up: true, grp: 'PET gloss and soft-touch', t: { k: 'solid', c: '#ffffff' } },
    { id: 'pet-moonlight-white-high-gloss', name: 'Moonlight white high-gloss', up: true, grp: 'PET gloss and soft-touch', gloss: 1, t: { k: 'solid', c: '#f8f8fa' } },
    { id: 'pet-moon-st', name: 'Moonlight white soft-touch', up: true, grp: 'PET gloss and soft-touch', t: { k: 'solid', c: '#f7f8fa' } },
    { id: 'pet-tinglan-hg', name: 'Tinglan grey high-gloss', up: true, grp: 'PET gloss and soft-touch', gloss: 1, t: { k: 'solid', c: '#dddcd7' } },
    { id: 'pet-tinglan-grey-soft-touch', name: 'Tinglan grey soft-touch', up: true, grp: 'PET gloss and soft-touch', t: { k: 'solid', c: '#dddcd7' } },
    { id: 'pet-crystal-hg', name: 'Crystal grey high-gloss', up: true, grp: 'PET gloss and soft-touch', gloss: 1, t: { k: 'solid', c: '#d1d2d4' } },
    { id: 'pet-crystal-grey-soft-touch', name: 'Crystal grey soft-touch', up: true, grp: 'PET gloss and soft-touch', t: { k: 'solid', c: '#d1d2d4' } },
    { id: 'pet-warm-grey-high-gloss', name: 'Warm grey high-gloss', up: true, grp: 'PET gloss and soft-touch', gloss: 1, t: { k: 'solid', c: '#cac7c2' } },
    { id: 'pet-warmgrey-st', name: 'Warm grey soft-touch', up: true, grp: 'PET gloss and soft-touch', t: { k: 'solid', c: '#cac7c2' } },
    { id: 'pet-oat-grey-high-gloss', name: 'Oat grey high-gloss', up: true, grp: 'PET gloss and soft-touch', gloss: 1, t: { k: 'solid', c: '#aa9d94' } },
    { id: 'pet-oat-st', name: 'Oat grey soft-touch', up: true, grp: 'PET gloss and soft-touch', t: { k: 'solid', c: '#aa9d94' } },
    { id: 'pet-cream-st', name: 'Creamy white soft-touch', up: true, grp: 'PET gloss and soft-touch', t: { k: 'solid', c: '#f1efe3' } },
    { id: 'pet-khaki-soft', name: 'Khaki soft-touch', up: true, grp: 'PET gloss and soft-touch', t: { k: 'solid', c: '#8e857c' } },
    { id: 'pet-cement-grey-high-gloss', name: 'Cement grey high-gloss', up: true, grp: 'PET gloss and soft-touch', gloss: 1, t: { k: 'solid', c: '#a0a3aa' } },
    { id: 'pet-cement-st', name: 'Cement grey soft-touch', up: true, grp: 'PET gloss and soft-touch', t: { k: 'solid', c: '#a0a3aa' } },
    { id: 'pet-pine-forest-grey-high-gloss', name: 'Pine forest grey high-gloss', up: true, grp: 'PET gloss and soft-touch', gloss: 1, t: { k: 'solid', c: '#5a5859' } },
    { id: 'pet-pine-st', name: 'Pine forest grey soft-touch', up: true, grp: 'PET gloss and soft-touch', t: { k: 'solid', c: '#5a5859' } },
    { id: 'pet-sage-st', name: 'Sage green soft-touch', up: true, grp: 'PET gloss and soft-touch', t: { k: 'solid', c: '#647b6b' } },
    { id: 'pet-sky-st', name: 'Sky blue soft-touch', up: true, grp: 'PET gloss and soft-touch', t: { k: 'solid', c: '#728ca5' } },
    { id: 'pet-gentleman-hg', name: 'Gentleman grey high-gloss', up: true, grp: 'PET gloss and soft-touch', gloss: 1, t: { k: 'solid', c: '#3f3b3a' } },
    { id: 'pet-gentleman-grey-soft-touch', name: 'Gentleman grey soft-touch', up: true, grp: 'PET gloss and soft-touch', t: { k: 'solid', c: '#3f3b3a' } },
    { id: 'pet-black-hg', name: 'Black high-gloss', up: true, grp: 'PET gloss and soft-touch', gloss: 1, t: { k: 'solid', c: '#000000' } },
    { id: 'pet-black-soft-touch', name: 'Black soft-touch', up: true, grp: 'PET gloss and soft-touch', t: { k: 'solid', c: '#000000' } },
  ];
  const COUNTER_TYPES = [
    { id: 'marble', name: 'Marble', up: false },
    { id: 'quartz', name: 'Quartz stone', up: true },
    { id: 'steel', name: 'Stainless steel', up: false },
  ];
  const COUNTER = {
    marble: [ // p.58
      { id: 'ct-silverdragon', name: 'Silver white dragon', t: { k: 'marble', c: '#111214', v: '#2a2b2f' } },
      { id: 'ct-fishbelly', name: 'Fish-belly white', t: { k: 'marble', c: '#dbdce4', v: '#9a9da9' } },
      { id: 'ct-dora', name: 'Cloud Dora grey', t: { k: 'marble', c: '#b7b2b3', v: '#969494' } },
      { id: 'ct-purewhite', name: 'Pure white', t: { k: 'marble', c: '#e8e9ed', v: '#d4d7db' } },
      { id: 'ct-hetian', name: 'Hetian white jade', t: { k: 'marble', c: '#e5e5e7', v: '#ced0d3' } },
      { id: 'ct-ariston', name: 'Ariston white', t: { k: 'marble', c: '#d4d6db', v: '#c8cbd0' } },
      { id: 'ct-speckle', name: 'White speckle', t: { k: 'terrazzo', c: '#e4e2df', cs: ['#d6d5d2'], fine: 1 } },
      { id: 'ct-statuario', name: 'Statuario white', t: { k: 'marble', c: '#eff1ef', v: '#aeafac' } },
      { id: 'ct-lightgrey', name: 'Light grey', t: { k: 'solid', c: '#a2a09a' } },
      { id: 'ct-wave', name: 'Black and white wave', t: { k: 'marble', c: '#212123', v: '#bcbdbd' } },
      { id: 'ct-black', name: 'Absolute black', t: { k: 'solid', c: '#0a0a0a' } },
      { id: 'ct-cream', name: 'Cream white', t: { k: 'solid', c: '#e9e9e3' } },
    ],
    quartz: [ // p.59
      { id: 'q-hf-7001', name: 'HF-7001', up: true, grp: 'Quartz stone series', t: { k: 'solid', c: '#e3e4e6' } },
      { id: 'q-jql-6609', name: 'JQL-6609', up: true, grp: 'Quartz stone series', t: { k: 'terrazzo', c: '#d7d8dd', cs: ['#cfd0d4', '#dddee3'], fine: 1 } },
      { id: 'q-jql-6651', name: 'JQL-6651', up: true, grp: 'Quartz stone series', t: { k: 'terrazzo', c: '#d9dbdf', cs: ['#c8cace', '#e1e2e6'], fine: 1 } },
      { id: 'q-jql-5601', name: 'JQL-5601', up: true, grp: 'Quartz stone series', t: { k: 'terrazzo', c: '#d1d5da', cs: ['#bfc4c8', '#dadde2'], fine: 1 } },
      { id: 'q-jql-6602', name: 'JQL-6602', up: true, grp: 'Quartz stone series', t: { k: 'terrazzo', c: '#e5e5e5', cs: ['#d3d1d0', '#eae9ea'], fine: 1 } },
      { id: 'q-jql-6657', name: 'JQL-6657', up: true, grp: 'Quartz stone series', t: { k: 'terrazzo', c: '#7e818a', cs: ['#5f626b', '#898c95'], fine: 1 } },
      { id: 'q-jql-6630', name: 'JQL-6630', up: true, grp: 'Quartz stone series', t: { k: 'terrazzo', c: '#bab9b8', cs: ['#9f9e9d', '#c6c4c4'], fine: 1 } },
      { id: 'q-jql-6653', name: 'JQL-6653', up: true, grp: 'Quartz stone series', t: { k: 'terrazzo', c: '#d3d3d6', cs: ['#7a4a12', '#d9d9d9'], fine: 1 } },
      { id: 'q-hf-1000', name: 'HF-1000', up: true, grp: 'Pattern and solid colour series', t: { k: 'solid', c: '#e9eaec' } },
      { id: 'q-jl-517', name: 'JL-517', up: true, grp: 'Pattern and solid colour series', t: { k: 'marble', c: '#dfdfe1', v: '#d6d6d7' } },
      { id: 'q-jl-823', name: 'JL-823', up: true, grp: 'Pattern and solid colour series', t: { k: 'solid', c: '#eae9ea' } },
      { id: 'q-jl-708', name: 'JL-708', up: true, grp: 'Pattern and solid colour series', t: { k: 'solid', c: '#c2bdbd' } },
      { id: 'q-jl-832', name: 'JL-832', up: true, grp: 'Pattern and solid colour series', t: { k: 'marble', c: '#ecedf2', v: '#e3e4e8' } },
      { id: 'q-jl-521', name: 'JL-521', up: true, grp: 'Pattern and solid colour series', t: { k: 'marble', c: '#efeff1', v: '#e6e6e8' } },
      { id: 'q-jl-b0031', name: 'JL-B0031', up: true, grp: 'Pattern and solid colour series', t: { k: 'solid', c: '#666b76' } },
      { id: 'q-jl-526', name: 'JL-526', up: true, grp: 'Pattern and solid colour series', t: { k: 'marble', c: '#e9e9ea', v: '#dededf' } },
      { id: 'q-zs-black', name: 'Zero-silica black', up: true, grp: 'Zero-silica quartz', t: { k: 'terrazzo', c: '#23262c', cs: ['#2f323b'], fine: 1 } },
      { id: 'q-zs-white', name: 'Zero-silica white', up: true, grp: 'Zero-silica quartz', t: { k: 'solid', c: '#f6f7fb' } },
    ],
    steel: [ // p.56
      { id: 'ct-steel', name: 'Brushed stainless steel', t: { k: 'solid', c: '#c4c8cc' }, steel: 1 },
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
    deck: 'none', deckRoof: false, terrace: false, terraceFloor: 'std', deckColor: 'tw-teak', terraceRoof: false, terraceThick: false,
    cladType: 'steel', clad: 'mahogany', sandwich: 'eps', panelThk: 75,
    entrance: 'glassDouble', steelColor: 'sd-black', winType: 'hanging', winFrame: 'wf-black', blinds: false,
    curtain: 'none', roomDoor: 'rd-white',
    intWallType: 'carbon', intWall: 'iw-G002-2', joint: 'j-silver',
    floorType: 'pvc', floor: 'pvc-maple', floorHeat: false, indoorLights: 'std', electric: 'eu',
    bathWallType: 'uv', bathWall: 'uv-002', vanity: 'X1270D', vanityW: 60, heater: 'basic', heaterColor: 'h-white',
    shower: 'chrome', wetDry: 'screen', wetDryFrame: 'black', wetDryGlass: 'clear', bathDoor: 'std', exhaust: false,
    kitchenCab: 'std', cabFinish: 'k-white', counterType: 'marble', counter: 'ct-fishbelly', sink: 'ss-single',
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
      { key: 'deckColor', label: 'Decking colour', type: 'swatch', options: DECK_COLOR, show: (c) => (c.terrace || c.deck !== 'none') && c.terraceFloor !== 'std' },
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

  // Older saved designs and presets used made-up finishes; each maps to the closest colour from the catalogue
  const ALIAS = {
    clad: { 'cv-brick': 'D-006', 'cv-slate': 'D-093', 'cv-sand': 'D-015', 'cv-wood': 'D-063', 'cv-marble': 'D-088', 'we-coffee': 'we-rosewood', 'we-grey': 'we-ash',
      'we-charcoal': 'we-ebony', 'wf-walnut': 'wf-coffee', 'wf-red': 'wf-rosewood', 'wf-charcoal': 'wf-black' },
    intWall: { 'cw-white': 'iw-G002-2', 'cw-grey': 'iw-S3016-A191', 'cw-oak': 'iw-K7143-A189', 'cw-walnut': 'iw-K7073-A189', 'cw-marble': 'iw-D9102-2',
      'cw-concrete': 'iw-389-A155', 'cw-fabric': 'iw-S3022-A205', 'bb-white': 'iw-1-A155', 'bb-sand': 'iw-S3012-A191', 'bb-oak': 'iw-K7143-A189',
      'bb-ash': 'iw-811804-32', 'bb-stone': 'iw-D9102-2' },
    joint: { 'j-gold': 'j-rosegold' },
    floor: { 'pvc-oak': 'pvc-maple', 'pvc-walnut': 'pvc-tung', 'pvc-grey': 'pvc-greywood', 's6-8114': 's6-8115',
      'fb-natural': 'fb-YG5713', 'fb-smoke': 'fb-YG5711', 'fb-grey': 'fb-YG5715', 'fb-walnut': 'fb-YG5717' },
    bathWall: { 'uv-white': 'uv-001', 'uv-marble': 'uv-002', 'uv-grey': 'uv-004', 'uv-beige': 'uv-005', 'uv-wood': 'uv-003' },
    counter: { 'ct-carrara': 'ct-fishbelly', 'ct-grey': 'ct-dora', 'q-white': 'q-hf-1000', 'q-calacatta': 'q-jl-526', 'q-concrete': 'q-jl-708', 'q-black': 'q-zs-black' },
    roomDoor: { 'rd-grey': 'rd-oak' },
  };
  ALIAS.okTop = ALIAS.counter;

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
          doors: E.doors.map((d) => (d.o === 'h' ? Object.assign({}, d, { at: zm(d.at), into: -d.into }) : Object.assign({}, d, { p: -d.p, hinge: d.hinge === -1 ? 1 : -1 }))),
          wins: { front: E.wins.back.slice(), back: E.wins.front.slice() },
          baths: (E.baths || []).map((b) => Object.assign({}, b, { doorZ: +(Y.zB + Y.zF - b.doorZ).toFixed(3), hinge: b.hinge === -1 ? 1 : -1 })),
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
    for (const k in ALIAS) if (ALIAS[k][cfg[k]]) cfg[k] = ALIAS[k][cfg[k]];
    const ensure = (key, list) => { if (!list.some((o) => o.id === cfg[key])) cfg[key] = list[0].id; };
    ensure('clad', CLAD[cfg.cladType]);
    ensure('intWall', INT_WALL[cfg.intWallType]);
    ensure('floor', FLOOR[cfg.floorType]);
    ensure('bathWall', BATH_WALL[cfg.bathWallType]);
    ensure('counter', COUNTER[cfg.counterType]);
    ensure('joint', JOINT); ensure('roomDoor', ROOM_DOOR); ensure('deckColor', DECK_COLOR); ensure('cabFinish', CAB_FINISH);
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
    SIZES, LAYOUTS, CORE_W, INNER_H, FRAME, CLAD_TYPES, CLAD, SANDWICH, PANEL_THK, ROOFS, TERRACE_FLOOR, DECK_COLOR, DECKS, ALIAS,
    ENTRANCE, STEEL_DOOR_COLORS, WINDOWS, WIN_FRAME, CURTAIN, ROOM_DOOR, INT_WALL_TYPES, INT_WALL, JOINT,
    FLOOR_TYPES, FLOOR, INDOOR_LIGHTS, ELECTRIC, BATH_WALL_TYPES, BATH_WALL, VANITY, HEATER, HEATER_COLORS,
    SHOWER, WETDRY, WETDRY_FRAME, WETDRY_GLASS, BATH_DOOR, KITCHEN_CAB, CAB_FINISH, COUNTER_TYPES, COUNTER,
    SINK, OUTDOOR_KITCHEN, OK_FINISH, OK_CAB, OK_TOP, OK_WALL, OK_FRAME, POOLS, DEFAULTS, SECTIONS, byId, sizeOf, applyRules,
  });
})(window.CHZ);
