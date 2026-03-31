import { useEffect, useState, useMemo, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUmbrellaBeach, faTrash, faPlus, faSpinner, faArrowRight,
    faCalendarDays, faSort, faSortUp, faSortDown,
    faChevronLeft, faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import style from './AdminDashboard.module.css';

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

// ─────────────────────────────────────────────────────────────
// Componente principale
// ─────────────────────────────────────────────────────────────

function AdminDashboardPage() {
    const [activeTab, setActiveTab] = useState('ferie');

    return (
        <div className={style.page}>
            <div className={style.container}>

                <header className={style.header}>
                    <div>
                        <p className={style.headerLabel}>Area riservata</p>
                        <h1 className={style.headerTitle}>Dashboard</h1>
                    </div>
                </header>

                {/* Tab bar */}
                <div className={style.tabs}>
                    <button
                        className={`${style.tab} ${activeTab === 'ferie' ? style.tabActive : ''}`}
                        onClick={() => setActiveTab('ferie')}
                    >
                        <FontAwesomeIcon icon={faUmbrellaBeach} />
                        Gestione ferie
                    </button>
                    <button
                        className={`${style.tab} ${activeTab === 'prenotazioni' ? style.tabActive : ''}`}
                        onClick={() => setActiveTab('prenotazioni')}
                    >
                        <FontAwesomeIcon icon={faCalendarDays} />
                        Prenotazioni
                    </button>
                </div>

                {activeTab === 'ferie'        && <FerieTab />}
                {activeTab === 'prenotazioni' && <PrenotazioniTab />}

            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Tab Ferie
// ─────────────────────────────────────────────────────────────

function FerieTab() {
    const [vacations, setVacations]   = useState([]);
    const [loadingList, setLoadingList] = useState(true);
    const [dateFrom, setDateFrom]     = useState('');
    const [dateTo, setDateTo]         = useState('');
    const [adding, setAdding]         = useState(false);
    const [removingId, setRemovingId] = useState(null);
    const [error, setError]           = useState(null);

    const fetchVacations = async () => {
        setLoadingList(true);
        setError(null);
        try {
            const res  = await fetch('/api/manage-vacation');
            const data = await res.json();
            if (!res.ok) throw new Error(data.details || data.error || 'Errore caricamento ferie');
            setVacations(data.vacations);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoadingList(false);
        }
    };

    useEffect(() => { fetchVacations(); }, []);

    const handleDateFromChange = (val) => {
        setDateFrom(val);
        if (dateTo && dateTo < val) setDateTo('');
    };

    const handleAdd = async () => {
        if (!dateFrom) return;
        setAdding(true);
        setError(null);
        try {
            const res  = await fetch('/api/manage-vacation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dateFrom, dateTo: dateTo || dateFrom }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.details || data.error || 'Errore aggiunta ferie');
            setVacations((prev) =>
                [...prev, data.vacation].sort((a, b) => a.dateFrom.localeCompare(b.dateFrom))
            );
            setDateFrom('');
            setDateTo('');
        } catch (err) {
            setError(err.message);
        } finally {
            setAdding(false);
        }
    };

    const handleRemove = async (eventId) => {
        setRemovingId(eventId);
        setError(null);
        try {
            const res  = await fetch('/api/manage-vacation', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ eventId }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Errore rimozione ferie');
            setVacations((prev) => prev.filter((v) => v.id !== eventId));
        } catch (err) {
            setError(err.message);
        } finally {
            setRemovingId(null);
        }
    };

    return (
        <div className={style.tabContent}>
            <p className={style.tabDescription}>
                Aggiungi i giorni in cui non sei disponibile. Puoi selezionare un giorno singolo o un intervallo di date.
            </p>

            <div className={style.rangeForm}>
                <div className={style.rangeFields}>
                    <div className={style.dateField}>
                        <label className={style.dateLabel}>Dal</label>
                        <input
                            type="date"
                            className={style.dateInput}
                            value={dateFrom}
                            min={todayStr()}
                            onChange={(e) => handleDateFromChange(e.target.value)}
                        />
                    </div>
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
                </div>
                <button
                    className={style.addBtn}
                    onClick={handleAdd}
                    disabled={!dateFrom || adding}
                >
                    {adding
                        ? <FontAwesomeIcon icon={faSpinner} spin />
                        : <><FontAwesomeIcon icon={faPlus} /> Aggiungi</>
                    }
                </button>
            </div>

            {error && <p className={style.errorMsg}>{error}</p>}

            <div className={style.vacationList}>
                {loadingList ? (
                    <p className={style.emptyMsg}><FontAwesomeIcon icon={faSpinner} spin /> Caricamento…</p>
                ) : vacations.length === 0 ? (
                    <p className={style.emptyMsg}>Nessun periodo di ferie programmato.</p>
                ) : (
                    vacations.map((v) => (
                        <div key={v.id} className={style.vacationRow}>
                            <FontAwesomeIcon icon={faUmbrellaBeach} className={style.vacationIcon} />
                            <span className={style.vacationDate}>{formatRangeIT(v.dateFrom, v.dateTo)}</span>
                            <button
                                className={style.removeBtn}
                                onClick={() => handleRemove(v.id)}
                                disabled={removingId === v.id}
                                title="Rimuovi"
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

// Colonne della tabella — definite fuori dal componente per stabilità referenziale
const COLUMNS = [
    { key: 'date',    label: 'Data',     sortType: 'date'   },
    { key: 'time',    label: 'Orario',   sortType: 'string' },
    { key: 'name',    label: 'Nome',     sortType: 'string' },
    { key: 'surname', label: 'Cognome',  sortType: 'string' },
    { key: 'phone',   label: 'Telefono', sortType: null     },  // non ordinabile
    { key: 'email',   label: 'Email',    sortType: 'string' },
];

function SortIcon({ col, sortKey, sortDir }) {
    if (col.sortType === null) return null;
    if (sortKey !== col.key) return <FontAwesomeIcon icon={faSort} className={style.sortIcon} />;
    return sortDir === 'asc'
        ? <FontAwesomeIcon icon={faSortUp}   className={`${style.sortIcon} ${style.sortActive}`} />
        : <FontAwesomeIcon icon={faSortDown} className={`${style.sortIcon} ${style.sortActive}`} />;
}

function PrenotazioniTab() {
    const [allBookings, setAllBookings] = useState([]);
    const [loading, setLoading]         = useState(true);
    const [error, setError]             = useState(null);
    const [filter, setFilter]           = useState('future');   // 'future' | 'past'
    const [sortKey, setSortKey]         = useState('date');
    const [sortDir, setSortDir]         = useState('asc');
    const [page, setPage]               = useState(1);

    const fetchBookings = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res  = await fetch('/api/get-bookings');
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

    // Resetta la pagina quando cambia filtro o ordinamento
    useEffect(() => { setPage(1); }, [filter, sortKey, sortDir]);

    // Gestione click intestazione colonna.
    // NOTA: non usare setSortKey con updater annidato — chiamare due setState dentro
    // un updater causa batch inconsistente. Leggiamo sortKey direttamente dalla closure.
    const handleSort = useCallback((col) => {
        if (col.sortType === null) return;
        if (sortKey === col.key) {
            // stessa colonna → inverte direzione
            setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
        } else {
            // colonna diversa → ordine ascendente
            setSortKey(col.key);
            setSortDir('asc');
        }
    }, [sortKey]);

    // Filtra per passate / future + ordina
    const rows = useMemo(() => {
        const now = new Date();
        const filtered = allBookings.filter((b) => {
            if (!b.startISO) return false;
            const start = new Date(b.startISO);
            return filter === 'future' ? start >= now : start < now;
        });

        return [...filtered].sort((a, b) => {
            let va = a[sortKey] ?? '';
            let vb = b[sortKey] ?? '';

            // Per la colonna date usiamo startISO per un ordinamento corretto
            if (sortKey === 'date') {
                va = a.startISO ?? '';
                vb = b.startISO ?? '';
            }

            const cmp = va.localeCompare(vb, 'it', { numeric: true, sensitivity: 'base' });
            return sortDir === 'asc' ? cmp : -cmp;
        });
    }, [allBookings, filter, sortKey, sortDir]);

    // Paginazione
    const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    const pageRows   = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    return (
        <div className={style.tabContent}>

            {/* Filtro passate / future */}
            <div className={style.bookingFilters}>
                <button
                    className={`${style.filterBtn} ${filter === 'future' ? style.filterActive : ''}`}
                    onClick={() => setFilter('future')}
                >
                    Attuali e future
                </button>
                <button
                    className={`${style.filterBtn} ${filter === 'past' ? style.filterActive : ''}`}
                    onClick={() => setFilter('past')}
                >
                    Passate
                </button>
            </div>

            {/* Stati: loading / errore / vuoto / tabella */}
            {loading ? (
                <p className={style.emptyMsg}><FontAwesomeIcon icon={faSpinner} spin /> Caricamento…</p>
            ) : error ? (
                <p className={style.errorMsg}>{error}</p>
            ) : rows.length === 0 ? (
                <p className={style.emptyMsg}>Nessuna prenotazione trovata.</p>
            ) : (
                <>
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
                                {pageRows.map((b) => (
                                    <tr key={b.id} className={style.tr}>
                                        <td className={style.td}>{b.date}</td>
                                        <td className={style.td}>{b.time}</td>
                                        <td className={style.td}>{b.name}</td>
                                        <td className={style.td}>{b.surname}</td>
                                        <td className={style.td}>
                                            {/* tel: su mobile attiva il dialogo chiamata */}
                                            {b.phone !== '—'
                                                ? <a href={`tel:${b.phone}`} className={style.contactLink}>{b.phone}</a>
                                                : '—'
                                            }
                                        </td>
                                        <td className={style.td}>
                                            {/* mailto: apre Outlook su desktop, app mail su mobile */}
                                            {b.email !== '—'
                                                ? <a href={`mailto:${b.email}`} className={style.contactLink}>{b.email}</a>
                                                : '—'
                                            }
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Paginazione */}
                    {totalPages > 1 && (
                        <div className={style.pagination}>
                            <button
                                className={style.pageBtn}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                aria-label="Pagina precedente"
                            >
                                <FontAwesomeIcon icon={faChevronLeft} />
                            </button>

                            <span className={style.pageInfo}>
                                Pagina <strong>{page}</strong> di <strong>{totalPages}</strong>
                                <span className={style.pageCount}> · {rows.length} prenotazioni</span>
                            </span>

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
                </>
            )}
        </div>
    );
}

export default AdminDashboardPage;
