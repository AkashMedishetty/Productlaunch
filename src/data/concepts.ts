export type SceneType =
  | 'unseen'
  | 'pulse'
  | 'cargo'
  | 'ascension'
  | 'veil'
  | 'sculpture'
  | 'drop'
  | 'phantom'
  | 'stageproduct'
  | 'laser'
  | 'colour'
  | 'ignition'
  | 'kabuki'
  | 'flybar'
  | 'traveler'
  | 'revolve'
  | 'trilogy'
  | 'house';

export type Complexity = 'Low' | 'Low–medium' | 'Medium' | 'Medium–high' | 'High';

export interface SequenceStep {
  time: string;
  title: string;
  detail: string;
}

export interface ConceptScores {
  originality: number;
  wow: number;
  readability: number;
  complexity: number;
  adaptability: number;
  guest: number;
  photo: number;
}

export interface Concept {
  id: string;
  index: string;
  name: string;
  scene: SceneType;
  mechanism: string;
  proposition: string;
  tagline: string;
  complexity: Complexity;
  accent: string;
  sizeLabel: string;
  productSize: number;
  camera: { pos: [number, number, number]; target: [number, number, number]; fov?: number };
  audience: string;
  hook: string;
  stageDesign: string;
  concealment: string;
  guest: string;
  sequence: SequenceStep[];
  phases: string[];
  tech: string[];
  techDetail: string;
  adaptation: { small: string; medium: string; large: string };
  feasibility: string;
  mitigation: string;
  signature: string;
  visualDirection: string;
  scores: ConceptScores;
}

export const concepts: Concept[] = [
  {
    id: 'unseen',
    index: '01',
    name: 'THE UNSEEN',
    scene: 'unseen',
    mechanism: 'Transforming architectural stage',
    proposition: 'A stage that rewrites itself, one reveal at a time.',
    tagline: 'The set withholds the product until the architecture decides to speak.',
    complexity: 'Medium–high',
    accent: '#C9A86A',
    sizeLabel: '2×2 · 4×4 · 6×6 FT',
    productSize: 3.2,
    camera: { pos: [0, 5.0, 18.5], target: [0, 2.1, 0] },
    audience:
      'The audience enters a room where three matte-black architectural bays stand in near-darkness. Thin seams trace their edges. A presenter tells the story of the first product while the first bay begins to breathe with light. At the cue, its panels retract and the object is already there, held in a pool of warm light. The room applauds, but the stage is not finished. Later, the second bay opens. Later still, the third. By the finale, all three bays are open and the stage has become a single illuminated composition.',
    hook: 'The stage looks like a finished set. It is actually three sealed chapters.',
    stageDesign:
      'Three architectural bays span the rear stage, their widths increasing left to right. Each bay is a structural scenic frame with sliding face panels, an internal LED skin, a product plinth and a concealed access route. A low central lectern holds the architectural key. A wide LED wall sits behind the bays and only becomes visible when the bays open.',
    concealment:
      'Each product sits inside a dedicated scenic bay. Face panels close flush with the surrounding architecture so the stage reads as a single sculptural wall rather than three obvious boxes.',
    guest:
      'The chief guest turns a machined brass architectural key at the lectern. The key does not drive the panels; it requests a supervised show cue. At the final launch, the guest holds the key until the third bay completes its opening, and all three bays resolve into the hero composition.',
    sequence: [
      { time: '00:00–00:20', title: 'A stage that keeps its secrets', detail: 'The auditorium falls dark. Three bays stand as a single black wall. Only the edge seams and the lectern key are lit.' },
      { time: '00:20–00:55', title: 'The first story', detail: 'A short, approved narrative introduces the challenge behind the 2×2-ft product. Abstract silhouettes appear on the inner LED skin.' },
      { time: '00:55–01:05', title: 'The key turns', detail: 'The chief guest turns the brass key. A low confirmation tone sounds. The first bay’s seams brighten in sequence.' },
      { time: '01:05–01:20', title: 'First reveal', detail: 'The face panels retract on guided tracks. The product is revealed under a warm hero light. The outer stage remains dark, preserving the mystery of the other bays.' },
      { time: '01:20–02:40', title: 'The second chapter', detail: 'The programme returns to the presenter. The second bay wakes. Its wider panels part and the 4×4-ft product joins the composition.' },
      { time: '02:40–03:40', title: 'The third chapter', detail: 'The largest bay opens in two leaves. The 6×6-ft product is revealed in a taller, more dramatic aperture while the full LED wall comes alive behind the stage.' },
      { time: '03:40–04:00', title: 'The trilogy', detail: 'All three bays remain open. The lighting resolves into one clean composition. The chief guest, presenter and products hold for the official photograph.' },
    ],
    phases: ['SEALED STAGE', 'STORY', 'KEY TURN', 'BAY ONE', 'TRILOGY'],
    tech: ['Motorised scenic tracks', 'Position sensors', 'LED skins', 'Media server', 'Show control', 'Independent bay safety'],
    techDetail:
      'Each bay is a steel scenic frame with two or four face panels on low-friction guides. Motorised chain drives move the panels; limit switches and position encoders stop travel at verified points. A dedicated scenic controller handles movement, while the media server and lighting console run the visual cue. The lectern key is an input device only. A show operator confirms every movement cue.',
    adaptation: {
      small: 'A compact single-leaf bay. The 2×2-ft object is revealed with the shortest panel travel and the most intimate lighting.',
      medium: 'A wider two-leaf bay with a taller aperture and a longer visual prologue.',
      large: 'A double-height four-leaf bay. The 6×6-ft product is framed by the full architectural wall, with the LED backdrop revealed behind it.',
    },
    feasibility:
      'The concept depends on stage width, bay depth, product access and enough clear travel for the panels. Each bay needs a service route so the object can be placed and checked without opening the face in view of the audience.',
    mitigation:
      'If motorised panels are not approved, the same architecture can use manually operated counterweighted panels or retractable drapes behind the seams. The visual language survives; only the mechanism changes.',
    signature:
      'The moment the first seam opens and the audience realises the wall was never a wall. It was a container for three separate worlds.',
    visualDirection:
      'Photoreal wide-angle view from the third row. Three matte-black architectural bays, increasing in width, stand on a dark reflective stage. Brass seam lines glow. The left bay is open, revealing a compact product in warm light; the other two remain sealed. Volumetric haze catches the beam. Audience silhouettes frame the bottom of the image.',
    scores: { originality: 7, wow: 7, readability: 9, complexity: 7, adaptability: 9, guest: 6, photo: 9 },
  },
  {
    id: 'pulse',
    index: '02',
    name: 'THE PULSE',
    scene: 'pulse',
    mechanism: 'Palm-to-product activation',
    proposition: 'One touch. A signal the whole room can follow.',
    tagline: 'The guest’s hand starts a visible chain of light that ends at the product.',
    complexity: 'Medium',
    accent: '#6FE7D8',
    sizeLabel: '2×2 · 4×4 · 6×6 FT',
    productSize: 2.8,
    camera: { pos: [0, 3.9, 12.5], target: [0, 1.7, 0] },
    audience:
      'The room is almost black except for a single luminous palm console at the front of the stage. A live camera shows the chief guest’s hand. When the palm settles, the console brightens and a pulse of light leaves it, races along a physical LED path in the stage floor, climbs the scenic edge and disappears into the main screen. The screen wakes with a cinematic sequence, then the pulse appears to burst back out toward the concealed product. A fast drape retracts. The object is revealed under a hard, clean spotlight.',
    hook: 'The audience can trace the cause from the guest’s hand all the way to the product.',
    stageDesign:
      'A low ceremonial console sits at stage left, connected to the main stage by a protected addressable LED channel. The LED path continues up a scenic fin and into the main screen. The product is concealed behind a theatrical drape on a centre-stage plinth.',
    concealment:
      'A flame-retardant theatrical drape on a fast-release track. The drape is the only thing between the audience and the product, so its release is treated as a separate safety system.',
    guest:
      'The chief guest places a palm flat on a capacitive surface. The console responds immediately with light and a confirmation tone. The guest is not asked to press a button or perform a biometric scan; the gesture is simple, legible and dignified.',
    sequence: [
      { time: '00:00–00:15', title: 'The dark console', detail: 'The stage is black. A single sculptural console glows at the front edge. The live camera finds the guest.' },
      { time: '00:15–00:30', title: 'The palm', detail: 'The guest places a hand on the surface. A ring of light confirms contact. The room hears a low, rising tone.' },
      { time: '00:30–00:45', title: 'The signal', detail: 'A pixel-controlled pulse runs from the console, across the floor, up the scenic fin and into the screen.' },
      { time: '00:45–01:00', title: 'The screen wakes', detail: 'The LED wall transitions from black to an accelerated engineering sequence. Stage lighting begins to move with the content.' },
      { time: '01:00–01:10', title: 'The return', detail: 'The screen visual appears to discharge back toward the product position. A hard audio hit lands with the drape release.' },
      { time: '01:10–01:25', title: 'The reveal', detail: 'The drape snaps upward on its track. The product is already lit. The LED path remains illuminated, connecting the guest’s position to the object.' },
      { time: '01:25–01:45', title: 'Hero hold', detail: 'The screen resolves to the official product identity. The camera pushes in for a clean hero shot.' },
    ],
    phases: ['DARK', 'TOUCH', 'PULSE', 'SCREEN', 'REVEAL'],
    tech: ['Capacitive touch surface', 'Pixel LED channel', 'Media server', 'Fast drape track', 'Live camera', 'Cue controller'],
    techDetail:
      'The console uses a capacitive sensor behind a translucent acrylic surface; its response is a programmed light animation, not a biometric read. The floor path uses individually addressable LED pixels in a protected channel. The drape runs on a theatrical track with a dedicated operator, mechanical stop and emergency release. A show-control cue links the touch, screen, lighting and drape, but the drape remains independently safety-controlled.',
    adaptation: {
      small: 'One continuous light path and a compact drape reveal. The sequence is short and intimate.',
      medium: 'The path branches across two scenic edges before entering the screen. The drape reveal is joined by a wider lighting change.',
      large: 'The pulse travels through the floor, scenic architecture and screen before the full stage transforms. The drape release is the final beat, not the only spectacle.',
    },
    feasibility:
      'The visible fast drape is the main risk. It must never be described as an explosive release, and the track must be engineered, tested and operated by a trained technician. The touch console must not imply biometric authentication.',
    mitigation:
      'If a fast drape is unsuitable, use a motorised roll-up fabric with a controlled acceleration curve, or a sliding scenic cover. The pulse-to-product story still works.',
    signature:
      'The three seconds when the pulse disappears into the screen and the audience waits to see where it will come out.',
    visualDirection:
      'Low, wide audience view. A single glowing palm console in the foreground, a thin line of teal light running across the dark stage toward a large screen. The product is mid-reveal behind a rising drape, hard white beam from above, haze visible in the beam. The scene feels precise, not science fiction.',
    scores: { originality: 7, wow: 8, readability: 9, complexity: 5, adaptability: 9, guest: 9, photo: 7 },
  },
  {
    id: 'cargo',
    index: '03',
    name: 'THE CARGO VAULT',
    scene: 'cargo',
    mechanism: 'Controlled mechanical burst',
    proposition: 'The shipment becomes the stage.',
    tagline: 'A sealed vault opens with mechanical force, and the object inside becomes the hero.',
    complexity: 'Medium–high',
    accent: '#C9A86A',
    sizeLabel: '2×2 · 4×4 · 6×6 FT',
    productSize: 3.4,
    camera: { pos: [0, 4.4, 14], target: [0, 1.9, 0] },
    audience:
      'A monumental cargo vault stands centre stage, locked and unopened. An arrival film plays on the main screen: abstract coordinates, a convoy moving through darkness, a container being secured. The chief guest turns a machined release handle. The vault’s lock lights change from amber to white, one by one. A deep mechanical tone fills the room. Low fog spills from beneath the doors. Then all four walls swing outward in a controlled burst, and the product is revealed inside, lit from above.',
    hook: 'The packaging is not packaging. It is the reveal mechanism.',
    stageDesign:
      'A large scenic cargo vault sits on a low turntable or fixed plinth at centre stage. Its exterior is intentionally adaptable: rugged industrial, clean-tech containment, or a monumental black government vault. The interior is a finished display chamber with a top light, product plinth and removable service panels.',
    concealment:
      'Four independent scenic walls close flush around the product. The roof is a separate light box. The audience sees a sealed volume, not a draped object.',
    guest:
      'The chief guest turns a heavy machined release handle on the vault’s face. A second operator confirms the cue. The handle is a ceremonial input; the panels are moved by a supervised scenic controller.',
    sequence: [
      { time: '00:00–00:20', title: 'The sealed shipment', detail: 'The vault stands alone. A single overhead beam isolates it. The screen shows abstract arrival data, never invented product claims.' },
      { time: '00:20–00:45', title: 'The story of the cargo', detail: 'A short film frames the product as a significant arrival. The vault’s lock lights remain amber.' },
      { time: '00:45–00:55', title: 'Release', detail: 'The guest turns the handle. The lock lights step from amber to white. A low mechanical tone builds.' },
      { time: '00:55–01:05', title: 'The burst', detail: 'The four walls release in sequence within a single beat. Fog spills outward. Impact sound lands exactly as the walls reach their open position.' },
      { time: '01:05–01:20', title: 'Inside the vault', detail: 'The product is already lit inside. The vault interior becomes the display plinth. The audience sees the object framed by the open structure.' },
      { time: '01:20–01:40', title: 'The hero frame', detail: 'The screen shows the official identity. The open vault becomes the photographic frame. The guest stands beside the product.' },
    ],
    phases: ['SEALED', 'ARRIVAL', 'RELEASE', 'BURST', 'HERO'],
    tech: ['Scenic vault structure', 'Motorised or pneumatic panels', 'Position sensors', 'Low-lying fog', 'Impact audio', 'Show control'],
    techDetail:
      'The vault is a lightweight steel-and-plywood scenic shell with four independently hinged walls. Each wall is driven by a motor or pneumatic actuator with a mechanical stop, position feedback and a controlled acceleration profile. The panels do not fly; they open through a verified arc. Fog is low-lying and water-based. A dedicated vault operator controls movement, with emergency stop and manual release.',
    adaptation: {
      small: 'A compact containment case with two or four opening faces. The object is revealed at close range.',
      medium: 'A larger vault with a mapped exterior. The outer skin appears to destabilise digitally before the panels move.',
      large: 'The full cargo vault. Four walls open, fog spills, and the product may rise on an independent platform inside the vault after the walls are clear.',
    },
    feasibility:
      'The opening envelope is the critical constraint. Each wall needs clear space and the audience needs protection from any moving edge. The structure must be stable with all walls open, and the product must be serviceable from the rear.',
    mitigation:
      'If four moving walls are too complex, use two opposing doors and a fixed roof, or a static open frame with a fast retractable front cover. The cargo identity remains.',
    signature:
      'The single beat when all four walls reach open and the fog rolls out under the product. The object appears to have been inside a sealed shipment all along.',
    visualDirection:
      'Wide, low camera. A large black cargo vault with brass locking bars and amber lock lights, four walls caught mid-open. Fog pours across the stage floor. The product is lit inside the vault, warm key light against cold haze. The screen behind shows a restrained technical pattern.',
    scores: { originality: 9, wow: 9, readability: 10, complexity: 7, adaptability: 7, guest: 8, photo: 10 },
  },
  {
    id: 'ascension',
    index: '04',
    name: 'THE ASCENSION',
    scene: 'ascension',
    mechanism: 'Hydraulic rise through atmosphere',
    proposition: 'The product rises; the stage appears to exhale.',
    tagline: 'An empty stage, a circle of light, and an object coming up through the floor.',
    complexity: 'High',
    accent: '#8FD8D2',
    sizeLabel: '6×6 FT FOCUS',
    productSize: 4,
    camera: { pos: [0, 4.4, 15], target: [0, 2.1, 0] },
    audience:
      'The stage appears empty. A perfect circle of light opens on the floor. Low-frequency sound builds until the audience feels it in the room. Fog begins to roll out of the circle, then the platform rises: slow, mechanical, certain. The product emerges through the fog into a vertical beam. At the top of the travel, the platform locks and the screen snaps to the product identity. The audience sees the object exactly where, seconds earlier, there was nothing.',
    hook: 'The product does not enter from the wings. It comes from beneath the stage.',
    stageDesign:
      'A temporary raised stage with a certified lift pit at centre. A circular aperture with a lit perimeter ring sits flush with the stage floor. The lift platform carries a low display plinth. A vertical beam and a rear LED wall frame the ascent.',
    concealment:
      'The product is pre-loaded on the lift below stage level, under a closed aperture cover. The audience sees a flat stage until the cover retracts.',
    guest:
      'The chief guest places a hand on a small illuminated plinth at the stage edge. This arms the cue. The lift itself is executed by a certified operator; the guest’s action releases the moment, not the hydraulics.',
    sequence: [
      { time: '00:00–00:15', title: 'The empty stage', detail: 'No product, no drape, no box. A single circular line appears on the floor.' },
      { time: '00:15–00:35', title: 'The build', detail: 'Low-frequency audio grows. Atmospheric haze catches a vertical beam. The circle brightens.' },
      { time: '00:35–00:45', title: 'The guest arms the cue', detail: 'The guest places a hand on the illuminated plinth. A confirmation tone sounds. The lift operator receives the cue.' },
      { time: '00:45–01:05', title: 'The rise', detail: 'The aperture cover retracts. Fog spills. The platform rises at a slow, verified speed, product already on board.' },
      { time: '01:05–01:20', title: 'The lock', detail: 'The platform reaches its stop. The product is held in the vertical beam. The screen changes to the official identity.' },
      { time: '01:20–01:40', title: 'The hero hold', detail: 'The guest is invited to the product. The stage remains clean, with the lift as the only architecture.' },
    ],
    phases: ['EMPTY', 'BUILD', 'ARM', 'RISE', 'LOCK'],
    tech: ['Certified stage lift', 'Structural platform', 'Aperture cover', 'Interlocks', 'Edge protection', 'Low fog'],
    techDetail:
      'The lift is a certified theatrical or industrial lift with a rated load, position feedback, mechanical stops, interlocks and an independent operator. The stage structure is engineered for the lift load and the audience load. The aperture cover is interlocked so the lift cannot move until the cover is clear. A rescue plan and manual lowering system are mandatory.',
    adaptation: {
      small: 'A compact lift with a small aperture and a short travel. The product rises to stage level rather than above it.',
      medium: 'A larger platform with a taller reveal and a wider fog ring. The screen opens to a full product story.',
      large: 'The full 6×6-ft lift, with a deep pit, a high travel and a complete stage transformation. This is the finale.',
    },
    feasibility:
      'This is the highest-risk concept in the deck. It requires exact product mass, centre of gravity, footprint, lifting height, stage load capacity, venue approval and a certified lift contractor. It cannot be priced or promised without those inputs.',
    mitigation:
      'If a lift is not feasible, the same audience experience can be created with a low scissor platform behind a retractable floor cover, or a stationary product revealed by a rising circular scenic ring and fog. The vertical reveal language survives.',
    signature:
      'The product breaking through the fog into the beam. The audience sees it rise from a stage that was empty a moment ago.',
    visualDirection:
      'Front-on, slightly low camera. A dark stage with a circular aperture of teal light, fog rolling outward. A square product on a rising platform is halfway through the floor, lit by a vertical white beam. The screen behind is almost black with a faint technical contour.',
    scores: { originality: 8, wow: 9, readability: 10, complexity: 9, adaptability: 7, guest: 7, photo: 9 },
  },
  {
    id: 'veil',
    index: '05',
    name: 'THE DIGITAL VEIL',
    scene: 'veil',
    mechanism: 'Projection cocoon',
    proposition: 'A world made of light lifts away.',
    tagline: 'The product is hidden inside a moving image that is physically removed.',
    complexity: 'Medium–high',
    accent: '#6FE7D8',
    sizeLabel: '4×4 FT FOCUS',
    productSize: 3.2,
    camera: { pos: [0, 4.4, 14.6], target: [0, 2.45, 0] },
    audience:
      'A tall cylindrical surface stands at centre stage, dark at first. Then abstract lines begin to wrap around it: contour maps, engineering grids, a slow topographic pulse. The cylinder becomes a moving world. The visuals accelerate. The chief guest draws a circle on a touch ring, and the cylinder lifts straight up, taking the entire image with it. The product is standing underneath, lit and completely still. The screen behind takes over the explanation.',
    hook: 'The reveal is not a curtain. It is an entire projected world being lifted off the object.',
    stageDesign:
      'A cylindrical projection scrim surrounds the product on a low plinth. The scrim is a lightweight frame with a high-gain projection surface, suspended from a tracked or hoisted ring. Projectors are concealed upstage. The main LED wall sits behind the cylinder.',
    concealment:
      'The cylinder is opaque enough under projection to hide the product. It is not a glass box; it is a controlled projection surface with a known seam and viewing angle.',
    guest:
      'The guest completes a circle on a luminous touch ring. The gesture is simple and symbolic: the last line of the circle closes, and the cylinder begins to rise.',
    sequence: [
      { time: '00:00–00:15', title: 'The dark cylinder', detail: 'A tall cylindrical form stands in darkness. The audience does not know whether it is a screen, a sculpture or a container.' },
      { time: '00:15–00:45', title: 'The world appears', detail: 'Projected lines and contours wrap around the surface. The cylinder appears to rotate even though it is static.' },
      { time: '00:45–01:00', title: 'The acceleration', detail: 'The mapping becomes denser and faster. Audio builds. The product story is told through abstract systems, not fabricated claims.' },
      { time: '01:00–01:10', title: 'The circle closes', detail: 'The guest draws a circle on the touch ring. The projected world freezes for a beat, then the cylinder lift begins.' },
      { time: '01:10–01:30', title: 'The lift', detail: 'The cylinder rises on its ring, carrying the image upward. The product is exposed from the base up. Fog catches the light.' },
      { time: '01:30–01:50', title: 'The object', detail: 'The cylinder locks overhead as a luminous ring. The product stands in a clean hero light.' },
    ],
    phases: ['DARK', 'MAPPING', 'ACCELERATE', 'CIRCLE', 'LIFT'],
    tech: ['Projection mapping', 'Cylindrical scrim', 'Hoisted or tracked ring', 'Brightness-matched projectors', 'Touch ring', 'Media server'],
    techDetail:
      'The cylinder is a purpose-built projection surface on an aluminium frame, with a seam positioned away from the main viewing axis. Two or more high-brightness projectors are blended and mapped to the curved surface. The lifting ring is operated by a certified hoist or counterweight track. The touch ring is a capacitive input, not a hologram.',
    adaptation: {
      small: 'A low cocoon around a 2×2-ft object. The cylinder lifts only enough to expose the product.',
      medium: 'A full-height cylinder with a wider projected world and a more dramatic lift.',
      large: 'A monumental 6×6-ft cocoon. The cylinder rises to become an overhead ring, and the full screen behind takes over the product story.',
    },
    feasibility:
      'Projector brightness, ambient light, surface gain, seam placement and sightlines from the sides must be tested. The lifting ring needs ceiling clearance and certified rigging. The product must be placed and serviced without disturbing the cylinder.',
    mitigation:
      'If projection on a cylinder is inconsistent, use a lightweight scenic cylinder with embedded LED strips and a matte surface. If the lift is not possible, split the cylinder into two retracting halves.',
    signature:
      'The projected world rising off the product in one continuous vertical move. The image does not fade; it physically leaves.',
    visualDirection:
      'Wide audience view. A tall cylinder of pale teal light wrapped in fine contour lines, lifting above a square product. The product is lit from below and behind. The stage floor is wet-black with haze. The main screen is a faint grid.',
    scores: { originality: 8, wow: 8, readability: 8, complexity: 7, adaptability: 9, guest: 8, photo: 8 },
  },
  {
    id: 'sculpture',
    index: '06',
    name: 'THE LIGHT SCULPTURE',
    scene: 'sculpture',
    mechanism: 'Programmable LED outline',
    proposition: 'First a drawing in light. Then the object.',
    tagline: 'A luminous skeleton sketches an unknown form, then moves aside.',
    complexity: 'Low–medium',
    accent: '#6FE7D8',
    sizeLabel: '2×2 · 4×4 FT',
    productSize: 3,
    camera: { pos: [0, 3.8, 12.8], target: [0, 1.8, 0] },
    audience:
      'The stage is dark except for a few floating lines of light. Segment by segment, the lines trace an abstract three-dimensional form around the concealed product. The audience sees a sculpture made of light before it sees the object. When the last segment connects, the sculpture holds for a beat. Then its frames pivot and slide aside, and a matte cover retracts. The product is there, surrounded by the afterimage of the drawing.',
    hook: 'The audience sees the product as a drawing before they see it as an object.',
    stageDesign:
      'A set of rigid aluminium frames carrying addressable LED neon-flex, arranged around the product position. The frames are mounted on pivots or short tracks so they can move clear. A separate matte cover conceals the product until the final beat.',
    concealment:
      'A low matte scenic cover behind the light sculpture. The LED frames are the visual foreground; the cover is the physical barrier.',
    guest:
      'The chief guest sweeps a hand along a luminous control bar. The gesture completes the last line of the sculpture. It is intuitive, non-technical and visually connected to the drawing.',
    sequence: [
      { time: '00:00–00:15', title: 'A few lines', detail: 'The stage is dark. Isolated LED segments hover in space, not yet forming a shape.' },
      { time: '00:15–00:45', title: 'The drawing', detail: 'Segments illuminate in sequence, tracing an abstract volume. The screen shows related engineering motifs.' },
      { time: '00:45–00:55', title: 'The hand', detail: 'The guest sweeps a hand along the control bar. The final segment connects. The sculpture holds.' },
      { time: '00:55–01:10', title: 'The frames move', detail: 'The LED frames pivot outward and slide aside. The matte cover retracts.' },
      { time: '01:10–01:25', title: 'The object', detail: 'The product is revealed under a clean light. The frames settle into a halo around it.' },
      { time: '01:25–01:40', title: 'The final composition', detail: 'The screen resolves to the official identity. The LED halo remains as a frame for photography.' },
    ],
    phases: ['LINES', 'DRAWING', 'HAND', 'FRAMES', 'OBJECT'],
    tech: ['LED neon-flex', 'Aluminium frames', 'DMX / pixel control', 'Pivots or short tracks', 'Matte cover', 'Show control'],
    techDetail:
      'The frames are lightweight aluminium profiles with LED neon-flex inset into the edges. Each frame is controlled as a pixel-mapped segment. Pivots or short tracks move the frames clear of the product. The cover is a separate motorised or manual scenic element. The system is comparatively simple, which makes it a strong mid-budget option.',
    adaptation: {
      small: 'A compact single frame that traces a tight form around the 2×2-ft product.',
      medium: 'A multi-frame sculpture with more complex geometry and a wider halo.',
      large: 'A large arch or cage of light around the 6×6-ft product, with frames that fold outward like petals.',
    },
    feasibility:
      'Do not claim the outline is the exact product geometry until the product is known. The sculpture should be abstract and symbolic. The frames must be stable, cable-managed and clear of the product during movement.',
    mitigation:
      'If moving frames are difficult, keep the frames static and retract the product cover behind them. The light drawing remains the signature.',
    signature:
      'The last LED segment connecting and the sculpture holding for a beat before it moves. The audience realises the drawing has a body behind it.',
    visualDirection:
      'Dark stage, a luminous teal wireframe sculpture floating around a concealed centre, fine haze. The frames are beginning to pivot open. A matte black cover is just visible behind them. High contrast, precise, architectural.',
    scores: { originality: 8, wow: 8, readability: 8, complexity: 5, adaptability: 9, guest: 8, photo: 8 },
  },
  {
    id: 'drop',
    index: '07',
    name: 'THE DROP',
    scene: 'drop',
    mechanism: 'Theatrical cargo arrival',
    proposition: 'It arrives before it is revealed.',
    tagline: 'A cargo module descends from above, lands, and opens.',
    complexity: 'High',
    accent: '#C9A86A',
    sizeLabel: '4×4 FT FOCUS',
    productSize: 3.4,
    camera: { pos: [0, 4.7, 15.2], target: [0, 2.4, 0] },
    audience:
      'The auditorium hears the low sound of an approaching aircraft. The screen shows an abstract aerial delivery sequence: coordinates, altitude, a shape moving through cloud. A cargo module appears to descend from above, held in a shaft of light. It lands with a deep impact. Fog spreads. The module’s doors release and open, and the product is inside.',
    hook: 'The product is delivered as cargo, not presented as a product.',
    stageDesign:
      'A scenic cargo module suspended from certified rigging over a marked landing zone at centre stage, or a static module with a simulated descent. The module has opening doors and an internal product display. The screen carries the arrival film.',
    concealment:
      'The module itself. The product is loaded inside before the event and serviced from the rear. The audience sees a sealed shipment.',
    guest:
      'The chief guest turns a release key on a small control pedestal. The descent begins only after the rigging operator confirms the cue. The guest’s action starts the sequence; the rigging remains under dedicated control.',
    sequence: [
      { time: '00:00–00:15', title: 'Approach', detail: 'Low aircraft sound. The screen shows an abstract delivery path. A spotlight finds an empty landing zone.' },
      { time: '00:15–00:45', title: 'Descent', detail: 'The cargo module lowers through the beam on certified rigging. The audience sees it arrive before they know what is inside.' },
      { time: '00:45–00:55', title: 'Landing', detail: 'The module meets the stage. A deep impact sound and a lighting ripple. Fog spreads from the base.' },
      { time: '00:55–01:05', title: 'Release', detail: 'The guest turns the release key. The module’s locks disengage in sequence.' },
      { time: '01:05–01:20', title: 'The doors', detail: 'The doors open to reveal the product inside, lit by an internal top light.' },
      { time: '01:20–01:40', title: 'The hero', detail: 'The module becomes the photographic frame. The guest stands beside the open cargo.' },
    ],
    phases: ['APPROACH', 'DESCENT', 'LAND', 'RELEASE', 'DOORS'],
    tech: ['Certified theatrical hoist', 'Scenic cargo module', 'Opening doors', 'Impact audio', 'Fog', 'Rigging control'],
    techDetail:
      'The module is a lightweight scenic shell flown on a certified theatrical hoist with a dedicated rigging operator, secondary safety line and controlled descent profile. The product should not be suspended with the module. The module is lowered empty to the landing zone, or the product is pre-loaded only if the combined load is fully certified. The doors are motorised or pneumatic with mechanical stops.',
    adaptation: {
      small: 'A compact drop case with a short descent and a single front door.',
      medium: 'A larger crate with two doors and a stronger arrival film.',
      large: 'The full cargo module. The descent is the opening spectacle; the opening doors are the second beat.',
    },
    feasibility:
      'Never suspend an unverified product over an audience. The default is a static module with a video-simulated descent. A flown module requires certified rigging points, load calculations, venue approval and a dedicated operator.',
    mitigation:
      'If rigging is not available, the module can be revealed behind a rising screen while the arrival film creates the illusion of descent. The cargo identity is preserved without aerial risk.',
    signature:
      'The module hitting the stage and the impact rolling through the room. The audience feels the arrival.',
    visualDirection:
      'Wide, low view. A dark cargo module suspended in a vertical shaft of light, cables catching the beam. Fog at stage level. The screen behind shows a faint aerial map. The audience sees the underside of the module and the landing zone.',
    scores: { originality: 8, wow: 9, readability: 8, complexity: 9, adaptability: 6, guest: 7, photo: 8 },
  },
  {
    id: 'phantom',
    index: '08',
    name: 'THE PHANTOM',
    scene: 'phantom',
    mechanism: 'Pepper’s Ghost theatre',
    proposition: 'A ghost introduces the real thing.',
    tagline: 'A floating visual appears, then dissolves into the physical product.',
    complexity: 'High',
    accent: '#8FD8D2',
    sizeLabel: '2×2 FT FOCUS',
    productSize: 2.4,
    camera: { pos: [0, 3.7, 11.5], target: [0, 1.8, 0] },
    audience:
      'A black chamber stands at centre stage. Inside it, a luminous emblem appears to float in midair. The audience can see through the chamber but not what is behind it. The emblem rotates, breaks into particles and reassembles. The presenter connects the symbol to the product story. The illusion fades, a panel retracts, and the physical product is revealed in the same sightline. A live camera gives the back of the room a close view.',
    hook: 'The audience sees a digital object floating in space, then discovers the real object behind it.',
    stageDesign:
      'A darkened scenic chamber with a transparent reflective panel at approximately 45 degrees. A concealed source display sits below or behind the viewing plane. The product is in a separate chamber behind the illusion, revealed by a retracting panel. A camera captures the illusion for IMAG.',
    concealment:
      'The product is behind the reflective chamber and a retracting scenic panel. The reflective surface is angled so the audience sees the floating image, not the product.',
    guest:
      'The chief guest presses a luminous seal on the chamber’s frame. The floating emblem responds by assembling into a complete form. The gesture is simple and ceremonial.',
    sequence: [
      { time: '00:00–00:15', title: 'The dark chamber', detail: 'A black architectural chamber. A faint reflective surface catches the light. The product is hidden.' },
      { time: '00:15–00:40', title: 'The apparition', detail: 'A luminous emblem appears to float inside the chamber. It rotates and breaks into particles.' },
      { time: '00:40–00:55', title: 'The seal', detail: 'The guest presses the luminous seal. The particles reassemble into a complete symbol.' },
      { time: '00:55–01:10', title: 'The dissolve', detail: 'The illusion fades. The reflective panel dims and a scenic panel behind it retracts.' },
      { time: '01:10–01:25', title: 'The physical object', detail: 'The product is revealed in the same central sightline, lit from above.' },
      { time: '01:25–01:45', title: 'The camera', detail: 'A live camera pushes in on the product. The screen shows the hero shot.' },
    ],
    phases: ['CHAMBER', 'APPARITION', 'SEAL', 'DISSOLVE', 'OBJECT'],
    tech: ['Reflective foil or glass', 'Concealed source display', 'Black masking', 'Retracting scenic panel', 'Live camera', 'Light control'],
    techDetail:
      'The illusion uses a transparent reflective surface at roughly 45 degrees and a concealed high-brightness source display. The chamber is masked in matte black so only the reflected image is visible. The product sits in a separate plane behind the illusion. A camera captures the chamber for the main screen. This is a Pepper’s Ghost optical effect, not a true hologram.',
    adaptation: {
      small: 'A compact chamber for the 2×2-ft product, with a close camera feed.',
      medium: 'A larger chamber with a taller illusion and a wider product reveal.',
      large: 'A large-format optical installation for the 6×6-ft product, or a smaller chamber with a cinematic IMAG feed for the audience.',
    },
    feasibility:
      'A small glass box will not read for 2,000 people across a wide auditorium. The illusion needs a large-format installation or a camera feed. Brightness, sightlines and ambient light are critical. The reflective surface must be clean and precisely aligned.',
    mitigation:
      'If a large installation is not possible, use a compact chamber with a live camera and accept that most of the audience experiences the illusion on screen. The physical reveal still happens onstage.',
    signature:
      'The floating object dissolving and the real product occupying the same visual space a moment later.',
    visualDirection:
      'Dark chamber, a floating teal geometric emblem in midair, fine particles. An angled reflective panel is just visible. Behind it, a product silhouette begins to emerge as a panel retracts. A camera rig frames the chamber. High contrast, intimate scale.',
    scores: { originality: 9, wow: 8, readability: 5, complexity: 8, adaptability: 7, guest: 7, photo: 7 },
  },
  {
    id: 'stageproduct',
    index: '09',
    name: 'THE STAGE IS THE PRODUCT',
    scene: 'stageproduct',
    mechanism: 'Whole-stage product mockup',
    proposition: 'The set is the product at monumental scale.',
    tagline: 'The entire stage becomes an oversized abstraction of the object, and the object emerges from inside it.',
    complexity: 'High',
    accent: '#C9A86A',
    sizeLabel: '6×6 FT FOCUS',
    productSize: 3,
    camera: { pos: [0, 4.8, 16], target: [0, 2.1, 0] },
    audience:
      'At first the stage looks like an abstract architectural set: large geometric planes, a central axis, illuminated channels. The presenter gradually reveals that the set is an oversized representation of the product’s structure. Screen content labels each part. Then a central bay opens and the actual product emerges from within the giant form. The final wide shot connects the small physical object to the monumental set around it.',
    hook: 'The set is not a backdrop. It is the product drawn at the scale of the room.',
    stageDesign:
      'A modular scenic environment built as an enlarged abstract motif derived from the product category or approved imagery. Large flats, illuminated channels and a central product bay. The design must work as a symbolic representation, not a literal claim.',
    concealment:
      'The central product bay is integrated into the giant motif. The product is hidden inside the architecture and revealed when the central section opens.',
    guest:
      'The chief guest inserts a machined “core” module into a console at the centre of the stage. The final piece completes the motif, and the product bay opens.',
    sequence: [
      { time: '00:00–00:20', title: 'An abstract set', detail: 'The stage is a large geometric composition. It reads as a designed environment, not a product.' },
      { time: '00:20–00:55', title: 'The connection', detail: 'The presenter reveals that the set echoes the product’s structure. The screen labels abstract parts without inventing specifications.' },
      { time: '00:55–01:05', title: 'The core', detail: 'The guest inserts the core module. The set’s channels illuminate in sequence.' },
      { time: '01:05–01:20', title: 'The bay', detail: 'The central section opens. The product is inside, lit at the scale of the room.' },
      { time: '01:20–01:35', title: 'The wide shot', detail: 'The camera pulls back. The product and the huge set are held in one composition.' },
      { time: '01:35–01:55', title: 'The hero', detail: 'The screen resolves to the official identity. The set remains as the product’s monumental portrait.' },
    ],
    phases: ['SET', 'CONNECTION', 'CORE', 'BAY', 'WIDE'],
    tech: ['Modular scenic flats', 'LED channels', 'Mapped surfaces', 'Central bay', 'Show control', 'Lighting'],
    techDetail:
      'The set is built from modular scenic flats with integrated LED channels and projection-ready surfaces. The central bay is a separate structural opening with a retracting cover. The design must be approved as a symbolic abstraction of the product. No literal technical claims are made by the set alone.',
    adaptation: {
      small: 'A single oversized detail of the product form, with the 2×2-ft object at its centre.',
      medium: 'A larger sectional representation with more of the product’s structure abstracted.',
      large: 'The full stage becomes the product portrait. The 6×6-ft object emerges from the central axis.',
    },
    feasibility:
      'This concept depends on having enough product identity to create a meaningful abstraction. Without it, the set risks becoming generic. The central bay and the scenic structure must be integrated early.',
    mitigation:
      'If the product cannot be represented, use a symbolic “system” motif based on the product category, and make the connection explicit in the presenter’s script rather than in literal imagery.',
    signature:
      'The camera pulling back to reveal that the tiny product and the entire stage share the same geometry.',
    visualDirection:
      'Very wide symmetrical shot. A monumental abstract architectural set in black and brass, with a central lit bay holding a small square product. Fine brass lines trace the set’s geometry. The audience is dwarfed by the scale.',
    scores: { originality: 9, wow: 8, readability: 8, complexity: 7, adaptability: 6, guest: 6, photo: 10 },
  },
  {
    id: 'laser',
    index: '10',
    name: 'THE LASER DRAW',
    scene: 'laser',
    mechanism: 'Light draws the launch',
    proposition: 'The product is sketched in the air.',
    tagline: 'Controlled beams draw a portal in the haze, and the portal opens.',
    complexity: 'Medium–high',
    accent: '#6FE7D8',
    sizeLabel: '4×4 FT FOCUS',
    productSize: 2.8,
    camera: { pos: [0, 4.2, 13.5], target: [0, 1.9, 0] },
    audience:
      'The stage is dark and hazy. A single beam appears, then another, drawing thin geometric lines in the air. The lines build into a portal around the concealed product. The audience watches a door being sketched out of light. The last beam completes the frame. The lasers cut, and a physical scenic portal opens, revealing the product already lit inside.',
    hook: 'The portal is drawn in light before it exists in space.',
    stageDesign:
      'A haze-managed stage with professional laser projectors positioned to draw on the air and scenic surfaces. A physical scenic portal frames the concealed product. The portal opens on a controlled track. The main screen stays dark or minimal to preserve contrast.',
    concealment:
      'The product is behind a physical scenic portal and a matte cover. The lasers draw the outline of the portal, not the product itself.',
    guest:
      'The chief guest breaks a low-power visible beam with a hand. The interruption triggers the final drawing sequence. The beam is eye-safe and part of the show, not a scanning effect.',
    sequence: [
      { time: '00:00–00:15', title: 'First beam', detail: 'A single laser line appears in the haze. The stage is otherwise dark.' },
      { time: '00:15–00:45', title: 'The drawing', detail: 'More beams trace a geometric portal around the product position. The lines build in layers.' },
      { time: '00:45–00:55', title: 'The hand', detail: 'The guest breaks a low-power beam. The final lines snap into place.' },
      { time: '00:55–01:05', title: 'The cut', detail: 'The lasers cut out. The audience sees the completed portal for a beat.' },
      { time: '01:05–01:20', title: 'The opening', detail: 'The physical portal opens on its track. The product is revealed inside.' },
      { time: '01:20–01:40', title: 'The hero', detail: 'A final low-power beam frame surrounds the product without striking the audience.' },
    ],
    phases: ['BEAM', 'DRAW', 'HAND', 'CUT', 'OPEN'],
    tech: ['Professional laser projectors', 'Haze', 'Beam termination', 'Scenic portal', 'Interlocked show control', 'Certified operator'],
    techDetail:
      'The laser system is a professional show system with a certified operator, controlled beam paths and beam termination away from the audience. The show uses no audience scanning. The physical portal is a scenic frame with a retracting cover. The guest’s beam-break is a low-power, eye-safe sensor input.',
    adaptation: {
      small: 'A compact beam frame around the 2×2-ft product.',
      medium: 'A larger portal with more complex line work and a longer reveal.',
      large: 'A full-stage beam cage around the 6×6-ft product, with the physical portal opening inside it.',
    },
    feasibility:
      'Laser use requires venue approval, a certified operator, haze management and a beam path that never enters the audience. The physical portal must open cleanly without interrupting the beam path.',
    mitigation:
      'If lasers are restricted, use moving-head beams and projected line work. The drawn-portal language can be recreated with light without a laser.',
    signature:
      'The final beam completing the portal, then the lasers cutting to black and the physical portal opening.',
    visualDirection:
      'Dark, hazy stage. Thin teal laser lines sketching a rectangular portal around a concealed product. The lines converge at the corners. A low beam crosses the foreground. The physical portal is just beginning to open.',
    scores: { originality: 7, wow: 8, readability: 7, complexity: 6, adaptability: 8, guest: 9, photo: 8 },
  },
  {
    id: 'colour',
    index: '11',
    name: 'THE COLOUR RELEASE',
    scene: 'colour',
    mechanism: 'Instant colour transformation',
    proposition: 'The room changes colour at the speed of the reveal.',
    tagline: 'A monochrome ceremony becomes a full-colour celebration in one beat.',
    complexity: 'Low–medium',
    accent: '#D9A06A',
    sizeLabel: '4×4 FT FOCUS',
    productSize: 2.6,
    camera: { pos: [0, 3.9, 13], target: [0, 1.9, 0] },
    audience:
      'The event begins in a restrained monochrome world: white light, black stage, minimal graphics. The product is concealed behind a simple drape. The presenter tells the story without colour. At the cue, the guest presses a colour-coded pad. The drape retracts, the screen shifts from monochrome to the official palette, warm and cool lights snap on, and a controlled burst of colour and streamers lifts through the room. The product is revealed inside a completely transformed atmosphere.',
    hook: 'The reveal is not just the object. It is the entire room changing state.',
    stageDesign:
      'A neutral stage with a concealed product behind a theatrical drape. Confetti and streamer positions are rigged at the sides and front. The LED wall carries a monochrome visual system until the cue, then transitions to the approved palette. Lighting is programmed in two distinct states.',
    concealment:
      'A simple theatrical drape. The mechanism is intentionally familiar; the transformation is in the room, not the box.',
    guest:
      'The chief guest presses a colour-coded pad on the lectern. The pad is the last monochrome object in the room; when it lights, the palette releases.',
    sequence: [
      { time: '00:00–00:15', title: 'Monochrome', detail: 'The room is white, black and grey. The stage is restrained. The product is behind a plain drape.' },
      { time: '00:15–00:45', title: 'The story', detail: 'The presenter tells the product story in a minimal visual language. No colour is used.' },
      { time: '00:45–00:55', title: 'The pad', detail: 'The guest presses the colour pad. It illuminates in the first approved colour.' },
      { time: '00:55–01:05', title: 'The release', detail: 'The drape retracts. The screen shifts to the full palette. Lighting changes across the room.' },
      { time: '01:05–01:20', title: 'The burst', detail: 'Controlled confetti and streamers lift. The product is revealed under warm hero light.' },
      { time: '01:20–01:40', title: 'The hero', detail: 'The room settles into the official identity. The product is the clean centre of a colourful composition.' },
    ],
    phases: ['MONO', 'STORY', 'PAD', 'RELEASE', 'COLOUR'],
    tech: ['Theatrical drape', 'Confetti / streamers', 'LED wall', 'Colour lighting', 'Show control', 'Cleanup plan'],
    techDetail:
      'The drape is a conventional theatrical track with a controlled retract. Confetti and streamers use compressed-air or electric cannons with a known fall zone. The LED content and lighting are programmed as two distinct looks: monochrome and full palette. A cleanup plan is required before the next segment.',
    adaptation: {
      small: 'A compact drape and a tight confetti burst around the 2×2-ft product.',
      medium: 'A wider drape, a larger palette shift and a full-stage burst.',
      large: 'The 6×6-ft product revealed inside a room-wide colour transformation, with the largest safe burst.',
    },
    feasibility:
      'Confetti and streamers can contaminate the product, block sightlines and create cleanup problems. The product should be protected or positioned outside the fall zone. The effect must be tested with the venue’s fire and ventilation rules.',
    mitigation:
      'If confetti is not allowed, use lighting, projection and fabric colour changes only. The room still transforms; the celebration is cleaner.',
    signature:
      'The exact beat when the monochrome room becomes colour and the product appears. The contrast is the spectacle.',
    visualDirection:
      'Split-second composition: a monochrome stage with a plain drape mid-retract, and the first wave of colour and streamers entering the frame. The product is lit warm at the centre. The screen behind shifts from white line art to a full palette.',
    scores: { originality: 5, wow: 7, readability: 10, complexity: 3, adaptability: 10, guest: 8, photo: 9 },
  },
  {
    id: 'ignition',
    index: '12',
    name: 'THE IGNITION',
    scene: 'ignition',
    mechanism: 'Touch-to-stage activation',
    proposition: 'One touch. The entire stage wakes.',
    tagline: 'A palm on a luminous cube sends a signal through the stage and brings the product up from below.',
    complexity: 'Medium–high',
    accent: '#6FE7D8',
    sizeLabel: '4×4 FT FOCUS',
    productSize: 3,
    camera: { pos: [0, 4, 13.2], target: [0, 1.9, 0] },
    audience:
      'A single illuminated cube stands at the front of the stage. The chief guest places a palm on it. The cube lights from within. A pulse of light runs across the floor, climbs the stage architecture and enters the main screen. The screen wakes with a cinematic sequence. At the same time, the room lighting changes, fog rolls around the concealed product and a hydraulic platform begins to rise. The product emerges as if the touch had pulled it out of the floor.',
    hook: 'A human touch appears to power the entire stage.',
    stageDesign:
      'A touch cube on a low plinth at stage left, connected to a protected addressable LED channel in the floor. The channel runs to the main screen and to the product lift position. A certified lift is concealed under a temporary raised stage. Fog units are positioned around the aperture.',
    concealment:
      'The product is on a lift below stage level, covered by an aperture cover. The cube and the light path are the visible technology; the lift is hidden.',
    guest:
      'The chief guest places a palm flat on the cube. The cube responds with light. The touch requests a supervised show cue; it does not directly energise the hydraulic lift.',
    sequence: [
      { time: '00:00–00:15', title: 'Standby', detail: 'The cube glows softly. The product is concealed below the stage. The presenter introduces the product story.' },
      { time: '00:15–00:30', title: 'Palm detected', detail: 'The capacitive sensor confirms touch. The cube’s internal light intensifies. A confirmation tone sounds.' },
      { time: '00:30–00:45', title: 'Pulse travels', detail: 'A pixel-controlled pulse runs from the cube through the floor and into the screen.' },
      { time: '00:45–01:00', title: 'World awakens', detail: 'The screen plays the launch film. Stage lighting and audio change together. Fog begins to build around the aperture.' },
      { time: '01:00–01:20', title: 'Product ascends', detail: 'The show operator authorises the certified lift. The product rises through the fog into a vertical beam.' },
      { time: '01:20–01:35', title: 'Hero moment', detail: 'The lift reaches its verified stop. The official identity appears. A live camera holds the hero shot.' },
    ],
    phases: ['STANDBY', 'TOUCH', 'PULSE', 'AWAKEN', 'ASCEND'],
    tech: ['Capacitive touch cube', 'Pixel LED path', 'Media server', 'Certified lift', 'Fog', 'Show control'],
    techDetail:
      'The cube is a translucent acrylic shell with internal LEDs and a capacitive touch sensor. The LED path uses addressable pixels in a protected floor channel. The lift is a certified stage lift with position feedback, interlocks and a dedicated operator. The touch fires a show cue; the lift has its own safety controller. A camera captures the palm for the screen.',
    adaptation: {
      small: 'A single light path and a compact product lift. The sequence is short and precise.',
      medium: 'The path branches across scenic edges; the lift has a taller travel and a wider fog ring.',
      large: 'The full stage wakes. Multiple paths converge, the screen takes over and the 6×6-ft product rises as the finale.',
    },
    feasibility:
      'The lift is the main constraint: mass, centre of gravity, travel, stage structure and rescue plan. The cube must not imply biometric authentication. The visible pulse and the actual lift must be synchronized by show control but governed by separate safety systems.',
    mitigation:
      'If the lift is unsuitable, keep the touch, pulse and screen sequence and reveal the stationary product with a retracting cover and a lighting snap. The activation story remains intact.',
    signature:
      'The product breaking through the fog at the end of the light path, as if the guest’s touch had pulled it into the room.',
    visualDirection:
      'Low front view. A lone glowing cube at the front of a dark stage, a thin teal light path running across the floor into a huge screen. A square product is half-risen through a fog-filled aperture, lit by a vertical beam. Brass and teal accents.',
    scores: { originality: 8, wow: 9, readability: 10, complexity: 8, adaptability: 9, guest: 10, photo: 8 },
  },
  {
    id: 'kabuki',
    index: '13',
    name: 'THE KABUKI DROP',
    scene: 'kabuki',
    mechanism: 'Quick-release fabric drop',
    proposition: 'The fastest reveal in the room.',
    tagline: 'Eight solenoids let go and six metres of cloth is gone before the eye can follow it.',
    complexity: 'Low–medium',
    accent: '#E8D9B8',
    sizeLabel: '6×6 FT FOCUS',
    productSize: 3.6,
    camera: { pos: [0, 4.4, 16.2], target: [0, 2.4, 0] },
    audience:
      'The stage opens on a single hanging wall of warm cloth, floor to header, lit across its folds. The presenter speaks in front of it and nothing about the cloth suggests a mechanism. At the cue the release fires, the cloth drops in under a second and folds into a pool at the front of the stage. The product is already there, lit. The room registers the vanishing before it registers the product, which is the whole point: the fastest honest cut from concealment to hero.',
    hook: 'The room has been looking at a wall of cloth that is simply not there any more.',
    stageDesign:
      'A soft drop hangs from a steel header on eight quick-release clamps, dressing the full stage opening. Two side masts carry the header and are the only visible rigging. The product stands on a plinth directly behind the cloth, 250 mm clear of it. The floor in front of the drop is kept free of monitors, ramps and cable.',
    concealment:
      'The drop is cover and backdrop at once. It is hem-weighted so it falls straight instead of billowing, and it hangs clear of the plinth so the cloth never touches the product on the way down.',
    guest:
      'The chief guest presses one illuminated button on the lectern. The button arms the release; a stage operator fires the cue from the desk. Nothing depends on the guest’s timing, so a missed press cannot stall the show.',
    sequence: [
      { time: '00:00–00:20', title: 'Dressed', detail: 'A warm cloth wall fills the stage opening. Side light rakes the folds. The audience reads a finished backdrop.' },
      { time: '00:20–00:50', title: 'The story', detail: 'The presenter speaks in front of the drop. The screen is hidden behind the cloth, so the stage stays quiet and physical.' },
      { time: '00:50–01:00', title: 'Armed', detail: 'The guest presses the illuminated button. The clamps arm and the cue light turns amber at the desk.' },
      { time: '01:00–01:02', title: 'Release', detail: 'Eight solenoids fire on one cue. The cloth leaves the header and is on the floor in under a second.' },
      { time: '01:02–01:20', title: 'The product', detail: 'The product is standing in hard hero light. The pooled cloth becomes a soft foreground hem rather than waste.' },
      { time: '01:20–01:40', title: 'The hold', detail: 'The screen resolves to the official identity. The guest steps onto the pool line and holds for the photograph.' },
    ],
    phases: ['DRESSED', 'STORY', 'ARMED', 'RELEASE', 'HERO'],
    tech: ['Steel header', '8 quick-release clamps', 'Soft drop, 7.4 × 5.6 m', 'Hem weights', 'Cue light', 'Two-person dress team'],
    techDetail:
      'The drop hangs from a 7.4 m header on eight mechanical clamps, each released by a solenoid on a single cue. Release to floor takes 0.7–0.9 s. The cloth is roughly 12 kg, inherently flame-retardant and weighted at the hem so it collapses straight down instead of ballooning. The fall zone is kept clear for one metre in front of the plinth. Two stagehands dress and pin the cloth in about 40 seconds, so the effect can be reset for a rehearsal or a second show.',
    adaptation: {
      small: 'A narrower drop around the 2×2-ft product with a short fall and an intimate reveal.',
      medium: 'A full-width drop with side light and a slower build before the cue.',
      large: 'A double-height drop over the 6×6-ft product. The fall becomes the loudest single image of the evening and reads from the back row.',
    },
    feasibility:
      'The effect lives or dies on the fall zone: no monitors, no cable ramps and no presenter within one metre of the drop line. The header must be rated for the cloth weight plus shock, and the clamps need a secondary physical pin so an accidental cue cannot release the drop early. The cloth must be flame-retardant to venue standard.',
    mitigation:
      'If the venue will not allow a free-falling drop, the same cloth can fly upward on a counterweighted bar or part as a traveler. Reveal time rises from under a second to four or six seconds and nothing else in the design changes.',
    signature:
      'The half-second where the stage is neither covered nor revealed, and the cloth is already on the floor.',
    visualDirection:
      'Wide, symmetrical, eye-level. A warm off-white cloth fills the stage opening, raked by side light so the folds read. A dark header and two masts frame it. At the cue the cloth collapses into a pooled hem and the product stands in hard hero light.',
    scores: { originality: 4, wow: 6, readability: 10, complexity: 2, adaptability: 10, guest: 8, photo: 8 },
  },
  {
    id: 'flybar',
    index: '14',
    name: 'THE FLY BAR',
    scene: 'flybar',
    mechanism: 'Guided drape lift',
    proposition: 'The oldest reveal, done without a single visible mistake.',
    tagline: 'The hem leaves the floor first, so the product arrives from below like a sunrise.',
    complexity: 'Low–medium',
    accent: '#C9A86A',
    sizeLabel: '6×6 FT FOCUS',
    productSize: 3.0,
    camera: { pos: [0, 4.4, 16.6], target: [0, 2.5, 0] },
    audience:
      'A floor-to-header drape stands across the stage, its hem weighted on the deck. The presenter tells the story in front of it. At the cue the header climbs between two visible masts and the hem leaves the floor first: the product is exposed from the bottom up, shin then waist then shoulder, like a sunrise. The drape stops at trim as a valance above the stage and the product stands clear beneath it.',
    hook: 'Nothing drops, nothing splits. The cover simply rises, and it takes its time.',
    stageDesign:
      'A cloth drape hangs from a hoist-driven header that travels between two steel masts. The header is visible, the lift is visible and the travel is 2.6 m. The product sits on a plinth behind the cloth line, 300 mm clear of the fabric.',
    concealment:
      'The drape is the cover while the header sits low, hem on the deck. When the header reaches trim, the hem clears the product by 250 mm so the fabric never grazes the top of the object.',
    guest:
      'The chief guest lifts a brass lever on the lectern. The lever releases a cue, not the load: the two chain hoists are operated by a named technician who has rehearsed the move. The guest’s hand is the visible cause without becoming the safety risk.',
    sequence: [
      { time: '00:00–00:25', title: 'Dressed to the floor', detail: 'The drape stands floor to header. The hem is weighted on the deck and the fabric is lit from both sides.' },
      { time: '00:25–00:55', title: 'The story', detail: 'The presenter speaks in front of the cloth. A single brass line marks the lectern and the masts.' },
      { time: '00:55–01:05', title: 'The lever', detail: 'The guest lifts the brass lever. The cue light goes green at the fly rail.' },
      { time: '01:05–01:25', title: 'The lift', detail: 'The header climbs at 0.45 m per second. The hem leaves the deck and the product is exposed from the bottom up.' },
      { time: '01:25–01:40', title: 'The trim', detail: 'The header locks at 6 m. The drape reads as a valance and the product stands clear beneath it.' },
      { time: '01:40–02:00', title: 'The hold', detail: 'The screen resolves to the official identity. The valance frames the top of the shot.' },
    ],
    phases: ['DRESSED', 'STORY', 'LEVER', 'LIFT', 'HERO'],
    tech: ['Two steel masts', 'Chain-hoist header', 'Cloth drape, 7.8 × 3.4 m', 'Hem weights', 'Travel limit switches', 'Named operator'],
    techDetail:
      'The header runs in guides on two masts and is driven by two chain hoists, each with a mechanical brake and a limit switch. A single technician flies it on a marked cue with limit switches at both ends and a hard stop at trim. The drape is 3.4 m deep and weighted at the hem. The full travel is 2.6 m at 0.45 m per second, which is slow enough to read and fast enough to hold a room.',
    adaptation: {
      small: 'A lower header and a shorter travel around the 2×2-ft product.',
      medium: 'A full-width drape with a two-stage lift and a pause at half trim.',
      large: 'A double-height drape over the 6×6-ft product. The long lift becomes a deliberate, ceremonial reveal rather than a quick one.',
    },
    feasibility:
      'The masts carry the whole load and must be tied to the deck and braced against side pull. The header needs limit switches and a physical hard stop, because a runaway fly is the one failure this effect cannot hide. The hem must clear the product by at least 150 mm at trim.',
    mitigation:
      'If the venue has a certified fly system, the drape can hang on a house bar instead of masts and the lift travel increases. If rigging is unavailable, the same drape can be dressed to one side and pulled clear by two operators, though the sunrise effect is lost.',
    signature:
      'The hem leaving the deck: the product appears feet first, and the room fills in the reveal from the bottom of the frame.',
    visualDirection:
      'Wide, slightly low angle. A pale drape floor to header, lit hard from one side so the folds read as a wall. Two dark masts frame the composition. The header is caught mid-lift with the hem clearing the product’s base.',
    scores: { originality: 5, wow: 6, readability: 10, complexity: 2, adaptability: 10, guest: 8, photo: 8 },
  },
  {
    id: 'traveler',
    index: '15',
    name: 'THE TRAVELER',
    scene: 'traveler',
    mechanism: 'Parting curtain on a track',
    proposition: 'Two panels, one line of light, no ambiguity.',
    tagline: 'The curtain parts from the centre and keeps gathering until the stage is twice as wide.',
    complexity: 'Low',
    accent: '#6FE7D8',
    sizeLabel: '2×2 · 4×4 · 6×6 FT',
    productSize: 3.0,
    camera: { pos: [0, 4.2, 15.8], target: [0, 2.4, 0] },
    audience:
      'Two heavy curtain panels meet at the centre of the stage, overlapping by 300 mm so no seam of light escapes between them. The presenter stands in front of them and the audience reads a closed theatre. At the cue the track motors start and the panels part from the centre, gathering as they travel, until the stage is twice as wide as it was. The product is revealed progressively from the middle outward: the most legible reveal in theatre.',
    hook: 'The stage opens like a pair of hands, and it does not stop until the room is wide.',
    stageDesign:
      'A pipe track spans the proscenium with two carriers. Two pleated panels hang from the carriers with a 300 mm centre overlap. The product sits on a plinth at centre, behind the curtain line, with a clear 1.2 m gap so the fabric never catches the object as it gathers.',
    concealment:
      'The overlap is the whole trick. The two panels close with no gap, no light leak and no visible mechanism, so the audience reads a solid wall of cloth rather than a pair of doors.',
    guest:
      'The chief guest draws a short brass baton across a sensor on the lectern. The gesture reads as pulling the curtain, while the track motors run from the show controller with an operator holding a dead-man switch.',
    sequence: [
      { time: '00:00–00:20', title: 'Closed house', detail: 'Two heavy panels meet at centre with a 300 mm overlap. Only the fold highlights show.' },
      { time: '00:20–00:50', title: 'The story', detail: 'The presenter works in front of the cloth. The stage reads as a theatre, not a product box.' },
      { time: '00:50–01:00', title: 'The baton', detail: 'The guest draws the brass baton. The carriers release and the motors take up the load.' },
      { time: '01:00–01:25', title: 'The part', detail: 'The panels separate from the centre and gather as they travel. The product is exposed from the middle outward.' },
      { time: '01:25–01:40', title: 'The width', detail: 'The panels reach the wings and stack. The stage is open to its full width for the first time.' },
      { time: '01:40–02:00', title: 'The hold', detail: 'The screen resolves to the official identity. The gathered wings frame the shot.' },
    ],
    phases: ['CLOSED', 'STORY', 'BATON', 'PART', 'HERO'],
    tech: ['Pipe track', 'Two carriers', 'Motorised drive', 'Pleated panels', 'Centre overlap', 'Dead-man control'],
    techDetail:
      'A pipe track spans the opening with two motorised carriers. The panels are pleated, lined and weighted at the hem so they hang dead straight. The carriers travel at 0.5 m per second and gather the panels to roughly 38 percent of their closed width. The overlap is 300 mm and is maintained by a guide pin until the panels are fully closed. An operator holds a dead-man switch, so releasing it stops the travel.',
    adaptation: {
      small: 'A narrow proscenium pair around the 2×2-ft product, with a short travel and a tight reveal.',
      medium: 'A full-width pair with a slower part and a deliberate pause at half open.',
      large: 'A double-height pair over the 6×6-ft product. The travel and gather become the event’s main stage move.',
    },
    feasibility:
      'The track must be level, the carriers rated for the panel weight and the overlap maintained at the closed position. The gathering stack needs 1.1 m of wing space on each side. The panels must be flame-retardant and the track must have a manual release so the stage can be cleared if power drops.',
    mitigation:
      'If motorised carriers are unavailable, the same pair runs on a manual walk-along track with two operators, or on a single centre-pull line. The part is slower and less even but visually intact.',
    signature:
      'The first 200 mm of the part, when a vertical line of light appears where the audience had read a solid wall.',
    visualDirection:
      'Wide, symmetrical, eye-level. Two deep teal-lit curtain panels meet at centre, pleats reading as vertical ribs. A brass track and a thin line of light at the join. The panels are caught mid-part with a warm product glow appearing in the gap.',
    scores: { originality: 4, wow: 5, readability: 10, complexity: 2, adaptability: 10, guest: 7, photo: 8 },
  },
  {
    id: 'revolve',
    index: '16',
    name: 'THE REVOLVE',
    scene: 'revolve',
    mechanism: 'Rotating drum turntable',
    proposition: 'The room turns to face the product.',
    tagline: 'A sealed black drum rotates on its own axis and the aperture comes round.',
    complexity: 'Medium',
    accent: '#C9A86A',
    sizeLabel: '6×6 FT FOCUS',
    productSize: 3.4,
    camera: { pos: [0, 4.0, 14.6], target: [0, 2.0, 0] },
    audience:
      'A sealed black drum six metres across stands at centre stage, with one thin seam of light down its face. It reads as an object, not as packaging. At the cue the drum begins to turn on its own axis and a 2.4 m aperture comes round to face the room. The product is inside, lit, standing on the turntable. Nothing opens: the building turns to show you its inside.',
    hook: 'No panel moves. The whole structure rotates and presents its opening like a face.',
    stageDesign:
      'A matte-black cylindrical shell 4.6 m tall and 6.2 m across sits on a recessed turntable. The shell has one aperture and a continuous edge light. The product stands on the turntable inside, offset 500 mm so it lands on the centre line when the aperture faces front. The turntable is driven by a friction wheel with a mechanical index at both ends.',
    concealment:
      'The shell is opaque, sealed and seamless except for the aperture, which starts facing upstage. The audience sees a closed black drum for the whole first act, with only a thin seam of light betraying that it is not solid.',
    guest:
      'The chief guest turns a brass handle through a quarter turn on the lectern. The handle releases the turntable brake; the drive is controlled by the show operator and indexed to a physical stop at 180 degrees.',
    sequence: [
      { time: '00:00–00:20', title: 'The drum', detail: 'A sealed black cylinder stands at centre stage with a single seam of light. It reads as architecture.' },
      { time: '00:20–00:50', title: 'The story', detail: 'The presenter walks the edge of the drum. The seam glows and the stage stays still.' },
      { time: '00:50–01:00', title: 'The handle', detail: 'The guest turns the brass handle a quarter turn. The brake releases with a mechanical click.' },
      { time: '01:00–01:25', title: 'The turn', detail: 'The drum rotates 180 degrees. The aperture sweeps around and the interior light escapes before the product is visible.' },
      { time: '01:25–01:40', title: 'The aperture', detail: 'The drum indexes on its stop. The aperture faces the room and the product stands in its opening.' },
      { time: '01:40–02:00', title: 'The hold', detail: 'The screen resolves to the official identity. The drum becomes a circular frame around the product.' },
    ],
    phases: ['SEALED', 'STORY', 'HANDLE', 'TURN', 'HERO'],
    tech: ['Revolved scenic shell', 'Recessed turntable', 'Friction-wheel drive', 'Physical index stops', 'Edge lighting', 'Operator dead-man'],
    techDetail:
      'The shell is a revolved scenic flat built on a steel ring, skinned and finished matte black. It sits on a recessed turntable driven by a friction wheel, with a mechanical index at 0 and 180 degrees and a dead-man control at the desk. The full turn takes 20 seconds at constant speed. The aperture edges carry a continuous LED strip so the seam reads from the back of the room. The interior is lit independently and can be serviced through a hatch upstage.',
    adaptation: {
      small: 'A smaller drum around the 2×2-ft product, with a quarter turn instead of a half.',
      medium: 'A full drum with a 180-degree turn and a slower, more ceremonial speed.',
      large: 'A monumental drum around the 6×6-ft product. The turn becomes the signature image and the aperture frames the hero shot.',
    },
    feasibility:
      'The turntable must be recessed or ramped so the audience never sees a mechanism under the shell. The shell needs a clear swept radius of 3.4 m, which sets the minimum stage depth. The index stops must be physical, not encoder-only, and the drive must fail safe in the closed position.',
    mitigation:
      'If a recessed turntable is impossible, the shell can run on a visible circular track disguised as a scenic ring. If rotation is refused altogether, the same shell can travel laterally on a wagon and present the aperture by sliding rather than turning.',
    signature:
      'The aperture crossing the centre line: the interior light spills out a slit before the product is fully visible.',
    visualDirection:
      'Symmetrical, near eye-level. A matte black drum fills the centre of the stage, one vertical seam glowing brass. The shell is caught a third of the way through its turn, aperture just opening toward the room, product lit inside.',
    scores: { originality: 7, wow: 7, readability: 9, complexity: 5, adaptability: 8, guest: 6, photo: 9 },
  },
];

export interface LabIdea {
  name: string;
  family: string;
  line: string;
  status: string;
}

export const labIdeas: LabIdea[] = [
  {
    name: 'THE CONVERGENCE',
    family: 'Activation',
    line: 'Three dignitaries activate three consoles; separate light paths converge on one product.',
    status: 'Parked · strong for a collective ceremony',
  },
  {
    name: 'THE CORE',
    family: 'Activation',
    line: 'A transparent illuminated cube appears to power the entire stage from its centre.',
    status: 'Parked · overlaps The Ignition',
  },
  {
    name: 'THE ALIGNMENT',
    family: 'Mechanical',
    line: 'Illuminated rings or scenic panels rotate into alignment; the locked structure reveals the product.',
    status: 'Parked · strong mid-budget mechanical option',
  },
  {
    name: 'THE BREAKTHROUGH',
    family: 'Illusion',
    line: 'A solid wall appears to fracture through projection, then concealed panels physically open.',
    status: 'Parked · needs projection testing',
  },
  {
    name: 'THE IMPOSSIBLE ROOM',
    family: 'Illusion',
    line: 'An apparently empty room reconfigures its architecture to reveal the product already inside.',
    status: 'Explored · high engineering risk',
  },
  {
    name: 'THE LIVING BLUEPRINT',
    family: 'Digital',
    line: 'A wireframe assembles in midair, then the real product occupies the same position.',
    status: 'Explored · requires accurate product CAD',
  },
  {
    name: 'THE ZERO-G REVEAL',
    family: 'Kinetic',
    line: 'A suspended geometric sculpture moves into formation above the product, then opens.',
    status: 'Explored · rigging-intensive',
  },
  {
    name: 'THE DISAPPEARING SCREEN',
    family: 'Cinema',
    line: 'A full-height LED wall splits open at the exact point where a film appears to cross into the room.',
    status: 'Parked · premium screen-led option',
  },
  {
    name: 'THE LIVE CINEMA',
    family: 'Camera',
    line: 'Extreme close-ups of the hidden product build mystery; the camera pulls back as the stage lights snap on.',
    status: 'Parked · reliable, low-mechanical option',
  },
  {
    name: 'THE OPENING ORB',
    family: 'Mechanical',
    line: 'A faceted shell opens like petals around the product.',
    status: 'Parked · premium scenic fabrication',
  },
  {
    name: 'THE FLOATING REVEAL',
    family: 'Suspended',
    line: 'A luminous sphere appears to float above the product, then rises away.',
    status: 'Parked · needs rigging or controlled inflatable',
  },
  {
    name: 'THE INFLATABLE TRANSFORMATION',
    family: 'Inflatable',
    line: 'A flat scenic form inflates into a monumental sculpture, then peels back to expose the product.',
    status: 'Explored · custom fabrication',
  },
];

export const recommendedSlate = [
  {
    act: 'ACT I',
    scale: '2 × 2 FT',
    concept: 'THE UNSEEN',
    conceptId: 'unseen',
    role: 'Intimate opening',
    why: 'Establishes the language of a stage that withholds and reveals. Lower mechanical risk, high legibility, and a clean first chapter.',
    accent: '#C9A86A',
  },
  {
    act: 'ACT II',
    scale: '4 × 4 FT',
    concept: 'THE DIGITAL VEIL',
    conceptId: 'veil',
    role: 'Immersive escalation',
    why: 'A projected world lifts physically off the product. It needs no product CAD model, and the visual scale grows without moving the object.',
    accent: '#6FE7D8',
  },
  {
    act: 'ACT III',
    scale: '6 × 6 FT',
    concept: 'THE CARGO VAULT',
    conceptId: 'cargo',
    role: 'Signature finale',
    why: 'The strongest physical reveal in the deck. Four walls open, fog spills, and the open vault becomes the final photographic frame.',
    accent: '#E8D9B8',
  },
];

export const trilogyConcept: Concept = {
  ...concepts[0],
  id: 'stage-system',
  index: '00',
  name: 'THE STAGE SYSTEM',
  scene: 'trilogy',
  mechanism: 'One architectural language, three reveal mechanisms',
  proposition: 'The room stays. The mechanism changes.',
  tagline: 'A single stage that escalates from an intimate bay to a full cargo reveal.',
  complexity: 'High',
  productSize: 3.2,
  camera: { pos: [0, 5.4, 18], target: [0, 1.8, 0] },
  scores: { originality: 9, wow: 9, readability: 10, complexity: 8, adaptability: 8, guest: 8, photo: 10 },
};

export const stageAnatomyConcept: Concept = {
  ...concepts[0],
  id: 'stage-anatomy',
  index: '00',
  name: 'THE STAGE SYSTEM',
  scene: 'house',
  mechanism: 'A dressed, rigged and controlled 18 × 9 m stage',
  proposition: 'One room, fully built, before a single reveal is designed.',
  tagline: 'Deck, proscenium, two truss spans, eight profile spots, masking, control and a 14.2 m LED wall.',
  complexity: 'Medium',
  accent: '#C9A86A',
  sizeLabel: '18 × 9 M DECK',
  productSize: 3.0,
  camera: { pos: [0.4, 5.0, 24.5], target: [0, 3.4, 0], fov: 50 },
  audience: 'The audience reads a finished theatre the moment they walk in: everything is dressed, black and intentional.',
  hook: 'Nothing on this stage is improvised. Every cable, cloth and fixture has a home before the show file is written.',
  stageDesign:
    'An 18 × 9 m matte-black deck inside a 20 m proscenium, with a 14.2 × 5.6 m LED wall upstage, two 20.4 m box-truss spans flown at 6.6–7.0 m, four wool-serge masking legs, and a control position stage left with a full dimmer rack.',
  concealment:
    'Masking legs and borders remove the wings, crew and cable from every sightline; the LED wall is the only lit surface and carries all imagery.',
  guest:
    'A clear walk-up path from stage right, a 1 m clearance around the product plinth, and a boom spot that finds the guest without moving the show.',
  sequence: [
    { time: '0:00', title: 'The room', detail: 'House lights at half, stage in a warm wash. The audience sees a working rig, not a set.' },
    { time: '0:30', title: 'The floor', detail: 'The deck reads dead flat and dead black, so every later lift, drop and reveal has a clean baseline.' },
    { time: '1:30', title: 'The rig', detail: 'Two truss spans carry the profiles, the booms and the practicals; eight hoists make the rig repeatable.' },
    { time: '2:40', title: 'The frame', detail: 'Masking legs and borders close the picture down to the deck, so nothing outside the design is visible.' },
    { time: '3:30', title: 'The wall', detail: 'The LED wall becomes the identity surface; all moving image lives there and nowhere else.' },
    { time: '4:20', title: 'The control', detail: 'One lighting desk, one show file, one operator; every cue in every concept is played from this position.' },
  ],
  phases: ['DECK', 'RIGGING', 'LIGHT', 'MASKING', 'CONTROL'],
  tech: ['18 × 9 m deck', '20 m proscenium', '2 × 20.4 m truss spans', '8 chain hoists', '8 profile spots', '14.2 × 5.6 m LED', 'Wool-serge masking', 'Dimmer rack + desk'],
  techDetail:
    'The deck is 25 mm ply on steel legs with a 30 mm front edge and a recessed cable ramp. Truss is 400 mm box section on eight 1 t chain hoists, each with a secondary safety and a limit switch. Lighting is eight 750 W profiles on the front span, two boom specials and four practicals. Control is a two-universe desk with a printed show file and a redundant dimmer rack.',
  adaptation: {
    small: 'For a 2 × 2 ft product the plinth shrinks and the boom specials take the whole reveal.',
    medium: 'For 4 × 4 ft the centre plinth and the LED wall carry the reveal together.',
    large: 'For 6 × 6 ft the plinth becomes a 3 m turntable and the upstage truss clears to 7.4 m.',
  },
  feasibility:
    'Every element is standard Indian venue stock: box truss, 1 t hoists, 750 W profiles, wool serge, a 2.5 mm LED wall and a two-universe desk.',
  mitigation:
    'The rig is designed to the venue, not to the drawing: hoist points and trim heights are confirmed before fabrication, and every cue has a manual fallback.',
  signature: 'The moment the audience realises the stage is a machine: eight hoists, one desk, one show file.',
  visualDirection:
    'Architectural, matte, brass-edged. Warm key from stage left, cool rim from stage right, no visible source outside the rig.',
  scores: { originality: 7, wow: 7, readability: 10, complexity: 5, adaptability: 10, guest: 8, photo: 8 },
};
