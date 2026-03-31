import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUmbrellaBeach, faTrash, faPlus, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { useGlobalContext } from '../context/GlobalContext';
import style from './AdminDashboard.module.css';

// ── Helpers ────────────────────────────────────────────────────────────────

const formatDateIT = (dateStr) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('it-IT', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
};

const todayStr = () => new Date().toISOString().split('T')[0];

// ── Componente principale ──────────────────────────────────────────────────

function AdminDashboardPage() {
    const { logout } = useGlobalContext();

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

                {/* Contenuto tab */}
                {activeTab === 'ferie' && <FerieTab />}

            </div>
        </div>
    );
}

// ── Tab Ferie ──────────────────────────────────────────────────────────────

function FerieTab() {
    const [vacations, setVacations] = useState([]);
    const [loadingList, setLoadingList] = useState(true);
    const [newDate, setNewDate] = useState('');
    const [adding, setAdding] = useState(false);
    const [removingId, setRemovingId] = useState(null);
    const [error, setError] = useState(null);

    // Carica ferie esistenti
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

    // Aggiungi giorno di ferie
    const handleAdd = async () => {
        if (!newDate) return;
        setAdding(true);
        setError(null);
        try {
            const res = await fetch('/api/manage-vacation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date: newDate }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.details || data.error || 'Errore aggiunta ferie');
            setVacations((prev) => [...prev, data.vacation].sort((a, b) => a.date.localeCompare(b.date)));
            setNewDate('');
        } catch (err) {
            setError(err.message);
        } finally {
            setAdding(false);
        }
    };

    // Rimuovi giorno di ferie
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
                Aggiungi le date in cui non sei disponibile. I clienti non potranno prenotare in quei giorni.
            </p>

            {/* Form aggiunta */}
            <div className={style.addRow}>
                <input
                    type="date"
                    className={style.dateInput}
                    value={newDate}
                    min={todayStr()}
                    onChange={(e) => setNewDate(e.target.value)}
                />
                <button
                    className={style.addBtn}
                    onClick={handleAdd}
                    disabled={!newDate || adding}
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
                    <p className={style.emptyMsg}>Nessun giorno di ferie programmato.</p>
                ) : (
                    vacations.map((v) => (
                        <div key={v.id} className={style.vacationRow}>
                            <FontAwesomeIcon icon={faUmbrellaBeach} className={style.vacationIcon} />
                            <span className={style.vacationDate}>{formatDateIT(v.date)}</span>
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
