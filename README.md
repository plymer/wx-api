# WX-API

served at api.prairiewx.ca

# Endpoints

`/alpha/metars` returns a JSON collection of METARs for the selected site and number of hours

Params:

- `site`: 4-letter ICAO identifier for the site
- `hrs`: integer number of hours of requested METARs

---

`/alpha/taf` returns a JSON string containing the TAF for the selected site

Params:

- `site`: 4-letter ICAO identifier for the site

---

`/alpha/sitedata` returns a JSON string containing the metadata for the selected site

Params:

- `site`: 4-letter ICAO identifier for the site

---

`/alpha/hubs` returns a JSON string containing the forecast discussion for the selected hub

Params:

- `site`: 4-letter ICAO identifier for the site

---

`/charts/gfa` returns a JSON string containing links to all of the GFA panels on NAVCanada's servers

---

`/charts/sigwx` returns a JSON string containing links to all of the HLTs and SIGWX charts on NAVCanada's servers

---

`/charts/lgf` returns a JSON string containing links to all of the current LGF panels on NAVCanada's servers
