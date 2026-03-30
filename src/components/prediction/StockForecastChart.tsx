import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, ComposedChart, Legend } from 'recharts';

export default function StockForecastChart({ data }: { data: any }) {
  // On prépare les données pour l'affichage
  const chartData = data.predictions.map((p: any) => ({
    date: new Date(p.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }),
    prediction: p.quantite_predite,
    range: [p.borne_basse, p.borne_haute], // Pour la zone d'incertitude
    borneHaute: p.borne_haute,
  }));

  return (
    <div className="h-[400px] w-full bg-white p-4">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
          <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
          
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
            formatter={(value: any) => [`${value} unités`, '']}
          />
          <Legend verticalAlign="top" height={36}/>

          {/* Zone d'incertitude (Le risque de variation) */}
          <Area 
            name="Zone de variation possible"
            dataKey="borneHaute" 
            stroke="none" 
            fill="#e2e8f0" 
            fillOpacity={0.5} 
          />

          {/* Ligne principale de prédiction */}
          <Line 
            name="Consommation prévue"
            type="monotone" 
            dataKey="prediction" 
            stroke="#3b82f6" 
            strokeWidth={3} 
            dot={{ r: 4, fill: '#3b82f6' }}
            activeDot={{ r: 6, strokeWidth: 0 }} 
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}