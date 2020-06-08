# firebase-config-sync

Synchronize Firebase Functions config variables with ease from local config (.env) files.

```
npm install --dev firebase-config-sync
```

The Firebase CLI is a peer dependency of this, so if you don't already have it installed, do it:

```
npm install --dev firebase-tools
```

## So what's this?
This is a CLI for uploading a whole JSON file full of Firebase Function config variables to a Firebase project.
The normal way of updating your config is setting variables one by one. See the docs here: https://firebase.google.com/docs/functions/config-env

But with `firebase-config-sync` you can upload all your config at once, with the following command:

```
firebase-config-sync set
```

All you need is to configure which files go to which Firebase projects. Do this by adding a field `configFiles` in your `.firebaserc`:

```
// .firebaserc
{
  "projects": {
    "prod": "awesomeproject-prod",
    "staging": "awesomeproject-staging",
    "dev": "awesomeproject-dev"
  },
  "configFiles": {
    "prod": ".env.prod.json",
    "staging": ".env.staging.json",
    "dev": ".env.dev.json"
  }
}
```

The keys in `configFiles` should equal those in `projects`. `firebase-config-sync` will upload config for all projects found in `configFiles`, overwriting existing config.

## What do these config files look like?

Normally when setting a config variable, you do it like this:

```
firebase functions:config:set some_service.key="THE API KEY" someservice.id="THE CLIENT ID"
```

You can retrieve the config with this command:

```
firebase functions:config:get
```

It should return something that looks like this:

```
{
  "some_service": {
    "key":"THE API KEY",
    "id":"THE CLIENT ID"
  }
}
```

And that's what you'd want your config files to look like. But wait, there's more! `firebase-config-sync` will stringify the values (if they're not already strings), and parse them when downloaded. This allows you to use more complex types like booleans, arrays and objects in your config files:

```
{
  "some_service": {
    "some_list_of_cheeses": [
      "camembert",
      "brie",
      "jarlsberg"
    ]
  }
}
```

## API

### Set
Upload config from config files to their Firebase projects

```
firebase-config-sync set
```

#### Options
```
-c, --config <path>     Config file to find config files map in. Default: .firebaserc
-P, --project <names>   Comma-separated list of project names to deploy to. Default is all projects.
-q, --quiet             Disable all logging
```

### Get
Download config from Firebase projects to their config files

```
firebase-config-sync get
```

#### Options
```
-c, --config <path>     Config file to find config files map in. Default: .firebaserc
-P, --project <names>   Comma-separated list of project names to fetch for. Default is all projects.
-q, --quiet             Disable all logging
-i, --ignore            Don't save properties that don't already exist in local file
-s, --sort              Sort config alphabetically before saving to config file
-f, --file <path>       Custom file to save to, if you don't want to use the one specified in configFiles
```
