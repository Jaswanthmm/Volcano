import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Lock, Cpu, Database, UserCheck, FileText, Globe } from 'lucide-react';

const PrivacyPolicy = () => {
    return (
        <div className="min-h-screen bg-black text-gray-300 font-sans selection:bg-red-900 selection:text-white">

            {/* Top Navigation Bar */}
            <nav className="fixed top-0 w-full z-50 bg-black/90 backdrop-blur border-b border-white/10">
                <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 text-white hover:text-red-500 transition-colors">
                        <ArrowLeft size={16} />
                        <span className="text-xs font-bold uppercase tracking-widest font-mono">Return to Base</span>
                    </Link>
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                        </span>
                        <span className="text-sm font-bold tracking-tighter text-white font-mono">VOLCANO PRIVACY</span>
                    </div>
                </div>
            </nav>

            {/* Content Container */}
            <div className="pt-32 pb-24 px-6 max-w-4xl mx-auto">
                <div className="mb-12">
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">PRIVACY POLICY</h1>
                    <p className="text-gray-500 text-xs font-mono uppercase tracking-widest border-l-2 border-red-500 pl-4">
                        Effective Protocol Date: January 1, 2026 • Last Updated: October 2026
                    </p>
                </div>

                <div className="space-y-12 text-sm leading-relaxed">

                    {/* Section 1: Overview */}
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2 font-mono">
                            <ShieldCheck size={20} className="text-red-500" />
                            1. Scope & Objective
                        </h2>
                        <p className="mb-4 text-gray-400">
                            Volcano ("The Platform", "we", "our") is a corporate intelligence marketplace connecting outlier innovators ("Aliens") with enterprise decision-makers ("Boardrooms").
                            This Privacy Policy outlines how we collect, process, safeguard, and respect personal data and proprietary signals transmitted through our network.
                        </p>
                        <p className="text-gray-400">
                            We operate on a principle of least-privilege telemetry: we gather only the minimum data required to establish authenticated uplinks, verify enterprise ownership, and prevent malicious spam or duplicate submissions.
                        </p>
                    </section>

                    {/* Section 2: Data Collection */}
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2 font-mono">
                            <Database size={20} className="text-red-500" />
                            2. Information We Collect
                        </h2>
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                            <div>
                                <h3 className="font-bold text-white text-base mb-1">A. Alien Operatives</h3>
                                <p className="text-gray-400 text-xs leading-relaxed">
                                    When registering as an Alien, we collect your alias/name, contact email address, phone number (transmission commlink), and an encrypted cryptographic password hash. We assign a unique pseudo-anonymous Node Identifier (e.g., <code className="text-green-400 font-mono">ALIEN-XXXX</code>) to mask direct identity during initial signal routing.
                                </p>
                            </div>
                            <div className="border-t border-white/5 pt-4">
                                <h3 className="font-bold text-white text-base mb-1">B. Boardroom Executives & Titans</h3>
                                <p className="text-gray-400 text-xs leading-relaxed">
                                    When registering on behalf of an enterprise, we collect corporate entity name, verified company domain email, official website URL, representative phone number, and password hash. Public consumer email domains (e.g., Gmail, Yahoo) are prohibited for Boardroom registration.
                                </p>
                            </div>
                            <div className="border-t border-white/5 pt-4">
                                <h3 className="font-bold text-white text-base mb-1">C. Signals & Intelligence Transmissions</h3>
                                <p className="text-gray-400 text-xs leading-relaxed">
                                    Signal titles, descriptive content, category classifications, and interactive thread discussions exchanged within private Boardroom channels.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Section 3: AI Processing */}
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2 font-mono">
                            <Cpu size={20} className="text-red-500" />
                            3. AI Thinking Engine & Data Processing
                        </h2>
                        <p className="mb-4 text-gray-400">
                            All incoming signals undergo automated evaluation by the Volcano Thinking Engine to verify feasibility, novelty, and prevent spam. Processing occurs under strict contractual data boundaries:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-400 ml-2">
                            <li><strong className="text-white">Confidential AI Analysis:</strong> Submitted signals are processed securely using enterprise Google GenAI APIs with zero public training usage on your proprietary text.</li>
                            <li><strong className="text-white">Zero Public Exposure:</strong> Raw ideas are never published to public indexes or made searchable outside the intended recipient Boardroom.</li>
                            <li><strong className="text-white">Duplicate Detection:</strong> Anonymized semantic representations are cross-referenced strictly to prevent duplicate signal claims.</li>
                        </ul>
                    </section>

                    {/* Section 4: Security Architecture */}
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2 font-mono">
                            <Lock size={20} className="text-red-500" />
                            4. Security Safeguards & Infrastructure
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                                <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-2 font-mono">Cryptographic Passwords</h4>
                                <p className="text-gray-400 text-xs">Passwords are never stored in plaintext. We utilize adaptive scrypt key derivation hashing algorithms with unique salting.</p>
                            </div>
                            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                                <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-2 font-mono">Encrypted Transit & Storage</h4>
                                <p className="text-gray-400 text-xs">All API traffic is enforced via TLS 1.3 encryption. Backend database clusters utilize encrypted-at-rest PostgreSQL architectures on Supabase.</p>
                            </div>
                            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                                <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-2 font-mono">Ephemeral Cloud Architecture</h4>
                                <p className="text-gray-400 text-xs">Production microservices run on hardened Google Cloud Run container runtimes with non-root security enforcement and automated patching.</p>
                            </div>
                            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                                <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-2 font-mono">JWT Token Authentication</h4>
                                <p className="text-gray-400 text-xs">Role-based access tokens with strict expiration and refresh rotation prevent session hijacking and client credential spoofing.</p>
                            </div>
                        </div>
                    </section>

                    {/* Section 5: Confidentiality */}
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2 font-mono">
                            <FileText size={20} className="text-red-500" />
                            5. Confidentiality & Information Sharing
                        </h2>
                        <p className="mb-4 text-gray-400">
                            We do not sell, rent, or monetize your personal information or submitted intelligence to data brokers, advertising platforms, or external marketers.
                        </p>
                        <p className="text-gray-400">
                            Information is shared strictly between the Alien operative who crafted the signal and the authorized representatives of the recipient Boardroom upon signal qualification.
                        </p>
                    </section>

                    {/* Section 6: Data Retention & Rights */}
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2 font-mono">
                            <UserCheck size={20} className="text-red-500" />
                            6. Your Privacy Rights & Retention
                        </h2>
                        <p className="mb-4 text-gray-400">
                            You retain ownership rights over your personal profile data. You have the right to:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-400 ml-2 mb-4">
                            <li>Access and review all personal information linked to your Node Identifier or Corporate Entity.</li>
                            <li>Request complete termination and deletion of your account and unpurchased signals.</li>
                            <li>Withdraw from communication channels and notifications.</li>
                        </ul>
                    </section>

                    {/* Section 7: Inquiries */}
                    <section className="border-t border-white/10 pt-8 mt-12">
                        <div className="flex items-center gap-2 text-white font-mono text-base font-bold mb-2">
                            <Globe size={18} className="text-red-500" />
                            Security & Governance Contacts
                        </div>
                        <p className="text-gray-500 text-xs leading-relaxed">
                            For security advisories, vulnerability disclosures, or data privacy requests regarding Volcano Protocol, submit transmissions to <a href="mailto:privacy@volcano.io" className="text-red-400 underline hover:text-white transition-colors">privacy@volcano.io</a>.
                        </p>
                    </section>

                </div>
            </div>

            {/* Footer */}
            <footer className="border-t border-white/10 py-8 text-center text-xs font-mono text-gray-600">
                <p>&copy; 2026 VOLCANO PROTOCOL. ALL RIGHTS RESERVED.</p>
            </footer>

        </div>
    );
};

export default PrivacyPolicy;
