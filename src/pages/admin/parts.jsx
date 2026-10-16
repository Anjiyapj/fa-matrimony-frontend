import { MON } from '../../lib/utils';

export function TrendBars({ data, height = 260 }) {
  if (!data) return null;
  const max = Math.max(1, ...data.map((x) => Math.max(x.active, x.newReg, x.inactive, x.onHold || 0)));
  return (
    <>
      <div className="bars" style={{ height }}>
        {data.map((x) => (
          <div key={x.month} className="bar-g" title={`${x.month}: ${x.active} active, ${x.newReg} new, ${x.onHold || 0} on hold, ${x.inactive} inactive`}>
            <div className="a" style={{ height: `${(x.active / max) * 100}%` }} />
            <div className="n" style={{ height: `${(x.newReg / max) * 100}%` }} />
            <div className="h" style={{ height: `${((x.onHold || 0) / max) * 100}%` }} />
            <div className="x" style={{ height: `${(x.inactive / max) * 100}%` }} />
          </div>
        ))}
      </div>
      <div className="bar-lbl">{data.map((x) => <span key={x.month}>{MON[+x.month.slice(5) - 1]}</span>)}</div>
    </>
  );
}
export const Legend = () => (
  <div className="legend"><span><i style={{ background: 'var(--wine)' }} />Active</span><span><i style={{ background: '#f0a7b5' }} />New</span><span><i style={{ background: '#8fb0e6' }} />On hold</span><span><i style={{ background: '#cfc4c6' }} />Inactive</span></div>
);
export function Seg({ value, onChange, options }) {
  return <div className="seg">{options.map(([v, label]) => <button key={v} type="button" className={value === v ? 'on' : ''} onClick={() => onChange(v)}>{label}</button>)}</div>;
}
