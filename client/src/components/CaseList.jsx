import { useEffect, useState } from 'react';
import { fetchCases } from '../api/casesApi';

const CaseList = ({ refreshKey }) => {
  const [cases, setCases] = useState([]);
  const [status, setStatus] = useState({ loading: false, error: null });

  useEffect(() => {
    const loadCases = async () => {
      setStatus({ loading: true, error: null });
      try {
        const result = await fetchCases();
        setCases(result.cases || []);
        setStatus({ loading: false, error: null });
      } catch (err) {
        setStatus({ loading: false, error: err.message });
      }
    };

    loadCases();
  }, [refreshKey]);

  return (
    <section className="card">
      <div className="case-card__header" style={{ marginBottom: '1rem' }}>
        <h2 className="card__title" style={{ margin: 0 }}>
          My Submitted Cases
        </h2>
        <span className="badge">
          {cases.length} {cases.length === 1 ? 'case' : 'cases'}
        </span>
      </div>
      {status.loading && <p>Loading cases...</p>}
      {status.error && <p className="status">{status.error}</p>}
      {!status.loading && cases.length === 0 && (
        <p>No cases submitted yet.</p>
      )}
      {cases.length > 0 && (
        <ul className="list">
          {cases.map((caseItem) => (
            <li key={caseItem.id} className="case-card">
              <div className="case-card__header">
                <strong>{caseItem.referenceNumber}</strong>
                <span className="case-card__meta">{caseItem.createdAt}</span>
              </div>
              <h3 className="case-card__title">{caseItem.title}</h3>
              <div className="case-card__footer">
                Status: {caseItem.status} | Notification: SMS {caseItem.smsStatus}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default CaseList;
