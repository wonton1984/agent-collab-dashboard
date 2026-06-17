export default function StatsCard({ icon: Icon, label, value, color = 'blue' }) {
  const colorStyles = {
    blue:    { grad: 'from-blue-500 to-indigo-500',    soft: 'bg-blue-50',    text: 'text-blue-600' },
    green:   { grad: 'from-emerald-500 to-teal-500',   soft: 'bg-emerald-50', text: 'text-emerald-600' },
    yellow:  { grad: 'from-amber-400 to-orange-500',   soft: 'bg-amber-50',   text: 'text-amber-600' },
    purple:  { grad: 'from-violet-500 to-purple-500',  soft: 'bg-violet-50',  text: 'text-violet-600' },
    red:     { grad: 'from-rose-500 to-pink-500',      soft: 'bg-rose-50',    text: 'text-rose-600' },
  }
  const s = colorStyles[color] || colorStyles.blue

  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${s.grad} flex items-center justify-center text-white shadow-sm`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-gray-900 tabular-nums">{value}</p>
      </div>
    </div>
  )
}
