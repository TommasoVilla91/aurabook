import style from './FormPage.module.css';

function FormPage() {


    return (
        <div className={style.formPage}>
            <section className={style.formSection}>
                <h1>Modulo di Prenotazione</h1>
                <form>
                    <div className={style.formTop}>
                        <div className={style.anagraphicInfo}>
                            <div>
                                <label htmlFor="name">Nome:</label>
                                <input type="text" id="name" name="name" required />
                            </div>

                            <div>
                                <label htmlFor="name">Cognome:</label>
                                <input type="text" id="name" name="name" required />
                            </div>

                            <div>
                                <label htmlFor="name">Data di nascita:</label>
                                <input type="date" id="birth" name="birth" required />
                            </div>

                            <div>
                                <label htmlFor="phone">Telefono:</label>
                                <input type="tel" id="phone" name="phone" required />
                            </div>

                            <div>
                                <label htmlFor="email">Email:</label>
                                <input type="email" id="email" name="email" required />
                            </div>
                        </div>

                        <div className={style.bookingInfo}>
                            <section>
                                <div>
                                    <label htmlFor="date">Data:</label>
                                    <input type="date" id="date" name="date" required />
                                </div>

                                <div>
                                    <label htmlFor="time">Orario:</label>
                                    <input type="time" id="time" name="time" required />
                                </div>
                            </section>
                        </div>
                    </div>

                    <div className={style.description}>
                        <label htmlFor="description">Descrivi il motivo della visita</label>
                        <textarea name="description" id="description" required></textarea>
                    </div>
                    
                    <div className={style.submitButton}>
                        <button type="submit">Prenota</button>
                    </div>
                </form>
            </section>
        </div>
    );
};

export default FormPage;