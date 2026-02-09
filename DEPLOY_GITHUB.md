# Deployer l'application sur GitHub Pages (pas a pas)

Ce guide publie l'app statique sur GitHub Pages, puis explique comment l'ajouter a l'ecran d'accueil iPhone.

## 1) Verifier les prerequis

- Avoir un compte GitHub.
- Avoir `git` installe localement.
- Etre dans le dossier du projet:

```bash
cd /Users/vincentfaure/Documents/dev/tables-de-multiplications
```

## 2) Creer un depot GitHub

1. Va sur [https://github.com/new](https://github.com/new)
2. Nom du depot: `tables-de-multiplications` (ou autre nom)
3. Laisse le depot en `Public` (plus simple pour GitHub Pages)
4. Clique `Create repository`

## 3) Pousser le code vers GitHub

Si ton depot local n'est pas encore connecte a GitHub:

```bash
git remote add origin https://github.com/<TON_USER>/<TON_DEPOT>.git
```

Puis pousse la branche principale:

```bash
git add .
git commit -m "Prepare PWA for GitHub Pages" # saute si rien a commit
git push -u origin main
```

## 4) Activer GitHub Pages

1. Ouvre le depot sur GitHub
2. Va dans `Settings` -> `Pages`
3. Dans `Build and deployment`:
- `Source`: `Deploy from a branch`
- `Branch`: `main`
- `Folder`: `/ (root)`
4. Clique `Save`

Apres 1 a 3 minutes, l'URL publique apparaitra, du type:

`https://<TON_USER>.github.io/<TON_DEPOT>/`

## 5) Verifier que la PWA est bien servie

Ouvre ces URLs dans ton navigateur desktop:

- `https://<TON_USER>.github.io/<TON_DEPOT>/`
- `https://<TON_USER>.github.io/<TON_DEPOT>/manifest.webmanifest`
- `https://<TON_USER>.github.io/<TON_DEPOT>/sw.js`

Les 3 doivent repondre sans erreur 404.

## 6) Installer sur iPhone (ecran d'accueil)

1. Ouvre l'URL de l'app dans **Safari** (pas Chrome)
2. Touche `Partager`
3. Choisis `Sur l'ecran d'accueil`
4. Renomme si besoin
5. Touche `Ajouter`

L'app se lancera ensuite depuis l'icone, en mode standalone.

## 7) Publier les mises a jour

A chaque changement:

```bash
git add .
git commit -m "Update app"
git push
```

GitHub Pages republie automatiquement.

## Depannage rapide

- Si l'ancienne version reste affichee: ferme/reouvre l'app iPhone, ou supprime puis re-ajoute l'icone.
- Si rien ne s'installe: verifier que l'URL est bien en `https://` et ouverte dans Safari.
- Si erreur 404 sur `manifest.webmanifest` ou `sw.js`: verifier que les fichiers sont bien a la racine du depot et que Pages pointe sur `main` + `/ (root)`.
