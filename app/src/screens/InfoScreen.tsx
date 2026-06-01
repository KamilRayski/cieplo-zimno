import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { FlameIcon, SnowIcon, ThermoIcon } from '../components/icons'
import { withDelay } from '../lib/withDelay'

export default function InfoScreen() {
  const items = [
    {
      title: 'Gorąco',
      desc: 'Powyżej 50°C. Jesteś bardzo blisko. Słowo jest synonimem lub ściśle powiązane z hasłem.',
      tone: 'hot',
      value: 92,
      icon: <FlameIcon />,
    },
    {
      title: 'Ciepło',
      desc: 'Od 0°C do 50°C. Dobry kierunek. Słowo należy do tej samej kategorii tematycznej.',
      tone: 'warm',
      value: 58,
      icon: <ThermoIcon />,
    },
    {
      title: 'Zimno',
      desc: 'Poniżej 0°C. Zupełnie inny temat. Spróbuj poszukać w innym obszarze skojarzeń.',
      tone: 'cold',
      value: 18,
      icon: <SnowIcon />,
    },
  ]

  const samples = [
    { word: 'KOT', temp: '85°C', tone: 'hot' },
    { word: 'ZWIERZĘ', temp: '55°C', tone: 'warm' },
    { word: 'KRZESŁO', temp: '-15°C', tone: 'cold' },
  ]

  return (
    <>
      <div>
        <h1 className="page-title">INFORMACJE</h1>
        <p className="page-subtitle">
          Twoim celem jest odgadnięcie ukrytego słowa. Im bliżej
          znaczeniowo jest Twoje słowo, tym wyższa temperatura.
        </p>
      </div>

      <div className="stack">
        {items.map((item, index) => (
          <div
            key={item.title}
            className="card info-card reveal"
            style={withDelay(`${0.08 + index * 0.08}s`)}
          >
            <div className="info-row">
              <span className={`info-icon tone-${item.tone}`}>{item.icon}</span>
              <div>
                <div className="card-title">{item.title}</div>
                <p className="card-desc">{item.desc}</p>
              </div>
            </div>
            <div
              className={`progress progress-${item.tone}`}
              style={{ '--progress': `${item.value}%` } as CSSProperties}
            />
          </div>
        ))}
      </div>

      <div className="card info-block">
        <div className="card-title">Mechanika Semantyczna</div>
        <p className="card-desc">
          Gra nie ocenia podobieństwa liter (jak w Wordle), ale
          podobieństwo znaczeniowe. System AI analizuje miliony tekstów, aby
          zrozumieć kontekst słów.
        </p>
        <p className="card-desc">
          Jeśli ukrytym słowem jest "PIES", to słowo "KOT" będzie miało
          wysoką temperaturę, a słowo "KRZESŁO" bardzo niską.
        </p>
        <div className="score-table">
          <div className="score-head">
            <span>TWÓJ STRZAŁ</span>
            <span>TEMPERATURA</span>
          </div>
          {samples.map((sample) => (
            <div key={sample.word} className="score-row">
              <span>{sample.word}</span>
              <span className={`score-temp temp-${sample.tone}`}>
                {sample.temp}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="card info-block">
        <div className="card-title">O nas</div>
        <p className="card-desc">
          Projekt "Ciepło-Zimno" to eksperyment łączący zabawę słowem z
          nowoczesnymi modelami językowymi (NLP). Chcemy pokazać, jak maszyny
          "rozumieją" język na poziomie semantycznym.
        </p>
      </div>

      <div className="card info-block">
        <div className="card-title">Kontakt</div>
        <p className="card-desc">
          Masz pytania, znalazłeś błąd lub chcesz po prostu powiedzieć cześć?
        </p>
        <Link className="secondary-btn" to="/contact">
          Napisz do nas
        </Link>
      </div>
    </>
  )
}
