-- Add Mercedes-Benz EQA (Electric SUV)
INSERT INTO cars (id, name, brand, category, year, price, passengers, luggage, transmission, fuel_type, rating, image, description, features, created_at, updated_at)
VALUES (
  'mercedes-eqa-2024',
  'Mercedes-Benz EQA',
  'Mercedes-Benz',
  'Electric SUV',
  2024,
  180,
  5,
  4,
  'Automatic',
  'Electric',
  4.7,
  '/images/img-1528.webp',
  'Experience the future of luxury with the all-electric Mercedes-Benz EQA. Perfect blend of performance, comfort, and sustainability.',
  jsonb_build_object(
    'safety', ARRAY['Backup camera', 'Blind spot warning', 'Lane assist', 'Adaptive cruise control'],
    'deviceConnectivity', ARRAY['Bluetooth', 'USB ports', 'Wireless charging', 'Apple CarPlay'],
    'convenience', ARRAY['Keyless entry', 'Climate control', 'Cruise control', 'Electric seats']
  ),
  NOW(),
  NOW()
);

-- Add Volkswagen Golf R (Performance Hatchback)
INSERT INTO cars (id, name, brand, category, year, price, passengers, luggage, transmission, fuel_type, rating, image, description, features, created_at, updated_at)
VALUES (
  'vw-golf-r-2024',
  'Volkswagen Golf R',
  'Volkswagen',
  'Sport',
  2024,
  140,
  5,
  3,
  'Manual',
  'Petrol',
  4.9,
  '/images/img-1530.webp',
  'Unleash pure performance with the legendary Golf R. Turbocharged power meets precision handling for the ultimate driving experience.',
  jsonb_build_object(
    'safety', ARRAY['Backup camera', 'Blind spot warning', 'Lane assist', 'Adaptive headlights'],
    'deviceConnectivity', ARRAY['Bluetooth', 'USB ports', 'Android Auto', 'Apple CarPlay'],
    'convenience', ARRAY['Keyless entry', 'Climate control', 'Sport seats', 'Digital cockpit']
  ),
  NOW(),
  NOW()
);

-- Add Mercedes-Benz EQB (7-Seater Electric SUV)
INSERT INTO cars (id, name, brand, category, year, price, passengers, luggage, transmission, fuel_type, rating, image, description, features, created_at, updated_at)
VALUES (
  'mercedes-eqb-2024',
  'Mercedes-Benz EQB',
  'Mercedes-Benz',
  'Electric SUV',
  2024,
  200,
  7,
  5,
  'Automatic',
  'Electric',
  4.8,
  '/images/img-1529.webp',
  'Spacious luxury for the whole family. The EQB offers 7 seats with zero emissions and cutting-edge Mercedes technology.',
  jsonb_build_object(
    'safety', ARRAY['Backup camera', 'Blind spot warning', 'Lane assist', '360 camera', 'Pre-safe system'],
    'deviceConnectivity', ARRAY['Bluetooth', 'USB ports', 'Wireless charging', 'Apple CarPlay', 'MBUX system'],
    'convenience', ARRAY['Keyless entry', 'Climate control', 'Panoramic roof', 'Electric tailgate', 'Third row seats']
  ),
  NOW(),
  NOW()
);

-- Add Mercedes-Benz EQA Sport Edition
INSERT INTO cars (id, name, brand, category, year, price, passengers, luggage, transmission, fuel_type, rating, image, description, features, created_at, updated_at)
VALUES (
  'mercedes-eqa-sport-2024',
  'Mercedes-Benz EQA Sport',
  'Mercedes-Benz',
  'Electric SUV',
  2024,
  190,
  5,
  4,
  'Automatic',
  'Electric',
  4.8,
  '/images/img-1527.webp',
  'The sporty variant of the EQA with enhanced performance and exclusive design elements. Electric luxury meets dynamic driving.',
  jsonb_build_object(
    'safety', ARRAY['Backup camera', 'Blind spot warning', 'Lane assist', 'Active brake assist'],
    'deviceConnectivity', ARRAY['Bluetooth', 'USB ports', 'Wireless charging', 'Apple CarPlay', 'Android Auto'],
    'convenience', ARRAY['Keyless entry', 'Climate control', 'Sport suspension', 'AMG styling']
  ),
  NOW(),
  NOW()
);

-- Add Volvo V60 (Premium Estate)
INSERT INTO cars (id, name, brand, category, year, price, passengers, luggage, transmission, fuel_type, rating, image, description, features, created_at, updated_at)
VALUES (
  'volvo-v60-2024',
  'Volvo V60',
  'Volvo',
  'Estate',
  2024,
  160,
  5,
  6,
  'Automatic',
  'Hybrid',
  4.7,
  '/images/img-1531.webp',
  'Scandinavian elegance meets practicality. The V60 estate offers generous space with sophisticated design and hybrid efficiency.',
  jsonb_build_object(
    'safety', ARRAY['Backup camera', 'Blind spot warning', 'Lane assist', 'City safety', 'Pilot assist'],
    'deviceConnectivity', ARRAY['Bluetooth', 'USB ports', 'Apple CarPlay', 'Android Auto', 'Harman Kardon sound'],
    'convenience', ARRAY['Keyless entry', 'Climate control', 'Panoramic roof', 'Power tailgate', 'Massage seats']
  ),
  NOW(),
  NOW()
);

-- Add Mercedes-Benz A-Class (Compact Luxury)
INSERT INTO cars (id, name, brand, category, year, price, passengers, luggage, transmission, fuel_type, rating, image, description, features, created_at, updated_at)
VALUES (
  'mercedes-a-class-2024',
  'Mercedes-Benz A-Class',
  'Mercedes-Benz',
  'Compact',
  2024,
  120,
  5,
  3,
  'Automatic',
  'Petrol',
  4.6,
  '/images/img-1525.webp',
  'Premium luxury in a compact package. The A-Class brings Mercedes sophistication to the city with agile handling and modern technology.',
  jsonb_build_object(
    'safety', ARRAY['Backup camera', 'Blind spot warning', 'Lane assist', 'Active brake assist'],
    'deviceConnectivity', ARRAY['Bluetooth', 'USB ports', 'Wireless charging', 'Apple CarPlay', 'MBUX'],
    'convenience', ARRAY['Keyless entry', 'Climate control', 'Digital cockpit', 'AMG line styling']
  ),
  NOW(),
  NOW()
);

-- Add Mercedes-Benz E-Class (Luxury Sedan)
INSERT INTO cars (id, name, brand, category, year, price, passengers, luggage, transmission, fuel_type, rating, image, description, features, created_at, updated_at)
VALUES (
  'mercedes-e-class-2024',
  'Mercedes-Benz E-Class',
  'Mercedes-Benz',
  'Luxury',
  2024,
  220,
  5,
  4,
  'Automatic',
  'Hybrid',
  4.9,
  '/images/img-1526.webp',
  'The pinnacle of executive luxury. The E-Class combines cutting-edge technology with timeless elegance for an unparalleled driving experience.',
  jsonb_build_object(
    'safety', ARRAY['Backup camera', 'Blind spot warning', 'Lane assist', '360 camera', 'Pre-safe system', 'Adaptive cruise'],
    'deviceConnectivity', ARRAY['Bluetooth', 'USB ports', 'Wireless charging', 'Apple CarPlay', 'Burmester sound', 'Head-up display'],
    'convenience', ARRAY['Keyless entry', 'Climate control', 'Panoramic roof', 'Massage seats', 'Air suspension', 'Ambient lighting']
  ),
  NOW(),
  NOW()
);
