import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function Terms() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-8" data-testid="terms-title">
            Terms and Conditions
          </h1>
          
          <p className="text-slate-600 mb-8" data-testid="terms-last-updated">
            <strong>Last Updated:</strong> September 5, 2025
          </p>

          <div className="prose prose-slate max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4" data-testid="section-agreement">
                1. Agreement to Terms
              </h2>
              <p className="text-slate-700 mb-4">
                These Terms and Conditions ("Terms") govern your use of SmoothEDIT's AI-powered video processing 
                platform and related services (the "Service") operated by SmoothEDIT ("we," "us," or "our").
              </p>
              <p className="text-slate-700">
                By accessing or using our Service, you agree to be bound by these Terms. If you disagree with 
                any part of these terms, then you may not access the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4" data-testid="section-intellectual-property">
                2. Intellectual Property and Asset Protection
              </h2>
              
              <h3 className="text-lg font-medium text-slate-800 mb-3">2.1 Your Content Ownership</h3>
              <p className="text-slate-700 mb-4">
                <strong>You retain full ownership</strong> of all video content, audio files, images, and other materials 
                ("Your Content") that you upload to our Service. SmoothEDIT does not claim ownership of Your Content.
              </p>
              
              <h3 className="text-lg font-medium text-slate-800 mb-3">2.2 Limited License Grant</h3>
              <p className="text-slate-700 mb-4">
                By uploading Your Content, you grant SmoothEDIT a limited, non-exclusive, revocable license to:
              </p>
              <ul className="list-disc list-inside text-slate-700 mb-4 space-y-1">
                <li>Process, analyze, and enhance your videos using AI technology</li>
                <li>Store your content securely on our cloud infrastructure</li>
                <li>Generate captions, fix audio sync, repair dropped frames, and correct stuttered cuts</li>
                <li>Provide technical support and troubleshooting services</li>
              </ul>
              <p className="text-slate-700 mb-4">
                <strong>This license terminates immediately upon deletion of Your Content or termination of your account.</strong>
              </p>

              <h3 className="text-lg font-medium text-slate-800 mb-3">2.3 Content Protection Guarantees</h3>
              <ul className="list-disc list-inside text-slate-700 mb-4 space-y-2">
                <li><strong>No Redistribution:</strong> We will never sell, distribute, or share Your Content with third parties without explicit consent</li>
                <li><strong>No Training Data:</strong> Your Content will not be used to train AI models or improve algorithms for other users</li>
                <li><strong>Secure Processing:</strong> All video processing occurs in isolated, encrypted environments</li>
                <li><strong>Right to Delete:</strong> You can permanently delete Your Content at any time</li>
                <li><strong>Export Rights:</strong> You maintain the right to export and download your processed videos</li>
              </ul>

              <h3 className="text-lg font-medium text-slate-800 mb-3">2.4 SmoothEDIT's Intellectual Property</h3>
              <p className="text-slate-700 mb-4">
                The Service, including its AI algorithms, software, user interface, design, and underlying technology, 
                are owned by SmoothEDIT and protected by intellectual property laws. You may not:
              </p>
              <ul className="list-disc list-inside text-slate-700 space-y-1">
                <li>Reverse engineer, decompile, or attempt to extract our algorithms</li>
                <li>Use our technology to create competing services</li>
                <li>Reproduce or distribute our software or interface elements</li>
                <li>Remove or alter any proprietary notices or branding</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4" data-testid="section-acceptable-use">
                3. Acceptable Use Policy
              </h2>
              
              <h3 className="text-lg font-medium text-slate-800 mb-3">3.1 Permitted Uses</h3>
              <p className="text-slate-700 mb-4">
                You may use SmoothEDIT to process legitimate video content for:
              </p>
              <ul className="list-disc list-inside text-slate-700 mb-4 space-y-1">
                <li>Social media content creation (TikTok, Instagram Reels, YouTube Shorts)</li>
                <li>Educational and training videos</li>
                <li>Business and marketing content</li>
                <li>Personal video projects and memories</li>
                <li>Creative and artistic video productions</li>
              </ul>

              <h3 className="text-lg font-medium text-slate-800 mb-3">3.2 Prohibited Uses</h3>
              <p className="text-slate-700 mb-4">
                You agree not to upload or process content that:
              </p>
              <ul className="list-disc list-inside text-slate-700 mb-4 space-y-1">
                <li>Contains copyrighted material you don't own or have permission to use</li>
                <li>Includes illegal, harmful, or offensive content</li>
                <li>Violates privacy rights of individuals without consent</li>
                <li>Contains malicious software or code</li>
                <li>Infringes on trademark, patent, or other intellectual property rights</li>
                <li>Is intended for spam, fraud, or deceptive practices</li>
              </ul>

              <h3 className="text-lg font-medium text-slate-800 mb-3">3.3 Content Responsibility</h3>
              <p className="text-slate-700">
                You are solely responsible for ensuring you have all necessary rights and permissions 
                for any content you upload. You warrant that your use of the Service does not violate 
                any applicable laws or third-party rights.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4" data-testid="section-service-availability">
                4. Service Availability and Performance
              </h2>
              
              <h3 className="text-lg font-medium text-slate-800 mb-3">4.1 Service Uptime</h3>
              <p className="text-slate-700 mb-4">
                We strive to maintain 99.9% uptime for our Service, but cannot guarantee uninterrupted availability. 
                Maintenance windows and updates may temporarily affect service access.
              </p>

              <h3 className="text-lg font-medium text-slate-800 mb-3">4.2 Processing Quality</h3>
              <p className="text-slate-700 mb-4">
                While our AI technology is designed to improve video quality, results may vary depending on:
              </p>
              <ul className="list-disc list-inside text-slate-700 mb-4 space-y-1">
                <li>Original video quality and format</li>
                <li>Type and severity of video issues</li>
                <li>Video length and complexity</li>
                <li>System load and processing queue</li>
              </ul>

              <h3 className="text-lg font-medium text-slate-800 mb-3">4.3 File Size and Format Limitations</h3>
              <ul className="list-disc list-inside text-slate-700 space-y-1">
                <li><strong>Maximum file size:</strong> 2GB per upload</li>
                <li><strong>Supported formats:</strong> MP4, MOV, AVI, MKV, WebM</li>
                <li><strong>Processing time:</strong> Varies from minutes to hours depending on video complexity</li>
                <li><strong>Storage duration:</strong> Processed videos stored for account lifetime + 30 days</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4" data-testid="section-payment-terms">
                5. Payment Terms and Refunds
              </h2>
              
              <h3 className="text-lg font-medium text-slate-800 mb-3">5.1 Subscription Plans</h3>
              <p className="text-slate-700 mb-4">
                SmoothEDIT offers various subscription tiers with different processing limits and features. 
                All payments are processed securely through Stripe and other certified payment processors.
              </p>

              <h3 className="text-lg font-medium text-slate-800 mb-3">5.2 Billing and Renewal</h3>
              <ul className="list-disc list-inside text-slate-700 mb-4 space-y-1">
                <li>Subscriptions automatically renew unless cancelled</li>
                <li>You can cancel your subscription at any time</li>
                <li>Cancellation takes effect at the end of your current billing period</li>
                <li>No refunds for partial months or unused processing credits</li>
              </ul>

              <h3 className="text-lg font-medium text-slate-800 mb-3">5.3 Refund Policy</h3>
              <p className="text-slate-700 mb-4">
                We offer refunds in the following circumstances:
              </p>
              <ul className="list-disc list-inside text-slate-700 space-y-1">
                <li>Service failure that prevents video processing for more than 48 hours</li>
                <li>Technical issues that result in corrupted or unusable processed videos</li>
                <li>Accidental duplicate charges</li>
                <li>Refund requests must be made within 30 days of payment</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4" data-testid="section-liability-disclaimers">
                6. Liability Limitations and Disclaimers
              </h2>
              
              <h3 className="text-lg font-medium text-slate-800 mb-3">6.1 Service Disclaimers</h3>
              <p className="text-slate-700 mb-4">
                THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DISCLAIM ALL WARRANTIES, 
                EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, 
                AND NON-INFRINGEMENT.
              </p>

              <h3 className="text-lg font-medium text-slate-800 mb-3">6.2 Limitation of Liability</h3>
              <p className="text-slate-700 mb-4">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, SMOOTHEDIT'S TOTAL LIABILITY SHALL NOT EXCEED 
                THE AMOUNT YOU PAID FOR THE SERVICE IN THE 12 MONTHS PRECEDING THE CLAIM.
              </p>
              <p className="text-slate-700 mb-4">
                WE ARE NOT LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, 
                INCLUDING LOSS OF PROFITS, DATA, OR BUSINESS OPPORTUNITIES.
              </p>

              <h3 className="text-lg font-medium text-slate-800 mb-3">6.3 Data Backup Responsibility</h3>
              <p className="text-slate-700">
                While we implement robust backup systems, you are responsible for maintaining copies of 
                your original video files. We recommend keeping local backups of important content.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4" data-testid="section-account-termination">
                7. Account Termination
              </h2>
              
              <h3 className="text-lg font-medium text-slate-800 mb-3">7.1 Voluntary Termination</h3>
              <p className="text-slate-700 mb-4">
                You may terminate your account at any time by contacting support or using the account 
                deletion feature. Upon termination:
              </p>
              <ul className="list-disc list-inside text-slate-700 mb-4 space-y-1">
                <li>Your content will be permanently deleted after 30 days</li>
                <li>Subscription benefits end at the current billing period</li>
                <li>Processing jobs in progress may be completed</li>
                <li>Account data becomes inaccessible immediately</li>
              </ul>

              <h3 className="text-lg font-medium text-slate-800 mb-3">7.2 Termination for Violation</h3>
              <p className="text-slate-700 mb-4">
                We reserve the right to terminate accounts that violate these Terms, including:
              </p>
              <ul className="list-disc list-inside text-slate-700 space-y-1">
                <li>Uploading prohibited content</li>
                <li>Attempting to breach system security</li>
                <li>Violating intellectual property rights</li>
                <li>Engaging in fraudulent activities</li>
              </ul>

              <h3 className="text-lg font-medium text-slate-800 mb-3">7.3 Data Export Rights</h3>
              <p className="text-slate-700">
                Before account termination, you have 30 days to export your processed videos and account data. 
                After this period, all data is permanently deleted and cannot be recovered.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4" data-testid="section-dispute-resolution">
                8. Dispute Resolution
              </h2>
              
              <h3 className="text-lg font-medium text-slate-800 mb-3">8.1 Informal Resolution</h3>
              <p className="text-slate-700 mb-4">
                Before pursuing formal legal action, we encourage users to contact us at jason@smooth-edit.com 
                to resolve disputes informally. We commit to responding within 48 hours and working toward 
                a fair resolution.
              </p>

              <h3 className="text-lg font-medium text-slate-800 mb-3">8.2 Binding Arbitration</h3>
              <p className="text-slate-700 mb-4">
                For disputes that cannot be resolved informally, both parties agree to binding arbitration 
                rather than court proceedings. Arbitration will be conducted by a neutral third party under 
                the rules of the American Arbitration Association.
              </p>

              <h3 className="text-lg font-medium text-slate-800 mb-3">8.3 Class Action Waiver</h3>
              <p className="text-slate-700">
                You agree to resolve disputes individually and waive the right to participate in class 
                action lawsuits or collective proceedings against SmoothEDIT.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4" data-testid="section-governing-law">
                9. Governing Law and Jurisdiction
              </h2>
              <p className="text-slate-700 mb-4">
                These Terms are governed by the laws of the United States and the state where SmoothEDIT 
                is incorporated, without regard to conflict of law principles.
              </p>
              <p className="text-slate-700">
                For international users, local consumer protection laws may provide additional rights 
                that cannot be waived by these Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4" data-testid="section-changes-to-terms">
                10. Changes to Terms
              </h2>
              <p className="text-slate-700 mb-4">
                We may modify these Terms at any time. Material changes will be communicated through:
              </p>
              <ul className="list-disc list-inside text-slate-700 mb-4 space-y-1">
                <li>Email notification to all registered users</li>
                <li>Prominent notice on our website and service interface</li>
                <li>30-day advance notice for significant changes affecting user rights</li>
              </ul>
              <p className="text-slate-700">
                Continued use of the Service after changes constitutes acceptance of the updated Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4" data-testid="section-contact-information">
                11. Contact Information
              </h2>
              <p className="text-slate-700 mb-4">
                For questions about these Terms or legal concerns, please contact us:
              </p>
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-slate-700 mb-2"><strong>Legal Inquiries:</strong> jason@smooth-edit.com</p>
                <p className="text-slate-700 mb-2"><strong>General Support:</strong> jason@smooth-edit.com</p>
                <p className="text-slate-700 mb-2"><strong>DMCA Claims:</strong> dmca@smooth-edit.com</p>
                <p className="text-slate-700"><strong>Response Time:</strong> We respond to legal inquiries within 72 hours</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4" data-testid="section-severability">
                12. Severability and Entire Agreement
              </h2>
              <p className="text-slate-700 mb-4">
                If any provision of these Terms is found unenforceable, the remaining provisions will 
                continue in full force and effect. These Terms, together with our Privacy Policy, 
                constitute the entire agreement between you and SmoothEDIT.
              </p>
            </section>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-8">
              <h3 className="text-lg font-semibold text-green-900 mb-2">Asset Protection Summary</h3>
              <p className="text-green-800 mb-3">
                These Terms are specifically designed to protect your valuable video content and intellectual property:
              </p>
              <ul className="list-disc list-inside text-green-800 space-y-1">
                <li><strong>You maintain full ownership</strong> of all uploaded content</li>
                <li><strong>We never use your content</strong> for training or sharing with others</li>
                <li><strong>Secure processing</strong> in isolated, encrypted environments</li>
                <li><strong>Right to delete</strong> and export your content at any time</li>
                <li><strong>Clear liability limits</strong> and dispute resolution procedures</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}