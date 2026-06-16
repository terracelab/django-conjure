# Conjure docs site

The documentation site for [Conjure](https://conjure.terracelab.co.kr), built with **MkDocs
Material** and versioned with **mike**. It lives in the monorepo so docs ship with the
release — the parts that describe the code are *generated from* the code.

## Run it locally

```bash
cd apps/docs
pip install -r requirements.txt
python gen/gen_config_reference.py   # refresh generated tables (see below)
mkdocs serve                         # http://localhost:8000
```

`mkdocs serve` live-reloads on edits. Re-run the generator if you change
`packages/conjure/conjure/conf.py`.

## Layout

```text
apps/docs/
├── mkdocs.yml              # Material theme, nav, markdown extensions, mike provider
├── requirements.txt        # mkdocs-material, mike, pymdown-extensions
├── README.md               # this file
├── gen/                    # code → docs generators (see gen/README.md)
│   ├── gen_config_reference.py   # ✅ settings table from conf.py
│   ├── gen_openapi.py            # 📋 stub — REST API from drf-spectacular
│   └── gen_cli.py                # 📋 stub — CLI from --help
└── docs/
    ├── index.md            # home / 30-second overview
    ├── stylesheets/extra.css  # brand tokens → Material variables
    ├── getting-started/    # install · first model · first screen
    ├── guides/             # registering models · custom pages · theming · sections · exporting
    ├── actions-permissions/   # concept · scenarios (📋 design)
    ├── reference/          # configuration · rest-api · cli · field-support
    │   └── _generated_config.md   # ← generated, do not edit
    ├── customization/      # extension hooks · extension points table
    ├── migrating/          # from Django admin
    ├── contributing/       # dev setup · releasing · extension development
    └── roadmap.md
```

## Code → docs generators

Reference tables are generated so they can't drift from the code. Run them before building;
CI runs them too. See [`gen/README.md`](gen/README.md) for details.

```bash
python gen/gen_config_reference.py   # → docs/reference/_generated_config.md
```

`gen_config_reference.py` AST-parses `conjure/conf.py`'s `DEFAULTS` dict (no import / no
Django setup needed) and writes the settings table that `reference/configuration.md`
includes via `--8<-- "reference/_generated_config.md"`. If `conf.py` isn't present it falls
back to the authored table, so the build never breaks.

## Versioning with `mike`

`mike` keeps one published copy of the docs per release, with a version switcher in the
header (wired by `extra.version.provider: mike` in `mkdocs.yml`). Readers on `0.1` see `0.1`
docs.

```bash
mike deploy 0.1 latest --update-aliases   # deploy a version, move the "latest" alias
mike set-default latest                    # what visitors land on
mike serve                                 # preview the versioned site locally
mike list                                  # show deployed versions
```

## Deployment is automated

You normally **don't** deploy docs by hand. The release pipeline runs `mike deploy X.Y
latest` on every tagged release, so publishing the package publishes its docs in the same
step — "release = docs release". See
[Releasing](docs/contributing/releasing.md) for the full pipeline.

## Brand

Colors and density come from `brand/tokens.css` (the single source of truth for the package,
docs, and landing site). `docs/stylesheets/extra.css` maps those tokens onto MkDocs
Material's variables — accent `#4f46e5`, dark surfaces `#0b0b0f`. Don't hardcode brand
colors here; change them in `brand/`.
