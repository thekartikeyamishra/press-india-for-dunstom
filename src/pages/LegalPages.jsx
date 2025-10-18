import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { FaShieldAlt, FaGavel, FaUserShield, FaExclamationTriangle } from 'react-icons/fa';

const LegalPages = () => {
  const { page } = useParams();

  const legalContent = {
    terms: {
      title: 'Terms of Service',
      icon: FaGavel,
      content: (
        <>
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              By accessing and using Press India, you accept and agree to be bound by the terms and provision of this agreement. 
              If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Use License</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Permission is granted to temporarily access the materials on Press India for personal, non-commercial transitory viewing only.
            </p>
            <ul className="list-disc ml-6 text-gray-700 space-y-2">
              <li>You must be 18 years or older to use this service</li>
              <li>You must provide accurate registration information</li>
              <li>You are responsible for maintaining account security</li>
              <li>You may not use the service for illegal purposes</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Content</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Users may submit articles and content to Press India. By submitting content, you grant Press India a non-exclusive, 
              royalty-free license to use, reproduce, and display your content.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              You retain full ownership of your content. You are responsible for ensuring your content:
            </p>
            <ul className="list-disc ml-6 text-gray-700 space-y-2">
              <li>Does not violate any laws or regulations</li>
              <li>Does not infringe on intellectual property rights</li>
              <li>Does not contain defamatory or harmful content</li>
              <li>Is accurate and properly sourced</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Prohibited Content</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              The following types of content are strictly prohibited:
            </p>
            <ul className="list-disc ml-6 text-gray-700 space-y-2">
              <li>Defamatory, obscene, or pornographic content</li>
              <li>Content promoting violence or hatred</li>
              <li>Content infringing on privacy or intellectual property</li>
              <li>False or misleading information</li>
              <li>Content related to illegal activities</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Disclaimer</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Press India is an intermediary platform under Section 79 of the IT Act, 2000. We are not liable for user-generated content. 
              We will remove unlawful content expeditiously upon receiving actual knowledge.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Termination</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We may terminate or suspend your account immediately, without prior notice or liability, for any reason, 
              including breach of these Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Governing Law</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              These Terms shall be governed by and construed in accordance with the laws of India, 
              without regard to its conflict of law provisions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Contact Information</h2>
            <p className="text-gray-700 leading-relaxed">
              For questions about these Terms, please contact us at: legal@pressindia.com
            </p>
          </section>
        </>
      )
    },
    privacy: {
      title: 'Privacy Policy',
      icon: FaUserShield,
      content: (
        <>
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Information We Collect</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We collect information that you provide directly to us, including:
            </p>
            <ul className="list-disc ml-6 text-gray-700 space-y-2">
              <li>Name, email address, and phone number</li>
              <li>Profile information and verification documents</li>
              <li>Content you create (articles, comments)</li>
              <li>Usage data and analytics</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. How We Use Your Information</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc ml-6 text-gray-700 space-y-2">
              <li>Provide, maintain, and improve our services</li>
              <li>Verify your identity and prevent fraud</li>
              <li>Send you technical notices and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Data Sharing</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We do not sell your personal information. We may share your information:
            </p>
            <ul className="list-disc ml-6 text-gray-700 space-y-2">
              <li>With your consent</li>
              <li>To comply with legal obligations</li>
              <li>To protect rights and safety</li>
              <li>With service providers who assist our operations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Data Security</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We implement appropriate security measures to protect your personal information. 
              However, no method of transmission over the Internet is 100% secure.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Your Rights</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              You have the right to:
            </p>
            <ul className="list-disc ml-6 text-gray-700 space-y-2">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to processing of your data</li>
              <li>Withdraw consent</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Cookies</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use cookies and similar tracking technologies to track activity on our service and store certain information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Changes to Privacy Policy</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Contact Us</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have questions about this Privacy Policy, contact us at: privacy@pressindia.com
            </p>
          </section>
        </>
      )
    },
    'content-policy': {
      title: 'Content Policy',
      icon: FaShieldAlt,
      content: (
        <>
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Content Standards</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              All content on Press India must adhere to the following standards:
            </p>
            <ul className="list-disc ml-6 text-gray-700 space-y-2">
              <li>Accuracy: Content must be factually accurate and properly sourced</li>
              <li>Legality: Content must comply with all applicable laws</li>
              <li>Respect: Content must be respectful and non-discriminatory</li>
              <li>Originality: Content must be original or properly attributed</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Prohibited Content</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              The following content is strictly prohibited under Indian law and our policies:
            </p>
            <ul className="list-disc ml-6 text-gray-700 space-y-2">
              <li>Defamatory or libelous content</li>
              <li>Obscene or pornographic material</li>
              <li>Hate speech or discriminatory content</li>
              <li>Content promoting violence or terrorism</li>
              <li>Content infringing intellectual property rights</li>
              <li>False or misleading information (fake news)</li>
              <li>Content violating privacy rights</li>
              <li>Spam or promotional content</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Source Requirements</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              All articles must include:
            </p>
            <ul className="list-disc ml-6 text-gray-700 space-y-2">
              <li>At least one credible source</li>
              <li>Proper citation and attribution</li>
              <li>Links to original sources when available</li>
              <li>Clear distinction between facts and opinions</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Moderation Process</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              All user-submitted content undergoes moderation:
            </p>
            <ul className="list-disc ml-6 text-gray-700 space-y-2">
              <li>Automated filtering for prohibited content</li>
              <li>Manual review by trained moderators</li>
              <li>Community reporting mechanism</li>
              <li>Expeditious removal of unlawful content</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. User Responsibilities</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              As a content creator, you are responsible for:
            </p>
            <ul className="list-disc ml-6 text-gray-700 space-y-2">
              <li>Verifying accuracy of information</li>
              <li>Obtaining necessary permissions</li>
              <li>Respecting intellectual property rights</li>
              <li>Complying with all applicable laws</li>
              <li>Updating or correcting errors promptly</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Enforcement</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Violations of this Content Policy may result in:
            </p>
            <ul className="list-disc ml-6 text-gray-700 space-y-2">
              <li>Content removal</li>
              <li>Account suspension or termination</li>
              <li>Loss of verification status</li>
              <li>Legal action if required</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Appeals</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If your content is removed, you may appeal the decision by contacting: appeals@pressindia.com
            </p>
          </section>
        </>
      )
    },
    'grievance-officer': {
      title: 'Grievance Redressal',
      icon: FaExclamationTriangle,
      content: (
        <>
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Grievance Officer Details</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-4">
              <p className="text-gray-700 mb-2"><strong>Name:</strong> Grievance Officer</p>
              <p className="text-gray-700 mb-2"><strong>Email:</strong> grievance@pressindia.com</p>
              <p className="text-gray-700 mb-2"><strong>Phone:</strong> +91-XXXXXXXXXX</p>
              <p className="text-gray-700 mb-2"><strong>Address:</strong> Press India, [Address], India</p>
              <p className="text-gray-700"><strong>Working Hours:</strong> Monday to Friday, 10:00 AM to 6:00 PM IST</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How to File a Grievance</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              You can file a grievance through the following methods:
            </p>
            <ul className="list-disc ml-6 text-gray-700 space-y-2">
              <li>Online form: Use our <a href="/grievances/report" className="text-blue-600 hover:underline">grievance submission form</a></li>
              <li>Email: Send details to grievance@pressindia.com</li>
              <li>Written complaint: Mail to our registered address</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Response Timeline</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              As per IT Rules, 2021:
            </p>
            <ul className="list-disc ml-6 text-gray-700 space-y-2">
              <li>Acknowledgment within 24 hours of receiving grievance</li>
              <li>Resolution within 15 days from the date of receipt</li>
              <li>Regular updates on the status of your grievance</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What to Include in Your Grievance</h2>
            <ul className="list-disc ml-6 text-gray-700 space-y-2">
              <li>Your contact information</li>
              <li>Detailed description of the issue</li>
              <li>Link to the content in question (if applicable)</li>
              <li>Supporting evidence or documentation</li>
              <li>Desired resolution</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Types of Grievances We Handle</h2>
            <ul className="list-disc ml-6 text-gray-700 space-y-2">
              <li>Fake news and misinformation</li>
              <li>Defamatory content</li>
              <li>Privacy violations</li>
              <li>Copyright infringement</li>
              <li>Hate speech</li>
              <li>Other policy violations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Rights</h2>
            <ul className="list-disc ml-6 text-gray-700 space-y-2">
              <li>Right to timely acknowledgment and resolution</li>
              <li>Right to be informed of the outcome</li>
              <li>Right to appeal the decision</li>
              <li>Right to escalate to appropriate authorities if unsatisfied</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Escalation</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you are not satisfied with the resolution, you may escalate to:
            </p>
            <ul className="list-disc ml-6 text-gray-700 space-y-2">
              <li>Press Council of India</li>
              <li>Ministry of Electronics and Information Technology</li>
              <li>Appropriate legal forums</li>
            </ul>
          </section>
        </>
      )
    }
  };

  const currentPage = legalContent[page];

  if (!currentPage) {
    return <Navigate to="/404" />;
  }

  const Icon = currentPage.icon;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-primary bg-opacity-10 rounded-full flex items-center justify-center">
              <Icon className="text-primary text-3xl" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{currentPage.title}</h1>
              <p className="text-gray-600">Last updated: January 1, 2025</p>
            </div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Important:</strong> Please read these terms carefully. By using Press India, you agree to comply with and be bound by these terms.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-md p-8">
          {currentPage.content}
        </div>

        {/* Footer Note */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <p className="text-sm text-blue-900">
            <strong>Questions?</strong> If you have any questions about these terms, please contact us at legal@pressindia.com
          </p>
        </div>
      </div>
    </div>
  );
};

export default LegalPages;