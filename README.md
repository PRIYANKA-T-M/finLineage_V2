# FinLineage — Milestone 1: Digital Studbook & Pedigree Data Foundation

FinLineage is an enterprise full-stack conservation breeding management platform designed to digitally manage endangered marine-species populations, maintain multi-generational pedigree information, and support pedigree-based conservation breeding decisions.

> **Core Architectural Principle**: PostgreSQL is the transactional source of truth; Neo4j is the pedigree graph projection.

---

## 1. Architecture Overview

```
                         React UI
                            │
                       REST / JSON
                            │
                            ▼
                   ┌─────────────────┐
                   │   Spring Boot   │
                   │   Application   │
                   └────────┬────────┘
                            │
             ┌──────────────┴──────────────┐
             │                             │
             ▼                             ▼
       PostgreSQL                      Neo4j
     SOURCE OF TRUTH              GRAPH PROJECTION
             │                             │
      Business data                  Relationships
      Specimens                      Parentage
      Institutions                   Ancestry
      Species                        Descendants
      Breeding Events                Traversal
      Graph Sync Status                    │
             │                             │
             └──────────────┬──────────────┘
                            ▼
                     Pedigree Service
                            │
                            ▼
                       React Flow
```

---

## 2. Technical Stack

- **Backend**: Java 21, Spring Boot 3.2.5, Spring Data JPA, Spring Data Neo4j, Spring Security + JWT, Flyway Migration, `springdoc-openapi` (Swagger UI).
- **Databases**: PostgreSQL 16 (Relational Source of Truth), Neo4j 5 (Pedigree Graph Projection).
- **Frontend**: React.js, Vite, React Flow 11, Axios, React Router, Vanilla CSS3 with Antigravity Design System.
- **Infrastructure**: Docker Compose (`docker-compose.yml`), Postman Collection (`FinLineage_Milestone1.postman_collection.json`).
- **Security & Config**: Environment variables (`POSTGRES_USER`, `POSTGRES_PASSWORD`, `NEO4J_AUTH`, `JWT_SECRET`) loaded from `.env`. Passwords hashed using BCrypt.

---

## 3. Database ER Diagram & Data Model

### PostgreSQL Relational Source of Truth
- **`institutions`**: `institution_id` (UUID PK), `name` (Unique), `country`, `facility_type` (`AQUARIUM`, `CONSERVATION_HATCHERY`, `SANCTUARY`, `RESEARCH_CENTER`), `email`, `phone`.
- **`species`**: `species_id` (UUID PK), `scientific_name` (Unique), `common_name`, `iucn_status` (`CRITICAL`, `ENDANGERED`, `VULNERABLE`, `NEAR_THREATENED`, `LEAST_CONCERN`), `description`.
- **`specimens`**: `specimen_id` (String PK), `institution_id` (FK), `species_id` (FK), `local_identifier`, `sex` (`M`, `F`, `U`), `birth_date`, `origin_type` (`WILD`, `CAPTIVE_BORN`, `RESCUED`, `TRANSFERRED`, `UNKNOWN`), `wild_founder` (boolean), `active_breeder` (boolean), `status` (`ACTIVE`, `DECEASED`, `TRANSFERRED`, `RELEASED`, `RETIRED`), `graph_sync_status` (`PENDING`, `SYNCED`, `FAILED`), `graph_sync_error`, `graph_synced_at`.
- **`specimen_parents`**: `id` (UUID PK), `specimen_id` (FK), `parent_id` (FK), `parent_role` (`SIRE`, `DAM`, `UNKNOWN`), `confidence`, `source`. (Max parents rule: 1 SIRE + 1 DAM per specimen).
- **`breeding_events`**: `breeding_event_id` (UUID PK), `institution_id` (FK), `sire_id` (FK), `dam_id` (FK), `event_date`, `status`, `notes`.
- **`audit_logs`**: `audit_id` (UUID PK), `user_id`, `entity_type`, `entity_id`, `action`, `timestamp`, `old_value`, `new_value`.
- **`app_users`**: `user_id` (UUID PK), `username` (Unique), `password_hash` (BCrypt), `role` (`ADMIN`, `BIOLOGIST`).

### Database Indexes
- `idx_specimens_institution_id`, `idx_specimens_species_id`, `idx_specimens_sex`, `idx_specimens_status`, `idx_specimens_active_breeder`, `idx_specimens_graph_sync_status`.
- Unique Index `uk_specimen_parent_role` on `(specimen_id, parent_role)` for non-UNKNOWN roles.

### Neo4j Graph Projection Model
- Node Label: `(:Specimen)` with properties `{id, sex, species, founder, institution}`.
- Relationship: `(parent:Specimen)-[:PARENT_OF {role: "SIRE" | "DAM"}]->(child:Specimen)`
- Uniqueness Constraint:
  ```cypher
  CREATE CONSTRAINT specimen_id_unique IF NOT EXISTS
  FOR (s:Specimen) REQUIRE s.id IS UNIQUE;
  ```

---

## 4. Synthetic Seed Dataset (Exactly 30 Specimens)

Seeded via Flyway `V8__seed_demo_data.sql` and synchronized to Neo4j on application startup:
- **2 Institutions**: *Aquarium Pacifica* & *Coral Reef Sanctuary*.
- **2 Marine Species**:
  1. *Hippocampus abdominalis* (Pot-bellied Seahorse) — **15 Specimens across 4 Generations**
     - Gen 0: `SH_M01`, `SH_F01`, `SH_M02`, `SH_F02` (4 Wild Founders)
     - Gen 1: `SH_F101`, `SH_M102` (Full siblings), `SH_F103`, `SH_M104` (Half sibling) [4]
     - Gen 2: `SH_M201` (Inbred line), `SH_F202` (Cousin), `SH_M203` (Transferred, Unknown Sire), `SH_F204` (Deceased) [4]
     - Gen 3: `SH_M301`, `SH_F302`, `SH_U303` (Sex Unknown) [3]
  2. *Chelonia mydas* (Green Sea Turtle) — **15 Specimens across 4 Generations**
     - Gen 0: `TR_M01`, `TR_F01` (2 Wild Founders)
     - Gen 1: `TR_M101`, `TR_F102` (Offspring), `TR_M103`, `TR_F104` (Wild Founders introduced) [4]
     - Gen 2: `TR_M201`, `TR_F202`, `TR_M203`, `TR_F204` (Retired) [4]
     - Gen 3: `TR_M301`, `TR_F302`, `TR_M303`, `TR_F304`, `TR_U305` [5]

**Total Population = Exactly 30 Specimens.**

---

## 5. REST API Documentation & Swagger UI

Interactive Swagger UI documentation is available at:
`http://localhost:8080/swagger-ui.html` or `http://localhost:8080/swagger-ui/index.html`

### Key Endpoints:
- **Authentication**: `POST /api/auth/login` (Returns JWT token)
- **Dashboard**: `GET /api/dashboard/summary` (Live summary metrics & system component health status)
- **Institutions**: `POST`, `GET`, `PUT`, `DELETE` `/api/institutions`
- **Species**: `POST`, `GET`, `PUT`, `DELETE` `/api/species`
- **Specimens**:
  - `POST /api/specimens` (Create specimen & assign parentage)
  - `GET /api/specimens` (Filter by search, species, institution, sex, status)
  - `GET /api/specimens/{id}` (Get details)
  - `PUT /api/specimens/{id}` (Update details)
  - `DELETE /api/specimens/{id}` (Archival soft deletion / status RETIRED)
  - `POST /api/specimens/{id}/parents` (Assign parentage with validation)
  - `GET /api/specimens/{id}/parents` (Get direct parents)
  - `POST /api/specimens/sync-failed` (Retry failed graph syncs)
- **Pedigree**:
  - `GET /api/specimens/{id}/pedigree?generations=4` (Multi-generation traversal, $1 \le depth \le 10$)
  - `GET /api/specimens/{id}/ancestors` (Get all ancestors)
  - `GET /api/specimens/{id}/descendants` (Get all descendants)

---

## 6. Setup & Running Instructions

### Step 1: Start Databases via Docker Compose
```bash
cp .env.example .env
docker compose up -d
```
Verifies PostgreSQL running on port 5432 and Neo4j running on ports 7474 (HTTP) and 7687 (Bolt).

### Step 2: Build & Launch Spring Boot Backend
```bash
cd backend
./mvnw clean spring-boot:run
```
Flyway automatically creates the database schema and seeds the 30-specimen dataset. On startup, `Neo4jGraphSyncSeeder` idempotently projects the 30 specimens and `PARENT_OF` relationships into Neo4j and marks `graph_sync_status = SYNCED`.

### Step 3: Launch React Frontend
```bash
cd frontend
npm install
npm run dev
```
Access the application UI in your browser at `http://localhost:3000`.

---

## 7. 7-Category Testing Matrix Summary

All 7 test categories are implemented and verifiable:
1. **Functional (F01–F10)**: Institution, Species, Specimen CRUD, Parent assignment, Pedigree traversal.
2. **Validation (V01–V09)**: Duplicate ID rejection (`409`), missing references (`404`), self-parent rejection (`400`), duplicate SIRE/DAM role rejection (`409`), cross-species parentage rejection (`400`), pedigree cycle detection (`400`), max generation depth cap ($>10 \to 400$).
3. **PostgreSQL (D01–D04)**: Foreign key constraints, unique indexes, required field checks.
4. **Neo4j (G01–G08)**: Node creation, `PARENT_OF` edges, uniqueness constraint, Cypher ancestor/descendant traversal, cycle protection.
5. **Synchronization (S01–S04)**: PostgreSQL $\to$ Neo4j sync, failed status tracking (`PENDING`, `SYNCED`, `FAILED`), idempotent retry endpoint.
6. **Security (SEC01–SEC05)**: BCrypt password authentication, JWT token issuance, protected write endpoint rejection.
7. **Frontend (UI01–UI10)**: Dashboard KPI cards, system health widget, specimen search & multi-filter table, parent assignment validation modal, interactive React Flow pedigree graph with generation layout.

---

## 8. Milestone 1 $\rightarrow$ Milestone 2 Handoff Contract

```
MILESTONE 1 (OUTPUT FOUNDATION)
┌────────────────────────────────────────────────────────┐
│ - Transactional Specimen & Parentage Data              │
│ - Unambiguous Neo4j Graph (Parent)-[:PARENT_OF]->(Child)│
│ - Multi-Generation Ancestor Path Traversal             │
│ - Idempotent Graph Synchronization Engine              │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
MILESTONE 2 (INPUT CONSUMPTION)
┌────────────────────────────────────────────────────────┐
│ - Common Ancestor Detection via Neo4j Graph            │
│ - Path Distance Calculation (n1, n2) from Ancestors    │
│ - Wright's Inbreeding Coefficient (F) Evaluation       │
│ - Pairwise Kinship Matrix Construction                 │
│ - Mean Kinship & Conservation Breeding Recommendations │
└────────────────────────────────────────────────────────┘
```
#   f i n L i n e a g e  
 