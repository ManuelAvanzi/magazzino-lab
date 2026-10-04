# Rendering della homepage — 29 settembre 2026

La homepage usa lab-stoccaggio.jpg, lab-ricevimento.jpg e lab-imballaggio.jpg, versioni JPEG a qualità 90 (circa 1 MB complessivo). I PNG originali sono conservati nella stessa cartella. Sono catture dirette del canvas WebGL del laboratorio, senza ritocchi generativi.

Scena: warehouseDemo() in model.js, renderizzata da WarehouseScene in warehouse-scene.js con gli stessi modelli, texture, postproduzione e luci dell'editor. Modalità interna, preset Tardo pomeriggio, animazione disattivata. Nessun dato del progetto personale è stato utilizzato o modificato.

Le tre camere sono riproducibili in /render-home.html. Selezionare una vista, attendere il caricamento dei materiali e premere Cattura rendering. L'immagine visualizzata sotto il canvas è il PNG originale esportabile. Dimensione CSS 1600×900; le immagini acquisite sono 2000×1125 con rapporto pixel 1.25.

Le precedenti immagini generate con AI e la loro documentazione rimangono in archivio nella stessa cartella, ma non sono più collegate dalla homepage.

## Movimento della homepage
Tre video lab-*.webm, catturati con MediaRecorder dal medesimo renderer, mostrano una camera che avanza dolcemente per 9 secondi. Registrazione riproducibile con il pulsante Registra movimento in render-home.html. Le coordinate sono interpolate senza modificare il layout. Video muti VP9, 1600×900, fino a 24 fps.
La home alterna i filmati con dissolvenze. Su mobile usa uno zoom lento delle immagini. Il pulsante pausa ferma il movimento e la rotazione; la preferenza di sistema per movimento ridotto disattiva le animazioni. La riproduzione si sospende fuori vista o con la scheda nascosta.
