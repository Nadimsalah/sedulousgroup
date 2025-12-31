-- Migrate existing car images from cars.image to car_images table
-- This script will copy the single image from each car to car_images as the primary image

INSERT INTO car_images (car_id, image_url, display_order, is_primary)
SELECT 
  id as car_id,
  image as image_url,
  0 as display_order,
  true as is_primary
FROM cars
WHERE image IS NOT NULL 
  AND image != ''
  AND image != '/images/cars/car1.webp'
  AND NOT EXISTS (
    SELECT 1 FROM car_images WHERE car_images.car_id = cars.id
  );
