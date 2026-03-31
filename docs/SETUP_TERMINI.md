# Guida alla personalizzazione di Privacy Policy e Termini del Servizio

Questo documento spiega **dove e come** modificare i testi della modale "Privacy e Termini del Servizio"
nel progetto AuraBook.
I testi sono già strutturati in forma legale; devi solo compilare i campi segnaposto indicati di seguito.

---

## File da modificare

**Unico file da editare:**
```
src/components/PrivacyModal.jsx
```

Non è necessario toccare altri file.

---

## Placeholder da compilare

Cerca nel file `PrivacyModal.jsx` i commenti `{/* 📝 COMPILA: ... */}` oppure le stringhe
tra parentesi quadre `[MAIUSCOLO]`. Di seguito la lista completa con la spiegazione di ciascuno.

---

### Dati del professionista (compaiono in ENTRAMBE le tab)

| Placeholder | Dove compare | Cosa inserire |
|---|---|---|
| `[NOME_COGNOME]` | Art. 1, Art. 1 (Termini), Art. 5 (Termini) | Nome e cognome per esteso del massoterapista — es. `Francesco Rossi` |
| `[INDIRIZZO_STUDIO]` | Art. 1 (Privacy), Termini §1 | Indirizzo completo dello studio — es. `Via fratelli Bronzetti, 9 – 20129 Milano (MI)` |
| `[PARTITA_IVA_O_CF]` | Art. 1 (Privacy) | Partita IVA oppure Codice Fiscale — es. `IT01234567890` |
| `[EMAIL_PRIVACY]` | Art. 1 e Art. 6 (Privacy) | Indirizzo e-mail a cui i clienti possono inviare richieste riguardanti i loro dati — può coincidere con la mail professionale |

---

### Dati relativi al trattamento dei dati

| Placeholder | Dove compare | Cosa inserire |
|---|---|---|
| `[PERIODO_CONSERVAZIONE]` | Art. 5 (Privacy) | Per quanto tempo vengono conservati i dati dei clienti dopo l'appuntamento — es. `12 mesi`, `24 mesi`. Nota: per soggetti sanitari è spesso richiista la conservazione per 10 anni. |

---

### Dati relativi alle prenotazioni (Termini del Servizio)

| Placeholder | Dove compare | Cosa inserire |
|---|---|---|
| `[TEMPO_RISPOSTA]` | Termini §2 | Entro quanto tempo il professionista risponde alla richiesta — es. `24 ore lavorative`, `48 ore` |
| `[ORE_PREAVVISO_DISDETTA]` | Termini §3 | Preavviso minimo richiesto per cancellare o spostare un appuntamento — es. `24`, `48` |
| `[CONTATTO_DISDETTE]` | Termini §3 | Come contattare il professionista per le disdette — es. l'indirizzo email professionale o un numero di telefono |

---

## Come modificare il file

1. Apri `src/components/PrivacyModal.jsx` nell'editor.
2. Cerca ogni stringa `[PLACEHOLDER]` con la funzione "Find" (`Ctrl+F` / `Cmd+F`).
3. Sostituisci il testo tra le parentesi quadre con il valore corretto, **lasciando i tag `<strong>` attorno**:

   **Prima:**
   ```jsx
   Il Titolare del trattamento è <strong>[NOME_COGNOME]</strong>
   ```
   **Dopo:**
   ```jsx
   Il Titolare del trattamento è <strong>Francesco Rossi</strong>
   ```

---

## Come aggiungere o rimuovere sezioni

Ogni sezione del testo è racchiusa in un blocco `<section className={styles.section}>`:

```jsx
<section className={styles.section}>
    <h3 className={styles.sectionTitle}>Art. X – Titolo della sezione</h3>
    <p>Testo della sezione...</p>
    {/* Aggiungi paragrafi con altri <p> o liste <ul> */}
</section>
```

- Per **aggiungere una sezione** copia un blocco esistente e incollalo dopo l'ultimo, cambiando numero e contenuto.
- Per **rimuovere una sezione** cancella l'intero blocco `<section>...</section>`.
- I punti elenco vanno dentro `<ul className={styles.list}><li>...</li></ul>`.

---

## Aggiunta di clausole opzionali (già segnalate nel codice)

Nel file trovi dei commenti `{/* 📝 COMPILA (opzionale): ... */}` che indicano dove puoi
inserire contenuto facoltativo:

- **Art. 4 Privacy** — eventuali altri fornitori di servizi oltre a Google Calendar, SendGrid ed EmailJS
  (es. hosting Vercel, piattaforma di pagamento online, ecc.)
- **Termini §3** — eventuale penale economica per no-show o cancellazione tardiva
- **Termini §4** — controindicazioni specifiche al trattamento che il cliente deve dichiarare
  (es. gravidanza, patologie particolari, allergie agli oli)

---

## Cookie Policy (nota)

Attualmente l'app non usa cookie di profilazione propri.
Firebase Auth utilizza storage locale (`localStorage`/`sessionStorage`), non cookie di terze parti.
Se in futuro aggiungi Google Analytics o strumenti di tracking, sarà necessario aggiungere
una sezione Cookie Policy alla modale oppure un banner separato.

---

## Note legali generali

- Questo testo è una **bozza di partenza**: non costituisce consulenza legale.
- Si consiglia di farlo visionare da un **consulente legale o privacy officer** prima della pubblicazione, soprattutto per la parte relativa ai dati sulla salute (art. 9 GDPR), che richiede misure di sicurezza rafforzate.
- Essendo un trattamento di dati sanitari, potrebbe essere necessario il **Registro delle Attività di Trattamento** (art. 30 GDPR) e, in alcuni casi, una **Valutazione d'Impatto (DPIA)**.
- Per info: [www.garanteprivacy.it](https://www.garanteprivacy.it)

---

*File generato automaticamente — aggiornare dopo ogni modifica ai Termini.*
