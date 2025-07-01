import React from 'react';
import ReactDOM from 'react-dom';
import style from './EventModal.module.css';

const avariableSlots = [
    'lun 15:30 - 20:30',
    'mar-ven 8:00 - 20:30',
    'mer-gio 20:00 - 13:00',
    'sab 9:00 - 13:00'
]

function EventModal({ onClose, show, selectedDate }) {


    return show && ReactDOM.createPortal (
        <div className={style.eventModal}>
            <div className={style.modalContent}>
                <h2></h2>
                <p><strong>Data:</strong></p>
                <p><strong>Descrizione:</strong></p>
                <button onClick={onClose}>Chiudi</button>
            </div>
        </div>,
        document.body
    );
};

export default EventModal;