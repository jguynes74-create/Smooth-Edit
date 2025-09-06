import { Link } from "wouter";

export default function Footer() {
  const footerSections = [
    {
      title: "Product",
      links: ["Features", "Pricing", "API", "Changelog"]
    },
    {
      title: "Support",
      links: ["Help Center", "Community", "Contact", "Status"]
    },
    {
      title: "Company",
      links: ["About", "Blog", "Careers", "Press"]
    },
    {
      title: "Legal",
      links: ["Privacy", "Terms", "Security", "Cookies"]
    }
  ];

  const socialLinks = [
    { icon: "fab fa-twitter", href: "#" },
    { icon: "fab fa-youtube", href: "#" },
    { icon: "fab fa-tiktok", href: "#" },
    { icon: "fab fa-instagram", href: "#" }
  ];

  return (
    <footer className="bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {footerSections.map((section, index) => (
            <div key={index}>
              <h3 className="text-sm font-semibold text-slate-900 tracking-wider uppercase mb-4">
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    {link === "Privacy" ? (
                      <Link href="/privacy" className="text-slate-600 hover:text-slate-900 transition-colors">
                        {link}
                      </Link>
                    ) : link === "Terms" ? (
                      <Link href="/terms" className="text-slate-600 hover:text-slate-900 transition-colors">
                        {link}
                      </Link>
                    ) : (
                      <a href="#" className="text-slate-600 hover:text-slate-900 transition-colors">
                        {link}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <div className="mt-8 pt-8 border-t border-slate-200 flex items-center justify-between">
          <p className="text-slate-600">&copy; 2024 SmoothEDIT. All rights reserved.</p>
          <div className="flex space-x-6">
            {socialLinks.map((social, index) => (
              <a 
                key={index} 
                href={social.href} 
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <i className={`${social.icon} text-xl`}></i>
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
