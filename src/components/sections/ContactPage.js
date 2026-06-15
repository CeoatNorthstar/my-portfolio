import Contact from './Contact';

// Standalone /contact route — reuses the Contact section with top spacing
// so it clears the fixed navbar.
const ContactPage = () => (
  <div className="pt-20 min-h-screen">
    <Contact />
  </div>
);

export default ContactPage;
