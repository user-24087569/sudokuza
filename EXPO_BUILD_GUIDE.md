# Sudokuza Build Guide: Expo + EAS Build (no local Java/Android SDK needed)

This is the alternative to the Capacitor route in `BUILD_GUIDE.md`. It wraps
the exact same game in a thin native shell (a full-screen WebView showing
the game) and builds it on Expo's own cloud servers instead of on your
machine, so you skip the Java version conflicts, the Android SDK download,
and the manual keystore/Gradle wiring entirely. You can run every step
below in the same Codespace terminal you're already using; only Node.js is
required locally.

**Trade-off to know about:** EAS Build's free tier queues builds behind
other free users, so a build can take anywhere from a few minutes to
sometimes 30+ minutes at busy times. Paid tiers build faster. There's no
cost to try the free tier first.

---

## What's in this package

```
sudokuza-expo/
├── App.js                  ← the native shell: one full-screen WebView
├── app.json                ← Expo config (name, android.package, icons)
├── eas.json                ← build profiles (preview = APK, production = AAB)
├── gameHtml.js             ← the game, auto-generated, do not hand-edit
├── generate-game-asset.py  ← regenerates gameHtml.js if you edit the game
├── source-game/index.html  ← the actual game source (edit this, not gameHtml.js)
└── assets/                 ← your app icon, adaptive icon, splash, favicon
```

`android.package` in `app.json` is already set to `com.veenslay.sudokuza`,
matching what you chose for the Capacitor route. Use only one of the two
routes for your actual Play Store submission though; a single app listing
needs one package name, built one way, not both.

---

## Step 1. Scaffold a real Expo project

Expo's CLI generates its own `package.json` with dependency versions that
are guaranteed to match each other, so start from its template rather than
one I hand-write (versions here move fast enough that a hardcoded
`package.json` risks being stale by the time you use it):

```
npx create-expo-app@latest sudokuza-app
```

This creates a fresh `sudokuza-app/` folder with a default starter project.

## Step 2. Drop in the Sudokuza files

Copy everything from this `sudokuza-expo/` package into that new
`sudokuza-app/` folder, overwriting the scaffolded `App.js` and `app.json`:

```
cp -r sudokuza-expo/App.js sudokuza-expo/app.json sudokuza-expo/eas.json \
      sudokuza-expo/gameHtml.js sudokuza-expo/generate-game-asset.py \
      sudokuza-expo/source-game sudokuza-expo/assets \
      sudokuza-app/
cd sudokuza-app
```
(Adjust the paths if you unzipped things somewhere other than expected;
the idea is just: everything from `sudokuza-expo/` lands inside
`sudokuza-app/`, replacing its default `App.js`, `app.json`, and `assets/`.)

## Step 3. Install the WebView dependency

```
npx expo install react-native-webview
```
Using `expo install` instead of plain `npm install` matters here, since it picks
the exact version of the library that matches your Expo SDK version, which
avoids a common source of build failures.

## Step 4. Log in to Expo and link the project

```
npx eas-cli@latest login
```
(Sign up for a free account at [expo.dev/signup](https://expo.dev/signup)
first if you don't have one.)

```
npx eas-cli@latest init
```
This links your local folder to a project on Expo's servers.

## Step 5. Try a quick preview build (installable APK)

Good for confirming everything works before you commit to a full Play
Store-ready build:
```
npx eas-cli@latest build --platform android --profile preview
```
This uploads your project, builds it on Expo's servers, and gives you a
download link for an `.apk` file when it's done. Install that directly on
an Android phone (enable "install from unknown sources" for the browser or
file app you use to open it) to see Sudokuza running as a real app.

## Step 6. Build the Play Store release (signed AAB)

```
npx eas-cli@latest build --platform android --profile production
```
**The first time you run this**, EAS will ask whether it should generate
and securely manage an Android signing keystore for you. Say yes, since this
replaces the entire manual `keytool` / `keystore.properties` /
`build.gradle` dance from the Capacitor route. Expo stores the keystore
encrypted on their servers and reuses it for every future build of this
app, which is exactly what you want (the same key must sign every update
forever).

When the build finishes, you'll get a link to download the signed `.aab`
file, ready to upload to the Play Console.

## Step 7. Upload to the Play Console

Same as the Capacitor route: head to
[play.google.com/console](https://play.google.com/console), open or create
your app listing, go to a release track (start with **Internal testing**),
and upload the `.aab`. See the submission checklist in `README.md` (in the
Capacitor package) for what else the listing needs. It's identical
regardless of which build route you used.

**Optional:** `eas submit --platform android` can upload the build directly
from the command line instead of through the Play Console website, once
you've connected a Google Play service account key. This is a nice-to-have
for later, not needed for your first submission.

---

## If you edit the game later

Edit `source-game/index.html` (the same file as `www/index.html` in the
Capacitor package), then regenerate the embedded copy:
```
python3 generate-game-asset.py
```
Then build again from Step 5 or 6.

## Troubleshooting

- **`eas build` asks about an Android package name conflict**: this means
  `com.veenslay.sudokuza` is already registered to a different Expo
  project under your account (for example if you ran `init` twice). Check
  your projects at [expo.dev](https://expo.dev) and either reuse the
  existing one or pick a fresh package name if this one was a false start.
- **Build fails with a WebView-related native error**: double check you
  ran `npx expo install react-native-webview` (not plain `npm install
  react-native-webview`) so the version matches your Expo SDK.
- **Fonts don't load / game looks unstyled on first launch**: the game
  loads Fraunces and Inter from Google Fonts over the network on first
  run, same as the Capacitor version. This needs an internet connection
  the first time; after that the device's own font cache usually covers
  it. If you'd rather it work fully offline from the very first launch,
  that requires bundling the font files into the app instead of
  fetching them, which is a further step I can help with if you want it.
