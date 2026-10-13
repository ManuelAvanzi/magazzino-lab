> Il backend esterno è stato rimosso: vedere [Persistenza](docs/PERSISTENZA.md). Non configurare servizi o chiavi per gli account. Le migrazioni e i test SQL rimangono come storico, non come requisito del frontend.

# Collaborare a Warehouse Lab

Repository: https://github.com/ManuelAvanzi/magazzino-lab

## Accesso al codice

Ogni collaboratore usa il proprio account GitHub. Il proprietario invita gli username da **Settings → Collaborators → Add people** con permesso di scrittura; l’invito deve essere accettato. Una repository pubblica consente lettura e clone, ma non concede automaticamente il diritto di scrivere. Non condividere password, token o l’account del proprietario.

L’accesso alla repository non concede accesso amministrativo a Vercel o ai progetti personali salvati dagli utenti. Eventuali permessi sui servizi vanno assegnati separatamente dal proprietario, solo quando necessari.

## Flusso di lavoro

1. Aggiornare `main` con `git switch main` e `git pull --ff-only`.
2. Creare un ramo dedicato, ad esempio `git switch -c feature/nome-intervento`.
3. Implementare e verificare la modifica con i comandi sotto.
4. Committare solo i file pertinenti, pubblicare il ramo e aprire una pull request verso `main`.
5. Far rivedere la modifica prima dell’unione. Evitare push forzati e modifiche dirette al database condiviso.

## Credenziali, dati e risorse

I file `.env.local`, le credenziali personali, `node_modules` e i risultati temporanei non devono essere caricati. Non occorre configurare un backend esterno. Conservare le copie esportate dei progetti.

I progetti creati dagli utenti sono dati applicativi, salvati nel browser o nel backend: non fanno parte della cronologia Git. Conservare attribuzioni e licenze dei modelli, materiali e font inclusi. Gli asset originali usati per preparare i modelli possono essere esclusi dalla repository; gli asset ottimizzati necessari all’app devono essere presenti.

## Preparazione dell’ambiente

Usare Node.js 22 o successivo e npm. Accettare l’invito GitHub prima di clonare una repository privata.

```sh
git clone https://github.com/ManuelAvanzi/magazzino-lab.git
cd magazzino-lab
npm ci
npm run dev
```

Aprire http://localhost:5184. L’editor è `studio.html`, la simulazione `simulator.html`, l’archivio `account.html`. La configurazione pubblica del backend è in `cloud-config.js`; non contiene password. Consultare la sezione account nel README prima di usare il backend condiviso.

Verifiche: `npm test` e `npm run build`. I test includono isolamento utenti e revisioni del salvataggio con PostgreSQL incorporato. `build.mjs` copia una lista esplicita di file in `dist/`: aggiungere alla lista ogni nuovo modulo necessario al sito. Three.js è incluso in `vendor/`.

Le ultime modifiche comprendono **01 Pianta 2D → 02 Allestimento 3D → 03 Flussi**. I flussi personali con postazioni, spiegazioni, verifiche e immagini fanno parte del documento salvato/esportato. La simulazione rappresenta un collo simbolico; non calcola le manovre fisiche dei mezzi.

Il progetto Vercel `magazzino-lab` è collegato a GitHub: l’aggiornamento di `main` avvia la pubblicazione. Usare un ramo e una pull request per il lavoro da rivedere.

