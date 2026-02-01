import { useState, useEffect } from 'react';
import { submitCase } from '../api/casesApi';
import { getUser } from '../utils/token';

const initialForm = {
  title: '',
  description: ''
};

const CaseForm = ({ onSuccess }) => {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState({ loading: false, error: null });
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [userPhone, setUserPhone] = useState('');

  // Get phone from user profile
  useEffect(() => {
    const user = getUser();
    if (user && user.phone) {
      setUserPhone(user.phone);
    }
  }, []);

  const validateField = (fieldName, value) => {
    if (!value || value.trim().length === 0) {
      return 'This field is required.';
    }

    if (fieldName === 'title') {
      if (value.trim().length < 10) {
        return 'Title must be at least 10 characters.';
      }
      if (value.trim().length > 100) {
        return 'Title must be 100 characters or less.';
      }
    }

    if (fieldName === 'description') {
      if (value.trim().length < 10) {
        return 'Description must be at least 10 characters.';
      }
      if (value.trim().length > 1000) {
        return 'Description must be 1000 characters or less.';
      }
    }

    return '';
  };

  const validateForm = (values) => {
    const nextErrors = {};
    Object.entries(values).forEach(([key, value]) => {
      const message = validateField(key, value);
      if (message) {
        nextErrors[key] = message;
      }
    });
    return nextErrors;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (touched[name]) {
      setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
    }
  };

  const handleBlur = (event) => {
    const { name, value } = event.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validateForm(form);
    setErrors(nextErrors);
    setTouched({
      title: true,
      description: true
    });

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    if (!userPhone) {
      setStatus({ loading: false, error: 'Phone number is required. Please update your profile.' });
      return;
    }

    setStatus({ loading: true, error: null });

    try {
      const result = await submitCase({ ...form, phone: userPhone });
      setForm(initialForm);
      setTouched({});
      setErrors({});
      onSuccess(result);
      setStatus({ loading: false, error: null });
    } catch (err) {
      const message =
        err.message === 'Failed to fetch'
          ? 'Unable to reach the server. Please try again.'
          : 'We could not submit your case. Please review the form and try again.';
      setStatus({ loading: false, error: message });
    }
  };

  return (
    <section className="card">
      <h2 className="card__title">Submit a Case</h2>
      <p className="section__hint">All fields are required. SMS will be sent to your registered phone number.</p>
      <form onSubmit={handleSubmit} className="form">
        <label className="form__row" htmlFor="title">
          <span className="label">
            Case title <span className="label__required">*</span>
          </span>
          <input
            className="input"
            id="title"
            name="title"
            value={form.title}
            onChange={handleChange}
            onBlur={handleBlur}
            maxLength={100}
            placeholder="Short summary of the issue"
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? 'title-error' : undefined}
            required
            disabled={status.loading}
          />
          {errors.title && (
            <span id="title-error" className="field-error" role="alert">
              {errors.title}
            </span>
          )}
        </label>
        <label className="form__row" htmlFor="description">
          <span className="label">
            Description <span className="label__required">*</span>
          </span>
          <textarea
            className="textarea"
            id="description"
            name="description"
            value={form.description}
            onChange={handleChange}
            onBlur={handleBlur}
            maxLength={1000}
            rows={4}
            placeholder="Describe what happened and any relevant details"
            aria-invalid={Boolean(errors.description)}
            aria-describedby={errors.description ? 'description-error' : undefined}
            required
            disabled={status.loading}
          />
          {errors.description && (
            <span
              id="description-error"
              className="field-error"
              role="alert"
            >
              {errors.description}
            </span>
          )}
        </label>
        {status.error && <p className="status">{status.error}</p>}
        <button type="submit" disabled={status.loading} className="button">
          {status.loading ? 'Submitting…' : 'Submit Case'}
        </button>
        {status.loading && (
          <span className="case-card__meta">Processing your request…</span>
        )}
      </form>
    </section>
  );
};

export default CaseForm;
