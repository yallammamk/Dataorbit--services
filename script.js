document.documentElement.classList.add('js-enabled');

const menuToggle = document.querySelector('.menu-toggle');
const primaryNav = document.querySelector('#primary-nav');

if (menuToggle && primaryNav) {
  const closeMenu = () => {
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open navigation');
    primaryNav.classList.remove('is-open');
  };

  menuToggle.addEventListener('click', () => {
    const willOpen = menuToggle.getAttribute('aria-expanded') !== 'true';
    menuToggle.setAttribute('aria-expanded', String(willOpen));
    menuToggle.setAttribute('aria-label', willOpen ? 'Close navigation' : 'Open navigation');
    primaryNav.classList.toggle('is-open', willOpen);
  });

  primaryNav.addEventListener('click', (event) => {
    if (event.target.closest('a')) closeMenu();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && primaryNav.classList.contains('is-open')) {
      closeMenu();
      menuToggle.focus();
    }
  });
}

const revealItems = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('is-visible'));
}

const requestForm = document.querySelector('#database-form');
const statusMessage = document.querySelector('#form-status');
const industrySelect = document.querySelector('#industry-interest');
const countrySelect = document.querySelector('#target-country');
const otherCountryWrap = document.querySelector('#other-country-wrap');
const otherCountryInput = document.querySelector('#other-country');
const fieldChecks = [...document.querySelectorAll('input[name="informationFields"]')];
const fieldError = document.querySelector('#field-error');

const industryButtons = document.querySelectorAll('[data-industry]');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
industryButtons.forEach((button) => {
  button.addEventListener('click', () => {
    if (industrySelect) {
      const requestedIndustry = button.dataset.industry;
      const matchingOption = [...industrySelect.options].find((option) => option.value === requestedIndustry || option.text === requestedIndustry);
      if (matchingOption) industrySelect.value = matchingOption.value;
    }
    document.querySelector('#request-form')?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
    window.setTimeout(() => document.querySelector('#full-name')?.focus({ preventScroll: true }), 350);
  });
});

if (countrySelect && otherCountryWrap && otherCountryInput) {
  const updateOtherCountry = () => {
    const needsOtherCountry = countrySelect.value === 'Other';
    otherCountryWrap.hidden = !needsOtherCountry;
    otherCountryInput.required = needsOtherCountry;
    if (!needsOtherCountry) otherCountryInput.value = '';
  };
  countrySelect.addEventListener('change', updateOtherCountry);
  updateOtherCountry();
}

const updateFieldSelection = () => {
  const hasField = fieldChecks.some((checkbox) => checkbox.checked);
  if (fieldChecks[0]) fieldChecks[0].setCustomValidity(hasField ? '' : 'Select at least one information field.');
  if (fieldError) fieldError.textContent = '';
  return hasField;
};

fieldChecks.forEach((checkbox) => checkbox.addEventListener('change', () => {
  updateFieldSelection();
  if (fieldError) fieldError.textContent = '';
}));

if (requestForm && statusMessage) {
  requestForm.addEventListener('input', (event) => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement || event.target instanceof HTMLTextAreaElement) {
      event.target.setCustomValidity('');
      if (statusMessage) statusMessage.hidden = true;
    }
  });

  requestForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    statusMessage.hidden = true;

    if (!updateFieldSelection()) {
      if (fieldError) fieldError.textContent = 'Please select at least one information field.';
      fieldChecks[0]?.reportValidity();
      return;
    }

    const requiredFields = [...requestForm.querySelectorAll('input[required], select[required], textarea[required]')];
    requiredFields.forEach((field) => {
      field.setCustomValidity('');
      if (field.validity.valueMissing) field.setCustomValidity('Please complete this required field.');
      else if (field instanceof HTMLInputElement && field.type === 'email' && field.validity.typeMismatch) field.setCustomValidity('Enter a valid business email address.');
      else if (field instanceof HTMLInputElement && field.type === 'number' && field.validity.rangeUnderflow) field.setCustomValidity('Enter at least one record.');
    });

    if (!requestForm.reportValidity()) return;

    const formData = new FormData(requestForm);
    const payload = Object.fromEntries(formData.entries());
    payload.informationFields = formData.getAll('informationFields');
    const endpoint = (requestForm.dataset.endpoint || '').trim();

    if (!endpoint) {
      statusMessage.dataset.state = 'notice';
      statusMessage.textContent = 'Your request passed local validation, but this website is not connected to a submission service. Nothing was sent or stored.';
      statusMessage.hidden = false;
      return;
    }

    let endpointUrl;
    try {
      endpointUrl = new URL(endpoint, window.location.href);
    } catch {
      endpointUrl = null;
    }

    const isSecureEndpoint = endpointUrl?.protocol === 'https:';
    const isLocalDevelopmentEndpoint = endpointUrl?.origin === window.location.origin
      && window.location.protocol === 'http:'
      && ['localhost', '127.0.0.1', '[::1]'].includes(endpointUrl?.hostname || '');
    const hasEndpointCredentials = !!endpointUrl && (!!endpointUrl.username || !!endpointUrl.password);
    if ((!isSecureEndpoint && !isLocalDevelopmentEndpoint) || hasEndpointCredentials) {
      statusMessage.dataset.state = 'error';
      statusMessage.textContent = 'The configured form service must use HTTPS. Nothing was sent. Contact the site owner if this notice continues.';
      statusMessage.hidden = false;
      return;
    }

    const submitButton = requestForm.querySelector('button[type="submit"], input[type="submit"]');
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.setAttribute('aria-busy', 'true');
    }
    try {
      const response = await fetch(endpointUrl.href, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error('Request was not accepted.');
      statusMessage.dataset.state = 'success';
      statusMessage.textContent = 'Your request was accepted by the configured submission service.';
      requestForm.reset();
      updateOtherCountry();
      updateFieldSelection();
    } catch {
      statusMessage.dataset.state = 'error';
      statusMessage.textContent = 'We could not confirm delivery. Please try again or contact the business directly.';
    } finally {
      statusMessage.hidden = false;
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.removeAttribute('aria-busy');
      }
    }
  });

  const submitButton = requestForm.querySelector('button[type="submit"], input[type="submit"]');
  if (submitButton) submitButton.disabled = false;
}

const currentYear = document.querySelector('#current-year');
if (currentYear) currentYear.textContent = String(new Date().getFullYear());
document.querySelectorAll('[data-current-year]').forEach((year) => {
  year.textContent = String(new Date().getFullYear());
});