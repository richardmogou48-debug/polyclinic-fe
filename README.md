# Polyclinique Fultang — Frontend

Interface Next.js de la plateforme Polyclinique Fultang. Le backend (microservices Spring Boot)
vit dans un depot separe et est joint via la Gateway.

## Demarrage

```bash
cp .env.example .env.local
npm install
npm run dev
```

Ouvrir http://localhost:3000.

La Gateway doit tourner en parallele sur le port 9000 (`docker-compose up` cote backend), sinon
la connexion echouera avec « Impossible de contacter le serveur ».

## Configuration

| Variable | Role |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL publique de la Gateway. Defaut : `http://localhost:9000`. |

La valeur est injectee dans le bundle **au moment du build** : la modifier sur Vercel impose un
redeploiement, un simple redemarrage ne suffit pas.

## Authentification

`POST /user/login` sur la Gateway (route publique, exemptee du `TokenFilter`).

- Requete : `{ "email": ..., "password": ... }`
- Reponse 200 : le JWT **brut**, en `text/plain` — ce n'est pas du JSON.
- Echec : HTTP **500** (et non 401) avec un corps `ErrorInfo` ; le backend mappe toutes les
  `HmsException` sur `INTERNAL_SERVER_ERROR`. Le message doit donc etre lu dans le corps.

Le JWT porte les claims `id`, `email`, `role`, `name`, `profileId` et expire au bout de 5 h. La
session est conservee dans le `localStorage` (cle `polyclinic.session`) et purgee a l'expiration.

### Roles

L'enum backend (`UserMS/dto/Roles.java`) ne definit que `PATIENT`, `ADMIN`, `DOCTOR` et
`SECRETARY`. Les dashboards `nurse`, `pharmacist`, `hr`, `finance` et `quality` existent dans
l'interface mais **aucun compte ne peut s'y connecter** tant que l'enum n'est pas etendue.

Attention en l'etendant : `User.role` n'a pas `@Enumerated(STRING)` et se persiste par position
ordinale — les nouvelles valeurs doivent etre ajoutees **en fin de liste**.

## Deploiement

Deploye sur Vercel depuis la branche `main`. Pour que le frontend en HTTPS puisse appeler la
Gateway, celle-ci doit etre exposee :

1. en HTTPS (une API en `http://` est bloquee par le navigateur depuis une page HTTPS) ;
2. avec l'origine du frontend autorisee dans la config CORS de la Gateway
   (`spring.cloud.gateway.server.webflux.globalcors...allowedOrigins`, qui n'accepte
   aujourd'hui que `http://localhost:3000`).
