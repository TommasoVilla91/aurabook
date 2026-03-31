import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUmbrellaBeach, faTrash, faPlus, faSpinner, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import style from './AdminDashboard.module.css';

// ── Helpers ────────────────────────────────────────────────────────────────

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

const todayStr = () => new Date().toISOString().split('T')[0];

// ── Componente principale ──────────────────────────────────────────────────

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
                </div>

                {activeTab === 'ferie' && <FerieTab />}

            </div>
        </div>
    );
}

// ── Tab Ferie ──────────────────────────────────────────────────────────────

function FerieTab() {
    const [vacations, setVacations] = useState([]);
    const [loadingList, setLoadingList] = useState(true);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [adding, setAdding] = useState(false);
    const [removingId, setRemovingId] = useState(null);
    const [error, setError] = useState(null);

    const fetchVacations = async () => {
        setLoadingList(true);
        setError(null);
        try {
            const res = await fetch('/api/manage-vacation');
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

    // Quando cambia dateFrom, se dateTo è precedente lo resetta
    const handleDateFromChange = (val) => {
        setDateFrom(val);
        if (dateTo && dateTo < val) setDateTo('');
    };

    const handleAdd = async () => {
        if (!dateFrom) return;
        setAdding(true);
        setError(null);
        try {
            const res = await fetch('/api/manage-vacation', {
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
            const res = await fetch('/api/manage-vacation', {
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

            {/* Form aggiunta range */}
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

            {/* Lista ferie */}
            <div className={style.vacationList}>
                {loadingList ? (
                    <p className={style.emptyMsg}>
                        <FontAwesomeIcon icon={faSpinner} spin /> Caricamento…
                    </p>
                ) : vacations.length === 0 ? (
                    <p className={style.emptyMsg}>Nessun periodo di ferie programmato.</p>
                ) : (
                    vacations.map((v) => (
                        <div key={v.id} className={style.vacationRow}>
                            <FontAwesomeIcon icon={faUmbrellaBeach} className={style.vacationIcon} />
                            <span className={style.vacationDate}>
                                {formatRangeIT(v.dateFrom, v.dateTo)}
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

export default AdminDashboardPage;
