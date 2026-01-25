# 🗄️ Database & Storage Architecture - Chatbot

## ✅ Configuration actuelle (Confirmée)

### Database: **Turso** (LibSQL/SQLite)
- **Client**: `@libsql/client`
- **ORM**: Drizzle ORM avec `drizzle-orm/libsql`
- **Schema**: `lib/db/schema.ts` (SQLite)
- **Migrations**: `lib/db/migrations/`
- **Connection**: `lib/db/client.ts`

**Variables d'environnement**:
```bash
TURSO_DATABASE_URL=libsql://...turso.io
TURSO_AUTH_TOKEN=eyJ...
```

**Tables**:
- `User` - Comptes utilisateurs (guests + registered)
- `Chat` - Sessions de conversation
- `Message` - Messages avec parts (text/tool calls)
- `Vote` - Feedback sur les messages
- `Document` - Artifacts générés

### Storage: **Vercel Blob**
- **Package**: `@vercel/blob`
- **Usage**: Upload d'images (JPEG/PNG, max 5MB)
- **API**: `app/(chat)/api/files/upload/route.ts`
- **Method**: `put(filename, file, options)`

**Variables d'environnement**:
```bash
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
```

## 🧹 Nettoyage effectué

### Supprimé ✅
- ❌ `lib/db/schema.postgres.ts` (erreur de build)
- ❌ `lib/db/schema.postgres.backup` (ancien fichier)
- ❌ Package `postgres@3.4.4` (inutilisé)

### Conservé (commenté)
- ✅ `lib/db/helpers/01-core-to-parts.ts` - Helper de migration AI v4 → v5 (tout commenté, aucun import actif)

## 📊 Architecture de données

### Message Parts Pattern
Les messages utilisent un pattern de "parts" typés :

```typescript
{
  role: 'user' | 'assistant',
  parts: [
    { type: 'text', text: '...' },
    { type: 'tool-call', toolName: '...', args: {...} },
    { type: 'tool-result', toolName: '...', result: {...} }
  ]
}
```

### Schema Turso (SQLite)

**User**:
- id (UUID)
- email (TEXT)
- password (TEXT, nullable for guests)

**Chat**:
- id (UUID)
- createdAt (TIMESTAMP)
- userId (FK → User)
- title (TEXT)
- visibility (TEXT: 'public' | 'private')
- lastContext (JSON: usage/cost data)

**Message**:
- id (UUID)
- chatId (FK → Chat)
- role (TEXT)
- parts (JSON array)
- createdAt (TIMESTAMP)

**Vote**:
- chatId + messageId (composite PK)
- isUpvoted (BOOLEAN)

**Document**:
- id (UUID)
- createdAt (TIMESTAMP)
- title (TEXT)
- kind (TEXT: artifact type)
- userId (FK → User)
- parts (JSON array)

## 🔧 Drizzle Configuration

**drizzle.config.ts**:
```typescript
{
  schema: "./lib/db/schema.ts",
  out: "./lib/db/migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL || "file:./local.db"
  }
}
```

**Migrations**:
```bash
pnpm drizzle-kit generate  # Générer migration
pnpm drizzle-kit migrate   # Appliquer migration
tsx lib/db/migrate         # Run migrations (auto avant build)
```

## 📦 Dépendances storage/db

```json
{
  "@libsql/client": "^0.15.0",
  "@vercel/blob": "^0.27.0",
  "drizzle-orm": "^0.40.0",
  "drizzle-kit": "^0.30.0"
}
```

## ⚠️ Tigris Status

**Non configuré** - La variable `BLOB_READ_WRITE_TOKEN` dans `.env` est vide mais le système utilise Vercel Blob via leur SDK.

Si migration vers Tigris souhaitée :
1. Créer bucket Tigris
2. Installer `@tigrisdata/s3` 
3. Remplacer `@vercel/blob` imports par Tigris S3 client
4. Update `BLOB_READ_WRITE_TOKEN` → `TIGRIS_*` vars

## 🔍 Vérifications

### Aucune référence Postgres ✅
```bash
# Chercher postgres
grep -r "postgres" --include="*.ts" lib/ app/
# Résultat: Aucun (sauf commentaires migration helper)

# Package.json
cat package.json | grep postgres
# Résultat: Aucun

# Fichiers db/
ls lib/db/*.postgres.*
# Résultat: Aucun
```

### Turso actif ✅
```bash
# Client utilisé
grep "from.*libsql" lib/db/client.ts
# ✅ import { drizzle } from "drizzle-orm/libsql"

# Schema
head -15 lib/db/schema.ts
# ✅ sqliteTable from "drizzle-orm/sqlite-core"
```

## 📝 Utilisation

### Queries (lib/db/queries.ts)
- `getChatsByUserId()` - Liste des chats
- `getChatById()` - Détails d'un chat
- `saveChat()` - Créer/update chat
- `saveMessages()` - Sauvegarder messages
- `voteMessage()` - Vote up/down
- `getDocumentById()` - Récupérer artifact
- `saveDocument()` - Sauvegarder artifact

### Upload files
```typescript
// POST /api/files/upload
const formData = new FormData();
formData.append('file', file);
const response = await fetch('/api/files/upload', {
  method: 'POST',
  body: formData
});
const { url } = await response.json();
```

## 🚀 Résumé

✅ **100% SQLite (Turso)** - Aucune dépendance Postgres  
✅ **Vercel Blob** pour storage  
✅ **Drizzle ORM** type-safe  
✅ **Build propre** - Aucune erreur liée à Postgres  

**Tigris** mentionné mais non implémenté (BLOB_READ_WRITE_TOKEN vide).
