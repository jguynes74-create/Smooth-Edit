import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-8" data-testid="privacy-title">
            Privacy Policy
          </h1>
          
          <p className="text-slate-600 mb-8" data-testid="privacy-last-updated">
            <strong>Last Updated:</strong> September 5, 2025
          </p>

          <div className="prose prose-slate max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4" data-testid="section-overview">
                1. Overview
              </h2>
              <p className="text-slate-700 mb-4">
                SmoothEDIT ("we," "our," or "us") respects your privacy and is committed to protecting your personal data. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use 
                our AI-powered video processing platform and related services (the "Service").
              </p>
              <p className="text-slate-700">
                By using our Service, you agree to the collection and use of information in accordance with this policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4" data-testid="section-information-collected">
                2. Information We Collect
              </h2>
              
              <h3 className="text-lg font-medium text-slate-800 mb-3">2.1 Personal Information</h3>
              <ul className="list-disc list-inside text-slate-700 mb-4 space-y-1">
                <li>Email address and password for account creation</li>
                <li>Profile information you provide</li>
                <li>Payment information (processed by third-party payment processors)</li>
                <li>Communication history with our support team</li>
              </ul>

              <h3 className="text-lg font-medium text-slate-800 mb-3">2.2 Video Content and Metadata</h3>
              <ul className="list-disc list-inside text-slate-700 mb-4 space-y-1">
                <li>Video files you upload for processing</li>
                <li>Audio tracks and visual content within videos</li>
                <li>Video metadata (duration, format, resolution, etc.)</li>
                <li>Processing preferences and settings</li>
                <li>AI-generated analysis results and captions</li>
              </ul>

              <h3 className="text-lg font-medium text-slate-800 mb-3">2.3 Technical Information</h3>
              <ul className="list-disc list-inside text-slate-700 mb-4 space-y-1">
                <li>IP address and device information</li>
                <li>Browser type and version</li>
                <li>Operating system and device specifications</li>
                <li>Usage patterns and feature interactions</li>
                <li>Error logs and performance metrics</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4" data-testid="section-how-we-use">
                3. How We Use Your Information
              </h2>
              <ul className="list-disc list-inside text-slate-700 space-y-2">
                <li><strong>Service Delivery:</strong> Process your videos using AI to detect and fix issues like stuttered cuts, audio sync problems, and dropped frames</li>
                <li><strong>AI Analysis:</strong> Analyze video content to identify issues and generate intelligent captions</li>
                <li><strong>Account Management:</strong> Create and maintain your user account, authenticate access</li>
                <li><strong>Customer Support:</strong> Respond to your inquiries and provide technical assistance</li>
                <li><strong>Service Improvement:</strong> Analyze usage patterns to enhance our AI algorithms and user experience</li>
                <li><strong>Security:</strong> Detect and prevent fraudulent activities and security threats</li>
                <li><strong>Legal Compliance:</strong> Comply with applicable laws and regulations</li>
                <li><strong>Communications:</strong> Send service-related notifications and updates</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4" data-testid="section-third-party">
                4. Third-Party Services and Data Sharing
              </h2>
              
              <h3 className="text-lg font-medium text-slate-800 mb-3">4.1 AI Processing Partners</h3>
              <p className="text-slate-700 mb-4">
                We use OpenAI's GPT-4o model for video analysis and caption generation. Video metadata and analysis 
                results may be processed by OpenAI in accordance with their privacy policy and data usage agreements.
              </p>

              <h3 className="text-lg font-medium text-slate-800 mb-3">4.2 Cloud Storage</h3>
              <p className="text-slate-700 mb-4">
                Your video files are stored using Google Cloud Storage with enterprise-grade security and access controls. 
                Files are encrypted in transit and at rest.
              </p>

              <h3 className="text-lg font-medium text-slate-800 mb-3">4.3 Email Services</h3>
              <p className="text-slate-700 mb-4">
                We use SendGrid for account verification emails and service notifications. Your email address 
                is processed in accordance with SendGrid's privacy policy.
              </p>

              <h3 className="text-lg font-medium text-slate-800 mb-3">4.4 Payment Processing</h3>
              <p className="text-slate-700 mb-4">
                Payment information is processed by Stripe and other payment processors. We do not store complete 
                payment card information on our servers.
              </p>

              <h3 className="text-lg font-medium text-slate-800 mb-3">4.5 When We May Share Data</h3>
              <ul className="list-disc list-inside text-slate-700 space-y-1">
                <li>With your explicit consent</li>
                <li>To comply with legal obligations or court orders</li>
                <li>To protect our rights, property, or safety</li>
                <li>In connection with a business transfer or merger</li>
                <li>With service providers under strict confidentiality agreements</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4" data-testid="section-data-retention">
                5. Data Retention and Storage
              </h2>
              <ul className="list-disc list-inside text-slate-700 space-y-2">
                <li><strong>Video Files:</strong> Stored for the duration of your account plus 30 days, or until you delete them</li>
                <li><strong>Account Information:</strong> Retained while your account is active and for 2 years after closure for legal and business purposes</li>
                <li><strong>Processing Logs:</strong> Kept for 90 days for technical support and service improvement</li>
                <li><strong>AI Analysis Results:</strong> Stored with your videos and subject to the same retention period</li>
                <li><strong>Usage Analytics:</strong> Aggregated and anonymized data may be retained indefinitely for service improvement</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4" data-testid="section-security">
                6. Data Security
              </h2>
              <p className="text-slate-700 mb-4">
                We implement industry-standard security measures to protect your data:
              </p>
              <ul className="list-disc list-inside text-slate-700 space-y-1">
                <li>End-to-end encryption for data in transit</li>
                <li>AES-256 encryption for data at rest</li>
                <li>Multi-factor authentication options</li>
                <li>Regular security audits and vulnerability assessments</li>
                <li>Access controls and employee training</li>
                <li>Secure coding practices and regular updates</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4" data-testid="section-your-rights">
                7. Your Rights and Choices
              </h2>
              <p className="text-slate-700 mb-4">You have the following rights regarding your personal data:</p>
              <ul className="list-disc list-inside text-slate-700 space-y-2">
                <li><strong>Access:</strong> Request copies of your personal data</li>
                <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data</li>
                <li><strong>Deletion:</strong> Request deletion of your personal data (subject to legal retention requirements)</li>
                <li><strong>Portability:</strong> Request transfer of your data to another service</li>
                <li><strong>Restriction:</strong> Request limitation of processing under certain circumstances</li>
                <li><strong>Objection:</strong> Object to processing based on legitimate interests</li>
                <li><strong>Withdraw Consent:</strong> Withdraw consent for processing (where consent is the legal basis)</li>
              </ul>
              <p className="text-slate-700 mt-4">
                To exercise these rights, contact us at privacy@smooth-edit.com with your request and proof of identity.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4" data-testid="section-cookies">
                8. Cookies and Tracking
              </h2>
              <p className="text-slate-700 mb-4">
                We use cookies and similar technologies to:
              </p>
              <ul className="list-disc list-inside text-slate-700 space-y-1">
                <li>Maintain your login session</li>
                <li>Remember your preferences and settings</li>
                <li>Analyze usage patterns and improve our service</li>
                <li>Ensure security and prevent fraud</li>
              </ul>
              <p className="text-slate-700 mt-4">
                You can control cookie settings through your browser preferences. Disabling certain cookies may limit functionality.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4" data-testid="section-international">
                9. International Data Transfers
              </h2>
              <p className="text-slate-700 mb-4">
                Your data may be transferred to and processed in countries other than your country of residence. 
                We ensure appropriate safeguards are in place, including:
              </p>
              <ul className="list-disc list-inside text-slate-700 space-y-1">
                <li>Standard contractual clauses approved by relevant authorities</li>
                <li>Adequacy decisions where applicable</li>
                <li>Certification schemes and codes of conduct</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4" data-testid="section-children">
                10. Children's Privacy
              </h2>
              <p className="text-slate-700">
                Our Service is not directed to children under 13 years of age. We do not knowingly collect personal 
                information from children under 13. If you become aware that a child has provided us with personal 
                information, please contact us immediately, and we will take steps to remove such information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4" data-testid="section-changes">
                11. Changes to This Policy
              </h2>
              <p className="text-slate-700 mb-4">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by:
              </p>
              <ul className="list-disc list-inside text-slate-700 space-y-1">
                <li>Posting the updated policy on our website</li>
                <li>Sending an email notification to registered users</li>
                <li>Displaying a prominent notice on our service</li>
              </ul>
              <p className="text-slate-700 mt-4">
                Your continued use of the Service after such changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4" data-testid="section-contact">
                12. Contact Information
              </h2>
              <p className="text-slate-700 mb-4">
                If you have questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-slate-700 mb-2"><strong>Email:</strong> privacy@smooth-edit.com</p>
                <p className="text-slate-700 mb-2"><strong>General Support:</strong> jason@smooth-edit.com</p>
                <p className="text-slate-700"><strong>Response Time:</strong> We aim to respond to privacy inquiries within 72 hours</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4" data-testid="section-legal-basis">
                13. Legal Basis for Processing (GDPR)
              </h2>
              <p className="text-slate-700 mb-4">
                For users in the European Economic Area, our legal basis for processing includes:
              </p>
              <ul className="list-disc list-inside text-slate-700 space-y-1">
                <li><strong>Contract Performance:</strong> Processing necessary to provide our services</li>
                <li><strong>Legitimate Interests:</strong> Improving our service, security, and fraud prevention</li>
                <li><strong>Consent:</strong> Where you have given explicit consent</li>
                <li><strong>Legal Obligation:</strong> Compliance with applicable laws</li>
              </ul>
            </section>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Summary</h3>
              <p className="text-blue-800">
                This Privacy Policy is designed to protect both your privacy rights and SmoothEDIT's business interests. 
                We are committed to transparent data practices, robust security measures, and compliance with applicable 
                privacy laws including GDPR, CCPA, and other regional regulations.
              </p>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}