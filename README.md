# WX-API

served at api.prairiewx.ca

# Endpoints

`/metars` returns a JSON collection of METARs for the selected site and number
of hours

Params:

- `site`: 4-letter ICAO identifier for the site
- `hrs`: integer number of hours of requested METARs

---

`/taf` returns a JSON string containing the TAF for the selected site

Params:

- `site`: 4-letter ICAO identifier for the site

---

`/sitedata` returns a JSON string containing the metadata for the selected site

Params:

- `site`: 4-letter ICAO identifier for the site
