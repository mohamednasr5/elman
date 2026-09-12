const wrap = (title, intro, sections) => `<div class="container section" style="max-width:860px"><article class="form-section animate-fade-in"><h1 style="color:var(--primary);margin-bottom:var(--space-4)">${title}</h1><p style="margin-bottom:1rem;color:var(--text-secondary);line-height:1.8">${intro}</p>${sections.map(([h,p])=>`<h2 style="font-size:var(--font-size-lg);margin:1.5rem 0 .5rem">${h}</h2><p style="color:var(--text-secondary);line-height:1.8">${p}</p>`).join('')}</article></div>`;

export async function renderEnglishStaticPage(container, type) {
  if (type === 'privacy') {
    container.innerHTML = wrap('Privacy Policy', 'Welcome to Dalil El Manzala & El Matariya. We are committed to protecting the privacy of visitors, users, and local businesses using the directory.', [
      ['1. Information We Collect', 'Account information supplied through Google sign-in may include your name, email address, and profile image. Business owners may also provide public business information such as names, contact numbers, addresses, working hours, photos, offers, products, and services.'],
      ['2. How We Use Information', 'Information is used to operate the directory, display local listings, improve discovery, provide account features, process verification requests, and communicate with users when necessary. We do not sell personal information.'],
      ['3. Public Business Information', 'Business information submitted for publication is intended to be publicly discoverable. Do not submit private or sensitive information that should not appear on a public directory.'],
      ['4. Authentication & Security', 'Authentication is handled through Firebase Authentication. Passwords are not stored by the directory. We apply reasonable technical and operational safeguards, but no internet service can guarantee absolute security.'],
      ['5. Changes & Requests', 'You may contact the directory administration to report incorrect information, request changes, or raise privacy concerns.']
    ]);
    return;
  }
  if (type === 'terms') {
    container.innerHTML = wrap('Terms of Use', 'By using Dalil El Manzala & El Matariya, you agree to use the service lawfully and to respect the following terms.', [
      ['1. Accuracy of Information', 'Business owners and contributors are responsible for providing accurate information about businesses, services, prices, contact details, and opening hours.'],
      ['2. Listings & Verification', 'A listing appearing in the directory does not by itself constitute an official endorsement, partnership, certification, or guarantee by the directory administration. Verification is subject to review and may be refused or withdrawn when information is inaccurate or requirements are not met.'],
      ['3. Prohibited Content', 'Users may not publish unlawful, deceptive, defamatory, abusive, unsafe, or otherwise prohibited content, including misleading offers, products, images, or claims.'],
      ['4. Reviews & User Content', 'Reviews, ratings, photos, descriptions, and other contributions represent the contributor’s views and responsibility. The administration may moderate or remove content that violates these terms.'],
      ['5. Availability', 'Features, listings, and third-party services may change or become temporarily unavailable. The directory does not guarantee uninterrupted availability or permanent accuracy of every listing.']
    ]);
    return;
  }
  if (type === 'legal') {
    container.innerHTML = wrap('Legal Policy & Disclaimer', 'Dalil El Manzala & El Matariya is a local digital directory designed to help people discover businesses, services, places, and community information. Using or browsing the platform means that you have read and accepted the following principles.', [
      ['1. Responsibility for Published Content', 'Descriptions, ratings, reviews, photos, contact details, offers, and other user-submitted material are the responsibility of the person or entity that published them. The administration does not necessarily endorse or adopt those statements.'],
      ['2. Business Listings', 'The presence of a shop, company, restaurant, doctor, office, institution, service, or other place in the directory does not necessarily mean that the administration created, approved, recommended, contracted with, or guarantees that entity.'],
      ['3. Role of the Administration', 'The administration operates the platform, organizes directory content, reviews reports, and may take action against content that violates the law or the platform rules.'],
      ['4. Corrections and Removal', 'Users may report inaccurate, outdated, misleading, or inappropriate listings. The administration may review reports and modify, hide, or remove content when appropriate.'],
      ['5. External Services', 'The directory may link to external websites, maps, messaging services, payment providers, or social platforms. Their availability, policies, and content are controlled by their respective providers.'],
      ['6. Limitation of Liability', 'The directory is provided as a discovery and information service. Users should independently verify important business details, prices, availability, professional credentials, and emergency information before relying on them.']
    ]);
    return;
  }
  throw new Error(`Unknown English static page: ${type}`);
}
