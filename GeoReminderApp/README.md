# 📍 GeoReminder AI

> A smart, location-based reminder app that alerts you exactly when you **arrive at** or **leave** a specific place — powered by AI voice input, OpenStreetMap, and Groq.

If you find this project useful, please consider giving it a ⭐ star on GitHub — it helps others discover the project and motivates continued development.

---

## 📱 What is GeoReminder AI?

GeoReminder AI solves a simple but frustrating problem: **forgetting things tied to places**.

- Forgot to buy milk while passing the grocery store?
- Forgot to pick up a document when leaving the office?

This app lets you draw invisible boundaries (geofences) on a map and attach reminders to them. When your GPS enters or exits that boundary — you get notified instantly.

No subscriptions. No Google Maps API. 100% free stack.

---

## ✨ Features

### 🚀 Splash Screen
- Animated brand intro with logo scale-in effect on every launch

### 🌍 First-Time Location Setup (Onboarding)
- On first launch, the app asks you to select your **country** (required) and **city** (optional)
- This biases all AI searches and map lookups to your actual region — so "Metro Store" finds the right one near you, not one in another country
- Searchable country list with 40+ countries and flag emojis
- Can be updated anytime from **Settings → Your Location**

### 🏠 Home Dashboard
- **Bento Grid Metrics** — Active geofences, total reminders, triggered count at a glance
- **⚡ Proximity Simulator** — Teleport your simulated GPS to preset locations (Metro Store, University Gate, Times Square) to test triggers without physically going there. Tap again to deactivate.
- **Category Filter** — View reminders by All / Shopping / Office / Personal / Travel
- **Enable / Disable Toggle** — Turn individual reminders on or off without deleting them
- **Quick AI Access** — One tap to open AI reminder creation

### 🗺️ Map View Screen
- All your geofences plotted on OpenStreetMap with colored radius circles
- Color coded: 🔵 Active · 🟢 Triggered · ⚫ Disabled
- Tap any pin to see reminder details
- **Double-tap** any empty area on the map to instantly create a new reminder at that location

### 📌 Create / Edit Reminder
- Enter a title, select trigger type (Arrival / Exit), and choose radius (100m / 200m / 500m / 1km)
- **Map Search Bar** — Type a location name (e.g. "Centaurus Mall") and get instant results from OpenStreetMap. Tap a result and the map flies to that location automatically.
- Or tap anywhere on the map manually to drop a pin
- Blue radius circle updates live as you change the radius setting

### 🤖 AI Reminder (Voice + Text)
- **Voice Input** — Tap the mic, speak naturally, Groq Whisper transcribes it to text automatically
- **Text Input** — Type in plain English
- Groq Llama 3.1 extracts: task, location name, trigger type, and radius
- Nominatim searches the extracted location — biased to your country/city so results are local
- Pick from search results → confirm → reminder saved

**Example inputs:**
```
"Remind me to buy milk when I reach Metro Store"
"Call mom when I leave the office"
"Pick up medicine when I arrive at pharmacy"
"Fill up petrol when I pass the Shell station"
```

Works in **English and Urdu** — Groq Whisper supports both.

### 🛒 Shopping List
- Checklist with categories (Grocery, Pharmacy, Electronics, Clothing, Other)
- Link individual items to specific shopping geofences
- When you enter a linked shopping zone, the app triggers an alert showing exactly what to buy
- Clear all checked items with one tap

### 🕒 History Logs
- Full audit trail of every triggered reminder
- Shows: reminder name, arrival/exit type, GPS coordinates, exact time
- Entries grouped by date with relative timestamps ("2m ago", "3h ago")
- Clear all logs from Settings

### ⚙️ Settings
- **Your Location** — Update your country and city at any time. Affects AI search and map geocoding.
- **Dark Cosmic Mode / Light Bento Mode** — switch the entire app theme
- **Default Alert Radius** — 100m / 200m / 500m / 1km
- **Notifications toggle** — Enable or disable geo alerts
- **Clear History Logs** — Remove all trigger records
- **Reset All App Data** — Wipe reminders, history, and shopping list
- **App info** — Version, AI model, storage type

---

## 🏗️ Tech Stack

| Layer | Technology | Cost |
|---|---|---|
| Framework | React Native (Expo SDK 56) | Free |
| Maps | OpenStreetMap via Leaflet.js (WebView) | Free |
| Geocoding / Search | Nominatim (OpenStreetMap) | Free |
| AI Parsing | Groq · Llama 3.1 8B Instant | Free |
| Voice Transcription | Groq · Whisper Large v3 Turbo | Free |
| GPS Tracking | expo-location v15 | Free |
| Audio Recording | expo-av v15 | Free |
| Notifications | expo-notifications | Free |
| Storage | AsyncStorage (local, offline) | Free |
| Navigation | React Navigation v7 (Stack + Bottom Tabs) | Free |

**Total monthly cost: $0**

---

## 📁 Project Structure

```
GeoReminderApp/
├── App.js                          # Entry: splash → onboarding check → app
├── app.config.js                   # Expo config — reads API key from .env
├── eas.json                        # EAS Build profiles (APK + AAB)
├── .env                            # Local secrets — never committed to git
│
└── src/
    ├── context/
    │   └── ThemeContext.js         # Dark/Light theme provider + persistence
    │
    ├── navigation/
    │   └── AppNavigator.js         # Bottom tabs (Home/Map/Shopping/History/Settings)
    │                               # + Stack (CreateReminder, MapPicker, AIReminder)
    ├── screens/
    │   ├── SplashScreen.js         # Animated launch screen
    │   ├── OnboardingScreen.js     # First-time country/city setup
    │   ├── HomeScreen.js           # Bento dashboard, simulator, category feed
    │   ├── CreateReminderScreen.js # Add/edit reminder with map picker
    │   ├── MapPickerScreen.js      # OSM map + search bar + pin drop
    │   ├── MapViewScreen.js        # All geofences on map, double-tap create
    │   ├── AIReminderScreen.js     # Voice + text AI reminder flow
    │   ├── ShoppingListScreen.js   # Checklist linked to geofences
    │   ├── HistoryScreen.js        # Trigger log timeline
    │   └── SettingsScreen.js       # Theme, location, data management
    │
    ├── services/
    │   ├── storage.js              # Reminder CRUD (AsyncStorage)
    │   ├── historyStorage.js       # Trigger log CRUD (max 100 entries)
    │   ├── shoppingStorage.js      # Shopping list CRUD
    │   ├── settingsStorage.js      # Country/city preference storage
    │   ├── locationTracker.js      # GPS polling every 25s + simulator
    │   ├── notifications.js        # expo-notifications push sender
    │   └── groq.js                 # Groq AI — Llama parsing + Whisper STT
    │
    ├── utils/
    │   ├── distance.js             # Haversine formula (GPS → meters)
    │   ├── geocoding.js            # Nominatim search with country/city bias
    │   ├── mapCallback.js          # Bridge: map picker → create form
    │   └── countries.js            # 40+ countries with ISO codes + flag emojis
    │
    └── components/
        └── ReminderCard.js         # Reminder list card (used in legacy view)
```

---

## ⚙️ Core Logic

### Distance Calculation (Haversine Formula)
```
IF distance(current_GPS, reminder_location) ≤ radius
THEN trigger notification
```

### GPS Tracking Loop
```
Every 25 seconds:
  1. Get current GPS (or simulated location if simulator is active)
  2. For each ENABLED reminder:
     - Calculate distance using Haversine formula
     - trigger = "arrival" AND inside radius  → fire notification + log
     - trigger = "exit" AND was inside + now outside → fire notification + log
  3. Update wasInside state for exit-trigger reminders
```

### AI + Location Search Flow
```
User speaks or types
        ↓
[Voice] Groq Whisper Large v3 Turbo → transcribed text
        ↓
Groq Llama 3.1 8B (with user's city/country in system prompt)
        → { task, location, trigger, radius }
        ↓
Nominatim geocoding
  query = "Metro Store, Islamabad, Pakistan"
  countrycodes = "pk"  (filters results to user's country)
        ↓
If 0 results → retry without country filter (fallback)
        ↓
User selects result → Reminder saved ✅
```

### Location Bias System
```
User sets: Country = Pakistan, City = Islamabad

AI prompt gets:
  "The user is located in: Islamabad, Pakistan.
   Assume locations are in this area unless specified."

Nominatim gets:
  query = "<place>, Islamabad, Pakistan"
  countrycodes = "pk"

Result: Always finds local places first
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- EAS CLI (`npm install -g eas-cli`)
- Groq API key — free at [console.groq.com](https://console.groq.com)
- Expo account — free at [expo.dev](https://expo.dev)

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd GeoReminderApp
npm install
```

### 2. Set Up Environment Variables
Create a `.env` file in the project root:
```env
GROQ_API_KEY=your_groq_api_key_here
```
Get your free key at [console.groq.com](https://console.groq.com) → API Keys → Create Key.

> ⚠️ The `.env` file is already in `.gitignore` — it will never be committed to git.

### 3. Run in Development
```bash
npx expo start
```
Scan the QR code with Expo Go (make sure it is updated to the latest version).

### 4. Build APK (Android)
```bash
# Login to Expo
eas login

# Add your Groq key as an EAS encrypted secret (one time)
eas env:create --name GROQ_API_KEY --value "your_key_here" --environment production --visibility secret --type string

# Build APK — free cloud build (~5–10 min)
eas build --platform android --profile preview
```
Download the `.apk` link from the build output and install directly on any Android phone.

### 5. Build for Play Store (AAB)
```bash
eas build --platform android --profile production
```

---

## 🔐 API Key Security

The Groq API key is **never hardcoded** in source files.

| Layer | How it's protected |
|---|---|
| Source code | Key read from `Constants.expoConfig.extra.groqApiKey` — no hardcoded value |
| Local dev | Stored in `.env` file only |
| Git | `.env` is in `.gitignore` — never pushed to any repository |
| EAS cloud builds | Stored as an encrypted EAS environment variable — not visible in plain text |

---

## 🔑 External Services

| Service | Purpose | Cost | Key Required |
|---|---|---|---|
| Groq | AI reminder parsing + voice transcription | Free (14,400 req/day) | Yes — [console.groq.com](https://console.groq.com) |
| OpenStreetMap | Map tiles (via Leaflet.js) | Free, unlimited | No |
| Nominatim | Place search / geocoding | Free, no account needed | No |

---

## 📲 Android Permissions

| Permission | Reason |
|---|---|
| `ACCESS_FINE_LOCATION` | Precise GPS coordinates for geofence checking |
| `ACCESS_COARSE_LOCATION` | Approximate location fallback |
| `ACCESS_BACKGROUND_LOCATION` | Trigger reminders when app is minimized or screen is off |
| `FOREGROUND_SERVICE` | Keep GPS tracking running in the background |
| `FOREGROUND_SERVICE_LOCATION` | Required for background location on Android 14+ |
| `RECORD_AUDIO` | Voice input for AI reminder creation |
| `RECEIVE_BOOT_COMPLETED` | Restart location tracking after phone reboot |

---

## 🧪 Testing with Proximity Simulator

Since physically traveling to test each geofence is impractical, the app includes a built-in **Proximity Simulator**:

1. Go to **Home Dashboard**
2. Find the **⚡ Proximity Simulator** panel
3. Tap any preset location (Metro Store, University Gate, Times Square)
4. The app instantly simulates your GPS at that coordinate
5. All enabled reminders are checked immediately — matching ones fire their notification
6. A green **ACTIVE** badge shows the simulator is running
7. Tap the same location again (or "My Location") to deactivate and return to real GPS

---

## 🗺️ Map Usage

### Picking a Location (Create Reminder)
- Use the **search bar** at the top — type any place name and tap Search
- Results are biased to your country/city (set in Settings)
- Tap a result — the map flies to that location and drops a pin automatically
- Or tap anywhere on the map manually to place a pin
- The blue circle preview shows the trigger radius

### Viewing All Geofences (Map Tab)
- All saved reminders appear as colored dots with radius circles
- Tap any dot to see its details in a popup
- **Double-tap** any empty area to create a new reminder at that exact spot

---

## 🌍 Location Bias (How AI Finds the Right Place)

When you set your country/city in Settings (or on first launch), the AI and map search both use this context:

**Without location set:**
> "Metro Store" → could return Metro AG (Germany), Metro Manila (Philippines), or anywhere else

**With location set to Pakistan / Islamabad:**
> "Metro Store" → Metro Cash & Carry, Islamabad ✅

The system appends your city and country to every search query and restricts Nominatim results using the ISO country code filter. If no results are found within your country, it falls back to a global search automatically.

---

## 🤖 AI Examples

| You say / type | AI creates |
|---|---|
| "Buy milk when I reach Metro Store" | Task: Buy milk · Location: Metro Store · Arrival · 100m |
| "Call mom when I leave the office" | Task: Call mom · Location: Office · Exit · 200m |
| "Pick up medicine at City Pharmacy" | Task: Pick up medicine · Location: City Pharmacy · Arrival · 100m |
| "Remind me to pray when I reach mosque" | Task: Pray · Location: Mosque · Arrival · 200m |
| "Get petrol before leaving the city" | Task: Get petrol · Location: city boundary · Exit · 1000m |

---

## 🔮 Planned Features

- [ ] Supabase cloud sync — backup reminders across devices
- [ ] Repeat reminders — daily / weekly geofence triggers
- [ ] Smart AI suggestions based on current surroundings
- [ ] Home screen widget
- [ ] iOS build

---

## 🤝 Contributing

Contributions are welcome. If you want to fix a bug, add a feature, or improve the code, follow the steps below.

### Workflow

```
1. Fork the repository
2. Create a new branch for your change
3. Make your changes
4. Test on a real device or emulator
5. Open a Pull Request
```

### Branch Naming

Use a clear, descriptive branch name:

| Type | Format | Example |
|---|---|---|
| New feature | `feature/your-feature-name` | `feature/repeat-reminders` |
| Bug fix | `fix/what-you-fixed` | `fix/map-crash-on-search` |
| UI improvement | `ui/what-you-improved` | `ui/dark-mode-contrast` |
| Refactor | `refactor/what-you-changed` | `refactor/location-tracker` |

### Step-by-Step

**1. Fork & Clone**
```bash
# Fork via GitHub UI, then:
git clone https://github.com/YOUR_USERNAME/GeoReminderApp.git
cd GeoReminderApp
npm install
```

**2. Create a Branch**
```bash
git checkout -b feature/your-feature-name
```

**3. Set Up Environment**
```bash
# Create .env file with your own Groq key
cp .env.example .env
# Then edit .env and add your key
```

**4. Run the App**
```bash
npx expo start
```

**5. Make Your Changes**
- Keep changes focused — one feature or fix per pull request
- Do not break existing features
- All user-facing text must be in English

**6. Commit Your Changes**
```bash
git add .
git commit -m "feat: add repeat reminder support"
git push origin feature/your-feature-name
```

Use clear commit messages:
- `feat:` — new feature
- `fix:` — bug fix
- `ui:` — visual/design change
- `refactor:` — code improvement with no behavior change
- `docs:` — documentation only

**7. Open a Pull Request**
- Go to the original repository on GitHub
- Click **New Pull Request**
- Select your branch
- Describe what you changed and why
- Reference any related issues (e.g. `Closes #12`)

### What to Work On

Check the **Planned Features** section above for ideas. You can also open a GitHub Issue to suggest something or report a bug before starting work.

### Important Notes

- Never commit your `.env` file — it is in `.gitignore` for a reason
- Never hardcode any API keys in source files
- Test on Android before submitting — this is a mobile app
- The app uses OpenStreetMap and Groq free tiers — keep third-party dependencies free where possible

---

## 👨‍💻 Developer

**Ameer Muavia**
- Built with React Native + Expo SDK 56
- AI powered by Groq (free tier) — Llama 3.1 + Whisper
- Maps by OpenStreetMap + Leaflet.js — free forever
- Zero paid APIs or subscriptions

---

## ⭐ Support the Project

If this project helped you or you find it interesting, please **star the repository** on GitHub.

It takes one second and makes a real difference — it helps other developers find the project and shows that the work is valued.

[![Star on GitHub](https://img.shields.io/github/stars/ameermuavia2/GeoReminderApp?style=social)](https://github.com/ameermuavia2/GeoReminderApp)

---

## 📄 License

MIT License — free to use, modify, and distribute.
