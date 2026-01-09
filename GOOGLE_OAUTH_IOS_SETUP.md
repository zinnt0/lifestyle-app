# Google OAuth für iOS - Setup Anleitung

## Übersicht
Diese Anleitung zeigt dir, wie du Google OAuth speziell für iOS konfigurierst, damit Nutzer nach dem Login automatisch zur App zurückgeleitet werden.

## App-Konfiguration

### Bundle Identifier
```
com.anonymous.lifestyleapp
```

### Deep Link Scheme
```
lifestyleapp://
```

### OAuth Redirect URL
```
lifestyleapp://auth/callback
```

---

## Google Cloud Console Konfiguration

### 1. OAuth Client ID für iOS erstellen

1. Öffne die [Google Cloud Console](https://console.cloud.google.com/)
2. Wähle dein Projekt aus
3. Navigiere zu **APIs & Services** > **Credentials**
4. Klicke auf **+ CREATE CREDENTIALS** > **OAuth client ID**
5. Wähle **iOS** als Application type

### 2. iOS Client konfigurieren

Fülle die folgenden Felder aus:

- **Name**: `Lifestyle App (iOS)`
- **Bundle ID**: `com.anonymous.lifestyleapp`

### 3. Client ID notieren

Nach dem Erstellen erhältst du eine **Client ID** (endet auf `.apps.googleusercontent.com`).

**Diese Client ID wird NICHT in der App verwendet**, sondern nur in der Google Cloud Console zur Identifizierung des iOS Clients.

---

## Supabase Konfiguration

### 1. Google Provider aktivieren

1. Öffne dein Supabase Dashboard
2. Navigiere zu **Authentication** > **Providers**
3. Aktiviere **Google**

### 2. Redirect URLs konfigurieren

Füge folgende Redirect URLs hinzu:

```
lifestyleapp://auth/callback
exp://localhost:8081
https://wnbxenverpjyyfsyevyj.supabase.co/auth/v1/callback
```

**Erklärung:**
- `lifestyleapp://auth/callback` - Für die Production iOS App
- `exp://localhost:8081` - Für Expo Go während der Entwicklung
- `https://...supabase.co/auth/v1/callback` - Für Web (falls benötigt)

### 3. Client IDs hinzufügen

In den Supabase Google Provider Einstellungen:

1. **Web Client ID** - Deine bestehende Web Application Client ID (falls vorhanden)
2. **iOS Client ID** - Die neu erstellte iOS Client ID

---

## App Code Änderungen (bereits implementiert ✅)

### 1. auth.service.ts
Der `signInWithGoogle()` Service wurde aktualisiert:
- ✅ Verwendet `lifestyleapp://auth/callback` als Redirect URL
- ✅ Kein Session-Polling mehr notwendig
- ✅ Deep Link Callback übernimmt die Session-Verwaltung

### 2. AppNavigator.tsx
Der Deep Link Handler wurde bereits implementiert:
- ✅ Erkennt OAuth Callbacks (`?code=` oder `#access_token=`)
- ✅ Tauscht Authorization Code gegen Session aus
- ✅ Setzt Session bei Direct Tokens
- ✅ Aktualisiert Auth State automatisch

### 3. Login & Register Screens
- ✅ Rufen `signInWithGoogle()` ohne Callback auf
- ✅ Loading State wird nach 1 Sekunde automatisch zurückgesetzt

---

## Testing

### Expo Go (Entwicklung)

1. Starte die App mit `npx expo start`
2. Scanne den QR Code mit Expo Go
3. Klicke auf "Mit Google anmelden"
4. Der Browser öffnet sich
5. Wähle dein Google Konto
6. Nach dem Login wirst du zu Expo Go zurückgeleitet

**Deep Link**: `exp://localhost:8081/--/auth/callback`

### Production Build (iOS)

1. Erstelle einen Build mit `eas build --platform ios`
2. Installiere die App auf deinem Gerät
3. Klicke auf "Mit Google anmelden"
4. Safari öffnet sich für die Authentifizierung
5. Nach dem Login wird die App automatisch geöffnet

**Deep Link**: `lifestyleapp://auth/callback`

---

## Troubleshooting

### Problem: "redirect_uri_mismatch" Fehler

**Lösung:**
- Stelle sicher, dass `lifestyleapp://auth/callback` in den Supabase Redirect URLs enthalten ist
- Prüfe, dass die iOS Client ID in Supabase eingetragen ist

### Problem: App öffnet sich nicht nach Login

**Lösung:**
- Überprüfe, dass `scheme: "lifestyleapp"` in [app.json](app.json:5) konfiguriert ist
- Teste den Deep Link manuell: `xcrun simctl openurl booted "lifestyleapp://auth/callback"`

### Problem: Session wird nicht erkannt

**Lösung:**
- Prüfe die Logs in der Console für OAuth Callback Meldungen
- Stelle sicher, dass `detectSessionInUrl: true` in [supabase.ts](src/lib/supabase.ts) gesetzt ist
- Checke die Deep Link Handler in [AppNavigator.tsx](src/navigation/AppNavigator.tsx:87-195)

---

## Nächste Schritte

1. ✅ Code Änderungen sind bereits implementiert
2. ⏳ **iOS OAuth Client ID in Google Cloud erstellen**
3. ⏳ **iOS Client ID in Supabase Google Provider eintragen**
4. ⏳ **Redirect URL `lifestyleapp://auth/callback` in Supabase hinzufügen**
5. ⏳ **Testen mit Expo Go**
6. ⏳ **Production Build erstellen und testen**

---

## Zusätzliche Ressourcen

- [Supabase OAuth Guide](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google OAuth iOS Setup](https://developers.google.com/identity/protocols/oauth2/native-app)
- [Expo Linking Documentation](https://docs.expo.dev/guides/linking/)
- [React Navigation Deep Linking](https://reactnavigation.org/docs/deep-linking/)
