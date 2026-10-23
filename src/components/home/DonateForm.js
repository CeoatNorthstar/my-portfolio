import { useEffect } from 'react';

const SCRIPT_SRC = 'https://donorbox.org/widgets.js';
const CAMPAIGN = 'get-me-some-coffee-to-write-more-papers';

// Donorbox registers <dbox-widget> once; later mounts reuse the definition.
const loadDonorbox = () => {
  if (document.querySelector(`script[src="${SCRIPT_SRC}"]`)) return;
  const s = document.createElement('script');
  s.type = 'module';
  s.async = true;
  s.src = SCRIPT_SRC;
  document.head.appendChild(s);
};

const DonateForm = () => {
  useEffect(loadDonorbox, []);

  return (
    <div className="pt-2 pb-6">
      <p className="text-[14.5px] leading-[1.65] text-ink max-w-[52ch]">
        Independent research runs on curiosity, time and a lot of coffee. If something here was useful to you, a
        coffee helps me write the next paper.
      </p>
      <div className="mt-6 flex justify-center">
        <dbox-widget campaign={CAMPAIGN} type="donation_form" enable-auto-scroll="true" />
      </div>
    </div>
  );
};

export default DonateForm;
