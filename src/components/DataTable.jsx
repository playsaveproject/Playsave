import React, { useState, useMemo } from 'react';
import './DataTable.css';

// Conversión de monedas actualizada
const conversionRates = {
  INR: 0.0125,
  EUR: 1.16,
  USD: 1,
  TRY: 0.0253,
  GBP: 1.34,
  MXN: 0.055
};

function getFlagIcon(code) {
  const lower = code.toLowerCase();
  return <span className={`fi fi-${lower}`} />;
}

function getCurrency(item) {
  switch (item.pais) {
    case 'IN': return 'INR';
    case 'ES': case 'FR': case 'DE': case 'IT': return 'EUR';
    case 'TR': return 'TRY';
    case 'MX': return 'MXN';
    case 'GB': return 'GBP';
    default: return 'USD';
  }
}

function parseNumber(raw, currency) {
  if (!raw) return 0;
  const rawStr = String(raw);
  // Si viene con prefijo US$, tratamos como USD
  if (/^US\$/.test(rawStr)) {
    const num = rawStr.replace(/[^\d.]/g, '');
    return parseFloat(num) || 0;
  }
  let s = rawStr.replace(/\s|\u00A0|\u202F/g, '');
  switch (currency) {
    case 'INR':
      s = s.replace(/\D/g, '');
      return parseInt(s, 10) || 0;
    case 'USD':
    case 'GBP':
      s = s.replace(/,/g, '').replace(/[^\d.]/g, '');
      return parseFloat(s) || 0;
    case 'EUR':
    case 'MXN': {
      const lastComma = s.lastIndexOf(',');
      if (lastComma !== -1) {
        const intPart = s.slice(0, lastComma).replace(/\./g, '');
        const decPart = s.slice(lastComma + 1);
        s = `${intPart}.${decPart}`;
      } else {
        s = s.replace(/\./g, '');
      }
      return parseFloat(s) || 0;
    }
    case 'TRY': {
      const idx = s.lastIndexOf(',');
      if (idx !== -1) {
        const intP = s.slice(0, idx).replace(/\./g, '');
        const decP = s.slice(idx + 1);
        s = `${intP}.${decP}`;
      } else {
        s = s.replace(/\./g, '');
      }
      return parseFloat(s) || 0;
    }
    default:
      s = s.replace(/[^\d.]/g, '');
      return parseFloat(s) || 0;
  }
}

function toUSD(value, currency) {
  return value * (conversionRates[currency] || 1);
}

function formatDate(raw) {
  if (!raw) return '-';
  const m = raw.match(/(\d{1,2})[\/\.](\d{1,2})[\/\.](\d{4})/);
  if (!m) return '-';
  const [, d, mo, y] = m;
  return `${d.padStart(2,'0')}/${mo.padStart(2,'0')}/${y}`;
}

export default function DataTable() {
  const allData = useMemo(
    () => Object.values(import.meta.glob('../data/*.json', { eager: true }))
                 .flatMap(mod => Object.values(mod.default).flat()),
    []
  );

  const [cheapestMode, setCheapestMode] = useState(false);
  const [filters, setFilters] = useState({ pais: '', tipo: '', titulo: '' });
  const [sortOption, setSortOption] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 30;

  const sortOptions = [
    { value: '', label: 'Ordenar por relevancia' },
    { value: 'price_asc', label: 'Precio: menor a mayor' },
    { value: 'price_desc', label: 'Precio: mayor a menor' },
    { value: 'discount_desc', label: 'Descuento: mayor a menor' },
    { value: 'discount_asc', label: 'Descuento: menor a mayor' },
    { value: 'expiry_asc', label: 'Expira: más cercano primero' },
    { value: 'expiry_desc', label: 'Expira: más lejano primero' },
    { value: 'popularity_desc', label: 'Popularidad: más popular primero' },
    { value: 'popularity_asc', label: 'Popularidad: menos popular primero' }
  ];

  const uniqueValues = key =>
    useMemo(
      () => Array.from(new Set(allData.map(it => it[key]).filter(Boolean))).sort(),
      [allData, key]
    );
  const countries = uniqueValues('pais');
  const types = uniqueValues('tipo');

  const enriched = useMemo(
    () => allData.map(item => {
      const votes = parseInt(String(item.votes).replace(/\D/g, ''), 10) || 0;
      const curr = getCurrency(item);
      const isMDY = ['US', 'CA'].includes(item.pais);

      // Precio final
      const localFinal = (curr === 'INR' || curr === 'TRY')
        ? parseNumber(item.precioFinal, curr)
        : (item.precioNum != null ? item.precioNum : parseNumber(item.precioFinal, curr));
      const usdFinal = toUSD(localFinal, curr);

      // Precio original
      let origCurr = curr;
      if (typeof item.precioOrig === 'string' && item.precioOrig.startsWith('US$')) {
        origCurr = 'USD';
      }
      const localOrig = parseNumber(item.precioOrig, origCurr);
      const usdOrig = toUSD(localOrig, origCurr);

      // Fecha de expiración
      let expiryDate = null;
      const dtTimeMatch = item.offerEnds?.match(
        /(\d{1,2})[\/\.](\d{1,2})[\/\.](\d{4})\s+(\d{1,2}):(\d{2})\s*(a\.m\.|p\.m\.)\s*GMT([+-]?\d+)/i
      );
      if (dtTimeMatch) {
        const [, p1, p2, y, hh, mm, ampm, tz] = dtTimeMatch;
        const day = isMDY ? p2 : p1;
        const month = isMDY ? p1 : p2;
        let hour = parseInt(hh, 10);
        if (/p\.m\./i.test(ampm) && hour < 12) hour += 12;
        if (/a\.m\./i.test(ampm) && hour === 12) hour = 0;
        const tzSign = tz[0];
        const tzHour = tz.slice(1).padStart(2,'0');
        expiryDate = new Date(`${y}-${month.padStart(2,'0')}-${day.padStart(2,'0')}T${hour.toString().padStart(2,'0')}:${mm}:00${tzSign}${tzHour}:00`);
      } else {
        const dtMatch = item.offerEnds?.match(/(\d{1,2})[\/\.](\d{1,2})[\/\.](\d{4})/);
        if (dtMatch) {
          const [, p1, p2, y] = dtMatch;
          const day = isMDY ? p2 : p1;
          const month = isMDY ? p1 : p2;
          expiryDate = new Date(`${y}-${month.padStart(2,'0')}-${day.padStart(2,'0')}`);
        }
      }
      const isExpired = expiryDate ? expiryDate.getTime() < Date.now() : false;

      return { ...item, votes, usdFinal, usdOrig, expiryDate, isExpired };
    }),
    [allData]
  );

  const grouped = useMemo(() => {
    if (!cheapestMode) return enriched;
    const map = {};
    enriched.forEach(item => {
      if (!map[item.titulo] || item.usdFinal < map[item.titulo].usdFinal) {
        map[item.titulo] = item;
      }
    });
    return Object.values(map);
  }, [enriched, cheapestMode]);

  const filtered = useMemo(
    () => grouped.filter(item => {
      if (filters.pais && item.pais !== filters.pais) return false;
      if (filters.tipo && item.tipo !== filters.tipo) return false;
      if (filters.titulo && !item.titulo.toLowerCase().includes(filters.titulo.toLowerCase())) return false;
      return true;
    }),
    [grouped, filters]
  );

  const sorted = useMemo(() => {
    const data = [...filtered];
    switch (sortOption) {
      case 'price_asc':
        data.sort((a, b) => a.usdFinal - b.usdFinal);
        break;
      case 'price_desc':
        data.sort((a, b) => b.usdFinal - a.usdFinal);
        break;
      case 'discount_desc':
        data.sort((a, b) => parseFloat(b.descuento) - parseFloat(a.descuento));
        break;
      case 'discount_asc':
        data.sort((a, b) => parseFloat(a.descuento) - parseFloat(b.descuento));
        break;
      case 'expiry_asc':
        data.sort((a, b) =>
          (a.expiryDate?.getTime() ?? Infinity) - (b.expiryDate?.getTime() ?? Infinity)
        );
        break;
      case 'expiry_desc':
        data.sort((a, b) =>
          (b.expiryDate?.getTime() ?? -Infinity) - (a.expiryDate?.getTime() ?? -Infinity)
        );
        break;
      case 'popularity_desc':
        data.sort((a, b) => b.votes - a.votes);
        break;
      case 'popularity_asc':
        data.sort((a, b) => a.votes - b.votes);
        break;
      default:
        break;
    }
    return data;
  }, [filtered, sortOption]);

  const totalPages = Math.ceil(sorted.length / pageSize);
  const paginated = sorted.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  return (
    <div className="data-table">
      {/* Controles */}
      <div className="controls mb-3">
        <button
          type="button"
          onClick={() => { setCheapestMode(c => !c); setCurrentPage(0); }}
          className={`btn py-3 w-100 ${cheapestMode ? 'btn-active' : 'btn-inactive'}`}
        >
          {cheapestMode ? 'Mostrar todos' : 'Analizar el menor precio de cada juego'}
          <span className="d-block small">
            {cheapestMode
              ? 'Volver al modo normal.'
              : 'Al presionar, analiza el mismo título en todos los países, mostrando solo el más barato.'}
          </span>
        </button>
      </div>

      {/* Filtros y orden */}
      <div className="filters mb-3">
        <select
          value={filters.pais}
          onChange={e => { setFilters(f => ({ ...f, pais: e.target.value })); setCurrentPage(0); }}
        >
          <option value="">Todos los países</option>
          {countries.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={filters.tipo}
          onChange={e => { setFilters(f => ({ ...f, tipo: e.target.value })); setCurrentPage(0); }}
        >
          <option value="">Todos los tipos</option>
          {types.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <input
          type="text"
          placeholder="Buscar título"
          value={filters.titulo}
          onChange={e => { setFilters(f => ({ ...f, titulo: e.target.value })); setCurrentPage(0); }}
        />
        <select
          value={sortOption}
          onChange={e => { setSortOption(e.target.value); setCurrentPage(0); }}
        >
          {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Tabla */}
      <div className="table-wrapper text-center align-middle ">
        <table>
          <thead>
            <tr>
              <th className='text-center'>País</th>
              <th className='text-center'>Tipo</th>
              <th className='text-center'>Título</th>
              <th className='text-center'>Desc</th>
              <th className='text-center'>Precio (USD)</th>
              <th className='text-center'>Original (USD)</th>
              <th className='text-center'>Expira</th>
              <th className='text-center'>Link</th>
              <th className='text-center'>Voces</th>
              <th className='text-center'>Subtítulos</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((item, idx) => (
              <tr key={`${item.titulo}-${item.pais}-${idx}`}>
                <td className='text-center'>{getFlagIcon(item.pais)}{item.pais}</td>
                <td className='text-center'>{item.tipo}</td>
                <td >
                  <a href={item.link} target="_blank" rel="noopener noreferrer">
                    {item.titulo}
                  </a>
                </td>
                <td className='text-center'><span className="badge badge-blue">{item.descuento}%</span></td>
                <td className='text-center'><span className="badge badge-green">${item.usdFinal.toFixed(2)}</span></td>
                <td className='text-center'><span className="badge badge-gray">${item.usdOrig.toFixed(2)}</span></td>
                <td className='text-center'>
                  <span className="badge badge-red">
                    {item.isExpired ? 'Ya expiró' : formatDate(item.offerEnds)}
                  </span>
                </td>
                <td className='text-center'>
                  <a href={item.link} target="_blank" rel="noopener noreferrer">
                    Ver enlace
                  </a>
                </td>
                <td className="badges-cell ">
                  {item.voices
                    ? item.voices.split(',').slice(0,3).map(l =>
                        <span key={l} className="badge badge-lang">{l.trim()}</span>
                      )
                    : <span className="no-spec">-</span>}
                </td>
                <td className="badges-cell  ">
                  {item.subtitles
                    ? item.subtitles.split(',').slice(0,3).map(s =>
                        <span key={s} className="badge badge-lang">{s.trim()}</span>
                      )
                    : <span className="no-spec">-</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginador */}
      <div className="pagination mt-3">
        <button
          className="btn btn-sm"
          onClick={() => setCurrentPage(p => Math.max(p-1, 0))}
          disabled={currentPage === 0}
        >
          Anterior
        </button>
        <span className="mx-2 small">
          Página {currentPage+1} de {totalPages}
        </span>
        <button
          className="btn btn-sm"
          onClick={() => setCurrentPage(p => Math.min(p+1, totalPages-1))}
          disabled={currentPage === totalPages-1}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
