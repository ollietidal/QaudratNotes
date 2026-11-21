# QuadratNotes export guide

Version 0.18.3. Every export uses the same columns whatever the habitat; columns that don't apply are left blank.
Changes to export columns and files are listed in [CHANGELOG.md](../CHANGELOG.md).

General conventions:
- Dates are `YYYY-MM-DD`. Times (`recorded_at`, `conditions_time`) are ISO 8601 in UTC.
- Lists within a cell are separated by semicolons, e.g. `23;16;12`.
- Coordinates are WGS84 decimal degrees.
- **Grid squares** are numbered 1–25, row by row from the top-left of the on-screen grid (1–5 is the top row).
  Positions only mean something if the quadrat is always held the same way round.
- In rocky shore and saltmarsh surveys, species stay listed from quadrat to quadrat. A species listed but left at 0
  is a **recorded absence**, so zeros are real data.

## Quadrats table (`*_quadrats.csv`): one row per quadrat

| Column | Habitats | Meaning |
|---|---|---|
| survey_id | all | Readable survey code: site and date, e.g. `wilcove-2026-10-14` (`-2` added for a second survey the same day). Accented letters are folded to plain ones (Porth Llŷn → `porth-llyn`) |
| quadrat_id | all | Survey code plus quadrat, e.g. `wilcove-2026-10-14-Q01`. Use this to join to the species table |
| site, surveyor, survey_date | all | As entered at survey setup |
| habitat | all | Seagrass, Rocky shore or Saltmarsh |
| region | all | Seagrass: bioregion (Short et al. 2007). Rocky shore and saltmarsh: `NE Atlantic` or `Elsewhere (broad groups)` |
| quadrat_side_cm, quadrat_area_m2 | all | Quadrat size |
| sampling_design | all | random, haphazard, nonrandom, transect, fixed, or `other: <description>` |
| survey_area_m2 | all | Area of the survey outline, if random points were placed in a drawn or walked area |
| conditions_time | all | When conditions were looked up (blank if not used) |
| weather, air_temp_c, wind_speed_kmh, wind_from, wind_gust_kmh, pressure_hpa | all | Open-Meteo values for the survey (same on every row of a survey). `wind_from` is a 16-point compass direction; pressure is at mean sea level |
| tide_height_m_msl, tide_state | all | Modelled tide relative to **mean sea level, not chart datum**, about 8 km resolution; rising or falling. For context only |
| quadrat | all | Quadrat number |
| transect, distance_from_start_m | all | Transect name and position along it, if quadrats were placed along transects |
| plot_id | all | Fixed plot name, if fixed plots were used. Filled with the fixed point's name when a quadrat is saved at a fixed point and the box was left blank |
| point_id | all | The random or fixed point the quadrat was saved at (random: `P01`, `P02`…; fixed: the point's name). Blank if not linked to a point |
| planned_latitude, planned_longitude | all | Position of that point |
| distance_from_point_m | all | How far the quadrat's recorded position was from the point (quadrats are only linked within 25 m) |
| recorded_at | all | When the quadrat was first saved |
| latitude, longitude | all | Quadrat position |
| gps_accuracy_m | all | Reported horizontal GPS accuracy (blank if coordinates were typed). Kept to the centimetre for external GNSS/DGPS/RTK receivers |
| gps_altitude_m, gps_altitude_accuracy_m | all | Height and vertical accuracy exactly as the device reports them. The reference level depends on the device (often the WGS84 ellipsoid, not sea level or chart datum), and phone heights are usually only good to ±10–30 m, so convert and check before use |
| seagrass_cover_pct | seagrass | Total seagrass cover |
| n_species | all | Seagrass: species listed. Rocky shore and saltmarsh: taxa present (above 0) |
| epiphytes | seagrass | None, Low, Medium or High |
| algae_cover_pct | seagrass | Macroalgae cover |
| sediment | seagrass | Mud, Muddy sand, Sand, Gravel or Mixed |
| zone | rocky, saltmarsh | Rocky: Splash zone, Upper shore, Mid shore, Lower shore, Sublittoral fringe. Saltmarsh: Pioneer, Low marsh, Mid marsh, Upper marsh, Transition |
| height_above_cd_m | rocky | Height above chart datum, if entered |
| elevation_m | saltmarsh | Elevation, if entered (datum should be stated in survey notes) |
| substrate | rocky | Bedrock, Boulders, Cobbles, Pebbles or Mixed |
| rock_pool | rocky | yes or no |
| bare_rock_pct | rocky | Bare rock (counts towards the understorey) |
| canopy_total_pct | rocky | Sum of canopy-layer cover (up to 100) |
| understorey_total_pct | rocky | Sum of understorey cover plus bare rock (up to 100) |
| bare_ground_pct, litter_pct | saltmarsh | Bare ground; litter and strandline |
| vegetation_height_mean_cm, vegetation_height_n, vegetation_heights_cm | saltmarsh | Vegetation height: mean, number of measurements, all values |
| grazing | saltmarsh | None, Light, Moderate or Heavy (grazing or trampling) |
| boot_sink_cm … core_id | mudflat | Mudflat module only (currently switched off) |
| cover_grid_squares | seagrass | Grid squares tapped for total cover (blank if % was typed) |
| bare_grid_squares | rocky, saltmarsh | Grid squares tapped for bare rock or bare ground |
| photo_files | all | Photo file names in the zip's `photos` folder |
| notes | all | Quadrat notes |

## Species table (`*_species.csv`): one row per species per quadrat

| Column | Habitats | Meaning |
|---|---|---|
| survey_id, quadrat_id, site, survey_date, habitat, quadrat | all | As above; join on `quadrat_id` |
| species | all | Scientific name or broad group (e.g. `Balanomorpha` for barnacles, `Rhodophyta` for red algal turf). `None` for a seagrass quadrat with no seagrass |
| evidence | mudflat | Type of surface sign counted (casts, burrows…); counts are signs, not individuals |
| layer | rocky | canopy or understorey, for cover species |
| species_cover_pct | all | % of the quadrat. Seagrass: each species' share (together up to 100). Rocky: within its layer (each layer up to 100). Saltmarsh: plants overlap, so totals can exceed 100 |
| domin | saltmarsh | Domin class 1–10 from % cover; below 4% it uses few, several or many plants, or `1-3` if not chosen |
| count | rocky, mudflat | Number of individuals counted (in the sub-sample, if one was used) |
| subsample_area_m2, count_per_quadrat | mudflat | Sub-sample size and the count scaled to the whole quadrat |
| count_density_m2 | rocky, mudflat | Count per square metre |
| shoot_count, shoot_density_m2 | seagrass | Shoots in the quadrat and per square metre |
| canopy_height_mean_cm, canopy_height_n, canopy_heights_cm | seagrass | Canopy height: mean, number of measurements, all values |
| grid_squares, grid_squares_n | all | Grid squares tapped for that species, and how many (sub-quadrat frequency out of 25) |

## Joining the tables in R

```r
library(dplyr)
quadrats <- read.csv("site_2026-11-17_quadrats.csv")
species  <- read.csv("site_2026-11-17_species.csv")
dat <- left_join(species, select(quadrats, quadrat_id, zone, latitude, longitude, sampling_design), by = "quadrat_id")
```

One row per tapped square: `tidyr::separate_longer_delim(species, grid_squares, ";")`.

## Random points table (`*_random_points.csv`): one row per random point

Included in the zip when random points were used.

| Column | Meaning |
|---|---|
| survey_id, site, survey_date | As above |
| point_id | `P01`, `P02`… in walking order |
| latitude, longitude | The point's position |
| status | surveyed, skipped or not visited |
| skip_reason | Underwater, Unsafe, Can't reach or Other |
| quadrat_id, quadrat_gps_accuracy_m | The quadrat recorded at the point, and its GPS accuracy |
| survey_area_m2, points_requested, min_spacing_m, random_seed | The survey area and settings (the same on every row of a survey). The seed and outline reproduce the same points |
| outline_method | drawn on map, walked with GPS, or both |
| corner_gps_accuracy_m, outline_max_gps_accuracy_m | GPS accuracy of each walked corner (`;`-separated) and the worst of them |

## Fixed points table (`*_fixed_points.csv`): one row per fixed point

Included in the zip when fixed points were used, and downloadable from the Fixed points screen.
The file can be imported into a later survey, so the same points and names are reused.

| Column | Meaning |
|---|---|
| survey_id, site, survey_date | As above |
| point_id | The point's name (e.g. `P01`, or the name from an imported file) |
| latitude, longitude | The point's position |
| point_gps_accuracy_m | For points marked on site: the median accuracy of the GPS readings averaged over 20 seconds. Blank for points placed on the map or imported |
| how_added | marked on site, placed on map, or imported from file |
| status | surveyed, skipped or not visited |
| skip_reason | Underwater, Unsafe, Can't reach or Other |
| quadrat_id, quadrat_gps_accuracy_m | The quadrat recorded at the point, and its GPS accuracy |

## Map files (More formats → GeoJSON or KML)

One point per quadrat with its details and a species summary, plus, if used, the survey area outline,
random points and fixed points. In GeoJSON each feature has a `feature_type`: `quadrat`, `survey_area`,
`random_point` or `fixed_point`. KML groups them in a folder per survey.

## Photos

Photos are named `site_date_Qnn_n.jpg` and listed in `photo_files`. They are resized to at most 1600 px when taken.
In the zip export, each photo carries its quadrat's details as standard EXIF: GPS position and accuracy (if the
quadrat has a position), the time it was recorded (`DateTimeOriginal`, with time-zone offset) and a description
with the species list, site and quadrat ID. Photo tools and the iNaturalist web uploader can read these.
Backups keep the photos exactly as stored.

## Darwin Core archive (More formats → Download for OBIS / GBIF)

| File | Contents |
|---|---|
| event.txt | Each survey as a parent event, each quadrat as a child event (date and time, position, quadrat area, habitat, sampling protocol) |
| occurrence.txt | Each species per quadrat as present or absent, with kingdom and WoRMS ID (`scientificNameID`) where it could be looked up |
| extendedmeasurementorfact.txt | Cover (with layer), Domin, counts and densities, shoot counts, canopy heights, quadrat measurements and survey conditions |
| meta.xml, eml.xml | File map and dataset description (title, dates, area, method, licence, credit) |

Defaults: CC BY 4.0, exact locations, no surveyor names, credit taken from the Surveyor field. All can be changed under Options.
Grid square positions are not included, as they aren't a standard OBIS field.
