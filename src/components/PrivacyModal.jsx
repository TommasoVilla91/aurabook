/**
 * PrivacyModal.jsx
 *
 * Modale con due tab: "Privacy Policy" e "Termini del Servizio".
 * Renderizzato tramite ReactDOM.createPortal su document.body per evitare
 * problemi di z-index e overflow dai container genitori.
 *
 * Props:
 *   show       {boolean}  - Controlla la visibilità della modale
 *   onClose    {function} - Chiamata al click su "Chiudi" o sull'overlay
 *   onAccept   {function} - Chiamata al click su "Ho letto e accetto"
 *                           (imposta termsAccepted=true in FormPage e chiude la modale)
 *
 * PLACEHOLDER: cerca nel testo i commenti {/* 📝 COMPILA: ... *\/}
 * per trovare le parti da personalizzare. Vedi anche SETUP_TERMINI.md.
 */

import { useState } from 'react';
import ReactDOM from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faShieldHalved, faFileLines } from '@fortawesome/free-solid-svg-icons';
import styles from './PrivacyModal.module.css';

/* ─────────────────────────────────────────────────────────────
   CONTENUTO TAB 1 – PRIVACY POLICY
   ───────────────────────────────────────────────────────────── */
function PrivacyContent() {
    return (
        <div className={styles.content}>

            <p className={styles.intro}>
                Informativa sul trattamento dei dati personali ai sensi del Regolamento UE 2016/679 (GDPR)
                e del D.Lgs. 196/2003 come modificato dal D.Lgs. 101/2018.
            </p>

            {/* ── Art. 1 ── */}
            <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Art. 1 – Titolare del Trattamento</h3>
                <p>
                    {/* 📝 COMPILA: nome e cognome del massoterapista */}
                    Il Titolare del trattamento dei dati personali è <strong>[NOME_COGNOME]</strong>,
                    {/* 📝 COMPILA: indirizzo dello studio (es. già presente: Via fratelli Bronzetti, 9 – Milano) */}
                    &nbsp;con studio in <strong>[INDIRIZZO_STUDIO]</strong>,
                    {/* 📝 COMPILA: Partita IVA o Codice Fiscale */}
                    &nbsp;P.IVA / C.F. <strong>[PARTITA_IVA_O_CF]</strong>.
                </p>
                <p className={styles.mt}>
                    {/* 📝 COMPILA: indirizzo email dedicato alla privacy */}
                    Contatto per la privacy: <strong>[EMAIL_PRIVACY]</strong>
                </p>
            </section>

            {/* ── Art. 2 ── */}
            <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Art. 2 – Tipologie di Dati Raccolti</h3>
                <p>Attraverso il modulo di prenotazione vengono raccolti i seguenti dati personali:</p>
                <ul className={styles.list}>
                    <li>Nome e cognome</li>
                    <li>Data di nascita</li>
                    <li>Numero di telefono</li>
                    <li>Indirizzo e-mail</li>
                    <li>
                        Descrizione del motivo della visita — potenzialmente qualificabile come{' '}
                        <em>dato relativo alla salute</em> ai sensi dell'art. 9 GDPR
                    </li>
                </ul>
            </section>

            {/* ── Art. 3 ── */}
            <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Art. 3 – Finalità e Base Giuridica del Trattamento</h3>
                <p>I dati vengono trattati esclusivamente per:</p>
                <ul className={styles.list}>
                    <li>
                        <strong>Gestione e conferma delle prenotazioni</strong> — base giuridica:
                        esecuzione di un contratto (art. 6.1.b GDPR)
                    </li>
                    <li>
                        <strong>Comunicazioni relative all'appuntamento</strong> (conferma, promemoria,
                        modifiche) — base giuridica: legittimo interesse (art. 6.1.f GDPR)
                    </li>
                </ul>
                <p className={styles.mt}>
                    I dati relativi alla salute sono trattati sulla base del <strong>consenso esplicito</strong> dell'interessato
                    (art. 9.2.a GDPR), prestato con l'accettazione della presente informativa.
                </p>
            </section>

            {/* ── Art. 4 ── */}
            <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Art. 4 – Destinatari dei Dati</h3>
                <p>I dati possono essere comunicati ai seguenti soggetti, che operano come Responsabili
                    del Trattamento ai sensi dell'art. 28 GDPR:</p>
                <ul className={styles.list}>
                    <li><strong>Google LLC</strong> — gestione del calendario degli appuntamenti (Google Calendar)</li>
                    <li><strong>Twilio SendGrid Inc.</strong> — invio di e-mail di conferma al paziente</li>
                    <li><strong>EmailJS</strong> — notifica interna al professionista</li>
                    {/* 📝 COMPILA: aggiungi eventuali altri fornitori (es. hosting, CRM, ecc.) */}
                </ul>
                <p className={styles.mt}>I dati <strong>non vengono ceduti a terzi</strong> per finalità commerciali o di marketing.</p>
            </section>

            {/* ── Art. 5 ── */}
            <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Art. 5 – Periodo di Conservazione</h3>
                <p>
                    I dati vengono conservati per{' '}
                    {/* 📝 COMPILA: periodo di conservazione (es. "12 mesi", "24 mesi") */}
                    <strong>[PERIODO_CONSERVAZIONE]</strong> dalla data dell'appuntamento,
                    salvo diversi obblighi di legge (es. fiscali, sanitari).
                </p>
            </section>

            {/* ── Art. 6 ── */}
            <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Art. 6 – Diritti dell'Interessato</h3>
                <p>L'interessato ha il diritto di:</p>
                <ul className={styles.list}>
                    <li>Accedere ai propri dati personali (art. 15 GDPR)</li>
                    <li>Richiederne la rettifica (art. 16 GDPR)</li>
                    <li>Richiederne la cancellazione (art. 17 GDPR)</li>
                    <li>Opporsi al trattamento (art. 21 GDPR)</li>
                    <li>Richiedere la portabilità dei dati (art. 20 GDPR)</li>
                    <li>Revocare il consenso in qualsiasi momento senza pregiudizio per il trattamento precedente</li>
                </ul>
                <p className={styles.mt}>
                    {/* 📝 COMPILA: indirizzo email per le richieste di esercizio dei diritti */}
                    Per esercitare tali diritti, scrivere a: <strong>[EMAIL_PRIVACY]</strong>
                </p>
            </section>

            {/* ── Art. 7 ── */}
            <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Art. 7 – Autorità di Controllo</h3>
                <p>
                    Fermo restando il diritto di proporre reclamo al{' '}
                    <strong>Garante per la Protezione dei Dati Personali</strong>{' '}
                    (www.garanteprivacy.it), l'interessato ha comunque il diritto di rivolgersi
                    direttamente al Titolare per la risoluzione di qualsiasi controversia.
                </p>
            </section>

        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   CONTENUTO TAB 2 – TERMINI DEL SERVIZIO
   ───────────────────────────────────────────────────────────── */
function TermsContent() {
    return (
        <div className={styles.content}>

            <p className={styles.intro}>
                {/* 📝 COMPILA: nome e cognome del massoterapista */}
                Termini e condizioni di utilizzo del servizio di prenotazione online di <strong>[NOME_COGNOME]</strong>.
                Leggere attentamente prima di procedere con la prenotazione.
            </p>

            {/* ── 1 ── */}
            <section className={styles.section}>
                <h3 className={styles.sectionTitle}>1. Natura del Servizio</h3>
                <p>
                    Il presente sito offre un sistema di <strong>richiesta di appuntamento online</strong> per
                    trattamenti di massoterapia presso lo studio in{' '}
                    {/* 📝 COMPILA: indirizzo */}
                    <strong>[INDIRIZZO_STUDIO]</strong>.
                    La prenotazione è da intendersi come <em>richiesta</em>: il trattamento non è garantito
                    fino alla conferma esplicita da parte del professionista.
                </p>
            </section>

            {/* ── 2 ── */}
            <section className={styles.section}>
                <h3 className={styles.sectionTitle}>2. Prenotazione e Conferma</h3>
                <p>
                    Dopo l'invio del modulo, il professionista verificherà la disponibilità e contatterà
                    il paziente — tramite e-mail o telefono — per confermare l'appuntamento.
                    La mancata risposta entro{' '}
                    {/* 📝 COMPILA: es. "48 ore lavorative" */}
                    <strong>[TEMPO_RISPOSTA]</strong> non costituisce conferma implicita.
                </p>
            </section>

            {/* ── 3 ── */}
            <section className={styles.section}>
                <h3 className={styles.sectionTitle}>3. Disdetta e Modifica</h3>
                <p>
                    In caso di impossibilità a presentarsi, si prega di comunicarlo con almeno{' '}
                    {/* 📝 COMPILA: es. "24 ore" */}
                    <strong>[ORE_PREAVVISO_DISDETTA] ore</strong> di anticipo, contattando il professionista a:{' '}
                    {/* 📝 COMPILA: email o numero di telefono per le disdette */}
                    <strong>[CONTATTO_DISDETTE]</strong>.
                </p>
                {/* 📝 COMPILA (opzionale): inserire eventuale politica di penale per no-show */}
            </section>

            {/* ── 4 ── */}
            <section className={styles.section}>
                <h3 className={styles.sectionTitle}>4. Idoneità al Trattamento</h3>
                <p>
                    Il paziente è responsabile di comunicare al professionista, prima del trattamento,
                    qualsiasi condizione medica, controindicazione o allergia rilevante.
                    {/* 📝 COMPILA (opzionale): aggiungere eventuali controindicazioni specifiche */}
                </p>
            </section>

            {/* ── 5 ── */}
            <section className={styles.section}>
                <h3 className={styles.sectionTitle}>5. Limitazione di Responsabilità</h3>
                <p>
                    {/* 📝 COMPILA: nome e cognome del massoterapista */}
                    <strong>[NOME_COGNOME]</strong> non è responsabile per eventuali
                    malfunzionamenti tecnici della piattaforma di prenotazione online che
                    impediscano o ritardino la ricezione della richiesta.
                    In caso di dubbio sulla ricezione, contattare direttamente il professionista.
                </p>
            </section>

            {/* ── 6 ── */}
            <section className={styles.section}>
                <h3 className={styles.sectionTitle}>6. Modifiche ai Termini</h3>
                <p>
                    Il professionista si riserva il diritto di modificare i presenti Termini in
                    qualsiasi momento. Le modifiche saranno efficaci dalla pubblicazione sul sito.
                    L'utilizzo continuato del servizio di prenotazione costituisce accettazione
                    delle versioni aggiornate.
                </p>
            </section>

        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   COMPONENTE PRINCIPALE
   ───────────────────────────────────────────────────────────── */
function PrivacyModal({ show, onClose, onAccept }) {
    // Tab attivo: 'privacy' | 'termini'
    const [activeTab, setActiveTab] = useState('privacy');

    if (!show) return null;

    return ReactDOM.createPortal(
        /* Overlay – click fuori dalla modale → chiude */
        <div className={styles.overlay} onClick={onClose}>

            {/* Contenuto – stopPropagation per non chiudere al click interno */}
            <div
                className={styles.modal}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label="Privacy e Termini del Servizio"
            >

                {/* ── Header ── */}
                <div className={styles.header}>
                    <h2 className={styles.headerTitle}>Privacy e Termini del Servizio</h2>
                    <button
                        className={styles.closeBtn}
                        onClick={onClose}
                        aria-label="Chiudi"
                    >
                        <FontAwesomeIcon icon={faXmark} />
                    </button>
                </div>

                {/* ── Tabs ── */}
                <div className={styles.tabs} role="tablist">
                    <button
                        role="tab"
                        aria-selected={activeTab === 'privacy'}
                        className={`${styles.tab} ${activeTab === 'privacy' ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab('privacy')}
                    >
                        <FontAwesomeIcon icon={faShieldHalved} className={styles.tabIcon} />
                        Privacy Policy
                    </button>
                    <button
                        role="tab"
                        aria-selected={activeTab === 'termini'}
                        className={`${styles.tab} ${activeTab === 'termini' ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab('termini')}
                    >
                        <FontAwesomeIcon icon={faFileLines} className={styles.tabIcon} />
                        Termini del Servizio
                    </button>
                </div>

                {/* ── Body scrollabile ── */}
                <div className={styles.body} role="tabpanel">
                    {activeTab === 'privacy' ? <PrivacyContent /> : <TermsContent />}
                </div>

                {/* ── Footer ── */}
                <div className={styles.footer}>
                    <button className={styles.btnSecondary} onClick={onClose}>
                        Chiudi
                    </button>
                    <button className={styles.btnPrimary} onClick={onAccept}>
                        Ho letto e accetto
                    </button>
                </div>

            </div>
        </div>,
        document.body
    );
}

export default PrivacyModal;
