-- Add sample data for HOAdoor

-- Insert sample HOAs
INSERT INTO public.hoas (name, slug, description_public, city, state, zip_code, amenities, unit_count) VALUES
('Sunset Valley HOA', 'sunset-valley-hoa', 'A beautiful community with mountain views and modern amenities. Perfect for families and professionals alike.', 'Austin', 'Texas', '78745', '{"Pool", "Gym", "Tennis Court", "Playground", "Clubhouse"}', 150),
('Oak Ridge Community', 'oak-ridge-community', 'Established neighborhood with mature trees and quiet streets. Great for those seeking peaceful living.', 'Denver', 'Colorado', '80231', '{"Pool", "Walking Trails", "Dog Park", "Community Garden"}', 85),
('Harbor View Estates', 'harbor-view-estates', 'Luxury waterfront community with stunning harbor views. Premium amenities and exclusive lifestyle.', 'San Diego', 'California', '92101', '{"Marina", "Concierge", "Spa", "Private Beach", "Valet Parking"}', 200),
('Maple Grove Townhomes', 'maple-grove-townhomes', 'Family-friendly townhome community with excellent schools nearby. Safe and welcoming environment.', 'Charlotte', 'North Carolina', '28277', '{"Pool", "Playground", "Basketball Court", "Picnic Area"}', 120),
('Riverside Commons', 'riverside-commons', 'Modern apartments along the scenic river with bike paths and outdoor recreation opportunities.', 'Portland', 'Oregon', '97201', '{"Bike Storage", "Fitness Center", "Rooftop Deck", "Pet Wash Station"}', 180),
('Pine Hill Residences', 'pine-hill-residences', 'Quiet suburban community with tree-lined streets and well-maintained common areas.', 'Nashville', 'Tennessee', '37215', '{"Pool", "Tennis Court", "Walking Trails", "Community Center"}', 95),
('Coastal Breeze Condos', 'coastal-breeze-condos', 'Beachside condominiums with ocean views and resort-style amenities just steps from the sand.', 'Miami', 'Florida', '33139', '{"Beach Access", "Pool", "Hot Tub", "Gym", "Parking Garage"}', 250),
('Valley Ridge HOA', 'valley-ridge-hoa', 'Affordable housing community with basic amenities and friendly neighbors in a safe environment.', 'Phoenix', 'Arizona', '85016', '{"Pool", "Playground", "Mailbox Cluster"}', 300),
('Greenwood Estates', 'greenwood-estates', 'Upscale gated community with golf course access and luxury amenities for discerning residents.', 'Atlanta', 'Georgia', '30309', '{"Golf Course", "Clubhouse", "Concierge", "Security Gate", "Tennis Courts"}', 175),
('Hillcrest Apartments', 'hillcrest-apartments', 'Modern apartment complex with panoramic city views and contemporary living spaces.', 'Seattle', 'Washington', '98102', '{"Gym", "Rooftop Lounge", "Business Center", "Pet Park"}', 220);

-- Insert sample reviews (we'll create users first through the application)
-- For now, we'll just ensure the structure is ready

-- Refresh the materialized view
REFRESH MATERIALIZED VIEW public.rating_aggregates;