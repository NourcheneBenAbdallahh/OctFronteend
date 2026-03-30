import React from 'react';

export const SimpleReportExport = ({ data, id }: { data: any; id: string }) => {
  return (
    <div
      id={id}
      style={{
        padding: '40px',
        backgroundColor: '#ffffff',
        width: '800px',
        fontFamily: 'Arial, sans-serif',
        position: 'absolute',
        left: '-9999px',
        top: '0',
        color: '#111827',
      }}
    >
      <h1
        style={{
          color: '#a7c8ee',
          borderBottom: '2px solid #e2e8f0',
          paddingBottom: '10px',
          marginBottom: '20px',
        }}
      >
        Rapport d'Analyse : {data.name}
      </h1>

      <p style={{ fontSize: '14px', color: '#64748b' }}>
        Date d'extraction : {new Date().toLocaleDateString('fr-FR')}
      </p>

      <div style={{ display: 'flex', gap: '20px', marginTop: '30px' }}>
        <div
          style={{
            padding: '15px',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            flex: 1,
            backgroundColor: '#f8fafc',
          }}
        >
          <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
            STOCK DE SÉCURITÉ
          </p>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '5px 0' }}>
            {data.metrics.safety_stock} U
          </p>
        </div>

        <div
          style={{
            padding: '15px',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            flex: 1,
            backgroundColor: '#f8fafc',
          }}
        >
          <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
            FIABILITÉ IA
          </p>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '5px 0' }}>
            {data.metrics.confidence_level}
          </p>
        </div>

        <div
          style={{
            padding: '15px',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            flex: 1,
            backgroundColor: '#f8fafc',
          }}
        >
          <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
            SIGMA
          </p>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '5px 0' }}>
            {data.metrics.volatility_sigma}
          </p>
        </div>
      </div>

      <h2 style={{ marginTop: '40px', fontSize: '18px', color: '#1e293b' }}>
        Prévisions sur 7 jours
      </h2>

      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          marginTop: '15px',
          fontSize: '14px',
        }}
      >
        <thead>
          <tr style={{ backgroundColor: '#f8fafc', textAlign: 'left' }}>
            <th style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>Date</th>
            <th style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>Quantité</th>
            <th style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>Intervalle</th>
          </tr>
        </thead>
        <tbody>
          {data.predictions.map((p: any, i: number) => (
            <tr key={i}>
              <td style={{ padding: '12px', borderBottom: '1px solid #f1f5f9' }}>{p.date}</td>
              <td
                style={{
                  padding: '12px',
                  borderBottom: '1px solid #f1f5f9',
                  fontWeight: 'bold',
                }}
              >
                {p.quantite_predite}
              </td>
              <td
                style={{
                  padding: '12px',
                  borderBottom: '1px solid #f1f5f9',
                  color: '#64748b',
                }}
              >
                [{p.borne_basse} - {p.borne_haute}]
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};