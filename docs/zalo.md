# Zalo integration facts

Confidence:

- **Official:** read in Zalo's docs.
- **Observed:** seen from the real API.
- **Secondary:** Zalo PHP SDK or community code only.
- **Unverified:** assumption. Check before relying on it.

Docs moved to `https://docs.zaloplatforms.com/docs/MA/...`. Old `mini.zalo.me` links redirect there. `developers.zalo.me` pages returned no readable content to the fetch tool, so ask the user to check them if needed.

## Identifiers and secrets

| Name | What | Where | Secret? |
|---|---|---|---|
| Mini App ID | `APP_ID` in `.env` files | Root `.env`, `mini-app-reoka/.env` | No |
| `ZMP_TOKEN` | CLI token for the Mini App tooling | Same files | Yes |
| Zalo App secret key | Used for proof and phone exchange | `backend-reoka/.env` as `ZALO_APP_SECRET` | Yes |

A Zalo App can hold several Mini Apps (Official). Do not confuse the three above.

## User identity

| Fact | Confidence |
|---|---|
| `getAccessToken()` from `zmp-sdk` returns a token as a string | Official |
| Since SDK 2.35.0, the token is available without user confirmation but only yields the user ID | Official |
| Name and avatar require `authorize` with `scope.userInfo`. So `users.name` is nullable. | Official |
| Client `getUserInfo` user `id` is scoped per Zalo App | Official |
| Refusing the permission gives client error `-1401` | Official |
| `GET https://graph.zalo.me/v2.0/me?fields=id,name` with an `access_token` header | Secondary |
| `appsecret_proof` header = hex HMAC-SHA256 of the token keyed with the app secret | Secondary |
| Proof checking is a per-app setting; calls without proof fail with `-242` when it is on | Secondary |
| A bogus token returns a success HTTP status with `error: 452` "Session key invalid" in the body | Observed |
| The Zalo App must be activated on developers.zalo.me (which needs an app icon uploaded first), or `getAccessToken()` fails with -1401 | Observed 2026-11-17 |
| `getAccessToken()` fails with `{"code":-1401,"message":"Login failed: Zalo app has not been activated"}` while the Zalo App is not activated. `authorize(scope.userInfo)` still shows its consent sheet, but the token call fails again afterwards. | Observed 2026-11-17 on a Development deploy (iOS) |
| Fix for -1401: developers.zalo.me → the Zalo App → Settings → turn on Activate | Zalo staff answers on the community forum, not official docs |
| Development versions open only for developers or admins of the Zalo App; testers can open Testing versions | Community forum, unverified |
| A valid token from a Development deploy passes `/v2.0/me` with `appsecret_proof`, and login completes | Observed 2026-11-17 |
| With the setting on, tokens from other apps are refused | **Unverified** |

**Security note:** without the proof setting on, a token issued to another Zalo App might log in here. Test this with real tokens.

Current handling in `HttpZaloClient::get_profile`: a non-zero `error` becomes `InvalidToken` and is logged. So a misconfiguration such as a wrong secret also looks like 401 to the client. Check the `Zalo rejected a token` warning in the logs when debugging.

## Phone number (not built)

Official:

```
GET https://graph.zalo.me/v2.0/me/info
Headers: access_token, code (token from getPhoneNumber), secret_key
Response: { "data": { "number": "849123456789" }, "error": 0, "message": "Success" }
```

- The `code` token is single-use and expires after 2 minutes.
- Call from the server, never the Mini App.
- Errors: 114 and 115 code empty or invalid, 116 and 117 secret empty or invalid, 118 code from a different app, 119 code already used.
- Numbers come as `84...`.

## ZNS and OA (not built)

| Fact | Confidence |
|---|---|
| ZNS is charged per message and needs an OA and approved templates | Unverified details: check current docs and pricing |
| OA refresh tokens are single-use and rotate, so concurrent refreshes can invalidate each other | Unverified: from memory. Store tokens in the database and lock the row while refreshing. |

Read current ZNS and OA docs before building. None have been reviewed yet.

## Mini App networking

Whether the API domain must be whitelisted in Mini App settings is **unverified**. Check when connecting. CORS on the backend comes from `CORS_ALLOWED_ORIGINS`; `*` allows any origin (D23). The Mini App inside Zalo calls the API from origin `https://h5.zdn.vn` (Observed 2026-11-17, Development deploy on iOS, real login). Whether Testing and released versions use the same origin is unverified. Before going live, set `CORS_ALLOWED_ORIGINS` to the observed origins instead of `*`.

A phone running the Mini App cannot reach `localhost`. Quick tunnels (`cloudflared tunnel --url`) die when the laptop sleeps or the network drops ("Tunnel not found" in its log), and the next one has a new URL, so the Mini App must be rebuilt and redeployed. Testing on a device needs the backend behind an HTTPS tunnel, with that URL in `VITE_API_BASE_URL` (`mini-app-reoka/.env`). Whether Zalo accepts a plain-HTTP API URL is unverified, so assume HTTPS.

One community report says `/v2.0/me` returned `-501` when called from Cloudflare Workers. Keep in mind when choosing hosting (Secondary, unconfirmed).

## Running on a phone and releasing

| Fact | Confidence |
|---|---|
| `zmp deploy` uploads a build to Zalo, then gives a QR code to open it in the Zalo app | Official, plus Zalo's own tutorials |
| A **Development** deploy is overwritten by each new one and is not listed under version management. It is for quick checks. | Official |
| A **Testing** deploy is numbered and kept under version management. Only Testing versions can be submitted for review. | Official, plus a Zalo forum answer |
| After review passes, the owner releases the version, and only then can all Zalo users open it | Official (no detailed steps found) |
| Development and Testing versions open only for the Mini App's admins and members added in the developer console, not for other users | **Unverified**: from memory. Check in the console. |
| The backend must be reachable from the internet (hosted or tunnelled) for a deployed build to call it | Zalo coffee-shop tutorial |

Sources: https://docs.zaloplatforms.com/docs/MA/devtools/cli/deploy, https://miniapp.zaloplatforms.com/community/4858332794848363200/cach-gui-xet-duyet-phien-ban-development, https://github.com/Zalo-MiniApp/coffee-shop-tutorial

## Sources

- https://docs.zaloplatforms.com/docs/MA/api/user/user-information/getAccessToken
- https://docs.zaloplatforms.com/docs/MA/api/user/user-information/getUserInfo
- https://docs.zaloplatforms.com/docs/MA/api/user/user-information/getPhoneNumber
- https://docs.zaloplatforms.com/docs/MA/api/errorCode
- https://github.com/zaloplatform/zalo-php-sdk
