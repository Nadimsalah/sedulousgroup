-- Seed initial car data
INSERT INTO public.cars (id, name, brand, category, year, price, rating, image, passengers, luggage, transmission, fuel_type, description, features) VALUES
('car-1', 'Mercedes A-Class', 'Mercedes-Benz', 'Economy', 2024, 65, 4.8, '/images/cars/car1.webp', 5, 3, 'Automatic', 'Petrol', 'Experience the perfect blend of style and efficiency with the Mercedes A-Class. Ideal for city driving and weekend getaways.', '{"safety": ["Advanced Safety", "Parking Sensors"], "deviceConnectivity": ["Bluetooth", "USB Charging"], "convenience": ["Air Conditioning"]}'),
('car-2', 'VW Golf R', 'Volkswagen', 'Economy', 2024, 72, 4.7, '/images/cars/car4.webp', 5, 3, 'Automatic', 'Petrol', 'The VW Golf R delivers exceptional performance with sporty handling and advanced technology features.', '{"safety": ["Backup Camera", "Cruise Control"], "deviceConnectivity": ["Bluetooth"], "convenience": ["LED Headlights"]}'),
('car-3', 'Mercedes C-Class', 'Mercedes-Benz', 'Premium', 2024, 119, 4.9, '/images/cars/car2.webp', 5, 4, 'Automatic', 'Petrol', 'Elegance meets performance in the Mercedes C-Class. Premium comfort for discerning travelers.', '{"safety": ["Advanced Safety"], "deviceConnectivity": ["Premium Sound"], "convenience": ["Leather Seats", "Sunroof", "Ambient Lighting"]}'),
('car-4', 'Volvo V60', 'Volvo', 'Premium', 2024, 129, 4.9, '/images/cars/car3.webp', 5, 5, 'Automatic', 'Hybrid', 'The Volvo V60 combines Scandinavian design with eco-friendly hybrid technology.', '{"safety": ["Safety Plus"], "deviceConnectivity": ["Premium Audio"], "convenience": ["Ambient Lighting", "Spacious Interior"]}'),
('car-5', 'Mercedes GLA', 'Mercedes-Benz', 'Premium', 2024, 139, 4.8, '/images/cars/car6.webp', 5, 4, 'Automatic', 'Petrol', 'Compact luxury SUV with advanced technology and premium comfort features.', '{"safety": ["All-Wheel Drive"], "deviceConnectivity": ["MBUX System"], "convenience": ["Panoramic Roof", "Premium Interior"]}'),
('car-6', 'Mercedes EQB', 'Mercedes-Benz', 'Luxury', 2024, 249, 5.0, '/images/cars/car5.webp', 7, 5, 'Automatic', 'Electric', 'The future of luxury travel. Seven seats, zero emissions, and endless possibilities.', '{"safety": ["Advanced Driver Assist"], "deviceConnectivity": ["Premium Tech"], "convenience": ["Fast Charging"]}'),
('car-7', 'Mercedes EQA', 'Mercedes-Benz', 'Luxury', 2024, 229, 4.9, '/images/cars/car7.webp', 5, 4, 'Automatic', 'Electric', 'Electric luxury SUV with cutting-edge technology and premium comfort.', '{"safety": ["Advanced Safety"], "deviceConnectivity": ["MBUX Hyperscreen"], "convenience": ["Premium Leather", "Rapid Charging"]}'),
('car-8', 'Mercedes A-Class Premium', 'Mercedes-Benz', 'Luxury', 2024, 189, 4.8, '/images/cars/car1.webp', 5, 3, 'Automatic', 'Hybrid', 'Premium hybrid variant with AMG styling and enhanced performance features.', '{"safety": ["Hybrid Technology"], "deviceConnectivity": ["Performance Mode"], "convenience": ["AMG Line", "Premium Interior"]}')
ON CONFLICT (id) DO NOTHING;

-- Seed initial story data
INSERT INTO public.stories (id, title, thumbnail, images, linked_car_id) VALUES
('story-1', 'Mercedes A-Class', '/images/cars/car1.webp', '["\/images\/cars\/car1.webp", "\/images\/cars\/car2.webp"]', 'car-1'),
('story-2', 'VW Golf R', '/images/cars/car4.webp', '["\/images\/cars\/car4.webp", "\/images\/cars\/car3.webp"]', 'car-2'),
('story-3', 'Mercedes C-Class', '/images/cars/car2.webp', '["\/images\/cars\/car2.webp", "\/images\/cars\/car1.webp"]', 'car-3'),
('story-4', 'Volvo V60', '/images/cars/car3.webp', '["\/images\/cars\/car3.webp", "\/images\/cars\/car4.webp"]', 'car-4'),
('story-5', 'Mercedes GLA', '/images/cars/car6.webp', '["\/images\/cars\/car6.webp", "\/images\/cars\/car5.webp"]', 'car-5'),
('story-6', 'Mercedes EQB', '/images/cars/car5.webp', '["\/images\/cars\/car5.webp", "\/images\/cars\/car7.webp"]', 'car-6')
ON CONFLICT (id) DO NOTHING;
