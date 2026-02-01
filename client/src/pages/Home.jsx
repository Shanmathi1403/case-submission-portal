import { useState } from 'react';
import CaseForm from '../components/CaseForm.jsx';
import CaseList from '../components/CaseList.jsx';

const Home = () => {
  const [referenceNumber, setReferenceNumber] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [maskedPhone, setMaskedPhone] = useState('');
  const [smsStatus, setSmsStatus] = useState('');

  const handleSuccess = ({
    referenceNumber: ref,
    maskedPhone: masked,
    smsStatus: status
  }) => {
    setReferenceNumber(ref);
    setMaskedPhone(masked || '');
    setSmsStatus(status || '');
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <main className="app">
      <div className="container">
        <header className="header">
          <p className="header__eyebrow">Case Management</p>
          <h1 className="header__title">Case Submission Portal</h1>
          <p className="header__subtitle">
            Submit a case and monitor your submissions in one place.
          </p>
        </header>

        {referenceNumber && (
          <div className="card card--accent">
            <strong>Your case has been submitted successfully.</strong>
            <p style={{ margin: '0.5rem 0 0', fontWeight: 600 }}>
              Reference number: {referenceNumber}
            </p>
            {maskedPhone && (
              <p style={{ margin: '0.35rem 0 0' }}>
                SMS notification {smsStatus === 'FAILED' ? 'failed' : 'sent'} to{' '}
                {maskedPhone}
              </p>
            )}
            {smsStatus === 'FAILED' && (
              <p style={{ margin: '0.35rem 0 0' }}>
                We will retry automatically.
              </p>
            )}
          </div>
        )}

        <div className="grid grid--two">
          <CaseForm onSuccess={handleSuccess} />
          <CaseList refreshKey={refreshKey} />
        </div>
      </div>
    </main>
  );
};

export default Home;
