# firebase-config-sync

Synchronize Firebase Functions config variables with ease. Keep your config checked in to source control!

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
firebase-config-sync
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
firebase functions:config:set someservice.key="THE API KEY" someservice.id="THE CLIENT ID"
```

You can retrieve the config with this command:

```
firebase functions:config:get
```

It should return something that looks like this:

```
{
  "someservice": {
    "key":"THE API KEY",
    "id":"THE CLIENT ID"
  }
}
```

And that's exactly what you'd want your config files to look like.

## API

### Set
Upload config from config files to their Firebase projects

```
firebase-config-sync
```

#### Options
```
-c, --config <path>   Config file to find config files map in. Default: .firebaserc
-P, --projects        Whitelist of projects to set for      NOT IMPLEMENTED!
```

### Get
Download config from Firebase projects to their config files

NOT IMPLEMENTED
