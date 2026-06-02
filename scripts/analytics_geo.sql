-- W3-2585: BE: Add endpoint to save geo analytics data for video views from frontend
-- Video: geo (id: 4qduYPV1MCy5MvRSYP4xR7, hex: 1F15DC6A5CC16872B62FCDC7E07039AA)
-- DB: web3tv2

SET @video_id = UNHEX('1F15DC6A5CC16872B62FCDC7E07039AA');

-- Views with geo data (various countries and cities in different proportions)
INSERT INTO video_views (ip_address, view_events, is_viewed, created_at, video_id, user_id, country, city)
VALUES
  -- US — 21 view
  ('1.1.1.1',   '[30,60,90]', 1, NOW() - INTERVAL 7  DAY, @video_id, NULL, 'US', 'New York'),
  ('10.0.0.7',  '[30,60,90]', 1, NOW() - INTERVAL 12 HOUR, @video_id, NULL, 'US', 'Los Angeles'),
  ('10.0.0.11', '[30,60,90]', 1, NOW(),                    @video_id, NULL, 'US', 'Chicago'),
  ('50.0.0.1',  '[30,60,90]', 1, NOW() - INTERVAL 7 DAY,  @video_id, NULL, 'US', 'New York'),
  ('50.0.0.2',  '[30,60,90]', 1, NOW() - INTERVAL 6 DAY,  @video_id, NULL, 'US', 'Los Angeles'),
  ('50.0.0.3',  '[30,60,90]', 1, NOW() - INTERVAL 6 DAY,  @video_id, NULL, 'US', 'Chicago'),
  ('50.0.0.4',  '[30,60,90]', 1, NOW() - INTERVAL 5 DAY,  @video_id, NULL, 'US', 'Houston'),
  ('50.0.0.5',  '[30,60,90]', 1, NOW() - INTERVAL 5 DAY,  @video_id, NULL, 'US', 'Miami'),
  ('50.0.0.6',  '[30,60,90]', 1, NOW() - INTERVAL 4 DAY,  @video_id, NULL, 'US', 'Seattle'),
  ('50.0.0.7',  '[30,60,90]', 1, NOW() - INTERVAL 4 DAY,  @video_id, NULL, 'US', 'Boston'),
  ('50.0.0.8',  '[30,60,90]', 1, NOW() - INTERVAL 3 DAY,  @video_id, NULL, 'US', 'Denver'),
  ('50.0.0.9',  '[30,60,90]', 1, NOW() - INTERVAL 3 DAY,  @video_id, NULL, 'US', 'Atlanta'),
  ('50.0.0.10', '[30,60,90]', 1, NOW() - INTERVAL 2 DAY,  @video_id, NULL, 'US', 'Phoenix'),
  ('50.0.0.11', '[30,60,90]', 1, NOW() - INTERVAL 2 DAY,  @video_id, NULL, 'US', 'New York'),
  ('50.0.0.12', '[30,60,90]', 1, NOW() - INTERVAL 1 DAY,  @video_id, NULL, 'US', 'Los Angeles'),
  ('50.0.0.13', '[30,60,90]', 1, NOW() - INTERVAL 12 HOUR,@video_id, NULL, 'US', 'Chicago'),
  ('50.0.0.14', '[30,60,90]', 1, NOW() - INTERVAL 6 HOUR, @video_id, NULL, 'US', 'New York'),
  ('50.0.0.15', '[30,60,90]', 1, NOW(),                   @video_id, NULL, 'US', 'San Francisco'),
  ('80.0.0.1',  '[30,60,90]', 1, NOW() - INTERVAL 6 DAY,  @video_id, NULL, 'US', 'Dallas'),
  ('80.0.0.2',  '[30,60,90]', 1, NOW() - INTERVAL 5 DAY,  @video_id, NULL, 'US', 'Portland'),
  ('80.0.0.3',  '[30,60,90]', 1, NOW() - INTERVAL 4 DAY,  @video_id, NULL, 'US', 'Las Vegas'),
  -- DE — 12 views
  ('2.2.2.2',   '[30,60,90]', 1, NOW() - INTERVAL 6  DAY, @video_id, NULL, 'DE', 'Berlin'),
  ('51.0.0.1',  '[30,60,90]', 1, NOW() - INTERVAL 7 DAY,  @video_id, NULL, 'DE', 'Berlin'),
  ('51.0.0.2',  '[30,60,90]', 1, NOW() - INTERVAL 5 DAY,  @video_id, NULL, 'DE', 'Munich'),
  ('51.0.0.3',  '[30,60,90]', 1, NOW() - INTERVAL 5 DAY,  @video_id, NULL, 'DE', 'Hamburg'),
  ('51.0.0.4',  '[30,60,90]', 1, NOW() - INTERVAL 4 DAY,  @video_id, NULL, 'DE', 'Frankfurt'),
  ('51.0.0.5',  '[30,60,90]', 1, NOW() - INTERVAL 3 DAY,  @video_id, NULL, 'DE', 'Berlin'),
  ('51.0.0.6',  '[30,60,90]', 1, NOW() - INTERVAL 2 DAY,  @video_id, NULL, 'DE', 'Cologne'),
  ('51.0.0.7',  '[30,60,90]', 1, NOW() - INTERVAL 2 DAY,  @video_id, NULL, 'DE', 'Berlin'),
  ('51.0.0.8',  '[30,60,90]', 1, NOW() - INTERVAL 1 DAY,  @video_id, NULL, 'DE', 'Stuttgart'),
  ('51.0.0.9',  '[30,60,90]', 1, NOW() - INTERVAL 6 HOUR, @video_id, NULL, 'DE', 'Berlin'),
  ('51.0.0.10', '[30,60,90]', 1, NOW(),                   @video_id, NULL, 'DE', 'Munich'),
  ('80.0.0.4',  '[30,60,90]', 1, NOW() - INTERVAL 3 DAY,  @video_id, NULL, 'US', 'Detroit'),
  -- IN — 12 views
  ('7.7.7.7',   '[30,60,90]', 1, NOW() - INTERVAL 4  DAY, @video_id, NULL, 'IN', 'Mumbai'),
  ('52.0.0.1',  '[30,60,90]', 1, NOW() - INTERVAL 7 DAY,  @video_id, NULL, 'IN', 'Mumbai'),
  ('52.0.0.2',  '[30,60,90]', 1, NOW() - INTERVAL 6 DAY,  @video_id, NULL, 'IN', 'Delhi'),
  ('52.0.0.3',  '[30,60,90]', 1, NOW() - INTERVAL 5 DAY,  @video_id, NULL, 'IN', 'Bangalore'),
  ('52.0.0.4',  '[30,60,90]', 1, NOW() - INTERVAL 4 DAY,  @video_id, NULL, 'IN', 'Hyderabad'),
  ('52.0.0.5',  '[30,60,90]', 1, NOW() - INTERVAL 3 DAY,  @video_id, NULL, 'IN', 'Chennai'),
  ('52.0.0.6',  '[30,60,90]', 1, NOW() - INTERVAL 3 DAY,  @video_id, NULL, 'IN', 'Mumbai'),
  ('52.0.0.7',  '[30,60,90]', 1, NOW() - INTERVAL 2 DAY,  @video_id, NULL, 'IN', 'Pune'),
  ('52.0.0.8',  '[30,60,90]', 1, NOW() - INTERVAL 1 DAY,  @video_id, NULL, 'IN', 'Kolkata'),
  ('52.0.0.9',  '[30,60,90]', 1, NOW() - INTERVAL 6 HOUR, @video_id, NULL, 'IN', 'Delhi'),
  ('52.0.0.10', '[30,60,90]', 1, NOW(),                   @video_id, NULL, 'IN', 'Mumbai'),
  ('80.32.0.1', '[30,60,90]', 1, NOW() - INTERVAL 3 HOUR, @video_id, NULL, 'BD', 'Dhaka'),
  -- BR — 9 views
  ('6.6.6.6',   '[30,60,90]', 1, NOW() - INTERVAL 4  DAY, @video_id, NULL, 'BR', 'Sao Paulo'),
  ('53.0.0.1',  '[30,60,90]', 1, NOW() - INTERVAL 6 DAY,  @video_id, NULL, 'BR', 'Sao Paulo'),
  ('53.0.0.2',  '[30,60,90]', 1, NOW() - INTERVAL 5 DAY,  @video_id, NULL, 'BR', 'Rio de Janeiro'),
  ('53.0.0.3',  '[30,60,90]', 1, NOW() - INTERVAL 4 DAY,  @video_id, NULL, 'BR', 'Brasilia'),
  ('53.0.0.4',  '[30,60,90]', 1, NOW() - INTERVAL 3 DAY,  @video_id, NULL, 'BR', 'Sao Paulo'),
  ('53.0.0.5',  '[30,60,90]', 1, NOW() - INTERVAL 2 DAY,  @video_id, NULL, 'BR', 'Salvador'),
  ('53.0.0.6',  '[30,60,90]', 1, NOW() - INTERVAL 1 DAY,  @video_id, NULL, 'BR', 'Sao Paulo'),
  ('53.0.0.7',  '[30,60,90]', 1, NOW(),                   @video_id, NULL, 'BR', 'Curitiba'),
  ('80.12.0.1', '[30,60,90]', 1, NOW() - INTERVAL 2 DAY,  @video_id, NULL, 'CO', 'Bogota'),
  -- GB — 8 views
  ('3.3.3.3',   '[30,60,90]', 1, NOW() - INTERVAL 6  DAY, @video_id, NULL, 'GB', 'London'),
  ('54.0.0.1',  '[30,60,90]', 1, NOW() - INTERVAL 7 DAY,  @video_id, NULL, 'GB', 'London'),
  ('54.0.0.2',  '[30,60,90]', 1, NOW() - INTERVAL 5 DAY,  @video_id, NULL, 'GB', 'Manchester'),
  ('54.0.0.3',  '[30,60,90]', 1, NOW() - INTERVAL 3 DAY,  @video_id, NULL, 'GB', 'London'),
  ('54.0.0.4',  '[30,60,90]', 1, NOW() - INTERVAL 2 DAY,  @video_id, NULL, 'GB', 'Birmingham'),
  ('54.0.0.5',  '[30,60,90]', 1, NOW() - INTERVAL 1 DAY,  @video_id, NULL, 'GB', 'London'),
  ('54.0.0.6',  '[30,60,90]', 1, NOW(),                   @video_id, NULL, 'GB', 'Glasgow'),
  ('80.0.0.5',  '[30,60,90]', 1, NOW() - INTERVAL 2 DAY,  @video_id, NULL, 'US', 'Minneapolis'),
  -- FR — 7 views
  ('4.4.4.4',   '[30,60,90]', 1, NOW() - INTERVAL 5  DAY, @video_id, NULL, 'FR', 'Paris'),
  ('55.0.0.1',  '[30,60,90]', 1, NOW() - INTERVAL 6 DAY,  @video_id, NULL, 'FR', 'Paris'),
  ('55.0.0.2',  '[30,60,90]', 1, NOW() - INTERVAL 4 DAY,  @video_id, NULL, 'FR', 'Lyon'),
  ('55.0.0.3',  '[30,60,90]', 1, NOW() - INTERVAL 3 DAY,  @video_id, NULL, 'FR', 'Paris'),
  ('55.0.0.4',  '[30,60,90]', 1, NOW() - INTERVAL 1 DAY,  @video_id, NULL, 'FR', 'Marseille'),
  ('55.0.0.5',  '[30,60,90]', 1, NOW(),                   @video_id, NULL, 'FR', 'Paris'),
  ('80.1.0.1',  '[30,60,90]', 1, NOW() - INTERVAL 6 DAY,  @video_id, NULL, 'CN', 'Beijing'),
  -- JP — 7 views
  ('5.5.5.5',   '[30,60,90]', 1, NOW() - INTERVAL 5  DAY, @video_id, NULL, 'JP', 'Tokyo'),
  ('56.0.0.1',  '[30,60,90]', 1, NOW() - INTERVAL 7 DAY,  @video_id, NULL, 'JP', 'Tokyo'),
  ('56.0.0.2',  '[30,60,90]', 1, NOW() - INTERVAL 4 DAY,  @video_id, NULL, 'JP', 'Osaka'),
  ('56.0.0.3',  '[30,60,90]', 1, NOW() - INTERVAL 3 DAY,  @video_id, NULL, 'JP', 'Tokyo'),
  ('56.0.0.4',  '[30,60,90]', 1, NOW() - INTERVAL 1 DAY,  @video_id, NULL, 'JP', 'Nagoya'),
  ('56.0.0.5',  '[30,60,90]', 1, NOW(),                   @video_id, NULL, 'JP', 'Tokyo'),
  ('80.1.0.2',  '[30,60,90]', 1, NOW() - INTERVAL 5 DAY,  @video_id, NULL, 'CN', 'Shanghai'),
  -- CA — 6 views
  ('9.9.9.9',   '[30,60,90]', 1, NOW() - INTERVAL 3  DAY, @video_id, NULL, 'CA', 'Toronto'),
  ('57.0.0.1',  '[30,60,90]', 1, NOW() - INTERVAL 5 DAY,  @video_id, NULL, 'CA', 'Toronto'),
  ('57.0.0.2',  '[30,60,90]', 1, NOW() - INTERVAL 3 DAY,  @video_id, NULL, 'CA', 'Vancouver'),
  ('57.0.0.3',  '[30,60,90]', 1, NOW() - INTERVAL 1 DAY,  @video_id, NULL, 'CA', 'Montreal'),
  ('57.0.0.4',  '[30,60,90]', 1, NOW(),                   @video_id, NULL, 'CA', 'Toronto'),
  ('80.1.0.3',  '[30,60,90]', 1, NOW() - INTERVAL 4 DAY,  @video_id, NULL, 'CN', 'Shenzhen'),
  -- AU — 6 views
  ('8.8.8.8',   '[30,60,90]', 1, NOW() - INTERVAL 3  DAY, @video_id, NULL, 'AU', 'Sydney'),
  ('58.0.0.1',  '[30,60,90]', 1, NOW() - INTERVAL 6 DAY,  @video_id, NULL, 'AU', 'Sydney'),
  ('58.0.0.2',  '[30,60,90]', 1, NOW() - INTERVAL 4 DAY,  @video_id, NULL, 'AU', 'Melbourne'),
  ('58.0.0.3',  '[30,60,90]', 1, NOW() - INTERVAL 2 DAY,  @video_id, NULL, 'AU', 'Brisbane'),
  ('58.0.0.4',  '[30,60,90]', 1, NOW(),                   @video_id, NULL, 'AU', 'Sydney'),
  ('80.1.0.4',  '[30,60,90]', 1, NOW() - INTERVAL 3 DAY,  @video_id, NULL, 'CN', 'Guangzhou'),
  -- CN — 5 views
  ('80.1.0.5',  '[30,60,90]', 1, NOW() - INTERVAL 2 DAY,  @video_id, NULL, 'CN', 'Chengdu'),
  -- KR — 4 views
  ('10.0.0.1',  '[30,60,90]', 1, NOW() - INTERVAL 2  DAY, @video_id, NULL, 'KR', 'Seoul'),
  ('59.0.0.1',  '[30,60,90]', 1, NOW() - INTERVAL 5 DAY,  @video_id, NULL, 'KR', 'Seoul'),
  ('59.0.0.2',  '[30,60,90]', 1, NOW() - INTERVAL 1 DAY,  @video_id, NULL, 'KR', 'Busan'),
  -- SG — 4 views
  ('10.0.0.2',  '[30,60,90]', 1, NOW() - INTERVAL 2  DAY, @video_id, NULL, 'SG', 'Singapore'),
  ('60.0.0.1',  '[30,60,90]', 1, NOW() - INTERVAL 4 DAY,  @video_id, NULL, 'SG', 'Singapore'),
  ('60.0.0.2',  '[30,60,90]', 1, NOW() - INTERVAL 1 DAY,  @video_id, NULL, 'SG', 'Singapore'),
  -- NL — 4 views
  ('10.0.0.8',  '[30,60,90]', 1, NOW() - INTERVAL 6  HOUR, @video_id, NULL, 'NL', 'Amsterdam'),
  ('61.0.0.1',  '[30,60,90]', 1, NOW() - INTERVAL 3 DAY,  @video_id, NULL, 'NL', 'Amsterdam'),
  ('61.0.0.2',  '[30,60,90]', 1, NOW(),                   @video_id, NULL, 'NL', 'Rotterdam'),
  -- PL — 4 views
  ('10.0.0.9',  '[30,60,90]', 1, NOW() - INTERVAL 6  HOUR, @video_id, NULL, 'PL', 'Warsaw'),
  ('62.0.0.1',  '[30,60,90]', 1, NOW() - INTERVAL 2 DAY,  @video_id, NULL, 'PL', 'Warsaw'),
  ('62.0.0.2',  '[30,60,90]', 1, NOW() - INTERVAL 1 DAY,  @video_id, NULL, 'PL', 'Krakow'),
  -- MX — 4 views
  ('10.0.0.5',  '[30,60,90]', 1, NOW() - INTERVAL 1  DAY, @video_id, NULL, 'MX', 'Mexico City'),
  ('63.0.0.1',  '[30,60,90]', 1, NOW() - INTERVAL 3 DAY,  @video_id, NULL, 'MX', 'Mexico City'),
  ('63.0.0.2',  '[30,60,90]', 1, NOW(),                   @video_id, NULL, 'MX', 'Guadalajara'),
  -- UA — 3 views
  ('10.0.0.6',  '[30,60,90]', 1, NOW() - INTERVAL 12 HOUR, @video_id, NULL, 'UA', NULL),
  ('69.0.0.1',  '[30,60,90]', 1, NOW() - INTERVAL 1 DAY,  @video_id, NULL, 'UA', 'Kyiv'),
  -- IT — 3 views
  ('10.0.0.10', '[30,60,90]', 1, NOW() - INTERVAL 3  HOUR, @video_id, NULL, 'IT', 'Rome'),
  ('66.0.0.1',  '[30,60,90]', 1, NOW() - INTERVAL 3 DAY,  @video_id, NULL, 'IT', 'Rome'),
  -- AE — 3 views
  ('10.0.0.3',  '[30,60,90]', 1, NOW() - INTERVAL 1  DAY, @video_id, NULL, 'AE', 'Dubai'),
  ('65.0.0.1',  '[30,60,90]', 1, NOW() - INTERVAL 4 DAY,  @video_id, NULL, 'AE', 'Dubai'),
  -- ZA — 3 views
  ('10.0.0.4',  '[30,60,90]', 1, NOW() - INTERVAL 1  DAY, @video_id, NULL, 'ZA', 'Cape Town'),
  ('64.0.0.1',  '[30,60,90]', 1, NOW() - INTERVAL 5 DAY,  @video_id, NULL, 'ZA', 'Cape Town'),
  -- RU — 3 views
  ('80.2.0.1',  '[30,60,90]', 1, NOW() - INTERVAL 6 DAY,  @video_id, NULL, 'RU', 'Moscow'),
  ('80.2.0.2',  '[30,60,90]', 1, NOW() - INTERVAL 5 DAY,  @video_id, NULL, 'RU', 'Saint Petersburg'),
  ('80.2.0.3',  '[30,60,90]', 1, NOW() - INTERVAL 3 DAY,  @video_id, NULL, 'RU', 'Novosibirsk'),
  -- ID — 3 views
  ('80.3.0.1',  '[30,60,90]', 1, NOW() - INTERVAL 5 DAY,  @video_id, NULL, 'ID', 'Jakarta'),
  ('80.3.0.2',  '[30,60,90]', 1, NOW() - INTERVAL 4 DAY,  @video_id, NULL, 'ID', 'Surabaya'),
  ('80.3.0.3',  '[30,60,90]', 1, NOW() - INTERVAL 2 DAY,  @video_id, NULL, 'ID', 'Bandung'),
  -- NG — 3 views
  ('80.4.0.1',  '[30,60,90]', 1, NOW() - INTERVAL 5 DAY,  @video_id, NULL, 'NG', 'Lagos'),
  ('80.4.0.2',  '[30,60,90]', 1, NOW() - INTERVAL 3 DAY,  @video_id, NULL, 'NG', 'Abuja'),
  ('80.4.0.3',  '[30,60,90]', 1, NOW() - INTERVAL 1 DAY,  @video_id, NULL, 'NG', 'Port Harcourt'),
  -- PK — 2 views
  ('80.5.0.1',  '[30,60,90]', 1, NOW() - INTERVAL 4 DAY,  @video_id, NULL, 'PK', 'Karachi'),
  ('80.5.0.2',  '[30,60,90]', 1, NOW() - INTERVAL 3 DAY,  @video_id, NULL, 'PK', 'Lahore'),
  -- EG — 2 views
  ('80.6.0.1',  '[30,60,90]', 1, NOW() - INTERVAL 4 DAY,  @video_id, NULL, 'EG', 'Cairo'),
  ('80.6.0.2',  '[30,60,90]', 1, NOW() - INTERVAL 2 DAY,  @video_id, NULL, 'EG', 'Alexandria'),
  -- PH — 2 views
  ('80.7.0.1',  '[30,60,90]', 1, NOW() - INTERVAL 4 DAY,  @video_id, NULL, 'PH', 'Manila'),
  ('80.7.0.2',  '[30,60,90]', 1, NOW() - INTERVAL 2 DAY,  @video_id, NULL, 'PH', 'Cebu'),
  -- VN — 2 views
  ('80.8.0.1',  '[30,60,90]', 1, NOW() - INTERVAL 3 DAY,  @video_id, NULL, 'VN', 'Hanoi'),
  ('80.8.0.2',  '[30,60,90]', 1, NOW() - INTERVAL 1 DAY,  @video_id, NULL, 'VN', 'Ho Chi Minh City'),
  -- TH — 2 views
  ('80.9.0.1',  '[30,60,90]', 1, NOW() - INTERVAL 3 DAY,  @video_id, NULL, 'TH', 'Bangkok'),
  ('80.9.0.2',  '[30,60,90]', 1, NOW() - INTERVAL 1 DAY,  @video_id, NULL, 'TH', 'Chiang Mai'),
  -- MY — 2 views
  ('80.10.0.1', '[30,60,90]', 1, NOW() - INTERVAL 3 DAY,  @video_id, NULL, 'MY', 'Kuala Lumpur'),
  ('80.10.0.2', '[30,60,90]', 1, NOW() - INTERVAL 1 DAY,  @video_id, NULL, 'MY', 'Penang'),
  -- SA — 2 views
  ('80.11.0.1', '[30,60,90]', 1, NOW() - INTERVAL 2 DAY,  @video_id, NULL, 'SA', 'Riyadh'),
  ('80.11.0.2', '[30,60,90]', 1, NOW() - INTERVAL 1 DAY,  @video_id, NULL, 'SA', 'Jeddah'),
  -- CO — 2 views
  ('80.12.0.2', '[30,60,90]', 1, NOW() - INTERVAL 1 DAY,  @video_id, NULL, 'CO', 'Medellin'),
  -- PT — 2 views
  ('80.13.0.1', '[30,60,90]', 1, NOW() - INTERVAL 2 DAY,  @video_id, NULL, 'PT', 'Lisbon'),
  ('80.13.0.2', '[30,60,90]', 1, NOW() - INTERVAL 1 DAY,  @video_id, NULL, 'PT', 'Porto'),
  -- GR — 2 views
  ('80.14.0.1', '[30,60,90]', 1, NOW() - INTERVAL 2 DAY,  @video_id, NULL, 'GR', 'Athens'),
  ('80.14.0.2', '[30,60,90]', 1, NOW() - INTERVAL 1 DAY,  @video_id, NULL, 'GR', 'Thessaloniki'),
  -- 1 view each
  ('67.0.0.1',  '[30,60,90]', 1, NOW() - INTERVAL 2 DAY,  @video_id, NULL, 'ES', 'Madrid'),
  ('68.0.0.1',  '[30,60,90]', 1, NOW() - INTERVAL 1 DAY,  @video_id, NULL, 'TR', 'Istanbul'),
  ('70.0.0.1',  '[30,60,90]', 1, NOW() - INTERVAL 6 HOUR, @video_id, NULL, 'SE', 'Stockholm'),
  ('71.0.0.1',  '[30,60,90]', 1, NOW() - INTERVAL 3 HOUR, @video_id, NULL, 'NO', 'Oslo'),
  ('72.0.0.1',  '[30,60,90]', 1, NOW(),                   @video_id, NULL, 'CH', 'Zurich'),
  ('73.0.0.1',  '[30,60,90]', 1, NOW(),                   @video_id, NULL, 'AR', 'Buenos Aires'),
  ('80.15.0.1', '[30,60,90]', 1, NOW() - INTERVAL 1 DAY,  @video_id, NULL, 'HU', 'Budapest'),
  ('80.16.0.1', '[30,60,90]', 1, NOW() - INTERVAL 1 DAY,  @video_id, NULL, 'CZ', 'Prague'),
  ('80.17.0.1', '[30,60,90]', 1, NOW() - INTERVAL 1 DAY,  @video_id, NULL, 'RO', 'Bucharest'),
  ('80.18.0.1', '[30,60,90]', 1, NOW() - INTERVAL 1 DAY,  @video_id, NULL, 'AT', 'Vienna'),
  ('80.19.0.1', '[30,60,90]', 1, NOW() - INTERVAL 1 DAY,  @video_id, NULL, 'BE', 'Brussels'),
  ('80.20.0.1', '[30,60,90]', 1, NOW() - INTERVAL 1 DAY,  @video_id, NULL, 'IL', 'Tel Aviv'),
  ('80.21.0.1', '[30,60,90]', 1, NOW() - INTERVAL 1 DAY,  @video_id, NULL, 'NZ', 'Auckland'),
  ('80.22.0.1', '[30,60,90]', 1, NOW() - INTERVAL 1 DAY,  @video_id, NULL, 'HK', 'Hong Kong'),
  ('80.23.0.1', '[30,60,90]', 1, NOW() - INTERVAL 1 DAY,  @video_id, NULL, 'TW', 'Taipei'),
  ('80.24.0.1', '[30,60,90]', 1, NOW() - INTERVAL 1 DAY,  @video_id, NULL, 'DK', 'Copenhagen'),
  ('80.25.0.1', '[30,60,90]', 1, NOW() - INTERVAL 1 DAY,  @video_id, NULL, 'FI', 'Helsinki'),
  ('80.26.0.1', '[30,60,90]', 1, NOW() - INTERVAL 6 HOUR, @video_id, NULL, 'SK', 'Bratislava'),
  ('80.27.0.1', '[30,60,90]', 1, NOW() - INTERVAL 6 HOUR, @video_id, NULL, 'HR', 'Zagreb'),
  ('80.28.0.1', '[30,60,90]', 1, NOW() - INTERVAL 6 HOUR, @video_id, NULL, 'RS', 'Belgrade'),
  ('80.29.0.1', '[30,60,90]', 1, NOW() - INTERVAL 6 HOUR, @video_id, NULL, 'MA', 'Casablanca'),
  ('80.30.0.1', '[30,60,90]', 1, NOW() - INTERVAL 6 HOUR, @video_id, NULL, 'KE', 'Nairobi'),
  ('80.31.0.1', '[30,60,90]', 1, NOW() - INTERVAL 3 HOUR, @video_id, NULL, 'GH', 'Accra'),
  ('80.33.0.1', '[30,60,90]', 1, NOW() - INTERVAL 3 HOUR, @video_id, NULL, 'LK', 'Colombo'),
  ('80.34.0.1', '[30,60,90]', 1, NOW() - INTERVAL 3 HOUR, @video_id, NULL, 'IQ', 'Baghdad'),
  ('80.35.0.1', '[30,60,90]', 1, NOW() - INTERVAL 1 HOUR, @video_id, NULL, 'IR', 'Tehran');

-- Views with NULL country and NULL city (unknown location)
INSERT INTO video_views (ip_address, view_events, is_viewed, created_at, video_id, user_id, country, city)
SELECT
  CONCAT('30.0.', FLOOR(n/256), '.', MOD(n, 256)),
  '[30,60,90]',
  1,
  NOW() - INTERVAL FLOOR(RAND() * 7) DAY,
  @video_id,
  NULL,
  NULL,
  NULL
FROM (
  SELECT a.N + b.N * 10 + 1 AS n
  FROM (SELECT 0 AS N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4
        UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) a,
       (SELECT 0 AS N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4) b
  LIMIT 50
) nums;

-- Update view counter
UPDATE videos
SET statistics_view_count = (
  SELECT COUNT(*) FROM video_views WHERE video_id = @video_id
)
WHERE id = @video_id;
