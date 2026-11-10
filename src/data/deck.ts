export const eventFacts = [
  { label: 'FORMAT', value: 'Indoor auditorium', note: 'Controlled light, sound and rigging' },
  { label: 'AUDIENCE', value: '1,000–2,000', note: 'Officials, dignitaries, industry, media' },
  { label: 'PRODUCTS', value: 'Three physical objects', note: 'Launched sequentially, one programme' },
  { label: 'FOOTPRINTS', value: '2×2 · 4×4 · 6×6 FT', note: 'Dimensions in feet; heights unknown' },
];

export const unknowns = [
  'Product height, weight and centre of gravity',
  'Product form, materials and handling restrictions',
  'Actual sector, function and approved claims',
  'Venue rigging points, stage load and ceiling height',
  'Lift travel, sightlines and stage crossovers',
  'Fog, laser, confetti and fire-alarm permissions',
];

export const experienceActs = [
  {
    number: '01',
    title: 'THE HOOK',
    time: '0:00–0:45',
    body: 'The room enters a stage it cannot fully read. A question, a low tone, a single line of light. The audience leans in before they know what they are looking at.',
  },
  {
    number: '02',
    title: 'THE STORY',
    time: '0:45–2:00',
    body: 'Approved facts, abstract engineering imagery and a human voice establish why the product matters. No invented specifications. No fake product silhouette.',
  },
  {
    number: '03',
    title: 'THE ACTIVATION',
    time: '2:00–2:20',
    body: 'The chief guest does something simple and legible. A key turns, a palm lands, a cord pulls, a beam breaks. The action begins a visible chain reaction.',
  },
  {
    number: '04',
    title: 'THE REVEAL',
    time: '2:20–2:50',
    body: 'The chosen mechanism completes. Light, sound, motion and camera land on the same beat. The product is already there, lit as the hero.',
  },
  {
    number: '05',
    title: 'THE HOLD',
    time: '2:50–4:00',
    body: 'The screen resolves to the official identity. The stage becomes a photograph. All three products return for the final composition.',
  },
];

export const designPrinciples = [
  {
    title: 'Design the moment, not the object.',
    body: 'We do not know enough about the products to build the show around their functions. We can build it around the experience of discovery, transformation and arrival.',
  },
  {
    title: 'One stage, three different mechanisms.',
    body: 'Repeating the same reveal three times flattens the event. The stage should escalate: a precise opening, an immersive middle, a physical climax.',
  },
  {
    title: 'Every effect must be explainable.',
    body: 'If it floats, say what holds it. If it opens, say what moves. If it looks like an explosion, say why nothing flies. Spectacle earns trust when the engineering is honest.',
  },
  {
    title: 'The hero shot is part of the design.',
    body: 'The final composition is not an afterthought. It is the image the client, the press and the audience will remember. It is designed before the show flow is locked.',
  },
];

export const productionNotes = [
  {
    title: 'What we need before final design',
    items: [
      'Exact product dimensions, mass and centre of gravity',
      'Loading route, stage access and service clearance',
      'Venue rigging plan, ceiling height and floor load',
      'Approved product language, imagery and claims',
      'Fire, fog, laser and confetti permissions',
      'Rehearsal time and show-control ownership',
    ],
  },
  {
    title: 'How we de-risk the build',
    items: [
      'Separate artistic cues from safety controllers',
      'Certified operators for lifts, rigging and lasers',
      'Position sensors, hard stops and manual overrides',
      'Rehearse every reveal at full speed and at failure',
      'Design a non-mechanical fallback for every mechanism',
      'Lock the hero shot before scenic fabrication',
    ],
  },
];

export const matrixColumns = [
  { key: 'originality', label: 'Originality' },
  { key: 'wow', label: 'Wow' },
  { key: 'readability', label: 'Back row' },
  { key: 'complexity', label: 'Complexity' },
  { key: 'adaptability', label: 'Adaptability' },
  { key: 'guest', label: 'Guest moment' },
  { key: 'photo', label: 'Hero photo' },
] as const;

export const chapterNames = [
  'OPENING',
  'THE BRIEF',
  'THE PREMISE',
  'THE EXPERIENCE',
  'THE STAGE SYSTEM',
  'CONCEPT INDEX',
  'THE CONCEPTS',
  'COMPARISON',
  'RECOMMENDATION',
  'PRODUCTION',
  'CLOSE',
];

export type DeliveryTier = 'PROVEN' | 'ENGINEERED' | 'EXPERIMENTAL';

export const delivery: Record<string, { tier: DeliveryTier; build: string; note: string }> = {
  unseen: {
    tier: 'ENGINEERED',
    build: '5–6 WK SCENIC',
    note: 'Three independent bay drives, each with its own safety circuit and service route. The bays are conventional; the sequencing is the work.',
  },
  pulse: {
    tier: 'ENGINEERED',
    build: '4 WK SCENIC',
    note: 'Sensor and LED chase are straightforward. The crate skin, cable management and a repeatable palm read are the real build.',
  },
  cargo: {
    tier: 'ENGINEERED',
    build: '4 WK SCENIC',
    note: 'Gas-strut and hinge geometry must be proven at full product weight before the finish is applied.',
  },
  ascension: {
    tier: 'PROVEN',
    build: '2 WK / HIRE',
    note: 'A standard scissor lift with a scenic skirt and a rated controller. The lowest-risk reveal in the deck.',
  },
  veil: {
    tier: 'ENGINEERED',
    build: '5 WK SCENIC',
    note: 'Flown hoop, four-point bridle and a sewn sleeve that must gather cleanly on every take.',
  },
  sculpture: {
    tier: 'ENGINEERED',
    build: '4 WK SCENIC',
    note: 'Tube frames are light and repeatable. The hoisted cover needs a clear path and a hard stop at trim.',
  },
  drop: {
    tier: 'ENGINEERED',
    build: '4 WK SCENIC',
    note: 'A cargo shell on a single winch. Simple mechanism, but the shell is heavy and needs a controlled descent.',
  },
  phantom: {
    tier: 'EXPERIMENTAL',
    build: '6–7 WK',
    note: 'Mirror face, light trap and live projection must be tested as one system. Highest technical uncertainty in the deck.',
  },
  stageproduct: {
    tier: 'PROVEN',
    build: '4 WK SCENIC',
    note: 'A large scenic arch with two sliding faces on floor tracks. Big build, ordinary mechanism.',
  },
  laser: {
    tier: 'ENGINEERED',
    build: '3 WK + PERMITS',
    note: 'The drawn frame is reliable. The work is laser safety, venue permission and a certified operator.',
  },
  colour: {
    tier: 'PROVEN',
    build: '2 WK',
    note: 'Flown drape, six air cannons and a tested confetti load. The kind of effect a crew rehearses every season.',
  },
  ignition: {
    tier: 'ENGINEERED',
    build: '4 WK SCENIC',
    note: 'Conduit, charge cube and hero lift are three separate cues that must read as one chain.',
  },
  kabuki: {
    tier: 'PROVEN',
    build: '2 WK',
    note: 'Eight clamps, one cue, under a second. The most reliable reveal in the deck and the cheapest to rehearse.',
  },
  flybar: {
    tier: 'PROVEN',
    build: '2 WK / HIRE',
    note: 'Two chain hoists, a guided header and a weighted hem. Standard theatrical practice with a visible mechanism.',
  },
  traveler: {
    tier: 'PROVEN',
    build: '1–2 WK',
    note: 'A track, two carriers and two panels. Nothing on this page can fail in an interesting way.',
  },
  revolve: {
    tier: 'ENGINEERED',
    build: '5 WK SCENIC',
    note: 'A revolved shell on a recessed turntable. The build is the cost; the rotation is a solved problem.',
  },
};

export function deliveryFor(id: string) {
  return delivery[id] ?? { tier: 'ENGINEERED' as DeliveryTier, build: 'TBC', note: 'Delivery data to be confirmed with the fabricator.' };
}
