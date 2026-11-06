import { useCallback, useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUmbrellaBeach, faTrash, faPlus, faSpinner, faArrowRight,
    faCalendarDays, faSort, faSortUp, faSortDown,
    faChevronLeft, faChevronRight, faClock, faSliders,
    faRotateLeft, faCheck, faPenToSquare, faMagnifyingGlass,
} from '@fortawesome/free-solid-svg-icons';
import style from './AdminDashboard.module.css';
import { adminFetch } from '../utils/adminFetch';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const todayStr = () => new Date().toISOString().split('T')[0];

const formatDateIT = (dateStr) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('it-IT', {
        weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
    });
};

const formatRangeIT = (dateFrom, dateTo) => {
    if (dateFrom === dateTo) return formatDateIT(dateFrom);
    const [yf, mf, df] = dateFrom.split('-').map(Number);
    const [yt, mt, dt] = dateTo.split('-').map(Number);
    const from = new Date(yf, mf - 1, df).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' });
    const to   = new Date(yt, mt - 1, dt).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
    return `${from} – ${to}`;
};

const PAGE_SIZE = 10;

const localDay = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const initials = (b) => `${(b.name || '')[0] || ''}${(b.surname || '')[0] || ''}`.toUpperCase() || '—';

const BOOKING_FILTERS = [
    { key: 'future', label: 'Attuali e future', test: (b, now) => new Date(b.startISO) >= now },
    { key: 'today',  label: 'Oggi',             test: (b, now) => b.startISO.split('T')[0] === localDay(now) },
    { key: 'past',   label: 'Passate',          test: (b, now) => new Date(b.startISO) < now },
];

const VACATION_FILTERS = [
    { key: 'all',      label: 'Tutti',         test: () => true },
    { key: 'vacation', label: 'Ferie',         test: (v) => v.type !== 'partial-block' },
    { key: 'partial',  label: 'Blocchi orari', test: (v) => v.type === 'partial-block' },
];

// Un filtro è attivo solo se ha elementi da gestire; se quello scelto si svuota si passa al primo disponibile.
function pickFilter(options, wanted) {
    const chosen = options.find((o) => o.key === wanted && o.count > 0);
    return (chosen || options.find((o) => o.count > 0) || options[0]).key;
}

function FilterChips({ options, value, onChange, label }) {
    return (
        <div className={style.filterBar} role="group" aria-label={label}>
            {options.map((o) => (
                <button
                    key={o.key}
                    type="button"
                    className={`${style.chip}${o.key === value ? ` ${style.chipOn}` : ''}`}
                    aria-pressed={o.key === value}
                    disabled={o.count === 0}
                    title={o.count === 0 ? 'Nessun elemento da gestire' : undefined}
                    onClick={() => onChange(o.key)}
                >
                    {o.label}
                    <span className={style.chipCount}>{o.count}</span>
                </button>
            ))}
        </div>
    );
}

function SkeletonRows({ count = 4 }) {
    return (
        <div className={style.skelList} aria-busy="true" aria-label="Caricamento">
            {Array.from({ length: count }, (_, i) => (
                <span key={i} className={`${style.skelRow} skel`} style={{ '--i': i }} />
            ))}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Componente principale
// ─────────────────────────────────────────────────────────────

const TABS = [
    { key: 'prenotazioni', label: 'Prenotazioni',     icon: faCalendarDays },
    { key: 'orari',        label: 'Orari',            icon: faSliders },
    { key: 'ferie',        label: 'Ferie e permessi', icon: faUmbrellaBeach },
];

function AdminDashboardPage() {
    const [activeTab, setActiveTab] = useState('prenotazioni');
    const [version, setVersion]     = useState(0);
    const [counts, setCounts]       = useState({ prenotazioni: null, ferie: null });

    const refresh = useCallback(() => setVersion((v) => v + 1), []);

    // Conteggi mostrati nelle tab: si aggiornano dopo ogni modifica fatta dai pannelli
    useEffect(() => {
        let cancelled = false;
        Promise.all([
            adminFetch('/api/get-bookings').then((r) => r.json()).catch(() => null),
            adminFetch('/api/manage-vacation').then((r) => r.json()).catch(() => null),
        ]).then(([b, v]) => {
            if (cancelled) return;
            const now = new Date();
            setCounts({
                prenotazioni: b?.bookings ? b.bookings.filter((x) => x.startISO && new Date(x.startISO) >= now).length : 0,
                ferie: v?.vacations ? v.vacations.length : 0,
            });
        });
        return () => { cancelled = true; };
    }, [version]);

    return (
        <div className={style.page}>
            <div className={style.container}>

                <header className={style.header}>
                    <h1 className={`${style.headerTitle} rise`} style={{ '--i': 1 }}>Area riservata</h1>
                    <p className={`${style.headerSub} rise`} style={{ '--i': 2 }}>
                        Gestisci prenotazioni, orari e ferie.
                    </p>
                </header>

                <div className={`${style.tabs} rise`} style={{ '--i': 3 }} role="tablist" aria-label="Sezioni">
                    {TABS.map((t) => (
                        <button
                            key={t.key}
                            role="tab"
                            aria-selected={activeTab === t.key}
                            className={`${style.tab} ${activeTab === t.key ? style.tabActive : ''}`}
                            onClick={() => setActiveTab(t.key)}
                        >
                            <FontAwesomeIcon icon={t.icon} />
                            <span className={style.tabLabel}>{t.label}</span>
                            {t.key in counts && (
                                <span className={`${style.count}${counts[t.key] === null ? ' skel' : ''}`}>
                                    {counts[t.key] === null ? '0' : counts[t.key]}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                <div key={activeTab} className="page-enter">
                    {activeTab === 'prenotazioni' && <PrenotazioniTab onChange={refresh} />}
                    {activeTab === 'orari'        && <SlotOverrideTab />}
                    {activeTab === 'ferie'        && <FerieTab onChange={refresh} />}
                </div>

            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Tab Permessi / Ferie
// ─────────────────────────────────────────────────────────────

function FerieTab({ onChange }) {
    const [vacations, setVacations]     = useState([]);
    const [loadingList, setLoadingList] = useState(true);
    const [dateFrom, setDateFrom]       = useState('');
    const [dateTo, setDateTo]           = useState('');
    const [isPartial, setIsPartial]     = useState(false); // checkbox "Solo fascia oraria"
    const [timeFrom, setTimeFrom]       = useState('');
    const [timeTo, setTimeTo]           = useState('');
    const [adding, setAdding]           = useState(false);
    const [removingId, setRemovingId]   = useState(null);
    const [error, setError]             = useState(null);
    const [filter, setFilter]           = useState('all');

    const fetchVacations = useCallback(async () => {
        setLoadingList(true);
        setError(null);
        try {
            const res  = await adminFetch('/api/manage-vacation');
            const data = await res.json();
            if (!res.ok) throw new Error(data.details || data.error || 'Errore caricamento');
            setVacations(data.vacations);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoadingList(false);
        }
    }, []);

    useEffect(() => { fetchVacations(); }, [fetchVacations]);

    const handleDateFromChange = useCallback((val) => {
        setDateFrom(val);
        if (dateTo && dateTo < val) setDateTo('');
    }, [dateTo]);

    const handlePartialToggle = useCallback((e) => {
        setIsPartial(e.target.checked);
        // Reset dei campi non rilevanti quando si cambia modalità
        setDateTo('');
        setTimeFrom('');
        setTimeTo('');
    }, []);

    const isAddDisabled = useMemo(() => {
        if (!dateFrom || adding) return true;
        if (isPartial && (!timeFrom || !timeTo)) return true;
        if (isPartial && timeFrom >= timeTo) return true;
        return false;
    }, [dateFrom, adding, isPartial, timeFrom, timeTo]);

    const handleAdd = useCallback(async () => {
        if (isAddDisabled) return;
        setAdding(true);
        setError(null);
        try {
            const body = isPartial
                ? { dateFrom, timeFrom, timeTo }
                : { dateFrom, dateTo: dateTo || dateFrom };

            const res  = await adminFetch('/api/manage-vacation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.details || data.error || 'Errore aggiunta');
            setVacations((prev) =>
                [...prev, data.vacation].sort((a, b) => a.dateFrom.localeCompare(b.dateFrom))
            );
            onChange?.();
            setDateFrom(''); setDateTo(''); setTimeFrom(''); setTimeTo('');
            setIsPartial(false);
        } catch (err) {
            setError(err.message);
        } finally {
            setAdding(false);
        }
    }, [isAddDisabled, isPartial, dateFrom, dateTo, timeFrom, timeTo, onChange]);

    const handleRemove = useCallback(async (eventId) => {
        setRemovingId(eventId);
        setError(null);
        try {
            const res  = await adminFetch('/api/manage-vacation', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ eventId }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Errore rimozione');
            setVacations((prev) => prev.filter((v) => v.id !== eventId));
            onChange?.();
        } catch (err) {
            setError(err.message);
        } finally {
            setRemovingId(null);
        }
    }, [onChange]);

    const vacationOptions = VACATION_FILTERS.map((f) => ({ ...f, count: vacations.filter(f.test).length }));
    const activeVacationFilter = pickFilter(vacationOptions, filter);
    const visibleVacations = vacations.filter(VACATION_FILTERS.find((f) => f.key === activeVacationFilter).test);

    return (
        <div className={style.tabContent}>
            <p className={style.tabDescription}>
                Aggiungi i giorni o le fasce orarie in cui non sei disponibile.
                I clienti non potranno prenotare in quei periodi.
            </p>

            {/* Form aggiunta */}
            <div className={style.rangeForm}>

                {/* Checkbox modalità parziale */}
                <label className={style.partialToggle}>
                    <input
                        type="checkbox"
                        checked={isPartial}
                        onChange={handlePartialToggle}
                    />
                    <span>Solo fascia oraria (un giorno, orari specifici)</span>
                </label>

                <div className={style.rangeFields}>
                    {/* Campi data */}
                    <div className={style.dateField}>
                        <label className={style.dateLabel}>
                            {isPartial ? 'Giorno' : 'Dal'}
                        </label>
                        <input
                            type="date"
                            className={style.dateInput}
                            value={dateFrom}
                            min={todayStr()}
                            onChange={(e) => handleDateFromChange(e.target.value)}
                        />
                    </div>

                    {/* "Al" visibile solo in modalità giornate intere */}
                    {!isPartial && (
                        <>
                            <FontAwesomeIcon icon={faArrowRight} className={style.rangeArrow} />
                            <div className={style.dateField}>
                                <label className={style.dateLabel}>Al (opzionale)</label>
                                <input
                                    type="date"
                                    className={style.dateInput}
                                    value={dateTo}
                                    min={dateFrom || todayStr()}
                                    disabled={!dateFrom}
                                    onChange={(e) => setDateTo(e.target.value)}
                                />
                            </div>
                        </>
                    )}

                    {/* Orari — visibili solo in modalità parziale */}
                    {isPartial && (
                        <>
                            <FontAwesomeIcon icon={faClock} className={style.rangeArrow} />
                            <div className={style.dateField}>
                                <label className={style.dateLabel}>Dalle</label>
                                <input
                                    type="time"
                                    className={style.dateInput}
                                    value={timeFrom}
                                    disabled={!dateFrom}
                                    onChange={(e) => setTimeFrom(e.target.value)}
                                />
                            </div>
                            <FontAwesomeIcon icon={faArrowRight} className={style.rangeArrow} />
                            <div className={style.dateField}>
                                <label className={style.dateLabel}>Alle</label>
                                <input
                                    type="time"
                                    className={style.dateInput}
                                    value={timeTo}
                                    disabled={!timeFrom}
                                    min={timeFrom}
                                    onChange={(e) => setTimeTo(e.target.value)}
                                />
                            </div>
                        </>
                    )}
                </div>

                <button className={style.addBtn} onClick={handleAdd} disabled={isAddDisabled}>
                    {adding
                        ? <FontAwesomeIcon icon={faSpinner} spin />
                        : <><FontAwesomeIcon icon={faPlus} /> Aggiungi</>
                    }
                </button>
            </div>

            {error && <p className={style.errorMsg}>{error}</p>}

            {/* Lista */}
            {!loadingList && vacations.length > 0 && (
                <FilterChips
                    label="Filtra ferie e blocchi"
                    options={vacationOptions}
                    value={activeVacationFilter}
                    onChange={setFilter}
                />
            )}

            <div className={style.vacationList}>
                {loadingList ? (
                    <SkeletonRows count={3} />
                ) : vacations.length === 0 ? (
                    <p className={style.emptyMsg}>Nessun periodo o blocco orario programmato. Aggiungine uno qui sopra.</p>
                ) : (
                    visibleVacations.map((v, i) => (
                        <div key={v.id} className={`${style.vacationRow} pop`} style={{ '--i': i }}>
                            <FontAwesomeIcon
                                icon={v.type === 'partial-block' ? faClock : faUmbrellaBeach}
                                className={style.vacationIcon}
                            />
                            <span className={style.vacationDate}>
                                {v.type === 'partial-block'
                                    ? `${formatDateIT(v.dateFrom)}, ${v.timeFrom}–${v.timeTo}`
                                    : formatRangeIT(v.dateFrom, v.dateTo)
                                }
                            </span>
                            <span className={`${style.typeBadge} ${v.type === 'partial-block' ? style.badgePartial : style.badgeVacation}`}>
                                {v.type === 'partial-block' ? 'Orario' : 'Ferie'}
                            </span>
                            <button
                                className={style.removeBtn}
                                onClick={() => handleRemove(v.id)}
                                disabled={removingId === v.id}
                                title="Rimuovi"
                                aria-label="Rimuovi"
                            >
                                {removingId === v.id
                                    ? <FontAwesomeIcon icon={faSpinner} spin />
                                    : <FontAwesomeIcon icon={faTrash} />
                                }
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Tab Prenotazioni
// ─────────────────────────────────────────────────────────────

const COLUMNS = [
    { key: 'date',     label: 'Data',     sortType: 'date'   },
    { key: 'time',     label: 'Ora',      sortType: 'string' },
    { key: 'name',     label: 'Cliente',  sortType: 'string' },
    { key: 'contacts', label: 'Contatti', sortType: null     },
    { key: 'actions',  label: '',         sortType: null     },
];

function SortIcon({ col, sortKey, sortDir }) {
    if (col.sortType === null) return null;
    if (sortKey !== col.key) return <FontAwesomeIcon icon={faSort} className={style.sortIcon} />;
    return sortDir === 'asc'
        ? <FontAwesomeIcon icon={faSortUp}   className={`${style.sortIcon} ${style.sortActive}`} />
        : <FontAwesomeIcon icon={faSortDown} className={`${style.sortIcon} ${style.sortActive}`} />;
}

function PrenotazioniTab({ onChange }) {
    const [allBookings, setAllBookings]     = useState([]);
    const [loading, setLoading]             = useState(true);
    const [error, setError]                 = useState(null);
    const [filter, setFilter]               = useState('future');
    const [sortKey, setSortKey]             = useState('date');
    const [sortDir, setSortDir]             = useState('asc');
    const [page, setPage]                   = useState(1);
    const [editingBooking, setEditingBooking]   = useState(null);
    const [deletingBooking, setDeletingBooking] = useState(null);
    const [alertMessage, setAlertMessage]       = useState(null);
    const [detailBooking, setDetailBooking]     = useState(null); // modale dettaglio su mobile

    // ── Stato campi ricerca (non ancora applicati) ──
    const [searchText, setSearchText]         = useState('');
    const [searchDateFrom, setSearchDateFrom] = useState('');
    const [searchDateTo, setSearchDateTo]     = useState('');
    const [searchTimeFrom, setSearchTimeFrom] = useState('');
    const [searchTimeTo, setSearchTimeTo]     = useState('');
    // ── Filtri applicati (aggiornati solo al click "Cerca") ──
    const [appliedSearch, setAppliedSearch]   = useState(null);
    const [searchOpen, setSearchOpen]         = useState(false); // toggle area ricerca su mobile

    const fetchBookings = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res  = await adminFetch('/api/get-bookings');
            const data = await res.json();
            if (!res.ok) throw new Error(data.details || data.error || 'Errore caricamento prenotazioni');
            setAllBookings(data.bookings);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchBookings(); }, [fetchBookings]);

    const bookingOptions = useMemo(() => {
        const now = new Date();
        return BOOKING_FILTERS.map((f) => ({
            ...f,
            count: allBookings.filter((b) => b.startISO && f.test(b, now)).length,
        }));
    }, [allBookings]);
    const effectiveFilter = pickFilter(bookingOptions, filter);

    useEffect(() => { setPage(1); }, [effectiveFilter, sortKey, sortDir, appliedSearch]);

    const handleSort = useCallback((col) => {
        if (col.sortType === null) return;
        if (sortKey === col.key) {
            setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(col.key);
            setSortDir('asc');
        }
    }, [sortKey]);

    // Callback: prenotazione eliminata con successo → rimuovi dalla lista
    const handleDeleteSuccess = useCallback((id) => {
        setAllBookings((prev) => prev.filter((b) => b.id !== id));
        setDeletingBooking(null);
        onChange?.();
    }, [onChange]);

    // Callback: prenotazione modificata con successo → aggiorna la riga
    const handleEditSuccess = useCallback((updatedBooking) => {
        setAllBookings((prev) => prev.map((b) => b.id === updatedBooking.id ? updatedBooking : b));
        setEditingBooking(null);
        onChange?.();
    }, [onChange]);

    // Callback: conflitto di slot durante la modifica → mostra AlertModal
    const handleConflict = useCallback((msg) => {
        setEditingBooking(null);
        setAlertMessage(msg);
    }, []);

    // Gestori ricerca
    const handleSearch = useCallback(() => {
        setAppliedSearch({ searchText, searchDateFrom, searchDateTo, searchTimeFrom, searchTimeTo });
        setSearchOpen(false); // collassa il pannello su mobile per mostrare i risultati
    }, [searchText, searchDateFrom, searchDateTo, searchTimeFrom, searchTimeTo]);

    const handleReset = useCallback(() => {
        setSearchText('');
        setSearchDateFrom('');
        setSearchDateTo('');
        setSearchTimeFrom('');
        setSearchTimeTo('');
        setAppliedSearch(null);
    }, []);

    const rows = useMemo(() => {
        const now = new Date();

        // 1. Filtro future/passate
        const active = BOOKING_FILTERS.find((f) => f.key === effectiveFilter);
        let filtered = allBookings.filter((b) => b.startISO && active.test(b, now));

        // 2. Filtri di ricerca (solo quando applicati con "Cerca")
        if (appliedSearch) {
            const { searchText: text, searchDateFrom: df, searchDateTo: dt,
                    searchTimeFrom: tf, searchTimeTo: tt } = appliedSearch;

            if (text) {
                const q = text.toLowerCase().trim();
                filtered = filtered.filter((b) =>
                    (b.name    || '').toLowerCase().includes(q) ||
                    (b.surname || '').toLowerCase().includes(q) ||
                    (b.email   || '').toLowerCase().includes(q)
                );
            }
            if (df) filtered = filtered.filter((b) => b.startISO && b.startISO.split('T')[0] >= df);
            if (dt) filtered = filtered.filter((b) => b.startISO && b.startISO.split('T')[0] <= dt);
            if (tf) filtered = filtered.filter((b) => b.time && b.time >= tf);
            if (tt) filtered = filtered.filter((b) => b.time && b.time <= tt);
        }

        // 3. Ordinamento
        return [...filtered].sort((a, b) => {
            let va = sortKey === 'date' ? (a.startISO ?? '') : (a[sortKey] ?? '');
            let vb = sortKey === 'date' ? (b.startISO ?? '') : (b[sortKey] ?? '');
            const cmp = va.localeCompare(vb, 'it', { numeric: true, sensitivity: 'base' });
            return sortDir === 'asc' ? cmp : -cmp;
        });
    }, [allBookings, effectiveFilter, sortKey, sortDir, appliedSearch]);

    const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    const pageRows   = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    return (
        <div className={style.tabContent}>

            {/* ── Filtri a pillola (si spengono se non c'è nulla da gestire) e ricerca ── */}
            <div className={style.toolbar}>
                {!loading && allBookings.length > 0 ? (
                    <FilterChips
                        label="Filtra prenotazioni"
                        options={bookingOptions}
                        value={effectiveFilter}
                        onChange={setFilter}
                    />
                ) : <span />}
                <button
                    className={`${style.searchToggleBtn}${appliedSearch ? ` ${style.searchToggleBtnActive}` : ''}`}
                    onClick={() => setSearchOpen((o) => !o)}
                    aria-expanded={searchOpen}
                >
                    <FontAwesomeIcon icon={faMagnifyingGlass} />
                    <span>{searchOpen ? 'Nascondi ricerca' : 'Cerca'}</span>
                    {appliedSearch && <span className={style.searchActiveDot} />}
                </button>
            </div>

            {/* ── Area ricerca ── */}
            <div className={`${style.searchArea}${searchOpen ? ` ${style.searchAreaOpen}` : ''}`}>
                <div className={style.searchRow}>
                    <div className={style.searchField}>
                        <label className={style.dateLabel}>Nome, cognome o email</label>
                        <input
                            type="text"
                            className={style.dateInput}
                            placeholder="Es. Mario Rossi"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                    </div>
                    <div className={style.searchField}>
                        <label className={style.dateLabel}>Data da</label>
                        <input
                            type="date"
                            className={style.dateInput}
                            value={searchDateFrom}
                            onChange={(e) => setSearchDateFrom(e.target.value)}
                        />
                    </div>
                    <div className={style.searchField}>
                        <label className={style.dateLabel}>Data a</label>
                        <input
                            type="date"
                            className={style.dateInput}
                            value={searchDateTo}
                            min={searchDateFrom || undefined}
                            onChange={(e) => setSearchDateTo(e.target.value)}
                        />
                    </div>
                </div>

                <div className={style.searchRow}>
                    <div className={style.searchField}>
                        <label className={style.dateLabel}>Dalle ore</label>
                        <input
                            type="time"
                            className={style.dateInput}
                            value={searchTimeFrom}
                            onChange={(e) => setSearchTimeFrom(e.target.value)}
                        />
                    </div>
                    <div className={style.searchField}>
                        <label className={style.dateLabel}>Alle ore</label>
                        <input
                            type="time"
                            className={style.dateInput}
                            value={searchTimeTo}
                            min={searchTimeFrom || undefined}
                            onChange={(e) => setSearchTimeTo(e.target.value)}
                        />
                    </div>
                    <div className={style.searchActions}>
                        <button className={style.searchResetBtn} onClick={handleReset}>
                            Azzera
                        </button>
                        <button className={style.addBtn} onClick={handleSearch}>
                            Cerca
                        </button>
                    </div>
                </div>

                {appliedSearch && (
                    <p className={style.searchResultNote}>
                        {rows.length === 0
                            ? 'Nessun risultato per i filtri scelti.'
                            : `${rows.length} prenotazion${rows.length === 1 ? 'e trovata' : 'i trovate'}.`
                        }
                    </p>
                )}
            </div>

            {loading ? (
                <SkeletonRows count={5} />
            ) : error ? (
                <p className={style.errorMsg}>{error}</p>
            ) : rows.length === 0 ? (
                <p className={style.emptyMsg}>
                    {allBookings.length === 0
                        ? 'Nessuna prenotazione da gestire. Le nuove richieste compariranno qui.'
                        : 'Nessuna prenotazione trovata.'}
                </p>
            ) : (
                <>
                    {/* ── Vista compatta per telefono ── */}
                    <div className={style.bookingCards}>
                        {pageRows.map((b, i) => (
                            <button
                                key={b.id}
                                type="button"
                                className={`${style.bookingCard} pop`}
                                style={{ '--i': i }}
                                onClick={() => setDetailBooking(b)}
                            >
                                <span className={style.avatar}>{initials(b)}</span>
                                <span className={style.cardMain}>
                                    <span className={style.cardName}>{b.name} {b.surname}</span>
                                    <span className={style.cardDate}>{b.date}</span>
                                </span>
                                <span className={style.cardTime}>{b.time}</span>
                            </button>
                        ))}
                    </div>

                    {/* ── Tabella compatta per schermi larghi ── */}
                    <div className={style.tableWrapper}>
                        <table className={style.table}>
                            <thead>
                                <tr>
                                    {COLUMNS.map((col) => (
                                        <th
                                            key={col.key}
                                            className={`${style.th} ${col.sortType ? style.thSortable : ''}`}
                                            onClick={() => handleSort(col)}
                                        >
                                            {col.label}
                                            <SortIcon col={col} sortKey={sortKey} sortDir={sortDir} />
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {pageRows.map((b, i) => (
                                    <tr
                                        key={b.id}
                                        className={`${style.tr} pop`}
                                        style={{ '--i': i }}
                                        onClick={() => setDetailBooking(b)}
                                    >
                                        <td className={`${style.td} ${style.tdStrong}`}>{b.date}</td>
                                        <td className={`${style.td} ${style.tdTime}`}>{b.time}</td>
                                        <td className={style.td}>
                                            <span className={style.client}>
                                                <span className={style.avatar}>{initials(b)}</span>
                                                {b.name} {b.surname}
                                            </span>
                                        </td>
                                        <td className={`${style.td} ${style.tdContacts}`} onClick={(e) => e.stopPropagation()}>
                                            {b.phone !== '—'
                                                ? <a href={`tel:${b.phone}`} className={style.contactLink}>{b.phone}</a>
                                                : '—'}
                                            {b.email !== '—' && (
                                                <a href={`mailto:${b.email}`} className={`${style.contactLink} ${style.contactSub}`}>{b.email}</a>
                                            )}
                                        </td>
                                        {/* stopPropagation: evita che il click apra il dettaglio quando si preme modifica/elimina */}
                                        <td className={style.td} onClick={(e) => e.stopPropagation()}>
                                            <div className={style.actionBtns}>
                                                <button
                                                    className={`${style.actionBtn} ${style.actionBtnEdit}`}
                                                    onClick={() => setEditingBooking(b)}
                                                    title="Modifica prenotazione"
                                                    aria-label={`Modifica la prenotazione di ${b.name} ${b.surname}`}
                                                >
                                                    <FontAwesomeIcon icon={faPenToSquare} />
                                                </button>
                                                <button
                                                    className={`${style.actionBtn} ${style.actionBtnDelete}`}
                                                    onClick={() => setDeletingBooking(b)}
                                                    title="Elimina prenotazione"
                                                    aria-label={`Elimina la prenotazione di ${b.name} ${b.surname}`}
                                                >
                                                    <FontAwesomeIcon icon={faTrash} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className={style.pagination}>
                        <span className={style.pageInfo}>
                            {rows.length} prenotazion{rows.length === 1 ? 'e' : 'i'}
                            {totalPages > 1 && <span className={style.pageCount}>, pagina {page} di {totalPages}</span>}
                        </span>
                        {totalPages > 1 && (
                            <div className={style.pageBtns}>
                                <button
                                    className={style.pageBtn}
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    aria-label="Pagina precedente"
                                >
                                    <FontAwesomeIcon icon={faChevronLeft} />
                                </button>
                                <button
                                    className={style.pageBtn}
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    aria-label="Pagina successiva"
                                >
                                    <FontAwesomeIcon icon={faChevronRight} />
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Modale eliminazione */}
            {deletingBooking && (
                <DeleteConfirmModal
                    booking={deletingBooking}
                    onConfirm={handleDeleteSuccess}
                    onCancel={() => setDeletingBooking(null)}
                />
            )}

            {/* Modale modifica */}
            {editingBooking && (
                <EditBookingModal
                    booking={editingBooking}
                    onSave={handleEditSuccess}
                    onCancel={() => setEditingBooking(null)}
                    onConflict={handleConflict}
                />
            )}

            {/* Modale avviso (es. conflitto slot) */}
            {alertMessage && (
                <AlertModal message={alertMessage} onClose={() => setAlertMessage(null)} />
            )}

            {/* Modale dettaglio — si apre cliccando la riga (utile su mobile) */}
            {detailBooking && (
                <BookingDetailModal
                    booking={detailBooking}
                    onClose={() => setDetailBooking(null)}
                    onEdit={(b) => { setDetailBooking(null); setEditingBooking(b); }}
                    onDelete={(b) => { setDetailBooking(null); setDeletingBooking(b); }}
                />
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// AlertModal — avviso generico con solo tasto "OK"
// ─────────────────────────────────────────────────────────────

function AlertModal({ message, onClose }) {
    return (
        <div className={style.modalOverlay} onClick={onClose}>
            <div className={style.modal} onClick={(e) => e.stopPropagation()}>
                <h3 className={style.modalTitle}>Attenzione</h3>
                <div className={style.modalBody}>
                    <p>{message}</p>
                </div>
                <div className={style.modalFooter}>
                    <button className={style.btnPrimary} onClick={onClose}>OK</button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// BookingDetailModal — mostra tutti i dettagli di una prenotazione
// Principale utilità: su mobile dove le colonne telefono/email/azioni
// sono nascoste via CSS e l'utente tocca la riga per aprire questo modale.
// ─────────────────────────────────────────────────────────────

function BookingDetailModal({ booking, onClose, onEdit, onDelete }) {
    return (
        <div className={style.modalOverlay} onClick={onClose}>
            <div className={style.modal} onClick={(e) => e.stopPropagation()}>
                <h3 className={style.modalTitle}>{booking.name} {booking.surname}</h3>
                <div className={style.modalBody}>
                    <dl className={style.detailList}>
                        <dt>Data</dt>
                        <dd>{booking.date}</dd>
                        <dt>Orario</dt>
                        <dd>{booking.time}</dd>
                        <dt>Telefono</dt>
                        <dd>
                            {booking.phone !== '—'
                                ? <a href={`tel:${booking.phone}`} className={style.contactLink}>{booking.phone}</a>
                                : '—'}
                        </dd>
                        <dt>Email</dt>
                        <dd>
                            {booking.email !== '—'
                                ? <a href={`mailto:${booking.email}`} className={style.contactLink}>{booking.email}</a>
                                : '—'}
                        </dd>
                    </dl>
                </div>
                <div className={style.modalFooter}>
                    <button className={style.btnSecondary} onClick={onClose}>Chiudi</button>
                    <button className={style.btnPrimary} onClick={() => onEdit(booking)}>
                        <FontAwesomeIcon icon={faPenToSquare} /> Modifica
                    </button>
                    <button className={style.btnDanger} onClick={() => onDelete(booking)}>
                        <FontAwesomeIcon icon={faTrash} /> Elimina
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// DeleteConfirmModal — conferma eliminazione prenotazione
// ─────────────────────────────────────────────────────────────

function DeleteConfirmModal({ booking, onConfirm, onCancel }) {
    const [deleting, setDeleting] = useState(false);
    const [error, setError]       = useState(null);

    const handleConfirm = async () => {
        setDeleting(true);
        setError(null);
        try {
            const res  = await adminFetch('/api/manage-booking', {
                method:  'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ eventId: booking.id }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.details || data.error || 'Errore durante l\'eliminazione');
            onConfirm(booking.id);
        } catch (err) {
            setError(err.message);
            setDeleting(false);
        }
    };

    return (
        <div className={style.modalOverlay} onClick={onCancel}>
            <div className={style.modal} onClick={(e) => e.stopPropagation()}>
                <h3 className={style.modalTitle}>Elimina prenotazione</h3>
                <div className={style.modalBody}>
                    <p>
                        Sei sicuro di voler eliminare la prenotazione di{' '}
                        <strong>{booking.name} {booking.surname}</strong> del{' '}
                        <strong>{booking.date}</strong>?
                    </p>
                    <p className={style.modalNote}>
                        La prenotazione verrà rimossa dall'agenda e non si può recuperare.
                    </p>
                    {error && <p className={style.errorMsg}>{error}</p>}
                </div>
                <div className={style.modalFooter}>
                    <button className={style.btnSecondary} onClick={onCancel} disabled={deleting}>
                        Annulla
                    </button>
                    <button className={style.btnDanger} onClick={handleConfirm} disabled={deleting}>
                        {deleting
                            ? <FontAwesomeIcon icon={faSpinner} spin />
                            : 'Conferma eliminazione'
                        }
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// EditBookingModal — modifica i dati di una prenotazione
// ─────────────────────────────────────────────────────────────

function EditBookingModal({ booking, onSave, onCancel, onConflict }) {
    const [form, setForm] = useState({
        bookingDate: booking.startISO ? booking.startISO.split('T')[0] : '',
        bookingTime: booking.time     !== '—' ? booking.time    : '',
        name:        booking.name     !== '—' ? booking.name    : '',
        surname:     booking.surname  !== '—' ? booking.surname : '',
        phone:       booking.phone    !== '—' ? booking.phone   : '',
        email:       booking.email    !== '—' ? booking.email   : '',
    });
    const [saving, setSaving] = useState(false);
    const [error, setError]   = useState(null);

    const handleChange = (field, value) =>
        setForm((prev) => ({ ...prev, [field]: value }));

    const handleSave = async () => {
        if (!form.bookingDate || !form.bookingTime || !form.name || !form.surname) {
            setError('Data, orario, nome e cognome sono obbligatori.');
            return;
        }
        setSaving(true);
        setError(null);
        try {
            const res  = await adminFetch('/api/manage-booking', {
                method:  'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ eventId: booking.id, ...form }),
            });
            const data = await res.json();

            // Conflitto di slot: chiude questa modale e apre AlertModal
            if (res.status === 409) {
                onConflict(data.message || 'Lo slot scelto è già occupato. Scegli un orario diverso.');
                return;
            }
            if (!res.ok) throw new Error(data.details || data.error || 'Errore durante il salvataggio');
            onSave(data.booking);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={style.modalOverlay} onClick={onCancel}>
            <div className={style.modal} onClick={(e) => e.stopPropagation()}>
                <h3 className={style.modalTitle}>Modifica prenotazione</h3>
                <div className={style.modalBody}>
                    <div className={style.modalFormGrid}>
                        <div className={style.modalField}>
                            <label className={style.modalLabel}>Data</label>
                            <input
                                type="date"
                                className={style.modalInput}
                                value={form.bookingDate}
                                onChange={(e) => handleChange('bookingDate', e.target.value)}
                            />
                        </div>
                        <div className={style.modalField}>
                            <label className={style.modalLabel}>Orario</label>
                            <input
                                type="time"
                                className={style.modalInput}
                                value={form.bookingTime}
                                onChange={(e) => handleChange('bookingTime', e.target.value)}
                            />
                        </div>
                        <div className={style.modalField}>
                            <label className={style.modalLabel}>Nome</label>
                            <input
                                type="text"
                                className={style.modalInput}
                                value={form.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                            />
                        </div>
                        <div className={style.modalField}>
                            <label className={style.modalLabel}>Cognome</label>
                            <input
                                type="text"
                                className={style.modalInput}
                                value={form.surname}
                                onChange={(e) => handleChange('surname', e.target.value)}
                            />
                        </div>
                        <div className={style.modalField}>
                            <label className={style.modalLabel}>Telefono</label>
                            <input
                                type="text"
                                className={style.modalInput}
                                value={form.phone}
                                onChange={(e) => handleChange('phone', e.target.value)}
                            />
                        </div>
                        <div className={style.modalField}>
                            <label className={style.modalLabel}>Email</label>
                            <input
                                type="email"
                                className={style.modalInput}
                                value={form.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                            />
                        </div>
                    </div>
                    {error && <p className={style.errorMsg} style={{ marginTop: '0.75rem' }}>{error}</p>}
                </div>
                <div className={style.modalFooter}>
                    <button className={style.btnSecondary} onClick={onCancel} disabled={saving}>
                        Annulla
                    </button>
                    <button className={style.btnPrimary} onClick={handleSave} disabled={saving}>
                        {saving ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Salva'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Tab Orari (slot override per giorno)
// ─────────────────────────────────────────────────────────────

function SlotOverrideTab() {
    const [selectedDate, setSelectedDate] = useState('');
    const [slots, setSlots]               = useState([]);        // slot correnti (standard o override)
    const [overrideId, setOverrideId]     = useState(null);      // null = nessun override attivo
    const [isStandard, setIsStandard]     = useState(false);     // true = slot sono quelli standard
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [saving, setSaving]             = useState(false);
    const [resetting, setResetting]       = useState(false);
    const [newSlot, setNewSlot]           = useState('');
    const [saved, setSaved]               = useState(false);     // feedback "Salvato"
    const [error, setError]               = useState(null);

    // Al cambio data → carica override (se esiste) o slot standard
    const handleDateChange = useCallback(async (val) => {
        setSelectedDate(val);
        setSlots([]);
        setOverrideId(null);
        setIsStandard(false);
        setError(null);
        setSaved(false);
        if (!val) return;

        setLoadingSlots(true);
        try {
            // Verifica se esiste un override per questa data
            const overRes  = await adminFetch(`/api/manage-slot-override?date=${val}`);
            const overData = await overRes.json();
            if (!overRes.ok) throw new Error(overData.details || overData.error || 'Errore caricamento override');

            if (overData.override) {
                // Override esistente → mostra quegli slot
                setSlots(overData.override.slots);
                setOverrideId(overData.override.id);
                setIsStandard(false);
            } else {
                // Nessun override → carica gli slot standard generati dalle regole
                const stdRes  = await fetch('/api/get-available-slots', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ date: val }),
                });
                const stdData = await stdRes.json();
                if (!stdRes.ok) throw new Error(stdData.error || 'Errore caricamento slot standard');
                setSlots(stdData.slots || []);
                setIsStandard(true);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoadingSlots(false);
        }
    }, []);

    // Rimuove uno slot dalla lista locale (non salva ancora)
    const handleRemoveSlot = useCallback((slotToRemove) => {
        setSlots((prev) => prev.filter((s) => s !== slotToRemove));
        setSaved(false);
    }, []);

    // Aggiunge uno slot alla lista locale (non salva ancora)
    const handleAddSlot = useCallback(() => {
        if (!newSlot || !/^\d{2}:\d{2}$/.test(newSlot)) return;
        setSlots((prev) => {
            if (prev.includes(newSlot)) return prev;
            return [...prev, newSlot].sort();
        });
        setNewSlot('');
        setSaved(false);
    }, [newSlot]);

    // Salva l'override su Google Calendar
    const handleSave = useCallback(async () => {
        if (!selectedDate || saving) return;
        setSaving(true);
        setError(null);
        try {
            const res  = await adminFetch('/api/manage-slot-override', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date: selectedDate, slots }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.details || data.error || 'Errore salvataggio');
            setOverrideId(data.override.id);
            setIsStandard(false);
            setSaved(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    }, [selectedDate, slots, saving]);

    // Ripristina gli slot standard (elimina l'override)
    const handleReset = useCallback(async () => {
        if (!overrideId || resetting) return;
        setResetting(true);
        setError(null);
        try {
            const res  = await adminFetch('/api/manage-slot-override', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ eventId: overrideId }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Errore ripristino');
            // Ricarica gli slot standard
            await handleDateChange(selectedDate);
        } catch (err) {
            setError(err.message);
        } finally {
            setResetting(false);
        }
    }, [overrideId, resetting, selectedDate, handleDateChange]);

    return (
        <div className={style.tabContent}>
            <p className={style.tabDescription}>
                Personalizza gli slot disponibili per un giorno specifico. Puoi aggiungere
                o rimuovere orari rispetto alla disponibilità standard. Le modifiche
                sostituiscono completamente gli slot di quel giorno.
            </p>

            {/* Selezione giorno */}
            <div className={style.overrideDateRow}>
                <div className={style.dateField}>
                    <label className={style.dateLabel}>Seleziona giorno</label>
                    <input
                        type="date"
                        className={style.dateInput}
                        value={selectedDate}
                        onChange={(e) => handleDateChange(e.target.value)}
                    />
                </div>
            </div>

            {error && <p className={style.errorMsg}>{error}</p>}

            {/* Contenuto slot — visibile solo dopo aver scelto una data */}
            {selectedDate && (
                <>
                    {loadingSlots ? (
                        <SkeletonRows count={3} />
                    ) : (
                        <>
                            {/* Banner informativo: standard vs override */}
                            <div className={`${style.overrideBanner} ${isStandard ? style.bannerStandard : style.bannerOverride}`}>
                                {isStandard
                                    ? 'Slot generati dalla disponibilità standard. Modifica e salva per personalizzarli.'
                                    : 'Stai vedendo gli slot personalizzati per questo giorno.'}
                            </div>

                            {/* Lista slot con rimozione */}
                            <div className={style.slotOverrideList}>
                                {slots.length === 0 ? (
                                    <p className={style.emptyMsg}>Nessuno slot — aggiungi almeno un orario.</p>
                                ) : (
                                    slots.map((s) => (
                                        <div key={s} className={style.slotOverrideRow}>
                                            <FontAwesomeIcon icon={faClock} className={style.vacationIcon} />
                                            <span className={style.slotOverrideTime}>{s}</span>
                                            <button
                                                className={style.removeBtn}
                                                onClick={() => handleRemoveSlot(s)}
                                                title="Rimuovi slot"
                                            >
                                                <FontAwesomeIcon icon={faTrash} />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Aggiunta nuovo slot */}
                            <div className={style.addSlotRow}>
                                <div className={style.dateField}>
                                    <label className={style.dateLabel}>Aggiungi orario</label>
                                    <input
                                        type="time"
                                        className={style.dateInput}
                                        value={newSlot}
                                        onChange={(e) => setNewSlot(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddSlot()}
                                    />
                                </div>
                                <button
                                    className={style.addBtn}
                                    onClick={handleAddSlot}
                                    disabled={!newSlot}
                                    title="Aggiungi orario"
                                >
                                    <FontAwesomeIcon icon={faPlus} />
                                    {/* Su mobile stretto il testo viene nascosto via CSS */}
                                    <span className={style.addBtnLabel}> Aggiungi</span>
                                </button>
                            </div>

                            {/* Azioni principali */}
                            <div className={style.overrideActions}>
                                <button
                                    className={style.saveBtn}
                                    onClick={handleSave}
                                    disabled={saving}
                                >
                                    {saving
                                        ? <FontAwesomeIcon icon={faSpinner} spin />
                                        : saved
                                            ? <><FontAwesomeIcon icon={faCheck} /> Salvato</>
                                            : <><FontAwesomeIcon icon={faCheck} /> Salva modifiche</>
                                    }
                                </button>

                                {overrideId && (
                                    <button
                                        className={style.resetBtn}
                                        onClick={handleReset}
                                        disabled={resetting}
                                        title="Elimina personalizzazione e torna agli slot standard"
                                    >
                                        {resetting
                                            ? <FontAwesomeIcon icon={faSpinner} spin />
                                            : <><FontAwesomeIcon icon={faRotateLeft} /> Ripristina standard</>
                                        }
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
}

export default AdminDashboardPage;
