-- ============================================================================
-- Migration: Seed all Industries and Sub-Industries
-- Run: npx tsx scripts/seed-industries.ts
-- ============================================================================

BEGIN;

-- Clear existing data using CASCADE to handle FK references from user profiles
TRUNCATE TABLE sub_industries RESTART IDENTITY CASCADE;
TRUNCATE TABLE industry RESTART IDENTITY CASCADE;

-- ── Insert Industries ──
INSERT INTO industry (name) VALUES
('Agriculture'),
('Automobile'),
('Aviation'),
('Battery & Storage'),
('Beauty & Wellness'),
('BFSI'),
('Chemical'),
('Construction Material'),
('Consulting'),
('Consumer Durables'),
('Distribution'),
('E-Commerce'),
('Electrical'),
('Electricity Markets'),
('Energy Efficiency Management'),
('Engineering'),
('Entertainment'),
('Environment'),
('EV Charging'),
('Exporters-Importers'),
('Facility Management'),
('FMCG'),
('Gems'),
('Government'),
('Healthcare'),
('Hotels'),
('Information Technology (IT)'),
('Infrastructure'),
('Institutes - Educational'),
('Iron & Steel'),
('ITES'),
('Leather'),
('Lighting'),
('Logistics'),
('Media'),
('Mining'),
('NGOs'),
('Office Automation'),
('Oil & Gas'),
('Pharmaceuticals'),
('Power'),
('Publishing'),
('Railways'),
('Renewable'),
('Retail'),
('Shipping'),
('Sports'),
('Telecommunication'),
('Textile'),
('Tourism'),
('Transmission'),
('Water Utility'),
('Wood');

-- ── Insert Sub-Industries ──
-- Agriculture
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Agriculture, Horticulture' FROM industry WHERE name = 'Agriculture';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Agritech' FROM industry WHERE name = 'Agriculture';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Agro Machinery' FROM industry WHERE name = 'Agriculture';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Agrochemical' FROM industry WHERE name = 'Agriculture';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Animal Feed, Poultry Farms' FROM industry WHERE name = 'Agriculture';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Organic Food' FROM industry WHERE name = 'Agriculture';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Processed Food, Foodgrains' FROM industry WHERE name = 'Agriculture';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Spices, Dry Fruits' FROM industry WHERE name = 'Agriculture';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Sugar' FROM industry WHERE name = 'Agriculture';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Agro, Food, Poultry Machinery' FROM industry WHERE name = 'Agriculture';

-- Automobile
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Automobiles' FROM industry WHERE name = 'Automobile';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Auto Ancillaries' FROM industry WHERE name = 'Automobile';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Dealers, Service Centres' FROM industry WHERE name = 'Automobile';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Electric Vehicle' FROM industry WHERE name = 'Automobile';

-- Aviation
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Airlines, Air Charter' FROM industry WHERE name = 'Aviation';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Defence, Aerospace' FROM industry WHERE name = 'Aviation';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Drones' FROM industry WHERE name = 'Aviation';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Institute - Aviation' FROM industry WHERE name = 'Aviation';

-- Battery & Storage
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Batteries' FROM industry WHERE name = 'Battery & Storage';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Battery - Manufacturer' FROM industry WHERE name = 'Battery & Storage';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Battery - OEM' FROM industry WHERE name = 'Battery & Storage';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Battery - EPC' FROM industry WHERE name = 'Battery & Storage';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Battery - Services' FROM industry WHERE name = 'Battery & Storage';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Battery - Association' FROM industry WHERE name = 'Battery & Storage';

-- Beauty & Wellness
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Beauty & Wellness' FROM industry WHERE name = 'Beauty & Wellness';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Cosmetic' FROM industry WHERE name = 'Beauty & Wellness';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Personal Care' FROM industry WHERE name = 'Beauty & Wellness';

-- BFSI
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Banks' FROM industry WHERE name = 'BFSI';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Financial Services, Financial Advisor' FROM industry WHERE name = 'BFSI';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Fintech' FROM industry WHERE name = 'BFSI';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Insurance' FROM industry WHERE name = 'BFSI';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Mutual Fund' FROM industry WHERE name = 'BFSI';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Stock Brokers' FROM industry WHERE name = 'BFSI';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Venture Capital (VC) / M&A Companies' FROM industry WHERE name = 'BFSI';

-- Chemical
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Industrial Chemical' FROM industry WHERE name = 'Chemical';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Chemical Machines' FROM industry WHERE name = 'Chemical';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Plastics, Rubber, Resins, Polymers' FROM industry WHERE name = 'Chemical';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Paints, Adhesives' FROM industry WHERE name = 'Chemical';

-- Construction Material
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Glass & Accessories' FROM industry WHERE name = 'Construction Material';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Bathroom Accessory' FROM industry WHERE name = 'Construction Material';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Construction Machinery' FROM industry WHERE name = 'Construction Material';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Construction Engineering' FROM industry WHERE name = 'Construction Material';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Housing, Commercial' FROM industry WHERE name = 'Construction Material';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Architectural, Interior Design, Landscape Services' FROM industry WHERE name = 'Construction Material';

-- Consulting
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Accounting, Taxation' FROM industry WHERE name = 'Consulting';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'HR Outsourcing Consultants' FROM industry WHERE name = 'Consulting';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Law, Legal' FROM industry WHERE name = 'Consulting';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Management' FROM industry WHERE name = 'Consulting';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Placement, HR' FROM industry WHERE name = 'Consulting';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Training' FROM industry WHERE name = 'Consulting';

-- Consumer Durables
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Consumer Goods' FROM industry WHERE name = 'Consumer Durables';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Electrical, Electronics' FROM industry WHERE name = 'Consumer Durables';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Repair, Service Centre' FROM industry WHERE name = 'Consumer Durables';

-- Distribution
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Distribution - Discom' FROM industry WHERE name = 'Distribution';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Distribution - EPC' FROM industry WHERE name = 'Distribution';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Distribution - OEM' FROM industry WHERE name = 'Distribution';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Distribution - Services' FROM industry WHERE name = 'Distribution';

-- E-Commerce
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Business-to-Business (B2B)' FROM industry WHERE name = 'E-Commerce';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Business-to-Consumer (B2C)' FROM industry WHERE name = 'E-Commerce';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Direct-to-Consumer (D2C)' FROM industry WHERE name = 'E-Commerce';

-- Electrical
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Electrical, Electronics' FROM industry WHERE name = 'Electrical';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Lighting - Manufacturer' FROM industry WHERE name = 'Electrical';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Lighting - Services' FROM industry WHERE name = 'Electrical';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Lighting - Equipment' FROM industry WHERE name = 'Electrical';

-- Electricity Markets
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Electricity Markets - Exchange' FROM industry WHERE name = 'Electricity Markets';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Electricity Markets - Trader' FROM industry WHERE name = 'Electricity Markets';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Electricity Markets - Institutional User' FROM industry WHERE name = 'Electricity Markets';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Electricity Markets - SLDC' FROM industry WHERE name = 'Electricity Markets';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Electricity Markets - Regulator' FROM industry WHERE name = 'Electricity Markets';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Electricity Markets - Operator' FROM industry WHERE name = 'Electricity Markets';

-- Energy Efficiency Management
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Energy Efficiency - Services' FROM industry WHERE name = 'Energy Efficiency Management';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Energy Efficiency - OEM' FROM industry WHERE name = 'Energy Efficiency Management';

-- Engineering
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Engineering' FROM industry WHERE name = 'Engineering';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Machineries, Instruments' FROM industry WHERE name = 'Engineering';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'EPC' FROM industry WHERE name = 'Engineering';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'OEM' FROM industry WHERE name = 'Engineering';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Producer' FROM industry WHERE name = 'Engineering';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Services' FROM industry WHERE name = 'Engineering';

-- Entertainment
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Amusement Parks, Arcades' FROM industry WHERE name = 'Entertainment';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Clubs' FROM industry WHERE name = 'Entertainment';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Film Production, Film Distribution, Film Exhibition' FROM industry WHERE name = 'Entertainment';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Music Production, Music Distribution' FROM industry WHERE name = 'Entertainment';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Online Games' FROM industry WHERE name = 'Entertainment';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Theatres, Multiplexes' FROM industry WHERE name = 'Entertainment';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Sports, Toys, Entertainment Products' FROM industry WHERE name = 'Entertainment';

-- Environment
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Environment Consultancy' FROM industry WHERE name = 'Environment';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Environment Engineering' FROM industry WHERE name = 'Environment';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Cleantech' FROM industry WHERE name = 'Environment';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Recycling, Waste Management' FROM industry WHERE name = 'Environment';

-- EV Charging
INSERT INTO sub_industries (industry_id, name) SELECT id, 'EV Charging - OEM' FROM industry WHERE name = 'EV Charging';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'EV Charging - Operator' FROM industry WHERE name = 'EV Charging';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'EV Charging - EPC' FROM industry WHERE name = 'EV Charging';

-- Exporters-Importers
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Exporters, Importers, Commodity Traders' FROM industry WHERE name = 'Exporters-Importers';

-- Facility Management
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Facility Mgmt' FROM industry WHERE name = 'Facility Management';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Pest Control' FROM industry WHERE name = 'Facility Management';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Safety, Security, Cleaning Equipments' FROM industry WHERE name = 'Facility Management';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Security Services' FROM industry WHERE name = 'Facility Management';

-- FMCG
INSERT INTO sub_industries (industry_id, name) SELECT id, 'FMCG' FROM industry WHERE name = 'FMCG';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Beverages' FROM industry WHERE name = 'FMCG';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Dairy Products' FROM industry WHERE name = 'FMCG';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Edible Oil Products' FROM industry WHERE name = 'FMCG';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Processed Food, Foodgrains' FROM industry WHERE name = 'FMCG';

-- Gems
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Gems, Jewellery' FROM industry WHERE name = 'Gems';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Watches' FROM industry WHERE name = 'Gems';

-- Government
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Govt Bodies' FROM industry WHERE name = 'Government';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Ministries' FROM industry WHERE name = 'Government';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Embassies' FROM industry WHERE name = 'Government';

-- Healthcare
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Hospital - Private' FROM industry WHERE name = 'Healthcare';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Hospital - Public' FROM industry WHERE name = 'Healthcare';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Laboratory' FROM industry WHERE name = 'Healthcare';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Medical - Manufacturer' FROM industry WHERE name = 'Healthcare';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Medical - Technology' FROM industry WHERE name = 'Healthcare';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Medical Travel' FROM industry WHERE name = 'Healthcare';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Community Health Service' FROM industry WHERE name = 'Healthcare';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Healthcare - Consultancy Services' FROM industry WHERE name = 'Healthcare';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Healthcare - Investor' FROM industry WHERE name = 'Healthcare';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Healthcare - Information Technology/Software' FROM industry WHERE name = 'Healthcare';

-- Hotels
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Budget Hotels' FROM industry WHERE name = 'Hotels';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Luxury Hotels' FROM industry WHERE name = 'Hotels';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Cloud Kitchen' FROM industry WHERE name = 'Hotels';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Restaurants' FROM industry WHERE name = 'Hotels';

-- Information Technology (IT)
INSERT INTO sub_industries (industry_id, name) SELECT id, 'IT - AI, Robotics, IOT' FROM industry WHERE name = 'Information Technology (IT)';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'IT - SaaS' FROM industry WHERE name = 'Information Technology (IT)';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'IT - ERP, CRM' FROM industry WHERE name = 'Information Technology (IT)';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'IT - Data Analytics' FROM industry WHERE name = 'Information Technology (IT)';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'IT - Cyber Security' FROM industry WHERE name = 'Information Technology (IT)';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'IT - Cloud Computing, Datacenter, Networking, Security' FROM industry WHERE name = 'Information Technology (IT)';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'IT - Software, App Development' FROM industry WHERE name = 'Information Technology (IT)';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'IT - Hardware' FROM industry WHERE name = 'Information Technology (IT)';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'IT - Embedded, EDA, VLSI' FROM industry WHERE name = 'Information Technology (IT)';

-- Infrastructure
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Infrastructure' FROM industry WHERE name = 'Infrastructure';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Construction Engineering' FROM industry WHERE name = 'Infrastructure';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Estate Services' FROM industry WHERE name = 'Infrastructure';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Coworking' FROM industry WHERE name = 'Infrastructure';

-- Institutes - Educational
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Institutes - Schools' FROM industry WHERE name = 'Institutes - Educational';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Institutes - Colleges' FROM industry WHERE name = 'Institutes - Educational';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Institutes - Universities' FROM industry WHERE name = 'Institutes - Educational';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'ITI, Polytechnic Colleges' FROM industry WHERE name = 'Institutes - Educational';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Training Institutes' FROM industry WHERE name = 'Institutes - Educational';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'EdTech - Online Education' FROM industry WHERE name = 'Institutes - Educational';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Educational Consultants' FROM industry WHERE name = 'Institutes - Educational';

-- Iron & Steel
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Iron & Steel' FROM industry WHERE name = 'Iron & Steel';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Metallic' FROM industry WHERE name = 'Iron & Steel';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Non Metallic' FROM industry WHERE name = 'Iron & Steel';

-- ITES
INSERT INTO sub_industries (industry_id, name) SELECT id, 'BPO, KPO, Call Centre' FROM industry WHERE name = 'ITES';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'LPO' FROM industry WHERE name = 'ITES';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Medical Transcription' FROM industry WHERE name = 'ITES';

-- Leather
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Leather & Accessories' FROM industry WHERE name = 'Leather';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Footwear Stores' FROM industry WHERE name = 'Leather';

-- Lighting
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Lighting - Manufacturer' FROM industry WHERE name = 'Lighting';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Lighting - Services' FROM industry WHERE name = 'Lighting';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Lighting - Equipment' FROM industry WHERE name = 'Lighting';

-- Logistics
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Courier, Logistics' FROM industry WHERE name = 'Logistics';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Transport' FROM industry WHERE name = 'Logistics';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Warehouse' FROM industry WHERE name = 'Logistics';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Supply Chain' FROM industry WHERE name = 'Logistics';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Packers, Movers' FROM industry WHERE name = 'Logistics';

-- Media
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Advertising, PR, MR' FROM industry WHERE name = 'Media';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Newspapers, Magazines, Journals' FROM industry WHERE name = 'Media';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'TV, Radio Channels, News Agency' FROM industry WHERE name = 'Media';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'TV Cable, Broadcast Networks' FROM industry WHERE name = 'Media';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Production, Distribution, Equipment' FROM industry WHERE name = 'Media';

-- Mining
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Mining' FROM industry WHERE name = 'Mining';

-- NGOs
INSERT INTO sub_industries (industry_id, name) SELECT id, 'NGOs' FROM industry WHERE name = 'NGOs';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Trust' FROM industry WHERE name = 'NGOs';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Charitable Institutions' FROM industry WHERE name = 'NGOs';

-- Office Automation
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Office Automation' FROM industry WHERE name = 'Office Automation';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Office Stationery' FROM industry WHERE name = 'Office Automation';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Paper, Printing Machines' FROM industry WHERE name = 'Office Automation';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Printing' FROM industry WHERE name = 'Office Automation';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Publication Houses' FROM industry WHERE name = 'Office Automation';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Pulp, Paper' FROM industry WHERE name = 'Office Automation';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Stickers, Labels, Cards, Smart Cards, Holograms' FROM industry WHERE name = 'Office Automation';

-- Oil & Gas
INSERT INTO sub_industries (industry_id, name) SELECT id, 'O&G - Upstream EPC' FROM industry WHERE name = 'Oil & Gas';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'O&G - Upstream OEM' FROM industry WHERE name = 'Oil & Gas';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'O&G - Upstream Operator' FROM industry WHERE name = 'Oil & Gas';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'O&G - Upstream Services' FROM industry WHERE name = 'Oil & Gas';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'O&G - Midstream EPC' FROM industry WHERE name = 'Oil & Gas';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'O&G - Midstream OEM' FROM industry WHERE name = 'Oil & Gas';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'O&G - Midstream Operator' FROM industry WHERE name = 'Oil & Gas';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'O&G - Midstream Services' FROM industry WHERE name = 'Oil & Gas';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'O&G - Downstream EPC' FROM industry WHERE name = 'Oil & Gas';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'O&G - Downstream OEM' FROM industry WHERE name = 'Oil & Gas';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'O&G - Downstream Operator' FROM industry WHERE name = 'Oil & Gas';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'O&G - Downstream Services' FROM industry WHERE name = 'Oil & Gas';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'O&G - Green Hydrogen EPC' FROM industry WHERE name = 'Oil & Gas';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'O&G - Green Hydrogen OEM' FROM industry WHERE name = 'Oil & Gas';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'O&G - Green Hydrogen Producer' FROM industry WHERE name = 'Oil & Gas';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'O&G - Green Hydrogen Services' FROM industry WHERE name = 'Oil & Gas';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'O&G - CGD EPC' FROM industry WHERE name = 'Oil & Gas';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'O&G - CGD OEM' FROM industry WHERE name = 'Oil & Gas';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'O&G - CGD Operator' FROM industry WHERE name = 'Oil & Gas';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'O&G - CGD Services' FROM industry WHERE name = 'Oil & Gas';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'O&G - BioFuel EPC' FROM industry WHERE name = 'Oil & Gas';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'O&G - BioFuel OEM' FROM industry WHERE name = 'Oil & Gas';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'O&G - BioFuel Producer' FROM industry WHERE name = 'Oil & Gas';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'O&G - BioFuel Services' FROM industry WHERE name = 'Oil & Gas';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'O&G - Association' FROM industry WHERE name = 'Oil & Gas';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'O&G - Institute' FROM industry WHERE name = 'Oil & Gas';

-- Pharmaceuticals
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Pharmaceuticals - Biotechnology' FROM industry WHERE name = 'Pharmaceuticals';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Pharmaceuticals - Diagnostic, Testing Labs, Research' FROM industry WHERE name = 'Pharmaceuticals';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Pharmaceuticals - Device Manufacturer' FROM industry WHERE name = 'Pharmaceuticals';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Pharmaceuticals - Manufacturer' FROM industry WHERE name = 'Pharmaceuticals';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Pharmaceuticals - Vaccines' FROM industry WHERE name = 'Pharmaceuticals';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Pharmaceuticals - Others' FROM industry WHERE name = 'Pharmaceuticals';

-- Power
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Power - Coal Producer' FROM industry WHERE name = 'Power';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Power - Gas Producer' FROM industry WHERE name = 'Power';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Power - Nuclear Producer' FROM industry WHERE name = 'Power';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Power - Combined Cycle Producer' FROM industry WHERE name = 'Power';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Power - EPC' FROM industry WHERE name = 'Power';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Power - OEM' FROM industry WHERE name = 'Power';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Power - Services' FROM industry WHERE name = 'Power';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Power - Association' FROM industry WHERE name = 'Power';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Power - Generators/Back-Up Power' FROM industry WHERE name = 'Power';

-- Publishing
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Publication Houses' FROM industry WHERE name = 'Publishing';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Printing' FROM industry WHERE name = 'Publishing';

-- Railways
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Transport' FROM industry WHERE name = 'Railways';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Rail Infrastructure' FROM industry WHERE name = 'Railways';

-- Renewable
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Renewables - Solar Producer' FROM industry WHERE name = 'Renewable';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Renewables - Solar EPC' FROM industry WHERE name = 'Renewable';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Renewables - Solar OEM' FROM industry WHERE name = 'Renewable';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Renewables - Solar Services' FROM industry WHERE name = 'Renewable';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Renewables - Wind Producer' FROM industry WHERE name = 'Renewable';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Renewables - Wind EPC' FROM industry WHERE name = 'Renewable';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Renewables - Wind OEM' FROM industry WHERE name = 'Renewable';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Renewables - Wind Services' FROM industry WHERE name = 'Renewable';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Renewables - Hydro Producer' FROM industry WHERE name = 'Renewable';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Renewables - Hydro EPC' FROM industry WHERE name = 'Renewable';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Renewables - Hydro OEM' FROM industry WHERE name = 'Renewable';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Renewables - Hydro Services' FROM industry WHERE name = 'Renewable';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Renewables - Other Producer' FROM industry WHERE name = 'Renewable';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Renewables - Other EPC' FROM industry WHERE name = 'Renewable';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Renewables - Other OEM' FROM industry WHERE name = 'Renewable';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Renewables - Other Services' FROM industry WHERE name = 'Renewable';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Renewables - Association' FROM industry WHERE name = 'Renewable';

-- Retail
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Apparel Stores' FROM industry WHERE name = 'Retail';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Grocery Stores' FROM industry WHERE name = 'Retail';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Jewellery, Watches' FROM industry WHERE name = 'Retail';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Pharmacy' FROM industry WHERE name = 'Retail';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Consumer Electronics, Mobile Stores' FROM industry WHERE name = 'Retail';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Furniture, Furnishing Outlets' FROM industry WHERE name = 'Retail';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Fast Food Outlets' FROM industry WHERE name = 'Retail';

-- Shipping
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Ship Building, Wrecking, Repairing' FROM industry WHERE name = 'Shipping';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Shipping Agents' FROM industry WHERE name = 'Shipping';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Shipping Infrastructure, Services' FROM industry WHERE name = 'Shipping';

-- Sports
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Sports Equipment Manufacturer' FROM industry WHERE name = 'Sports';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Sports Marketing' FROM industry WHERE name = 'Sports';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Sports Management' FROM industry WHERE name = 'Sports';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Aero Sports' FROM industry WHERE name = 'Sports';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Terrestrial Sports' FROM industry WHERE name = 'Sports';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Water Sports' FROM industry WHERE name = 'Sports';

-- Telecommunication
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Telecom Infrastructure, Equipments' FROM industry WHERE name = 'Telecommunication';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Telecom VAS' FROM industry WHERE name = 'Telecommunication';

-- Textile
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Textile Machines' FROM industry WHERE name = 'Textile';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Yarn, Fibre, Thread, Textile, Accessories' FROM industry WHERE name = 'Textile';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Handlooms, Handicrafts, Earthenware' FROM industry WHERE name = 'Textile';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Readymade Garments' FROM industry WHERE name = 'Textile';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Fashion Designers' FROM industry WHERE name = 'Textile';

-- Tourism
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Tour Operators' FROM industry WHERE name = 'Tourism';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Travel Agencies, Taxi, Bike Services' FROM industry WHERE name = 'Tourism';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Tourism & Transport Services' FROM industry WHERE name = 'Tourism';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Adventure and Sports Tourism' FROM industry WHERE name = 'Tourism';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Eco-Tourism' FROM industry WHERE name = 'Tourism';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Wellness and Spiritual Tourism' FROM industry WHERE name = 'Tourism';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Medical Tourism/Medical Value Travel' FROM industry WHERE name = 'Tourism';

-- Transmission
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Transmission - Transco' FROM industry WHERE name = 'Transmission';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Transmission - EPC' FROM industry WHERE name = 'Transmission';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Transmission - OEM' FROM industry WHERE name = 'Transmission';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Transmission - Services' FROM industry WHERE name = 'Transmission';

-- Water Utility
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Water Utility - Supply' FROM industry WHERE name = 'Water Utility';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Water Utility - EPC' FROM industry WHERE name = 'Water Utility';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Water Utility - Services' FROM industry WHERE name = 'Water Utility';
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Water Utility - OEM' FROM industry WHERE name = 'Water Utility';

-- Wood
INSERT INTO sub_industries (industry_id, name) SELECT id, 'Wood, Plastic Furniture, Fixtures, Fittings' FROM industry WHERE name = 'Wood';

COMMIT;
