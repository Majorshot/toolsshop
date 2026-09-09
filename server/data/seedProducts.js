const seedProducts = [
  {
    id: "vpt-001",
    name: "Bosch GDC 120 Professional Marble Cutter",
    brand: "Bosch",
    category: "grinders-cutters",
    price: 3850,
    originalPrice: 4700,
    discount: "18% OFF",
    rating: 4.8,
    reviewsCount: 142,
    badge: "Bestseller",
    stock: 15,
    cordless: false,
    image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80"
    ],
    description: "Compact and powerful 1200W marble cutter for fast and precise wet/dry cutting in marble, granite, tiles, and concrete. Designed with optimized dust insulation to maintain peak motor life.",
    specs: {
      power: "1200 Watts",
      voltage: "230V / 50Hz",
      noLoadSpeed: "12,000 RPM",
      bladeDiameter: "110 mm (4-3/8 inch)",
      cuttingDepth: "34 mm (90°)",
      weight: "2.8 kg",
      warranty: "6 Months Bosch India Warranty"
    },
    features: [
      "Optimized dust insulation for longer motor life",
      "Ergonomic handle for fatigue-free horizontal & vertical cutting",
      "Wide base plate for stable and accurate cutting",
      "High power-to-weight ratio"
    ]
  },
  {
    id: "vpt-002",
    name: "Makita HR2470 24mm Rotary Hammer Drill (SDS-Plus)",
    brand: "Makita",
    category: "hammers",
    price: 8490,
    originalPrice: 10200,
    discount: "17% OFF",
    rating: 4.9,
    reviewsCount: 98,
    badge: "Heavy Duty",
    stock: 8,
    cordless: false,
    image: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=800&q=80"
    ],
    description: "Industry-standard 780W 3-mode rotary hammer (Drilling, Hammer Drilling, Chiselling). Features reverse rotation mode and torque limiter to protect the operator and machine.",
    specs: {
      power: "780 Watts",
      voltage: "230V",
      impactEnergy: "2.4 Joules",
      noLoadSpeed: "0 - 1,100 RPM",
      impactRate: "0 - 4,500 IPM",
      capacityConcrete: "24 mm",
      weight: "2.9 kg",
      warranty: "1 Year Official Makita Warranty"
    },
    features: [
      "3-Mode operation: Rotation only, Hammering with rotation, Hammering only",
      "Torque limiter disengages clutch if bit jams",
      "Recessed lock-on button for continuous operation",
      "Rubberized soft grip for maximum comfort"
    ]
  },
  {
    id: "vpt-003",
    name: "DeWalt DCD7781D2 20V Max Brushless Cordless Hammer Drill",
    brand: "DeWalt",
    category: "cordless",
    price: 13999,
    originalPrice: 17500,
    discount: "20% OFF",
    rating: 4.9,
    reviewsCount: 176,
    badge: "Pro Choice",
    stock: 12,
    cordless: true,
    image: "https://images.unsplash.com/photo-1508873696983-2df5293cb32f?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1508873696983-2df5293cb32f?auto=format&fit=crop&w=800&q=80"
    ],
    description: "Ultra-compact and lightweight 20V Max Brushless Hammer Drill with 2x 2.0Ah batteries and fast charger. High performance brushless motor delivers up to 65Nm torque.",
    specs: {
      power: "20V XR Brushless",
      battery: "2x 2.0Ah Lithium-Ion included",
      maxTorque: "65 Nm",
      noLoadSpeed: "0-500 / 0-1,750 RPM",
      beatsPerMin: "0-8,500 / 0-29,750 BPM",
      chuckCapacity: "13 mm Keyless Ratcheting",
      warranty: "2 Years DeWalt India Warranty"
    },
    features: [
      "Brushless motor technology for superior runtime and durability",
      "15-position adjustable torque control for consistent screwdriving",
      "Bright LED worklight on the foot with delay feature",
      "Includes heavy duty kit box, 2x batteries, and multi-voltage charger"
    ]
  },
  {
    id: "vpt-004",
    name: "Dongcheng DSM03-100A 4-Inch 710W Angle Grinder",
    brand: "Dongcheng",
    category: "grinders-cutters",
    price: 1950,
    originalPrice: 2400,
    discount: "19% OFF",
    rating: 4.7,
    reviewsCount: 310,
    badge: "Popular Value",
    stock: 25,
    cordless: false,
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80"
    ],
    description: "The trusted workhorse for workshops and fabricators across Kerala. 710W robust motor with high thermal endurance for continuous grinding, deburring, and cutting.",
    specs: {
      power: "710 Watts",
      voltage: "220V-240V",
      wheelDiameter: "100 mm (4 inch)",
      spindleThread: "M10",
      noLoadSpeed: "13,000 RPM",
      weight: "1.6 kg",
      warranty: "6 Months Dongcheng Warranty"
    },
    features: [
      "Slim body grip for convenient one-handed operation",
      "High grade copper armature for heavy load endurance",
      "Spindle lock for swift wheel change",
      "High airflow cooling vents"
    ]
  },
  {
    id: "vpt-005",
    name: "Bosch GWS 600 Professional 4-Inch Angle Grinder",
    brand: "Bosch",
    category: "grinders-cutters",
    price: 2450,
    originalPrice: 2950,
    discount: "17% OFF",
    rating: 4.8,
    reviewsCount: 220,
    badge: "Bestseller",
    stock: 30,
    cordless: false,
    image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80"
    ],
    description: "Handy 670W angle grinder with explosion-proof guard and two-motion safety switch. Ideal for metal cutting, weld dressing, and surface preparation.",
    specs: {
      power: "670 Watts",
      voltage: "230V",
      wheelDiameter: "100 mm",
      noLoadSpeed: "11,000 RPM",
      spindleThread: "M10",
      weight: "1.5 kg",
      warranty: "6 Months Bosch Warranty"
    },
    features: [
      "Anti-rotation protective guard stands firm against fractured disc",
      "Armoured coils protect motor from sharp grinding dust",
      "Two-motion safety switch avoids accidental startup"
    ]
  },
  {
    id: "vpt-006",
    name: "HiKOKI DH26PC 26mm 830W 3-Mode Rotary Hammer",
    brand: "HiKOKI",
    category: "hammers",
    price: 7999,
    originalPrice: 9800,
    discount: "18% OFF",
    rating: 4.8,
    reviewsCount: 64,
    badge: "Heavy Duty",
    stock: 10,
    cordless: false,
    image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80"
    ],
    description: "High durability Japanese engineering. 830W motor delivering 3.2 Joules impact energy with internal pressure adjustment mechanism for 2x faster drilling speed.",
    specs: {
      power: "830 Watts",
      impactEnergy: "3.2 Joules",
      capacityConcrete: "26 mm",
      noLoadSpeed: "0 - 1,100 RPM",
      impactRate: "0 - 4,300 BPM",
      weight: "2.8 kg",
      warranty: "1 Year HiKOKI Warranty"
    },
    features: [
      "Class-leading drilling speed in reinforced concrete",
      "Large change lever located on side for easy mode switching",
      "Soft elastomer grip absorbs vibration"
    ]
  },
  {
    id: "vpt-007",
    name: "Makita DTD152Z 18V LXT Cordless Impact Driver",
    brand: "Makita",
    category: "cordless",
    price: 6850,
    originalPrice: 8200,
    discount: "16% OFF",
    rating: 4.9,
    reviewsCount: 88,
    badge: "Pro Choice",
    stock: 7,
    cordless: true,
    image: "https://images.unsplash.com/photo-1508873696983-2df5293cb32f?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1508873696983-2df5293cb32f?auto=format&fit=crop&w=800&q=80"
    ],
    description: "Compact 18V LXT impact driver delivering 165 Nm torque. Features eXtreme Protection Technology (XPT) engineered for improved dust and water resistance in harsh conditions.",
    specs: {
      voltage: "18V LXT",
      maxTorque: "165 Nm",
      noLoadSpeed: "0 - 2,900 RPM",
      impactsPerMin: "0 - 3,500 IPM",
      drivingShank: "6.35 mm (1/4 inch) Hex",
      weight: "1.3 kg",
      warranty: "1 Year Makita Warranty"
    },
    features: [
      "XPT - eXtreme Protection Technology protects against outdoor dust & rain",
      "Twin LED job light with preglow and afterglow functions",
      "One-touch bit installation",
      "Electric brake for maximum productivity"
    ]
  },
  {
    id: "vpt-008",
    name: "Stanley STHR202K 20mm 620W Rotary Hammer with Kit Box",
    brand: "Stanley",
    category: "hammers",
    price: 4699,
    originalPrice: 5900,
    discount: "20% OFF",
    rating: 4.6,
    reviewsCount: 75,
    badge: "Value Pick",
    stock: 14,
    cordless: false,
    image: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=800&q=80"
    ],
    description: "Reliable 620W 2-mode hammer drill for electricians, plumbers, and home renovation pros. Comes with sturdy carry kit and SDS drill bits.",
    specs: {
      power: "620 Watts",
      impactEnergy: "1.34 Joules",
      capacityConcrete: "20 mm",
      noLoadSpeed: "0 - 1,250 RPM",
      weight: "2.3 kg",
      warranty: "1 Year Stanley Warranty"
    },
    features: [
      "Variable speed control switch for tailored precision",
      "Depth gauge for accurate hole drilling",
      "Heavy duty carrying case included"
    ]
  },
  {
    id: "vpt-009",
    name: "Bosch GHO 6500 Professional 650W Wood Planer",
    brand: "Bosch",
    category: "woodworking",
    price: 5490,
    originalPrice: 6800,
    discount: "19% OFF",
    rating: 4.8,
    reviewsCount: 52,
    badge: "Carpenter Choice",
    stock: 9,
    cordless: false,
    image: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80"
    ],
    description: "Powerful 650W motor with planning depth up to 2.6mm. Equipped with 2 resharpenable HSS blades for lower maintenance costs and smooth wood finishing.",
    specs: {
      power: "650 Watts",
      planingWidth: "82 mm",
      planingDepth: "0 - 2.6 mm adjustable",
      rebatingDepth: "0 - 9 mm",
      noLoadSpeed: "16,500 RPM",
      weight: "2.8 kg",
      warranty: "6 Months Bosch Warranty"
    },
    features: [
      "Convenient lock-on switch for right and left hand users",
      "Parking shoe prevents damage to wooden surfaces",
      "Robust plate with 3 V-grooves for chamfering"
    ]
  },
  {
    id: "vpt-010",
    name: "Bosch Aquatak 125 High-Pressure Car & Patio Washer (125 Bar)",
    brand: "Bosch",
    category: "washers-blowers",
    price: 9999,
    originalPrice: 13500,
    discount: "26% OFF",
    rating: 4.9,
    reviewsCount: 190,
    badge: "Bestseller",
    stock: 11,
    cordless: false,
    image: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=800&q=80"
    ],
    description: "Quick, versatile and effortless cleaning with 125 bar pressure and 3-in-1 Trio nozzle. Perfect for home car washing, courtyard, tile algae removal, and shop maintenance.",
    specs: {
      power: "1500 Watts",
      maxPressure: "125 Bar (1800 PSI)",
      flowRate: "360 Litres/Hour",
      hoseLength: "5 Metres High Pressure",
      cableLength: "5 Metres",
      weight: "6.8 kg",
      warranty: "6 Months Bosch Warranty"
    },
    features: [
      "3-in-1 Nozzle with fan jet, rotary, and point pencil jet",
      "High-pressure foam detergent nozzle (450ml) included",
      "Fold-down handle and secondary carry handle for mobility",
      "Self-priming: can draw water from buckets or tanks"
    ]
  },
  {
    id: "vpt-011",
    name: "Makita 5007NK 7-1/4 Inch 1800W Circular Saw",
    brand: "Makita",
    category: "woodworking",
    price: 9450,
    originalPrice: 11900,
    discount: "21% OFF",
    rating: 4.9,
    reviewsCount: 44,
    badge: "Pro Choice",
    stock: 6,
    cordless: false,
    image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80"
    ],
    description: "Heavy duty 1800W circular saw engineered for rip cuts and cross cuts in lumber and ply. High bevel capacity of 56° with positive stops at 22.5° and 45°.",
    specs: {
      power: "1800 Watts",
      bladeDiameter: "185 mm (7-1/4 inch)",
      maxCuttingDepth: "64 mm at 90°, 45 mm at 45°",
      noLoadSpeed: "5,800 RPM",
      weight: "5.0 kg",
      warranty: "1 Year Makita Warranty"
    },
    features: [
      "Large cutting capacity with clear bevel markings",
      "Built-in dust blower keeps cut line clear of sawdust",
      "Flat motor housing design for easy blade replacements"
    ]
  },
  {
    id: "vpt-012",
    name: "Dongcheng DZE02-26 26mm 800W Demolition Hammer Drill",
    brand: "Dongcheng",
    category: "hammers",
    price: 4350,
    originalPrice: 5300,
    discount: "18% OFF",
    rating: 4.7,
    reviewsCount: 165,
    badge: "Popular Value",
    stock: 18,
    cordless: false,
    image: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=800&q=80"
    ],
    description: "Top rated contractor hammer in Kerala. 800W motor with 3 modes for masonry, brick, concrete drilling, and tile removal. Packed in solid industrial blow case.",
    specs: {
      power: "800 Watts",
      capacityConcrete: "26 mm",
      noLoadSpeed: "0 - 1,200 RPM",
      weight: "3.2 kg",
      warranty: "6 Months Dongcheng Warranty"
    },
    features: [
      "High strength alloy gear box for prolonged usage",
      "Includes 3 SDS drill bits and 2 chisels in case",
      "Forward and reverse operation"
    ]
  },
  {
    id: "vpt-013",
    name: "Bosch GBL 620 Professional Electric Air Blower (620W)",
    brand: "Bosch",
    category: "washers-blowers",
    price: 2190,
    originalPrice: 2750,
    discount: "20% OFF",
    rating: 4.8,
    reviewsCount: 280,
    badge: "Bestseller",
    stock: 35,
    cordless: false,
    image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80"
    ],
    description: "Mind blowing power in its class. 620W air blower offering 3.5 m³/min air flow for cleaning dust from electrical panels, carpentry workshops, and car interiors.",
    specs: {
      power: "620 Watts",
      volumetricFlowRate: "3.5 m³/min",
      noLoadSpeed: "16,000 RPM",
      weight: "1.7 kg",
      warranty: "6 Months Bosch Warranty"
    },
    features: [
      "Ideal power-to-weight ratio for fatigue-free blowing",
      "Easily serviceable carbon brushes for DIY change",
      "Dual mode: blowing and suction capability"
    ]
  },
  {
    id: "vpt-014",
    name: "DeWalt DW801 100mm 850W Heavy Duty Small Angle Grinder",
    brand: "DeWalt",
    category: "grinders-cutters",
    price: 3290,
    originalPrice: 4100,
    discount: "20% OFF",
    rating: 4.9,
    reviewsCount: 110,
    badge: "Heavy Duty",
    stock: 16,
    cordless: false,
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80"
    ],
    description: "850W power packed into a compact girth. Spiral bevel gears provide reduced vibration, lower noise, and longer lifespan for metal fabrication & granite edge grinding.",
    specs: {
      power: "850 Watts",
      wheelDiameter: "100 mm (4 inch)",
      noLoadSpeed: "11,000 RPM",
      spindleThread: "M10",
      weight: "1.8 kg",
      warranty: "2 Years DeWalt Warranty"
    },
    features: [
      "Advanced fan system ensures maximum airflow prolonging motor life",
      "Sealed ball bearings and high efficiency motor",
      "Burst proof guard for maximum operator protection"
    ]
  },
  {
    id: "vpt-015",
    name: "Bosch Professional 105-Piece Drill & Screwdriver Bit Set (V-Line)",
    brand: "Bosch",
    category: "accessories",
    price: 1890,
    originalPrice: 2450,
    discount: "23% OFF",
    rating: 4.9,
    reviewsCount: 340,
    badge: "Essential Kit",
    stock: 40,
    cordless: false,
    image: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80"
    ],
    description: "Comprehensive accessory set including precision titanium metal bits, masonry drill bits, wood brad point bits, screwdriver bits, socket wrenches, and magnetic holder.",
    specs: {
      pieces: "105 Pieces Master Set",
      suitableFor: "Concrete, Steel, Wood, PVC, Masonry",
      case: "Hard molded carrying briefcase",
      weight: "1.4 kg",
      warranty: "Genuine Bosch Accessory Guarantee"
    },
    features: [
      "Titanium nitride coating for 40% faster drilling and longer bit life",
      "Clear layout with printed size labels for rapid selection",
      "Magnetic universal bit holder"
    ]
  },
  {
    id: "vpt-016",
    name: "Dongcheng DZG15 1240W 15kg Heavy Demolition Breaker",
    brand: "Dongcheng",
    category: "hammers",
    price: 13900,
    originalPrice: 17000,
    discount: "18% OFF",
    rating: 4.9,
    reviewsCount: 42,
    badge: "Heavy Duty",
    stock: 5,
    cordless: false,
    image: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=800&q=80"
    ],
    description: "Monstrous 1240W motor for road breaking, concrete slab demolition, trenching, and civil construction work in Kerala. Includes heavy hex pointed and flat chisels.",
    specs: {
      power: "1240 Watts",
      impactRate: "1,400 IPM",
      shankType: "30 mm Hex",
      weight: "16 kg",
      warranty: "6 Months Dongcheng Warranty"
    },
    features: [
      "All-metal cylinder and housing for extreme jobsite durability",
      "360° auxiliary handle with vibration damping",
      "Includes heavy steel metal storage case on wheels"
    ]
  }
];

module.exports = seedProducts;
