import { useCallback, useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUmbrellaBeach, faTrash, faPlus, faSpinner, faArrowRight,
    faCalendarDays, faSort, faSortUp, faSortDown,
    faChevronLeft, faChevronRight, faClock, faSliders,
    faRotateLeft, faCheck, faPenToSquare,
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
                        Gestione permessi
                    </button>
                    <button
                        className={`${style.tab} ${activeTab === 'prenotazioni' ? style.tabActive : ''}`}
                        onClick={() => setActiveTab('prenotazioni')}
                    >
                        <FontAwesomeIcon icon={faCalendarDays} />
                        Prenotazioni
                    </button>
                    <button
                        className={`${style.tab} ${activeTab === 'orari' ? style.tabActive : ''}`}
                        onClick={() => setActiveTab('orari')}
                    >
                        <FontAwesomeIcon icon={faSliders} />
                        Orari
                    </button>
                </div>

                {activeTab === 'ferie'        && <FerieTab />}
                {activeTab === 'prenotazioni' && <PrenotazioniTab />}
                {activeTab === 'orari'        && <SlotOverrideTab />}

            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Tab Permessi / Ferie
// ─────────────────────────────────────────────────────────────

function FerieTab() {
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

    const fetchVacations = useCallback(async () => {
        setLoadingList(true);
        setError(null);
        try {
            const res  = await fetch('/api/manage-vacation');
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

            const res  = await fetch('/api/manage-vacation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.details || data.error || 'Errore aggiunta');
            setVacations((prev) =>
                [...prev, data.vacation].sort((a, b) => a.dateFrom.localeCompare(b.dateFrom))
            );
            setDateFrom(''); setDateTo(''); setTimeFrom(''); setTimeTo('');
            setIsPartial(false);
        } catch (err) {
            setError(err.message);
        } finally {
            setAdding(false);
        }
    }, [isAddDisabled, isPartial, dateFrom, dateTo, timeFrom, timeTo]);

    const handleRemove = useCallback(async (eventId) => {
        setRemovingId(eventId);
        setError(null);
        try {
            const res  = await fetch('/api/manage-vacation', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ eventId }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Errore rimozione');
            setVacations((prev) => prev.filter((v) => v.id !== eventId));
        } catch (err) {
            setError(err.message);
        } finally {
            setRemovingId(null);
        }
    }, []);

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
            <div className={style.vacationList}>
                {loadingList ? (
                    <p className={style.emptyMsg}><FontAwesomeIcon icon={faSpinner} spin /> Caricamento…</p>
                ) : vacations.length === 0 ? (
                    <p className={style.emptyMsg}>Nessun periodo o blocco orario programmato.</p>
                ) : (
                    vacations.map((v) => (
                        <div key={v.id} className={style.vacationRow}>
                            <FontAwesomeIcon
                                icon={v.type === 'partial-block' ? faClock : faUmbrellaBeach}
                                className={style.vacationIcon}
                            />
                            <span className={style.vacationDate}>
                                {v.type === 'partial-block'
                                    ? `${formatDateIT(v.dateFrom)} · ${v.timeFrom}–${v.timeTo}`
                                    : formatRangeIT(v.dateFrom, v.dateTo)
                                }
                            </span>
                            {/* Badge tipo */}
                            <span className={`${style.typeBadge} ${v.type === 'partial-block' ? style.badgePartial : style.badgeVacation}`}>
                                {v.type === 'partial-block' ? 'Orario' : 'Ferie'}
                            </span>
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

const COLUMNS = [
    { key: 'date',    label: 'Data',     sortType: 'date'   },
    { key: 'time',    label: 'Orario',   sortType: 'string' },
    { key: 'name',    label: 'Nome',     sortType: 'string' },
    { key: 'surname', label: 'Cognome',  sortType: 'string' },
    { key: 'phone',   label: 'Telefono', sortType: null     },
    { key: 'email',   label: 'Email',    sortType: 'string' },
    { key: 'actions', label: 'Azioni',   sortType: null     },
];

function SortIcon({ col, sortKey, sortDir }) {
    if (col.sortType === null) return null;
    if (sortKey !== col.key) return <FontAwesomeIcon icon={faSort} className={style.sortIcon} />;
    return sortDir === 'asc'
        ? <FontAwesomeIcon icon={faSortUp}   className={`${style.sortIcon} ${style.sortActive}`} />
        : <FontAwesomeIcon icon={faSortDown} className={`${style.sortIcon} ${style.sortActive}`} />;
}

function PrenotazioniTab() {
    const [allBookings, setAllBookings]     = useState([]);
    const [loading, setLoading]             = useState(true);
    const [error, setError]                 = useState(null);
    const [filter, setFilter]               = useState('future');
    const [sortKey, setSortKey]             = useState('date');
    const [sortDir, setSortDir]             = useState('asc');
    const [page, setPage]                   = useState(1);
    const [editingBooking, setEditingBooking]   = useState(null); // prenotazione in modifica
    const [deletingBooking, setDeletingBooking] = useState(null); // prenotazione da eliminare
    const [alertMessage, setAlertMessage]       = useState(null); // testo per AlertModal

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
    useEffect(() => { setPage(1); }, [filter, sortKey, sortDir]);

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
    }, []);

    // Callback: prenotazione modificata con successo → aggiorna la riga
    const handleEditSuccess = useCallback((updatedBooking) => {
        setAllBookings((prev) => prev.map((b) => b.id === updatedBooking.id ? updatedBooking : b));
        setEditingBooking(null);
    }, []);

    // Callback: conflitto di slot durante la modifica → mostra AlertModal
    const handleConflict = useCallback((msg) => {
        setEditingBooking(null);
        setAlertMessage(msg);
    }, []);

    const rows = useMemo(() => {
        const now = new Date();
        const filtered = allBookings.filter((b) => {
            if (!b.startISO) return false;
            const start = new Date(b.startISO);
            return filter === 'future' ? start >= now : start < now;
        });
        return [...filtered].sort((a, b) => {
            let va = sortKey === 'date' ? (a.startISO ?? '') : (a[sortKey] ?? '');
            let vb = sortKey === 'date' ? (b.startISO ?? '') : (b[sortKey] ?? '');
            const cmp = va.localeCompare(vb, 'it', { numeric: true, sensitivity: 'base' });
            return sortDir === 'asc' ? cmp : -cmp;
        });
    }, [allBookings, filter, sortKey, sortDir]);

    const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    const pageRows   = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    return (
        <div className={style.tabContent}>
            <div className={style.bookingFilters}>
                <button
                    className={`${style.filterBtn} ${filter === 'future' ? style.filterActive : ''}`}
                    onClick={() => setFilter('future')}
                >Attuali e future</button>
                <button
                    className={`${style.filterBtn} ${filter === 'past' ? style.filterActive : ''}`}
                    onClick={() => setFilter('past')}
                >Passate</button>
            </div>

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
                                            {b.phone !== '—'
                                                ? <a href={`tel:${b.phone}`} className={style.contactLink}>{b.phone}</a>
                                                : '—'}
                                        </td>
                                        <td className={style.td}>
                                            {b.email !== '—'
                                                ? <a href={`mailto:${b.email}`} className={style.contactLink}>{b.email}</a>
                                                : '—'}
                                        </td>
                                        <td className={style.td}>
                                            <div className={style.actionBtns}>
                                                <button
                                                    className={`${style.actionBtn} ${style.actionBtnEdit}`}
                                                    onClick={() => setEditingBooking(b)}
                                                    title="Modifica prenotazione"
                                                >
                                                    <FontAwesomeIcon icon={faPenToSquare} />
                                                </button>
                                                <button
                                                    className={`${style.actionBtn} ${style.actionBtnDelete}`}
                                                    onClick={() => setDeletingBooking(b)}
                                                    title="Elimina prenotazione"
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

                    {totalPages > 1 && (
                        <div className={style.pagination}>
                            <button
                                className={style.pageBtn}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
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
                            >
                                <FontAwesomeIcon icon={faChevronRight} />
                            </button>
                        </div>
                    )}
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
// DeleteConfirmModal — conferma eliminazione prenotazione
// ─────────────────────────────────────────────────────────────

function DeleteConfirmModal({ booking, onConfirm, onCancel }) {
    const [deleting, setDeleting] = useState(false);
    const [error, setError]       = useState(null);

    const handleConfirm = async () => {
        setDeleting(true);
        setError(null);
        try {
            const res  = await fetch('/api/manage-booking', {
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
                        L'evento verrà rimosso definitivamente da Google Calendar.
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
            const res  = await fetch('/api/manage-booking', {
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
            const overRes  = await fetch(`/api/manage-slot-override?date=${val}`);
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
            const res  = await fetch('/api/manage-slot-override', {
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
            const res  = await fetch('/api/manage-slot-override', {
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
                        <p className={style.emptyMsg}><FontAwesomeIcon icon={faSpinner} spin /> Caricamento slot…</p>
                    ) : (
                        <>
                            {/* Banner informativo: standard vs override */}
                            <div className={`${style.overrideBanner} ${isStandard ? style.bannerStandard : style.bannerOverride}`}>
                                {isStandard
                                    ? '📅 Slot generati automaticamente dalla disponibilità standard. Modifica e salva per personalizzarli.'
                                    : '✏️ Stai visualizzando gli slot personalizzati per questo giorno.'}
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
                                >
                                    <FontAwesomeIcon icon={faPlus} /> Aggiungi
                                </button>
                            </div>

                            {/* Azioni principali */}
                            <div className={style.overrideActions}>
                                <button
                                    className={style.saveBtn}
                                    onClick={handleSave}
                                    disabled={saving || slots.length === 0}
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
